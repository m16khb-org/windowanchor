#[cfg(not(windows))]
use crate::automation::DisplayEvent;
#[cfg(not(windows))]
use crate::model::{DisplayInfo, RestoreResult, RestoreTarget, WindowInfo};

#[cfg(windows)]
mod windows;

#[cfg(windows)]
pub use windows::{
    list_displays, list_windows, restore_windows, spawn_display_watcher, user_is_moving_window,
};

#[cfg(not(windows))]
pub fn list_displays() -> Result<Vec<DisplayInfo>, String> {
    Ok(Vec::new())
}

#[cfg(not(windows))]
pub fn list_windows() -> Result<Vec<WindowInfo>, String> {
    Ok(Vec::new())
}

#[cfg(not(windows))]
pub fn restore_windows(targets: &[RestoreTarget]) -> Result<RestoreResult, String> {
    Ok(RestoreResult {
        restored: 0,
        skipped: targets.len() as u32,
        failed: Vec::new(),
    })
}

#[cfg(not(windows))]
pub fn spawn_display_watcher(_events: std::sync::mpsc::Sender<DisplayEvent>) -> Result<(), String> {
    Ok(())
}

#[cfg(not(windows))]
pub fn user_is_moving_window() -> bool {
    false
}
