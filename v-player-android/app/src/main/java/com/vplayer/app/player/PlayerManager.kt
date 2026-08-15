package com.vplayer.app.player

import android.content.Context
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem as ExoMediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import com.vplayer.app.data.RecentFilesStore
import com.vplayer.app.util.FileUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class PlayerManager(context: Context) {

    private val _state = MutableStateFlow(PlayerState())
    val state: StateFlow<PlayerState> = _state.asStateFlow()

    private val handler = Handler(Looper.getMainLooper())
    private var sleepTimerRunnable: Runnable? = null
    private var progressUpdateRunnable: Runnable? = null

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val recentStore = RecentFilesStore(context)

    private val exoPlayer: ExoPlayer = ExoPlayer.Builder(context)
        .build()

    private val playerListener = object : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            _state.update { it.copy(isPlaying = isPlaying, isPaused = !isPlaying) }
            if (isPlaying) startProgressUpdates() else stopProgressUpdates()
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
            when (playbackState) {
                Player.STATE_BUFFERING -> {
                    _state.update { it.copy(isBuffering = true) }
                }
                Player.STATE_READY -> {
                    _state.update {
                        it.copy(
                            isBuffering = false,
                            duration = exoPlayer.duration.coerceAtLeast(0)
                        )
                    }
                    updateTracks()
                }
                Player.STATE_ENDED -> {
                    if (_state.value.abLoop.isActive && _state.value.abLoop.hasPoints) {
                        val pointA = _state.value.abLoop.pointA ?: 0L
                        exoPlayer.seekTo(pointA)
                        exoPlayer.play()
                    } else {
                        handleTrackEnd()
                    }
                }
                Player.STATE_IDLE -> {
                    _state.update { it.copy(isBuffering = false) }
                }
            }
        }

        override fun onPlayerError(error: PlaybackException) {
            _state.update { it.copy(isBuffering = false, isPlaying = false, isPaused = true) }
        }

        override fun onMediaItemTransition(mediaItem: ExoMediaItem?, reason: Int) {
            val newIndex = exoPlayer.currentMediaItemIndex
            val currentItem = _state.value.playlist.getOrNull(newIndex)
            _state.update {
                it.copy(
                    playlistIndex = newIndex,
                    currentMedia = currentItem,
                    currentTime = 0L,
                    duration = exoPlayer.duration.coerceAtLeast(0),
                    abLoop = ABLoopState()
                )
            }
        }

        override fun onTracksChanged(tracks: Tracks) {
            updateTracksFromPlayer(tracks)
        }
    }

    init {
        exoPlayer.addListener(playerListener)
        exoPlayer.repeatMode = Player.REPEAT_MODE_OFF
    }

    private fun handleTrackEnd() {
        when (_state.value.repeatMode) {
            RepeatMode.ONE -> {
                exoPlayer.seekTo(0)
                exoPlayer.play()
            }
            RepeatMode.ALL -> {
                playNext()
            }
            RepeatMode.NONE -> {
                if (_state.value.hasNext) {
                    playNext()
                } else {
                    _state.update { it.copy(isPlaying = false, isPaused = true) }
                }
            }
        }
    }

    private fun startProgressUpdates() {
        stopProgressUpdates()
        progressUpdateRunnable = object : Runnable {
            override fun run() {
                val pos = exoPlayer.currentPosition
                _state.update { it.copy(currentTime = pos) }

                if (_state.value.abLoop.isActive) {
                    val b = _state.value.abLoop.pointB
                    if (b != null && pos >= b) {
                        val a = _state.value.abLoop.pointA ?: 0L
                        exoPlayer.seekTo(a)
                    }
                }

                handler.postDelayed(this, 250L)
            }
        }
        handler.post(progressUpdateRunnable!!)
    }

    private fun stopProgressUpdates() {
        progressUpdateRunnable?.let { handler.removeCallbacks(it) }
        progressUpdateRunnable = null
    }

    fun openFile(path: String) {
        val name = path.substringAfterLast("/").substringAfterLast("\\")
        val mediaType = detectMediaType(name)
        val item = MediaItem(
            id = System.currentTimeMillis().toString(),
            path = path,
            name = name,
            mediaType = mediaType
        )

        val exoItem = ExoMediaItem.Builder()
            .setUri(Uri.parse(path))
            .setMediaId(path)
            .build()

        _state.update {
            it.copy(
                playlist = listOf(item),
                playlistIndex = 0,
                currentMedia = item,
                isPlaying = true,
                isPaused = false,
                currentTime = 0L,
                abLoop = ABLoopState()
            )
        }

        exoPlayer.setMediaItem(exoItem)
        exoPlayer.prepare()
        exoPlayer.play()

        scope.launch {
            recentStore.addRecentFile(item)
        }
    }

    fun openFiles(paths: List<String>) {
        if (paths.isEmpty()) return

        val items = paths.map { path ->
            val name = path.substringAfterLast("/").substringAfterLast("\\")
            val mediaType = detectMediaType(name)
            MediaItem(
                id = System.currentTimeMillis().toString() + path.hashCode(),
                path = path,
                name = name,
                mediaType = mediaType
            )
        }

        val exoItems = paths.map { path ->
            ExoMediaItem.Builder()
                .setUri(Uri.parse(path))
                .setMediaId(path)
                .build()
        }

        _state.update {
            it.copy(
                playlist = items,
                playlistIndex = 0,
                currentMedia = items.firstOrNull(),
                isPlaying = true,
                isPaused = false,
                currentTime = 0L,
                abLoop = ABLoopState()
            )
        }

        exoPlayer.setMediaItems(exoItems)
        exoPlayer.prepare()
        exoPlayer.play()

        scope.launch {
            items.forEach { recentStore.addRecentFile(it) }
        }
    }

    fun addToPlaylist(paths: List<String>) {
        val currentPlaylist = _state.value.playlist.toMutableList()

        val newItems = paths.filter { path ->
            currentPlaylist.none { it.path == path }
        }.map { path ->
            val name = path.substringAfterLast("/").substringAfterLast("\\")
            val mediaType = detectMediaType(name)
            MediaItem(
                id = System.currentTimeMillis().toString() + path.hashCode(),
                path = path,
                name = name,
                mediaType = mediaType
            )
        }

        if (newItems.isEmpty()) return

        val newExoItems = newItems.map { item ->
            ExoMediaItem.Builder()
                .setUri(Uri.parse(item.path))
                .setMediaId(item.path)
                .build()
        }

        exoPlayer.addMediaItems(newExoItems)

        val updatedPlaylist = currentPlaylist + newItems
        _state.update { it.copy(playlist = updatedPlaylist) }

        if (_state.value.currentMedia == null && newItems.isNotEmpty()) {
            playIndex(_state.value.playlist.size - newItems.size)
        }
    }

    fun play() { exoPlayer.play() }
    fun pause() { exoPlayer.pause() }

    fun togglePlayPause() {
        if (_state.value.isPlaying) exoPlayer.pause() else exoPlayer.play()
    }

    fun stop() {
        exoPlayer.stop()
        stopProgressUpdates()
        cancelSleepTimer()
        _state.update {
            it.copy(
                isPlaying = false,
                isPaused = true,
                currentTime = 0L,
                duration = 0L,
                currentMedia = null,
                playlist = emptyList(),
                playlistIndex = -1,
                abLoop = ABLoopState()
            )
        }
    }

    fun seekTo(positionMs: Long) {
        exoPlayer.seekTo(positionMs.coerceIn(0, exoPlayer.duration))
        _state.update { it.copy(currentTime = positionMs) }
    }

    fun seekRelative(deltaMs: Long) {
        val newPos = (exoPlayer.currentPosition + deltaMs).coerceIn(0, exoPlayer.duration)
        exoPlayer.seekTo(newPos)
        _state.update { it.copy(currentTime = newPos) }
    }

    fun setVolume(volume: Float) {
        val clamped = volume.coerceIn(0f, 1f)
        exoPlayer.volume = clamped
        _state.update { it.copy(volume = clamped, isMuted = clamped == 0f) }
    }

    fun toggleMute() {
        val newMuted = !_state.value.isMuted
        exoPlayer.volume = if (newMuted) 0f else _state.value.volume
        _state.update { it.copy(isMuted = newMuted) }
    }

    fun setPlaybackSpeed(speed: Float) {
        val clamped = speed.coerceIn(0.25f, 8f)
        exoPlayer.setPlaybackSpeed(clamped)
        _state.update { it.copy(playbackSpeed = clamped, showSpeedMenu = false) }
    }

    fun setRepeatMode(mode: RepeatMode) {
        val exoRepeatMode = when (mode) {
            RepeatMode.NONE -> Player.REPEAT_MODE_OFF
            RepeatMode.ALL -> Player.REPEAT_MODE_ALL
            RepeatMode.ONE -> Player.REPEAT_MODE_ONE
        }
        exoPlayer.repeatMode = exoRepeatMode
        _state.update { it.copy(repeatMode = mode) }
    }

    fun toggleShuffle() {
        val newShuffled = !_state.value.isShuffled
        exoPlayer.shuffleModeEnabled = newShuffled
        _state.update { it.copy(isShuffled = newShuffled) }
    }

    fun setAspectRatio(ratio: VideoAspectRatio) {
        _state.update { it.copy(aspectRatio = ratio, showAspectRatioMenu = false) }
    }

    fun setBrightness(activity: android.app.Activity, brightness: Float) {
        val clamped = brightness.coerceIn(0f, 1f)
        val lp = activity.window.attributes
        lp.screenBrightness = clamped
        activity.window.attributes = lp
        _state.update { it.copy(brightness = clamped) }
    }

    fun getBrightness(activity: android.app.Activity): Float {
        val current = activity.window.attributes.screenBrightness
        return if (current < 0f) 0.5f else current
    }

    fun playIndex(index: Int) {
        val playlist = _state.value.playlist
        if (index !in playlist.indices) return

        exoPlayer.seekToDefaultPosition(index)
        exoPlayer.play()

        _state.update {
            it.copy(
                playlistIndex = index,
                currentMedia = playlist[index],
                isPlaying = true,
                isPaused = false,
                currentTime = 0L,
                abLoop = ABLoopState()
            )
        }
    }

    fun playNext() {
        val nextIndex = _state.value.playlistIndex + 1
        if (nextIndex < _state.value.playlist.size) {
            playIndex(nextIndex)
        } else if (_state.value.repeatMode == RepeatMode.ALL && _state.value.playlist.isNotEmpty()) {
            playIndex(0)
        }
    }

    fun playPrevious() {
        if (exoPlayer.currentPosition > 3000) {
            seekTo(0)
        } else {
            val prevIndex = _state.value.playlistIndex - 1
            if (prevIndex >= 0) {
                playIndex(prevIndex)
            } else if (_state.value.repeatMode == RepeatMode.ALL) {
                playIndex(_state.value.playlist.size - 1)
            }
        }
    }

    fun removeFromPlaylist(index: Int) {
        val currentPlaylist = _state.value.playlist.toMutableList()
        if (index !in currentPlaylist.indices) return

        currentPlaylist.removeAt(index)
        exoPlayer.removeMediaItem(index)

        val currentIndex = _state.value.playlistIndex
        val newIndex = when {
            currentPlaylist.isEmpty() -> -1
            index < currentIndex -> currentIndex - 1
            index == currentIndex && currentIndex >= currentPlaylist.size -> currentPlaylist.size - 1
            else -> currentIndex
        }

        _state.update {
            it.copy(
                playlist = currentPlaylist,
                playlistIndex = newIndex,
                currentMedia = currentPlaylist.getOrNull(newIndex)
            )
        }

        if (currentPlaylist.isEmpty()) stop()
    }

    fun clearPlaylist() {
        exoPlayer.stop()
        stopProgressUpdates()
        cancelSleepTimer()
        _state.update {
            it.copy(
                isPlaying = false,
                isPaused = true,
                currentTime = 0L,
                duration = 0L,
                currentMedia = null,
                playlist = emptyList(),
                playlistIndex = -1,
                abLoop = ABLoopState()
            )
        }
    }

    fun toggleFullscreen() {
        _state.update { it.copy(isFullscreen = !it.isFullscreen) }
    }

    fun toggleLock() {
        _state.update { it.copy(isLocked = !it.isLocked) }
    }

    fun toggleControls() {
        if (!_state.value.isLocked) {
            _state.update { it.copy(showControls = !it.showControls) }
        }
    }

    fun showControls() { _state.update { it.copy(showControls = true) } }

    fun hideControls() {
        if (!_state.value.isLocked) {
            _state.update { it.copy(showControls = false) }
        }
    }

    fun toggleSpeedMenu() {
        _state.update { it.copy(showSpeedMenu = !it.showSpeedMenu) }
    }

    fun toggleAspectRatioMenu() {
        _state.update { it.copy(showAspectRatioMenu = !it.showAspectRatioMenu) }
    }

    fun toggleSleepTimerMenu() {
        _state.update { it.copy(showSleepTimerMenu = !it.showSleepTimerMenu) }
    }

    fun toggleEqualizer() {
        _state.update { it.copy(showEqualizer = !it.showEqualizer) }
    }

    fun toggleSubtitleSelector() {
        _state.update { it.copy(showSubtitleSelector = !it.showSubtitleSelector) }
    }

    fun setABLoopPointA() {
        val pos = exoPlayer.currentPosition
        _state.update { it.copy(abLoop = ABLoopState(pointA = pos, pointB = null, isActive = true)) }
    }

    fun setABLoopPointB() {
        val a = _state.value.abLoop.pointA ?: return
        val pos = exoPlayer.currentPosition
        if (pos > a) {
            _state.update { it.copy(abLoop = ABLoopState(pointA = a, pointB = pos, isActive = true)) }
        }
    }

    fun clearABLoop() {
        _state.update { it.copy(abLoop = ABLoopState()) }
    }

    fun cycleABLoop() {
        val ab = _state.value.abLoop
        when {
            !ab.hasPoints -> setABLoopPointA()
            ab.hasPoints && ab.pointB == null -> setABLoopPointB()
            ab.hasPoints -> clearABLoop()
        }
    }

    fun startSleepTimer(minutes: Int) {
        cancelSleepTimer()
        if (minutes <= 0) {
            _state.update { it.copy(isSleepTimerActive = false, sleepTimerMinutes = 0, sleepTimerRemainingMs = 0) }
            return
        }
        val totalMs = minutes * 60L * 1000L
        _state.update {
            it.copy(
                isSleepTimerActive = true,
                sleepTimerMinutes = minutes,
                sleepTimerRemainingMs = totalMs,
                showSleepTimerMenu = false
            )
        }

        sleepTimerRunnable = object : Runnable {
            override fun run() {
                val remaining = _state.value.sleepTimerRemainingMs - 1000L
                if (remaining <= 0) {
                    exoPlayer.pause()
                    _state.update {
                        it.copy(isSleepTimerActive = false, sleepTimerMinutes = 0, sleepTimerRemainingMs = 0)
                    }
                } else {
                    _state.update { it.copy(sleepTimerRemainingMs = remaining) }
                    handler.postDelayed(this, 1000L)
                }
            }
        }
        handler.postDelayed(sleepTimerRunnable!!, 1000L)
    }

    fun cancelSleepTimer() {
        sleepTimerRunnable?.let { handler.removeCallbacks(it) }
        sleepTimerRunnable = null
        _state.update { it.copy(isSleepTimerActive = false, sleepTimerMinutes = 0, sleepTimerRemainingMs = 0) }
    }

    fun selectAudioTrack(index: Int) {
        val track = _state.value.availableAudioTracks.getOrNull(index) ?: return
        try {
            val audioTracks = exoPlayer.currentTracks.groups.filter {
                it.type == C.TRACK_TYPE_AUDIO
            }
            if (track.index < audioTracks.size) {
                val group = audioTracks[track.index]
                val override = TrackSelectionOverride(group.mediaTrackGroup, listOf(0))
                exoPlayer.trackSelectionParameters = exoPlayer.trackSelectionParameters
                    .buildUpon()
                    .setOverrideForType(override)
                    .build()
            }
        } catch (_: Exception) {}
        _state.update { it.copy(selectedAudioTrackIndex = index) }
    }

    fun selectSubtitleTrack(index: Int) {
        if (index < 0) {
            exoPlayer.trackSelectionParameters = exoPlayer.trackSelectionParameters
                .buildUpon()
                .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true)
                .build()
            _state.update { it.copy(selectedSubtitleTrackIndex = -1) }
            return
        }
        val track = _state.value.availableSubtitleTracks.getOrNull(index) ?: return
        try {
            val textTracks = exoPlayer.currentTracks.groups.filter {
                it.type == C.TRACK_TYPE_TEXT
            }
            if (track.index < textTracks.size) {
                val group = textTracks[track.index]
                val override = TrackSelectionOverride(group.mediaTrackGroup, listOf(0))
                exoPlayer.trackSelectionParameters = exoPlayer.trackSelectionParameters
                    .buildUpon()
                    .setOverrideForType(override)
                    .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false)
                    .build()
            }
        } catch (_: Exception) {}
        _state.update { it.copy(selectedSubtitleTrackIndex = index) }
    }

    private fun updateTracks() {
        try {
            updateTracksFromPlayer(exoPlayer.currentTracks)
        } catch (_: Exception) {}
    }

    @OptIn(UnstableApi::class)
    private fun updateTracksFromPlayer(tracks: Tracks) {
        val audioTracks = mutableListOf<SubtitleTrack>()
        val subtitleTracks = mutableListOf<SubtitleTrack>()

        for (i in 0 until tracks.groups.size) {
            val group = tracks.groups[i]
            when (group.type) {
                C.TRACK_TYPE_AUDIO -> {
                    for (j in 0 until group.length) {
                        val fmt = group.getTrackFormat(j)
                        audioTracks.add(
                            AudioTrack(
                                index = audioTracks.size,
                                name = fmt.label ?: fmt.language ?: "Audio ${audioTracks.size + 1}",
                                language = fmt.language ?: "",
                                isSelected = group.isTrackSelected(j)
                            ).let {
                                SubtitleTrack(it.index, it.name, it.language, it.isSelected)
                            }
                        )
                    }
                }
                C.TRACK_TYPE_TEXT -> {
                    for (j in 0 until group.length) {
                        val fmt = group.getTrackFormat(j)
                        subtitleTracks.add(
                            SubtitleTrack(
                                index = subtitleTracks.size,
                                name = fmt.label ?: fmt.language ?: "Track ${subtitleTracks.size + 1}",
                                language = fmt.language ?: "",
                                isSelected = group.isTrackSelected(j)
                            )
                        )
                    }
                }
            }
        }

        _state.update {
            it.copy(
                availableAudioTracks = audioTracks.map {
                    AudioTrack(it.index, it.name, it.language, it.isSelected)
                },
                availableSubtitleTracks = subtitleTracks
            )
        }
    }

    fun getPlayer(): ExoPlayer = exoPlayer

    fun release() {
        stopProgressUpdates()
        cancelSleepTimer()
        exoPlayer.removeListener(playerListener)
        exoPlayer.release()
    }

    private fun detectMediaType(name: String): MediaType {
        return FileUtils.getMediaType(name)
    }
}
