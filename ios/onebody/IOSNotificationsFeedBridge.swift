#if canImport(UIKit)
import Foundation
import React
import UserNotifications

@objc(IOSNotificationsFeedBridge)
final class IOSNotificationsFeedBridge: RCTEventEmitter {
  private static let eventName = "iosNotificationsFeedEvent"
  private static weak var shared: IOSNotificationsFeedBridge?
  private static var pendingPayloads: [[String: Any]] = []

  private var hasListeners = false

  override init() {
    super.init()
    Self.shared = self
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

  @objc(getPendingNotifications:rejecter:)
  func getPendingNotifications(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    resolve(Self.consumePendingPayloads())
  }

  @objc static func emitRemoteNotificationRequest(_ request: UNNotificationRequest) {
    guard let payload = normalizedPayload(from: request) else {
      return
    }

    DispatchQueue.main.async {
      if let shared = Self.shared, shared.hasListeners {
        shared.sendEvent(withName: Self.eventName, body: payload)
      } else {
        Self.pendingPayloads.append(payload)
      }
    }
  }

  private static func consumePendingPayloads() -> [[String: Any]] {
    let payloads = pendingPayloads
    pendingPayloads.removeAll()
    return payloads
  }

  private static func normalizedPayload(from request: UNNotificationRequest) -> [String: Any]? {
    let serializerSelector = NSSelectorFromString("remoteMessageUserInfoToDict:")
    guard let serializerClass = NSClassFromString("RNFBMessagingSerializer") else {
      return nil
    }

    let serializerObject = serializerClass as AnyObject
    guard
      let unmanagedPayload = serializerObject.perform(
        serializerSelector,
        with: request.content.userInfo as NSDictionary
      ),
      let payload = unmanagedPayload.takeUnretainedValue() as? [String: Any]
    else {
      return nil
    }

    let messageId = normalizedString(payload["messageId"])
    guard !messageId.isEmpty else {
      return nil
    }

    return payload
  }

  private static func normalizedString(_ value: Any?) -> String {
    if let stringValue = value as? String {
      return stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    if let numberValue = value as? NSNumber {
      return numberValue.stringValue
    }

    if let boolValue = value as? Bool {
      return boolValue ? "true" : "false"
    }

    return ""
  }
}
#endif
