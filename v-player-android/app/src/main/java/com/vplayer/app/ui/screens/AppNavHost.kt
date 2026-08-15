package com.vplayer.app.ui.screens

import android.Manifest
import android.net.Uri
import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.vplayer.app.ui.theme.VPlayerAccent
import com.vplayer.app.ui.theme.VPlayerBackground
import com.vplayer.app.util.FileUtils

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun AppNavHost(
    initialMediaUri: String? = null
) {
    val requiredPermissions = remember {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            listOf(
                Manifest.permission.READ_MEDIA_VIDEO,
                Manifest.permission.READ_MEDIA_AUDIO,
                Manifest.permission.READ_MEDIA_IMAGES
            )
        } else {
            listOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
    }

    val permissionsState = rememberMultiplePermissionsState(requiredPermissions)

    if (permissionsState.allPermissionsGranted || initialMediaUri != null) {
        MainContent(initialMediaUri = initialMediaUri)
    } else {
        PermissionScreen(
            onRequestPermission = { permissionsState.launchMultiplePermissionRequest() },
            permissionCount = permissionsState.permissions.count { it.status.isGranted },
            totalCount = permissionsState.permissions.size
        )
    }
}

@Composable
private fun PermissionScreen(
    onRequestPermission: () -> Unit,
    permissionCount: Int,
    totalCount: Int
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(VPlayerBackground)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Filled.Warning,
            contentDescription = null,
            tint = VPlayerAccent,
            modifier = Modifier.size(72.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Storage Permission Required",
            color = Color.White,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "V Player needs access to your media files to browse and play videos, audio, and images.",
            color = Color.White.copy(alpha = 0.7f),
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            lineHeight = 20.sp
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onRequestPermission,
            colors = ButtonDefaults.buttonColors(
                containerColor = VPlayerAccent,
                contentColor = Color.White
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(
                Icons.Filled.FolderOpen,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.size(8.dp))
            Text(
                text = "Grant Permission",
                fontWeight = FontWeight.SemiBold
            )
        }

        if (permissionCount > 0 && permissionCount < totalCount) {
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "$permissionCount of $totalCount permissions granted",
                color = VPlayerAccent,
                fontSize = 12.sp
            )
        }
    }
}

@Composable
private fun MainContent(
    initialMediaUri: String? = null
) {
    val context = LocalContext.current
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Home) }

    if (initialMediaUri != null) {
        val uri = Uri.parse(initialMediaUri)
        val path = FileUtils.uriToPath(context, uri)
        currentScreen = Screen.Player(path)
    }

    when (val screen = currentScreen) {
        is Screen.Home -> {
            HomeScreen(
                onOpenFiles = { paths ->
                    if (paths.isNotEmpty()) {
                        currentScreen = Screen.Player(paths.first(), paths)
                    }
                },
                onPlayFile = { path ->
                    currentScreen = Screen.Player(path)
                },
                onOpenSettings = {
                    currentScreen = Screen.Settings
                },
                onPlayFilesOfType = { _, paths ->
                    if (paths.isNotEmpty()) {
                        currentScreen = Screen.Player(paths.first(), paths)
                    }
                }
            )
        }

        is Screen.Player -> {
            PlayerScreen(
                initialPath = screen.path,
                initialPlaylist = screen.playlist,
                onBack = {
                    currentScreen = Screen.Home
                }
            )
        }

        is Screen.Settings -> {
            SettingsScreen(
                onBack = {
                    currentScreen = Screen.Home
                }
            )
        }
    }
}

sealed class Screen {
    data object Home : Screen()
    data class Player(
        val path: String,
        val playlist: List<String> = emptyList()
    ) : Screen()
    data object Settings : Screen()
}
