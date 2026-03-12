export type ChatMessageStatus = 'sent' | 'delivered' | 'read';

export type ChatReactionType =
  | 'like'
  | 'love'
  | 'praying'
  | 'praise'
  | 'haha'
  | 'wow'
  | 'sad'
  | 'angry';

export type ChatMessageReaction = {
  type: ChatReactionType;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ChatEnvelope = {
  _id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  conversationType?: 'direct' | 'group';
  encryptedPayload: string;
  nonce: string;
  authTag: string;
  aad?: string;
  messageType: 'text' | 'image' | 'gif' | 'images';
  status: ChatMessageStatus;
  plaintextPayload?: string;
  createdAt?: string;
  updatedAt?: string;
  clientMessageId?: string;
  senderPublicKeyVersion?: number;
  senderName?: string;
  senderUsername?: string;
  senderAvatarUri?: string;
  groupName?: string;
  reactions?: ChatMessageReaction[];
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
  messageType?: 'text' | 'image' | 'gif' | 'images';
  clientMessageId?: string;
  senderPublicKeyVersion?: number;
  contentHash?: string;
};

export type SendGroupMessagePayload = {
  groupId: string;
  plaintextPayload: string;
  messageType?: 'text' | 'image' | 'gif' | 'images';
  clientMessageId?: string;
  contentHash?: string;
};

export type ChatTransportErrorCode =
  | 'unauthorized-socket'
  | 'sid-mismatch'
  | 'receiver-not-found'
  | 'dms-disabled'
  | 'rate-limited'
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
  retryAfterMs?: number;
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

export type UpdateChatConversationArchiveStatePayload = ChatConversationTargetPayload & {
  isArchived: boolean;
};

export type ChatConversationReadAckSuccess = {
  ok: true;
} & ChatConversationReadResult;

export type ChatConversationReadAck = ChatConversationReadAckSuccess | ChatSendAckFailure;

export type ReactChatMessagePayload = {
  messageId: string;
  reactionType: ChatReactionType;
};

export type ChatReactionAckSuccess = {
  ok: true;
  messageId: string;
  reactions: ChatMessageReaction[];
};

export type ChatReactionAck = ChatReactionAckSuccess | ChatSendAckFailure;
export type ChatMessageReactionAck = ChatReactionAck;

export type ChatMessageReactionUpdate = {
  messageId: string;
  conversationType?: ChatConversationType;
  senderId?: string;
  receiverId?: string;
  groupId?: string;
  groupName?: string;
  reactions: ChatMessageReaction[];
  updatedAt?: string;
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
