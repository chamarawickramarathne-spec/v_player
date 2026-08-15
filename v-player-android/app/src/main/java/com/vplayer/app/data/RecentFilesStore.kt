package com.vplayer.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.vplayer.app.player.MediaItem
import com.vplayer.app.player.MediaType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val Context.recentDataStore: DataStore<Preferences> by preferencesDataStore(name = "vplayer_recent")

class RecentFilesStore(private val context: Context) {

    private val json = Json { ignoreUnknownKeys = true }

    private object Keys {
        val RECENT_FILES = stringPreferencesKey("recent_files")
    }

    val recentFiles: Flow<List<MediaItem>> = context.recentDataStore.data.map { prefs ->
        val raw = prefs[Keys.RECENT_FILES] ?: "[]"
        try {
            json.decodeFromString<List<MediaItemDto>>(raw).map { it.toMediaItem() }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun addRecentFile(item: MediaItem) {
        context.recentDataStore.edit { prefs ->
            val raw = prefs[Keys.RECENT_FILES] ?: "[]"
            val current = try {
                json.decodeFromString<List<MediaItemDto>>(raw).map { it.toMediaItem() }
            } catch (e: Exception) {
                emptyList()
            }.toMutableList()

            current.removeAll { it.path == item.path }
            current.add(0, item)

            val limited = current.take(50)
            prefs[Keys.RECENT_FILES] = json.encodeToString(limited.map { it.toDto() })
        }
    }

    suspend fun removeRecentFile(path: String) {
        context.recentDataStore.edit { prefs ->
            val raw = prefs[Keys.RECENT_FILES] ?: "[]"
            val current = try {
                json.decodeFromString<List<MediaItemDto>>(raw).map { it.toMediaItem() }
            } catch (e: Exception) {
                emptyList()
            }.toMutableList()

            current.removeAll { it.path == path }
            prefs[Keys.RECENT_FILES] = json.encodeToString(current.map { it.toDto() })
        }
    }

    suspend fun clearRecentFiles() {
        context.recentDataStore.edit { it.remove(Keys.RECENT_FILES) }
    }
}

@kotlinx.serialization.Serializable
data class MediaItemDto(
    val id: String,
    val path: String,
    val name: String,
    val mediaType: String,
    val duration: Long = 0L,
    val size: Long = 0L,
    val dateAdded: Long = System.currentTimeMillis()
) {
    fun toMediaItem() = MediaItem(
        id = id,
        path = path,
        name = name,
        mediaType = when (mediaType) {
            "VIDEO" -> MediaType.VIDEO
            "AUDIO" -> MediaType.AUDIO
            "IMAGE" -> MediaType.IMAGE
            else -> MediaType.VIDEO
        },
        duration = duration,
        size = size,
        dateAdded = dateAdded
    )
}

fun MediaItem.toDto() = MediaItemDto(
    id = id,
    path = path,
    name = name,
    mediaType = mediaType.name,
    duration = duration,
    size = size,
    dateAdded = dateAdded
)
