use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DisplayInfo {
    /// `\\.\DISPLAYn` on Windows. Windows point at it through `monitor_id`.
    pub id: String,
    /// Monitor device interface path. Stable across reboots for the same monitor
    /// on the same port; empty for data captured before it was recorded.
    #[serde(default)]
    pub device_id: String,
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
    pub primary: bool,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowInfo {
    pub id: i64,
    pub pid: u32,
    pub process_path: String,
    pub process_name: String,
    pub class_name: String,
    pub title: String,
    pub rect: Rect,
    pub normal_rect: Option<Rect>,
    pub visual_rect: Option<Rect>,
    pub state: WindowState,
    pub monitor_id: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WindowState {
    Normal,
    Minimized,
    Maximized,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreTarget {
    pub id: i64,
    pub process_path: String,
    pub process_name: String,
    pub class_name: String,
    pub title: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub state: WindowState,
}

impl RestoreTarget {
    /// Minimized windows are restored to their normal placement, not to the
    /// off-screen coordinates Windows reports while they are iconic.
    pub fn from_window(window: &WindowInfo) -> Self {
        let rect = match (window.state, window.normal_rect) {
            (WindowState::Minimized, Some(normal)) => normal,
            _ => window.rect,
        };

        Self {
            id: window.id,
            process_path: window.process_path.clone(),
            process_name: window.process_name.clone(),
            class_name: window.class_name.clone(),
            title: window.title.clone(),
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            state: window.state,
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct RestoreResult {
    pub restored: u32,
    pub skipped: u32,
    pub failed: Vec<RestoreFailure>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreFailure {
    pub id: i64,
    pub title: String,
    pub process_name: String,
    pub reason: String,
}

impl RestoreFailure {
    pub fn new(target: &RestoreTarget, reason: &str) -> Self {
        Self {
            id: target.id,
            title: target.title.clone(),
            process_name: target.process_name.clone(),
            reason: reason.to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayoutProfile {
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name_key: Option<String>,
    #[serde(default)]
    pub description: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hotkey: Option<String>,
    #[serde(default)]
    pub updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub updated_at_key: Option<String>,
    pub displays: Vec<DisplayInfo>,
    pub windows: Vec<WindowInfo>,
    #[serde(default)]
    pub accent: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub configuration_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppRule {
    pub id: String,
    pub process_name: String,
    pub r#match: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub match_key: Option<String>,
    pub target: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_key: Option<String>,
    pub priority: i32,
    pub enabled: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub auto_restore: bool,
    pub confirm_restore: bool,
    pub debounce_ms: u32,
    pub show_grid: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            auto_restore: true,
            confirm_restore: false,
            debounce_ms: 1000,
            show_grid: true,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorConfiguration {
    pub id: String,
    pub displays: Vec<DisplayInfo>,
    pub profile_id: Option<String>,
    pub first_seen: u64,
    pub last_seen: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RestoreTrigger {
    Manual,
    Display,
    WorkArea,
    Wake,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreReport {
    pub profile_id: String,
    pub profile_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub profile_name_key: Option<String>,
    pub trigger: RestoreTrigger,
    pub restored: u32,
    pub skipped: u32,
    pub failed: Vec<RestoreFailure>,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEntry {
    pub id: String,
    pub kind: String,
    #[serde(default)]
    pub title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title_key: Option<String>,
    #[serde(default)]
    pub detail: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail_key: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub detail_params: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub at: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub time_key: Option<String>,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trigger: Option<RestoreTrigger>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub report: Option<RestoreReport>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub profiles: Vec<LayoutProfile>,
    pub rules: Vec<AppRule>,
    pub settings: Settings,
    pub activity: Vec<ActivityEntry>,
    pub monitor_configurations: Vec<MonitorConfiguration>,
    pub current_configuration_id: String,
    pub store_path: String,
}
