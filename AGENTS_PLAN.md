# AGENTS_PLAN — MOD 26 (Build 26)

## Goals
1. Fix drag-drop creating many duplicate playlist items with the same name.
2. Best-effort memory reduction (idle near 100MB; playback as low as practical).

## Plan
### Drag-drop
- [x] Stabilize VideoSurface Tauri listener (mount-once + ref + async-safe cleanup)
- [x] Stabilize App.handleDrop deps
- [x] addToPlaylist: media filter + path dedup; return first path to auto-open
- [x] Export isMediaFile / normalizePath from media.ts

### Memory
- [x] mpv: vo=gpu, demuxer/cache caps
- [x] Throttle time-pos → store (~10 Hz)
- [x] Drop unused playlist observe
- [x] Zustand selectors (useMpv, Controls, VideoSurface, VolumeControl, ProgressBar)
- [x] System fonts; reduce heavy backdrop-filter on always-on chrome

### Release
- [x] Version 1.0.12, AGENTS.md, medial_support.txt, typecheck
- [x] build.ps1 → release\VPlayer-Setup-x64.exe

## Status
- Started: 2026-08-16
- Done: all implementation + build
- Pending: git commit / GitHub release (on request)
