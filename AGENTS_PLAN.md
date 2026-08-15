# AGENTS_PLAN - Truly One-Click Update (Build 19 / v1.0.5)

## Goal
Fix "click update button not updating" (2nd report) - make clicking Update fully update the app in one click.

## Diagnosis (verified live on this machine)
- Check works: app startup consumed exactly 1 GitHub API request (`rate_limit` delta).
- Download works: clicking Update on the installed v1.0.3 downloaded the full 32 MB `VPlayer-Setup-x64.exe` into `%APPDATA%\com.vplayer.desktop\updates\`.
- The failure was downstream UX: after download the app required a second "Install & Restart" click, then launched a bare NSIS wizard and exited. Missed second click or SmartScreen blocking the unsigned installer = "Update did nothing."

## Plan
1. `src-tauri/src/updater.rs`
   - `check_for_update` + `download_update` -> `async` + `spawn_blocking` (no main-thread freeze during network calls, so clicks aren't swallowed).
   - New command `get_downloaded_installer` -> Option<String> path of previously downloaded setup.
   - `install_update`: verify file exists, launch installer, show guided tauri-plugin-dialog ("If Windows shows a security warning, click More info -> Run anyway") then `app.exit(0)`.
2. `src-tauri/src/lib.rs` - register `get_downloaded_installer`.
3. `src/stores/updaterStore.ts`
   - Auto-install after download completes (2s delay + "launching installer..." toast) - ONE click end-to-end.
   - `detectDownloadedUpdate()` -> set ready-to-install state from `get_downloaded_installer`.
   - Error feedback on download/install failures.
4. `src/App.tsx` - call `detectDownloadedUpdate()` at startup.
5. Version bump 1.0.4 -> 1.0.5.
6. Docs: `AGENTS.md` MOD 19, `CHANGELOG.md` Build 19.
7. Build + commit/push + GitHub release v1.0.5.

## Status
- Steps 1-6 DONE: updater.rs async + guided dialog + get_downloaded_installer; lib.rs registration; store auto-install + detect; App.tsx startup; version 1.0.5; docs. `tsc` + `cargo check` clean.
- Step 7 PENDING: build + release v1.0.5.
