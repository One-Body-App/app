import { runSaga } from 'redux-saga';
import { ACTIONS } from '../action-types';
import {
  getProfileSaga,
  logoutSaga,
  updateOrgProfileRequest,
  updateProfileRequest,
} from './AuthSaga';

const mockApiCall = jest.fn();
const mockClearAuthTokens = jest.fn();
const mockGetValidAccessToken = jest.fn();
const mockDisablePushNotifications = jest.fn();
const mockDisconnectChatSocket = jest.fn();
const mockSignOutSocialProviders = jest.fn();

jest.mock('@/src/services/api', () => ({
  ApiCall: (...args: unknown[]) => mockApiCall(...args),
}));

jest.mock('@/services/authTokens', () => ({
  clearAuthTokens: (...args: unknown[]) => mockClearAuthTokens(...args),
  getValidAccessToken: (...args: unknown[]) => mockGetValidAccessToken(...args),
  saveAuthTokens: jest.fn(),
}));

jest.mock('@/src/services/notification/pushNotificationService', () => ({
  disablePushNotifications: (...args: unknown[]) => mockDisablePushNotifications(...args),
}));

jest.mock('@/src/services/chat/socketClient', () => ({
  disconnectChatSocket: (...args: unknown[]) => mockDisconnectChatSocket(...args),
}));

jest.mock('@/services/socialAuth', () => ({
  signOutSocialProviders: (...args: unknown[]) => mockSignOutSocialProviders(...args),
}));

describe('logoutSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(123456789);
    mockApiCall.mockResolvedValue({ status: 200, response: { success: true } });
    mockGetValidAccessToken.mockResolvedValue('managed-token');
    mockClearAuthTokens.mockResolvedValue(undefined);
    mockDisablePushNotifications.mockResolvedValue(undefined);
    mockDisconnectChatSocket.mockReturnValue(undefined);
    mockSignOutSocialProviders.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const runLogout = async (
    state: { auth: { userToken: string } } = { auth: { userToken: 'redux-token' } },
    data = {
      destination: 'Intro' as const,
      revokeServerSession: true,
      signOutProviders: true,
    }
  ) => {
    const dispatched: any[] = [];

    await runSaga(
      {
        dispatch: (action) => dispatched.push(action),
        getState: () => state,
      },
      logoutSaga,
      { type: ACTIONS.LOGOUT, data }
    ).toPromise();

    return dispatched;
  };

  it('revokes the server session and completes logout cleanup', async () => {
    const dispatched = await runLogout();

    expect(mockDisablePushNotifications).toHaveBeenCalledWith('managed-token');
    expect(mockApiCall).toHaveBeenCalledWith({
      route: 'auth/logout',
      verb: 'post',
      token: 'managed-token',
      suppressErrorLog: true,
    });
    expect(mockDisablePushNotifications.mock.invocationCallOrder[0]).toBeLessThan(
      mockApiCall.mock.invocationCallOrder[0]
    );
    expect(mockDisconnectChatSocket).toHaveBeenCalled();
    expect(mockSignOutSocialProviders).toHaveBeenCalled();
    expect(mockClearAuthTokens).toHaveBeenCalled();
    expect(dispatched).toEqual([
      {
        type: ACTIONS.LOGOUT_COMPLETE,
        data: {
          completedAt: 123456789,
          destination: 'Intro',
        },
      },
    ]);
  });

  it('still clears local state when backend logout fails', async () => {
    mockApiCall.mockRejectedValue(new Error('logout failed'));

    const dispatched = await runLogout();

    expect(mockDisablePushNotifications).toHaveBeenCalledWith('managed-token');
    expect(mockDisconnectChatSocket).toHaveBeenCalled();
    expect(mockClearAuthTokens).toHaveBeenCalled();
    expect(dispatched[0]).toEqual({
      type: ACTIONS.LOGOUT_COMPLETE,
      data: {
        completedAt: 123456789,
        destination: 'Intro',
      },
    });
  });

  it('still completes logout when provider sign-out fails', async () => {
    mockSignOutSocialProviders.mockRejectedValue(new Error('provider failed'));

    const dispatched = await runLogout();

    expect(mockClearAuthTokens).toHaveBeenCalled();
    expect(dispatched[0]).toEqual({
      type: ACTIONS.LOGOUT_COMPLETE,
      data: {
        completedAt: 123456789,
        destination: 'Intro',
      },
    });
  });

  it('skips backend logout when no usable token exists and still completes cleanup', async () => {
    mockGetValidAccessToken.mockResolvedValue(null);

    const dispatched = await runLogout({ auth: { userToken: '' } });

    expect(mockApiCall).not.toHaveBeenCalled();
    expect(mockDisablePushNotifications).toHaveBeenCalledWith(undefined);
    expect(mockDisconnectChatSocket).toHaveBeenCalled();
    expect(mockClearAuthTokens).toHaveBeenCalled();
    expect(dispatched[0]).toEqual({
      type: ACTIONS.LOGOUT_COMPLETE,
      data: {
        completedAt: 123456789,
        destination: 'Intro',
      },
    });
  });
});

describe('getProfileSaga stale result guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiCall.mockResolvedValue({
      status: 200,
      response: { emailVerified: true, isProfileCompleted: true },
    });
  });

  it('drops a profile success when logout completed after the request started', async () => {
    const dispatched: any[] = [];

    await runSaga(
      {
        dispatch: (action) => dispatched.push(action),
        getState: () => ({
          auth: {
            userToken: '',
            logoutPending: false,
            logoutCompletedAt: 123,
          },
        }),
      },
      getProfileSaga,
      { type: 'get_profile_request', token: 'stale-token', pullSavedData: false }
    ).toPromise();

    expect(dispatched).toEqual([{ type: ACTIONS.SET_LOADER, data: false }]);
  });

  it('drops a profile success when the current token no longer matches the request token', async () => {
    const dispatched: any[] = [];

    await runSaga(
      {
        dispatch: (action) => dispatched.push(action),
        getState: () => ({
          auth: {
            userToken: 'new-token',
            logoutPending: false,
            logoutCompletedAt: undefined,
          },
        }),
      },
      getProfileSaga,
      { type: 'get_profile_request', token: 'old-token', pullSavedData: false }
    ).toPromise();

    expect(dispatched).toEqual([{ type: ACTIONS.SET_LOADER, data: false }]);
  });
});

describe('profile update onboarding completion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hydrates auth state directly from individual profile update responses', async () => {
    mockApiCall.mockResolvedValue({
      status: 200,
      response: {
        userFind: {
          emailVerified: true,
          accountType: 'individual',
          profile: {
            dateOfBirth: '1990-01-01',
            location: { address: '123 Main St' },
          },
          interests: [{ _id: 'interest-1' }],
        },
      },
    });

    const dispatched: any[] = [];

    await runSaga(
      {
        dispatch: (action) => dispatched.push(action),
      },
      updateProfileRequest,
      {
        type: ACTIONS.Profile_Update,
        data: {
          token: 'token-1',
          accountType: 'individual',
          data: {} as FormData,
        },
      }
    ).toPromise();

    expect(dispatched).toEqual([
      { type: ACTIONS.SET_LOADER, data: true },
      expect.objectContaining({
        type: ACTIONS.UPDATE_PROFILE,
        data: expect.objectContaining({
          token: 'token-1',
          isProfileCompleted: true,
        }),
      }),
      expect.objectContaining({
        type: 'get_profile_success',
        payload: expect.objectContaining({
          token: 'token-1',
          isProfileCompleted: true,
        }),
      }),
      { type: ACTIONS.SET_LOADER, data: false },
    ]);
  });

  it('hydrates auth state directly from organization profile update responses', async () => {
    mockApiCall.mockResolvedValue({
      status: 200,
      response: {
        userFind: {
          emailVerified: true,
          accountType: 'organization',
          profile: {
            companyName: 'One Body Org',
            contactEmail: 'admin@example.com',
            contactName: 'Admin User',
            typeOfOrganization: { _id: 'org-type-1' },
          },
        },
      },
    });

    const dispatched: any[] = [];

    await runSaga(
      {
        dispatch: (action) => dispatched.push(action),
      },
      updateOrgProfileRequest,
      {
        type: ACTIONS.ORGProfile_Update,
        data: {
          token: 'token-2',
          data: {},
        },
      }
    ).toPromise();

    expect(dispatched).toEqual([
      { type: ACTIONS.SET_LOADER, data: true },
      expect.objectContaining({
        type: ACTIONS.UPDATE_PROFILE,
        data: expect.objectContaining({
          token: 'token-2',
          isProfileCompleted: true,
        }),
      }),
      expect.objectContaining({
        type: 'get_profile_success',
        payload: expect.objectContaining({
          token: 'token-2',
          isProfileCompleted: true,
        }),
      }),
      { type: ACTIONS.SET_LOADER, data: false },
    ]);
  });
});
