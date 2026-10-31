import { io, Socket } from 'socket.io-client';
import Config from 'react-native-config';
import { BASE_URL } from '@/src/services/constants';
import { getValidAccessToken } from '@/src/services/authTokens';
import {
  ChatConversationReadAck,
  ChatMessageReactionAck,
  ChatMessageReactionUpdate,
  ChatSendAck,
  ChatTransportErrorCode,
  ReactChatMessagePayload,
  SendE2EEMessagePayload,
  SendGroupMessagePayload,
} from './types';

type ChatSocketErrorPayload = {
  message?: string;
  error?: string;
  code?: string;
  retryAfterMs?: number;
};

type ChatSocket = Socket & {
  io: Socket['io'] & {
    opts?: {
      extraHeaders?: Record<string, string>;
    };
  };
};

const SOCKET_TIMEOUT_MS = 12_000;

export class ChatTransportError extends Error {
  public readonly code: ChatTransportErrorCode;

  public readonly retryAfterMs?: number;

  public constructor(message: string, code: ChatTransportErrorCode, retryAfterMs?: number) {
    super(message);
    this.name = 'ChatTransportError';
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

let generation = 0;
const assertGeneration = (expected: number) => {
  if (generation !== expected)
    throw new ChatTransportError('Chat account changed', 'unauthorized-socket');
};
let socketRef: ChatSocket | null = null;
let socketTokenRef = '';
let connectPromise: Promise<ChatSocket> | null = null;

const resolveNamespace = () => {
  const configured = String(Config.CHAT_SOCKET_NAMESPACE || '/chat').trim();
  if (!configured) {
    return '/chat';
  }
  return configured.startsWith('/') ? configured : `/${configured}`;
};

const resolveSocketBaseUrl = () => {
  const rawBase = String(BASE_URL || '').trim();
  if (!rawBase) {
    throw new Error('BASE_URL is required for chat socket');
  }

  const trimmed = rawBase.replace(/\/+$/, '');
  const withoutApiSuffix = trimmed.replace(/\/api$/i, '');

  return `${withoutApiSuffix}${resolveNamespace()}`;
};

const normalizeErrorCode = (value?: string): ChatTransportErrorCode => {
  switch (String(value || '').trim()) {
    case 'unauthorized-socket':
      return 'unauthorized-socket';
    case 'sid-mismatch':
      return 'sid-mismatch';
    case 'receiver-not-found':
      return 'receiver-not-found';
    case 'dms-disabled':
      return 'dms-disabled';
    case 'rate-limited':
      return 'rate-limited';
    case 'invalid-payload':
      return 'invalid-payload';
    case 'transport-timeout':
      return 'transport-timeout';
    case 'connect-error':
      return 'connect-error';
    default:
      return 'send-failed';
  }
};

const resolveSocketError = (
  payload: unknown,
  fallbackCode: ChatTransportErrorCode
): ChatTransportError => {
  if (payload instanceof ChatTransportError) {
    return payload;
  }

  if (payload instanceof Error) {
    return new ChatTransportError(payload.message || 'Unable to send message', fallbackCode);
  }

  if (typeof payload === 'string' && payload.trim()) {
    return new ChatTransportError(payload.trim(), fallbackCode);
  }

  const value = payload as ChatSocketErrorPayload | undefined;
  const message = String(value?.error || value?.message || 'Unable to send message').trim();
  return new ChatTransportError(
    message || 'Unable to send message',
    normalizeErrorCode(value?.code || fallbackCode),
    typeof value?.retryAfterMs === 'number' ? value.retryAfterMs : undefined
  );
};

const applySocketAuth = (socket: ChatSocket, token: string) => {
  const nextAuth = {
    ...(typeof socket.auth === 'object' && socket.auth ? socket.auth : {}),
    token,
  };
  const nextIoOpts = {
    ...(socket.io.opts || {}),
    extraHeaders: {
      ...(socket.io.opts?.extraHeaders || {}),
      Authorization: `Bearer ${token}`,
    },
  };
  const targetSocket = socket as ChatSocket;
  targetSocket.auth = nextAuth;
  targetSocket.io.opts = nextIoOpts;
  socketTokenRef = token;
};

const refreshSocketAuth = async (socket: ChatSocket) => {
  const expected = generation;
  const latestToken = await getValidAccessToken();
  assertGeneration(expected);
  if (!latestToken) {
    throw new ChatTransportError('Missing auth token for chat socket', 'unauthorized-socket');
  }

  applySocketAuth(socket, latestToken);
  return latestToken;
};

const attachReconnectAuthRefresh = (socket: ChatSocket) => {
  socket.io.on('reconnect_attempt', () => {
    refreshSocketAuth(socket).catch(() => undefined);
  });
};

const createSocket = async () => {
  const expected = generation;
  const token = await getValidAccessToken();
  assertGeneration(expected);
  if (!token) {
    throw new ChatTransportError('Missing auth token for chat socket', 'unauthorized-socket');
  }

  const url = resolveSocketBaseUrl();
  const socket = io(url, {
    transports: ['websocket'],
    forceNew: false,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: 20,
    autoConnect: false,
    auth: {
      token,
    },
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  }) as ChatSocket;

  applySocketAuth(socket, token);
  attachReconnectAuthRefresh(socket);
  socketRef = socket;
  return socket;
};

const getSocket = async () => {
  const expected = generation;
  if (!socketRef) {
    return createSocket();
  }

  const latestToken = await getValidAccessToken();
  assertGeneration(expected);
  if (!latestToken) {
    disconnectChatSocket();
    throw new ChatTransportError('Missing auth token for chat socket', 'unauthorized-socket');
  }

  if (socketTokenRef && socketTokenRef !== latestToken) {
    disconnectChatSocket(false);
    return createSocket();
  }

  applySocketAuth(socketRef, latestToken);
  return socketRef;
};

export const connectChatSocket = async () => {
  const socket = await getSocket();

  if (socket.connected) {
    return socket;
  }

  if (connectPromise) {
    return connectPromise;
  }

  const expected = generation;
  connectPromise = new Promise<ChatSocket>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new ChatTransportError('Chat connection timed out', 'transport-timeout'));
    }, SOCKET_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('chat:error', handleChatError);
      if (generation === expected) connectPromise = null;
    };

    const handleConnect = () => {
      cleanup();
      resolve(socket);
    };

    const handleConnectError = (error: unknown) => {
      cleanup();
      reject(resolveSocketError(error, 'connect-error'));
    };

    const handleChatError = (payload: unknown) => {
      cleanup();
      reject(resolveSocketError(payload, 'unauthorized-socket'));
    };

    socket.once('connect', handleConnect);
    socket.once('connect_error', handleConnectError);
    socket.once('chat:error', handleChatError);

    refreshSocketAuth(socket)
      .then(() => {
        assertGeneration(expected);
        socket.connect();
      })
      .catch((error) => {
        cleanup();
        reject(resolveSocketError(error, 'unauthorized-socket'));
      });
  });

  return connectPromise;
};

export const disconnectChatSocket = (invalidatePending = true) => {
  if (invalidatePending) generation++;
  if (!socketRef) {
    socketTokenRef = '';
    connectPromise = null;
    return;
  }

  socketRef.removeAllListeners();
  socketRef.disconnect();
  socketTokenRef = '';
  socketRef = null;
  connectPromise = null;
};

export const sendChatE2EEMessage = async (payload: SendE2EEMessagePayload) => {
  const expected = generation;
  const socket = await connectChatSocket();
  assertGeneration(expected);

  return new Promise<ChatSendAck>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new ChatTransportError('Chat send timed out', 'transport-timeout'));
    }, SOCKET_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off('chat:error', handleChatError);
      socket.off('exception', handleException);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
    };

    const fail = (error: unknown, fallbackCode: ChatTransportErrorCode) => {
      cleanup();
      reject(resolveSocketError(error, fallbackCode));
    };

    const handleChatError = (error: unknown) => fail(error, 'unauthorized-socket');
    const handleException = (error: unknown) => fail(error, 'send-failed');
    const handleConnectError = (error: unknown) => fail(error, 'connect-error');
    const handleDisconnect = (reason: unknown) =>
      fail(
        typeof reason === 'string' ? `Chat disconnected: ${reason}` : 'Chat disconnected',
        'send-failed'
      );

    socket.once('chat:error', handleChatError);
    socket.once('exception', handleException);
    socket.once('connect_error', handleConnectError);
    socket.once('disconnect', handleDisconnect);

    socket.emit('chat:send_e2ee_message', payload, (response?: ChatSendAck | null) => {
      if (!response) {
        cleanup();
        resolve({ ok: true });
        return;
      }

      if (response.ok === false) {
        fail(response, response.code || 'send-failed');
        return;
      }

      cleanup();
      resolve(response);
    });
  });
};

export const onChatMessage = async (listener: (payload: any) => void) => {
  const expected = generation;
  const socket = await connectChatSocket();
  assertGeneration(expected);
  socket.on('chat:new_message', listener);

  return () => {
    socket.off('chat:new_message', listener);
  };
};

export const sendChatGroupMessage = async (payload: SendGroupMessagePayload) => {
  const expected = generation;
  const socket = await connectChatSocket();
  assertGeneration(expected);

  return new Promise<ChatSendAck>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new ChatTransportError('Chat send timed out', 'transport-timeout'));
    }, SOCKET_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off('chat:error', handleChatError);
      socket.off('exception', handleException);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
    };

    const fail = (error: unknown, fallbackCode: ChatTransportErrorCode) => {
      cleanup();
      reject(resolveSocketError(error, fallbackCode));
    };

    const handleChatError = (error: unknown) => fail(error, 'unauthorized-socket');
    const handleException = (error: unknown) => fail(error, 'send-failed');
    const handleConnectError = (error: unknown) => fail(error, 'connect-error');
    const handleDisconnect = (reason: unknown) =>
      fail(
        typeof reason === 'string' ? `Chat disconnected: ${reason}` : 'Chat disconnected',
        'send-failed'
      );

    socket.once('chat:error', handleChatError);
    socket.once('exception', handleException);
    socket.once('connect_error', handleConnectError);
    socket.once('disconnect', handleDisconnect);

    socket.emit('chat:send_group_message', payload, (response?: ChatSendAck | null) => {
      if (!response) {
        cleanup();
        resolve({ ok: true });
        return;
      }

      if (response.ok === false) {
        fail(response, response.code || 'send-failed');
        return;
      }

      cleanup();
      resolve(response);
    });
  });
};

export const onChatGroupMessage = async (listener: (payload: any) => void) => {
  const expected = generation;
  const socket = await connectChatSocket();
  assertGeneration(expected);
  socket.on('chat:new_group_message', listener);

  return () => {
    socket.off('chat:new_group_message', listener);
  };
};

export const onChatMessageStatus = async (listener: (payload: any) => void) => {
  const expected = generation;
  const socket = await connectChatSocket();
  assertGeneration(expected);
  socket.on('chat:message_status', listener);

  return () => {
    socket.off('chat:message_status', listener);
  };
};

export const reactToChatMessage = async (payload: ReactChatMessagePayload) => {
  const expected = generation;
  const socket = await connectChatSocket();
  assertGeneration(expected);

  return new Promise<ChatMessageReactionAck>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new ChatTransportError('Chat reaction timed out', 'transport-timeout'));
    }, SOCKET_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off('chat:error', handleChatError);
      socket.off('exception', handleException);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
    };

    const fail = (error: unknown, fallbackCode: ChatTransportErrorCode) => {
      cleanup();
      reject(resolveSocketError(error, fallbackCode));
    };

    const handleChatError = (error: unknown) => fail(error, 'unauthorized-socket');
    const handleException = (error: unknown) => fail(error, 'send-failed');
    const handleConnectError = (error: unknown) => fail(error, 'connect-error');
    const handleDisconnect = (reason: unknown) =>
      fail(
        typeof reason === 'string' ? `Chat disconnected: ${reason}` : 'Chat disconnected',
        'send-failed'
      );

    socket.once('chat:error', handleChatError);
    socket.once('exception', handleException);
    socket.once('connect_error', handleConnectError);
    socket.once('disconnect', handleDisconnect);

    socket.emit('chat:react_message', payload, (response?: ChatMessageReactionAck | null) => {
      if (!response) {
        cleanup();
        resolve({
          ok: true,
          messageId: payload.messageId,
          reactions: [],
        });
        return;
      }

      if (response.ok === false) {
        fail(response, response.code || 'send-failed');
        return;
      }

      cleanup();
      resolve(response);
    });
  });
};

export const onChatMessageReaction = async (
  listener: (payload: ChatMessageReactionUpdate) => void
) => {
  const expected = generation;
  const socket = await connectChatSocket();
  assertGeneration(expected);
  socket.on('chat:message_reaction', listener);

  return () => {
    socket.off('chat:message_reaction', listener);
  };
};

export const emitChatDelivered = async (messageId: string) => {
  const expected = generation;
  const socket = await connectChatSocket();
  assertGeneration(expected);
  socket.emit('chat:message_delivered', { messageId });
};

export const emitChatRead = async (messageId: string) => {
  const expected = generation;
  const socket = await connectChatSocket();
  assertGeneration(expected);
  socket.emit('chat:message_read', { messageId });
};

export const emitChatConversationRead = async (peerUserId: string) => {
  const expected = generation;
  const socket = await connectChatSocket();
  assertGeneration(expected);

  return new Promise<ChatConversationReadAck>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new ChatTransportError('Chat read sync timed out', 'transport-timeout'));
    }, SOCKET_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off('chat:error', handleChatError);
      socket.off('exception', handleException);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
    };

    const fail = (error: unknown, fallbackCode: ChatTransportErrorCode) => {
      cleanup();
      reject(resolveSocketError(error, fallbackCode));
    };

    const handleChatError = (error: unknown) => fail(error, 'unauthorized-socket');
    const handleException = (error: unknown) => fail(error, 'send-failed');
    const handleConnectError = (error: unknown) => fail(error, 'connect-error');
    const handleDisconnect = (reason: unknown) =>
      fail(
        typeof reason === 'string' ? `Chat disconnected: ${reason}` : 'Chat disconnected',
        'send-failed'
      );

    socket.once('chat:error', handleChatError);
    socket.once('exception', handleException);
    socket.once('connect_error', handleConnectError);
    socket.once('disconnect', handleDisconnect);

    socket.emit('chat:conversation_read', { peerUserId }, (response?: ChatConversationReadAck) => {
      if (!response) {
        cleanup();
        resolve({
          ok: true,
          peerUserId,
          updatedCount: 0,
          messageIds: [],
        });
        return;
      }

      if (response.ok === false) {
        fail(response, response.code || 'send-failed');
        return;
      }

      cleanup();
      resolve(response);
    });
  });
};
