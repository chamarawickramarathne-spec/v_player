package com.vplayer.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = VPlayerAccent,
    onPrimary = Color.White,
    primaryContainer = VPlayerAccentDark,
    onPrimaryContainer = Color.White,
    secondary = VPlayerSurface,
    onSecondary = VPlayerOnSurface,
    secondaryContainer = VPlayerSurfaceVariant,
    onSecondaryContainer = VPlayerOnSurface,
    background = VPlayerBackground,
    onBackground = VPlayerOnSurface,
    surface = VPlayerSurface,
    onSurface = VPlayerOnSurface,
    surfaceVariant = VPlayerSurfaceVariant,
    onSurfaceVariant = VPlayerOnSurfaceVariant,
    error = VPlayerError,
    onError = Color.White,
)

@Composable
fun VPlayerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
