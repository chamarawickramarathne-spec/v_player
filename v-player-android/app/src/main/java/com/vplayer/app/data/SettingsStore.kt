package com.vplayer.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "vplayer_settings")

data class AppSettings(
    val autoPlayNext: Boolean = true,
    val rememberPlaybackSpeed: Boolean = true,
    val defaultPlaybackSpeed: Float = 1f,
    val keepScreenOn: Boolean = true,
    val showFloatingControls: Boolean = true,
    val gestureVolumeSwipe: Boolean = true,
    val gestureBrightnessSwipe: Boolean = true,
    val gestureSeekSwipe: Boolean = true
)

class SettingsStore(private val context: Context) {

    private object Keys {
        val AUTO_PLAY_NEXT = booleanPreferencesKey("auto_play_next")
        val REMEMBER_PLAYBACK_SPEED = booleanPreferencesKey("remember_playback_speed")
        val DEFAULT_PLAYBACK_SPEED = floatPreferencesKey("default_playback_speed")
        val KEEP_SCREEN_ON = booleanPreferencesKey("keep_screen_on")
        val SHOW_FLOATING_CONTROLS = booleanPreferencesKey("show_floating_controls")
        val GESTURE_VOLUME_SWIPE = booleanPreferencesKey("gesture_volume_swipe")
        val GESTURE_BRIGHTNESS_SWIPE = booleanPreferencesKey("gesture_brightness_swipe")
        val GESTURE_SEEK_SWIPE = booleanPreferencesKey("gesture_seek_swipe")
    }

    val settings: Flow<AppSettings> = context.dataStore.data.map { prefs ->
        AppSettings(
            autoPlayNext = prefs[Keys.AUTO_PLAY_NEXT] ?: true,
            rememberPlaybackSpeed = prefs[Keys.REMEMBER_PLAYBACK_SPEED] ?: true,
            defaultPlaybackSpeed = prefs[Keys.DEFAULT_PLAYBACK_SPEED] ?: 1f,
            keepScreenOn = prefs[Keys.KEEP_SCREEN_ON] ?: true,
            showFloatingControls = prefs[Keys.SHOW_FLOATING_CONTROLS] ?: true,
            gestureVolumeSwipe = prefs[Keys.GESTURE_VOLUME_SWIPE] ?: true,
            gestureBrightnessSwipe = prefs[Keys.GESTURE_BRIGHTNESS_SWIPE] ?: true,
            gestureSeekSwipe = prefs[Keys.GESTURE_SEEK_SWIPE] ?: true
        )
    }

    suspend fun updateAutoPlayNext(value: Boolean) {
        context.dataStore.edit { it[Keys.AUTO_PLAY_NEXT] = value }
    }

    suspend fun updateRememberPlaybackSpeed(value: Boolean) {
        context.dataStore.edit { it[Keys.REMEMBER_PLAYBACK_SPEED] = value }
    }

    suspend fun updateDefaultPlaybackSpeed(value: Float) {
        context.dataStore.edit { it[Keys.DEFAULT_PLAYBACK_SPEED] = value }
    }

    suspend fun updateKeepScreenOn(value: Boolean) {
        context.dataStore.edit { it[Keys.KEEP_SCREEN_ON] = value }
    }

    suspend fun updateShowFloatingControls(value: Boolean) {
        context.dataStore.edit { it[Keys.SHOW_FLOATING_CONTROLS] = value }
    }

    suspend fun updateGestureVolumeSwipe(value: Boolean) {
        context.dataStore.edit { it[Keys.GESTURE_VOLUME_SWIPE] = value }
    }

    suspend fun updateGestureBrightnessSwipe(value: Boolean) {
        context.dataStore.edit { it[Keys.GESTURE_BRIGHTNESS_SWIPE] = value }
    }

    suspend fun updateGestureSeekSwipe(value: Boolean) {
        context.dataStore.edit { it[Keys.GESTURE_SEEK_SWIPE] = value }
    }
}
