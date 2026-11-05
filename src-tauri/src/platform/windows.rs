use std::ffi::c_void;
use std::mem::size_of;

use windows::Win32::Foundation::{CloseHandle, HWND, LPARAM, RECT};
use windows::Win32::Graphics::Dwm::{DWMWA_EXTENDED_FRAME_BOUNDS, DwmGetWindowAttribute};
use windows::Win32::Graphics::Gdi::{
    GetMonitorInfoW, MONITOR_DEFAULTTONEAREST, MONITORINFO, MONITORINFOEXW, MonitorFromWindow,
};
use windows::Win32::System::Threading::{
    OpenProcess, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION, QueryFullProcessImageNameW,
};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GWL_EXSTYLE, GetClassNameW, GetWindowLongW, GetWindowRect, GetWindowTextLengthW,
    GetWindowTextW, GetWindowThreadProcessId, IsIconic, IsWindow, IsWindowVisible, IsZoomed,
    SW_MAXIMIZE, SW_RESTORE, SWP_NOACTIVATE, SWP_NOZORDER, SWP_SHOWWINDOW, SetWindowPos,
    ShowWindow, WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
};
use windows::core::{BOOL, PWSTR};

use crate::model::{Rect, RestoreResult, RestoreTarget, WindowInfo, WindowState};

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

    Some(
        String::from_utf16_lossy(&info.szDevice)
            .trim_end_matches('\0')
            .to_string(),
    )
}

pub fn restore_windows(targets: &[RestoreTarget]) -> Result<RestoreResult, String> {
    let candidates = list_windows()?;
    let mut used = std::collections::HashSet::new();
    let mut restored = 0u32;
    let mut skipped = 0u32;
    let mut failed = Vec::new();

    for target in targets {
        let candidate = candidates
            .iter()
            .filter(|window| !used.contains(&window.id))
            .map(|window| (window, match_score(target, window)))
            .filter(|(_, score)| *score >= 40)
            .max_by_key(|(_, score)| *score)
            .map(|(window, _)| window);

        let hwnd = HWND(candidate.map(|window| window.id).unwrap_or(target.id) as *mut c_void);

        if !unsafe { IsWindow(Some(hwnd)).as_bool() } {
            skipped += 1;
            failed.push(crate::model::RestoreFailure {
                id: target.id,
                reason: "window_not_found".to_string(),
            });
            continue;
        }

        if target.state == WindowState::Minimized {
            unsafe {
                let _ = ShowWindow(hwnd, SW_RESTORE);
            }
        }

        let result = unsafe {
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

        if result.is_err() {
            skipped += 1;
            failed.push(crate::model::RestoreFailure {
                id: target.id,
                reason: "move_failed".to_string(),
            });
            continue;
        }

        if target.state == WindowState::Maximized {
            unsafe {
                let _ = ShowWindow(hwnd, SW_MAXIMIZE);
            }
        }

        if let Some(window) = candidate {
            used.insert(window.id);
        }
        restored += 1;
    }

    Ok(RestoreResult {
        restored,
        skipped,
        failed,
    })
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
}
