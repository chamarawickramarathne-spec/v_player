package com.vplayer.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AudioFile
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.OndemandVideo
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.VideoFile
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vplayer.app.data.RecentFilesStore
import com.vplayer.app.player.MediaType
import com.vplayer.app.ui.components.GlassCard
import com.vplayer.app.ui.theme.VPlayerAccent
import com.vplayer.app.ui.theme.VPlayerBackground
import com.vplayer.app.ui.theme.VPlayerGlass
import com.vplayer.app.ui.theme.VPlayerSurface
import com.vplayer.app.util.FileUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onOpenFiles: (List<String>) -> Unit,
    onPlayFile: (String) -> Unit,
    onOpenSettings: () -> Unit = {},
    onPlayFilesOfType: (MediaType, List<String>) -> Unit = { _, _ -> }
) {
    val context = LocalContext.current
    val recentStore = remember { RecentFilesStore(context) }
    val recentFiles by recentStore.recentFiles.collectAsState(initial = emptyList())

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenMultipleDocuments()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            // Take persistable permissions
            uris.forEach { uri ->
                try {
                    context.contentResolver.takePersistableUriPermission(
                        uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                } catch (_: Exception) {}
            }

            val paths = uris.map { uri ->
                FileUtils.uriToPath(context, uri)
            }
            onOpenFiles(paths)
        }
    }

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(VPlayerBackground)
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            LargeTopAppBar(
                title = {
                    Text(
                        text = "V Player",
                        fontWeight = FontWeight.Bold,
                        fontSize = 32.sp
                    )
                },
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Filled.Settings, contentDescription = "Settings")
                    }
                },
                colors = TopAppBarDefaults.largeTopAppBarColors(
                    containerColor = VPlayerBackground,
                    scrolledContainerColor = VPlayerSurface,
                    titleContentColor = Color.White
                ),
                scrollBehavior = scrollBehavior
            )
        },
        containerColor = VPlayerBackground
    ) { paddingValues ->
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Open Files action
            item {
                ActionCard(
                    title = "Open Files",
                    subtitle = "Browse media",
                    icon = Icons.Filled.FolderOpen,
                    accentColor = VPlayerAccent,
                    onClick = {
                        filePickerLauncher.launch(
                            arrayOf(
                                "video/*",
                                "audio/*",
                                "image/*"
                            )
                        )
                    }
                )
            }

            // Quick access cards
            item {
                ActionCard(
                    title = "Videos",
                    subtitle = "${recentFiles.count { it.mediaType == MediaType.VIDEO }} recent",
                    icon = Icons.Filled.VideoFile,
                    accentColor = Color(0xFF6C63FF),
                    onClick = {
                        val videoPaths = recentFiles
                            .filter { it.mediaType == MediaType.VIDEO }
                            .map { it.path }
                        onPlayFilesOfType(MediaType.VIDEO, videoPaths)
                    }
                )
            }

            item {
                ActionCard(
                    title = "Audio",
                    subtitle = "${recentFiles.count { it.mediaType == MediaType.AUDIO }} recent",
                    icon = Icons.Filled.MusicNote,
                    accentColor = Color(0xFF51CF66),
                    onClick = {
                        val audioPaths = recentFiles
                            .filter { it.mediaType == MediaType.AUDIO }
                            .map { it.path }
                        onPlayFilesOfType(MediaType.AUDIO, audioPaths)
                    }
                )
            }

            item {
                ActionCard(
                    title = "Images",
                    subtitle = "${recentFiles.count { it.mediaType == MediaType.IMAGE }} recent",
                    icon = Icons.Filled.Image,
                    accentColor = Color(0xFFFF6B6B),
                    onClick = {
                        val imagePaths = recentFiles
                            .filter { it.mediaType == MediaType.IMAGE }
                            .map { it.path }
                        onPlayFilesOfType(MediaType.IMAGE, imagePaths)
                    }
                )
            }

            // Recent files section header
            if (recentFiles.isNotEmpty()) {
                item(span = { GridItemSpan(2) }) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Recent Files",
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "See All",
                            color = VPlayerAccent,
                            fontSize = 14.sp,
                            modifier = Modifier.clickable {}
                        )
                    }
                }

                // Show first 6 recent files
                items(recentFiles.take(6)) { item ->
                    RecentFileCard(
                        name = item.name,
                        mediaType = item.mediaType,
                        onClick = { onPlayFile(item.path) }
                    )
                }
            }
        }
    }
}

@Composable
private fun ActionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    onClick: () -> Unit
) {
    GlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .clickable(onClick = onClick)
            .animateContentSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = accentColor,
                modifier = Modifier.size(28.dp)
            )

            Column {
                Text(
                    text = title,
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = subtitle,
                    color = Color.White.copy(alpha = 0.6f),
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
private fun RecentFileCard(
    name: String,
    mediaType: MediaType,
    onClick: () -> Unit
) {
    val icon = when (mediaType) {
        MediaType.VIDEO -> Icons.Filled.OndemandVideo
        MediaType.AUDIO -> Icons.Filled.AudioFile
        MediaType.IMAGE -> Icons.Filled.Image
    }

    val accentColor = when (mediaType) {
        MediaType.VIDEO -> Color(0xFF6C63FF)
        MediaType.AUDIO -> Color(0xFF51CF66)
        MediaType.IMAGE -> Color(0xFFFF6B6B)
    }

    GlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .height(72.dp)
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(accentColor.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = name,
                    color = Color.White.copy(alpha = 0.9f),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    text = mediaType.name.lowercase().replaceFirstChar { it.uppercase() },
                    color = Color.White.copy(alpha = 0.5f),
                    fontSize = 11.sp
                )
            }

            Icon(
                Icons.Filled.PlayArrow,
                contentDescription = null,
                tint = accentColor,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
