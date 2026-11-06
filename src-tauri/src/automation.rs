use std::sync::mpsc::{self, Receiver, RecvTimeoutError};
use std::sync::{Mutex, PoisonError};
use std::time::{Duration, Instant};

use serde_json::{Map, Value, json};
use tauri::{AppHandle, Emitter, Manager};

use crate::display::configuration_id;
use crate::model::{
    ActivityEntry, DisplayInfo, LayoutProfile, MonitorConfiguration, RestoreReport, RestoreTarget,
    RestoreTrigger,
};
use crate::platform;
use crate::store::{Store, new_id, now_ms};

/// Polling catches changes that arrive without a broadcast (some docks, RDP).
const POLL_INTERVAL: Duration = Duration::from_secs(2);

pub struct AppStore(pub Mutex<Store>);

impl AppStore {
    pub fn lock(&self) -> std::sync::MutexGuard<'_, Store> {
        self.0.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

/// Manual and automatic restores must not interleave their window moves.
static RESTORE_LOCK: Mutex<()> = Mutex::new(());

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DisplayEvent {
    DisplayChanged,
    WorkAreaChanged,
    Suspended,
    Resumed,
    DisplaysOff,
    DisplaysOn,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ConfigurationChanged {
    configuration_id: String,
    displays: Vec<DisplayInfo>,
    monitor_configurations: Vec<MonitorConfiguration>,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct RestoreConfirm {
    profile_id: String,
    trigger: RestoreTrigger,
}

/// Collapses a burst of display events into one restore that fires once the
/// configuration has been quiet for the debounce period. Nothing fires while
/// the machine or its displays are asleep; waking turns the pending trigger
/// into `Wake`.
#[derive(Debug, Default)]
pub struct Debouncer {
    asleep: bool,
    pending: Option<RestoreTrigger>,
    last_event: Option<Instant>,
}

impl Debouncer {
    pub fn observe(&mut self, event: DisplayEvent, now: Instant) {
        match event {
            DisplayEvent::Suspended | DisplayEvent::DisplaysOff => self.asleep = true,
            // Windows reports the current display state right after the power
            // notification is registered; "on" only means wake after "off".
            DisplayEvent::Resumed | DisplayEvent::DisplaysOn => {
                if self.asleep {
                    self.asleep = false;
                    self.mark(RestoreTrigger::Wake, now);
                }
            }
            DisplayEvent::DisplayChanged => self.mark(RestoreTrigger::Display, now),
            DisplayEvent::WorkAreaChanged => self.mark(RestoreTrigger::WorkArea, now),
        }
    }

    fn mark(&mut self, trigger: RestoreTrigger, now: Instant) {
        self.pending = Some(match self.pending {
            Some(current) if rank(current) >= rank(trigger) => current,
            _ => trigger,
        });
        self.last_event = Some(now);
    }

    /// Time left until the pending trigger is due; `None` when nothing waits.
    pub fn remaining(&self, now: Instant, debounce: Duration) -> Option<Duration> {
        if self.asleep {
            return None;
        }
        let (_, last) = self.pending.zip(self.last_event)?;
        Some((last + debounce).saturating_duration_since(now))
    }

    /// Takes the pending trigger once the configuration has settled.
    pub fn take_due(&mut self, now: Instant, debounce: Duration) -> Option<RestoreTrigger> {
        if self.remaining(now, debounce)? > Duration::ZERO {
            return None;
        }
        self.last_event = None;
        self.pending.take()
    }

    /// Keeps the trigger but restarts the quiet period.
    pub fn postpone(&mut self, now: Instant) {
        if self.pending.is_some() {
            self.last_event = Some(now);
        }
    }
}

fn rank(trigger: RestoreTrigger) -> u8 {
    match trigger {
        RestoreTrigger::Manual | RestoreTrigger::WorkArea => 0,
        RestoreTrigger::Display => 1,
        RestoreTrigger::Wake => 2,
    }
}

pub fn start(app: AppHandle) {
    let (sender, receiver) = mpsc::channel();
    let events = match platform::spawn_display_watcher(sender) {
        Ok(()) => Some(receiver),
        Err(error) => {
            eprintln!("WindowAnchor: display watcher unavailable, polling only: {error}");
            None
        }
    };

    let spawned = std::thread::Builder::new()
        .name("windowanchor-automation".to_string())
        .spawn(move || run(app, events));
    if let Err(error) = spawned {
        eprintln!("WindowAnchor: automation thread failed to start: {error}");
    }
}

fn run(app: AppHandle, mut events: Option<Receiver<DisplayEvent>>) {
    let mut debouncer = Debouncer::default();
    let mut current = String::new();
    let mut next_poll = Instant::now();

    loop {
        let now = Instant::now();
        let debounce = Duration::from_millis(u64::from(
            app.state::<AppStore>().lock().settings().debounce_ms,
        ));
        let until_poll = next_poll.saturating_duration_since(now);
        let wait = debouncer
            .remaining(now, debounce)
            .map_or(until_poll, |remaining| remaining.min(until_poll));

        match events.as_ref().map(|receiver| receiver.recv_timeout(wait)) {
            Some(Ok(event)) => debouncer.observe(event, Instant::now()),
            Some(Err(RecvTimeoutError::Timeout)) => {}
            Some(Err(RecvTimeoutError::Disconnected)) => {
                eprintln!("WindowAnchor: display watcher stopped, polling only");
                events = None;
            }
            None => std::thread::sleep(wait),
        }

        let now = Instant::now();
        if now >= next_poll {
            next_poll = now + POLL_INTERVAL;
            if let Ok(displays) = platform::list_displays() {
                let id = configuration_id(&displays);
                if id != current {
                    // The first poll records the startup configuration; it is
                    // not a change and must not restore anything.
                    if !current.is_empty() {
                        debouncer.observe(DisplayEvent::DisplayChanged, now);
                    }
                    current = id.clone();
                    configuration_changed(&app, id, displays);
                }
            }
        }

        let now = Instant::now();
        if debouncer.remaining(now, debounce) == Some(Duration::ZERO) {
            if platform::user_is_moving_window() {
                debouncer.postpone(now);
                continue;
            }
            if let Some(trigger) = debouncer.take_due(now, debounce) {
                auto_restore(&app, trigger);
            }
        }
    }
}

fn configuration_changed(app: &AppHandle, id: String, displays: Vec<DisplayInfo>) {
    let store = app.state::<AppStore>();
    let mut store = store.lock();
    if let Err(error) = store.observe_configuration(&displays, now_ms()) {
        eprintln!("WindowAnchor: {error}");
    }
    let payload = ConfigurationChanged {
        configuration_id: id,
        displays,
        monitor_configurations: store.snapshot(String::new()).monitor_configurations,
    };
    drop(store);
    let _ = app.emit("configuration-changed", payload);
}

fn auto_restore(app: &AppHandle, trigger: RestoreTrigger) {
    let displays = match platform::list_displays() {
        Ok(displays) => displays,
        Err(error) => {
            eprintln!("WindowAnchor: auto-restore could not read displays: {error}");
            return;
        }
    };
    let configuration = configuration_id(&displays);

    let (settings, profile) = {
        let store = app.state::<AppStore>();
        let store = store.lock();
        (
            store.settings().clone(),
            store.profile_for_configuration(&configuration).cloned(),
        )
    };
    if !settings.auto_restore {
        return;
    }

    match profile {
        None => {
            let entry = ActivityEntry {
                id: new_id(),
                kind: "skip".to_string(),
                title: String::new(),
                title_key: Some("activity.log.noLayout".to_string()),
                detail: String::new(),
                detail_key: Some("activity.log.noLayoutDetail".to_string()),
                detail_params: Some(json!({ "displays": displays.len() })),
                at: Some(now_ms()),
                time_key: None,
                status: "warn".to_string(),
                trigger: Some(trigger),
                report: None,
            };
            record(app, entry);
        }
        Some(profile) if settings.confirm_restore => {
            let _ = app.emit(
                "restore-confirm",
                RestoreConfirm {
                    profile_id: profile.id,
                    trigger,
                },
            );
        }
        Some(profile) => {
            let _ = restore_and_record(app, &profile, trigger);
        }
    }
}

/// Moves the profile's windows, appends the outcome to the activity log, and
/// emits `activity-added`. Shared by the manual command and automation.
pub fn restore_and_record(
    app: &AppHandle,
    profile: &LayoutProfile,
    trigger: RestoreTrigger,
) -> Result<RestoreReport, String> {
    let targets: Vec<RestoreTarget> = profile
        .windows
        .iter()
        .map(RestoreTarget::from_window)
        .collect();

    let started = Instant::now();
    let result = {
        let _guard = RESTORE_LOCK.lock().unwrap_or_else(PoisonError::into_inner);
        platform::restore_windows(&targets)
    };
    let duration_ms = started.elapsed().as_millis() as u64;

    let mut params = Map::new();
    params.insert("name".to_string(), Value::from(profile.name.clone()));
    if let Some(key) = &profile.name_key {
        params.insert("nameKey".to_string(), Value::from(key.clone()));
    }

    match result {
        Ok(result) => {
            let report = RestoreReport {
                profile_id: profile.id.clone(),
                profile_name: profile.name.clone(),
                profile_name_key: profile.name_key.clone(),
                trigger,
                restored: result.restored,
                skipped: result.skipped,
                failed: result.failed,
                duration_ms,
            };
            params.insert("restored".to_string(), Value::from(report.restored));
            params.insert("skipped".to_string(), Value::from(report.skipped));
            params.insert("durationMs".to_string(), Value::from(duration_ms));

            let clean = report.skipped == 0;
            record(
                app,
                ActivityEntry {
                    id: new_id(),
                    kind: "restore".to_string(),
                    title: String::new(),
                    title_key: Some(
                        if clean {
                            "activity.log.restored"
                        } else {
                            "activity.log.restoredWithSkips"
                        }
                        .to_string(),
                    ),
                    detail: String::new(),
                    detail_key: Some("activity.log.restoreDetail".to_string()),
                    detail_params: Some(Value::Object(params)),
                    at: Some(now_ms()),
                    time_key: None,
                    status: if clean { "ok" } else { "warn" }.to_string(),
                    trigger: Some(trigger),
                    report: Some(report.clone()),
                },
            );
            Ok(report)
        }
        Err(error) => {
            params.insert("error".to_string(), Value::from(error.clone()));
            record(
                app,
                ActivityEntry {
                    id: new_id(),
                    kind: "restore".to_string(),
                    title: String::new(),
                    title_key: Some("activity.log.restoreFailed".to_string()),
                    detail: String::new(),
                    detail_key: Some("activity.log.restoreFailedDetail".to_string()),
                    detail_params: Some(Value::Object(params)),
                    at: Some(now_ms()),
                    time_key: None,
                    status: "error".to_string(),
                    trigger: Some(trigger),
                    report: None,
                },
            );
            Err(error)
        }
    }
}

/// The entry is emitted even when it cannot be saved, so the UI still shows
/// what just happened.
fn record(app: &AppHandle, entry: ActivityEntry) {
    if let Err(error) = app
        .state::<AppStore>()
        .lock()
        .append_activity(entry.clone())
    {
        eprintln!("WindowAnchor: {error}");
    }
    let _ = app.emit("activity-added", entry);
}

#[cfg(test)]
mod tests {
    use super::*;

    const DEBOUNCE: Duration = Duration::from_millis(1000);

    fn ms(start: Instant, offset: u64) -> Instant {
        start + Duration::from_millis(offset)
    }

    #[test]
    fn burst_fires_once_after_the_last_event_settles() {
        let start = Instant::now();
        let mut debouncer = Debouncer::default();

        debouncer.observe(DisplayEvent::DisplayChanged, start);
        debouncer.observe(DisplayEvent::WorkAreaChanged, ms(start, 600));
        assert_eq!(debouncer.take_due(ms(start, 1200), DEBOUNCE), None);

        assert_eq!(
            debouncer.take_due(ms(start, 1600), DEBOUNCE),
            Some(RestoreTrigger::Display)
        );
        assert_eq!(debouncer.take_due(ms(start, 5000), DEBOUNCE), None);
        assert_eq!(debouncer.remaining(ms(start, 5000), DEBOUNCE), None);
    }

    #[test]
    fn nothing_fires_while_asleep_and_wake_wins() {
        let start = Instant::now();
        let mut debouncer = Debouncer::default();

        debouncer.observe(DisplayEvent::DisplaysOff, start);
        debouncer.observe(DisplayEvent::DisplayChanged, ms(start, 100));
        assert_eq!(debouncer.take_due(ms(start, 9000), DEBOUNCE), None);

        debouncer.observe(DisplayEvent::DisplaysOn, ms(start, 10_000));
        debouncer.observe(DisplayEvent::DisplayChanged, ms(start, 10_200));
        assert_eq!(debouncer.take_due(ms(start, 11_000), DEBOUNCE), None);
        assert_eq!(
            debouncer.take_due(ms(start, 11_200), DEBOUNCE),
            Some(RestoreTrigger::Wake)
        );
    }

    #[test]
    fn display_on_without_prior_off_is_not_a_wake() {
        let start = Instant::now();
        let mut debouncer = Debouncer::default();

        debouncer.observe(DisplayEvent::DisplaysOn, start);
        debouncer.observe(DisplayEvent::Resumed, start);
        assert_eq!(debouncer.take_due(ms(start, 5000), DEBOUNCE), None);
    }

    #[test]
    fn postpone_restarts_the_quiet_period() {
        let start = Instant::now();
        let mut debouncer = Debouncer::default();

        debouncer.observe(DisplayEvent::WorkAreaChanged, start);
        debouncer.postpone(ms(start, 900));
        assert_eq!(debouncer.take_due(ms(start, 1500), DEBOUNCE), None);
        assert_eq!(
            debouncer.take_due(ms(start, 1900), DEBOUNCE),
            Some(RestoreTrigger::WorkArea)
        );
    }
}
