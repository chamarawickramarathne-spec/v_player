# AGENTS_PLAN - Remove Non-Functional Language Setting (Build 18 / v1.0.4)

## Goal
Remove the dead Language setting from Settings > General. The dropdown was non-functional - nothing reads `settings.language` (entire UI is hardcoded English).

## Root Cause
- `AppSettings.language` exists in Rust struct, TS interface, store default, and a SettingsPanel `<select>`, but no code consumes it for translation.

## Plan
1. Remove `language` from `AppSettings` struct + `Default` in `src-tauri/src/lib.rs`.
2. Remove `language` from `AppSettings` in `src/types/index.ts`.
3. Remove `language` from `defaultSettings` in `src/stores/settingsStore.ts`.
4. Remove Language label/select block in `src/components/Settings/SettingsPanel.tsx`.
5. Version bump 1.0.3 -> 1.0.4 (`package.json`, `Cargo.toml`, `Cargo.lock`, `tauri.conf.json`).
6. Docs: `AGENTS.md` MOD 18, `CHANGELOG.md`, `medial_support.txt`.
7. Build: `.\scripts\build.ps1` -> `release/VPlayer-Setup-x64.exe`.
8. Commit + push + GitHub release v1.0.4 with asset.

## Not Changed
- `tauri.conf.json` `languages` (NSIS installer UI) - unrelated.
- `v-player-android/**` `language` (track metadata) - unrelated.
- No settings.json migration: serde ignores unknown `language` key.

## Status
- Steps 1-6 DONE: all 4 code locations cleaned, version 1.0.4, docs updated. `tsc` and `cargo check` clean.
- Step 7 PENDING: `.\scripts\build.ps1`.
- Step 8 PENDING: commit/push/release v1.0.4.
