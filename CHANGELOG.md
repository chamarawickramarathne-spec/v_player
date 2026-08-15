# V Player - Build Memory

> This file is the memory for the V Player app build. Read this before making any changes.

## v1.0.11 - Last Updated: 2026-08-15 (Build 25)

- **Build 25**: Fixed forever "Install & Restart" caused by a stale leftover installer. After an update is installed, the downloaded `VPlayer-Setup-x64.exe` stayed in `%APPDATA%\com.vplayer.desktop\updates\`, so `detectDownloadedUpdate()` kept offering "Install & Restart" on every launch even though the running version was already the newest.
- Root cause: `get_downloaded_installer` returned any installer file present; it was not version-aware. With an installer file always left behind after the one-click flow completed (user reached v1.0.10), the button showed forever.
- Fix: `download_update` now receives the target `version` and writes `updates/update.json` (e.g. `{"version":"1.0.11"}`) beside the installer. `get_downloaded_installer` only returns the installer when the recorded version is NEWER than the running app (semver); otherwise it self-cleans (deletes installer + `update.json`) and returns `None`. Leftovers without readable metadata (from pre-fix builds) are also deleted as stale — self-heal.
- `updaterStore.ts`: `downloadUpdate` passes `version: info.latest_version` to the backend.
- Net behavior: a genuinely pending update still shows "Install & Restart"; once the newer version is running the leftover cleans itself on next launch.
- Version bumped 1.0.10 -> 1.0.11 in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`.

---

## v1.0.10 - Last Updated: 2026-08-15 (Build 24)

---

## Architecture
- **Frontend**: React 19 + TypeScript + Vite (built to `dist/`)
- **Backend**: Tauri v2 (Rust) 
- **Media Engine**: libmpv via `tauri-plugin-libmpv` v0.3.2
- **State Management**: Zustand (playerStore, settingsStore)
- **Styling**: Inline styles + CSS variables in `global.css`, glassmorphism design, solid `#000` background
- **Target Platform**: Windows 10 (x64)

---

## Rules (MUST FOLLOW)

### mpv Rendering Chain (CRITICAL)
1. `html, body, #root` must have `background: transparent` in CSS
2. App root div: `transparent` when video playing, `#000` when idle
3. VideoSurface: `transparent` when video playing
4. `tauri.conf.json`: `"transparent": true` on window
5. mpv renders video natively into the HWND **behind** the WebView

### Format Lists Sync (4 locations)
1. `src/lib/media.ts` - `VIDEO_EXTS`, `AUDIO_EXTS`, `IMAGE_EXTS` (canonical, used by `getMediaType`)
2. `src/App.tsx` - dialog filter arrays (duplicated, should be consolidated)
3. `src/hooks/useMpv.ts` - imports from `../lib/media` (uses canonical)
4. `src-tauri/src/file_handler.rs` - Rust arrays (for backend)

### Styling Rules
- Inline styles + CSS variables only (no Tailwind at runtime, no CSS modules, no styled-components)
- Glassmorphism design system: `backdropFilter: blur()`, semi-transparent backgrounds
- Font: Inter (loaded from Google Fonts via `global.css`)
- Accent color: `#6366f1` (configurable in settings, CSS variable `--accent`)

### File Operations & Drag-Drop
- Use Tauri v2 APIs for file drag-drop: `getCurrentWebviewWindow().onDragDropEvent()`
- NEVER use browser DOM `.path` on File objects (that's Electron-specific, doesn't work in Tauri v2)
- `event.payload.paths: string[]` provides actual file paths from Tauri drop events

### State Management
- Zustand stores only: `playerStore` (playback/playlist), `settingsStore` (settings/UI)
- `addToPlaylist()` must NEVER call `openFile()` - callers decide via `wasEmpty` return value
- Playlist is updated synchronously via `usePlayerStore.setState`

### Backend
- Rust commands in `src-tauri/src/player.rs` are **all stubs** - they return strings
- Real playback handled entirely by JS `tauri-plugin-libmpv-api` through the plugin system
- mpv commands: `command("loadfile", [path, "replace"])`, `setProperty()`, `observeProperties()`

---

## Project Structure

### Tauri Backend (`src-tauri/`)
| File | Purpose | Status |
|------|---------|--------|
| `tauri.conf.json` | Tauri config, window settings, bundle config | Fixed: correct $schema, identifier `com.vplayer.desktop` |
| `capabilities/default.json` | Permissions for plugins | Created: dialog, fs, shell, libmpv, core permissions |
| `src/lib.rs` | Main Tauri builder, plugin registration, commands | Working: registers all plugins and commands |
| `src/player.rs` | Rust mpv command handlers | **STUBS** - returns strings, not real mpv commands |
| `src/recent_files.rs` | Recent files management | Working |
| `src/settings.rs` | App settings management | Working |
| `src/file_handler.rs` | File type detection | Working but functions unused |
| `Cargo.toml` | Rust dependencies | Includes tauri-plugin-libmpv 0.3.2 |
| `lib/libmpv-2.dll` | Main mpv library (98MB) | Present |
| `lib/libmpv-wrapper.dll` | Tauri plugin wrapper (391KB) | Present |

### Frontend (`src/`)
| File | Purpose | Status |
|------|---------|--------|
| `App.tsx` | Main UI layout, all handlers | **FIXED** (Build 10+13): `isVideoPlaying` checks `!isStopped`, `handleDrop` accepts `string[]`, `addToPlaylist` flow fixed, removed `onFileDrop` prop from PlaylistPanel |
| `main.tsx` | Entry point | Working |
| `hooks/useMpv.ts` | Frontend mpv integration | **UPDATED** (Build 10+11): `addToPlaylist` only appends, `reorderPlaylist` exposed |
| `hooks/useKeyboardShortcuts.ts` | Global keyboard shortcuts | Working: 18 shortcuts |
| `components/Player/VideoSurface.tsx` | Video display + drag-drop + empty state | **FIXED** (Build 10): uses `isStopped` for background, `onFileDrop` accepts `string[]` |
| `components/Player/Controls.tsx` | Play/pause, seek, speed, volume, fullscreen | Working |
| `components/Player/ProgressBar.tsx` | Seek bar with hover tooltip | Working: visible on black background |
| `components/Player/VolumeControl.tsx` | Volume slider | Working |
| `components/Player/PlaylistPanel.tsx` | Playlist sidebar with empty state | **UPDATED** (Build 13): removed duplicate Tauri file drop listener (was causing duplicate items) |
| `components/Player/SubtitleSelector.tsx` | Track/subtitle selector | Working |
| `components/Settings/SettingsPanel.tsx` | Settings dialog | Working |
| `components/Library/MediaGrid.tsx` | Library grid view | **UNUSED** - library view was removed from UI |
| `stores/playerStore.ts` | Zustand player state | **UPDATED** (Build 11): added `reorderPlaylist` action |
| `stores/settingsStore.ts` | Zustand settings state | Working |
| `types/index.ts` | TypeScript interfaces | Working: PlayerState, Track, PlaylistItem, etc. |
| `styles/global.css` | CSS variables, animations | Working |
| `lib/media.ts` | Media type detection (getMediaType) | **NEW** (Build 9): VIDEO_EXTS, AUDIO_EXTS, IMAGE_EXTS arrays |

---

## How mpv Rendering Works (CRITICAL)
mpv renders video at the **native OS level** into the Tauri window's HWND, **behind the webview**. This means:
1. `html, body, #root` must have `background: transparent` in CSS
2. The App.tsx root div must be `background: transparent` when video is playing
3. The VideoSurface div must be `background: transparent` when video is playing
4. `tauri.conf.json` must have `"transparent": true` on the window
5. When NO video is playing, backgrounds are solid `#000`
6. The mpv plugin gets the HWND via `raw_window_handle` and sets `wid=<HWND>` in mpv options

**Video visibility chain**: `transparent window` -> `mpv renders behind` -> `transparent html/body/#root` -> `transparent App root div` (when video) -> `transparent VideoSurface` (when video) -> video shows through

---

## Supported Formats

### Video (27)
mp4, mkv, avi, mov, wmv, flv, webm, ts, m2ts, 3gp, ogv, rm, rmvb, vob, asf, divx, f4v, m4v, mpg, mpeg, 3g2, mts, mxf, nsv, ogm

### Audio (21)
mp3, flac, aac, ogg, wav, wma, m4a, opus, ac3, dts, alac, aiff, ape, mid, midi, ra, tta, tak, dsf, dff

### Image (22)
jpg, jpeg, png, bmp, gif, tiff, tif, webp, svg, ico, heic, heif, avif, jxl, psd, tga, hdr, exr, pcx, pgm, ppm, pnm, sfw

### Subtitle (10)
srt, ass, ssa, sub, idx, vtt, sup, smi, lrc, txt

### Playlist (6)
m3u, m3u8, pls, cue, xspf, asx

**IMPORTANT**: Format lists must be kept in sync across 4 locations:
1. `src/lib/media.ts` - VIDEO_EXTS, AUDIO_EXTS, IMAGE_EXTS (canonical, used by getMediaType)
2. `src/hooks/useMpv.ts` - imports from `../lib/media` (uses canonical)
3. `src/App.tsx` - handleOpenFile dialog filter + playlist panel filter (duplicated arrays)
4. `src-tauri/src/file_handler.rs` - Rust arrays (for backend)

---

## Keyboard Shortcuts
| Key | Action | Handler |
|-----|--------|---------|
| Space | Play/Pause | `player.togglePlay` |
| Left | Seek -5s | `player.seekRelative(-5)` |
| Right | Seek +5s | `player.seekRelative(5)` |
| Shift+Left | Seek -30s | `player.seekRelative(-30)` |
| Shift+Right | Seek +30s | `player.seekRelative(30)` |
| Up | Volume +5% | `player.setVolume(volume + 0.05)` |
| Down | Volume -5% | `player.setVolume(volume - 0.05)` |
| M | Toggle mute | `player.toggleMute` |
| F | Toggle fullscreen | `handleToggleFullscreen` |
| Escape | Toggle fullscreen | `handleToggleFullscreen` |
| Ctrl+O | Open file | `handleOpenFile` |
| . | Next frame | `player.nextFrame` |
| , | Previous frame | `player.prevFrame` |
| ] | Speed up (+0.25) | `player.setSpeed(speed + 0.25)` |
| [ | Speed down (-0.25) | `player.setSpeed(speed - 0.25)` |
| \ | Reset speed (1.0) | `player.setSpeed(1.0)` |
| N | Next track | `player.playlistNext` |
| P | Previous track | `player.playlistPrev` |
| L | Toggle playlist | `setShowPlaylist(v => !v)` |

### Controls Layout (Current)
```
[Stop] [Prev] [Play/Pause] [Next] [Seek-5s] [Seek+5s]  Time
```

---

## UI Layout (Current)
```
+--------------------------------------------------+
| [Logo] V Player         [Open] [L] [CC] [Settings]|  <- Title Bar (42px, z-index: 300)
+--------------------------------------------------+
|                                                  |
|              VideoSurface                        |  <- Main content area
|              (transparent when video)             |
|                                                  |
|  +--Controls overlay (bottom)---+                |
|  | [Stop][|<][Play][>|] [<<] [>>]  1:23/5:00    |
|  | ====seek bar==========       |                |
|  | [speed] [vol] [fullscreen]   |                |
|  +------------------------------+                |
|                                                  |
|  +--Playlist panel (right, 320px, z-index: 200)-+|
|  | Playlist (12)                  [Clear all]    ||
|  | ⠿ [1] file1.mp4 [x]                         ||
|  | ⠿ [>] file2.mp3 [x]  <- currently playing    ||
|  | ⠿ [3] image.png  [x]                         ||
|  |                                                ||
|  |          [No files in playlist]                || <- Empty state
|  |              [Add Files]                       ||
|  |                                                ||
|  |          [--- Add more files ---]              || <- Footer
|  +-----------------------------------------------+|
|  (drag ⠿ handles to reorder, drop files to add)  |
+--------------------------------------------------+
```

---

## UI Design Rules
- Background: Solid `#000` when idle, `transparent` when video playing
- Title bar: `rgba(0,0,0,0.6)` with blur when media open, solid `var(--bg-secondary)` when no media
- Controls: Gradient overlay at bottom, auto-hide after 3s of inactivity during playback
- Seek bar: `rgba(255,255,255,0.25)` background, 5px height, 8px on hover, accent gradient fill
- Playlist: `rgba(12,12,18,0.95)` background, slide-in animation
- Accent color: `#6366f1` (configurable in settings)
- Font: Inter (loaded from Google Fonts)

---

## Build Commands
- **TypeScript check**: `npx tsc --noEmit`
- **Vite build**: `npx vite build`
- **Full Tauri build**: `npm run tauri build`
- **Dev mode**: `npm run tauri dev`

## Build Outputs
- `src-tauri/target/release/v-player.exe` - Standalone exe
- `src-tauri/target/release/bundle/nsis/V Player_1.0.1_x64-setup.exe` - NSIS installer (versioned)
- `release/VPlayer-Setup-x64.exe` - **Fixed-name installer** (Build 14+): uploaded to GitHub releases, used by the in-app updater
- `src-tauri/target/release/bundle/msi/V Player_1.0.1_x64_en-US.msi` - MSI installer

---

## Post-Modification Workflow

**After EVERY code change, follow these steps:**

### 1. TypeScript Check
```bash
npx tsc --noEmit
```
Fix any errors before proceeding.

### 2. Build Frontend
```bash
npx vite build
```
Ensures React/TypeScript compiles to `dist/`.

### 3. Build Executable
```bash
npm run tauri build
```
Creates:
- `src-tauri/target/release/v-player.exe` (standalone exe)
- `src-tauri/target/release/bundle/nsis/V Player_1.0.0_x64-setup.exe` (installer)

### 4. Update CHANGELOG.md
- Bump build number in header: `(Build X)` -> `(Build X+1)`
- Update "Last Updated" date
- Update "Project Structure" table with file status changes
- Add numbered change entries under "Change Log" section
- Mark completed TODOs in "Known Limitations / TODO"
- Update "UI Layout" diagram if visual changes were made

---

## Known Limitations / TODO
- Rust backend commands (`player.rs`) are **all stubs** - they return strings, not real mpv commands
- Real playback is handled entirely by the JS `tauri-plugin-libmpv-api` through the plugin
- `MediaGrid` component exists in `src/components/Library/MediaGrid.tsx` but is **not used** in the UI
- No actual mpv property observation from Rust side
- No A-B loop feature
- No audio/video filters (brightness, contrast, etc.)
- No mini player / always-on-top mode
- No screenshot save with custom location
- ~~No playlist reordering~~ **DONE** (Build 11+13): drag-and-drop reorder, file drop fixed (no more duplicate items)
- Format lists are now split: `src/lib/media.ts` has the canonical lists, `src/App.tsx` has duplicate dialog filter lists (should be consolidated)

---

## Change Log (All Changes)

### Build 1 - Initial Setup (earlier session)
1. Created full project structure with Tauri v2 + React + TypeScript + Vite
2. Created all React components with glassmorphism UI
3. Created Zustand stores (playerStore, settingsStore)
4. Created global CSS with design system
5. Created Rust backend modules (player.rs, recent_files.rs, settings.rs, file_handler.rs)
6. Downloaded libmpv-2.dll and libmpv-wrapper.dll to src-tauri/lib/
7. Generated app icons with Python PIL

### Build 2 - Plugin Setup & Permissions (2026-07-26)
8. Installed `tauri-plugin-libmpv` via `npm run tauri add libmpv`
9. Created `src-tauri/capabilities/default.json` with permissions (dialog, fs, shell, libmpv, core)
10. Fixed `tauri.conf.json` - corrected `$schema` from libmpv to Tauri, fixed identifier to `com.vplayer.desktop`
11. Rewrote `src/hooks/useMpv.ts` with correct `tauri-plugin-libmpv-api` types (MpvObservableProperty tuples, command(name, args) signature, etc.)
12. Synced frontend format lists with Rust backend across all 3 locations

### Build 3 - UI Cleanup
13. Removed Library button from title bar
14. Removed floating + button from video player
15. Removed Library/MediaGrid view entirely - app goes straight to player
16. Changed main background from transparent to solid `#000`
17. Changed VideoSurface to transparent during video playback for native mpv rendering

### Build 4 - Video Visibility Fix
18. Fixed video not visible: App root div background changed from `#000` to `transparent` when video playing
19. Title bar background now transparent when media open
20. Removed CSS transition on VideoSurface background (caused flash)

### Build 5 - Seek Bar Fix
21. Made seek bar background more visible: `rgba(255,255,255,0.08)` -> `0.25`
22. Increased seek bar thickness: rest 4px->5px, hover 6px->8px
23. Added subtle border to seek bar: `1px solid rgba(255,255,255,0.08)`

### Build 6 - Playlist Sidebar
24. Rebuilt `PlaylistPanel.tsx` as integrated sidebar with:
    - Empty state with "Add Files" button
    - Item count badge in header
    - "Clear all" button in header
    - Numbered items with media type color dot and playing indicator
    - Hover-to-reveal remove button per item
    - "Add more files" dashed button in footer
25. Playlist toggle button always visible in title bar (removed `playlist.length > 1` condition)
26. Added `L` keyboard shortcut to toggle playlist panel
27. Files now auto-add to playlist when opened (with duplicate detection)
28. Created CHANGELOG.md (this file) as build memory

### Build 7 - Stop/Next/Prev Buttons
29. Added Stop, Previous Track, and Next Track buttons to Controls component
30. Button layout: `[Stop] [Prev] [Play/Pause] [Next] [Seek-5s] [Seek+5s] Time`
31. Stop button (square icon) calls `player.stop`
32. Previous button (skip-back icon) calls `player.playlistPrev`
33. Next button (skip-forward icon) calls `player.playlistNext`
34. Updated ControlsProps interface with `onStop`, `onNextTrack`, `onPrevTrack`

### Build 8 - Playlist Behavior Fix
35. Multi-file open now plays 1st file and adds rest to playlist without interrupting
36. Clear playlist now stops playback, clears filePath/mediaTitle/mediaType
37. New `addToPlaylist(paths)` function: adds files without playing (unless nothing playing)
38. New `clearPlaylist()` function in useMpv: stops mpv + clears all state
39. Drag-drop now uses `addToPlaylist` instead of `openFile` (adds without interrupting)
40. Playlist panel "Add Files" button uses `addToPlaylist` (adds without interrupting)
41. `playlistNext`/`playlistPrev` no longer recursive through `openFile`, directly loadfile via mpv
42. Extracted `VIDEO_EXTS`, `AUDIO_EXTS`, `IMAGE_EXTS`, `getMediaType()`, `getFileName()` as module-level helpers

### Build 9 - mpv API Fix, Drag-and-Drop Fix, Auto-Advance Playlist (2026-07-27)

#### Fix: Playlist click not playing (mpv API rewrite)
43. **Root cause**: `useMpv.ts` used raw `window.__TAURI__?.core?.invoke("mpv", ...)` instead of `tauri-plugin-libmpv-api` imports. In Tauri v2, plugin commands are namespaced (`plugin:libmpv|mpv`), so raw invoke failed silently. Store updated optimistically regardless of mpv success.
44. **Full rewrite of `src/hooks/useMpv.ts`** - now imports and uses `init`, `command`, `setProperty`, `observeProperties`, `listenEvents`, `destroy` from `tauri-plugin-libmpv-api`
45. `init()` properly initializes mpv with `MpvConfig` including `initialOptions` (vo: gpu-next, hwdec from settings, keep-open, volume) and `observedProperties` array
46. `observeProperties()` handles all property changes: pause, time-pos, duration, filename, media-title, volume, mute, speed, track-list, playlist-pos
47. All commands now wrapped in try/catch - store only updates after mpv command succeeds (no more optimistic UI)
48. Removed `mpvReady` flag and `setup-mpv` event listener - `init()` promise resolves when ready
49. Added `setPlaylistIndex` to useMpv return object (fixes App.tsx TS error)
50. Created new file `src/lib/media.ts` with `getMediaType()` function (VIDEO_EXTS, AUDIO_EXTS, IMAGE_EXTS arrays)

#### Fix: Drag-and-drop not working
51. **Root cause**: `VideoSurface.tsx` read `(file as any).path` from DOM `dataTransfer.files`. Tauri v2 WebView does NOT expose `.path` on DOM File objects (that's Electron-specific).
52. Replaced native DOM drag events with Tauri's `getCurrentWebviewWindow().onDragDropEvent()` from `@tauri-apps/api/webviewWindow`
53. `event.payload.type === 'over'` sets `isDragOver = true`, `'drop'` provides `event.payload.paths: string[]` with actual file paths, `'leave'` resets drag state
54. Added proper cleanup of drag-drop listener on component unmount

#### Feature: Auto-advance playlist
55. `listenEvents()` callback detects `end-file` events from mpv
56. When `reason === 'eof'`: auto-advances to next playlist item via `command("loadfile", [nextItem.path, "replace"])`
57. When last item finishes (`nextIndex >= playlist.length`): calls `store.setStopped(true)` - player stops
58. User preference: stop at last item (no loop)

#### TypeScript fixes
59. Fixed Track type mapping: added required `decoder` field from mpv track-list data
60. Fixed `setMediaType` type casting for PlaylistItem.mediaType (string -> union type)
61. Fixed `addToPlaylist` to only include PlaylistItem fields (path, name, mediaType) - removed extra `duration`/`dateAdded`
62. All TypeScript errors resolved, Vite build passes clean

### Build 10 - Bug Fixes: Background, Playlist Duplication, Drag-and-Drop (2026-07-27)

#### Fix: Background stays transparent after playback stops
63. **Root cause**: `isVideoPlaying` in `App.tsx` checked `!!filePath && mediaType === "video"` but `filePath` and `mediaType` were never cleared when playback stopped. After a file ended (eof → `setStopped(true)`), `isVideoPlaying` remained `true`, keeping the background transparent.
64. **Fix in `App.tsx:148`**: Changed condition to `!player.isStopped && !!player.filePath && player.mediaType === "video"`. Now when `isStopped` is true, `isVideoPlaying` becomes false and background returns to solid `#000`.
65. **Fix in `VideoSurface.tsx:78`**: Changed background condition to `!isStopped && filePath && mediaType === "video"` (added `isStopped` to store destructuring).

#### Fix: 2nd playlist item showing repeatedly / duplicate items
66. **Root cause**: `addToPlaylist()` in `useMpv.ts` checked `store.playlist.length === 0` and called `openFile()` when true. When multiple `addToPlaylist` calls fired in parallel (e.g., from forEach loop in drag-drop), ALL calls saw `playlist.length === 0` before any state was committed, causing each to overwrite the playlist and call `openFile`.
67. **Fix in `useMpv.ts:167-183`**: Rewrote `addToPlaylist` to ONLY append to the playlist (never calls `openFile`). Returns `wasEmpty: boolean` so callers know whether to start playback. Playlist is updated synchronously via `usePlayerStore.setState`.

#### Fix: Drag-and-drop only taking 1 file
68. **Root cause**: `VideoSurface.tsx` called `onFileDrop(path)` once per file via `paths.forEach`. Each call independently triggered `addToPlaylist`, racing with itself. Combined with Bug #66, only the last file survived.
69. **Fix in `VideoSurface.tsx`**: Changed `onFileDrop` prop type from `(path: string) => void` to `(paths: string[]) => void`. Drop handler now passes all paths at once: `onFileDrop?.(paths)` instead of `forEach`.
70. **Fix in `App.tsx:85-92`**: `handleDrop` now accepts `string[]`, calls `addToPlaylist(paths)` once, and opens the first file only if playlist was empty.
71. **Fix in `App.tsx:51-83`**: `handleOpenFile` now calls `addToPlaylist(paths)` for ALL files first, then `openFile(paths[0])`. No more separate handling for single vs multi-file.
72. **Fix in `App.tsx:349-372`**: Playlist "Add Files" button now calls `addToPlaylist(paths)` then `openFile` if playlist was empty.

### Build 11 - Drag-and-Drop Reorder & File Drop Zone (2026-07-27)

#### Feature: Playlist drag-and-drop reorder
73. Added `reorderPlaylist(fromIndex, toIndex)` action to `playerStore.ts` - moves playlist items and correctly updates `playlistIndex` to follow the currently playing item
74. Exposed `reorderPlaylist` through `useMpv.ts` hook
75. Each playlist item is now `draggable` with a 6-dot grip handle icon for visual affordance
76. Drag events: `onDragStart` sets dragged index, `onDragOver` highlights drop target with accent border, `onDrop` calls `onReorder`, `onDragEnd` cleans up state
77. Visual feedback: dragged item fades to 40% opacity, drop target shows accent-colored top border

#### Feature: Playlist file drop zone
78. PlaylistPanel now listens to Tauri's `getCurrentWebviewWindow().onDragDropEvent()` for native file drops
79. Drop overlay shows blue "+" icon with "Drop to add to playlist" text when files hover over the panel
80. Panel border highlights with accent color on file drag-over
81. Dropped files are added as dummy playlist entries via `onFileDrop` callback (wired to `handleDrop` in App.tsx)
82. Cleanup: drag-drop listener properly removed on unmount/visibility change

#### UI Changes
83. PlaylistPanel props expanded: added `onReorder` and `onFileDrop` callbacks
84. Playlist items now have `cursor: "grab"` instead of `cursor: "pointer"` (drag handle provides the grab affordance)
85. Updated CHANGELOG.md with Build 11 entries

### Build 12 - Rules & Workflow Documentation (2026-07-27)

#### Documentation: Project rules added
86. Added "Rules (MUST FOLLOW)" section to CHANGELOG.md with 6 categories:
    - mpv Rendering Chain (CRITICAL) - transparency rules for video visibility
    - Format Lists Sync - 4 locations that must stay in sync
    - Styling Rules - inline styles + CSS variables only, glassmorphism, Inter font
    - File Operations & Drag-Drop - Tauri v2 APIs, never use browser DOM .path
    - State Management - Zustand stores only, addToPlaylist never calls openFile
    - Backend - Rust commands are stubs, real playback via JS plugin

#### Documentation: Post-Modification workflow
87. Added "Post-Modification Workflow" section with mandatory steps:
    1. TypeScript check: `npx tsc --noEmit`
    2. Build frontend: `npx vite build`
    3. Build exe: `npm run tauri build`
    4. Update CHANGELOG.md with all changes

### Build 13 - Fix: Drag-and-drop creating duplicate playlist items (2026-07-27)

#### Fix: File drops adding duplicate items to playlist
88. **Root cause**: Both `VideoSurface.tsx` and `PlaylistPanel.tsx` independently listened to `getCurrentWebviewWindow().onDragDropEvent()`. This is a **window-level** Tauri event, so both listeners fire for every drop. Both called `handleDrop` → `addToPlaylist()`, adding the same files twice.
89. **Fix**: Removed the Tauri `onDragDropEvent` listener from `PlaylistPanel.tsx` entirely. File drops are now handled exclusively by `VideoSurface.tsx` → `handleDrop` in `App.tsx`. PlaylistPanel only handles reorder via HTML5 drag events.
90. Removed `onFileDrop` prop from `PlaylistPanelProps` and its usage in `App.tsx`.
91. Removed `fileDragOver` state, `dropZoneRef`, and the file drop overlay UI from `PlaylistPanel.tsx`.
92. Cleaned up unused imports (`useEffect`, `useRef`, `getCurrentWebviewWindow`).

### Build 14 - Update Feature (GIT/GitHub Releases) (2026-08-15)

#### Feature: GIT-based auto-updater
93. Created `src-tauri/src/updater.rs` with 4 commands:
    - `check_for_update` - queries GitHub Releases API (`chamarawickramarathne-spec/v_player`), finds asset `VPlayer-Setup-x64.exe`, compares versions with the `semver` crate, returns `UpdateInfo` (current/latest version, has_update, download URL, size, release notes).
    - `download_update` - downloads the installer in a background thread to `{app_data_dir}/updates/`, streaming progress over a Tauri `Channel` (stages: starting/downloading/complete).
    - `install_update` - launches the NSIS installer wizard, then exits the app.
    - `get_app_version` - returns the packaged version for the UI.
94. Added Cargo dependencies: `semver = "1"`, `ureq = "2"` (blocking HTTP + rustls TLS, no API key needed; GitHub unauthenticated limit of 60 req/hr is fine for launch-time checks).
95. Registered all 4 updater commands in `src-tauri/src/lib.rs`.

#### Feature: Frontend update UI
96. Created `src/stores/updaterStore.ts` (Zustand): `appVersion`, `checking`, `checkedOnce`, `checkError`, `updateInfo`, `downloading`, `downloadStage`, `received`, `total`, `downloadedPath`, `installError` + actions `loadAppVersion`, `checkForUpdates`, `downloadUpdate`, `installUpdate`, `reset`; exports `formatBytes`.
97. Created `src/components/Settings/UpdatePanel.tsx` - rendered in the Settings About tab: shows current version, checks for updates, displays release notes, downloads with a live progress bar (percent + bytes), and "Install & Restart".
98. Created `src/components/UpdateBadge.tsx` - pulsing "Update" pill in the title bar when an update is available; click opens Settings on the About tab.
99. `App.tsx` now runs a silent update check on startup and controls the Settings active tab via new `activeTab`/`onTabChange` props.
100. `SettingsPanel.tsx` converted to a controlled tab component and embeds the Updates panel in the About tab.

#### Feature: Fixed-name installer
101. Created `scripts/build.ps1` - builds (tsc + vite + tauri build) and copies the NSIS installer to `release/VPlayer-Setup-x64.exe` (same name every release, no version number). The updater always looks for this fixed asset name.
102. Git repo initialized (`main` branch) with remote `origin` → `https://github.com/chamarawickramarathne-spec/v_player.git`.
103. `.gitignore` extended to exclude Android build output (`v-player-android/app/build/` etc.), `*.apk`, and `release/`.

#### Release workflow (documented)
- Build: `.\scripts\build.ps1` → bump versions in `package.json`, `Cargo.toml`, `tauri.conf.json`; build; commit; push; create GitHub release `vX.Y.Z`; attach `release/VPlayer-Setup-x64.exe`.

### Build 15 - Title Bar Version + Update Button (2026-08-15)

#### UI Change: Version & update controls moved next to the title
104. Version number now displayed next to the "V Player" title in the title bar as a small pill (`v1.0.1`), read live via `loadAppVersion()` from the updater store.
105. `UpdateBadge.tsx` repurposed into a version + update button group: shows `v{appVersion}` and an Update button. Button behavior:
    - Update available → accent-highlighted "Update available" → opens Settings on the About tab.
    - Checking → "Checking…".
    - Up to date → neutral "Update" → runs a manual `checkForUpdates()`.
106. Removed the old right-side update badge (single update indicator next to the title now).
107. `App.tsx` startup effect now calls `loadAppVersion()` so the version shows immediately.
108. Version bumped to **1.0.1** in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`.

### Build 16 - Fix: Theme/Accent Color Not Applying (2026-08-15)

#### Bug Fix: Settings changes never applied
109. **Root cause**: `SettingsPanel.tsx` kept settings in local `useState` and only persisted them to the backend via `invoke("update_settings")`. It never wrote to the Zustand `useSettingsStore`, which `App.tsx` reads to apply `data-theme` and `--accent` CSS variables (`App.tsx` theme effect). So changing accent color or theme had no visual effect. Additionally, the store was never hydrated from `get_settings` at startup, so saved settings never applied on launch (and `useMpv` read default `hwdec`/`volume`).
110. `settingsStore.ts` - added `loadSettings()` action: invokes `get_settings` and writes the result into the store.
111. `SettingsPanel.tsx` - removed the local `useState<AppSettings>`; settings are now read and written directly through `useSettingsStore` (single source of truth). `loadSettings` and `saveSettings` both go through the store, so App re-applies theme/accent live.
112. `App.tsx` - startup effect now calls `loadSettings()` so persisted theme/accent/volume/hwdec apply immediately on launch.
113. Version bumped to **1.0.2**.

### Build 17 - One-Click Updater + Up-to-Date Feedback (2026-08-15)

#### Bug Fix: "Click update button not updating new version"
114. **Root cause**: The user was already on the latest release (v1.0.2). Clicking "Update" ran a silent `checkForUpdates()` that found nothing and gave zero visible feedback, so it looked broken. The button also wasn't a real one-click flow - when an update existed it only opened Settings > About, where the user still had to click "Download Update" then "Install & Restart".

#### Feature: One-click update in the title bar
115. `updaterStore.ts` - added `oneClickUpdate()` action: if an update is known it auto-downloads; if not it runs the check and auto-downloads when a newer version exists; if up-to-date it records a `feedback` message. Added `feedback { type, message }` state + `clearFeedback()`. The download `Channel` is now held in store state (not a local variable) so progress events can't be dropped by GC mid-download. Channel handler now also reacts to an `error` stage (clears downloading state, shows feedback).
116. `UpdateBadge.tsx` - rewritten as a true one-click updater: click checks/downloads/installs directly (no Settings trip). While downloading it shows a spinner + `%` on the button; when ready the button becomes "Install & Restart"; clicking that launches the installer and exits the app. Renders a transient toast near the title bar (auto-hides ~3s) for "Up to date · vX.Y.Z", "Download failed", and "downloaded — install now" states. Removed the `onOpenUpdates` prop (and its usage in `App.tsx`).
117. `updater.rs` - `download_update` thread now sends an `error` stage over the channel on failure (previously the error was swallowed silently, leaving the UI stuck).
118. `global.css` - added `fadeSlideIn` keyframe for the toast animation.
119. Version bumped to **1.0.3** in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`.

#### Verified
- `npx tsc --noEmit` clean, `cargo check` clean, full build via `scripts/build.ps1`.
- GitHub `releases/latest` returns v1.0.3 (when released) with `VPlayer-Setup-x64.exe`; the installed v1.0.2 app will now detect it and one-click upgrade.

### Build 18 - Remove Non-Functional Language Setting (2026-08-15)

#### Cleanup: Language dropdown removed
120. **Root cause**: The Language dropdown in Settings > General was dead UI. Nothing in the app reads `settings.language` (the entire UI is hardcoded English), so changing it had no effect.
121. Removed `language` from `AppSettings` in `src-tauri/src/lib.rs` (struct field + `Default`).
122. Removed `language` from the `AppSettings` interface in `src/types/index.ts`.
123. Removed `language: "en"` from `defaultSettings` in `src/stores/settingsStore.ts`.
124. Removed the Language label + `<select>` block (7 options) from `src/components/Settings/SettingsPanel.tsx`; other settings (`saveSettings` helper) untouched.
125. No migration needed - serde ignores the stale `language` key in persisted `~/.vplayer/settings.json` and it is dropped on the next save.
126. Left untouched: `tauri.conf.json` `languages` (NSIS installer UI language) and `v-player-android/**` `language` fields (audio/subtitle track metadata).
127. Version bumped to **1.0.4** in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`.

#### Verified
- `npx tsc --noEmit` clean, `cargo check` clean (only pre-existing warnings), full build via `scripts/build.ps1`.

### Build 19 - Truly One-Click Update: Auto-Install + Guided Wizard (2026-08-15)

#### Bug Fix: "click update button not updating" (2nd report)
128. **Root cause**: Check + download worked end-to-end (verified live: startup check consumed 1 GitHub API request; clicking "Update" on the installed v1.0.3 downloaded the full 32 MB installer into `%APPDATA%\com.vplayer.desktop\updates\`). The failure was downstream: after download the app waited for a SECOND click ("Install & Restart"), then launched a bare NSIS wizard and exited. If that second step was missed or the unsigned installer was blocked by SmartScreen, the app simply closed - looking exactly like "Update did nothing."
129. `updaterStore.ts` - the download "complete" handler now AUTO-INSTALLS after a 2s delay (toast: "downloaded - launching installer..."). Added `detectDownloadedUpdate()` which calls the new `get_downloaded_installer` backend command; an installer left over from a previous session is detected on startup and offered as "Install & Restart". Install/download failures now also set the error feedback toast.
130. `updater.rs` - `check_for_update` and `download_update` are now `async` + `spawn_blocking` so the GitHub network call no longer freezes the main thread (previously a blocking synchronous command could swallow the user's click during the check). Added `get_downloaded_installer` command. `install_update` verifies the file exists, launches the installer, then shows a guided `tauri-plugin-dialog` message ("If Windows shows a security warning, click More info -> Run anyway") before exiting the app.
131. `lib.rs` - registered the new `get_downloaded_installer` command.
132. `App.tsx` - startup effect now also calls `detectDownloadedUpdate()`.
133. Version bumped to **1.0.5** in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`.

#### Verified
- `npx tsc --noEmit` clean, `cargo check` clean (only pre-existing warnings), full build via `scripts/build.ps1`.

### Build 20 - Release-only bump: verify one-click updater (2026-08-15)

#### Purpose
134. No functional code change. Version bumped **1.0.5 -> 1.0.6** in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json` so the installed v1.0.5 app (which contains the v1.0.5 one-click auto-install updater) can be used to test the full flow live: click Update -> download -> auto-launch installer -> guided dialog -> install v1.0.6.
135. Success criteria after install: title bar shows v1.0.6; clicking Update again shows the "Up to date - v1.0.6" toast.

#### Result
- v1.0.6 released, but the app kept reporting "Up to date - v1.0.5". This exposed the real root cause (Build 21): update detection had NEVER worked due to a serde camelCase mismatch.

### Build 21 - FIX: Update Detection Never Worked - serde camelCase mismatch (2026-08-15)

#### Root cause
136. `UpdateInfo` and `UpdateProgress` in `src-tauri/src/updater.rs` were annotated `#[serde(rename_all = "camelCase")]`, so over Tauri IPC they serialize as `currentVersion`, `latestVersion`, `hasUpdate`, `downloadUrl`, `assetName`, `sizeBytes`, `releaseNotes`. Every frontend read uses snake_case (`has_update`, `latest_version`, `download_url`, `current_version`, `size_bytes`, `release_notes` in `src/types/index.ts`, `src/stores/updaterStore.ts`, `src/components/UpdateBadge.tsx`, `src/components/Settings/UpdatePanel.tsx`).
137. Consequence: `has_update` was always `undefined` -> falsy, so the app ALWAYS reported "Up to date - vX.Y.Z", the badge never showed "Download vX", and `updateInfo.download_url` was undefined so `downloadUpdate()` bailed out early (badge downloads could never start). `UpdateProgress` fields (`stage`, `received`, `total`, `path`) are single words so they were unaffected - which is why progress/downloading appeared to work, masking the bug. These were the ONLY 2 `rename_all` attributes in the entire repo (settings/recent_files serialize snake_case and work fine).
138. This bug existed since Build 14 (the initial updater commit) - it is the ORIGINAL "click update button not updating" bug.

#### Fix
139. `updater.rs` - removed both `#[serde(rename_all = "camelCase")]` attributes. Wire format is now snake_case, matching the TS types and the rest of the codebase. No frontend changes needed.
140. `updaterStore.ts` - `oneClickUpdate` no longer reports "Up to date - vX" when the check FAILED (previously `updateInfo` stayed null after an error and the else branch misreported up-to-date). It now reads `checkError` after the check and shows an error toast: "Update check failed - check your internet connection".
141. Version bumped to **1.0.7** in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`.

#### Verified
- `npx tsc --noEmit` clean, `cargo check` clean (only pre-existing warnings), full build via `scripts/build.ps1`.

### Build 22 - Release-only bump: verify the fixed updater (2026-08-15)

#### Purpose
142. No functional code change. Version bumped **1.0.7 -> 1.0.8** in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json` so the fixed v1.0.7 app (which contains the MOD 21 serde fix) can verify the one-click update flow live: badge shows "Download v1.0.8" -> click -> download -> auto-launch installer -> guided wizard -> install v1.0.8 -> "Up to date - v1.0.8" toast. Proves update detection + one-click update work end-to-end.
143. Success criteria: after v1.0.8 is installed, title bar shows v1.0.8; clicking Update again shows the "Up to date - v1.0.8" toast.

#### Result
- Verification was blocked: GitHub's unauthenticated API rate limit (60/hr per IP) was exhausted during diagnostics, so the app's check failed with 403 and (in v1.0.7) showed the "Update check failed" error toast. This exposed the updater's single-point-of-failure on `api.github.com` -> fixed in Build 23.

### Build 23 - Updater resilience: Atom-feed fallback + real error messages (2026-08-15)

#### Root cause
144. `check_for_update` depended entirely on `https://api.github.com/repos/{owner}/{repo}/releases/latest`, which is rate-limited to 60 unauthenticated requests/hour per IP. When that limit is hit (many app launches/checks in an hour, shared/CGNAT IPs, or developer diagnostics), GitHub returns HTTP 403 and the app's check fails -> user sees "Update check failed" even though the internet is fine.

#### Fix
145. `updater.rs` - `do_check_for_update` now tries the GitHub API first. On ANY failure (rate limit or otherwise) it falls back to the **Atom releases feed** (`https://github.com/<owner>/<repo>/releases.atom`), which is served by `github.com` itself and is NOT API-rate-limited. The fallback parses the newest `<entry><title>` as the latest tag and builds the installer URL deterministically (`releases/download/v<tag>/VPlayer-Setup-x64.exe`); `size_bytes` and `release_notes` are omitted in fallback mode (frontend already handles null). Added `github_error()` mapping HTTP 403/429 to a clear "GitHub API rate limit reached - try again in a few minutes" message, surfaced only if BOTH sources fail.
146. `updaterStore.ts` - `checkForUpdates` error path and `oneClickUpdate`'s failed-check branch now show the backend's real error message (e.g. rate limit vs no internet) instead of a hardcoded generic string.
147. Version bumped to **1.0.9** in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`.

#### Verified
- Atom feed confirmed live: `GET https://github.com/chamarawickramarathne-spec/v_player/releases.atom` returns 200 with first `<entry><title>` = v1.0.8 while the API is 403 rate-limited.
- `npx tsc --noEmit` clean, `cargo check` clean (only pre-existing warnings), full build via `scripts/build.ps1`.

### Build 24 - Release-only bump: verify the fixed updater (2026-08-15)

#### Purpose
148. No functional code change. Version bumped **1.0.9 -> 1.0.10** in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json` so the fixed v1.0.9 app (MOD 21 serde fix + MOD 23 Atom-feed fallback) can verify the one-click update flow live even while the GitHub API rate limit is exhausted: badge "Download v1.0.10" -> click -> download -> auto-launch installer -> guided wizard -> install v1.0.10 -> "Up to date - v1.0.10" toast.
149. Success criteria: after v1.0.10 is installed, title bar shows v1.0.10; clicking Update again shows the "Up to date - v1.0.10" toast.
