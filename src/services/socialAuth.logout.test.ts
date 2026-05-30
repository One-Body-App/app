import { signOutSocialProviders } from './socialAuth';

const mockGoogleConfigure = jest.fn();
const mockGoogleIsSignedIn = jest.fn();
const mockGoogleRevokeAccess = jest.fn();
const mockGoogleSignOut = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: (...args: unknown[]) => mockGoogleConfigure(...args),
    isSignedIn: (...args: unknown[]) => mockGoogleIsSignedIn(...args),
    revokeAccess: (...args: unknown[]) => mockGoogleRevokeAccess(...args),
    signOut: (...args: unknown[]) => mockGoogleSignOut(...args),
  },
  statusCodes: {},
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
    mockGoogleIsSignedIn.mockResolvedValue(true);
    mockGoogleRevokeAccess.mockResolvedValue(undefined);
    mockGoogleSignOut.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('signs out Google best-effort when a Google session exists', async () => {
    await signOutSocialProviders();

    expect(mockGoogleConfigure).toHaveBeenCalledWith({
      webClientId: 'google-client-id',
    });
    expect(mockGoogleIsSignedIn).toHaveBeenCalled();
    expect(mockGoogleRevokeAccess).toHaveBeenCalled();
    expect(mockGoogleSignOut).toHaveBeenCalled();
  });

  it('swallows Google provider logout exceptions', async () => {
    mockGoogleRevokeAccess.mockRejectedValue(new Error('google revoke failed'));

    await expect(signOutSocialProviders()).resolves.toBeUndefined();
    expect(mockGoogleRevokeAccess).toHaveBeenCalled();
    expect(mockGoogleSignOut).toHaveBeenCalled();
  });

  it('skips Google logout calls when no provider session exists', async () => {
    mockGoogleIsSignedIn.mockResolvedValue(false);

    await signOutSocialProviders();

    expect(mockGoogleRevokeAccess).not.toHaveBeenCalled();
    expect(mockGoogleSignOut).not.toHaveBeenCalled();
  });
});
