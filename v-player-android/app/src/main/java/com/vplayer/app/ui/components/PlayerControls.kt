package com.vplayer.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.Fullscreen
import androidx.compose.material.icons.filled.FullscreenExit
import androidx.compose.material.icons.filled.Loop
import androidx.compose.material.icons.filled.Lyrics
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.RepeatOne
import androidx.compose.material.icons.filled.Replay10
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vplayer.app.player.PlayerState
import com.vplayer.app.player.RepeatMode
import com.vplayer.app.player.VideoAspectRatio
import com.vplayer.app.ui.theme.VPlayerAccent
import com.vplayer.app.util.FormatUtils

@Composable
fun PlayerControls(
    state: PlayerState,
    onBack: () -> Unit,
    onTogglePlay: () -> Unit,
    onStop: () -> Unit,
    onSeek: (Long) -> Unit,
    onSeekRelative: (Long) -> Unit,
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onToggleFullscreen: () -> Unit,
    onToggleLock: () -> Unit,
    onSpeedChange: (Float) -> Unit,
    onToggleSpeedMenu: () -> Unit = {},
    onToggleAspectRatioMenu: () -> Unit = {},
    onToggleSleepTimer: () -> Unit = {},
    onToggleEqualizer: () -> Unit = {},
    onToggleSubtitleSelector: () -> Unit = {},
    onCycleABLoop: () -> Unit = {},
    onCycleRepeat: () -> Unit = {},
    onToggleShuffle: () -> Unit = {},
    onScreenshot: () -> Unit = {},
    onSetAspectRatio: (VideoAspectRatio) -> Unit = {},
    onSetSleepTimer: (Int) -> Unit = {},
    onCancelSleepTimer: () -> Unit = {},
    onSetSubtitleTrack: (Int) -> Unit = {},
    onSetPlaybackSpeed: (Float) -> Unit = {},
    visible: Boolean,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(),
        exit = fadeOut(),
        modifier = modifier.fillMaxSize()
    ) {
        PlayerOverlayControls {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 32.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onBack,
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = Color.Black.copy(alpha = 0.4f),
                            contentColor = Color.White
                        )
                    ) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }

                    Row {
                        if (state.isSleepTimerActive) {
                            IconButton(
                                onClick = onToggleSleepTimer,
                                colors = IconButtonDefaults.iconButtonColors(
                                    containerColor = Color.Black.copy(alpha = 0.4f),
                                    contentColor = VPlayerAccent
                                )
                            ) {
                                Icon(
                                    Icons.Filled.Timer,
                                    contentDescription = "Sleep Timer",
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        ControlIcon(Icons.Filled.Lyrics, "Subtitles") { onToggleSubtitleSelector() }
                        ControlIcon(Icons.Filled.Timer, "Sleep Timer") { onToggleSleepTimer() }
                        ControlIcon(Icons.Filled.Loop, "A-B Loop") { onCycleABLoop() }

                        Spacer(modifier = Modifier.width(4.dp))

                        IconButton(
                            onClick = onToggleLock,
                            colors = IconButtonDefaults.iconButtonColors(
                                containerColor = Color.Black.copy(alpha = 0.4f),
                                contentColor = Color.White
                            )
                        ) {
                            Icon(
                                if (state.isLocked) Icons.Filled.Loop else Icons.Filled.Loop,
                                contentDescription = if (state.isLocked) "Unlock" else "Lock",
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        IconButton(
                            onClick = onToggleFullscreen,
                            colors = IconButtonDefaults.iconButtonColors(
                                containerColor = Color.Black.copy(alpha = 0.4f),
                                contentColor = Color.White
                            )
                        ) {
                            Icon(
                                if (state.isFullscreen) Icons.Filled.FullscreenExit else Icons.Filled.Fullscreen,
                                contentDescription = "Fullscreen"
                            )
                        }
                    }
                }

                if (!state.isLocked) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = { onSeekRelative(-10_000L) },
                            modifier = Modifier.size(56.dp),
                            colors = IconButtonDefaults.iconButtonColors(
                                containerColor = Color.Black.copy(alpha = 0.4f),
                                contentColor = Color.White
                            )
                        ) {
                            Icon(
                                Icons.Filled.Replay10,
                                contentDescription = "Rewind 10s",
                                modifier = Modifier.size(32.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(24.dp))

                        IconButton(
                            onClick = onTogglePlay,
                            modifier = Modifier
                                .size(72.dp)
                                .background(VPlayerAccent, CircleShape),
                            colors = IconButtonDefaults.iconButtonColors(
                                contentColor = Color.White
                            )
                        ) {
                            Icon(
                                if (state.isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                                contentDescription = if (state.isPlaying) "Pause" else "Play",
                                modifier = Modifier.size(40.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(24.dp))

                        IconButton(
                            onClick = { onSeekRelative(10_000L) },
                            modifier = Modifier.size(56.dp),
                            colors = IconButtonDefaults.iconButtonColors(
                                containerColor = Color.Black.copy(alpha = 0.4f),
                                contentColor = Color.White
                            )
                        ) {
                            Icon(
                                Icons.Filled.Forward10,
                                contentDescription = "Forward 10s",
                                modifier = Modifier.size(32.dp)
                            )
                        }
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        IconButton(
                            onClick = onToggleLock,
                            colors = IconButtonDefaults.iconButtonColors(
                                containerColor = Color.Black.copy(alpha = 0.6f),
                                contentColor = Color.White
                            )
                        ) {
                            Icon(
                                Icons.Filled.Loop,
                                contentDescription = "Unlock",
                                modifier = Modifier.size(32.dp)
                            )
                        }
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 24.dp)
                ) {
                    if (state.abLoop.isActive) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            horizontalArrangement = Arrangement.Start,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .background(
                                        VPlayerAccent.copy(alpha = 0.2f),
                                        RoundedCornerShape(4.dp)
                                    )
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = buildString {
                                        append("A")
                                        if (state.abLoop.pointB != null) append("-B")
                                        append(": ")
                                        state.abLoop.pointA?.let { append(FormatUtils.formatDuration(it)) }
                                        if (state.abLoop.pointB != null) {
                                            append(" -> ")
                                            append(FormatUtils.formatDuration(state.abLoop.pointB!!))
                                        }
                                    },
                                    color = VPlayerAccent,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp)
                    ) {
                        SeekBar(
                            progress = state.progress,
                            onSeek = { fraction -> onSeek((fraction * state.duration).toLong()) }
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = FormatUtils.formatDuration(state.currentTime),
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 12.sp
                            )
                            Text(
                                text = FormatUtils.formatDuration(state.duration),
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 12.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (state.playlist.size > 1) {
                                IconButton(
                                    onClick = onPrevious,
                                    enabled = state.hasPrevious,
                                    colors = IconButtonDefaults.iconButtonColors(
                                        containerColor = Color.Black.copy(alpha = 0.4f),
                                        contentColor = if (state.hasPrevious) Color.White else Color.White.copy(alpha = 0.4f)
                                    )
                                ) {
                                    Icon(Icons.Filled.SkipPrevious, contentDescription = "Previous", modifier = Modifier.size(20.dp))
                                }

                                IconButton(
                                    onClick = onNext,
                                    enabled = state.hasNext,
                                    colors = IconButtonDefaults.iconButtonColors(
                                        containerColor = Color.Black.copy(alpha = 0.4f),
                                        contentColor = if (state.hasNext) Color.White else Color.White.copy(alpha = 0.4f)
                                    )
                                ) {
                                    Icon(Icons.Filled.SkipNext, contentDescription = "Next", modifier = Modifier.size(20.dp))
                                }
                            }

                            IconButton(
                                onClick = onToggleShuffle,
                                colors = IconButtonDefaults.iconButtonColors(
                                    containerColor = Color.Black.copy(alpha = 0.4f),
                                    contentColor = if (state.isShuffled) VPlayerAccent else Color.White.copy(alpha = 0.6f)
                                )
                            ) {
                                Icon(Icons.Filled.SkipNext, contentDescription = "Shuffle", modifier = Modifier.size(18.dp))
                            }

                            IconButton(
                                onClick = onCycleRepeat,
                                colors = IconButtonDefaults.iconButtonColors(
                                    containerColor = Color.Black.copy(alpha = 0.4f),
                                    contentColor = when (state.repeatMode) {
                                        RepeatMode.NONE -> Color.White.copy(alpha = 0.6f)
                                        else -> VPlayerAccent
                                    }
                                )
                            ) {
                                Icon(
                                    when (state.repeatMode) {
                                        RepeatMode.ONE -> Icons.Filled.RepeatOne
                                        else -> Icons.Filled.Repeat
                                    },
                                    contentDescription = "Repeat",
                                    modifier = Modifier.size(18.dp)
                                )
                            }

                            SpeedButton(
                                state = state,
                                onSpeedChange = onSetPlaybackSpeed
                            )
                        }

                        Text(
                            text = state.currentMedia?.name ?: "V Player",
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            maxLines = 1,
                            modifier = Modifier
                                .weight(1f)
                                .padding(horizontal = 12.dp)
                        )
                    }
                }
            }

            // Speed popup menu
            DropdownMenu(
                expanded = state.showSpeedMenu,
                onDismissRequest = onToggleSpeedMenu
            ) {
                listOf(0.25f, 0.5f, 0.75f, 1f, 1.25f, 1.5f, 2f, 3f, 4f, 8f).forEach { speed ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = "${speed}x",
                                color = if (state.playbackSpeed == speed) VPlayerAccent else Color.White
                            )
                        },
                        onClick = { onSetPlaybackSpeed(speed) }
                    )
                }
            }

            // Aspect Ratio popup menu
            DropdownMenu(
                expanded = state.showAspectRatioMenu,
                onDismissRequest = onToggleAspectRatioMenu
            ) {
                VideoAspectRatio.entries.forEach { ratio ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = ratio.label,
                                color = if (state.aspectRatio == ratio) VPlayerAccent else Color.White
                            )
                        },
                        onClick = { onSetAspectRatio(ratio) }
                    )
                }
            }

            // Sleep Timer popup menu
            DropdownMenu(
                expanded = state.showSleepTimerMenu,
                onDismissRequest = onToggleSleepTimer
            ) {
                listOf(5, 10, 15, 20, 30, 45, 60, 90).forEach { minutes ->
                    DropdownMenuItem(
                        text = { Text("$minutes min", color = Color.White) },
                        onClick = { onSetSleepTimer(minutes) }
                    )
                }
                if (state.isSleepTimerActive) {
                    DropdownMenuItem(
                        text = { Text("Cancel Timer", color = VPlayerAccent) },
                        onClick = { onCancelSleepTimer() }
                    )
                }
            }

            // Subtitle selector popup menu
            DropdownMenu(
                expanded = state.showSubtitleSelector,
                onDismissRequest = onToggleSubtitleSelector
            ) {
                DropdownMenuItem(
                    text = {
                        Text(
                            "Off",
                            color = if (state.selectedSubtitleTrackIndex == -1) VPlayerAccent else Color.White
                        )
                    },
                    onClick = { onSetSubtitleTrack(-1) }
                )
                state.availableSubtitleTracks.forEachIndexed { index, track ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = track.name,
                                color = if (state.selectedSubtitleTrackIndex == index) VPlayerAccent else Color.White
                            )
                        },
                        onClick = { onSetSubtitleTrack(index) }
                    )
                }
                if (state.availableSubtitleTracks.isEmpty()) {
                    DropdownMenuItem(
                        text = { Text("No subtitles found", color = Color.White.copy(alpha = 0.5f)) },
                        onClick = {}
                    )
                }
            }
        }
    }
}

@Composable
private fun SpeedButton(
    state: PlayerState,
    onSpeedChange: (Float) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Box {
        IconButton(
            onClick = { expanded = true },
            colors = IconButtonDefaults.iconButtonColors(
                containerColor = Color.Black.copy(alpha = 0.4f),
                contentColor = VPlayerAccent
            )
        ) {
            Text(
                text = FormatUtils.formatSpeed(state.playbackSpeed),
                color = VPlayerAccent,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            listOf(0.25f, 0.5f, 0.75f, 1f, 1.25f, 1.5f, 2f, 3f, 4f, 8f).forEach { speed ->
                DropdownMenuItem(
                    text = {
                        Text(
                            text = "${speed}x",
                            color = if (state.playbackSpeed == speed) VPlayerAccent else Color.White
                        )
                    },
                    onClick = {
                        onSpeedChange(speed)
                        expanded = false
                    }
                )
            }
        }
    }
}

@Composable
private fun ControlIcon(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    description: String,
    tint: Color = Color.White.copy(alpha = 0.7f),
    onClick: () -> Unit
) {
    IconButton(
        onClick = onClick,
        colors = IconButtonDefaults.iconButtonColors(
            containerColor = Color.Black.copy(alpha = 0.4f),
            contentColor = tint
        )
    ) {
        Icon(icon, contentDescription = description, modifier = Modifier.size(20.dp))
    }
}
