import axios from 'axios';
import { ApiCall } from './api';

const mockGetAuthTokenKind = jest.fn();
const mockGetClerkSessionToken = jest.fn();

jest.mock('./constants', () => ({
  BASE_URL: 'https://api.test',
}));

jest.mock('./authTokens', () => ({
  getAuthTokenKind: (...args: unknown[]) => mockGetAuthTokenKind(...args),
}));

jest.mock('./clerkSession', () => ({
  getClerkSessionToken: (...args: unknown[]) => mockGetClerkSessionToken(...args),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

const axiosGet = axios.get as jest.MockedFunction<typeof axios.get>;

const unauthorized = (message = 'Invalid Clerk session token') => ({
  response: {
    status: 401,
    data: { message },
  },
});

describe('ApiCall auth retry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthTokenKind.mockReturnValue('unknown');
    mockGetClerkSessionToken.mockResolvedValue(null);
  });

  it('replaces an old API JWT with Clerk before the first request when Clerk is available', async () => {
    mockGetAuthTokenKind.mockReturnValue('api');
    mockGetClerkSessionToken.mockResolvedValue('clerk-token');
    axiosGet.mockResolvedValueOnce({ data: { ok: true } } as any);

    const result = await ApiCall({
      route: 'user/my-profile?pullSavedData=false',
      verb: 'get',
      token: 'api-token',
      suppressErrorLog: true,
    });

    expect(result).toEqual({ status: 200, response: { ok: true } });
    expect(mockGetAuthTokenKind).toHaveBeenCalledWith('api-token');
    expect(mockGetClerkSessionToken).toHaveBeenCalledWith(undefined);
    expect(axiosGet).toHaveBeenNthCalledWith(
      1,
      'https://api.test/user/my-profile?pullSavedData=false',
      {
        headers: { Authorization: 'Bearer clerk-token' },
        timeout: 300000,
      }
    );
  });

  it('does not send an old API JWT when Clerk is unavailable', async () => {
    mockGetAuthTokenKind.mockReturnValue('api');
    axiosGet.mockResolvedValueOnce({ data: { ok: true } } as any);

    const result = await ApiCall({
      route: 'user/my-profile?pullSavedData=false',
      verb: 'get',
      token: 'expired-api-token',
      suppressErrorLog: true,
    });

    expect(result).toEqual({ status: 200, response: { ok: true } });
    expect(mockGetClerkSessionToken).toHaveBeenCalledWith(undefined);
    expect(axiosGet).toHaveBeenNthCalledWith(
      1,
      'https://api.test/user/my-profile?pullSavedData=false',
      {
        timeout: 300000,
      }
    );
  });

  it('tries a force-refreshed Clerk token after a rejected Clerk token', async () => {
    mockGetAuthTokenKind.mockReturnValue('clerk');
    mockGetClerkSessionToken
      .mockResolvedValueOnce('stale-clerk-token')
      .mockResolvedValueOnce('fresh-clerk-token');
    axiosGet
      .mockRejectedValueOnce(unauthorized())
      .mockResolvedValueOnce({ data: { ok: true } } as any);

    const result = await ApiCall({
      route: 'user/my-profile?pullSavedData=false',
      verb: 'get',
      token: 'redux-clerk-token',
      suppressErrorLog: true,
    });

    expect(result).toEqual({ status: 200, response: { ok: true } });
    expect(mockGetClerkSessionToken).toHaveBeenNthCalledWith(1, undefined);
    expect(mockGetClerkSessionToken).toHaveBeenNthCalledWith(2, { forceRefresh: true });
    expect(axiosGet).toHaveBeenNthCalledWith(
      1,
      'https://api.test/user/my-profile?pullSavedData=false',
      {
        headers: { Authorization: 'Bearer stale-clerk-token' },
        timeout: 300000,
      }
    );
    expect(axiosGet).toHaveBeenNthCalledWith(
      2,
      'https://api.test/user/my-profile?pullSavedData=false',
      {
        headers: { Authorization: 'Bearer fresh-clerk-token' },
        timeout: 300000,
      }
    );
  });

  it('returns one final 401 when Clerk retry fails', async () => {
    mockGetAuthTokenKind.mockReturnValue('clerk');
    mockGetClerkSessionToken
      .mockResolvedValueOnce('stale-clerk-token')
      .mockResolvedValueOnce('fresh-clerk-token');
    axiosGet.mockRejectedValueOnce(unauthorized()).mockRejectedValueOnce(unauthorized());

    const result = await ApiCall({
      route: 'user/my-profile?pullSavedData=false',
      verb: 'get',
      token: 'redux-clerk-token',
      suppressErrorLog: true,
    });

    expect(result.status).toBe(401);
    expect(result.response).toEqual({ message: 'Invalid Clerk session token' });
    expect(axiosGet).toHaveBeenCalledTimes(2);
  });
});
