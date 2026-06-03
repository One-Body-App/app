import {
  clearClerkSessionAccessors,
  getClerkSessionToken,
  setClerkSessionAccessors,
} from './clerkSession';

describe('clerkSession', () => {
  afterEach(() => {
    clearClerkSessionAccessors();
  });

  it('passes skipCache to Clerk when forcing a token refresh', async () => {
    const getToken = jest.fn().mockResolvedValue('fresh-token');

    setClerkSessionAccessors({
      getToken,
      signOut: jest.fn(),
    });

    await expect(getClerkSessionToken({ forceRefresh: true })).resolves.toBe('fresh-token');
    expect(getToken).toHaveBeenCalledWith({ skipCache: true });
  });

  it('uses Clerk default token behavior when force refresh is not requested', async () => {
    const getToken = jest.fn().mockResolvedValue('cached-token');

    setClerkSessionAccessors({
      getToken,
      signOut: jest.fn(),
    });

    await expect(getClerkSessionToken()).resolves.toBe('cached-token');
    expect(getToken).toHaveBeenCalledWith(undefined);
  });
});
