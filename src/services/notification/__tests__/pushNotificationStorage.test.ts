/* eslint-disable global-require */

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

const mockGetDisplayedNotifications = jest.fn();
const mockPlatform = { OS: 'ios' };

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

const loadStorageModule = () =>
  require('../pushNotificationStorage') as typeof import('../pushNotificationStorage');

describe('pushNotificationStorage iOS displayed notification sync', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    mockPlatform.OS = 'ios';
    await mockAsyncStorage.clear();
    mockGetDisplayedNotifications.mockResolvedValue([]);
  });

  it('maps an iOS remote displayed notification into the queued push shape', () => {
    const { buildQueuedNotificationFromDisplayedNotification } = loadStorageModule();

    const result = buildQueuedNotificationFromDisplayedNotification({
      id: 'tray-1',
      date: '2026-04-07T10:00:00.000Z',
      notification: {
        id: 'notification-1',
        title: 'New follower',
        body: 'Alex started following you',
        data: {
          url: 'onebodyapp://profile/alex',
          campaignId: 'campaign-1',
          type: 'activity',
          iconUrl: 'https://cdn.example.com/avatar.png',
        },
        remote: {
          messageId: 'message-1',
          senderId: 'sender-1',
          contentAvailable: 1,
          mutableContent: 1,
        },
      },
      trigger: {} as any,
    });

    expect(result).toEqual({
      id: 'notification-1',
      title: 'New follower',
      body: 'Alex started following you',
      url: 'onebodyapp://profile/alex',
      iconUrl: 'https://cdn.example.com/avatar.png',
      type: 'activity',
      campaignId: 'campaign-1',
      data: {
        url: 'onebodyapp://profile/alex',
        campaignId: 'campaign-1',
        type: 'activity',
        iconUrl: 'https://cdn.example.com/avatar.png',
      },
      createdAt: '2026-04-07T10:00:00.000Z',
      read: false,
      source: 'push',
    });
  });

  it('maps a remote message into the queued push shape', () => {
    const { buildQueuedNotificationFromRemoteMessage } = loadStorageModule();

    const result = buildQueuedNotificationFromRemoteMessage({
      messageId: 'message-bridge-1',
      sentTime: 1712534460000,
      data: {
        createdAt: '2026-04-08T00:01:00.000Z',
        url: 'onebodyapp://post/social/post-1',
        type: 'activity',
        campaignId: 'campaign-2',
        iconUrl: 'https://cdn.example.com/icon.png',
      },
      notification: {
        title: 'Comment',
        body: 'Jordan commented on your post',
      },
    } as any);

    expect(result).toEqual({
      id: 'message-bridge-1',
      title: 'Comment',
      body: 'Jordan commented on your post',
      createdAt: '2026-04-08T00:01:00.000Z',
      url: 'onebodyapp://post/social/post-1',
      type: 'activity',
      campaignId: 'campaign-2',
      iconUrl: 'https://cdn.example.com/icon.png',
      data: {
        createdAt: '2026-04-08T00:01:00.000Z',
        url: 'onebodyapp://post/social/post-1',
        type: 'activity',
        campaignId: 'campaign-2',
        iconUrl: 'https://cdn.example.com/icon.png',
      },
      read: false,
      source: 'push',
    });
  });

  it('ignores local displayed notifications so iOS does not backfill local-only items', () => {
    const { buildQueuedNotificationFromDisplayedNotification } = loadStorageModule();

    const result = buildQueuedNotificationFromDisplayedNotification({
      id: 'local-1',
      date: '2026-04-07T10:00:00.000Z',
      notification: {
        id: 'local-1',
        title: 'Local title',
        body: 'Local body',
        data: {
          type: 'chat_e2ee_message',
        },
      },
      trigger: {} as any,
    });

    expect(result).toBeNull();
  });

  it('syncs iOS displayed remote notifications and preserves existing read state', async () => {
    const { syncIosDisplayedRemoteNotifications, getQueuedNotifications } = loadStorageModule();

    await mockAsyncStorage.setItem(
      '@onebody/push/queued-notifications',
      JSON.stringify([
        {
          id: 'notification-1',
          title: 'Old title',
          body: 'Old body',
          createdAt: '2026-04-07T09:00:00.000Z',
          read: true,
          source: 'push',
        },
      ])
    );

    mockGetDisplayedNotifications.mockResolvedValue([
      {
        id: 'tray-1',
        date: '2026-04-07T10:00:00.000Z',
        notification: {
          id: 'notification-1',
          title: 'New title',
          body: 'New body',
          data: {
            deepLink: 'onebodyapp://notifications',
            type: 'activity',
          },
          remote: {
            messageId: 'message-1',
            senderId: 'sender-1',
          },
        },
        trigger: {} as any,
      },
    ]);

    const syncedCount = await syncIosDisplayedRemoteNotifications();
    const queued = await getQueuedNotifications();

    expect(syncedCount).toBe(1);
    expect(queued).toEqual([
      expect.objectContaining({
        id: 'notification-1',
        title: 'New title',
        body: 'New body',
        url: 'onebodyapp://notifications',
        type: 'activity',
        read: true,
        source: 'push',
      }),
    ]);
  });

  it('queues bridge-delivered remote messages and preserves existing read state', async () => {
    const { queueRemoteNotificationPayload, getQueuedNotifications } = loadStorageModule();

    await mockAsyncStorage.setItem(
      '@onebody/push/queued-notifications',
      JSON.stringify([
        {
          id: 'message-bridge-2',
          title: 'Old title',
          body: 'Old body',
          createdAt: '2026-04-08T00:00:00.000Z',
          read: true,
          source: 'push',
        },
      ])
    );

    await queueRemoteNotificationPayload({
      messageId: 'message-bridge-2',
      sentTime: 1712534460000,
      data: {
        createdAt: '2026-04-08T00:01:00.000Z',
        deepLink: 'onebodyapp://notifications',
        type: 'activity',
      },
      notification: {
        title: 'Updated title',
        body: 'Updated body',
      },
    } as any);

    const queued = await getQueuedNotifications();

    expect(queued).toEqual([
      expect.objectContaining({
        id: 'message-bridge-2',
        title: 'Updated title',
        body: 'Updated body',
        url: 'onebodyapp://notifications',
        type: 'activity',
        read: true,
      }),
    ]);
  });

  it('is a no-op on Android', async () => {
    mockPlatform.OS = 'android';
    const { syncIosDisplayedRemoteNotifications } = loadStorageModule();

    const syncedCount = await syncIosDisplayedRemoteNotifications();

    expect(syncedCount).toBe(0);
    expect(mockGetDisplayedNotifications).not.toHaveBeenCalled();
  });

  it('does not clear existing queued notifications when the iOS tray is empty', async () => {
    const { syncIosDisplayedRemoteNotifications, getQueuedNotifications } = loadStorageModule();

    await mockAsyncStorage.setItem(
      '@onebody/push/queued-notifications',
      JSON.stringify([
        {
          id: 'existing-1',
          title: 'Existing',
          body: 'Existing body',
          createdAt: '2026-04-07T08:00:00.000Z',
          read: false,
          source: 'push',
        },
      ])
    );

    const syncedCount = await syncIosDisplayedRemoteNotifications();
    const queued = await getQueuedNotifications();

    expect(syncedCount).toBe(0);
    expect(queued).toEqual([
      expect.objectContaining({
        id: 'existing-1',
        title: 'Existing',
      }),
    ]);
  });
});
