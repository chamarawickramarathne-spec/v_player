# AGENTS_PLAN - Update Feature (Build 14)

## Goal
Add a GIT-based update feature to the V Player desktop app per global rules:
- Check GitHub releases for newer versions.
- Download installer (fixed name, no version) and launch the NSIS wizard.
- App exits after launching installer.

## Plan
1. Git repo init + remote `chamarawickramarathne-spec/v_player`. ✅ Done
2. `.gitignore` extended (Android build output, release/). ✅ Done
3. `scripts/build.ps1` -> fixed-name installer `release/VPlayer-Setup-x64.exe`. ✅ Done
4. Rust `updater.rs` (check/download/install + get_app_version), Cargo deps `semver`, `ureq`, register in `lib.rs`. ✅ Done
5. `updaterStore.ts` Zustand store with progress channel. ✅ Done
6. `UpdatePanel.tsx` (About tab) + `UpdateBadge.tsx` (title bar). ✅ Done
7. Wire into `App.tsx` (startup check + badge + controlled settings tab) and `SettingsPanel.tsx`. ✅ Done
8. Docs: `AGENTS.md`, `AGENTS_PLAN.md`, `medial_support.txt`, `CHANGELOG.md` Build 14.
9. Verify: `npx tsc --noEmit` (clean), `npx vite build` (clean), `npm run tauri build` (running).
10. Commit + push + create GitHub release v1.0.0 with `VPlayer-Setup-x64.exe` asset.

## Status
- Steps 1-9 implemented and verified: `tsc` clean, `vite build` clean, `npm run tauri build` success (3m 42s), app launches, installer renamed to `release/VPlayer-Setup-x64.exe`.
- Committed and pushed to `origin/main`.
- GitHub release **v1.0.0** created with asset `VPlayer-Setup-x64.exe`.
- PENDING (future): bump versions + run `.\scripts\build.ps1` + release for each new version.
