#[cfg(not(windows))]
use crate::model::{RestoreResult, RestoreTarget, WindowInfo};

#[cfg(windows)]
mod windows;

#[cfg(windows)]
pub use windows::{list_windows, restore_windows};

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
