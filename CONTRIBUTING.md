# Contributing to WindowAnchor

## Before you start

- Read [docs/architecture.md](docs/architecture.md) for the platform model.
- Open an issue for a behavior change before writing a large patch.
- Keep the product local-first. Do not add telemetry, accounts, or a network
  dependency without a design discussion.

## Development setup

```powershell
npm install
npm run tauri dev
```

For UI-only work:

```powershell
npm run dev
```

The browser build uses mock displays and windows. The Tauri build uses the real
Windows desktop.

## Checks

Run these before opening a pull request:

```powershell
npm run check
npm run build
npm run qa:i18n
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

For visual changes, include a screenshot at 1440×920 and one narrow width. Test the
capture dialog, a window selection, the command palette, and the Rules and Activity
views. For text changes, check English, Korean, Simplified Chinese, and Japanese.

## Commit style

Use Conventional Commits:

```text
feat(canvas): add per-display focus
fix(windows): match windows by process path before title
docs(architecture): document macOS accessibility bridge
```

Keep commits focused. Do not commit generated build output, local screenshots, or
machine-specific paths.

## Platform notes

### Windows

- Test with at least one 100% display. Mixed-DPI testing is strongly preferred.
- State the display count, resolutions, and scales in the pull request.
- Do not call Win32 from the frontend. Put platform code under
  `src-tauri/src/platform/`.

### macOS

- The Accessibility API requires a user-granted permission.
- Build and test on macOS; the Windows host cannot validate the AppKit bridge.
- Do not claim macOS support until the capture, restore, and permission onboarding
  flows have been tested on a real Mac.

## License

By contributing, you agree that your contribution is licensed under
GPL-3.0-or-later. See [LICENSE](LICENSE).
