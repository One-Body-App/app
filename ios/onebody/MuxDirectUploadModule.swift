#if canImport(UIKit)
import Foundation
import React
import MuxUploadSDK

@objc(MuxDirectUpload)
final class MuxDirectUpload: RCTEventEmitter {
  private static let eventName = "muxDirectUploadEvent"
  private static let uploadRecordsKey = "mux_direct_upload_records"
  private static let terminalStatesKey = "mux_direct_upload_terminal_states"

  private let uploadManager = UploadManager.shared
  private var uploadRecordsById: [String: String] = [:]
  private var activeUploadsById: [String: DirectUpload] = [:]
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

      let options = DirectUploadOptions(inputStandardization: .skipped)
      let upload = DirectUpload(
        uploadURL: uploadURL,
        inputFileURL: fileURL,
        options: options
      )

      self.clearTerminalState(for: uploadId)
      self.attach(uploadId: uploadId, fileUri: fileUri, upload: upload)
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
      self.uploadManager.resumeAllUploads()

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
    activeUploadsById[uploadId] = upload
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

    upload.resultHandler = { [weak self] result in
      guard let self else {
        return
      }

      switch result {
      case .success(let success):
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
    }
  }

  private func buildSnapshots() -> [[String: Any]] {
    let terminalStates = readTerminalStates()

    return uploadRecordsById.compactMap { uploadId, fileUri in
      guard let fileURL = resolveFileURL(fileUri) else {
        return nil
      }

      if let activeUpload = activeUploadsById[uploadId] ?? findManagedUpload(fileURL: fileURL) {
        attach(uploadId: uploadId, fileUri: fileUri, upload: activeUpload)
        return snapshot(for: uploadId, fileUri: fileUri, upload: activeUpload)
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
    uploadManager.allManagedUploads().first { managedUpload in
      managedUpload.videoFile?.standardizedFileURL == fileURL.standardizedFileURL
    }
  }

  private func persistUploadRecords() {
    UserDefaults.standard.set(uploadRecordsById, forKey: Self.uploadRecordsKey)
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
}
#endif
