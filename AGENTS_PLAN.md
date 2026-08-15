# AGENTS_PLAN - One-Click Updater + Up-to-Date Feedback (Build 17 / v1.0.3)

## Goal
Fix the confusing "click Update button not updating new version" behavior:
- User was already on latest release (v1.0.2) -> silent re-check, zero feedback.
- Update button was not a one-click flow (only opened Settings > About).

## Root Cause
- `check_for_update` (GitHub `releases/latest`) works correctly; API returns v1.0.2 with asset.
- When up-to-date, `UpdateBadge` click ran a silent `checkForUpdates()` with no visible result.
- When an update existed, the badge only opened Settings -> About; user had to click Download, then Install.

## Plan
1. `src/stores/updaterStore.ts`
   - Add `oneClickUpdate()`: known update -> auto-download; unknown -> check then auto-download if newer; up-to-date -> set feedback.
   - Add `feedback { type, message }` + `clearFeedback()`.
   - Hold download `Channel` in store state (not a local var) so progress events can't be GC-dropped.
2. `src/components/UpdateBadge.tsx`
   - One-click: click checks/downloads/installs directly (no settings trip).
   - Downloading: show spinner + percent on button.
   - Ready: button becomes "Install & Restart".
   - Up-to-date / error: transient toast near title bar, auto-hides ~3s.
3. Version bump 1.0.2 -> 1.0.3 in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`.
4. Docs: `AGENTS.md` MOD 17, `CHANGELOG.md`, regenerate `medial_support.txt`.
5. Build: `.\scripts\build.ps1` -> `release/VPlayer-Setup-x64.exe`.
6. Commit + push + GitHub release v1.0.3 with asset.
7. End-to-end test: installed v1.0.2 detects v1.0.3, one click downloads + installs.

## Status
- Steps 1-4 DONE: updaterStore oneClickUpdate + feedback + channel-in-store; UpdateBadge one-click + spinner/% + toast; updater.rs error stage; version 1.0.3; docs updated.
- Step 5 PENDING: `.\scripts\build.ps1`.
- Steps 6-7 PENDING: commit/push/release v1.0.3, then end-to-end test.
- Verified: `npx tsc --noEmit` clean, `cargo check` clean.

