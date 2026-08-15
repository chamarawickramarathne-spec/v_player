package com.vplayer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vplayer.app.data.SettingsStore
import com.vplayer.app.ui.theme.VPlayerAccent
import com.vplayer.app.ui.theme.VPlayerBackground
import com.vplayer.app.ui.theme.VPlayerSurface
import com.vplayer.app.ui.theme.VPlayerSurfaceVariant
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val settingsStore = remember { SettingsStore(context) }
    val settings by settingsStore.settings.collectAsState(initial = null)
    val scope = rememberCoroutineScope()
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(VPlayerBackground),
        topBar = {
            LargeTopAppBar(
                title = {
                    Text(
                        text = "Settings",
                        fontWeight = FontWeight.Bold,
                        fontSize = 28.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.largeTopAppBarColors(
                    containerColor = VPlayerBackground,
                    scrolledContainerColor = VPlayerSurface,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                ),
                scrollBehavior = scrollBehavior
            )
        },
        containerColor = VPlayerBackground
    ) { paddingValues ->
        val currentSettings = settings ?: return@Scaffold

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            SectionHeader("Playback")

            SettingToggle(
                title = "Auto-play next",
                description = "Automatically play next item in playlist",
                checked = currentSettings.autoPlayNext,
                onCheckedChange = { scope.launch { settingsStore.updateAutoPlayNext(it) } }
            )

            SettingToggle(
                title = "Remember playback speed",
                description = "Restore last speed when opening new files",
                checked = currentSettings.rememberPlaybackSpeed,
                onCheckedChange = { scope.launch { settingsStore.updateRememberPlaybackSpeed(it) } }
            )

            SettingToggle(
                title = "Keep screen on",
                description = "Prevent screen from turning off during playback",
                checked = currentSettings.keepScreenOn,
                onCheckedChange = { scope.launch { settingsStore.updateKeepScreenOn(it) } }
            )

            Spacer(modifier = Modifier.height(12.dp))
            SectionHeader("Gestures")

            SettingToggle(
                title = "Volume swipe",
                description = "Vertical swipe to adjust volume",
                checked = currentSettings.gestureVolumeSwipe,
                onCheckedChange = { scope.launch { settingsStore.updateGestureVolumeSwipe(it) } }
            )

            SettingToggle(
                title = "Brightness swipe",
                description = "Vertical swipe to adjust brightness",
                checked = currentSettings.gestureBrightnessSwipe,
                onCheckedChange = { scope.launch { settingsStore.updateGestureBrightnessSwipe(it) } }
            )

            SettingToggle(
                title = "Seek swipe",
                description = "Horizontal swipe to seek",
                checked = currentSettings.gestureSeekSwipe,
                onCheckedChange = { scope.launch { settingsStore.updateGestureSeekSwipe(it) } }
            )

            SettingToggle(
                title = "Floating controls",
                description = "Show floating controls overlay",
                checked = currentSettings.showFloatingControls,
                onCheckedChange = { scope.launch { settingsStore.updateShowFloatingControls(it) } }
            )

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        color = VPlayerAccent,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.padding(vertical = 12.dp, horizontal = 4.dp)
    )
}

@Composable
private fun SettingToggle(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(VPlayerSurface.copy(alpha = 0.5f))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                color = Color.White,
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = description,
                color = Color.White.copy(alpha = 0.5f),
                fontSize = 12.sp
            )
        }

        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = VPlayerAccent,
                uncheckedThumbColor = Color.White.copy(alpha = 0.8f),
                uncheckedTrackColor = VPlayerSurfaceVariant,
                uncheckedBorderColor = Color.Transparent
            )
        )
    }
}
