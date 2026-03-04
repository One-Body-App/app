export type ChatMessageStatus = 'sent' | 'delivered' | 'read';

export type ChatEnvelope = {
  _id: string;
  senderId: string;
  receiverId: string;
  encryptedPayload: string;
  nonce: string;
  authTag: string;
  aad?: string;
  messageType: 'text';
  status: ChatMessageStatus;
  createdAt?: string;
  updatedAt?: string;
  clientMessageId?: string;
  senderPublicKeyVersion?: number;
};

export type ChatUserKey = {
  _id: string;
  userId: string;
  publicKey: string;
  algorithm: 'x25519';
  keyVersion: number;
  deviceId: string;
  isActive: boolean;
};

export type RegisterChatKeyPayload = {
  publicKey: string;
  algorithm?: 'x25519';
  keyVersion?: number;
  deviceId?: string;
};

export type RegisterChatDeviceTokenPayload = {
  deviceId: string;
  platform: 'ios' | 'android';
  token: string;
};

export type SendE2EEMessagePayload = {
  receiverId: string;
  encryptedPayload: string;
  nonce: string;
  authTag: string;
  aad?: string;
  messageType?: 'text';
  clientMessageId?: string;
  senderPublicKeyVersion?: number;
};

export type CreateChatGroupPayload = {
  name: string;
  memberIds: string[];
};

export type ConversationListItem = {
  id: string;
  conversationType?: 'direct' | 'group';
  peerUserId: string;
  peerName: string;
  peerAvatarUri?: string;
  groupId?: string;
  groupName?: string;
  participantCount?: number;
  lastMessagePreview: string;
  updatedAt: string;
  unreadCount: number;
  lastMessageId?: string;
  lastMessageStatus?: ChatMessageStatus;
};
