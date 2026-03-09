let activeDirectConversationPeerId = '';

export const setActiveDirectConversationPeerId = (peerUserId: string) => {
  activeDirectConversationPeerId = peerUserId.trim();
};

export const clearActiveDirectConversationPeerId = (peerUserId?: string) => {
  if (!peerUserId || activeDirectConversationPeerId === peerUserId.trim()) {
    activeDirectConversationPeerId = '';
  }
};

export const getActiveDirectConversationPeerId = () => activeDirectConversationPeerId;
