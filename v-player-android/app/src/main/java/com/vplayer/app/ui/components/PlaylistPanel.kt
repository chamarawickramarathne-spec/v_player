package com.vplayer.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.FiberManualRecord
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.QueueMusic
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vplayer.app.player.MediaItem
import com.vplayer.app.player.MediaType
import com.vplayer.app.ui.theme.VPlayerAccent
import com.vplayer.app.ui.theme.VPlayerGlass
import com.vplayer.app.ui.theme.VPlayerGlassBorder
import com.vplayer.app.ui.theme.VPlayerSurface
import com.vplayer.app.ui.theme.VPlayerSurfaceVariant

@Composable
fun PlaylistPanel(
    visible: Boolean,
    playlist: List<MediaItem>,
    currentIndex: Int,
    onSelectItem: (Int) -> Unit,
    onRemoveItem: (Int) -> Unit,
    onClear: () -> Unit,
    onAddFiles: () -> Unit,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = visible,
        enter = slideInHorizontally(initialOffsetX = { it }),
        exit = slideOutHorizontally(targetOffsetX = { it })
    ) {
        Box(
            modifier = modifier
                .width(320.dp)
                .fillMaxHeight()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            VPlayerSurface.copy(alpha = 0.95f),
                            VPlayerSurfaceVariant.copy(alpha = 0.98f)
                        )
                    )
                )
                .padding(16.dp)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Filled.QueueMusic,
                            contentDescription = null,
                            tint = VPlayerAccent,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Playlist",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                        if (playlist.isNotEmpty()) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "(${playlist.size})",
                                color = VPlayerAccent,
                                fontSize = 16.sp
                            )
                        }
                    }

                    Row {
                        if (playlist.isNotEmpty()) {
                            IconButton(
                                onClick = onClear,
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    Icons.Filled.Delete,
                                    contentDescription = "Clear All",
                                    tint = Color.White.copy(alpha = 0.6f),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }

                        IconButton(
                            onClick = onAddFiles,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                Icons.Filled.Add,
                                contentDescription = "Add Files",
                                tint = VPlayerAccent,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (playlist.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Filled.QueueMusic,
                                contentDescription = null,
                                tint = VPlayerAccent.copy(alpha = 0.4f),
                                modifier = Modifier.size(64.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "No items in playlist",
                                color = Color.White.copy(alpha = 0.6f),
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            GlassButton(
                                text = "Add Files",
                                onClick = onAddFiles
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        itemsIndexed(playlist) { index, item ->
                            PlaylistItem(
                                item = item,
                                isPlaying = index == currentIndex,
                                onClick = { onSelectItem(index) },
                                onRemove = { onRemoveItem(index) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    GlassButton(
                        text = "Add More Files",
                        onClick = onAddFiles,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

@Composable
private fun PlaylistItem(
    item: MediaItem,
    isPlaying: Boolean,
    onClick: () -> Unit,
    onRemove: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(
                if (isPlaying) VPlayerAccent.copy(alpha = 0.2f)
                else VPlayerGlass.copy(alpha = 0.1f)
            )
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(
                    if (isPlaying) VPlayerAccent.copy(alpha = 0.3f)
                    else Color.White.copy(alpha = 0.05f)
                ),
            contentAlignment = Alignment.Center
        ) {
            if (isPlaying) {
                Icon(
                    Icons.Filled.FiberManualRecord,
                    contentDescription = null,
                    tint = VPlayerAccent,
                    modifier = Modifier.size(16.dp)
                )
            } else {
                Icon(
                    when (item.mediaType) {
                        MediaType.VIDEO -> Icons.Filled.PlayArrow
                        MediaType.AUDIO -> Icons.Filled.MusicNote
                        MediaType.IMAGE -> Icons.Filled.Image
                    },
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Text(
            text = item.name,
            color = if (isPlaying) VPlayerAccent else Color.White.copy(alpha = 0.85f),
            fontSize = 13.sp,
            fontWeight = if (isPlaying) FontWeight.SemiBold else FontWeight.Normal,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun GlassButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        VPlayerAccent.copy(alpha = 0.8f),
                        VPlayerAccent.copy(alpha = 0.6f)
                    )
                )
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 20.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = Color.White,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}
