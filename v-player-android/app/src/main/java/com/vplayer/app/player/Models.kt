package com.vplayer.app.player

import kotlinx.serialization.Serializable

enum class MediaType {
    VIDEO, AUDIO, IMAGE
}

@Serializable
data class MediaItem(
    val id: String,
    val path: String,
    val name: String,
    val mediaType: MediaType,
    val duration: Long = 0L,
    val size: Long = 0L,
    val dateAdded: Long = System.currentTimeMillis()
)

data class PlayerState(
    val isPlaying: Boolean = false,
    val isPaused: Boolean = true,
    val currentTime: Long = 0L,
    val duration: Long = 0L,
    val volume: Float = 1f,
    val isMuted: Boolean = false,
    val playbackSpeed: Float = 1f,
    val isFullscreen: Boolean = false,
    val isBuffering: Boolean = false,
    val currentMedia: MediaItem? = null,
    val playlist: List<MediaItem> = emptyList(),
    val playlistIndex: Int = -1,
    val isLocked: Boolean = false,
    val showControls: Boolean = true,
    val repeatMode: RepeatMode = RepeatMode.NONE,
    val isShuffled: Boolean = false,
    val aspectRatio: VideoAspectRatio = VideoAspectRatio.FIT,
    val brightness: Float = -1f,
    val abLoop: ABLoopState = ABLoopState(),
    val sleepTimerMinutes: Int = 0,
    val sleepTimerRemainingMs: Long = 0L,
    val isSleepTimerActive: Boolean = false,
    val showSpeedMenu: Boolean = false,
    val showAspectRatioMenu: Boolean = false,
    val showSleepTimerMenu: Boolean = false,
    val showEqualizer: Boolean = false,
    val showSubtitleSelector: Boolean = false,
    val availableAudioTracks: List<AudioTrack> = emptyList(),
    val selectedAudioTrackIndex: Int = -1,
    val availableSubtitleTracks: List<SubtitleTrack> = emptyList(),
    val selectedSubtitleTrackIndex: Int = -1,
    val isScreenshotFlash: Boolean = false,
    val screenshotPath: String? = null
) {
    val progress: Float
        get() = if (duration > 0) (currentTime.toFloat() / duration).coerceIn(0f, 1f) else 0f

    val hasMedia: Boolean
        get() = currentMedia != null

    val hasNext: Boolean
        get() = playlistIndex < playlist.size - 1

    val hasPrevious: Boolean
        get() = playlistIndex > 0

    val isVideo: Boolean
        get() = currentMedia?.mediaType == MediaType.VIDEO

    val isAudio: Boolean
        get() = currentMedia?.mediaType == MediaType.AUDIO
}

enum class RepeatMode {
    NONE, ALL, ONE
}

enum class VideoAspectRatio(val label: String) {
    FIT("Fit"),
    FILL("Fill"),
    CROP("Crop"),
    STRETCH("Stretch"),
    FOUR_THREE("4:3"),
    SIXTEEN_NINE("16:9")
}

data class ABLoopState(
    val pointA: Long? = null,
    val pointB: Long? = null,
    val isActive: Boolean = false
) {
    val hasPoints: Boolean get() = pointA != null && pointB != null
    val isComplete: Boolean get() = pointA != null && pointB != null
}

data class AudioTrack(
    val index: Int,
    val name: String,
    val language: String = "",
    val isSelected: Boolean = false
)

data class SubtitleTrack(
    val index: Int,
    val name: String,
    val language: String = "",
    val isSelected: Boolean = false
)

enum class SwipeDirection {
    NONE, LEFT, RIGHT, UP, DOWN
}

enum class SwipeAction {
    NONE, SEEK, VOLUME, BRIGHTNESS
}
