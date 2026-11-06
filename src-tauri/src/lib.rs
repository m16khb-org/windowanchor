mod automation;
mod display;
mod model;
mod platform;
mod store;

use std::sync::Mutex;

use tauri::{AppHandle, Manager, State};

use automation::AppStore;
use model::{
    ActivityEntry, AppRule, AppState, DisplayInfo, LayoutProfile, RestoreReport, RestoreTrigger,
    Settings, WindowInfo,
};
use store::{Store, now_ms};

fn snapshot(store: &Store) -> Result<AppState, String> {
    let displays = platform::list_displays()?;
    Ok(store.snapshot(display::configuration_id(&displays)))
}

fn mutate(
    store: &State<AppStore>,
    change: impl FnOnce(&mut Store) -> Result<(), String>,
) -> Result<AppState, String> {
    let mut store = store.lock();
    change(&mut store)?;
    snapshot(&store)
}

#[tauri::command]
fn list_displays() -> Result<Vec<DisplayInfo>, String> {
    platform::list_displays()
}

#[tauri::command]
fn list_windows() -> Result<Vec<WindowInfo>, String> {
    platform::list_windows()
}

#[tauri::command]
fn load_state(store: State<AppStore>) -> Result<AppState, String> {
    snapshot(&store.lock())
}

#[tauri::command]
fn save_profile(store: State<AppStore>, profile: LayoutProfile) -> Result<AppState, String> {
    mutate(&store, |store| store.save_profile(profile, now_ms()))
}

#[tauri::command]
fn delete_profile(store: State<AppStore>, id: String) -> Result<AppState, String> {
    mutate(&store, |store| store.delete_profile(&id))
}

#[tauri::command]
fn assign_profile(store: State<AppStore>, profile_id: String) -> Result<AppState, String> {
    let displays = platform::list_displays()?;
    mutate(&store, |store| {
        store.assign_profile(&profile_id, &displays, now_ms())
    })
}

#[tauri::command]
fn save_rules(store: State<AppStore>, rules: Vec<AppRule>) -> Result<AppState, String> {
    mutate(&store, |store| store.save_rules(rules))
}

#[tauri::command]
fn save_settings(store: State<AppStore>, settings: Settings) -> Result<AppState, String> {
    mutate(&store, |store| store.save_settings(settings))
}

#[tauri::command]
fn append_activity(store: State<AppStore>, entry: ActivityEntry) -> Result<AppState, String> {
    mutate(&store, |store| store.append_activity(entry))
}

#[tauri::command]
fn reset_store(store: State<AppStore>) -> Result<AppState, String> {
    mutate(&store, Store::reset)
}

/// Runs off the main thread: moving windows of a busy app can block for a while.
#[tauri::command]
async fn restore_layout(
    app: AppHandle,
    profile: LayoutProfile,
    trigger: RestoreTrigger,
) -> Result<RestoreReport, String> {
    tauri::async_runtime::spawn_blocking(move || {
        automation::restore_and_record(&app, &profile, trigger)
    })
    .await
    .map_err(|error| error.to_string())?
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
        .setup(|app| {
            // %APPDATA%\WindowAnchor on Windows, ~/Library/Application Support/WindowAnchor on macOS.
            let dir = app.path().data_dir()?.join("WindowAnchor");
            let (store, warnings) = Store::open(&dir);
            for warning in warnings {
                eprintln!("WindowAnchor: {warning}");
            }
            app.manage(AppStore(Mutex::new(store)));
            automation::start(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_displays,
            list_windows,
            load_state,
            save_profile,
            delete_profile,
            assign_profile,
            save_rules,
            save_settings,
            append_activity,
            reset_store,
            restore_layout,
            app_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running WindowAnchor");
}
