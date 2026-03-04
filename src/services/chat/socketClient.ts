import { io, Socket } from 'socket.io-client';
import Config from 'react-native-config';
import { BASE_URL } from '@/src/services/constants';
import { getValidAccessToken } from '@/src/services/authTokens';
import { SendE2EEMessagePayload } from './types';

let socketRef: Socket | null = null;

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

const getSocket = async () => {
  if (socketRef) {
    return socketRef;
  }

  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Missing auth token for chat socket');
  }

  const url = resolveSocketBaseUrl();
  socketRef = io(url, {
    transports: ['websocket'],
    forceNew: false,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: 20,
    auth: {
      token,
    },
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return socketRef;
};

export const connectChatSocket = async () => {
  const socket = await getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectChatSocket = () => {
  if (!socketRef) {
    return;
  }
  socketRef.disconnect();
  socketRef = null;
};

export const sendChatE2EEMessage = async (payload: SendE2EEMessagePayload) => {
  const socket = await connectChatSocket();

  return new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Chat send timeout'));
    }, 12000);

    socket.emit('chat:send_e2ee_message', payload, (response: any) => {
      clearTimeout(timeout);
      if (!response) {
        resolve({ ok: true });
        return;
      }
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response);
    });
  });
};

export const onChatMessage = async (listener: (payload: any) => void) => {
  const socket = await connectChatSocket();
  socket.on('chat:new_message', listener);

  return () => {
    socket.off('chat:new_message', listener);
  };
};

export const onChatMessageStatus = async (listener: (payload: any) => void) => {
  const socket = await connectChatSocket();
  socket.on('chat:message_status', listener);

  return () => {
    socket.off('chat:message_status', listener);
  };
};

export const emitChatDelivered = async (messageId: string) => {
  const socket = await connectChatSocket();
  socket.emit('chat:message_delivered', { messageId });
};

export const emitChatRead = async (messageId: string) => {
  const socket = await connectChatSocket();
  socket.emit('chat:message_read', { messageId });
};
