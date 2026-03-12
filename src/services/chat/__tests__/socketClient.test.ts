const mockGetValidAccessToken = jest.fn();
const mockIo = jest.fn();

jest.mock('react-native-config', () => ({
  CHAT_SOCKET_NAMESPACE: '/chat',
}));

jest.mock('@/src/services/constants', () => ({
  BASE_URL: 'https://stagingapi.onebodyapp.com/api',
}));

jest.mock('@/src/services/authTokens', () => ({
  getValidAccessToken: (...args: any[]) => mockGetValidAccessToken(...args),
}));

jest.mock('socket.io-client', () => ({
  io: (...args: any[]) => mockIo(...args),
}));

type Listener = (...args: any[]) => void;

class FakeSocket {
  public connected = false;

  public auth: Record<string, unknown> = {};

  public io = {
    opts: {
      extraHeaders: {} as Record<string, string>,
    },
    on: jest.fn((event: string, listener: Listener) => {
      this.managerListeners.set(event, listener);
    }),
  };

  public disconnect = jest.fn(() => {
    this.connected = false;
    this.trigger('disconnect', 'io client disconnect');
  });

  public removeAllListeners = jest.fn(() => {
    this.listeners.clear();
    this.onceListeners.clear();
  });

  public emitHandler?: (event: string, payload: any, ack?: (response?: any) => void) => void;

  public connectBehavior: 'success' | 'error' = 'success';

  private listeners = new Map<string, Set<Listener>>();

  private onceListeners = new Map<string, Set<Listener>>();

  private managerListeners = new Map<string, Listener>();

  public on = jest.fn((event: string, listener: Listener) => {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  });

  public once = jest.fn((event: string, listener: Listener) => {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(listener);
    return this;
  });

  public off = jest.fn((event: string, listener?: Listener) => {
    if (!listener) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
      return this;
    }
    this.listeners.get(event)?.delete(listener);
    this.onceListeners.get(event)?.delete(listener);
    return this;
  });

  public connect = jest.fn(() => {
    if (this.connectBehavior === 'error') {
      this.trigger('connect_error', { message: 'Socket auth failed', code: 'connect-error' });
      return this;
    }

    this.connected = true;
    this.trigger('connect');
    return this;
  });

  public emit = jest.fn((event: string, payload: any, ack?: (response?: any) => void) => {
    this.emitHandler?.(event, payload, ack);
    return this;
  });

  public trigger(event: string, ...args: any[]) {
    const persistent = this.listeners.get(event);
    persistent?.forEach((listener) => listener(...args));

    const once = this.onceListeners.get(event);
    once?.forEach((listener) => listener(...args));
    if (once) {
      this.onceListeners.delete(event);
    }
  }

  public triggerReconnectAttempt() {
    this.managerListeners.get('reconnect_attempt')?.();
  }
}

describe('socketClient', () => {
  let createdSockets: FakeSocket[] = [];
  let socketClient: typeof import('../socketClient') | null = null;

  beforeEach(async () => {
    jest.resetModules();
    createdSockets = [];
    mockIo.mockImplementation(() => {
      const socket = new FakeSocket();
      createdSockets.push(socket);
      return socket;
    });
    mockGetValidAccessToken.mockReset();
    mockGetValidAccessToken.mockResolvedValue('token-1');
    // eslint-disable-next-line global-require
    socketClient = require('../socketClient') as typeof import('../socketClient');
  });

  afterEach(() => {
    socketClient?.disconnectChatSocket();
    jest.clearAllMocks();
  });

  it('resolves when the send ack returns ok', async () => {
    const payload = {
      receiverId: 'receiver-1',
      encryptedPayload: 'payload',
      nonce: 'nonce',
      authTag: 'tag',
      messageType: 'text' as const,
    };

    await socketClient.connectChatSocket();
    const socket = createdSockets[0]!;
    const sendPromise = socketClient.sendChatE2EEMessage(payload);
    socket.emitHandler = (_event, _body, ack) => {
      ack?.({
        ok: true,
        message: {
          _id: 'message-1',
        },
      });
    };

    await expect(sendPromise).resolves.toEqual({
      ok: true,
      message: {
        _id: 'message-1',
      },
    });
  });

  it('rejects immediately on connect_error', async () => {
    mockIo.mockImplementationOnce(() => {
      const socket = new FakeSocket();
      socket.connectBehavior = 'error';
      createdSockets.push(socket);
      return socket;
    });

    const connectPromise = socketClient.connectChatSocket();

    await expect(connectPromise).rejects.toMatchObject({
      message: 'Socket auth failed',
      code: 'connect-error',
    });
  });

  it('rejects send when the socket emits exception', async () => {
    const payload = {
      receiverId: 'receiver-1',
      encryptedPayload: 'payload',
      nonce: 'nonce',
      authTag: 'tag',
      messageType: 'text' as const,
    };

    await socketClient.connectChatSocket();
    const socket = createdSockets[0]!;
    const sendPromise = socketClient.sendChatE2EEMessage(payload);
    socket.emitHandler = () => {
      socket.trigger('exception', {
        message: 'Receiver not found',
        code: 'receiver-not-found',
      });
    };

    await expect(sendPromise).rejects.toMatchObject({
      message: 'Receiver not found',
      code: 'receiver-not-found',
    });
  });

  it('propagates retryAfterMs when the send ack is rate-limited', async () => {
    const payload = {
      receiverId: 'receiver-1',
      encryptedPayload: 'payload',
      nonce: 'nonce',
      authTag: 'tag',
      messageType: 'text' as const,
    };

    await socketClient.connectChatSocket();
    const socket = createdSockets[0]!;
    const sendPromise = socketClient.sendChatE2EEMessage(payload);
    socket.emitHandler = (_event, _body, ack) => {
      ack?.({
        ok: false,
        error: 'You are sending too fast.',
        code: 'rate-limited',
        retryAfterMs: 2500,
      });
    };

    await expect(sendPromise).rejects.toMatchObject({
      message: 'You are sending too fast.',
      code: 'rate-limited',
      retryAfterMs: 2500,
    });
  });

  it('recreates the cached socket when the managed token changes', async () => {
    await socketClient.connectChatSocket();
    const firstSocket = createdSockets[0]!;

    mockGetValidAccessToken.mockResolvedValue('token-2');

    await socketClient.connectChatSocket();

    expect(mockIo).toHaveBeenCalledTimes(2);
    expect(firstSocket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('resolves a reaction ack from the chat socket', async () => {
    await socketClient.connectChatSocket();
    const socket = createdSockets[0]!;
    const reactionPromise = socketClient.reactToChatMessage({
      messageId: 'message-1',
      reactionType: 'love',
    });
    socket.emitHandler = (_event, _body, ack) => {
      ack?.({
        ok: true,
        messageId: 'message-1',
        reactions: [{ type: 'love', userId: 'user-1' }],
      });
    };

    await expect(reactionPromise).resolves.toEqual({
      ok: true,
      messageId: 'message-1',
      reactions: [{ type: 'love', userId: 'user-1' }],
    });
  });
});
