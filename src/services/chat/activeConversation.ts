let activeDirectConversationPeerId = '';
let activeGroupConversationId = '';

export const setActiveDirectConversationPeerId = (peerUserId: string) => {
  activeDirectConversationPeerId = peerUserId.trim();
};

export const clearActiveDirectConversationPeerId = (peerUserId?: string) => {
  if (!peerUserId || activeDirectConversationPeerId === peerUserId.trim()) {
    activeDirectConversationPeerId = '';
  }
};

export const getActiveDirectConversationPeerId = () => activeDirectConversationPeerId;

export const setActiveGroupConversationId = (groupId: string) => {
  activeGroupConversationId = groupId.trim();
};

export const clearActiveGroupConversationId = (groupId?: string) => {
  if (!groupId || activeGroupConversationId === groupId.trim()) {
    activeGroupConversationId = '';
  }
};

export const getActiveGroupConversationId = () => activeGroupConversationId;
