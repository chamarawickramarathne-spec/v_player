# AGENTS_PLAN - One-Click Update Verification Release (Build 20 / v1.0.6)

## Goal
Release v1.0.6 (version-only bump, no code change) so the installed v1.0.5 app can verify the one-click update flow end-to-end: click Update -> download -> auto-launch installer -> guided dialog -> install v1.0.6 -> title bar shows v1.0.6 -> Update button shows "Up to date" toast.

## Status (Build 19 - complete)
- Build 19 (v1.0.5) DONE and released: updater.rs async + guided dialog + get_downloaded_installer; lib.rs registration; store auto-install + detectDownloadedUpdate; App.tsx startup; docs.
- Verified: v1.0.5 installer attached to GitHub release, `releases/latest` returns v1.0.5.
- Installed app is v1.0.5 (user installed it).

## Status (Build 20)
- Version bumped 1.0.5 -> 1.0.6 in package.json, Cargo.toml, Cargo.lock, tauri.conf.json. DONE.
- Docs AGENTS.md MOD 20 / CHANGELOG.md Build 20. DONE.
- PENDING: build via `scripts/build.ps1`, commit + push, GitHub release v1.0.6.
- After release: user clicks Update in v1.0.5 to verify one-click flow.

## Verify
- Title bar shows v1.0.6 after install.
- Clicking Update again shows "Up to date · v1.0.6" toast.
- `releases/latest` returns v1.0.6 with VPlayer-Setup-x64.exe attached.

---
## Previous plan (Build 19) - completed
- updater.rs async check/download + get_downloaded_installer + guided install dialog.
- store: auto-install after download, detectDownloadedUpdate.
- App.tsx startup detect. Version 1.0.5. Docs. Build + release v1.0.5 (DONE, commit 5330021).
