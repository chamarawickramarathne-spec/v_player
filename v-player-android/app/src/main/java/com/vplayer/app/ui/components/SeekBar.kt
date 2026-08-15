package com.vplayer.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import com.vplayer.app.ui.theme.VPlayerAccent
import com.vplayer.app.ui.theme.VPlayerGlassBorder

@Composable
fun SeekBar(
    progress: Float,
    onSeek: (Float) -> Unit,
    modifier: Modifier = Modifier,
    accentColor: Color = VPlayerAccent,
    trackHeight: Float = 4f,
    thumbRadius: Float = 8f
) {
    var isDragging by remember { mutableStateOf(false) }
    var dragProgress by remember { mutableFloatStateOf(0f) }

    val displayProgress = if (isDragging) dragProgress else progress

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(24.dp)
            .pointerInput(Unit) {
                detectTapGestures { offset ->
                    val newProgress = (offset.x / size.width).coerceIn(0f, 1f)
                    onSeek(newProgress)
                }
            }
            .pointerInput(Unit) {
                detectHorizontalDragGestures(
                    onDragStart = { offset ->
                        isDragging = true
                        dragProgress = (offset.x / size.width).coerceIn(0f, 1f)
                    },
                    onDragEnd = {
                        isDragging = false
                        onSeek(dragProgress)
                    },
                    onDragCancel = {
                        isDragging = false
                    },
                    onHorizontalDrag = { _, dragAmount ->
                        dragProgress = (dragProgress + dragAmount / size.width).coerceIn(0f, 1f)
                    }
                )
            }
    ) {
        val centerY = size.height / 2

        // Background track
        drawRoundRect(
            color = VPlayerGlassBorder,
            topLeft = Offset(0f, centerY - trackHeight / 2),
            size = Size(size.width, trackHeight),
            cornerRadius = CornerRadius(trackHeight / 2)
        )

        // Progress track
        drawRoundRect(
            color = accentColor,
            topLeft = Offset(0f, centerY - trackHeight / 2),
            size = Size(size.width * displayProgress, trackHeight),
            cornerRadius = CornerRadius(trackHeight / 2)
        )

        // Thumb
        drawCircle(
            color = Color.White,
            radius = thumbRadius,
            center = Offset(size.width * displayProgress, centerY)
        )

        // Thumb accent ring
        drawCircle(
            color = accentColor,
            radius = thumbRadius + 2f,
            center = Offset(size.width * displayProgress, centerY),
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f)
        )
    }
}
