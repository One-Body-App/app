const mockEmitNotificationRefresh = jest.fn();
const mockQueueRemoteNotificationPayload = jest.fn();

jest.mock('../notificationRefreshSignal', () => ({
  emitNotificationRefresh: () => mockEmitNotificationRefresh(),
}));

jest.mock('../pushNotificationStorage', () => ({
  queueRemoteNotificationPayload: (...args: any[]) => mockQueueRemoteNotificationPayload(...args),
}));

describe('foregroundNotificationFeedback', () => {
  beforeEach(() => {
    jest.resetModules();
    mockEmitNotificationRefresh.mockReset();
    mockQueueRemoteNotificationPayload.mockReset();
  });

  it('refreshes notifications and shows a toast for queued foreground notifications', () => {
    const toast = { show: jest.fn() };
    const { handleQueuedForegroundNotification } =
      // eslint-disable-next-line global-require
      require('../foregroundNotificationFeedback') as typeof import('../foregroundNotificationFeedback');

    const handled = handleQueuedForegroundNotification(toast, {
      id: 'push-1',
      title: 'Actor reacted to your post',
      body: 'Actor reacted with love.',
      data: { type: 'reaction' },
      createdAt: '2026-04-12T01:00:00.000Z',
      source: 'push',
    });

    expect(handled).toBe(true);
    expect(mockEmitNotificationRefresh).toHaveBeenCalledTimes(1);
    expect(toast.show).toHaveBeenCalledWith(
      'Actor reacted to your post\nActor reacted with love.',
      {
        id: 'foreground-notification:push-1',
        placement: 'top',
        duration: 4000,
      }
    );
  });

  it('ignores chat payloads for foreground toast handling', () => {
    const toast = { show: jest.fn() };
    const { handleQueuedForegroundNotification } =
      // eslint-disable-next-line global-require
      require('../foregroundNotificationFeedback') as typeof import('../foregroundNotificationFeedback');

    const handled = handleQueuedForegroundNotification(toast, {
      id: 'chat-push',
      title: 'New message',
      body: 'Encrypted payload',
      type: 'chat_e2ee_message',
      data: { type: 'chat_e2ee_message' },
      createdAt: '2026-04-12T01:00:00.000Z',
      source: 'push',
    });

    expect(handled).toBe(false);
    expect(mockEmitNotificationRefresh).not.toHaveBeenCalled();
    expect(toast.show).not.toHaveBeenCalled();
  });

  it('queues iOS bridge payloads, refreshes notifications, and shows a toast', async () => {
    const toast = { show: jest.fn() };
    mockQueueRemoteNotificationPayload.mockResolvedValue({
      id: 'push-ios',
      title: 'Actor commented on your post',
      body: 'Actor: Amen',
      data: { type: 'comment' },
      createdAt: '2026-04-12T01:00:00.000Z',
      source: 'push',
    });

    const { handleIosForegroundRemoteMessage } =
      // eslint-disable-next-line global-require
      require('../foregroundNotificationFeedback') as typeof import('../foregroundNotificationFeedback');

    const result = await handleIosForegroundRemoteMessage(toast, {
      messageId: 'message-ios',
    } as any);

    expect(result).toEqual(
      expect.objectContaining({
        id: 'push-ios',
      })
    );
    expect(mockQueueRemoteNotificationPayload).toHaveBeenCalledWith({
      messageId: 'message-ios',
    });
    expect(mockEmitNotificationRefresh).toHaveBeenCalledTimes(1);
    expect(toast.show).toHaveBeenCalledWith('Actor commented on your post\nActor: Amen', {
      id: 'foreground-notification:push-ios',
      placement: 'top',
      duration: 4000,
    });
  });
});
