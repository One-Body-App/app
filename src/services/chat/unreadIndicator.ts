import { useSyncExternalStore } from 'react';
import { ConversationListItem } from './types';

const listeners = new Set<() => void>();
let unreadConversationKeys = new Set<string>();
let totalUnreadCount = 0;
const unreadCountByKey = new Map<string, number>();
const locallyReadAtByKey = new Map<string, number>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const areSetsEqual = (left: Set<string>, right: Set<string>) =>
  left.size === right.size && [...left].every((key) => right.has(key));

const computeTotalUnreadCount = () =>
  [...unreadCountByKey.values()].reduce((sum, count) => sum + count, 0);

const toTimestamp = (value?: string) => {
  const parsed = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

const shouldApplyLocalReadOverride = (conversationKey: string, updatedAt?: string) => {
  const locallyReadAt = locallyReadAtByKey.get(conversationKey);
  if (!locallyReadAt) {
    return false;
  }

  const updatedAtTimestamp = toTimestamp(updatedAt);
  if (updatedAtTimestamp > locallyReadAt) {
    locallyReadAtByKey.delete(conversationKey);
    return false;
  }

  return true;
};

const syncUnreadState = (nextKeys: Set<string>) => {
  const nextTotalUnreadCount = computeTotalUnreadCount();
  const didKeysChange = !areSetsEqual(unreadConversationKeys, nextKeys);
  const didTotalChange = totalUnreadCount !== nextTotalUnreadCount;

  unreadConversationKeys = nextKeys;
  totalUnreadCount = nextTotalUnreadCount;

  if (didKeysChange || didTotalChange) {
    emitChange();
  }
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

  unreadCountByKey.clear();

  conversations.forEach((conversation) => {
    const conversationKey = buildConversationUnreadKey(conversation);
    const hasLocalReadOverride =
      conversationKey !== 'direct:unknown' &&
      shouldApplyLocalReadOverride(conversationKey, conversation.updatedAt);

    if (conversation.isArchived || conversation.unreadCount < 1 || hasLocalReadOverride) {
      if (conversation.unreadCount < 1 && conversationKey !== 'direct:unknown') {
        locallyReadAtByKey.delete(conversationKey);
      }
      return;
    }

    if (conversationKey !== 'direct:unknown') {
      nextKeys.add(conversationKey);
      unreadCountByKey.set(conversationKey, conversation.unreadCount);
    }
  });

  syncUnreadState(nextKeys);
};

export const setChatUnreadFlag = (hasUnread: boolean) => {
  unreadCountByKey.clear();
  if (hasUnread) {
    unreadCountByKey.set('__global__', 1);
  }
  syncUnreadState(hasUnread ? new Set(['__global__']) : new Set());
};

export const setChatConversationUnread = (
  conversationKey: string,
  hasUnread: boolean,
  unreadCount = 1
) => {
  const nextKeys = new Set(unreadConversationKeys);
  if (hasUnread) {
    nextKeys.add(conversationKey);
    locallyReadAtByKey.delete(conversationKey);
    unreadCountByKey.set(conversationKey, Math.max(1, unreadCount));
  } else {
    locallyReadAtByKey.set(conversationKey, Date.now());
    unreadCountByKey.delete(conversationKey);
    nextKeys.delete(conversationKey);
  }
  syncUnreadState(nextKeys);
};

export const getDirectConversationUnreadKey = (peerUserId: string) => `direct:${peerUserId}`;
export const getGroupConversationUnreadKey = (groupId: string) => `group:${groupId}`;

export const resetChatUnreadIndicator = () => {
  unreadCountByKey.clear();
  locallyReadAtByKey.clear();
  syncUnreadState(new Set());
};

export const applyLocalConversationReadOverrides = (conversations: ConversationListItem[]) =>
  conversations.map((conversation) => {
    const conversationKey = buildConversationUnreadKey(conversation);
    if (
      conversationKey === 'direct:unknown' ||
      !shouldApplyLocalReadOverride(conversationKey, conversation.updatedAt) ||
      conversation.unreadCount < 1
    ) {
      return conversation;
    }

    return {
      ...conversation,
      unreadCount: 0,
      ...(conversation.conversationType === 'direct' ? { lastMessageStatus: 'read' as const } : {}),
    };
  });

export const useChatUnreadIndicator = () =>
  useSyncExternalStore(subscribeToChatUnread, getSnapshot, getSnapshot);

export const getChatUnreadCountSnapshot = () => totalUnreadCount;

export const useChatUnreadCount = () =>
  useSyncExternalStore(
    subscribeToChatUnread,
    getChatUnreadCountSnapshot,
    getChatUnreadCountSnapshot
  );
