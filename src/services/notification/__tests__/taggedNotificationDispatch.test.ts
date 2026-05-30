const loadTaggedDispatchModule = () =>
  // eslint-disable-next-line global-require
  require('../taggedNotificationDispatch') as typeof import('../taggedNotificationDispatch');

describe('taggedNotificationDispatch', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns only newly added tagged user ids', () => {
    const { resolveNewTaggedUserIds } = loadTaggedDispatchModule();

    expect(
      resolveNewTaggedUserIds(
        ['user-1', 'user-2', 'user-2'],
        ['user-2', 'user-3', 'user-3', 'user-4']
      )
    ).toEqual(['user-3', 'user-4']);
  });

  it('normalizes blank values out of the diff result', () => {
    const { resolveNewTaggedUserIds } = loadTaggedDispatchModule();

    expect(resolveNewTaggedUserIds(['user-1'], ['', 'user-1', ' user-5 '])).toEqual(['user-5']);
  });

  it('does not create local tag notification demos now that tags are server-delivered', async () => {
    const { queueTaggedNotificationDemo } = loadTaggedDispatchModule();

    await expect(
      queueTaggedNotificationDemo({
        notificationType: 'tagged',
        actorId: 'actor-1',
        postId: 'post-1',
        postType: 'social',
        taggedUserIds: ['user-2'],
      })
    ).resolves.toBeNull();
  });
});
