export type ChatMessageStatus = 'sent' | 'delivered' | 'read';

export type ChatEnvelope = {
  _id: string;
  senderId: string;
  receiverId: string;
  encryptedPayload: string;
  nonce: string;
  authTag: string;
  aad?: string;
  messageType: 'text' | 'image' | 'gif';
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
  messageType?: 'text' | 'image' | 'gif';
  clientMessageId?: string;
  senderPublicKeyVersion?: number;
};

export type ChatTransportErrorCode =
  | 'unauthorized-socket'
  | 'sid-mismatch'
  | 'receiver-not-found'
  | 'dms-disabled'
  | 'invalid-payload'
  | 'send-failed'
  | 'transport-timeout'
  | 'connect-error';

export type ChatSendAckSuccess<TMessage = ChatEnvelope> = {
  ok: true;
  message?: TMessage;
};

export type ChatSendAckFailure = {
  ok: false;
  error: string;
  code: ChatTransportErrorCode;
};

export type ChatSendAck<TMessage = ChatEnvelope> =
  | ChatSendAckSuccess<TMessage>
  | ChatSendAckFailure;

export type ChatConversationReadResult = {
  peerUserId: string;
  updatedCount: number;
  messageIds: string[];
};

export type ChatConversationType = 'direct' | 'group';

export type ChatConversationTargetPayload = {
  conversationType: ChatConversationType;
  peerUserId?: string;
  groupId?: string;
};

export type UpdateChatConversationMutePayload = ChatConversationTargetPayload & {
  isMuted: boolean;
};

export type UpdateChatConversationReadStatePayload = ChatConversationTargetPayload & {
  isRead: boolean;
};

export type ChatConversationReadAckSuccess = {
  ok: true;
} & ChatConversationReadResult;

export type ChatConversationReadAck = ChatConversationReadAckSuccess | ChatSendAckFailure;

export type CreateChatGroupPayload = {
  name: string;
  memberIds: string[];
};

export type ConversationListItem = {
  id: string;
  conversationType?: 'direct' | 'group';
  peerUserId: string;
  peerName: string;
  peerUsername?: string;
  peerAvatarUri?: string;
  groupId?: string;
  groupName?: string;
  participantCount?: number;
  lastMessagePreview: string;
  updatedAt: string;
  unreadCount: number;
  isMuted?: boolean;
  isHidden?: boolean;
  isArchived?: boolean;
  canDeleteGroup?: boolean;
  lastMessageId?: string;
  lastMessageStatus?: ChatMessageStatus;
};
