mod model;
mod platform;

use model::{DisplayInfo, WindowInfo};

#[tauri::command]
fn list_displays(window: tauri::WebviewWindow) -> Result<Vec<DisplayInfo>, String> {
    let monitors = window
        .available_monitors()
        .map_err(|error| error.to_string())?;
    let primary_position = window
        .primary_monitor()
        .map_err(|error| error.to_string())?
        .map(|monitor| *monitor.position());

    Ok(monitors
        .into_iter()
        .enumerate()
        .map(|(index, monitor)| {
            let position = *monitor.position();
            let size = *monitor.size();
            let name = monitor
                .name()
                .cloned()
                .unwrap_or_else(|| format!("Display {}", index + 1));

            DisplayInfo {
                id: name.clone(),
                name,
                x: position.x,
                y: position.y,
                width: size.width,
                height: size.height,
                scale_factor: monitor.scale_factor(),
                primary: primary_position
                    .map(|primary| primary == position)
                    .unwrap_or(index == 0),
            }
        })
        .collect())
}

#[tauri::command]
fn list_windows() -> Result<Vec<WindowInfo>, String> {
    platform::list_windows()
}

#[tauri::command]
fn restore_windows(targets: Vec<model::RestoreTarget>) -> Result<model::RestoreResult, String> {
    platform::restore_windows(&targets)
}

#[tauri::command]
fn app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "WindowAnchor",
        "version": env!("CARGO_PKG_VERSION"),
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
    })
}

#[cfg(windows)]
fn enable_per_monitor_dpi_awareness() {
    use windows::Win32::UI::HiDpi::{
        DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2, SetProcessDpiAwarenessContext,
    };

    // Tauri/WebView2 normally sets this too, but the window backend must see the
    // same physical-pixel coordinate space as the monitor inventory. Ignore the
    // error when the process is already per-monitor aware.
    unsafe {
        let _ = SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(windows)]
    enable_per_monitor_dpi_awareness();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_displays,
            list_windows,
            restore_windows,
            app_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running WindowAnchor");
}
