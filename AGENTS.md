# V Player

**App Modification Memory** - read before making changes. Update this file after every change.

## Overview
V Player is a modern media player for Windows (Tauri v2 + React 19 + TypeScript + Vite) using mpv/libmpv as the media engine. An Android port lives in `v-player-android/`.

## Current Version
- **v1.0.3** - last updated: 2026-08-15 (Build 17)

## Mod Log

### MOD 17 (Build 17) - 2026-08-15 - One-Click Updater + Up-to-Date Feedback
- **Root cause**: User on latest release (v1.0.2) clicked "Update" -> silent re-check, no feedback; looked broken. Button also wasn't one-click (only opened Settings > About).
- `updaterStore.ts`: added `oneClickUpdate()` (known update -> auto-download; else check -> auto-download if newer; up-to-date -> feedback), `feedback {type,message}` + `clearFeedback()`, and now holds the download `Channel` in store state (prevents GC from dropping progress events mid-download).
- `UpdateBadge.tsx`: true one-click flow - click checks/downloads/installs directly (no Settings trip). Shows spinner + % while downloading, becomes "Install & Restart" when ready, and renders a transient toast (auto-hides ~3s) for up-to-date / error / downloaded states. `onOpenUpdates` prop removed.
- `updater.rs`: download thread now sends an `error` stage over the channel on failure (previously swallowed silently).
- `global.css`: added `fadeSlideIn` keyframe (toast animation).
- Version bumped to 1.0.3.

### MOD 16 (Build 16) - 2026-08-15 - Fix: Theme/Accent Color Not Applying
- **Root cause**: `SettingsPanel.tsx` kept settings in local `useState` and only persisted to the backend (`update_settings`); it never wrote to the Zustand `useSettingsStore`. `App.tsx` applies `--accent`/`data-theme` CSS from the store, so color/theme changes never applied. The store was also never loaded from `get_settings` at startup, so saved settings never applied on launch.
- `settingsStore.ts`: added `loadSettings()` action (invokes `get_settings`, writes store).
- `SettingsPanel.tsx`: removed local `useState`; settings now read/written through `useSettingsStore` (single source of truth).
- `App.tsx`: startup now calls `loadSettings()` so persisted theme/accent/volume/hwdec apply immediately.
- Version bumped to 1.0.2.

### MOD 15 (Build 15) - 2026-08-15 - Title Bar Version + Update Button
- Version number now shown next to the "V Player" title in the title bar (`v{appVersion}`).
- Update button placed beside the version number (moved from the right side).
- `UpdateBadge.tsx` repurposed: shows version pill + Update button. Click runs a manual check when up to date; opens Settings -> About when an update is available.
- Removed the right-side update badge (single indicator next to title).
- `App.tsx` startup now calls `loadAppVersion()` so the version displays immediately.
- Version bumped to 1.0.1 (`package.json`, `Cargo.toml`, `Cargo.lock`, `tauri.conf.json`).

### MOD 14 (Build 14) - 2026-08-15 - Update Feature (GIT/GitHub Releases)
- Added GIT-based update feature (desktop only) using GitHub Releases API.
- New `src-tauri/src/updater.rs`: `check_for_update`, `download_update` (background thread + progress channel), `install_update`, `get_app_version`. GitHub source: `chamarawickramarathne-spec/v_player`, asset `VPlayer-Setup-x64.exe`.
- New Cargo deps: `semver = "1"`, `ureq = "2"`.
- New frontend: `src/stores/updaterStore.ts`, `src/components/Settings/UpdatePanel.tsx`, `src/components/UpdateBadge.tsx`.
- Settings About tab now has an Updates panel (check/download/install). Auto-check on startup; badge in title bar when update available.
- Installer now renamed to fixed name `release/VPlayer-Setup-x64.exe` (no version) via `scripts/build.ps1`.
- Git repo initialized, remote `origin` -> `https://github.com/chamarawickramarathne-spec/v_player.git`.
- `.gitignore` extended (Android build output, release/).

### MOD 13 (Build 13) - 2026-07-27
- Removed duplicate Tauri drag-drop listener from PlaylistPanel (was duplicating playlist items).
- File drops handled exclusively by VideoSurface.

## Critical Rules
1. **mpv rendering chain**: `html/body/#root` transparent in CSS; App root transparent when video playing; VideoSurface transparent when playing; `tauri.conf.json` window `transparent: true`.
2. **Format lists sync** across 4 locations: `src/lib/media.ts`, `src/App.tsx`, `src/hooks/useMpv.ts`, `src-tauri/src/file_handler.rs`.
3. **Drag-drop**: use Tauri v2 `getCurrentWebviewWindow().onDragDropEvent()`, never browser DOM `.path`.
4. **State**: Zustand stores only. `addToPlaylist()` never calls `openFile()`.
5. **Backend**: Rust `player.rs` commands are stubs; real playback via `tauri-plugin-libmpv-api` JS.

## Update / Release Workflow
1. Bump versions: `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`.
2. Build: `.\scripts\build.ps1` (runs tsc + vite + tauri build, renames installer to `release/VPlayer-Setup-x64.exe`).
3. Commit and push to git.
4. Create GitHub release tagged `vX.Y.Z` and attach `release/VPlayer-Setup-x64.exe` (name must stay fixed).
5. App checks `releases/latest` on startup; title-bar Update button is one-click (download -> Install & Restart); up-to-date clicks show a transient toast.

## Build Commands
- Typecheck: `npx tsc --noEmit`
- Frontend: `npx vite build`
- Full desktop build: `npm run tauri build`
- Fixed-name installer: `.\scripts\build.ps1`

## Supported Formats
Video (27): mp4, mkv, avi, mov, wmv, flv, webm, ts, m2ts, 3gp, ogv, rm, rmvb, vob, asf, divx, f4v, m4v, mpg, mpeg, 3g2, mts, mxf, nsv, ogm
Audio (21): mp3, flac, aac, ogg, wav, wma, m4a, opus, ac3, dts, alac, aiff, ape, mid, midi, ra, tta, tak, dsf, dff
Image (22): jpg, jpeg, png, bmp, gif, tiff, tif, webp, svg, ico, heic, heif, avif, jxl, psd, tga, hdr, exr, pcx, pgm, ppm, pnm, sfw
