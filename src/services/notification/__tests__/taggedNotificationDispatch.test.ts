jest.mock('../notificationRefreshSignal', () => ({
  emitNotificationRefresh: jest.fn(),
}));

jest.mock('../pushNotificationStorage', () => ({
  queueLocalNotificationItem: jest.fn(),
}));

const { resolveNewTaggedUserIds } =
  // eslint-disable-next-line global-require
  require('../taggedNotificationDispatch') as typeof import('../taggedNotificationDispatch');

describe('taggedNotificationDispatch', () => {
  it('returns only newly added tagged user ids', () => {
    expect(
      resolveNewTaggedUserIds(
        ['user-1', 'user-2', 'user-2'],
        ['user-2', 'user-3', 'user-3', 'user-4']
      )
    ).toEqual(['user-3', 'user-4']);
  });

  it('normalizes blank values out of the diff result', () => {
    expect(resolveNewTaggedUserIds(['user-1'], ['', 'user-1', ' user-5 '])).toEqual(['user-5']);
  });
});
