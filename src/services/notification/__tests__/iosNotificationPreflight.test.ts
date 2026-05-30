/* eslint-disable global-require */

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

const mockPlatform = { OS: 'ios' };
const mockGetDisplayedNotifications = jest.fn();

jest.mock('react-native', () => ({
  Platform: mockPlatform,
}));

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    getDisplayedNotifications: (...args: any[]) => mockGetDisplayedNotifications(...args),
  },
}));

describe('iosNotificationPreflight', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    mockPlatform.OS = 'ios';
    await mockAsyncStorage.clear();
    mockGetDisplayedNotifications.mockResolvedValue([]);
  });

  it('queues the initial message and syncs displayed notifications', async () => {
    const { preloadIosNotificationFeed } =
      require('../iosNotificationPreflight') as typeof import('../iosNotificationPreflight');

    const result = await preloadIosNotificationFeed({
      dependencies: {
        getInitialNotification: jest.fn().mockResolvedValue({ messageId: 'message-1' }),
        queueRemoteNotificationPayload: jest.fn().mockResolvedValue({ id: 'message-1' }),
        syncIosDisplayedRemoteNotifications: jest.fn().mockResolvedValue(2),
      },
      timeoutMs: 50,
    });

    expect(result).toEqual({
      initialQueued: true,
      syncedCount: 2,
      didTimeout: false,
    });
  });

  it('falls back safely when iOS notification preflight work rejects', async () => {
    const { preloadIosNotificationFeed } =
      require('../iosNotificationPreflight') as typeof import('../iosNotificationPreflight');

    const result = await preloadIosNotificationFeed({
      dependencies: {
        getInitialNotification: jest.fn().mockRejectedValue(new Error('no initial notification')),
        queueRemoteNotificationPayload: jest.fn(),
        syncIosDisplayedRemoteNotifications: jest.fn().mockRejectedValue(new Error('sync failed')),
      },
      timeoutMs: 50,
    });

    expect(result).toEqual({
      initialQueued: false,
      syncedCount: 0,
      didTimeout: false,
    });
  });

  it('times out rather than hanging on iOS notification preflight calls', async () => {
    const { preloadIosNotificationFeed } =
      require('../iosNotificationPreflight') as typeof import('../iosNotificationPreflight');

    const never = new Promise<never>(() => {});

    const result = await preloadIosNotificationFeed({
      dependencies: {
        getInitialNotification: jest.fn().mockReturnValue(never),
        queueRemoteNotificationPayload: jest.fn(),
        syncIosDisplayedRemoteNotifications: jest.fn().mockReturnValue(never),
      },
      timeoutMs: 5,
    });

    expect(result).toEqual({
      initialQueued: false,
      syncedCount: 0,
      didTimeout: true,
    });
  });

  it('is a no-op on Android', async () => {
    mockPlatform.OS = 'android';
    const { preloadIosNotificationFeed } =
      require('../iosNotificationPreflight') as typeof import('../iosNotificationPreflight');

    const result = await preloadIosNotificationFeed({
      dependencies: {
        getInitialNotification: jest.fn(),
        queueRemoteNotificationPayload: jest.fn(),
        syncIosDisplayedRemoteNotifications: jest.fn(),
      },
    });

    expect(result).toEqual({
      initialQueued: false,
      syncedCount: 0,
      didTimeout: false,
    });
  });
});
