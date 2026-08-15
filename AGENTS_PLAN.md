# AGENTS_PLAN - One-Click Update Root-Cause Fix + Verification (Build 21 / v1.0.7, Build 22 / v1.0.8)

## Goal
Fix the actual updater bug (update detection never worked) and prove the one-click flow live.

## Root cause (Build 20 test exposed it)
`UpdateInfo`/`UpdateProgress` in `updater.rs` had `#[serde(rename_all = "camelCase")]` -> IPC delivered camelCase fields, but the entire frontend reads snake_case (`has_update`, `latest_version`, `download_url`, ...). So `has_update` was always undefined -> app ALWAYS said "Up to date". Present since Build 14; this is the original "update not updating" bug. GitHub API was confirmed healthy (returns v1.0.6, rate limit 30/60).

## Status (Build 20 - complete)
- v1.0.6 test release done; app kept saying "Up to date - v1.0.5" -> exposed the bug above.

## Plan - Build 21 (v1.0.7, the FIX)
- [x] Remove both `#[serde(rename_all = "camelCase")]` in `updater.rs` (wire format becomes snake_case, matching TS + rest of repo).
- [x] `updaterStore.ts` `oneClickUpdate`: show error toast when check FAILED instead of false "Up to date".
- [x] Version 1.0.6 -> 1.0.7 (package.json, Cargo.toml, Cargo.lock, tauri.conf.json).
- [x] Docs: AGENTS.md MOD 21, CHANGELOG.md Build 21.
- [ ] Build `scripts/build.ps1`, commit, push, release v1.0.7.
- User manually installs `release\VPlayer-Setup-x64.exe` (v1.0.7) - installed v1.0.5 cannot self-update.

## Plan - Build 22 (v1.0.8, verification release)
- Version bump 1.0.7 -> 1.0.8 (no code change), build, commit, release. IN PROGRESS.
- Verify in v1.0.7: badge shows "Download v1.0.8" -> one click -> download -> auto-install -> guided wizard -> v1.0.8 -> "Up to date - v1.0.8" toast.
