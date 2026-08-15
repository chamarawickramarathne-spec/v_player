package com.vplayer.app.ui.gestures

import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import com.vplayer.app.player.PlayerState
import com.vplayer.app.player.SwipeAction
import com.vplayer.app.player.SwipeDirection

fun Modifier.playerGestures(
    state: PlayerState,
    onTap: () -> Unit,
    onDoubleTap: () -> Unit,
    onSwipeSeek: (Long) -> Unit,
    onSwipeVolume: (Float) -> Unit,
    onSwipeBrightness: (Float) -> Unit,
    seekSensitivity: Float = 0.5f,
    volumeSensitivity: Float = 0.01f
): Modifier {
    return this
        .pointerInput(state.isLocked) {
            detectTapGestures(
                onTap = { onTap() },
                onDoubleTap = { onDoubleTap() }
            )
        }
        .pointerInput(state.isLocked) {
            if (state.isLocked) return@pointerInput

            var initialX = 0f
            var initialY = 0f
            var accumulatedDx = 0f
            var accumulatedDy = 0f
            var currentAction = SwipeAction.NONE

            detectDragGestures(
                onDragStart = { offset ->
                    initialX = offset.x
                    initialY = offset.y
                    accumulatedDx = 0f
                    accumulatedDy = 0f
                    currentAction = SwipeAction.NONE
                },
                onDragEnd = {},
                onDragCancel = {},
                onDrag = { change, dragAmount ->
                    change.consume()

                    accumulatedDx += dragAmount.x
                    accumulatedDy += dragAmount.y

                    val horizontalDelta = accumulatedDx
                    val verticalDelta = accumulatedDy

                    if (currentAction == SwipeAction.NONE) {
                        val absHorizontal = kotlin.math.abs(horizontalDelta)
                        val absVertical = kotlin.math.abs(verticalDelta)

                        if (absHorizontal > 30f || absVertical > 30f) {
                            currentAction = when {
                                absHorizontal > absVertical && horizontalDelta > 0 -> SwipeAction.SEEK
                                absHorizontal > absVertical && horizontalDelta < 0 -> SwipeAction.SEEK
                                verticalDelta < 0 -> SwipeAction.VOLUME
                                else -> SwipeAction.BRIGHTNESS
                            }
                        }
                    }

                    when (currentAction) {
                        SwipeAction.SEEK -> {
                            val seekDelta = (horizontalDelta * seekSensitivity * state.duration / 1000).toLong()
                            onSwipeSeek(seekDelta)
                            accumulatedDx = 0f
                        }
                        SwipeAction.VOLUME -> {
                            val volumeDelta = -verticalDelta * volumeSensitivity
                            onSwipeVolume(volumeDelta)
                            accumulatedDy = 0f
                        }
                        SwipeAction.BRIGHTNESS -> {
                            val brightnessDelta = -verticalDelta * volumeSensitivity
                            onSwipeBrightness(brightnessDelta)
                            accumulatedDy = 0f
                        }
                        SwipeAction.NONE -> {}
                    }
                }
            )
        }
}
