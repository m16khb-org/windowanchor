# Architecture

## Product goal

WindowAnchor keeps a user's desktop arrangement stable across one display, many
displays, and changing resolutions or DPI scales. The product has four jobs:

1. identify displays and windows;
2. store a layout with enough context to survive a display change;
3. match saved windows to live windows at restore time;
4. explain what happened when a window cannot be restored.

The UI is a visual editor over that model, not a separate source of truth.

## System shape

```text
React UI (Tauri WebView)
        │  commands + events
        ▼
Tauri command layer (src-tauri/src/lib.rs)
        │
        ▼
platform (src-tauri/src/platform)          store (src-tauri/src/store.rs)
   ├─ windows: Win32 + DWM + watcher       automation (src-tauri/src/automation.rs)
   └─ darwin:  AppKit + Accessibility API (planned)
        │
        ▼
core model: Display, WindowInfo, LayoutProfile, MonitorConfiguration, RestoreReport
```

The frontend never calls Win32 directly. All platform behavior goes through Tauri
commands so the browser preview can use mock data and the macOS implementation can
reuse the same UI.

## Data model

### Display

```ts
type Display = {
  id: string;        // Windows: \\.\DISPLAY1 (adapter output); windows point here via monitorId
  deviceId: string;  // Windows: monitor device interface path; macOS: CGDisplay UUID
  name: string;
  x: number;         // virtual desktop coordinates
  y: number;
  width: number;     // pixels on Windows, points on macOS
  height: number;
  scaleFactor: number;
  primary: boolean;
};
```

A display identity must not depend only on the port or the index. The display
configuration ID (`src-tauri/src/display.rs`) is an FNV-1a hash, `cfg-` plus 16 hex
digits, over the sorted per-display tuples
`(deviceId or id, width x height, scale %, primary, x,y)`. Display order does not
change it; resolution, scale, arrangement, and a different monitor do.

### WindowInfo

```ts
type WindowInfo = {
  id: number;              // HWND on Windows; opaque AX handle ID on macOS
  pid: number;
  processPath: string;
  processName: string;
  className: string;
  title: string;
  rect: Rect;              // outer window rect, used for restore
  visualRect: Rect | null; // DWM extended frame bounds, used for drawing
  state: "normal" | "minimized" | "maximized";
  monitorId: string | null;
};
```

The visual rect and the restore rect are separate. DWM's extended frame bounds
exclude the invisible resize border and look correct on the canvas; `SetWindowPos`
needs the outer rect to reproduce the window geometry.

### LayoutProfile

A named snapshot of displays and windows at capture time. The backend stores the
`configurationId` of the displays it was captured on.

### MonitorConfiguration

One record per display configuration ever seen: its displays, `firstSeen`,
`lastSeen`, and the `profileId` that automatic restore uses for it. Capturing a new
layout assigns it to its configuration; the layout menu can reassign.

### Restore target

A restore target carries both the live window id and the identity fields needed to
re-match after the app restarts or a window is recreated:

```ts
type RestoreTarget = {
  id: number;
  processPath: string;
  processName: string;
  className: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  state: "normal" | "minimized" | "maximized";
};
```

## Windows implementation

### Display enumeration

`list_displays` uses `EnumDisplayMonitors` and `GetMonitorInfoW` for bounds, the
primary flag, and the adapter output name (`MONITORINFOEXW.szDevice`), which is the
key used to associate a window with a display. `GetDpiForMonitor(MDT_EFFECTIVE_DPI)`
gives the scale. `EnumDisplayDevicesW(szDevice, EDD_GET_DEVICE_INTERFACE_NAME)` gives
the attached monitor's device interface path, which is the `deviceId`.

### Window enumeration

`src-tauri/src/platform/windows.rs` uses:

- `EnumWindows` for top-level windows;
- `IsWindowVisible`, `GetWindowTextLengthW`, `GetWindowTextW`, `GetClassNameW`;
- `GetWindowLongW(GWL_EXSTYLE)` to drop tool windows and no-activate windows;
- `GetWindowThreadProcessId`, `OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)`,
  `QueryFullProcessImageNameW` for process identity;
- `GetWindowRect` for the restore rect;
- `DwmGetWindowAttribute(DWMWA_EXTENDED_FRAME_BOUNDS)` for the visual rect;
- `MonitorFromWindow` and `GetMonitorInfoW` for the display association;
- `IsIconic`/`IsZoomed` for minimized and maximized state.

Filtered out: the app's own windows, shell surfaces (`Progman`, `WorkerW`,
`Shell_TrayWnd`, `Shell_SecondaryTrayWnd`), empty titles, zero-sized windows, and
UWP frame hosts for now.

### Restore

The restore engine re-enumerates current windows and selects a target in this order:

1. **Original HWND**, when the process and window class still match. This is the
   normal same-session path and prevents two windows of the same app from being
   swapped.
2. Otherwise, process path (+100) or process name (+40), window class (+20),
   exact title (+30) or prefix (+15), matching state (+5), and the old HWND (+10).
   The score must be at least 60.
3. If two candidates tie for the best score, the target is skipped as
   `ambiguous_window` rather than moving the wrong window.

Before moving, the target rectangle must intersect a current display. A target
outside every monitor is reported as `target_off_screen`. Minimized windows use
their normal placement rectangle instead of the minimized off-screen coordinates.

`SetWindowPos` is called with `SWP_NOZORDER | SWP_NOACTIVATE | SWP_SHOWWINDOW`.
The result is verified with `GetWindowRect`; if the app ignored the geometry,
`SetWindowPlacement` is tried as a fallback. A still-mismatched window is reported
as `move_ignored`. Minimized windows are restored before moving and minimized
again afterward; maximized windows are moved to their normal rectangle and then
maximized. The captured relative stacking order is applied last with
`SWP_NOACTIVATE`.

`restore_layout` builds the targets from the profile in Rust, runs off the main
thread, and serializes with automatic restores. Every restore produces a
`RestoreReport` (`trigger`, `restored`, `skipped`, `failed[]` with title, process,
and reason, `durationMs`) that is appended to the activity log and emitted as
`activity-added`.

The Windows process sets **Per-Monitor V2 DPI awareness** before Tauri creates any
window, so `GetWindowRect` and `SetWindowPos` use the same physical-pixel space as
the monitor inventory.

### Known Windows limits

- Elevated windows cannot be moved by a non-elevated process. The planned helper
  process will run at the same integrity level and communicate over a named pipe.
- UWP windows live inside `ApplicationFrameHost`; the real app window must be
  resolved before it can be moved.
- Full-screen exclusive games and some custom-rendered windows do not accept
  `SetWindowPos`.
- Virtual desktop moves need undocumented COM interfaces; the first version will
  record the desktop and skip cross-desktop moves.
- Mixed-DPI coordinates are only stable when the process is per-monitor v2 DPI
  aware. The Windows backend must set its DPI awareness before any window is
  created and record the scale with each display.

## macOS implementation (planned)

macOS needs a different access path:

- `AXUIElementCreateApplication(pid)` and `kAXWindowsAttribute` enumerate windows.
- `kAXPositionAttribute` and `kAXSizeAttribute` read and write geometry.
- `AXIsProcessTrustedWithOptions` checks and prompts for Accessibility permission.
- `NSScreen`/`CGDisplay` provide display bounds and `backingScaleFactor`.
- `CGDisplayRegisterReconfigurationCallback` and
  `NSApplicationDidChangeScreenParametersNotification` detect display changes.

The app must be non-sandboxed and distributed outside the Mac App Store because
Accessibility control and GPL-3.0 are incompatible with the store's sandbox and
terms. The first launch flow explains the permission and deep-links to
`System Settings → Privacy & Security → Accessibility`.

Some apps expose a limited accessibility tree. Chromium, Electron, and games may
move but not report every attribute. The restore report must distinguish
"permission denied", "attribute unsupported", and "window not found".

## Automation

`src-tauri/src/automation.rs` runs one background thread for the life of the app.

- Windows event source: a hidden top-level window on its own thread. Broadcasts
  only reach top-level windows, so it is not a message-only window. It handles
  `WM_DISPLAYCHANGE`, `WM_SETTINGCHANGE(SPI_SETWORKAREA)`, `WM_POWERBROADCAST`
  (`PBT_APMSUSPEND`, `PBT_APMRESUME*`), and `GUID_CONSOLE_DISPLAY_STATE` power
  setting notifications for display off/on.
- Polling fallback: every 2 seconds the display configuration ID is recomputed. A
  change records the configuration, emits `configuration-changed`, and counts as a
  display event. The first poll only records the startup configuration.
- Debounce: events reset a quiet timer (`settings.debounceMs`, 500 ms–3 s). Nothing
  fires while the machine or its displays are asleep; display-on or resume after
  sleep turns the pending trigger into `wake`. Trigger priority is
  `wake > display > workArea`.
- When the timer expires and the user is not in a move/size loop
  (`GetGUIThreadInfo` → `GUI_INMOVESIZE`), the backend selects the profile for the
  current configuration: the assigned profile, else the newest profile captured on
  it. With no profile it records an `activity.log.noLayout` skip. With
  `confirmRestore` it emits `restore-confirm` and the UI asks first. Otherwise it
  restores and records the report.
- The app never restores its own windows (they are excluded from enumeration).
- Automation stops when the app exits. A tray icon that keeps it running is M5.

macOS will use the CoreGraphics reconfiguration callback, the AppKit
screen-parameter notification, and the workspace wake notification.

## Storage

`src-tauri/src/store.rs` owns one versioned JSON file:

- Windows: `%APPDATA%\WindowAnchor\store.json`
- macOS: `~/Library/Application Support/WindowAnchor/store.json`

```ts
type StoreData = {
  version: 1;
  profiles: LayoutProfile[];          // newest first
  rules: AppRule[];
  settings: { autoRestore; confirmRestore; debounceMs; showGrid };
  activity: ActivityEntry[];          // newest first, capped at 500
  monitorConfigurations: MonitorConfiguration[];
};
```

- Every mutation is applied to a copy, written to `store.json.tmp`, flushed, and
  renamed over `store.json`; the previous file is copied to `store.json.bak` first.
  Memory changes only after the write succeeds.
- An unreadable `store.json` is moved to `store.corrupt-<ms>.json` and the backup is
  loaded. A store with a newer `version` is loaded read-only and never overwritten.
- The UI reads and writes only through Tauri commands (`load_state`,
  `save_profile`, `delete_profile`, `assign_profile`, `save_rules`,
  `save_settings`, `append_activity`, `reset_store`); each returns the full state.
- On first launch the UI migrates `windowanchor.profiles`, `windowanchor.autoRestore`,
  and `windowanchor.grid` from WebView local storage into the store and deletes them.
  Theme and language remain WebView preferences.
- If event history outgrows a few thousand entries, it moves to SQLite. Profiles
  and rules are exported as human-readable JSON.

## Security and privacy

- No network requests by default, no telemetry, no accounts.
- Accessibility permission is used only to enumerate and move app windows.
- Window titles and process paths stay local.
- The elevated helper, when added, accepts only signed, structured restore
  requests from the same user session.
- Release artifacts publish SHA-256 checksums.

## Internationalization

The React shell initializes `i18next` with `react-i18next` in `src/i18n/index.ts`.
English, Korean, Simplified Chinese, and Japanese resources live in that file.

- Detection: stored `windowanchor.language`, then `navigator.language`, then English.
- Persistence: `windowanchor.language` in local storage.
- Document metadata: `document.documentElement.lang` follows the active language.
- Components use `useTranslation()` and never hardcode visible UI copy.
- Sample profiles, activity entries, and rule targets store translation keys, not
  translated text, so switching language updates them immediately.
- Activity entries, including those the backend writes, store translation keys
  and parameters (`titleKey`, `detailKey`, `detailParams`) and an epoch-ms `at`, so
  they follow the current language. Window titles, process paths, and application
  names are user data and are not translated.
- Both the top-bar language menu and the Settings page call `i18n.changeLanguage`.

Adding a language requires a resource object, a `LANGUAGES` entry, and a QA pass for
long strings in the left rail, top bar, and capture dialog.

## UI system

The React shell uses **Fluent UI React v9**, Microsoft's Windows 11 design system,
as the component foundation. `FluentProvider` supplies `webLightTheme` or
`webDarkTheme`; the Settings page stores `windowanchor.theme` as `system`, `light`,
or `dark`. Fluent provides buttons, switches, badges, dialogs, menus, inputs, and
checkboxes with Windows focus, keyboard, and contrast behavior.

The canvas is the only large custom surface. It uses Fluent tokens for monitor
frames, window cards, strokes, text, and shadows. Tailwind utilities are kept for
layout only; their theme colors are re-declared on `.fui-FluentProvider` so the
same classes resolve against the active Fluent theme. The visual reference is the
PowerToys FancyZones layout editor, not a web dashboard.

## Testing strategy

- **Rust unit tests**: display configuration ID, store persistence/backup/version
  guard/profile selection, debounce and wake handling, window match scoring.
- **Windows integration tests**: create test windows in a helper process, capture,
  move, restore, assert geometry.
- **Frontend**: TypeScript checks, component tests for the canvas and dialogs,
  Playwright screenshots against the Vite dev server with mock data.
- **Manual platform QA**: one display, two identical displays, two mixed-resolution
  displays, 100%/125%/150% scales, dock/undock, sleep/resume, RDP.
