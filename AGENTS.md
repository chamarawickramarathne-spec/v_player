# V Player

**App Modification Memory** - read before making changes. Update this file after every change.

## Overview
V Player is a modern media player for Windows (Tauri v2 + React 19 + TypeScript + Vite) using mpv/libmpv as the media engine. An Android port lives in `v-player-android/`.

## Current Version
- **v1.0.0** - last updated: 2026-08-15 (Build 14)

## Mod Log

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
1. Bump versions: `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`.
2. Build: `.\scripts\build.ps1` (runs tsc + vite + tauri build, renames installer to `release/VPlayer-Setup-x64.exe`).
3. Commit and push to git.
4. Create GitHub release tagged `vX.Y.Z` and attach `release/VPlayer-Setup-x64.exe` (name must stay fixed).
5. App checks `releases/latest` on startup; downloads installer; launches NSIS wizard; exits.

## Build Commands
- Typecheck: `npx tsc --noEmit`
- Frontend: `npx vite build`
- Full desktop build: `npm run tauri build`
- Fixed-name installer: `.\scripts\build.ps1`

## Supported Formats
Video (27): mp4, mkv, avi, mov, wmv, flv, webm, ts, m2ts, 3gp, ogv, rm, rmvb, vob, asf, divx, f4v, m4v, mpg, mpeg, 3g2, mts, mxf, nsv, ogm
Audio (21): mp3, flac, aac, ogg, wav, wma, m4a, opus, ac3, dts, alac, aiff, ape, mid, midi, ra, tta, tak, dsf, dff
Image (22): jpg, jpeg, png, bmp, gif, tiff, tif, webp, svg, ico, heic, heif, avif, jxl, psd, tga, hdr, exr, pcx, pgm, ppm, pnm, sfw
