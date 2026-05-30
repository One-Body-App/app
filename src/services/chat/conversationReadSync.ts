import { ChatConversationType } from './types';

export type ChatConversationReadEvent = {
  conversationType: ChatConversationType;
  peerUserId?: string;
  groupId?: string;
};

const listeners = new Set<(event: ChatConversationReadEvent) => void>();

export const publishChatConversationRead = (event: ChatConversationReadEvent) => {
  listeners.forEach((listener) => listener(event));
};

export const subscribeToChatConversationRead = (
  listener: (event: ChatConversationReadEvent) => void
) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
