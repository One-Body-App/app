/* eslint-disable global-require */

import type iosNotificationsFeedBridge from '../iosNotificationsFeedBridge';

type BridgeModule = {
  default: typeof iosNotificationsFeedBridge;
};

const mockAddListener = jest.fn();
const mockRemove = jest.fn();
const mockGetPendingNotifications = jest.fn();
const mockNativeEventEmitter = jest.fn(() => ({
  addListener: mockAddListener,
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  NativeModules: {
    IOSNotificationsFeedBridge: {
      getPendingNotifications: (...args: any[]) => mockGetPendingNotifications(...args),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
  },
  NativeEventEmitter: jest.fn(function NativeEventEmitter() {
    return mockNativeEventEmitter();
  }),
}));

const loadBridgeModule = (): BridgeModule =>
  require('../iosNotificationsFeedBridge') as BridgeModule;

describe('iosNotificationsFeedBridge', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockAddListener.mockReturnValue({ remove: mockRemove });
    mockGetPendingNotifications.mockResolvedValue([]);
  });

  it('subscribes to native events and replays pending notifications', async () => {
    const received: Array<Record<string, unknown>> = [];
    const payload = {
      messageId: 'message-bridge-3',
      sentTime: 1712534520000,
      data: {
        type: 'activity',
        createdAt: '2026-04-08T00:02:00.000Z',
      },
      notification: {
        title: 'New message',
        body: 'Body',
      },
    };
    let eventHandler: ((value: unknown) => void) | undefined;

    mockAddListener.mockImplementation((_eventName: string, listener: (value: unknown) => void) => {
      eventHandler = listener;
      return { remove: mockRemove };
    });
    mockGetPendingNotifications.mockResolvedValue([payload]);

    const subscribeToIosForegroundNotificationFeed = loadBridgeModule().default;
    const unsubscribe = subscribeToIosForegroundNotificationFeed(async (nextPayload) => {
      received.push(nextPayload as unknown as Record<string, unknown>);
    });

    await Promise.resolve();
    await Promise.resolve();

    eventHandler?.({
      ...payload,
      messageId: 'message-bridge-4',
    });
    await Promise.resolve();

    expect(mockNativeEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockAddListener).toHaveBeenCalledWith('iosNotificationsFeedEvent', expect.any(Function));
    expect(received).toEqual([
      payload,
      {
        ...payload,
        messageId: 'message-bridge-4',
      },
    ]);

    unsubscribe();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});
