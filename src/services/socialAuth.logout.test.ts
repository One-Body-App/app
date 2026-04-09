import { signOutSocialProviders } from './socialAuth';

const mockGoogleConfigure = jest.fn();
const mockGoogleRevokeAccess = jest.fn();
const mockGoogleSignOut = jest.fn();
const mockFacebookLogOut = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: (...args: unknown[]) => mockGoogleConfigure(...args),
    revokeAccess: (...args: unknown[]) => mockGoogleRevokeAccess(...args),
    signOut: (...args: unknown[]) => mockGoogleSignOut(...args),
  },
  statusCodes: {},
}));

jest.mock('react-native-fbsdk-next', () => ({
  LoginManager: {
    logOut: (...args: unknown[]) => mockFacebookLogOut(...args),
  },
}));

jest.mock('./api', () => ({
  ApiCall: jest.fn(),
}));

jest.mock('./authTokens', () => ({
  saveAuthTokens: jest.fn(),
}));

jest.mock('./constants', () => ({
  GOOGLE_LOGIN_CLIENT_ID: 'google-client-id',
}));

describe('signOutSocialProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    mockGoogleRevokeAccess.mockResolvedValue(undefined);
    mockGoogleSignOut.mockResolvedValue(undefined);
    mockFacebookLogOut.mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('signs out Google and Facebook providers best-effort', async () => {
    await signOutSocialProviders();

    expect(mockGoogleConfigure).toHaveBeenCalledWith({
      webClientId: 'google-client-id',
    });
    expect(mockGoogleRevokeAccess).toHaveBeenCalled();
    expect(mockGoogleSignOut).toHaveBeenCalled();
    expect(mockFacebookLogOut).toHaveBeenCalled();
  });

  it('swallows Facebook logout exceptions', async () => {
    mockFacebookLogOut.mockImplementation(() => {
      throw new Error('android crash');
    });

    await expect(signOutSocialProviders()).resolves.toBeUndefined();
    expect(mockGoogleRevokeAccess).toHaveBeenCalled();
    expect(mockGoogleSignOut).toHaveBeenCalled();
  });
});
