#if canImport(UIKit) && canImport(SwiftUI)
import Foundation
import SwiftUI
import UIKit
import React

@objc(OBDMessagesConversationListViewManager)
final class OBDMessagesConversationListViewManager: RCTViewManager {
  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func view() -> UIView! {
    MessagesConversationListContainerView()
  }
}

private struct MessagesConversationRowModel: Identifiable, Equatable {
  let id: String
  let conversationType: String
  let title: String
  let subtitle: String
  let avatarUri: String?
  let avatarFallback: String
  let timeLabel: String
  let unreadCount: Int
  let isMuted: Bool
  let isArchived: Bool
  let canArchive: Bool
  let canMute: Bool
  let canToggleRead: Bool
  let destructiveAction: String

  init?(dictionary: NSDictionary) {
    guard
      let id = dictionary["id"] as? String,
      let conversationType = dictionary["conversationType"] as? String,
      let title = dictionary["title"] as? String,
      let subtitle = dictionary["subtitle"] as? String,
      let avatarFallback = dictionary["avatarFallback"] as? String,
      let timeLabel = dictionary["timeLabel"] as? String,
      let unreadCount = dictionary["unreadCount"] as? NSNumber,
      let isMuted = dictionary["isMuted"] as? NSNumber,
      let isArchived = dictionary["isArchived"] as? NSNumber,
      let canArchive = dictionary["canArchive"] as? NSNumber,
      let canMute = dictionary["canMute"] as? NSNumber,
      let canToggleRead = dictionary["canToggleRead"] as? NSNumber,
      let destructiveAction = dictionary["destructiveAction"] as? String
    else {
      return nil
    }

    self.id = id
    self.conversationType = conversationType
    self.title = title
    self.subtitle = subtitle
    self.avatarUri = dictionary["avatarUri"] as? String
    self.avatarFallback = avatarFallback
    self.timeLabel = timeLabel
    self.unreadCount = unreadCount.intValue
    self.isMuted = isMuted.boolValue
    self.isArchived = isArchived.boolValue
    self.canArchive = canArchive.boolValue
    self.canMute = canMute.boolValue
    self.canToggleRead = canToggleRead.boolValue
    self.destructiveAction = destructiveAction
  }

  var isGroupConversation: Bool {
    conversationType == "group"
  }

  var isRead: Bool {
    unreadCount == 0
  }
}

private final class MessagesConversationListStore: ObservableObject {
  @Published var conversations: [MessagesConversationRowModel] = []
  @Published var bottomInset: CGFloat = 0

  var onPressConversation: ((String) -> Void)?
  var onMuteConversation: ((String, Bool) -> Void)?
  var onToggleReadConversation: ((String, Bool) -> Void)?
  var onArchiveConversation: ((String) -> Void)?
  var onDestructiveConversation: ((String) -> Void)?
  var onRequestDestructiveConversation: ((String, String) -> Void)?
}

private final class MessagesConversationListContainerView: UIView {
  @objc var conversations: NSArray = [] as NSArray {
    didSet {
      store.conversations = conversations.compactMap { element in
        guard let dictionary = element as? NSDictionary else {
          return nil
        }
        return MessagesConversationRowModel(dictionary: dictionary)
      }
    }
  }

  @objc var bottomInset: NSNumber = NSNumber(value: 0) {
    didSet {
      store.bottomInset = CGFloat(truncating: bottomInset)
    }
  }

  @objc var onPressConversation: RCTBubblingEventBlock? {
    didSet {
      store.onPressConversation = { [weak self] id in
        self?.onPressConversation?(["id": id])
      }
    }
  }

  @objc var onMuteConversation: RCTBubblingEventBlock? {
    didSet {
      store.onMuteConversation = { [weak self] id, nextMuted in
        self?.onMuteConversation?(["id": id, "nextMuted": nextMuted])
      }
    }
  }

  @objc var onToggleReadConversation: RCTBubblingEventBlock? {
    didSet {
      store.onToggleReadConversation = { [weak self] id, nextRead in
        self?.onToggleReadConversation?(["id": id, "nextRead": nextRead])
      }
    }
  }

  @objc var onArchiveConversation: RCTBubblingEventBlock? {
    didSet {
      store.onArchiveConversation = { [weak self] id in
        self?.onArchiveConversation?(["id": id])
      }
    }
  }

  @objc var onDestructiveConversation: RCTBubblingEventBlock? {
    didSet {
      store.onDestructiveConversation = { [weak self] id in
        self?.onDestructiveConversation?(["id": id])
      }
    }
  }

  private let store = MessagesConversationListStore()
  private lazy var hostingController = UIHostingController(
    rootView: MessagesConversationListRootView(store: store)
  )
  private weak var parentViewController: UIViewController?

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .clear
    store.onRequestDestructiveConversation = { [weak self] id, destructiveAction in
      self?.presentDestructiveConfirmation(
        conversationId: id,
        destructiveAction: destructiveAction
      )
    }
    hostingController.view.backgroundColor = .clear
    hostingController.view.translatesAutoresizingMaskIntoConstraints = false
    addSubview(hostingController.view)

    NSLayoutConstraint.activate([
      hostingController.view.leadingAnchor.constraint(equalTo: leadingAnchor),
      hostingController.view.trailingAnchor.constraint(equalTo: trailingAnchor),
      hostingController.view.topAnchor.constraint(equalTo: topAnchor),
      hostingController.view.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    attachHostingControllerIfNeeded()
  }

  private func attachHostingControllerIfNeeded() {
    guard
      parentViewController == nil,
      let viewController = nearestViewController()
    else {
      return
    }

    parentViewController = viewController
    viewController.addChild(hostingController)
    hostingController.didMove(toParent: viewController)
  }

  private func nearestViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let currentResponder = responder {
      if let viewController = currentResponder as? UIViewController {
        return viewController
      }
      responder = currentResponder.next
    }
    return nil
  }

  private func topMostViewController(from viewController: UIViewController) -> UIViewController {
    var topController = viewController
    while let presentedViewController = topController.presentedViewController {
      topController = presentedViewController
    }
    return topController
  }

  private func presentDestructiveConfirmation(
    conversationId: String,
    destructiveAction: String
  ) {
    guard let parentViewController else {
      return
    }

    let pendingAction = PendingDestructiveAction(
      conversationId: conversationId,
      destructiveAction: destructiveAction
    )
    let alertController = UIAlertController(
      title: pendingAction.title,
      message: pendingAction.message,
      preferredStyle: .alert
    )

    alertController.addAction(
      UIAlertAction(title: "Cancel", style: .cancel)
    )
    alertController.addAction(
      UIAlertAction(title: pendingAction.confirmLabel, style: .destructive) { [weak self] _ in
        self?.store.onDestructiveConversation?(conversationId)
      }
    )

    topMostViewController(from: parentViewController).present(alertController, animated: true)
  }
}

private struct MessagesConversationListRootView: View {
  @ObservedObject var store: MessagesConversationListStore

  var body: some View {
    List {
      ForEach(store.conversations) { conversation in
        MessagesConversationListRow(
          conversation: conversation,
          onPress: {
            store.onPressConversation?(conversation.id)
          },
          onMute: {
            store.onMuteConversation?(conversation.id, !conversation.isMuted)
          },
          onToggleRead: {
            store.onToggleReadConversation?(conversation.id, !conversation.isRead)
          },
          onArchive: {
            store.onArchiveConversation?(conversation.id)
          },
          onDestructive: {
            store.onRequestDestructiveConversation?(
              conversation.id,
              conversation.destructiveAction
            )
          }
        )
        .listRowInsets(EdgeInsets())
        .listRowSeparator(.hidden)
        .listRowBackground(Color.clear)
      }

      if store.bottomInset > 0 {
        Color.clear
          .frame(height: store.bottomInset)
          .listRowInsets(EdgeInsets())
          .listRowSeparator(.hidden)
          .listRowBackground(Color.clear)
      }
    }
    .listStyle(.plain)
    .modifier(HiddenListBackgroundModifier())
    .background(Color.clear)
    .environment(\.defaultMinListRowHeight, 0)
  }
}

private struct PendingDestructiveAction: Identifiable {
  let conversationId: String
  let destructiveAction: String

  var id: String {
    "\(conversationId):\(destructiveAction)"
  }

  var title: String {
    switch destructiveAction {
    case "delete":
      return "Delete thread?"
    default:
      return "Leave group?"
    }
  }

  var message: String {
    switch destructiveAction {
    case "delete":
      return "Are you sure you want to delete this thread?"
    default:
      return "Are you sure you want to leave this group?"
    }
  }

  var confirmLabel: String {
    switch destructiveAction {
    case "delete":
      return "Delete"
    default:
      return "Leave"
    }
  }
}

private struct MessagesConversationListRow: View {
  let conversation: MessagesConversationRowModel
  let onPress: () -> Void
  let onMute: () -> Void
  let onToggleRead: () -> Void
  let onArchive: () -> Void
  let onDestructive: () -> Void

  var body: some View {
    Button(action: onPress) {
      VStack(spacing: 0) {
        HStack(alignment: .top, spacing: 12) {
          avatarView

          VStack(alignment: .leading, spacing: 2) {
            HStack(alignment: .center, spacing: 6) {
              Text(conversation.title)
                .font(.system(size: 21, weight: .semibold))
                .foregroundStyle(Color.primary)
                .lineLimit(1)

              if conversation.unreadCount > 0 && !conversation.isGroupConversation {
                Circle()
                  .fill(Color(red: 34 / 255, green: 197 / 255, blue: 94 / 255))
                  .frame(width: 12, height: 12)
                  .overlay(
                    Circle()
                      .stroke(Color.white, lineWidth: 1.5)
                  )
              }

              if conversation.isMuted {
                Image(systemName: "bell.slash.fill")
                  .font(.system(size: 13, weight: .semibold))
                  .foregroundStyle(Color(red: 18 / 255, green: 107 / 255, blue: 135 / 255).opacity(0.72))
              }

              Spacer(minLength: 0)
            }

            HStack(alignment: .center, spacing: 6) {
              Text(conversation.subtitle)
                .font(.system(size: 14, weight: .regular))
                .foregroundStyle(Color.primary.opacity(0.8))
                .lineLimit(1)

              Spacer(minLength: 0)
            }
          }

          VStack(alignment: .trailing, spacing: 8) {
            Text(conversation.timeLabel)
              .font(.system(size: 13, weight: .medium))
              .foregroundStyle(Color.primary.opacity(0.8))
              .lineLimit(1)

            if conversation.unreadCount > 0 {
              Text("\(conversation.unreadCount)")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.white)
                .padding(.horizontal, 8)
                .frame(minWidth: 24, minHeight: 24)
                .background(
                  Capsule()
                    .fill(Color(red: 18 / 255, green: 107 / 255, blue: 135 / 255))
                )
            } else {
              Spacer()
                .frame(height: 24)
            }
          }
        }
        .padding(.vertical, 12)

        Divider()
          .padding(.leading, 64)
      }
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .modifier(MessagesSwipeActionsModifier(
      conversation: conversation,
      onMute: onMute,
      onToggleRead: onToggleRead,
      onArchive: onArchive,
      onDestructive: onDestructive
    ))
  }

  @ViewBuilder
  private var avatarView: some View {
    if conversation.isGroupConversation {
      Circle()
        .fill(Color(red: 18 / 255, green: 107 / 255, blue: 135 / 255))
        .frame(width: 52, height: 52)
        .overlay(
          Image(systemName: "person.3.fill")
            .font(.system(size: 18, weight: .semibold))
            .foregroundStyle(.white)
        )
        .padding(.top, 2)
    } else if let avatarUri = conversation.avatarUri, let url = URL(string: avatarUri), !avatarUri.isEmpty {
      AsyncImage(url: url) { phase in
        switch phase {
        case .success(let image):
          image
            .resizable()
            .scaledToFill()
        default:
          avatarFallbackView
        }
      }
      .frame(width: 52, height: 52)
      .clipShape(Circle())
      .padding(.top, 2)
    } else {
      avatarFallbackView
    }
  }

  private var avatarFallbackView: some View {
    Circle()
      .fill(Color(red: 18 / 255, green: 107 / 255, blue: 135 / 255))
      .frame(width: 52, height: 52)
      .overlay(
        Text(String(conversation.avatarFallback.prefix(1)).uppercased())
          .font(.system(size: 17, weight: .bold))
          .foregroundStyle(.white)
      )
      .padding(.top, 2)
  }
}

private struct MessagesSwipeActionsModifier: ViewModifier {
  let conversation: MessagesConversationRowModel
  let onMute: () -> Void
  let onToggleRead: () -> Void
  let onArchive: () -> Void
  let onDestructive: () -> Void

  func body(content: Content) -> some View {
    content
      .swipeActions(edge: .leading, allowsFullSwipe: false) {
        if conversation.isArchived {
          if conversation.canArchive {
            Button("Unarchive", systemImage: "archivebox.fill", action: onArchive)
              .tint(Color(red: 18 / 255, green: 107 / 255, blue: 135 / 255))
          }
        } else {
          if conversation.canMute {
            Button(conversation.isMuted ? "Unmute" : "Silence", systemImage: conversation.isMuted ? "bell.fill" : "bell.slash.fill", action: onMute)
              .tint(.gray)
          }

          if conversation.canToggleRead {
            Button(conversation.isRead ? "Unread" : "Read", systemImage: conversation.isRead ? "envelope.badge.fill" : "envelope.open.fill", action: onToggleRead)
              .tint(.blue)
          }

          if conversation.canArchive {
            Button("Archive", systemImage: "archivebox.fill", action: onArchive)
              .tint(Color(red: 18 / 255, green: 107 / 255, blue: 135 / 255))
          }
        }
      }
      .swipeActions(edge: .trailing, allowsFullSwipe: false) {
        if !conversation.isArchived {
          Button(action: onDestructive) {
            Label(destructiveTitle, systemImage: destructiveIconName)
          }
          .tint(.red)
        }
      }
  }

  private var destructiveTitle: String {
    switch conversation.destructiveAction {
    case "delete":
      return "Delete"
    default:
      return "Leave"
    }
  }

  private var destructiveIconName: String {
    switch conversation.destructiveAction {
    case "delete":
      return "trash.fill"
    default:
      return "rectangle.portrait.and.arrow.right"
    }
  }
}
private struct HiddenListBackgroundModifier: ViewModifier {
  func body(content: Content) -> some View {
    if #available(iOS 16.0, *) {
      content.scrollContentBackground(.hidden)
    } else {
      content
    }
  }
}
#endif
