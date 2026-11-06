use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::display::configuration_id;
use crate::model::{
    ActivityEntry, AppRule, AppState, DisplayInfo, LayoutProfile, MonitorConfiguration, Settings,
};

pub const STORE_VERSION: u32 = 1;
const STORE_FILE: &str = "store.json";
const BACKUP_FILE: &str = "store.json.bak";
const TEMP_FILE: &str = "store.json.tmp";
const ACTIVITY_LIMIT: usize = 500;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct StoreData {
    pub version: u32,
    pub profiles: Vec<LayoutProfile>,
    pub rules: Vec<AppRule>,
    pub settings: Settings,
    pub activity: Vec<ActivityEntry>,
    pub monitor_configurations: Vec<MonitorConfiguration>,
}

impl Default for StoreData {
    fn default() -> Self {
        Self {
            version: STORE_VERSION,
            profiles: Vec::new(),
            rules: Vec::new(),
            settings: Settings::default(),
            activity: Vec::new(),
            monitor_configurations: Vec::new(),
        }
    }
}

/// Profiles, rules, settings, monitor configurations, and activity in one
/// versioned JSON file. Every mutation is written to a temp file, flushed, and
/// renamed over the store; the previous file is kept as `store.json.bak`.
pub struct Store {
    dir: PathBuf,
    data: StoreData,
    /// Set when the file on disk must not be overwritten (written by a newer
    /// version). Mutations fail with this message.
    read_only: Option<String>,
}

impl Store {
    /// Never fails: an unreadable store is moved aside and replaced by an empty
    /// one so the app still starts. Returned warnings explain what happened.
    pub fn open(dir: &Path) -> (Self, Vec<String>) {
        let mut warnings = Vec::new();
        let main = dir.join(STORE_FILE);
        let backup = dir.join(BACKUP_FILE);

        let data = match read_data(&main) {
            Ok(Some(data)) => data,
            Ok(None) => match read_data(&backup) {
                Ok(Some(data)) => {
                    warnings.push(format!("{} was missing; loaded the backup", main.display()));
                    data
                }
                _ => StoreData::default(),
            },
            Err(error) => {
                warnings.push(format!("{} is unreadable: {error}", main.display()));
                let aside = dir.join(format!("store.corrupt-{}.json", now_ms()));
                if fs::rename(&main, &aside).is_ok() {
                    warnings.push(format!("moved it to {}", aside.display()));
                }
                match read_data(&backup) {
                    Ok(Some(data)) => {
                        warnings.push("loaded the backup instead".to_string());
                        data
                    }
                    _ => StoreData::default(),
                }
            }
        };

        let read_only = (data.version > STORE_VERSION).then(|| {
            format!(
                "{} was written by a newer WindowAnchor (store version {}); changes are not saved",
                main.display(),
                data.version
            )
        });
        if let Some(message) = &read_only {
            warnings.push(message.clone());
        }

        (
            Self {
                dir: dir.to_path_buf(),
                data,
                read_only,
            },
            warnings,
        )
    }

    pub fn path(&self) -> PathBuf {
        self.dir.join(STORE_FILE)
    }

    pub fn settings(&self) -> &Settings {
        &self.data.settings
    }

    pub fn snapshot(&self, current_configuration_id: String) -> AppState {
        AppState {
            profiles: self.data.profiles.clone(),
            rules: self.data.rules.clone(),
            settings: self.data.settings.clone(),
            activity: self.data.activity.clone(),
            monitor_configurations: self.data.monitor_configurations.clone(),
            current_configuration_id,
            store_path: self.path().display().to_string(),
        }
    }

    /// Profile automation restores for a configuration: the explicitly assigned
    /// one, else the newest profile captured on that configuration.
    pub fn profile_for_configuration(&self, configuration: &str) -> Option<&LayoutProfile> {
        let assigned = self
            .data
            .monitor_configurations
            .iter()
            .find(|candidate| candidate.id == configuration)
            .and_then(|candidate| candidate.profile_id.as_deref())
            .and_then(|id| self.data.profiles.iter().find(|profile| profile.id == id));

        assigned.or_else(|| {
            self.data
                .profiles
                .iter()
                .find(|profile| profile.configuration_id.as_deref() == Some(configuration))
        })
    }

    /// Inserts a new profile at the front and makes it the profile of the
    /// configuration it was captured on; replaces an existing one in place.
    pub fn save_profile(&mut self, mut profile: LayoutProfile, now: u64) -> Result<(), String> {
        let configuration = configuration_id(&profile.displays);
        profile.configuration_id = Some(configuration.clone());

        self.update(|data| {
            if let Some(existing) = data.profiles.iter_mut().find(|item| item.id == profile.id) {
                *existing = profile;
            } else {
                let displays = profile.displays.clone();
                let id = profile.id.clone();
                data.profiles.insert(0, profile);
                upsert_configuration(data, &configuration, &displays, Some(id), now);
            }
        })
    }

    pub fn delete_profile(&mut self, id: &str) -> Result<(), String> {
        self.update(|data| {
            data.profiles.retain(|profile| profile.id != id);
            for configuration in &mut data.monitor_configurations {
                if configuration.profile_id.as_deref() == Some(id) {
                    configuration.profile_id = None;
                }
            }
        })
    }

    pub fn assign_profile(
        &mut self,
        profile_id: &str,
        displays: &[DisplayInfo],
        now: u64,
    ) -> Result<(), String> {
        if !self
            .data
            .profiles
            .iter()
            .any(|profile| profile.id == profile_id)
        {
            return Err(format!("profile {profile_id} does not exist"));
        }

        let configuration = configuration_id(displays);
        self.update(|data| {
            upsert_configuration(
                data,
                &configuration,
                displays,
                Some(profile_id.to_string()),
                now,
            );
        })
    }

    /// Records that a configuration is connected now. Keeps its assignment.
    pub fn observe_configuration(
        &mut self,
        displays: &[DisplayInfo],
        now: u64,
    ) -> Result<(), String> {
        let configuration = configuration_id(displays);
        self.update(|data| {
            let profile_id = data
                .monitor_configurations
                .iter()
                .find(|candidate| candidate.id == configuration)
                .and_then(|candidate| candidate.profile_id.clone());
            upsert_configuration(data, &configuration, displays, profile_id, now);
        })
    }

    pub fn save_rules(&mut self, rules: Vec<AppRule>) -> Result<(), String> {
        self.update(|data| data.rules = rules)
    }

    pub fn save_settings(&mut self, settings: Settings) -> Result<(), String> {
        self.update(|data| data.settings = settings)
    }

    pub fn append_activity(&mut self, entry: ActivityEntry) -> Result<(), String> {
        self.update(|data| {
            data.activity.insert(0, entry);
            data.activity.truncate(ACTIVITY_LIMIT);
        })
    }

    pub fn reset(&mut self) -> Result<(), String> {
        self.update(|data| *data = StoreData::default())
    }

    /// Applies a change to a copy, writes it, and only then swaps it in, so a
    /// failed write leaves memory and disk in agreement.
    fn update(&mut self, change: impl FnOnce(&mut StoreData)) -> Result<(), String> {
        if let Some(message) = &self.read_only {
            return Err(message.clone());
        }

        let mut next = self.data.clone();
        change(&mut next);
        self.write(&next)
            .map_err(|error| format!("could not save {}: {error}", self.path().display()))?;
        self.data = next;
        Ok(())
    }

    fn write(&self, data: &StoreData) -> std::io::Result<()> {
        fs::create_dir_all(&self.dir)?;
        let main = self.dir.join(STORE_FILE);
        let temp = self.dir.join(TEMP_FILE);

        let bytes = serde_json::to_vec_pretty(data).map_err(std::io::Error::other)?;
        {
            let mut file = fs::File::create(&temp)?;
            file.write_all(&bytes)?;
            file.sync_all()?;
        }

        if main.exists() {
            fs::copy(&main, self.dir.join(BACKUP_FILE))?;
        }
        // On Windows this is MoveFileExW(MOVEFILE_REPLACE_EXISTING).
        fs::rename(&temp, &main)
    }
}

fn read_data(path: &Path) -> Result<Option<StoreData>, String> {
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };
    serde_json::from_slice(&bytes)
        .map(Some)
        .map_err(|error| error.to_string())
}

fn upsert_configuration(
    data: &mut StoreData,
    id: &str,
    displays: &[DisplayInfo],
    profile_id: Option<String>,
    now: u64,
) {
    if let Some(existing) = data
        .monitor_configurations
        .iter_mut()
        .find(|configuration| configuration.id == id)
    {
        existing.displays = displays.to_vec();
        existing.profile_id = profile_id;
        existing.last_seen = now;
    } else {
        data.monitor_configurations.push(MonitorConfiguration {
            id: id.to_string(),
            displays: displays.to_vec(),
            profile_id,
            first_seen: now,
            last_seen: now,
        });
    }
}

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|elapsed| elapsed.as_millis() as u64)
        .unwrap_or_default()
}

/// Unique within the process and sortable by creation time.
pub fn new_id() -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    format!(
        "{:x}-{:x}",
        now_ms(),
        COUNTER.fetch_add(1, Ordering::Relaxed)
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("windowanchor-store-{name}-{}", new_id()));
        let _ = fs::remove_dir_all(&dir);
        dir
    }

    fn display(device_id: &str, width: u32) -> DisplayInfo {
        DisplayInfo {
            id: "\\\\.\\DISPLAY1".to_string(),
            device_id: device_id.to_string(),
            name: "\\\\.\\DISPLAY1".to_string(),
            x: 0,
            y: 0,
            width,
            height: 1440,
            scale_factor: 1.0,
            primary: true,
        }
    }

    fn profile(id: &str, displays: Vec<DisplayInfo>) -> LayoutProfile {
        LayoutProfile {
            id: id.to_string(),
            name: id.to_string(),
            name_key: None,
            description: String::new(),
            description_key: None,
            hotkey: None,
            updated_at: "2026-11-06T00:00:00.000Z".to_string(),
            updated_at_key: None,
            displays,
            windows: Vec::new(),
            accent: "#f5a524".to_string(),
            configuration_id: None,
        }
    }

    #[test]
    fn mutations_survive_a_reopen() {
        let dir = temp_dir("reopen");
        let (mut store, warnings) = Store::open(&dir);
        assert!(warnings.is_empty());

        store
            .save_profile(profile("desk", vec![display("MON#A", 2560)]), 1)
            .unwrap();
        store
            .save_settings(Settings {
                debounce_ms: 3000,
                ..Settings::default()
            })
            .unwrap();
        drop(store);

        let (store, warnings) = Store::open(&dir);
        assert!(warnings.is_empty());
        let state = store.snapshot(String::new());
        assert_eq!(state.profiles.len(), 1);
        assert_eq!(state.settings.debounce_ms, 3000);
        assert_eq!(
            state.profiles[0].configuration_id.as_deref(),
            Some(configuration_id(&[display("MON#A", 2560)]).as_str())
        );
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn corrupt_store_falls_back_to_backup_and_is_kept_aside() {
        let dir = temp_dir("corrupt");
        let (mut store, _) = Store::open(&dir);
        store.save_profile(profile("first", Vec::new()), 1).unwrap();
        store
            .save_profile(profile("second", Vec::new()), 2)
            .unwrap();
        drop(store);

        fs::write(dir.join(STORE_FILE), b"{ not json").unwrap();
        let (store, warnings) = Store::open(&dir);

        // The backup holds the state before the last write.
        let ids: Vec<_> = store
            .snapshot(String::new())
            .profiles
            .into_iter()
            .map(|profile| profile.id)
            .collect();
        assert_eq!(ids, ["first"]);
        assert!(warnings.iter().any(|warning| warning.contains("backup")));
        assert!(fs::read_dir(&dir).unwrap().any(|entry| {
            entry
                .unwrap()
                .file_name()
                .to_string_lossy()
                .starts_with("store.corrupt-")
        }));
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn newer_store_version_is_never_overwritten() {
        let dir = temp_dir("newer");
        fs::create_dir_all(&dir).unwrap();
        let newer = br#"{"version": 99, "profiles": []}"#;
        fs::write(dir.join(STORE_FILE), newer).unwrap();

        let (mut store, warnings) = Store::open(&dir);
        assert!(!warnings.is_empty());
        assert!(store.save_rules(Vec::new()).is_err());
        assert_eq!(fs::read(dir.join(STORE_FILE)).unwrap(), newer);
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn newest_capture_on_a_configuration_wins_until_reassigned() {
        let dir = temp_dir("select");
        let (mut store, _) = Store::open(&dir);
        let home = vec![display("MON#A", 2560)];
        let office = vec![display("MON#B", 1920)];
        let home_id = configuration_id(&home);

        store.save_profile(profile("old", home.clone()), 1).unwrap();
        store.save_profile(profile("office", office), 2).unwrap();
        store.save_profile(profile("new", home.clone()), 3).unwrap();
        assert_eq!(store.profile_for_configuration(&home_id).unwrap().id, "new");

        store.assign_profile("old", &home, 4).unwrap();
        assert_eq!(store.profile_for_configuration(&home_id).unwrap().id, "old");

        // Deleting the assigned profile falls back to captures on that setup.
        store.delete_profile("old").unwrap();
        assert_eq!(store.profile_for_configuration(&home_id).unwrap().id, "new");
        assert!(store.assign_profile("missing", &home, 5).is_err());

        // Re-observing keeps the assignment.
        store.assign_profile("office", &home, 6).unwrap();
        store.observe_configuration(&home, 7).unwrap();
        assert_eq!(
            store.profile_for_configuration(&home_id).unwrap().id,
            "office"
        );
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn activity_is_newest_first_and_capped() {
        let dir = temp_dir("activity");
        let (mut store, _) = Store::open(&dir);
        for index in 0..(ACTIVITY_LIMIT + 3) {
            store
                .append_activity(ActivityEntry {
                    id: index.to_string(),
                    kind: "capture".to_string(),
                    title: String::new(),
                    title_key: None,
                    detail: String::new(),
                    detail_key: None,
                    detail_params: None,
                    at: Some(index as u64),
                    time_key: None,
                    status: "ok".to_string(),
                    trigger: None,
                    report: None,
                })
                .unwrap();
        }

        let activity = store.snapshot(String::new()).activity;
        assert_eq!(activity.len(), ACTIVITY_LIMIT);
        assert_eq!(activity[0].id, (ACTIVITY_LIMIT + 2).to_string());
        let _ = fs::remove_dir_all(dir);
    }
}
