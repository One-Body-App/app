const mockGoogleConfigure = jest.fn();
const mockGoogleHasPlayServices = jest.fn();
const mockGoogleSignIn = jest.fn();

const loadSocialAuthModule = (googleClientId?: string) => {
  jest.resetModules();
  jest.clearAllMocks();

  jest.doMock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
      configure: (...args: unknown[]) => mockGoogleConfigure(...args),
      hasPlayServices: (...args: unknown[]) => mockGoogleHasPlayServices(...args),
      signIn: (...args: unknown[]) => mockGoogleSignIn(...args),
      signOut: jest.fn(() => Promise.resolve()),
      revokeAccess: jest.fn(() => Promise.resolve()),
      isSignedIn: jest.fn(() => Promise.resolve(false)),
    },
    statusCodes: {
      SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    },
  }));

  jest.doMock('@invertase/react-native-apple-authentication', () => ({
    appleAuth: {
      isSupported: true,
      performRequest: jest.fn(() => Promise.resolve({})),
      Operation: {
        LOGIN: 'LOGIN',
      },
      Scope: {
        EMAIL: 'EMAIL',
        FULL_NAME: 'FULL_NAME',
      },
      Error: {
        CANCELED: 'CANCELED',
      },
    },
  }));

  jest.doMock('./api', () => ({
    ApiCall: jest.fn(),
  }));

  jest.doMock('./authTokens', () => ({
    saveAuthTokens: jest.fn(),
  }));

  jest.doMock('./constants', () => ({
    GOOGLE_LOGIN_CLIENT_ID: googleClientId,
  }));

  // eslint-disable-next-line global-require
  return require('./socialAuth');
};

describe('socialAuth Google configuration', () => {
  beforeEach(() => {
    mockGoogleHasPlayServices.mockResolvedValue(true);
    mockGoogleSignIn.mockResolvedValue({
      idToken: 'google-id-token',
      user: {
        email: 'person@example.com',
        name: 'Person Example',
        givenName: 'Person',
        familyName: 'Example',
      },
    });
  });

  it('configures Google Sign-In with a single web client id', () => {
    const socialAuth = loadSocialAuthModule('web-client-id');

    socialAuth.ensureGoogleSigninConfigured();

    expect(mockGoogleConfigure).toHaveBeenCalledWith({
      webClientId: 'web-client-id',
    });
  });

  it('throws a clear error when GOOGLE_LOGIN_CLIENT_ID contains multiple ids', () => {
    const socialAuth = loadSocialAuthModule('web-client-id,android-client-id');

    expect(() => socialAuth.ensureGoogleSigninConfigured()).toThrow(
      'Google Sign-In is misconfigured. GOOGLE_LOGIN_CLIENT_ID must be a single web client ID.'
    );
  });

  it('uses the configured Google web client id when requesting an id token', async () => {
    const socialAuth = loadSocialAuthModule('web-client-id');

    const result = await socialAuth.getGoogleIdToken();

    expect(mockGoogleConfigure).toHaveBeenCalledWith({
      webClientId: 'web-client-id',
    });
    expect(mockGoogleHasPlayServices).toHaveBeenCalledWith({
      showPlayServicesUpdateDialog: true,
    });
    expect(result).toEqual(
      expect.objectContaining({
        idToken: 'google-id-token',
        details: expect.objectContaining({
          email: 'person@example.com',
        }),
      })
    );
  });
});
