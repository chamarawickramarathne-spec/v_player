package com.vplayer.app.ui.screens

import android.app.Activity
import android.content.Intent
import android.view.WindowManager
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QueueMusic
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.ui.PlayerView
import com.vplayer.app.player.PlayerManager
import com.vplayer.app.player.RepeatMode
import com.vplayer.app.ui.components.PlayerControls
import com.vplayer.app.ui.components.PlaylistPanel
import com.vplayer.app.ui.gestures.playerGestures
import com.vplayer.app.ui.theme.VPlayerAccent
import com.vplayer.app.ui.theme.VPlayerBackground
import com.vplayer.app.util.FileUtils
import com.vplayer.app.util.FormatUtils
import kotlinx.coroutines.delay

@Composable
fun PlayerScreen(
    initialPath: String? = null,
    initialPlaylist: List<String> = emptyList(),
    onBack: () -> Unit
) {
    val context = LocalContext.current

    val playerManager = remember {
        PlayerManager(context.applicationContext)
    }

    val state by playerManager.state.collectAsState()

    var showControls by remember { mutableStateOf(true) }
    var showPlaylist by remember { mutableStateOf(false) }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenMultipleDocuments()
    ) { uris ->
        if (uris.isNotEmpty()) {
            uris.forEach { uri ->
                try {
                    context.contentResolver.takePersistableUriPermission(
                        uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                } catch (_: Exception) {}
            }
            val paths = uris.map { FileUtils.uriToPath(context, it) }
            playerManager.addToPlaylist(paths)
        }
    }

    LaunchedEffect(showControls, state.isPlaying) {
        if (showControls && state.isPlaying) {
            delay(4000L)
            showControls = false
        }
    }

    LaunchedEffect(initialPath) {
        initialPath?.let { path ->
            if (initialPlaylist.isNotEmpty()) {
                playerManager.openFiles(initialPlaylist)
            } else {
                playerManager.openFile(path)
            }
        }
    }

    LaunchedEffect(state.isPlaying) {
        val activity = context as? Activity
        if (state.isPlaying) {
            activity?.window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
            activity?.window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    BackHandler {
        if (showPlaylist) {
            showPlaylist = false
        } else {
            playerManager.release()
            onBack()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        if (state.hasMedia) {
            AndroidView(
                factory = { ctx ->
                    PlayerView(ctx).apply {
                        useController = false
                        player = playerManager.getPlayer()
                    }
                },
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) {
                        showControls = !showControls
                    }
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(VPlayerBackground)
            )
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .playerGestures(
                    state = state,
                    onTap = { showControls = !showControls },
                    onDoubleTap = { playerManager.togglePlayPause() },
                    onSwipeSeek = { deltaMs -> playerManager.seekRelative(deltaMs) },
                    onSwipeVolume = { delta ->
                        val newVolume = (state.volume + delta).coerceIn(0f, 1f)
                        playerManager.setVolume(newVolume)
                    },
                    onSwipeBrightness = { delta ->
                        val activity = context as? Activity ?: return@playerGestures
                        val currentBrightness = playerManager.getBrightness(activity)
                        val newBrightness = (currentBrightness + delta).coerceIn(0.01f, 1f)
                        playerManager.setBrightness(activity, newBrightness)
                    }
                )
        )

        if (state.isBuffering) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = VPlayerAccent,
                    modifier = Modifier.size(48.dp),
                    strokeWidth = 3.dp
                )
            }
        }

        if (showControls && !state.isLocked) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 40.dp, end = 16.dp)
                    .align(Alignment.TopEnd)
            ) {
                Row {
                    if (state.playbackSpeed != 1f) {
                        Text(
                            text = FormatUtils.formatSpeed(state.playbackSpeed),
                            color = VPlayerAccent,
                            fontSize = 14.sp,
                            modifier = Modifier
                                .background(
                                    Color.Black.copy(alpha = 0.6f),
                                    shape = RoundedCornerShape(8.dp)
                                )
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }

                    IconButton(
                        onClick = { showPlaylist = !showPlaylist },
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = Color.Black.copy(alpha = 0.4f),
                            contentColor = Color.White
                        )
                    ) {
                        Icon(
                            Icons.Filled.QueueMusic,
                            contentDescription = "Playlist",
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }

        PlayerControls(
            state = state,
            visible = showControls,
            onBack = {
                playerManager.release()
                onBack()
            },
            onTogglePlay = { playerManager.togglePlayPause() },
            onStop = { playerManager.stop() },
            onSeek = { positionMs -> playerManager.seekTo(positionMs) },
            onSeekRelative = { deltaMs -> playerManager.seekRelative(deltaMs) },
            onNext = { playerManager.playNext() },
            onPrevious = { playerManager.playPrevious() },
            onToggleFullscreen = { playerManager.toggleFullscreen() },
            onToggleLock = { playerManager.toggleLock() },
            onSpeedChange = { speed -> playerManager.setPlaybackSpeed(speed) },
            onToggleSpeedMenu = { playerManager.toggleSpeedMenu() },
            onToggleAspectRatioMenu = { playerManager.toggleAspectRatioMenu() },
            onToggleSleepTimer = { playerManager.toggleSleepTimerMenu() },
            onToggleSubtitleSelector = { playerManager.toggleSubtitleSelector() },
            onCycleABLoop = { playerManager.cycleABLoop() },
            onCycleRepeat = {
                val nextMode = when (state.repeatMode) {
                    RepeatMode.NONE -> RepeatMode.ALL
                    RepeatMode.ALL -> RepeatMode.ONE
                    RepeatMode.ONE -> RepeatMode.NONE
                }
                playerManager.setRepeatMode(nextMode)
            },
            onToggleShuffle = { playerManager.toggleShuffle() },
            onSetAspectRatio = { ratio -> playerManager.setAspectRatio(ratio) },
            onSetSleepTimer = { minutes -> playerManager.startSleepTimer(minutes) },
            onCancelSleepTimer = { playerManager.cancelSleepTimer() },
            onSetSubtitleTrack = { index -> playerManager.selectSubtitleTrack(index) },
            onSetPlaybackSpeed = { speed -> playerManager.setPlaybackSpeed(speed) }
        )

        PlaylistPanel(
            visible = showPlaylist,
            playlist = state.playlist,
            currentIndex = state.playlistIndex,
            onSelectItem = { index -> playerManager.playIndex(index) },
            onRemoveItem = { index -> playerManager.removeFromPlaylist(index) },
            onClear = { playerManager.clearPlaylist() },
            onAddFiles = {
                filePickerLauncher.launch(arrayOf("video/*", "audio/*"))
            },
            modifier = Modifier.align(Alignment.CenterEnd)
        )
    }
}
