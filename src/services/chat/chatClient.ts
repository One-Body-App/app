import { ensureChatKeypair, getMyChatKeypair, getPeerPublicKey } from './keyManager';
import { decryptE2EEMessage, encryptE2EEMessage } from './crypto';
import { buildChatContentHash } from './contentHash';
import {
  fetchConversationMessages,
  fetchGroupConversationMessages,
  markChatConversationRead,
  updateChatConversationReadState,
  updateChatMessageStatus,
} from './api';
import {
  emitChatConversationRead,
  emitChatDelivered,
  emitChatRead,
  onChatMessageReaction,
  reactToChatMessage,
  sendChatGroupMessage,
  sendChatE2EEMessage,
  ChatTransportError,
} from './socketClient';
import { isValidMongoObjectId } from './conversationTarget';
import { ChatConversationTargetPayload, ChatEnvelope, ReactChatMessagePayload } from './types';

export const ensureChatReady = async (token?: string) => {
  return ensureChatKeypair({ token });
};

export const sendEncryptedTextMessage = async (args: {
  receiverId: string;
  text: string;
  token?: string;
}) => {
  const [myKeys, peerKey] = await Promise.all([
    getMyChatKeypair(),
    getPeerPublicKey(args.receiverId, args.token),
  ]);

  const encrypted = await encryptE2EEMessage({
    plaintext: args.text,
    myPrivateKeyBase64: myKeys.privateKey,
    peerPublicKeyBase64: peerKey.publicKey,
  });

  return sendChatE2EEMessage({
    receiverId: args.receiverId,
    encryptedPayload: encrypted.encryptedPayload,
    nonce: encrypted.nonce,
    authTag: encrypted.authTag,
    aad: encrypted.aad,
    messageType: 'text',
    senderPublicKeyVersion: myKeys.keyVersion,
    clientMessageId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    contentHash: buildChatContentHash({
      text: args.text,
      messageType: 'text',
    }),
  });
};

export const loadAndDecryptConversation = async (args: {
  peerUserId: string;
  token?: string;
  limit?: number;
  before?: string;
}) => {
  const response = await fetchConversationMessages(args.peerUserId, {
    token: args.token,
    limit: args.limit,
    before: args.before,
  });

  if (
    (response.status === 404 || response.status === 400) &&
    !Array.isArray(response.response?.data)
  ) {
    return [];
  }

  if (response.status !== 200 || !Array.isArray(response.response?.data)) {
    throw new Error(
      (response.response as { message?: string })?.message || 'Unable to load conversation'
    );
  }

  if (response.response.data.length < 1) {
    return [];
  }

  let myKeys: Awaited<ReturnType<typeof getMyChatKeypair>> | null = null;
  try {
    myKeys = await getMyChatKeypair();
  } catch {
    return response.response.data.map((message) => ({
      ...message,
      plaintext: '[Encrypted message]',
    }));
  }

  let peerKey: Awaited<ReturnType<typeof getPeerPublicKey>> | null = null;
  try {
    peerKey = await getPeerPublicKey(args.peerUserId, args.token);
  } catch {
    return response.response.data.map((message) => ({
      ...message,
      plaintext: '[Encrypted message]',
    }));
  }

  const decryptedMessages = await Promise.all(
    response.response.data.map(async (message) => {
      try {
        const plaintext = await decryptE2EEMessage({
          encryptedPayload: message.encryptedPayload,
          nonce: message.nonce,
          authTag: message.authTag,
          aad: message.aad,
          myPrivateKeyBase64: myKeys!.privateKey,
          peerPublicKeyBase64: peerKey!.publicKey,
        });

        return {
          ...message,
          plaintext,
        };
      } catch {
        return {
          ...message,
          plaintext: '[Unable to decrypt message]',
        };
      }
    })
  );

  return decryptedMessages;
};

export const decryptDirectMessageEnvelope = async (args: {
  message: ChatEnvelope;
  peerUserId: string;
  token?: string;
}) => {
  const [myKeys, peerKey] = await Promise.all([
    getMyChatKeypair(),
    getPeerPublicKey(args.peerUserId, args.token),
  ]);

  return decryptE2EEMessage({
    encryptedPayload: args.message.encryptedPayload,
    nonce: args.message.nonce,
    authTag: args.message.authTag,
    aad: args.message.aad,
    myPrivateKeyBase64: myKeys.privateKey,
    peerPublicKeyBase64: peerKey.publicKey,
  });
};

export const loadGroupConversation = async (args: {
  groupId: string;
  token?: string;
  limit?: number;
  before?: string;
}) => {
  const response = await fetchGroupConversationMessages(args.groupId, {
    token: args.token,
    limit: args.limit,
    before: args.before,
  });

  if (
    (response.status === 404 || response.status === 400) &&
    !Array.isArray(response.response?.data)
  ) {
    return [];
  }

  if (response.status !== 200 || !Array.isArray(response.response?.data)) {
    throw new Error(
      (response.response as { message?: string })?.message || 'Unable to load group conversation'
    );
  }

  return response.response.data;
};

export const parseChatMessagePayload = (
  plaintext: string
): {
  type: 'text' | 'image' | 'gif' | 'images';
  text: string;
  mediaUrl?: string;
  mediaUrls?: string[];
} => {
  try {
    const parsed = JSON.parse(plaintext);
    if (parsed && typeof parsed === 'object' && parsed.type) {
      if (parsed.type === 'image' && parsed.url) {
        return {
          type: 'image',
          text: typeof parsed.text === 'string' ? parsed.text : '',
          mediaUrl: String(parsed.url),
        };
      }
      if (parsed.type === 'gif' && parsed.giphyId) {
        return {
          type: 'gif',
          text: typeof parsed.text === 'string' ? parsed.text : '',
          mediaUrl: `https://media.giphy.com/media/${parsed.giphyId}/giphy.gif`,
        };
      }
      if (parsed.type === 'images' && Array.isArray(parsed.urls)) {
        return {
          type: 'images',
          text: typeof parsed.text === 'string' ? parsed.text : '',
          mediaUrls: parsed.urls.flatMap((item: unknown) => {
            const trimmed = String(item || '').trim();
            return trimmed ? [trimmed] : [];
          }),
        };
      }
    }
  } catch {
    // fall through to plain text
  }
  return { type: 'text', text: plaintext };
};

export const sendEncryptedMediaMessage = async (args: {
  receiverId: string;
  mediaType: 'image' | 'gif' | 'images';
  mediaUrl?: string;
  mediaUrls?: string[];
  giphyId?: string;
  text?: string;
  token?: string;
}) => {
  const [myKeys, peerKey] = await Promise.all([
    getMyChatKeypair(),
    getPeerPublicKey(args.receiverId, args.token),
  ]);

  const normalizedText = typeof args.text === 'string' ? args.text.trim() : '';

  const plaintext =
    args.mediaType === 'gif'
      ? JSON.stringify({
          type: 'gif',
          giphyId: args.giphyId,
          ...(normalizedText ? { text: normalizedText } : {}),
        })
      : args.mediaType === 'images'
        ? JSON.stringify({
            type: 'images',
            urls: args.mediaUrls || [],
            ...(normalizedText ? { text: normalizedText } : {}),
          })
        : JSON.stringify({
            type: 'image',
            url: args.mediaUrl,
            ...(normalizedText ? { text: normalizedText } : {}),
          });

  const encrypted = await encryptE2EEMessage({
    plaintext,
    myPrivateKeyBase64: myKeys.privateKey,
    peerPublicKeyBase64: peerKey.publicKey,
  });

  return sendChatE2EEMessage({
    receiverId: args.receiverId,
    encryptedPayload: encrypted.encryptedPayload,
    nonce: encrypted.nonce,
    authTag: encrypted.authTag,
    aad: encrypted.aad,
    messageType: args.mediaType,
    senderPublicKeyVersion: myKeys.keyVersion,
    clientMessageId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    contentHash: buildChatContentHash({
      text: normalizedText,
      messageType: args.mediaType,
      mediaUrl: args.mediaUrl,
      mediaUrls: args.mediaUrls,
      giphyId: args.giphyId,
    }),
  });
};

export const sendGroupTextMessage = async (args: { groupId: string; text: string }) => {
  return sendChatGroupMessage({
    groupId: args.groupId,
    plaintextPayload: args.text,
    messageType: 'text',
    clientMessageId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    contentHash: buildChatContentHash({
      text: args.text,
      messageType: 'text',
    }),
  });
};

export const sendGroupMediaMessage = async (args: {
  groupId: string;
  mediaType: 'image' | 'gif' | 'images';
  mediaUrl?: string;
  mediaUrls?: string[];
  giphyId?: string;
  text?: string;
}) => {
  const normalizedText = typeof args.text === 'string' ? args.text.trim() : '';
  const plaintextPayload =
    args.mediaType === 'gif'
      ? JSON.stringify({
          type: 'gif',
          giphyId: args.giphyId,
          ...(normalizedText ? { text: normalizedText } : {}),
        })
      : args.mediaType === 'images'
        ? JSON.stringify({
            type: 'images',
            urls: args.mediaUrls || [],
            ...(normalizedText ? { text: normalizedText } : {}),
          })
        : JSON.stringify({
            type: 'image',
            url: args.mediaUrl,
            ...(normalizedText ? { text: normalizedText } : {}),
          });

  return sendChatGroupMessage({
    groupId: args.groupId,
    plaintextPayload,
    messageType: args.mediaType,
    clientMessageId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    contentHash: buildChatContentHash({
      text: normalizedText,
      messageType: args.mediaType,
      mediaUrl: args.mediaUrl,
      mediaUrls: args.mediaUrls,
      giphyId: args.giphyId,
    }),
  });
};

export const markMessageDelivered = async (messageId: string, token?: string) => {
  await emitChatDelivered(messageId);
  await updateChatMessageStatus(messageId, 'delivered', token);
};

export const markMessageRead = async (messageId: string, token?: string) => {
  await emitChatRead(messageId);
  await updateChatMessageStatus(messageId, 'read', token);
};

export const markConversationRead = async (peerUserId: string, token?: string) => {
  if (!isValidMongoObjectId(peerUserId)) {
    throw new Error('Invalid direct conversation target');
  }

  try {
    const response = await emitChatConversationRead(peerUserId);
    if (response.ok) {
      return response;
    }
  } catch (error) {
    if (
      !(error instanceof ChatTransportError) ||
      !['connect-error', 'send-failed', 'transport-timeout'].includes(error.code)
    ) {
      throw error;
    }
  }

  const response = await markChatConversationRead(peerUserId, token);
  if (response.status !== 200 || !response.response?.data) {
    throw new Error(
      (response.response as { message?: string })?.message || 'Unable to mark conversation as read'
    );
  }

  return {
    ok: true as const,
    ...response.response.data,
  };
};

const normalizeConversationReadStateMutationTarget = (
  target: ChatConversationTargetPayload | null | undefined
) => {
  if (!target) {
    return null;
  }

  if (target.conversationType === 'group') {
    const groupId = typeof target.groupId === 'string' ? target.groupId.trim() : '';
    return groupId && isValidMongoObjectId(groupId)
      ? {
          conversationType: 'group' as const,
          groupId,
        }
      : null;
  }

  const peerUserId = typeof target.peerUserId === 'string' ? target.peerUserId.trim() : '';
  return peerUserId && isValidMongoObjectId(peerUserId)
    ? {
        conversationType: 'direct' as const,
        peerUserId,
      }
    : null;
};

export const setConversationReadState = async (
  target: ChatConversationTargetPayload | null | undefined,
  isRead: boolean,
  token?: string
) => {
  const normalizedTarget = normalizeConversationReadStateMutationTarget(target);
  if (!normalizedTarget) {
    throw new Error('Invalid conversation target');
  }

  if (normalizedTarget.conversationType === 'direct' && isRead) {
    const response = await markConversationRead(normalizedTarget.peerUserId, token);
    return {
      ok: true as const,
      conversationType: 'direct' as const,
      isRead: true,
      peerUserId: response.peerUserId,
      groupId: '',
      updatedCount: response.updatedCount,
      messageIds: response.messageIds,
    };
  }

  const response = await updateChatConversationReadState(
    {
      ...normalizedTarget,
      isRead,
    },
    token
  );

  if (response.status !== 200 || !response.response?.data) {
    throw new Error(
      (response.response as { message?: string })?.message ||
        'Unable to update conversation read state'
    );
  }

  return {
    ok: true as const,
    conversationType: normalizedTarget.conversationType,
    isRead,
    ...response.response.data,
  };
};

export const markGroupConversationRead = async (groupId: string, token?: string) => {
  return setConversationReadState(
    {
      conversationType: 'group',
      groupId,
    },
    true,
    token
  );
};

export const reactToMessage = async (payload: ReactChatMessagePayload) => {
  return reactToChatMessage(payload);
};

export { onChatMessageReaction };
