import { ensureChatKeypair, getMyChatKeypair, getPeerPublicKey } from './keyManager';
import { decryptE2EEMessage, encryptE2EEMessage } from './crypto';
import { fetchConversationMessages, updateChatMessageStatus } from './api';
import { emitChatDelivered, emitChatRead, sendChatE2EEMessage } from './socketClient';

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

export const markMessageDelivered = async (messageId: string, token?: string) => {
  await emitChatDelivered(messageId);
  await updateChatMessageStatus(messageId, 'delivered', token);
};

export const markMessageRead = async (messageId: string, token?: string) => {
  await emitChatRead(messageId);
  await updateChatMessageStatus(messageId, 'read', token);
};
