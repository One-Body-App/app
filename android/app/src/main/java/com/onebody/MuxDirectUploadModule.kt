package com.onebody

import android.content.Context
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.mux.video.upload.api.MuxUpload
import com.mux.video.upload.api.MuxUploadManager
import com.mux.video.upload.api.UploadStatus
import org.json.JSONObject
import java.io.File

class MuxDirectUploadModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    private const val MODULE_NAME = "MuxDirectUpload"
    private const val EVENT_NAME = "muxDirectUploadEvent"
    private const val PREFS_NAME = "mux_direct_upload_module"
    private const val KEY_UPLOAD_FILES = "upload_files"
    private const val KEY_TERMINAL_STATES = "terminal_states"
    private const val PROGRESS_EMIT_INTERVAL_MS = 500L
  }

  private val uploadRecordsById = mutableMapOf<String, String>()
  private val activeUploadsById = mutableMapOf<String, MuxUpload>()
  private val lastProgressEmitMs = mutableMapOf<String, Long>()

  override fun getName(): String = MODULE_NAME

  init {
    loadUploadRecords()
  }

  @ReactMethod
  fun startUpload(params: ReadableMap, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        val uploadId = params.getString("uploadId")?.trim().orEmpty()
        val uploadUrl = params.getString("uploadUrl")?.trim().orEmpty()
        val fileUri = params.getString("fileUri")?.trim().orEmpty()
        if (uploadId.isBlank() || uploadUrl.isBlank() || fileUri.isBlank()) {
          promise.reject("invalid_params", "uploadId, uploadUrl, and fileUri are required.")
          return@runOnUiThread
        }

        val videoFile = resolveVideoFile(fileUri)
        if (!videoFile.exists()) {
          promise.reject("missing_file", "Video file missing for native upload.")
          return@runOnUiThread
        }

        clearTerminalState(uploadId)
        val uploadBuilder = MuxUpload.Builder(Uri.parse(uploadUrl), videoFile)
        uploadBuilder.standardizationRequested(false)
        val upload = uploadBuilder.build()
        uploadRecordsById[uploadId] = fileUri
        persistUploadRecords()
        attachUpload(uploadId, fileUri, upload)
        upload.start()
        promise.resolve(null)
      } catch (error: Exception) {
        promise.reject("native_upload_start_failed", error.message, error)
      }
    }
  }

  @ReactMethod
  fun resumeCachedUploads(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        MuxUploadManager.resumeAllCachedJobs()
        promise.resolve(buildSnapshotsMap())
      } catch (error: Exception) {
        promise.reject("resume_failed", error.message, error)
      }
    }
  }

  @ReactMethod
  fun getCachedUploads(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        promise.resolve(buildSnapshotsMap())
      } catch (error: Exception) {
        promise.reject("snapshot_failed", error.message, error)
      }
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for React Native event emitter compatibility.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for React Native event emitter compatibility.
  }

  private fun attachUpload(uploadId: String, fileUri: String, upload: MuxUpload) {
    activeUploadsById[uploadId] = upload

    upload.setProgressListener { progress ->
      val now = System.currentTimeMillis()
      val last = lastProgressEmitMs[uploadId] ?: 0L
      if (now - last >= PROGRESS_EMIT_INTERVAL_MS) {
        lastProgressEmitMs[uploadId] = now
        emitEvent(
          uploadId = uploadId,
          fileUri = fileUri,
          state = "progress",
          bytesUploaded = progress.bytesUploaded,
          bytesTotal = progress.totalBytes,
        )
      }
    }

    upload.setStatusListener { status ->
      if (status is UploadStatus.UploadPaused) {
        persistTerminalState(
          uploadId,
          fileUri,
          state = "paused",
          bytesUploaded = status.uploadProgress.bytesUploaded,
          bytesTotal = status.uploadProgress.totalBytes,
          errorCode = null,
          errorMessage = null,
        )
      }
    }

    upload.setResultListener { result ->
      if (result.isSuccess) {
        val progress = result.getOrNull()
        persistTerminalState(
          uploadId,
          fileUri,
          state = "success",
          bytesUploaded = progress?.bytesUploaded ?: progress?.totalBytes ?: 0L,
          bytesTotal = progress?.totalBytes ?: 0L,
          errorCode = null,
          errorMessage = null,
        )
        emitEvent(
          uploadId = uploadId,
          fileUri = fileUri,
          state = "success",
          bytesUploaded = progress?.bytesUploaded ?: progress?.totalBytes,
          bytesTotal = progress?.totalBytes,
        )
      } else {
        val error = result.exceptionOrNull()
        val progress = upload.currentProgress
        persistTerminalState(
          uploadId,
          fileUri,
          state = "failed",
          bytesUploaded = progress.bytesUploaded,
          bytesTotal = progress.totalBytes,
          errorCode = error?.javaClass?.simpleName,
          errorMessage = error?.message,
        )
        emitEvent(
          uploadId = uploadId,
          fileUri = fileUri,
          state = "failure",
          bytesUploaded = progress.bytesUploaded,
          bytesTotal = progress.totalBytes,
          errorCode = error?.javaClass?.simpleName,
          errorMessage = error?.message,
        )
      }

      activeUploadsById.remove(uploadId)
      lastProgressEmitMs.remove(uploadId)
    }
  }

  private fun buildSnapshotsMap() = Arguments.createArray().apply {
    val terminalStates = readTerminalStates()

    uploadRecordsById.forEach { (uploadId, fileUri) ->
      val activeUpload = activeUploadsById[uploadId] ?: findManagedUpload(fileUri)?.also { upload ->
        attachUpload(uploadId, fileUri, upload)
      }
      val snapshot = when {
        activeUpload != null -> createSnapshotFromActiveUpload(uploadId, fileUri, activeUpload)
        terminalStates.has(uploadId) -> createSnapshotFromTerminalState(uploadId, terminalStates.getJSONObject(uploadId))
        else -> null
      }

      if (snapshot != null) {
        pushMap(snapshot)
      }
    }
  }

  private fun createSnapshotFromActiveUpload(
    uploadId: String,
    fileUri: String,
    upload: MuxUpload
  ) = Arguments.createMap().apply {
    val status = upload.uploadStatus
    val progress = upload.currentProgress
    putString("uploadId", uploadId)
    putString("fileUri", fileUri)
    putString(
      "state",
      when (status) {
        is UploadStatus.UploadPaused -> "paused"
        is UploadStatus.UploadFailed -> "failed"
        is UploadStatus.UploadSuccess -> "success"
        else -> "uploading"
      },
    )
    putDouble("bytesUploaded", progress.bytesUploaded.toDouble())
    putDouble("bytesTotal", progress.totalBytes.toDouble())
    if (status is UploadStatus.UploadFailed) {
      putString("errorCode", status.exception.javaClass.simpleName)
      putString("errorMessage", status.exception.message)
    }
  }

  private fun createSnapshotFromTerminalState(uploadId: String, value: JSONObject) =
    Arguments.createMap().apply {
      putString("uploadId", uploadId)
      putString("fileUri", value.optString("fileUri"))
      putString("state", value.optString("state"))
      putDouble("bytesUploaded", value.optDouble("bytesUploaded"))
      putDouble("bytesTotal", value.optDouble("bytesTotal"))
      if (value.has("errorCode")) {
        putString("errorCode", value.optString("errorCode"))
      }
      if (value.has("errorMessage")) {
        putString("errorMessage", value.optString("errorMessage"))
      }
    }

  private fun emitEvent(
    uploadId: String,
    fileUri: String,
    state: String,
    bytesUploaded: Long? = null,
    bytesTotal: Long? = null,
    errorCode: String? = null,
    errorMessage: String? = null,
  ) {
    if (!reactApplicationContext.hasActiveReactInstance()) {
      return
    }

    val payload = Arguments.createMap().apply {
      putString("uploadId", uploadId)
      putString("fileUri", fileUri)
      putString("state", state)
      if (bytesUploaded != null) {
        putDouble("bytesUploaded", bytesUploaded.toDouble())
      }
      if (bytesTotal != null) {
        putDouble("bytesTotal", bytesTotal.toDouble())
      }
      if (errorCode != null) {
        putString("errorCode", errorCode)
      }
      if (errorMessage != null) {
        putString("errorMessage", errorMessage)
      }
    }

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(EVENT_NAME, payload)
  }

  private fun resolveVideoFile(fileUri: String): File {
    val parsed = Uri.parse(fileUri)
    val path = if (parsed.scheme == "file") parsed.path else fileUri.removePrefix("file://")
    return File(requireNotNull(path) { "Invalid file path" })
  }

  private fun findManagedUpload(fileUri: String): MuxUpload? {
    val videoFile = resolveVideoFile(fileUri)
    return MuxUploadManager.findUploadByFile(videoFile)
  }

  private fun loadUploadRecords() {
    val raw = prefs().getString(KEY_UPLOAD_FILES, null) ?: return
    val json = JSONObject(raw)
    json.keys().forEach { key ->
      uploadRecordsById[key] = json.optString(key)
    }
  }

  private fun persistUploadRecords() {
    val json = JSONObject()
    uploadRecordsById.forEach { (uploadId, fileUri) ->
      json.put(uploadId, fileUri)
    }
    prefs().edit().putString(KEY_UPLOAD_FILES, json.toString()).apply()
  }

  private fun readTerminalStates(): JSONObject {
    val raw = prefs().getString(KEY_TERMINAL_STATES, null) ?: return JSONObject()
    return JSONObject(raw)
  }

  private fun persistTerminalState(
    uploadId: String,
    fileUri: String,
    state: String,
    bytesUploaded: Long,
    bytesTotal: Long,
    errorCode: String?,
    errorMessage: String?,
  ) {
    val terminalStates = readTerminalStates()
    terminalStates.put(
      uploadId,
      JSONObject().apply {
        put("fileUri", fileUri)
        put("state", state)
        put("bytesUploaded", bytesUploaded)
        put("bytesTotal", bytesTotal)
        if (errorCode != null) {
          put("errorCode", errorCode)
        }
        if (errorMessage != null) {
          put("errorMessage", errorMessage)
        }
      },
    )
    prefs().edit().putString(KEY_TERMINAL_STATES, terminalStates.toString()).apply()
  }

  private fun clearTerminalState(uploadId: String) {
    val terminalStates = readTerminalStates()
    if (!terminalStates.has(uploadId)) {
      return
    }
    terminalStates.remove(uploadId)
    prefs().edit().putString(KEY_TERMINAL_STATES, terminalStates.toString()).apply()
  }

  private fun prefs() = reactApplicationContext.getSharedPreferences(
    PREFS_NAME,
    Context.MODE_PRIVATE,
  )
}
