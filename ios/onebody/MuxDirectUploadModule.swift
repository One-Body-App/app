#if canImport(UIKit)
import Foundation
import React
import MuxUploadSDK

@objc(MuxDirectUpload)
final class MuxDirectUpload: RCTEventEmitter {
  private static let eventName = "muxDirectUploadEvent"
  private static let uploadRecordsKey = "mux_direct_upload_records"
  private static let terminalStatesKey = "mux_direct_upload_terminal_states"
  private static let startupStatesKey = "mux_direct_upload_startup_states"

  private static let progressEmitIntervalMs: Double = 500
  private let uploadManager = DirectUploadManager.shared
  private var uploadRecordsById: [String: String] = [:]
  private var activeUploadsById: [String: DirectUpload] = [:]
  private var attachedUploadIdentifiersById: [String: ObjectIdentifier] = [:]
  private var lastProgressEmitMs: [String: Double] = [:]
  private var hasListeners = false

  override init() {
    super.init()
    uploadRecordsById = UserDefaults.standard.dictionary(forKey: Self.uploadRecordsKey) as? [String: String] ?? [:]
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    [Self.eventName]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(addListener:)
  override func addListener(_ eventName: String!) {
    super.addListener(eventName)
  }

  @objc(removeListeners:)
  override func removeListeners(_ count: Double) {
    super.removeListeners(count)
  }

  @objc(startUpload:resolver:rejecter:)
  func startUpload(
    _ params: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let uploadId = String(params["uploadId"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
      let uploadUrlValue = String(params["uploadUrl"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
      let fileUri = String(params["fileUri"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)

      guard
        !uploadId.isEmpty,
        let uploadURL = URL(string: uploadUrlValue),
        let fileURL = self.resolveFileURL(fileUri),
        FileManager.default.fileExists(atPath: fileURL.path)
      else {
        reject("invalid_params", "uploadId, uploadUrl, and fileUri are required.", nil)
        return
      }

      if let activeUpload = self.activeUploadsById[uploadId] {
        self.attach(uploadId: uploadId, fileUri: fileUri, upload: activeUpload)
        resolve(nil)
        return
      }

      if let managedUpload = self.findManagedUpload(fileURL: fileURL) {
        let existingUploadId =
          self.findRecordedUploadId(fileURL: fileURL) ?? self.findActiveUploadId(fileURL: fileURL)
        if let existingUploadId, existingUploadId != uploadId {
          reject(
            "duplicate_upload_active",
            "A native upload is already active for this file.",
            nil
          )
          return
        }

        self.attach(uploadId: uploadId, fileUri: fileUri, upload: managedUpload)
        resolve(nil)
        return
      }

      if let existingUploadId = self.findActiveUploadId(fileURL: fileURL), existingUploadId != uploadId {
        reject(
          "duplicate_upload_active",
          "A native upload is already active for this file.",
          nil
        )
        return
      }

      self.persistStartupState(for: uploadId, fileUri: fileUri, state: "starting", step: "params_accepted")
      self.persistStartupState(for: uploadId, fileUri: fileUri, state: "starting", step: "file_resolved")
      let options = DirectUploadOptions(inputStandardization: .skipped)
      let upload = DirectUpload(
        uploadURL: uploadURL,
        inputFileURL: fileURL,
        options: options
      )

      self.persistStartupState(for: uploadId, fileUri: fileUri, state: "starting", step: "upload_built")
      self.clearTerminalState(for: uploadId)
      self.persistStartupState(for: uploadId, fileUri: fileUri, state: "starting", step: "listeners_attached")
      self.attach(uploadId: uploadId, fileUri: fileUri, upload: upload)
      self.persistStartupState(for: uploadId, fileUri: fileUri, state: "starting", step: "start_called")
      upload.start()
      resolve(nil)
    }
  }

  @objc(resumeCachedUploads:rejecter:)
  func resumeCachedUploads(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.uploadManager.resumeAllDirectUploads()

      for (uploadId, fileUri) in self.uploadRecordsById {
        guard let fileURL = self.resolveFileURL(fileUri) else {
          continue
        }

        if let activeUpload = self.findManagedUpload(fileURL: fileURL) {
          self.attach(uploadId: uploadId, fileUri: fileUri, upload: activeUpload)
        }
      }

      resolve(self.buildSnapshots())
    }
  }

  @objc(getCachedUploads:rejecter:)
  func getCachedUploads(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      resolve(self.buildSnapshots())
    }
  }

  private func attach(uploadId: String, fileUri: String, upload: DirectUpload) {
    let uploadIdentifier = ObjectIdentifier(upload)
    if attachedUploadIdentifiersById[uploadId] == uploadIdentifier {
      activeUploadsById[uploadId] = upload
      if uploadRecordsById[uploadId] != fileUri {
        uploadRecordsById[uploadId] = fileUri
        persistUploadRecords()
      }
      return
    }

    activeUploadsById[uploadId] = upload
    attachedUploadIdentifiersById[uploadId] = uploadIdentifier
    uploadRecordsById[uploadId] = fileUri
    persistUploadRecords()

    upload.progressHandler = { [weak self] transportStatus in
      guard let self else {
        return
      }

      if transportStatus.isPaused {
        self.persistTerminalState(
          for: uploadId,
          fileUri: fileUri,
          state: "paused",
          bytesUploaded: transportStatus.progress?.completedUnitCount ?? 0,
          bytesTotal: transportStatus.progress?.totalUnitCount ?? 0,
          errorCode: nil,
          errorMessage: nil
        )
      }

      self.markFirstCallbackReceived(for: uploadId, fileUri: fileUri)

      let now = Date().timeIntervalSince1970 * 1000
      let last = self.lastProgressEmitMs[uploadId] ?? 0
      if now - last >= Self.progressEmitIntervalMs {
        self.lastProgressEmitMs[uploadId] = now
        self.emitEvent(
          self.makeEventPayload(
            uploadId: uploadId,
            fileUri: fileUri,
            state: "progress",
            bytesUploaded: transportStatus.progress?.completedUnitCount,
            bytesTotal: transportStatus.progress?.totalUnitCount
          )
        )
      }
    }

    upload.resultHandler = { [weak self] result in
      guard let self else {
        return
      }

      switch result {
      case .success(let success):
        self.markTerminalStartupState(for: uploadId, fileUri: fileUri, step: "result_success")
        let finalProgress = success.finalState.progress
        self.persistTerminalState(
          for: uploadId,
          fileUri: fileUri,
          state: "success",
          bytesUploaded: finalProgress?.completedUnitCount ?? finalProgress?.totalUnitCount ?? 0,
          bytesTotal: finalProgress?.totalUnitCount ?? 0,
          errorCode: nil,
          errorMessage: nil
        )
        self.emitEvent(
          self.makeEventPayload(
            uploadId: uploadId,
            fileUri: fileUri,
            state: "success",
            bytesUploaded: finalProgress?.completedUnitCount ?? finalProgress?.totalUnitCount,
            bytesTotal: finalProgress?.totalUnitCount
          )
        )
      case .failure(let error):
        self.markTerminalStartupState(for: uploadId, fileUri: fileUri, step: "result_failure")
        let snapshot = self.snapshot(for: uploadId, fileUri: fileUri, upload: upload)
        self.persistTerminalState(
          for: uploadId,
          fileUri: fileUri,
          state: "failed",
          bytesUploaded: snapshot["bytesUploaded"] as? Int64 ?? 0,
          bytesTotal: snapshot["bytesTotal"] as? Int64 ?? 0,
          errorCode: String(describing: type(of: error)),
          errorMessage: error.localizedDescription
        )
        self.emitEvent(
          self.makeEventPayload(
            uploadId: uploadId,
            fileUri: fileUri,
            state: "failure",
            bytesUploaded: snapshot["bytesUploaded"] as? Int64,
            bytesTotal: snapshot["bytesTotal"] as? Int64,
            errorCode: String(describing: type(of: error)),
            errorMessage: error.localizedDescription
          )
        )
      }

      self.activeUploadsById.removeValue(forKey: uploadId)
      self.attachedUploadIdentifiersById.removeValue(forKey: uploadId)
      self.lastProgressEmitMs.removeValue(forKey: uploadId)
    }
  }

  private func buildSnapshots() -> [[String: Any]] {
    let terminalStates = readTerminalStates()
    let startupStates = readStartupStates()

    return uploadRecordsById.compactMap { uploadId, fileUri in
      guard let fileURL = resolveFileURL(fileUri) else {
        return nil
      }

      if let activeUpload = activeUploadsById[uploadId] ?? findManagedUpload(fileURL: fileURL) {
        attach(uploadId: uploadId, fileUri: fileUri, upload: activeUpload)
        var activeSnapshot = snapshot(for: uploadId, fileUri: fileUri, upload: activeUpload)
        appendStartupDiagnostics(
          to: &activeSnapshot,
          diagnostics: startupStates[uploadId] as? [String: Any]
        )
        return activeSnapshot
      }

      guard let terminalState = terminalStates[uploadId] as? [String: Any] else {
        return nil
      }

      var snapshot: [String: Any] = [
        "uploadId": uploadId,
        "fileUri": terminalState["fileUri"] as? String ?? fileUri,
        "state": terminalState["state"] as? String ?? "failed",
        "bytesUploaded": numberValue(terminalState["bytesUploaded"]),
        "bytesTotal": numberValue(terminalState["bytesTotal"]),
      ]
      if let errorCode = terminalState["errorCode"] as? String {
        snapshot["errorCode"] = errorCode
      }
      if let errorMessage = terminalState["errorMessage"] as? String {
        snapshot["errorMessage"] = errorMessage
      }
      appendStartupDiagnostics(
        to: &snapshot,
        diagnostics: startupStates[uploadId] as? [String: Any]
      )
      return snapshot
    }
  }

  private func snapshot(for uploadId: String, fileUri: String, upload: DirectUpload) -> [String: Any] {
    switch upload.inputStatus {
    case .paused(_, let transportStatus):
      return makeSnapshot(
        uploadId: uploadId,
        fileUri: fileUri,
        state: "paused",
        progress: transportStatus.progress,
        errorCode: nil,
        errorMessage: nil
      )
    case .finished(_, let result):
      switch result {
      case .success(let success):
        return makeSnapshot(
          uploadId: uploadId,
          fileUri: fileUri,
          state: "success",
          progress: success.finalState.progress,
          errorCode: nil,
          errorMessage: nil
        )
      case .failure(let error):
        return makeSnapshot(
          uploadId: uploadId,
          fileUri: fileUri,
          state: "failed",
          progress: upload.uploadStatus?.progress,
          errorCode: String(describing: type(of: error)),
          errorMessage: error.localizedDescription
        )
      }
    case .transportInProgress(_, let transportStatus):
      return makeSnapshot(
        uploadId: uploadId,
        fileUri: fileUri,
        state: "uploading",
        progress: transportStatus.progress,
        errorCode: nil,
        errorMessage: nil
      )
    default:
      return makeSnapshot(
        uploadId: uploadId,
        fileUri: fileUri,
        state: "uploading",
        progress: upload.uploadStatus?.progress,
        errorCode: nil,
        errorMessage: nil
      )
    }
  }

  private func makeSnapshot(
    uploadId: String,
    fileUri: String,
    state: String,
    progress: Progress?,
    errorCode: String?,
    errorMessage: String?
  ) -> [String: Any] {
    var snapshot: [String: Any] = [
      "uploadId": uploadId,
      "fileUri": fileUri,
      "state": state,
      "bytesUploaded": progress?.completedUnitCount ?? 0,
      "bytesTotal": progress?.totalUnitCount ?? 0,
    ]
    if let errorCode {
      snapshot["errorCode"] = errorCode
    }
    if let errorMessage {
      snapshot["errorMessage"] = errorMessage
    }
    return snapshot
  }

  private func makeEventPayload(
    uploadId: String,
    fileUri: String,
    state: String,
    bytesUploaded: Int64? = nil,
    bytesTotal: Int64? = nil,
    errorCode: String? = nil,
    errorMessage: String? = nil
  ) -> [String: Any] {
    var payload: [String: Any] = [
      "uploadId": uploadId,
      "fileUri": fileUri,
      "state": state,
    ]

    if let bytesUploaded {
      payload["bytesUploaded"] = bytesUploaded
    }
    if let bytesTotal {
      payload["bytesTotal"] = bytesTotal
    }
    if let errorCode {
      payload["errorCode"] = errorCode
    }
    if let errorMessage {
      payload["errorMessage"] = errorMessage
    }
    appendStartupDiagnostics(
      to: &payload,
      diagnostics: readStartupStates()[uploadId] as? [String: Any]
    )

    return payload
  }

  private func emitEvent(_ payload: [String: Any]) {
    guard hasListeners else {
      return
    }

    if Thread.isMainThread {
      sendEvent(withName: Self.eventName, body: payload)
      return
    }

    DispatchQueue.main.async {
      self.sendEvent(withName: Self.eventName, body: payload)
    }
  }

  private func resolveFileURL(_ fileUri: String) -> URL? {
    if fileUri.isEmpty {
      return nil
    }

    if let url = URL(string: fileUri), url.isFileURL {
      return url
    }

    return URL(fileURLWithPath: fileUri.replacingOccurrences(of: "file://", with: ""))
  }

  private func findManagedUpload(fileURL: URL) -> DirectUpload? {
    uploadManager.allManagedDirectUploads().first { managedUpload in
      managedUpload.videoFile?.standardizedFileURL == fileURL.standardizedFileURL
    }
  }

  private func findActiveUploadId(fileURL: URL) -> String? {
    uploadRecordsById.first { uploadId, _ in
      guard
        let activeUpload = activeUploadsById[uploadId],
        let activeFileURL = activeUpload.videoFile?.standardizedFileURL
      else {
        return false
      }
      return activeFileURL == fileURL.standardizedFileURL
    }?.key
  }

  private func findRecordedUploadId(fileURL: URL) -> String? {
    uploadRecordsById.first { _, recordedFileUri in
      guard let recordedFileURL = resolveFileURL(recordedFileUri)?.standardizedFileURL else {
        return false
      }
      return recordedFileURL == fileURL.standardizedFileURL
    }?.key
  }

  private func persistUploadRecords() {
    UserDefaults.standard.set(uploadRecordsById, forKey: Self.uploadRecordsKey)
  }

  private func readStartupStates() -> [String: [String: Any]] {
    UserDefaults.standard.dictionary(forKey: Self.startupStatesKey) as? [String: [String: Any]] ?? [:]
  }

  private func persistStartupState(
    for uploadId: String,
    fileUri: String,
    state: String,
    step: String,
    firstCallbackAt: String? = nil
  ) {
    var startupStates = readStartupStates()
    var startupState = startupStates[uploadId] ?? [:]
    startupState["fileUri"] = fileUri
    startupState["startupState"] = state
    startupState["startupStep"] = step
    startupState["startupUpdatedAt"] = timestampNow()
    if let firstCallbackAt {
      startupState["firstCallbackAt"] = firstCallbackAt
    }
    startupStates[uploadId] = startupState
    UserDefaults.standard.set(startupStates, forKey: Self.startupStatesKey)
  }

  private func markFirstCallbackReceived(for uploadId: String, fileUri: String) {
    let existingDiagnostics = readStartupStates()[uploadId]
    let firstCallbackAt = existingDiagnostics?["firstCallbackAt"] as? String ?? timestampNow()
    persistStartupState(
      for: uploadId,
      fileUri: fileUri,
      state: "active",
      step: "first_callback_received",
      firstCallbackAt: firstCallbackAt
    )
  }

  private func markTerminalStartupState(for uploadId: String, fileUri: String, step: String) {
    let existingDiagnostics = readStartupStates()[uploadId]
    let firstCallbackAt = existingDiagnostics?["firstCallbackAt"] as? String ?? timestampNow()
    persistStartupState(
      for: uploadId,
      fileUri: fileUri,
      state: "terminal",
      step: step,
      firstCallbackAt: firstCallbackAt
    )
  }

  private func appendStartupDiagnostics(to payload: inout [String: Any], diagnostics: [String: Any]?) {
    guard let diagnostics else {
      return
    }

    if let startupState = diagnostics["startupState"] as? String {
      payload["startupState"] = startupState
    }
    if let startupStep = diagnostics["startupStep"] as? String {
      payload["startupStep"] = startupStep
    }
    if let startupUpdatedAt = diagnostics["startupUpdatedAt"] as? String {
      payload["startupUpdatedAt"] = startupUpdatedAt
    }
    if let firstCallbackAt = diagnostics["firstCallbackAt"] as? String {
      payload["firstCallbackAt"] = firstCallbackAt
    }
  }

  private func readTerminalStates() -> [String: [String: Any]] {
    UserDefaults.standard.dictionary(forKey: Self.terminalStatesKey) as? [String: [String: Any]] ?? [:]
  }

  private func persistTerminalState(
    for uploadId: String,
    fileUri: String,
    state: String,
    bytesUploaded: Int64,
    bytesTotal: Int64,
    errorCode: String?,
    errorMessage: String?
  ) {
    var terminalStates = readTerminalStates()
    var terminalState: [String: Any] = [
      "fileUri": fileUri,
      "state": state,
      "bytesUploaded": bytesUploaded,
      "bytesTotal": bytesTotal,
    ]
    if let errorCode {
      terminalState["errorCode"] = errorCode
    }
    if let errorMessage {
      terminalState["errorMessage"] = errorMessage
    }
    terminalStates[uploadId] = terminalState
    UserDefaults.standard.set(terminalStates, forKey: Self.terminalStatesKey)
  }

  private func clearTerminalState(for uploadId: String) {
    var terminalStates = readTerminalStates()
    terminalStates.removeValue(forKey: uploadId)
    UserDefaults.standard.set(terminalStates, forKey: Self.terminalStatesKey)
  }

  private func numberValue(_ value: Any?) -> Int64 {
    if let number = value as? NSNumber {
      return number.int64Value
    }
    if let value = value as? Int64 {
      return value
    }
    if let value = value as? Int {
      return Int64(value)
    }
    if let value = value as? Double {
      return Int64(value)
    }
    return 0
  }

  private func timestampNow() -> String {
    ISO8601DateFormatter().string(from: Date())
  }
}
#endif
