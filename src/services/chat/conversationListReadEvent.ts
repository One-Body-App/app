import type { Dispatch, SetStateAction } from 'react';
import { resolveDirectPeerUserId, resolveGroupId } from './conversationTarget';
import { ChatConversationReadEvent, subscribeToChatConversationRead } from './conversationReadSync';
import { ConversationListItem } from './types';

export const applyConversationReadEventToConversations = (
  conversations: ConversationListItem[],
  event: ChatConversationReadEvent
) => {
  let didUpdate = false;

  const nextConversations = conversations.map((conversation) => {
    if (event.conversationType === 'group') {
      const conversationGroupId = resolveGroupId(conversation);
      if (!event.groupId || conversationGroupId !== event.groupId || conversation.unreadCount < 1) {
        return conversation;
      }

      didUpdate = true;
      return {
        ...conversation,
        unreadCount: 0,
      };
    }

    const conversationPeerUserId = resolveDirectPeerUserId(conversation);
    if (
      !event.peerUserId ||
      conversationPeerUserId !== event.peerUserId ||
      conversation.unreadCount < 1
    ) {
      return conversation;
    }

    didUpdate = true;
    return {
      ...conversation,
      unreadCount: 0,
      lastMessageStatus: 'read' as const,
    };
  });

  return didUpdate ? nextConversations : conversations;
};

export const subscribeToConversationListReadEvents = (
  setConversations: Dispatch<SetStateAction<ConversationListItem[]>>
) =>
  subscribeToChatConversationRead((event) => {
    setConversations((prev) => applyConversationReadEventToConversations(prev, event));
  });
