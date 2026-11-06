<p align="center">
  <img src="public/favicon.svg" width="72" alt="WindowAnchor mark" />
</p>

<h1 align="center">WindowAnchor</h1>

<p align="center">
  <strong>Window layouts that stay put.</strong><br />
  Remember and restore app window positions across displays, resolutions, and DPI scales.
</p>

<p align="center">
  <img alt="Status: early preview" src="https://img.shields.io/badge/status-early%20preview-f5a524" />
  <img alt="Platform: Windows first" src="https://img.shields.io/badge/platform-Windows%20first-2dd4bf" />
  <img alt="License: GPL-3.0-or-later" src="https://img.shields.io/badge/license-GPL--3.0--or--later-8b9bad" />
</p>

![WindowAnchor desktop canvas](docs/screenshots/overview.png)

WindowAnchor is an open-source desktop layout manager. It captures the windows you
care about, stores their geometry per display configuration, and puts them back
when your monitors change. The interface is a Fluent layout editor: displays are
drawn to scale, windows are selectable, and every restore explains what matched,
what was skipped, and why.

> **Status: early preview.** The repository ships the Tauri + React shell, the
> Windows window inventory, capture, restore, a persistent local store, and
> automatic restore after display changes and wake. The tray, launch at login,
> and macOS support are the next milestones. See the roadmap below.

## Why another window manager?

Most tools solve one of three problems:

- **Snapping and zones**: FancyZones, AquaSnap, Rectangle.
- **Automatic layout restore after monitor changes**: PersistentWindows.
- **Named layout snapshots**: PowerToys Workspaces, DisplayFusion.

WindowAnchor aims to combine all three in one local-first product with a visual
editor: per-app rules, monitor-configuration-aware profiles, automatic restore,
and a clear restore report. It is built for people who dock and undock, switch
between home and office desks, and use mixed resolutions or scales.

## Features

### Available now

- **Fluent layout editor** with per-display focus, zoom, and a live window inventory.
- **Per-layout actions**: use the `…` menu on a layout card to delete it or to make
  it the layout for the current display setup.
- **Capture dialog** with window selection, display summary, and layout naming.
- **Windows window enumeration** through Win32 (`EnumWindows`, `GetWindowPlacement`,
  DWM frame bounds, monitor identity).
- **Display identity** from `EnumDisplayMonitors` and `EnumDisplayDevices`: monitor
  device ID, resolution, scale, primary flag, and position form a display
  configuration ID.
- **Best-effort restore** with process path, window class, and title matching.
- **Persistent store** in `%APPDATA%\WindowAnchor\store.json`: profiles, rules,
  settings, display configurations, and activity. Versioned JSON, atomic writes,
  and a backup copy.
- **Automatic restore** after a display change, work-area change, resume, or
  display power-on. Events are debounced (500 ms–3 s), restore waits while you
  drag a window, and "Confirm before restore" asks first.
- **Restore report**: every restore records its trigger, duration, and each
  skipped window with a reason in the Activity view.
- **Fluent UI React v9** controls, light/dark/system themes, and a FancyZones-style
  layout editor.
- **Four interface languages**: English, 한국어, 简体中文, 日本語, with system-language
  detection and a per-user preference.
- **Keyboard-first**: `Ctrl K` command palette, `Ctrl Shift C` capture.

### Planned

- App rules that move matched windows (rules are stored; the rule engine is not
  implemented yet).
- macOS support through the Accessibility API (`AXUIElement`).
- Tray menu, launch at login, import, and an elevated helper for admin windows.
- Signed Windows installer and notarized macOS DMG.

## Platform support

| Platform | Status | Window API | Notes |
|---|---|---|---|
| Windows 10/11 | Early preview | Win32 + DWM | Primary development target. Mixed-DPI behavior is tested manually. |
| macOS 13+ | Planned | Accessibility API (`AXUIElement`) | Requires the user to grant Accessibility permission. Direct distribution only. |
| Linux | Not planned | — | Out of scope for the first product. |

## Development

### Prerequisites

- **Node.js** 22 or newer
- **Rust** stable with the MSVC toolchain
- **Microsoft C++ Build Tools** with the "Desktop development with C++" workload
- **Microsoft Edge WebView2** (preinstalled on Windows 10 1803+ and Windows 11)

Tauri's official prerequisites are at
<https://tauri.app/start/prerequisites/>.

### Run the app

```powershell
npm install
npm run tauri dev
```

The frontend alone runs in a browser with realistic mock data:

```powershell
npm run dev
```

This is useful for UI work. The browser build never calls Win32; the live desktop
inventory appears only in the Tauri shell.

### Checks

```powershell
npm run check        # TypeScript
npm run build        # Production frontend build
npm run qa:i18n      # Language route and missing-key QA (dev server running)
npm run qa:ui        # UI screenshots (dev server running)
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## Project structure

```text
src/                     React UI
  Root.tsx               FluentProvider, light/dark/system theme
  components/            Shell, canvas, inspector, dialogs, views
  i18n/                  English, Korean, Simplified Chinese, Japanese
  lib/                   Types, mock data, Tauri bridge
  hooks/                 Resize observer
src-tauri/               Rust backend
  src/model.rs           Display, window, profile, store, restore DTOs
  src/display.rs         Display configuration ID
  src/store.rs           Versioned JSON store in the app data directory
  src/automation.rs      Display/wake watcher loop, debounce, restore report
  src/platform/          Platform implementations
    windows.rs           Win32 displays, windows, restore, display watcher
  src/lib.rs             Tauri commands and startup
docs/                    Architecture and screenshots
scripts/                 UI QA and screenshot helpers
```

## How restore works

1. Enumerate visible top-level windows and read their window rect, DWM visual
   rect, state, process path, class, and monitor.
2. Store the target geometry with the display's stable identity and scale.
3. On restore, prefer the original window handle when its process and class still
   match. Fall back to process path, class, and title only when the window was
   recreated. If several windows match equally, skip the target rather than move
   the wrong window.
4. Move the matched window with `SetWindowPos`, restore minimized windows first,
   and reapply maximized state last. Restore the captured relative stacking order.
5. Report `restored` and `skipped` counts, each skipped window with a reason, the
   trigger, and the duration. A missing window never blocks the rest of the layout.

Only windows stored in the active layout are moved. Other visible windows stay
where they are; the Inspector shows how many windows are currently open versus how
many are part of the layout.

Automatic restore picks the layout assigned to the current display configuration,
or else the newest layout captured on it. If no layout matches, the Activity view
records a skip instead of guessing. Automation runs while the WindowAnchor window
is open; closing it stops automation until the tray arrives in M5.

## Design direction

WindowAnchor uses **Fluent UI React v9**, Microsoft's Windows 11 design system, so
it feels at home next to PowerToys and Windows Settings rather than like a web
dashboard.

- Segoe UI Variable typography, Fluent color tokens, rounded cards, and standard
  Windows controls.
- Light theme by default, with dark theme and system-theme following.
- A FancyZones-style layout editor: neutral monitor frames, a subtle grid, and
  window cards with app accents.
- Fluent dialogs, menus, switches, badges, and command surfaces. The canvas is the
  only large custom surface.
- The UI is keyboard-operable and reduced-motion aware. Accessibility and contrast
  checks are part of the QA pass.

The PowerToys FancyZones editor is the main visual reference. The product does not
copy PowerToys code or assets.

## Internationalization

The interface ships with English, Korean, Simplified Chinese, and Japanese.
Translations live in `src/i18n/index.ts`; the app detects the system language on
first launch and stores the user's choice in `windowanchor.language`. The language
menu is in the top bar and in Settings.

- UI copy must go through `t()`; do not add hardcoded visible strings.
- Sample profiles, sample activity, and sample rule targets use translation keys
  so they change language immediately.
- Window titles, process paths, and app names stay in their original language.
- Add a language by extending the `resources` object and the `LANGUAGES` list in
  `src/components/LanguageMenu.tsx`.

## Roadmap

| Milestone | Scope | Status |
|---|---|---|
| M0 · Scaffold | Tauri + React shell, design system, CI, docs | Done |
| M1 · Windows inventory | Displays, windows, capture dialog, manual restore | Done |
| M2 · Persistence | Profiles, rules, monitor configurations in app data | Done |
| M3 · Automation | Display-change and wake triggers, debounce, restore report | Done |
| M4 · macOS | Accessibility bridge, permissions onboarding, DMG packaging | Planned |
| M5 · Product polish | Tray, login item, updater, signed installers, import/export | Planned |

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a
pull request. UI changes should include a screenshot or a short recording, and
platform changes should state which display configuration was tested.

## License

WindowAnchor is licensed under the **GNU General Public License v3.0 or later**
(`GPL-3.0-or-later`). See [LICENSE](LICENSE).

Copyright (C) 2026 m16khb

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
