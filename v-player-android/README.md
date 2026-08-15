# V Player Android - Build Instructions

## Prerequisites

### 1. Install Android Studio
Download from: https://developer.android.com/studio

Required components (installed via Android Studio):
- Android SDK (API 35)
- Android Build Tools 35.0.0
- Android SDK Platform-Tools
- Android Emulator (for testing)

### 2. Set Environment Variables
```bash
# SDK path
ANDROID_HOME = E:\AIprojects\sdk

# JDK 17 (required - AGP 8.7.3 requires Java 17)
JAVA_HOME = E:\AIprojects\jdk17\jdk-17.0.13+11
```

### 3. Open Project
1. Open Android Studio
2. File > Open > Navigate to `v-player-android` folder
3. Wait for Gradle sync to complete

### 4. Build APK
```bash
# Set JAVA_HOME (required)
$env:JAVA_HOME = "E:\AIprojects\jdk17\jdk-17.0.13+11"

# Debug APK
.\gradlew.bat assembleDebug

# Release APK (requires signing config)
.\gradlew.bat assembleRelease

# Install on connected device
.\gradlew.bat installDebug
```

### Output Locations
- Debug APK: `app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `app/build/outputs/apk/release/app-release-unsigned.apk`

## Project Structure
```
v-player-android/
├── app/src/main/java/com/vplayer/app/
│   ├── MainActivity.kt           # Entry point, edge-to-edge
│   ├── VPlayerApp.kt             # Application, notification channel
│   ├── player/
│   │   ├── PlayerManager.kt      # ExoPlayer wrapper (650+ lines)
│   │   ├── Models.kt             # Data models, enums, state
│   │   └── MediaPlaybackService.kt  # Foreground media service
│   ├── ui/
│   │   ├── theme/
│   │   │   ├── Theme.kt          # Material3 dark theme
│   │   │   └── Color.kt          # Purple-blue accent palette
│   │   ├── screens/
│   │   │   ├── AppNavHost.kt     # Navigation + permission handling
│   │   │   ├── HomeScreen.kt     # File browser, recent files
│   │   │   ├── PlayerScreen.kt   # Video player with gestures
│   │   │   └── SettingsScreen.kt # Settings with toggles
│   │   ├── components/
│   │   │   ├── GlassCard.kt      # Glassmorphism card component
│   │   │   ├── PlayerControls.kt # Full player controls overlay
│   │   │   ├── PlaylistPanel.kt  # Slide-out playlist
│   │   │   └── SeekBar.kt        # Custom seek bar
│   │   └── gestures/
│   │       └── PlayerGestures.kt # Touch gesture handling
│   ├── data/
│   │   ├── SettingsStore.kt      # DataStore preferences
│   │   └── RecentFilesStore.kt   # Recent file history (JSON)
│   └── util/
│       ├── FileUtils.kt          # File/URI utilities
│       └── FormatUtils.kt        # Duration/size formatters
├── gradle/libs.versions.toml     # Version catalog
└── app/build.gradle.kts          # App dependencies
```

## Features

### Playback
- Video playback (MP4, MKV, AVI, WebM, FLV, MOV, and 27+ formats)
- Audio playback (MP3, FLAC, AAC, OGG, WAV, M4A, and 20+ formats)
- Image viewer (JPG, PNG, BMP, GIF, WebP, HEIC, and 18+ formats)
- Playlist management (add, remove, reorder, clear)
- Playback speed control (0.25x to 8x)
- Aspect ratio modes (Fit, Fill, Crop, Stretch, 4:3, 16:9)
- Repeat modes (None, All, One) and Shuffle
- A-B loop with automatic seek-back
- Sleep timer (5-90 minutes with countdown)

### UI/UX
- Dark theme with purple-blue glassmorphism accent
- Edge-to-edge layout with transparent system bars
- Player controls overlay with auto-hide (4s)
- Slide-out playlist panel
- Speed indicator badge (when != 1x)
- Sleep timer badge (when active)
- AB loop indicator badge
- Lock screen mode

### Gesture Controls
- Tap to toggle controls
- Double-tap to play/pause
- Horizontal swipe to seek
- Vertical swipe (left side) for volume
- Vertical swipe (right side) for brightness
- Gestures disabled when screen is locked

### Settings
- Auto-play next item in playlist
- Remember playback speed
- Keep screen on during playback
- Gesture toggles (volume, brightness, seek, floating controls)

### File Management
- Browse and open files from device storage
- Quick access cards (Videos, Audio, Images)
- Recent files history (up to 50 entries)
- Persistable URI permissions
- External file open support (via intent)

### Technical
- 100% Jetpack Compose UI (no XML layouts)
- Media3/ExoPlayer 1.5.1 for playback
- DataStore for preferences persistence
- Kotlin Serialization for JSON
- Accompanist for runtime permissions
- Foreground service for background playback
- Min SDK 26 (Android 8.0), Target SDK 35

## Architecture
- Single-Activity with Compose navigation
- `StateFlow<PlayerState>` reactive state management
- Manual state-based navigation (no Navigation Compose)
- `PlayerManager` wraps ExoPlayer with coroutine scope
- `RecentFilesStore` and `SettingsStore` use DataStore
