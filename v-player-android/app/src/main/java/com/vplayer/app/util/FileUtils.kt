package com.vplayer.app.util

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.vplayer.app.player.MediaType

object FileUtils {

    fun getFileName(context: Context, uri: Uri): String {
        var name = "unknown"
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (cursor.moveToFirst() && nameIndex >= 0) {
                name = cursor.getString(nameIndex)
            }
        }
        return name
    }

    fun getFileSize(context: Context, uri: Uri): Long {
        var size = 0L
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
            if (cursor.moveToFirst() && sizeIndex >= 0) {
                size = cursor.getLong(sizeIndex)
            }
        }
        return size
    }

    fun getMediaType(name: String): MediaType {
        val ext = name.substringAfterLast(".", "").lowercase()
        return when {
            ext in VIDEO_EXTENSIONS -> MediaType.VIDEO
            ext in AUDIO_EXTENSIONS -> MediaType.AUDIO
            ext in IMAGE_EXTENSIONS -> MediaType.IMAGE
            else -> MediaType.VIDEO
        }
    }

    fun uriToPath(context: Context, uri: Uri): String {
        return when (uri.scheme) {
            "content" -> {
                val path = getFilePathFromContentUri(context, uri)
                path ?: uri.toString()
            }
            "file" -> uri.path ?: uri.toString()
            else -> uri.toString()
        }
    }

    private fun getFilePathFromContentUri(context: Context, uri: Uri): String? {
        val cursor = context.contentResolver.query(
            uri, arrayOf("_data"), null, null, null
        )
        return cursor?.use {
            if (it.moveToFirst()) {
                val columnIndex = it.getColumnIndex("_data")
                if (columnIndex >= 0) it.getString(columnIndex) else null
            } else null
        }
    }

    fun isMediaFile(name: String): Boolean {
        val ext = name.substringAfterLast(".", "").lowercase()
        return ext in VIDEO_EXTENSIONS || ext in AUDIO_EXTENSIONS || ext in IMAGE_EXTENSIONS
    }

    val VIDEO_EXTENSIONS = setOf(
        "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "ts", "m2ts", "3gp", "ogv",
        "rm", "rmvb", "vob", "asf", "divx", "f4v", "m4v", "mpg", "mpeg", "3g2", "mts",
        "mxf", "nsv", "ogm"
    )

    val AUDIO_EXTENSIONS = setOf(
        "mp3", "flac", "aac", "ogg", "wav", "wma", "m4a", "opus", "ac3", "dts", "alac",
        "aiff", "ape", "mid", "midi", "ra", "tta", "tak", "dsf", "dff"
    )

    val IMAGE_EXTENSIONS = setOf(
        "jpg", "jpeg", "png", "bmp", "gif", "tiff", "tif", "webp", "svg", "ico",
        "heic", "heif", "avif", "jxl", "psd", "tga", "hdr", "exr"
    )
}
