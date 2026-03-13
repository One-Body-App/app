import { resolveConversationTargetPayload } from './conversationTarget';
import { publishChatConversationRead } from './conversationReadSync';
import { ChatConversationTargetPayload, ConversationListItem } from './types';
import {
  getDirectConversationUnreadKey,
  getGroupConversationUnreadKey,
  setChatConversationUnread,
} from './unreadIndicator';

export type NormalizedConversationReadTarget =
  | {
      conversationType: 'direct';
      peerUserId: string;
      unreadKey: string;
    }
  | {
      conversationType: 'group';
      groupId: string;
      unreadKey: string;
    };

export const normalizeConversationReadTarget = (
  target: ChatConversationTargetPayload | null | undefined
): NormalizedConversationReadTarget | null => {
  if (!target) {
    return null;
  }

  if (target.conversationType === 'group') {
    const groupId = String(target.groupId || '').trim();
    if (!groupId) {
      return null;
    }

    return {
      conversationType: 'group',
      groupId,
      unreadKey: getGroupConversationUnreadKey(groupId),
    };
  }

  const peerUserId = String(target.peerUserId || '').trim();
  if (!peerUserId) {
    return null;
  }

  return {
    conversationType: 'direct',
    peerUserId,
    unreadKey: getDirectConversationUnreadKey(peerUserId),
  };
};

export const resolveConversationReadTarget = (
  item: Pick<ConversationListItem, 'conversationType' | 'groupId' | 'id' | 'peerUserId'>
) => normalizeConversationReadTarget(resolveConversationTargetPayload(item));

export const setConversationUnreadStateLocally = (
  target: ChatConversationTargetPayload | null | undefined,
  isRead: boolean,
  unreadCount = 1
) => {
  const normalizedTarget = normalizeConversationReadTarget(target);
  if (!normalizedTarget) {
    return null;
  }

  if (isRead) {
    setChatConversationUnread(normalizedTarget.unreadKey, false);
  } else {
    setChatConversationUnread(normalizedTarget.unreadKey, true, unreadCount);
  }

  return normalizedTarget;
};

export const syncConversationReadMutationLocally = (
  target: ChatConversationTargetPayload | null | undefined,
  isRead: boolean,
  unreadCount = 1
) => {
  const normalizedTarget = setConversationUnreadStateLocally(target, isRead, unreadCount);
  if (!normalizedTarget || !isRead) {
    return normalizedTarget;
  }

  if (normalizedTarget.conversationType === 'group') {
    publishChatConversationRead({
      conversationType: 'group',
      groupId: normalizedTarget.groupId,
    });
    return normalizedTarget;
  }

  publishChatConversationRead({
    conversationType: 'direct',
    peerUserId: normalizedTarget.peerUserId,
  });
  return normalizedTarget;
};
