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
platform::Controller
   ├─ windows: Win32 + DWM
   └─ darwin:  cgo + AppKit + Accessibility API (planned)
        │
        ▼
core model: Display, WindowInfo, LayoutProfile, AppRule, RestoreTarget
```

The frontend never calls Win32 directly. All platform behavior goes through Tauri
commands so the browser preview can use mock data and the macOS implementation can
reuse the same UI.

## Data model

### Display

```ts
type Display = {
  id: string;        // Windows: \\.\DISPLAY1 + monitor device ID; macOS: CGDisplay UUID
  name: string;
  x: number;         // virtual desktop coordinates
  y: number;
  width: number;     // pixels on Windows, points on macOS
  height: number;
  scaleFactor: number;
  primary: boolean;
};
```

A display identity must not depend only on the port or the index. Windows uses
`EnumDisplayDevices` monitor IDs plus a geometry fingerprint; macOS uses
`CGDisplayCreateUUIDFromDisplayID` plus a geometry fingerprint. The fingerprint is
`(width, height, scale, primary, relative position)`.

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

A named snapshot of displays, windows, and app rules at capture time. The profile
stores the display configuration it was captured on, not just absolute pixels.

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

The UI currently receives displays from Tauri's `available_monitors()` and
`primary_monitor()`. The Windows platform layer also reads `MONITORINFOEXW.szDevice`
for each window, which is the key used to associate a window with a display. The
next iteration adds `EnumDisplayDevices` monitor device IDs and an EDID-based
fingerprint so a display can be recognized after a port change.

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

The long-running background service will own a hidden message window:

- Windows: `WM_DISPLAYCHANGE`, `WM_SETTINGCHANGE`, `WM_POWERBROADCAST`, and a
  2-second polling fallback.
- macOS: CoreGraphics reconfiguration callback, AppKit screen-parameter
  notification, and workspace wake notification.

Events are debounced for about one second after the display configuration stops
changing. Restore is skipped while the user is dragging or resizing a window, and
the app never restores its own windows.

## Storage

The current scaffold stores profiles in WebView local storage for fast UI work.
The product store will live at:

- Windows: `%APPDATA%\WindowAnchor\`
- macOS: `~/Library/Application Support/WindowAnchor/`

The format is versioned JSON with atomic writes and a backup copy. If event history
grows beyond a few thousand entries, it moves to SQLite. Profiles and rules are
exported as human-readable JSON.

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
- Real activity entries are created in the language active at the time. Window
  titles, process paths, and application names are user data and are not translated.
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

- **Rust unit tests**: geometry normalization, display fingerprint scoring, window
  match scoring, restore validation.
- **Windows integration tests**: create test windows in a helper process, capture,
  move, restore, assert geometry.
- **Frontend**: TypeScript checks, component tests for the canvas and dialogs,
  Playwright screenshots against the Vite dev server with mock data.
- **Manual platform QA**: one display, two identical displays, two mixed-resolution
  displays, 100%/125%/150% scales, dock/undock, sleep/resume, RDP.
