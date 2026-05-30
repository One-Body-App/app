import { ChatConversationTargetPayload, ConversationListItem } from './types';

const MONGO_OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

export const isValidMongoObjectId = (value: string) => MONGO_OBJECT_ID_REGEX.test(value.trim());

export const resolveDirectPeerUserId = (item: Pick<ConversationListItem, 'peerUserId' | 'id'>) => {
  const directPeerUserId = typeof item.peerUserId === 'string' ? item.peerUserId.trim() : '';
  if (directPeerUserId.length > 0 && isValidMongoObjectId(directPeerUserId)) {
    return directPeerUserId;
  }

  const fallbackId = typeof item.id === 'string' ? item.id.trim() : '';
  if (fallbackId.startsWith('c-')) {
    const socketPeerId = fallbackId.replace(/^c-/, '').trim();
    if (isValidMongoObjectId(socketPeerId)) {
      return socketPeerId;
    }
  }

  if (isValidMongoObjectId(fallbackId)) {
    return fallbackId;
  }

  return '';
};

export const resolveGroupId = (item: Pick<ConversationListItem, 'groupId' | 'id'>) => {
  const groupId = typeof item.groupId === 'string' ? item.groupId.trim() : '';
  if (groupId.length > 0) {
    return groupId;
  }

  const fallbackId = typeof item.id === 'string' ? item.id.trim() : '';
  if (fallbackId.startsWith('group:')) {
    return fallbackId.replace(/^group:/, '').trim();
  }

  return '';
};

export const isGroupConversationItem = (
  item: Pick<ConversationListItem, 'conversationType' | 'groupId' | 'id'>
) => item.conversationType === 'group' || Boolean(resolveGroupId(item));

export const resolveConversationTargetPayload = (
  item: Pick<ConversationListItem, 'conversationType' | 'groupId' | 'id' | 'peerUserId'>
): ChatConversationTargetPayload | null => {
  if (isGroupConversationItem(item)) {
    const groupId = resolveGroupId(item);
    return groupId
      ? {
          conversationType: 'group',
          groupId,
        }
      : null;
  }

  const peerUserId = resolveDirectPeerUserId(item);
  return peerUserId
    ? {
        conversationType: 'direct',
        peerUserId,
      }
    : null;
};
