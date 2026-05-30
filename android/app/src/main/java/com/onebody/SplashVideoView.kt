package com.onebody

import android.content.Context
import android.graphics.SurfaceTexture
import android.media.MediaPlayer
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.AttributeSet
import android.view.Surface
import android.view.TextureView
import android.view.ViewGroup
import android.widget.FrameLayout
import org.devio.rn.splashscreen.SplashScreen

class SplashVideoView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {
    private val handler = Handler(Looper.getMainLooper())
    private val timeoutRunnable = Runnable { signalFinished() }
    private val textureView = TextureView(context)

    private var mediaPlayer: MediaPlayer? = null
    private var surface: Surface? = null
    private var started = false
    private var prepared = false
    private var finished = false

    init {
        setBackgroundColor(0xFFF6F6F7.toInt())
        textureView.layoutParams = LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        textureView.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
            override fun onSurfaceTextureAvailable(surfaceTexture: SurfaceTexture, width: Int, height: Int) {
                surface?.release()
                surface = Surface(surfaceTexture)
                mediaPlayer?.setSurface(surface)
                startIfReady()
            }

            override fun onSurfaceTextureSizeChanged(surfaceTexture: SurfaceTexture, width: Int, height: Int) = Unit

            override fun onSurfaceTextureDestroyed(surfaceTexture: SurfaceTexture): Boolean {
                mediaPlayer?.setSurface(null)
                surface?.release()
                surface = null
                return true
            }

            override fun onSurfaceTextureUpdated(surfaceTexture: SurfaceTexture) = Unit
        }
        addView(textureView)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        startPlaybackOnce()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        handler.removeCallbacks(timeoutRunnable)
        signalFinished()
        try {
            mediaPlayer?.setSurface(null)
            mediaPlayer?.release()
        } catch (_: Throwable) {
            // no-op; view is being torn down
        } finally {
            mediaPlayer = null
            surface?.release()
            surface = null
        }
    }

    private fun startPlaybackOnce() {
        if (started) return
        started = true
        handler.postDelayed(timeoutRunnable, 25000)

        try {
            val splashVideoUri = Uri.parse("android.resource://${context.packageName}/${R.raw.splash}")
            mediaPlayer = MediaPlayer().apply {
                isLooping = false
                setVolume(0f, 0f)
                setDataSource(context, splashVideoUri)
                setOnPreparedListener {
                    prepared = true
                    startIfReady()
                }
                setOnCompletionListener {
                    signalFinished()
                }
                setOnErrorListener { _, _, _ ->
                    signalFinished()
                    true
                }

                if (textureView.isAvailable) {
                    val surfaceTexture = textureView.surfaceTexture
                    if (surfaceTexture != null) {
                        surface?.release()
                        surface = Surface(surfaceTexture)
                        setSurface(surface)
                    }
                }

                prepareAsync()
            }
        } catch (_: Throwable) {
            signalFinished()
        }
    }

    private fun startIfReady() {
        val player = mediaPlayer ?: return
        if (!prepared || surface == null) return

        try {
            if (!player.isPlaying) {
                player.start()
            }
        } catch (_: Throwable) {
            signalFinished()
        }
    }

    private fun signalFinished() {
        if (finished) return
        finished = true
        handler.removeCallbacks(timeoutRunnable)
        SplashScreen.setAnimationFinished(true)
    }
}
