# V Player Android - Build History

## Build 1 - Initial Setup

### Project Structure
- Created Android project with Kotlin DSL and Gradle version catalog
- Package: `com.vplayer.app`
- Min SDK: API 26 (Android 8.0)
- Target SDK: API 35

### Dependencies
- Media3/ExoPlayer 1.5.1 (video/audio playback)
- Jetpack Compose (UI)
- Material3 (design)
- Accompanist Permissions (runtime permissions)
- Coil (image loading - unused)
- Haze (glassmorphism - unused, using gradient backgrounds)
- Kotlin Serialization
- DataStore (settings/preferences)

### Features Implemented
1. **PlayerManager** - ExoPlayer wrapper with full playback control
   - openFile, openFiles, addToPlaylist
   - play, pause, stop, seekTo, seekRelative
   - setVolume, toggleMute, setPlaybackSpeed
   - playIndex, playNext, playPrevious
   - removeFromPlaylist, clearPlaylist
   - toggleFullscreen, toggleLock, toggleControls
   - repeat mode cycling, shuffle toggle

2. **UI Components**
   - GlassCard - Glassmorphism card with gradient background
   - PlayerControls - Video playback controls overlay
   - SeekBar - Custom seek bar with drag support
   - PlaylistPanel - Slide-out playlist with empty state

3. **Screens**
   - HomeScreen - File browser, recent files, quick access cards
   - PlayerScreen - Video player with controls overlay
   - AppNavHost - Navigation between screens

4. **Gestures**
   - Tap to toggle controls
   - Double-tap to play/pause
   - Horizontal swipe to seek
   - Vertical swipe for volume
   - Vertical swipe for brightness

5. **Data Layer**
   - SettingsStore - App preferences via DataStore
   - RecentFilesStore - Recent file history

6. **Media Playback Service**
   - Foreground service for lock screen / notification controls

### File Types Supported
- **Video:** mp4, mkv, avi, mov, wmv, flv, webm, ts, m2ts, 3gp, ogv, rm, rmvb, vob, asf, divx, f4v, m4v, mpg, mpeg, 3g2, mts, mxf, nsv, ogm
- **Audio:** mp3, flac, aac, ogg, wav, wma, m4a, opus, ac3, dts, alac, aiff, ape, mid, midi, ra, tta, tak, dsf, dff
- **Image:** jpg, jpeg, png, bmp, gif, tiff, webp, svg, ico, heic, heif, avif, jxl, psd, tga, hdr, exr

### Build 1 - SUCCESS
- APK built: `app/build/outputs/apk/debug/app-debug.apk`
- Android Studio installed to: `E:\AIprojects\studio\android-studio`
- Android SDK installed to: `E:\AIprojects\sdk`
- JDK 17 installed to: `E:\AIprojects\jdk17\jdk-17.0.13+11`
- Build command: `$env:JAVA_HOME='E:\AIprojects\jdk17\jdk-17.0.13+11'; .\gradlew.bat assembleDebug`

---

## Build 2 - Critical Fixes & Feature Additions

### Fixes
1. **Duplicate FileUtils removed** - Removed duplicate `FileUtils` object inside `PlayerManager.kt`, now uses the canonical `util/FileUtils.kt`
2. **PlayerManager initialization order fixed** - `playerListener` now defined after `exoPlayer`, using `init` block for listener registration
3. **MediaPlaybackService cleaned up** - Removed unused `LocalBinder` inner class and imports
4. **GridItemSpan fix** - `HomeScreen` span block now uses `GridItemSpan(2)` instead of `GridCells.Fixed(2)`
5. **Placeholder icons replaced** - `Icons.Filled.Air` replaced with proper icons (`Icons.Filled.Loop`, `Icons.Filled.SkipNext`)

### New Features
1. **Runtime Permission Handling** (Accompanist Permissions)
   - App now requests `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, `READ_MEDIA_IMAGES` on Android 13+
   - Requests `READ_EXTERNAL_STORAGE` on older versions
   - Shows a dedicated permission screen with "Grant Permission" button
   - Permission screen skipped when opened via intent (external file open)

2. **Recent Files Persistence**
   - `RecentFilesStore.addRecentFile()` now called when `openFile()` and `openFiles()` are invoked
   - Home screen shows up to 6 recent files with correct counts

3. **Playlist "Add Files"**
   - `PlayerScreen` now has a file picker launcher for adding files to playlist
   - `PlaylistPanel.onAddFiles` wired to launch `ActivityResultContracts.OpenMultipleDocuments`
   - Added `initialPlaylist` parameter to `PlayerScreen`

4. **Settings Screen** (`SettingsScreen.kt`)
   - Full settings screen with toggle switches for all `AppSettings` options
   - Playback settings: auto-play next, remember speed, keep screen on
   - Gesture settings: volume swipe, brightness swipe, seek swipe, floating controls
   - Settings icon on HomeScreen now navigates to Settings

5. **Quick Access Cards** (HomeScreen)
   - Videos/Audio/Images cards now filter recent files by media type
   - Cards launch player with filtered file list

6. **Speed Selector Popup**
   - Clickable speed button opens dropdown with speeds: 0.25x to 8x
   - Current speed highlighted in accent color

7. **Aspect Ratio Popup Menu**
   - New `onSetAspectRatio` callback wired through controls
   - Dropdown with all `VideoAspectRatio` options (Fit, Fill, Crop, Stretch, 4:3, 16:9)

8. **Sleep Timer Popup Menu**
   - Dropdown with preset times: 5, 10, 15, 20, 30, 45, 60, 90 minutes
   - "Cancel Timer" option when timer is active
   - Timer countdown updates state in real-time

9. **Subtitle Selector Popup**
   - Dropdown showing available subtitle tracks from current media
   - "Off" option to disable subtitles
   - Track names displayed from media metadata

10. **Brightness Gesture**
    - Vertical swipe on right side now adjusts screen brightness
    - Uses `Activity.window.attributes.screenBrightness`
    - Clamped between 0.01 and 1.0

11. **AB Loop Indicator**
    - Active A-B loop points displayed as badge above seek bar
    - Auto-loops between A and B points during playback

12. **Full PlayerControls Wiring**
    - All control callbacks now connected: AB loop, repeat cycle, shuffle toggle
    - Sleep timer badge shown in top bar when active
    - Speed indicator badge shown when speed != 1x

13. **Navigation Updates**
    - `AppNavHost` now manages three screens: Home, Player, Settings
    - `Screen.Settings` added to sealed class
    - `MainContent` composable extracted from `AppNavHost`

### SettingsStore Updates
- Added missing update functions: `updateRememberPlaybackSpeed`, `updateShowFloatingControls`, `updateGestureVolumeSwipe`, `updateGestureBrightnessSwipe`, `updateGestureSeekSwipe`

### Notes
- Deprecated icon warnings (ArrowBack, QueueMusic) - cosmetic only, not blocking
- Haze glassmorphism library excluded (compile issues) - using CSS-style gradient backgrounds instead
- Coil imported but unused (no image loading yet)
- Navigation Compose imported but unused (manual state-based navigation used)
