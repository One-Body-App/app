import axios from 'axios';
import { ApiCall } from './api';

const mockGetValidAccessToken = jest.fn();
const mockRefreshAuthTokens = jest.fn();
const mockGetClerkSessionToken = jest.fn();

jest.mock('./constants', () => ({
  BASE_URL: 'https://api.test',
}));

jest.mock('./authTokens', () => ({
  getValidAccessToken: (...args: unknown[]) => mockGetValidAccessToken(...args),
  refreshAuthTokens: (...args: unknown[]) => mockRefreshAuthTokens(...args),
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
    mockRefreshAuthTokens.mockResolvedValue(null);
    mockGetValidAccessToken.mockResolvedValue(null);
    mockGetClerkSessionToken.mockResolvedValue(null);
  });

  it('retries a protected request once with a force-refreshed Clerk token', async () => {
    mockGetClerkSessionToken
      .mockResolvedValueOnce('stale-clerk-token')
      .mockResolvedValueOnce('fresh-clerk-token');
    axiosGet
      .mockRejectedValueOnce(unauthorized())
      .mockResolvedValueOnce({ data: { ok: true } } as any);

    const result = await ApiCall({
      route: 'user/my-profile?pullSavedData=false',
      verb: 'get',
      token: 'redux-token',
      suppressErrorLog: true,
    });

    expect(result).toEqual({ status: 200, response: { ok: true } });
    expect(mockGetClerkSessionToken).toHaveBeenNthCalledWith(1);
    expect(mockGetClerkSessionToken).toHaveBeenNthCalledWith(2, { forceRefresh: true });
    expect(mockGetValidAccessToken).not.toHaveBeenCalled();
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
    expect(mockRefreshAuthTokens).not.toHaveBeenCalled();
  });

  it('does not retry forever when the force-refreshed Clerk token is still rejected', async () => {
    mockGetClerkSessionToken
      .mockResolvedValueOnce('stale-clerk-token')
      .mockResolvedValueOnce('fresh-clerk-token');
    axiosGet.mockRejectedValueOnce(unauthorized()).mockRejectedValueOnce(unauthorized());

    const result = await ApiCall({
      route: 'user/my-profile?pullSavedData=false',
      verb: 'get',
      token: 'redux-token',
      suppressErrorLog: true,
    });

    expect(result.status).toBe(401);
    expect(result.response).toEqual({ message: 'Invalid Clerk session token' });
    expect(axiosGet).toHaveBeenCalledTimes(2);
    expect(mockGetClerkSessionToken).toHaveBeenCalledTimes(2);
    expect(mockGetValidAccessToken).not.toHaveBeenCalled();
    expect(mockRefreshAuthTokens).not.toHaveBeenCalled();
  });

  it('does not retry with the same cached Clerk token after a 401', async () => {
    mockGetClerkSessionToken
      .mockResolvedValueOnce('same-clerk-token')
      .mockResolvedValueOnce('same-clerk-token');
    axiosGet.mockRejectedValueOnce(unauthorized());

    const result = await ApiCall({
      route: 'user/my-profile?pullSavedData=false',
      verb: 'get',
      token: 'redux-token',
      suppressErrorLog: true,
    });

    expect(result.status).toBe(401);
    expect(axiosGet).toHaveBeenCalledTimes(1);
    expect(mockRefreshAuthTokens).not.toHaveBeenCalled();
  });
});
