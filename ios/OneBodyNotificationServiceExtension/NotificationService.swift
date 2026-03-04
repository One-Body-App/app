import UserNotifications

final class NotificationService: UNNotificationServiceExtension {
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttemptContent: UNMutableNotificationContent?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    guard let bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent) else {
      contentHandler(request.content)
      return
    }

    self.bestAttemptContent = bestAttemptContent
    let userInfo = bestAttemptContent.userInfo
    let type = userInfo["type"] as? String ?? ""

    if type == "chat_e2ee_message" {
      let senderName = (userInfo["senderName"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
      bestAttemptContent.title = senderName?.isEmpty == false ? senderName! : "OneBody"
      bestAttemptContent.body = "New secure message"
    }

    // NOTE: Keychain sharing is enabled for this extension via entitlements.
    // Decrypt-and-preview can be added here after native crypto integration is finalized.
    contentHandler(bestAttemptContent)
  }

  override func serviceExtensionTimeWillExpire() {
    guard let contentHandler = contentHandler else {
      return
    }
    if let bestAttemptContent = bestAttemptContent {
      contentHandler(bestAttemptContent)
      return
    }
    contentHandler(UNMutableNotificationContent())
  }
}
