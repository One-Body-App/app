/* eslint-disable global-require */

const mockCreateChannel = jest.fn();
const mockDisplayNotification = jest.fn();
const mockBuildQueuedNotificationFromRemoteMessage = jest.fn();

jest.mock('react-native', () => ({
  PermissionsAndroid: {
    PERMISSIONS: {
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
    RESULTS: {
      GRANTED: 'granted',
    },
    check: jest.fn(async () => true),
    request: jest.fn(async () => 'granted'),
  },
  Platform: {
    OS: 'android',
    Version: 34,
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    EPHEMERAL: 3,
  },
  getAPNSToken: jest.fn(),
  isDeviceRegisteredForRemoteMessages: jest.fn(() => true),
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(),
  hasPermission: jest.fn(),
  onMessage: jest.fn(),
  onTokenRefresh: jest.fn(),
  requestPermission: jest.fn(),
  registerDeviceForRemoteMessages: jest.fn(),
  deleteToken: jest.fn(),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: (...args: any[]) => mockCreateChannel(...args),
    displayNotification: (...args: any[]) => mockDisplayNotification(...args),
  },
  AndroidImportance: {
    HIGH: 'high',
  },
  AndroidStyle: {
    BIGPICTURE: 'BIGPICTURE',
  },
}));

jest.mock('react-native-device-info', () => ({
  getUniqueIdSync: jest.fn(() => 'device-123'),
}));

jest.mock('@/src/services/api', () => ({
  ApiCall: jest.fn(),
}));

jest.mock('@/src/services/chat/api', () => ({
  registerChatDeviceToken: jest.fn(),
  unregisterChatDeviceToken: jest.fn(),
}));

jest.mock('../pushNotificationStorage', () => ({
  buildQueuedNotificationFromRemoteMessage: (...args: any[]) =>
    mockBuildQueuedNotificationFromRemoteMessage(...args),
  queueRemoteNotificationPayload: jest.fn(),
}));

describe('pushNotificationService Android local display', () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreateChannel.mockReset();
    mockDisplayNotification.mockReset();
    mockBuildQueuedNotificationFromRemoteMessage.mockReset();
    mockCreateChannel.mockResolvedValue('onebody-default');
    mockDisplayNotification.mockResolvedValue(undefined);
    mockBuildQueuedNotificationFromRemoteMessage.mockReturnValue({
      id: 'push-1',
      title: 'Title',
      body: 'Body',
      url: 'onebodyapp://notifications',
      iconUrl: 'https://cdn.example.com/icon.png',
      type: 'activity',
      data: {
        type: 'activity',
        imageUrl: 'https://cdn.example.com/image.png',
      },
      createdAt: '2026-03-08T12:00:00.000Z',
      source: 'push',
    });
  });

  it('displays a foreground non-chat push locally on Android', async () => {
    const pushService =
      require('../pushNotificationService') as typeof import('../pushNotificationService');

    const result = await pushService.displayAndroidLocalNotificationIfNeeded(
      {
        messageId: 'message-1',
        data: {
          type: 'activity',
        },
        notification: {
          title: 'Title',
          body: 'Body',
        },
      } as any,
      { isForeground: true }
    );

    expect(result).toBe(true);
    expect(mockCreateChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'onebody-default',
      })
    );
    expect(mockDisplayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'push-1',
        title: 'Title',
        body: 'Body',
        android: expect.objectContaining({
          channelId: 'onebody-default',
          smallIcon: 'ic_stat_notification',
        }),
      })
    );
  });

  it('displays a background data-only non-chat push locally on Android', async () => {
    const pushService =
      require('../pushNotificationService') as typeof import('../pushNotificationService');

    const result = await pushService.displayAndroidLocalNotificationIfNeeded(
      {
        messageId: 'message-2',
        data: {
          type: 'activity',
        },
      } as any,
      { isForeground: false }
    );

    expect(result).toBe(true);
    expect(mockDisplayNotification).toHaveBeenCalledTimes(1);
  });

  it('does not double-display a background push that already has a notification payload', async () => {
    const pushService =
      require('../pushNotificationService') as typeof import('../pushNotificationService');

    const result = await pushService.displayAndroidLocalNotificationIfNeeded(
      {
        messageId: 'message-3',
        data: {
          type: 'activity',
        },
        notification: {
          title: 'Title',
          body: 'Body',
        },
      } as any,
      { isForeground: false }
    );

    expect(result).toBe(false);
    expect(mockDisplayNotification).not.toHaveBeenCalled();
  });

  it('does not locally display chat pushes through the general notification path', async () => {
    const pushService =
      require('../pushNotificationService') as typeof import('../pushNotificationService');

    const result = await pushService.displayAndroidLocalNotificationIfNeeded(
      {
        messageId: 'message-4',
        data: {
          type: 'chat_e2ee_message',
        },
      } as any,
      { isForeground: true }
    );

    expect(result).toBe(false);
    expect(mockDisplayNotification).not.toHaveBeenCalled();
  });
});
