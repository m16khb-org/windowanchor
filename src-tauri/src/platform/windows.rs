use std::cell::RefCell;
use std::ffi::c_void;
use std::mem::size_of;
use std::sync::mpsc::{self, Sender};

use windows::Win32::Foundation::{
    CloseHandle, HANDLE, HINSTANCE, HWND, LPARAM, LRESULT, RECT, WPARAM,
};
use windows::Win32::Graphics::Dwm::{DWMWA_EXTENDED_FRAME_BOUNDS, DwmGetWindowAttribute};
use windows::Win32::Graphics::Gdi::{
    DISPLAY_DEVICE_ACTIVE, DISPLAY_DEVICEW, EnumDisplayDevicesW, EnumDisplayMonitors,
    GetMonitorInfoW, HDC, HMONITOR, MONITOR_DEFAULTTONEAREST, MONITOR_DEFAULTTONULL, MONITORINFO,
    MONITORINFOEXW, MonitorFromRect, MonitorFromWindow,
};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Power::{POWERBROADCAST_SETTING, RegisterPowerSettingNotification};
use windows::Win32::System::SystemServices::GUID_CONSOLE_DISPLAY_STATE;
use windows::Win32::System::Threading::{
    OpenProcess, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION, QueryFullProcessImageNameW,
};
use windows::Win32::UI::HiDpi::{GetDpiForMonitor, MDT_EFFECTIVE_DPI};
use windows::Win32::UI::WindowsAndMessaging::{
    CreateWindowExW, DEVICE_NOTIFY_WINDOW_HANDLE, DefWindowProcW, DispatchMessageW,
    EDD_GET_DEVICE_INTERFACE_NAME, EnumWindows, GUI_INMOVESIZE, GUITHREADINFO, GWL_EXSTYLE,
    GetClassNameW, GetGUIThreadInfo, GetMessageW, GetWindowLongW, GetWindowPlacement,
    GetWindowRect, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId, HWND_TOP,
    IsIconic, IsWindow, IsWindowVisible, IsZoomed, MONITORINFOF_PRIMARY, MSG,
    PBT_APMRESUMEAUTOMATIC, PBT_APMRESUMESUSPEND, PBT_APMSUSPEND, PBT_POWERSETTINGCHANGE,
    RegisterClassW, SPI_SETWORKAREA, SW_MAXIMIZE, SW_RESTORE, SW_SHOWMINIMIZED, SW_SHOWNORMAL,
    SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, SWP_SHOWWINDOW, SetWindowPlacement,
    SetWindowPos, ShowWindow, TranslateMessage, WINDOW_STYLE, WINDOWPLACEMENT, WM_DISPLAYCHANGE,
    WM_POWERBROADCAST, WM_SETTINGCHANGE, WNDCLASSW, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
};
use windows::core::{BOOL, PCWSTR, PWSTR, w};

use crate::automation::DisplayEvent;
use crate::model::{
    DisplayInfo, Rect, RestoreFailure, RestoreResult, RestoreTarget, WindowInfo, WindowState,
};

const WATCHER_CLASS: PCWSTR = w!("WindowAnchorDisplayWatcher");

const SKIPPED_CLASSES: &[&str] = &[
    "Progman",
    "WorkerW",
    "Shell_TrayWnd",
    "Shell_SecondaryTrayWnd",
    "Windows.UI.Core.CoreWindow",
];

struct EnumContext {
    windows: Vec<WindowInfo>,
    own_pid: u32,
}

pub fn list_windows() -> Result<Vec<WindowInfo>, String> {
    let mut context = EnumContext {
        windows: Vec::new(),
        own_pid: std::process::id(),
    };

    unsafe {
        EnumWindows(
            Some(enum_window),
            LPARAM(&mut context as *mut EnumContext as isize),
        )
        .map_err(|error| error.to_string())?;
    }

    Ok(context.windows)
}

pub fn list_displays() -> Result<Vec<DisplayInfo>, String> {
    let mut monitors: Vec<HMONITOR> = Vec::new();
    let listed = unsafe {
        EnumDisplayMonitors(
            None,
            None,
            Some(collect_monitor),
            LPARAM(&mut monitors as *mut Vec<HMONITOR> as isize),
        )
    };
    if !listed.as_bool() {
        return Err("EnumDisplayMonitors failed".to_string());
    }

    let mut displays: Vec<DisplayInfo> = monitors
        .into_iter()
        .filter_map(|monitor| unsafe { describe_monitor(monitor) })
        .collect();
    displays.sort_by_key(|display| (!display.primary, display.x, display.y));
    Ok(displays)
}

unsafe extern "system" fn collect_monitor(
    monitor: HMONITOR,
    _hdc: HDC,
    _rect: *mut RECT,
    lparam: LPARAM,
) -> BOOL {
    let monitors = unsafe { &mut *(lparam.0 as *mut Vec<HMONITOR>) };
    monitors.push(monitor);
    BOOL(1)
}

unsafe fn describe_monitor(monitor: HMONITOR) -> Option<DisplayInfo> {
    let mut info = MONITORINFOEXW::default();
    info.monitorInfo.cbSize = size_of::<MONITORINFOEXW>() as u32;
    let found = unsafe {
        GetMonitorInfoW(
            monitor,
            &mut info as *mut MONITORINFOEXW as *mut MONITORINFO,
        )
    };
    if !found.as_bool() {
        return None;
    }

    let adapter = wide_to_string(&info.szDevice);
    let bounds = info.monitorInfo.rcMonitor;
    let (mut dpi_x, mut dpi_y) = (96u32, 96u32);
    let scale_factor = if unsafe {
        GetDpiForMonitor(monitor, MDT_EFFECTIVE_DPI, &mut dpi_x, &mut dpi_y)
    }
    .is_ok()
    {
        f64::from(dpi_x) / 96.0
    } else {
        1.0
    };

    Some(DisplayInfo {
        device_id: unsafe { monitor_device_id(&adapter) },
        id: adapter.clone(),
        name: adapter,
        x: bounds.left,
        y: bounds.top,
        width: (bounds.right - bounds.left).max(0) as u32,
        height: (bounds.bottom - bounds.top).max(0) as u32,
        scale_factor,
        primary: info.monitorInfo.dwFlags & MONITORINFOF_PRIMARY != 0,
    })
}

/// The monitor attached to an adapter output, as a device interface path such as
/// `\\?\DISPLAY#DEL41A8#5&2b0f...#{e6f07b5f-...}`. It survives reboots and
/// adapter renumbering, which `\\.\DISPLAYn` does not.
unsafe fn monitor_device_id(adapter: &str) -> String {
    let adapter: Vec<u16> = adapter.encode_utf16().chain(std::iter::once(0)).collect();
    let mut first = String::new();

    for index in 0.. {
        let mut device = DISPLAY_DEVICEW {
            cb: size_of::<DISPLAY_DEVICEW>() as u32,
            ..Default::default()
        };
        let found = unsafe {
            EnumDisplayDevicesW(
                PCWSTR(adapter.as_ptr()),
                index,
                &mut device,
                EDD_GET_DEVICE_INTERFACE_NAME,
            )
        };
        if !found.as_bool() {
            break;
        }

        let id = wide_to_string(&device.DeviceID);
        if device.StateFlags.0 & DISPLAY_DEVICE_ACTIVE.0 != 0 {
            return id;
        }
        if first.is_empty() {
            first = id;
        }
    }

    first
}

fn wide_to_string(buffer: &[u16]) -> String {
    let end = buffer
        .iter()
        .position(|unit| *unit == 0)
        .unwrap_or(buffer.len());
    String::from_utf16_lossy(&buffer[..end])
}

unsafe extern "system" fn enum_window(hwnd: HWND, lparam: LPARAM) -> BOOL {
    let context = unsafe { &mut *(lparam.0 as *mut EnumContext) };

    if let Some(window) = unsafe { inspect_window(hwnd, context.own_pid) } {
        context.windows.push(window);
    }

    BOOL(1)
}

unsafe fn inspect_window(hwnd: HWND, own_pid: u32) -> Option<WindowInfo> {
    if !unsafe { IsWindowVisible(hwnd).as_bool() } {
        return None;
    }

    let mut pid = 0u32;
    unsafe {
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
    }
    if pid == 0 || pid == own_pid {
        return None;
    }

    let ex_style = unsafe { GetWindowLongW(hwnd, GWL_EXSTYLE) } as u32;
    if ex_style & (WS_EX_TOOLWINDOW.0 | WS_EX_NOACTIVATE.0) != 0 {
        return None;
    }

    let title = unsafe { read_window_text(hwnd) };
    if title.is_empty() {
        return None;
    }

    let class_name = unsafe { read_class_name(hwnd) };
    if SKIPPED_CLASSES.contains(&class_name.as_str()) {
        return None;
    }

    let process_path = unsafe { read_process_path(pid) };
    let process_name = std::path::Path::new(&process_path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or_default()
        .to_string();

    if process_name.eq_ignore_ascii_case("ApplicationFrameHost.exe") {
        return None;
    }

    let mut window_rect = RECT::default();
    if unsafe { GetWindowRect(hwnd, &mut window_rect) }.is_err() {
        return None;
    }

    let rect = Rect {
        x: window_rect.left,
        y: window_rect.top,
        width: window_rect.right - window_rect.left,
        height: window_rect.bottom - window_rect.top,
    };

    if rect.width <= 0 || rect.height <= 0 {
        return None;
    }

    let visual_rect = unsafe { read_visual_rect(hwnd) };
    let normal_rect = unsafe { read_normal_rect(hwnd) };
    let state = unsafe {
        if IsIconic(hwnd).as_bool() {
            WindowState::Minimized
        } else if IsZoomed(hwnd).as_bool() {
            WindowState::Maximized
        } else {
            WindowState::Normal
        }
    };

    Some(WindowInfo {
        id: hwnd.0 as i64,
        pid,
        process_path,
        process_name,
        class_name,
        title,
        rect,
        normal_rect,
        visual_rect,
        state,
        monitor_id: unsafe { read_monitor_id(hwnd) },
    })
}

unsafe fn read_window_text(hwnd: HWND) -> String {
    let length = unsafe { GetWindowTextLengthW(hwnd) };
    if length <= 0 {
        return String::new();
    }

    let mut buffer = vec![0u16; length as usize + 1];
    let copied = unsafe { GetWindowTextW(hwnd, &mut buffer) };
    String::from_utf16_lossy(&buffer[..copied.max(0) as usize])
        .trim()
        .to_string()
}

unsafe fn read_class_name(hwnd: HWND) -> String {
    let mut buffer = [0u16; 256];
    let copied = unsafe { GetClassNameW(hwnd, &mut buffer) };
    String::from_utf16_lossy(&buffer[..copied.max(0) as usize])
}

unsafe fn read_process_path(pid: u32) -> String {
    let Ok(handle) = (unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) }) else {
        return String::new();
    };

    let mut buffer = vec![0u16; 32_768];
    let mut size = buffer.len() as u32;
    let result = unsafe {
        QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_WIN32,
            PWSTR(buffer.as_mut_ptr()),
            &mut size,
        )
    };
    let _ = unsafe { CloseHandle(handle) };

    if result.is_err() {
        return String::new();
    }

    String::from_utf16_lossy(&buffer[..size as usize])
}

unsafe fn read_visual_rect(hwnd: HWND) -> Option<Rect> {
    let mut rect = RECT::default();
    let result = unsafe {
        DwmGetWindowAttribute(
            hwnd,
            DWMWA_EXTENDED_FRAME_BOUNDS,
            &mut rect as *mut RECT as *mut c_void,
            size_of::<RECT>() as u32,
        )
    };

    if result.is_err() {
        return None;
    }

    Some(Rect {
        x: rect.left,
        y: rect.top,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
    })
}

unsafe fn read_normal_rect(hwnd: HWND) -> Option<Rect> {
    let mut placement = WINDOWPLACEMENT {
        length: size_of::<WINDOWPLACEMENT>() as u32,
        ..Default::default()
    };

    if unsafe { GetWindowPlacement(hwnd, &mut placement) }.is_err() {
        return None;
    }

    let rect = placement.rcNormalPosition;
    Some(Rect {
        x: rect.left,
        y: rect.top,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
    })
}

unsafe fn read_monitor_id(hwnd: HWND) -> Option<String> {
    let monitor = unsafe { MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST) };
    if monitor.is_invalid() {
        return None;
    }

    let mut info = MONITORINFOEXW::default();
    info.monitorInfo.cbSize = size_of::<MONITORINFOEXW>() as u32;
    let result = unsafe {
        GetMonitorInfoW(
            monitor,
            &mut info as *mut MONITORINFOEXW as *mut MONITORINFO,
        )
    };

    if !result.as_bool() {
        return None;
    }

    Some(wide_to_string(&info.szDevice))
}

pub fn restore_windows(targets: &[RestoreTarget]) -> Result<RestoreResult, String> {
    let candidates = list_windows()?;
    let mut used = std::collections::HashSet::new();
    let mut restored_hwnds = Vec::new();
    let mut restored = 0u32;
    let mut skipped = 0u32;
    let mut failed = Vec::new();

    for target in targets {
        // Within one app session the HWND is the strongest identity. Use it when
        // the process and window class still match instead of guessing by title.
        let exact = candidates.iter().find(|window| {
            !used.contains(&window.id) && window.id == target.id && identity_matches(target, window)
        });

        let mut ambiguous = false;
        let candidate = if let Some(window) = exact {
            Some(window)
        } else {
            let mut best_score = 0;
            let mut best: Vec<&WindowInfo> = Vec::new();

            for window in candidates
                .iter()
                .filter(|window| !used.contains(&window.id) && identity_matches(target, window))
            {
                let score = match_score(target, window);
                if score > best_score {
                    best_score = score;
                    best.clear();
                    best.push(window);
                } else if score == best_score {
                    best.push(window);
                }
            }

            if best_score >= 60 {
                if best.len() == 1 {
                    best.first().copied()
                } else {
                    ambiguous = true;
                    None
                }
            } else {
                None
            }
        };

        if candidate.is_none() {
            skipped += 1;
            failed.push(RestoreFailure::new(
                target,
                if ambiguous {
                    "ambiguous_window"
                } else {
                    "window_not_found"
                },
            ));
            continue;
        }

        let hwnd = HWND(candidate.map(|window| window.id).unwrap_or(target.id) as *mut c_void);

        if !unsafe { IsWindow(Some(hwnd)).as_bool() } {
            skipped += 1;
            failed.push(RestoreFailure::new(target, "window_not_found"));
            continue;
        }

        if target.width <= 0 || target.height <= 0 {
            skipped += 1;
            failed.push(RestoreFailure::new(target, "invalid_geometry"));
            continue;
        }

        let target_rect = RECT {
            left: target.x,
            top: target.y,
            right: target.x + target.width,
            bottom: target.y + target.height,
        };
        let monitor = unsafe { MonitorFromRect(&target_rect, MONITOR_DEFAULTTONULL) };
        if monitor.is_invalid() {
            skipped += 1;
            failed.push(RestoreFailure::new(target, "target_off_screen"));
            continue;
        }

        if target.state == WindowState::Minimized {
            unsafe {
                let _ = ShowWindow(hwnd, SW_RESTORE);
            }
        }

        let result = unsafe { apply_target_geometry(hwnd, target) };

        if !result {
            skipped += 1;
            failed.push(RestoreFailure::new(target, "move_ignored"));
            continue;
        }

        if target.state == WindowState::Maximized {
            unsafe {
                let _ = ShowWindow(hwnd, SW_MAXIMIZE);
            }
        } else if target.state == WindowState::Minimized {
            unsafe {
                let _ = ShowWindow(hwnd, SW_SHOWMINIMIZED);
            }
        }

        if let Some(window) = candidate {
            used.insert(window.id);
        }
        restored_hwnds.push(hwnd);
        restored += 1;
    }

    // Restore relative stacking after geometry. The profile order is the captured
    // z-order, topmost first; applying it in reverse leaves the first target on top.
    for hwnd in restored_hwnds.iter().rev() {
        unsafe {
            let _ = SetWindowPos(
                *hwnd,
                Some(HWND_TOP),
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            );
        }
    }

    Ok(RestoreResult {
        restored,
        skipped,
        failed,
    })
}

unsafe fn apply_target_geometry(hwnd: HWND, target: &RestoreTarget) -> bool {
    let moved = unsafe {
        SetWindowPos(
            hwnd,
            None,
            target.x,
            target.y,
            target.width,
            target.height,
            SWP_NOZORDER | SWP_NOACTIVATE | SWP_SHOWWINDOW,
        )
    };

    if moved.is_ok() && unsafe { geometry_matches(hwnd, target) } {
        return true;
    }

    // Some apps ignore SetWindowPos but honor their saved placement instead.
    let placement = WINDOWPLACEMENT {
        length: size_of::<WINDOWPLACEMENT>() as u32,
        showCmd: SW_SHOWNORMAL.0 as u32,
        rcNormalPosition: RECT {
            left: target.x,
            top: target.y,
            right: target.x + target.width,
            bottom: target.y + target.height,
        },
        ..Default::default()
    };

    let placed = unsafe { SetWindowPlacement(hwnd, &placement) };
    placed.is_ok() && unsafe { geometry_matches(hwnd, target) }
}

unsafe fn geometry_matches(hwnd: HWND, target: &RestoreTarget) -> bool {
    let mut rect = RECT::default();
    if unsafe { GetWindowRect(hwnd, &mut rect) }.is_err() {
        return false;
    }

    const TOLERANCE: i32 = 4;
    (rect.left - target.x).abs() <= TOLERANCE
        && (rect.top - target.y).abs() <= TOLERANCE
        && ((rect.right - rect.left) - target.width).abs() <= TOLERANCE
        && ((rect.bottom - rect.top) - target.height).abs() <= TOLERANCE
}

fn identity_matches(target: &RestoreTarget, window: &WindowInfo) -> bool {
    let process_matches = (!target.process_path.is_empty()
        && target
            .process_path
            .eq_ignore_ascii_case(&window.process_path))
        || (!target.process_name.is_empty()
            && target
                .process_name
                .eq_ignore_ascii_case(&window.process_name));

    let class_matches = target.class_name.is_empty() || target.class_name == window.class_name;

    process_matches && class_matches
}

fn match_score(target: &RestoreTarget, window: &WindowInfo) -> i32 {
    let mut score = 0;

    if !target.process_path.is_empty()
        && target
            .process_path
            .eq_ignore_ascii_case(&window.process_path)
    {
        score += 100;
    } else if !target.process_name.is_empty()
        && target
            .process_name
            .eq_ignore_ascii_case(&window.process_name)
    {
        score += 40;
    }

    if !target.class_name.is_empty() && target.class_name == window.class_name {
        score += 20;
    }

    if !target.title.is_empty() {
        if target.title == window.title {
            score += 30;
        } else if window.title.starts_with(&target.title) || target.title.starts_with(&window.title)
        {
            score += 15;
        }
    }

    if target.state == window.state {
        score += 5;
    }

    if target.id == window.id {
        score += 10;
    }

    score
}

/// True while the user drags or resizes any window. Restoring during a modal
/// move/size loop fights the user's pointer, so automation waits.
pub fn user_is_moving_window() -> bool {
    let mut info = GUITHREADINFO {
        cbSize: size_of::<GUITHREADINFO>() as u32,
        ..Default::default()
    };
    unsafe { GetGUIThreadInfo(0, &mut info) }.is_ok() && info.flags.0 & GUI_INMOVESIZE.0 != 0
}

thread_local! {
    static WATCHER_EVENTS: RefCell<Option<Sender<DisplayEvent>>> = const { RefCell::new(None) };
}

/// Starts a thread that owns a hidden top-level window. Broadcasts such as
/// `WM_DISPLAYCHANGE` reach top-level windows only, so a message-only window
/// (`HWND_MESSAGE`) would miss them.
pub fn spawn_display_watcher(events: Sender<DisplayEvent>) -> Result<(), String> {
    let (ready_tx, ready_rx) = mpsc::channel::<Result<(), String>>();

    std::thread::Builder::new()
        .name("windowanchor-display-watcher".to_string())
        .spawn(move || {
            WATCHER_EVENTS.with(|slot| *slot.borrow_mut() = Some(events));

            let created = unsafe { create_watcher_window() };
            let failed = created.is_err();
            let _ = ready_tx.send(created);
            if failed {
                return;
            }

            let mut message = MSG::default();
            while unsafe { GetMessageW(&mut message, None, 0, 0) }.0 > 0 {
                unsafe {
                    let _ = TranslateMessage(&message);
                    DispatchMessageW(&message);
                }
            }
        })
        .map_err(|error| error.to_string())?;

    ready_rx
        .recv()
        .map_err(|_| "display watcher thread exited".to_string())?
}

unsafe fn create_watcher_window() -> Result<(), String> {
    let module = unsafe { GetModuleHandleW(None) }.map_err(|error| error.to_string())?;
    let instance = HINSTANCE(module.0);
    let class = WNDCLASSW {
        lpfnWndProc: Some(watcher_proc),
        hInstance: instance,
        lpszClassName: WATCHER_CLASS,
        ..Default::default()
    };
    if unsafe { RegisterClassW(&class) } == 0 {
        return Err("RegisterClassW failed for the display watcher".to_string());
    }

    let hwnd = unsafe {
        CreateWindowExW(
            WS_EX_TOOLWINDOW,
            WATCHER_CLASS,
            w!("WindowAnchor display watcher"),
            WINDOW_STYLE(0),
            0,
            0,
            0,
            0,
            None,
            None,
            Some(instance),
            None,
        )
    }
    .map_err(|error| error.to_string())?;

    // Display power on/off is how modern-standby laptops and DisplayPort monitors
    // report "wake"; PBT_APMRESUME* alone misses it. The registration lives as
    // long as the window, which lives as long as the process.
    let _ = unsafe {
        RegisterPowerSettingNotification(
            HANDLE(hwnd.0),
            &GUID_CONSOLE_DISPLAY_STATE,
            DEVICE_NOTIFY_WINDOW_HANDLE,
        )
    };

    Ok(())
}

unsafe extern "system" fn watcher_proc(
    hwnd: HWND,
    message: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    let event = match message {
        WM_DISPLAYCHANGE => Some(DisplayEvent::DisplayChanged),
        WM_SETTINGCHANGE if wparam.0 as u32 == SPI_SETWORKAREA.0 => {
            Some(DisplayEvent::WorkAreaChanged)
        }
        WM_POWERBROADCAST => match wparam.0 as u32 {
            PBT_APMSUSPEND => Some(DisplayEvent::Suspended),
            PBT_APMRESUMEAUTOMATIC | PBT_APMRESUMESUSPEND => Some(DisplayEvent::Resumed),
            PBT_POWERSETTINGCHANGE if lparam.0 != 0 => unsafe { display_power_event(lparam) },
            _ => None,
        },
        _ => None,
    };

    if let Some(event) = event {
        WATCHER_EVENTS.with(|slot| {
            if let Some(events) = slot.borrow().as_ref() {
                let _ = events.send(event);
            }
        });
    }

    if message == WM_POWERBROADCAST {
        return LRESULT(1);
    }
    unsafe { DefWindowProcW(hwnd, message, wparam, lparam) }
}

unsafe fn display_power_event(lparam: LPARAM) -> Option<DisplayEvent> {
    let setting = unsafe { &*(lparam.0 as *const POWERBROADCAST_SETTING) };
    if setting.PowerSetting != GUID_CONSOLE_DISPLAY_STATE
        || (setting.DataLength as usize) < size_of::<u32>()
    {
        return None;
    }

    // 0 = off, 1 = on, 2 = dimmed. Dimming is not a display change.
    let state = unsafe { std::ptr::read_unaligned(setting.Data.as_ptr() as *const u32) };
    match state {
        0 => Some(DisplayEvent::DisplaysOff),
        1 => Some(DisplayEvent::DisplaysOn),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn window(id: i64, title: &str) -> WindowInfo {
        WindowInfo {
            id,
            pid: 1,
            process_path: "C:\\Apps\\Code.exe".to_string(),
            process_name: "Code.exe".to_string(),
            class_name: "Chrome_WidgetWin_1".to_string(),
            title: title.to_string(),
            rect: Rect::default(),
            normal_rect: None,
            visual_rect: None,
            state: WindowState::Normal,
            monitor_id: None,
        }
    }

    fn target(title: &str) -> RestoreTarget {
        RestoreTarget {
            id: 1,
            process_path: "C:\\Apps\\Code.exe".to_string(),
            process_name: "Code.exe".to_string(),
            class_name: "Chrome_WidgetWin_1".to_string(),
            title: title.to_string(),
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            state: WindowState::Normal,
        }
    }

    #[test]
    fn exact_identity_scores_high() {
        assert!(match_score(&target("App.tsx"), &window(1, "App.tsx")) >= 150);
    }

    #[test]
    fn title_breaks_ties_between_same_app_windows() {
        let exact = match_score(&target("App.tsx"), &window(1, "App.tsx"));
        let prefix = match_score(&target("App.tsx"), &window(2, "App.tsx — WindowAnchor"));
        let other = match_score(&target("App.tsx"), &window(3, "README.md"));

        assert!(exact > prefix);
        assert!(prefix > other);
    }

    #[test]
    fn unrelated_process_stays_below_threshold() {
        let mut other = target("App.tsx");
        other.process_path = "C:\\Apps\\Other.exe".to_string();
        other.process_name = "Other.exe".to_string();
        other.class_name = "OtherClass".to_string();
        other.title = "Other".to_string();

        assert!(match_score(&other, &window(1, "App.tsx")) < 40);
    }

    #[test]
    fn identity_requires_process_and_compatible_class() {
        let expected = target("App.tsx");
        assert!(identity_matches(&expected, &window(1, "App.tsx")));

        let mut wrong_class = window(2, "App.tsx");
        wrong_class.class_name = "OtherClass".to_string();
        assert!(!identity_matches(&expected, &wrong_class));

        let mut name_only = target("App.tsx");
        name_only.process_path.clear();
        name_only.class_name.clear();
        assert!(identity_matches(&name_only, &window(3, "App.tsx")));
    }
}
