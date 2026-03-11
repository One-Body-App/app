import { useSyncExternalStore } from 'react';
import { ConversationListItem } from './types';

const listeners = new Set<() => void>();
let unreadConversationKeys = new Set<string>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const setUnreadConversationKeys = (nextKeys: Set<string>) => {
  if (
    unreadConversationKeys.size === nextKeys.size &&
    [...unreadConversationKeys].every((key) => nextKeys.has(key))
  ) {
    return;
  }

  unreadConversationKeys = nextKeys;
  emitChange();
};

const buildConversationUnreadKey = (
  item: Pick<ConversationListItem, 'conversationType' | 'groupId' | 'id' | 'peerUserId'>
) => {
  const isGroupConversation = item.conversationType === 'group' || Boolean(item.groupId);

  if (isGroupConversation) {
    const fallbackGroupId =
      typeof item.id === 'string' && item.id.startsWith('group:')
        ? item.id.replace(/^group:/, '')
        : item.id;
    return `group:${item.groupId || fallbackGroupId}`;
  }

  const directPeerUserId = typeof item.peerUserId === 'string' ? item.peerUserId.trim() : '';
  if (directPeerUserId.length > 0) {
    return `direct:${directPeerUserId}`;
  }

  if (typeof item.id === 'string' && item.id.startsWith('c-')) {
    return `direct:${item.id.replace(/^c-/, '').trim()}`;
  }

  return 'direct:unknown';
};

const subscribeToChatUnread = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => unreadConversationKeys.size > 0;

export const publishChatUnreadFromConversations = (conversations: ConversationListItem[]) => {
  const nextKeys = new Set<string>();

  conversations.forEach((conversation) => {
    if (conversation.isArchived || conversation.unreadCount < 1) {
      return;
    }

    const conversationKey = buildConversationUnreadKey(conversation);
    if (conversationKey !== 'direct:unknown') {
      nextKeys.add(conversationKey);
    }
  });

  setUnreadConversationKeys(nextKeys);
};

export const setChatUnreadFlag = (hasUnread: boolean) => {
  setUnreadConversationKeys(hasUnread ? new Set(['__global__']) : new Set());
};

export const setChatConversationUnread = (conversationKey: string, hasUnread: boolean) => {
  const nextKeys = new Set(unreadConversationKeys);
  if (hasUnread) {
    nextKeys.add(conversationKey);
  } else {
    nextKeys.delete(conversationKey);
  }
  setUnreadConversationKeys(nextKeys);
};

export const getDirectConversationUnreadKey = (peerUserId: string) => `direct:${peerUserId}`;
export const getGroupConversationUnreadKey = (groupId: string) => `group:${groupId}`;

export const resetChatUnreadIndicator = () => {
  setUnreadConversationKeys(new Set());
};

export const useChatUnreadIndicator = () =>
  useSyncExternalStore(subscribeToChatUnread, getSnapshot, getSnapshot);
