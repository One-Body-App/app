import { Buffer } from 'buffer';

const mockGoogleConfigure = jest.fn();
const mockGoogleHasPlayServices = jest.fn();
const mockGoogleSignIn = jest.fn();
const mockApiCall = jest.fn();
const mockSaveAuthTokens = jest.fn();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

const createJwt = (payload: Record<string, unknown>) => {
  const encodedHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const encodedPayload = Buffer.from(JSON.stringify(payload))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${encodedHeader}.${encodedPayload}.signature`;
};

const loadSocialAuthModule = (
  googleClientId?: string,
  platformOS: 'android' | 'ios' = 'android'
) => {
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

  jest.doMock('react-native', () => ({
    Platform: {
      OS: platformOS,
    },
  }));

  jest.doMock('./api', () => ({
    ApiCall: (...args: unknown[]) => mockApiCall(...args),
  }));

  jest.doMock('./authTokens', () => ({
    saveAuthTokens: (...args: unknown[]) => mockSaveAuthTokens(...args),
  }));

  jest.doMock('./constants', () => ({
    GOOGLE_LOGIN_CLIENT_ID: googleClientId,
  }));

  // eslint-disable-next-line global-require
  return require('./socialAuth');
};

describe('socialAuth Google configuration', () => {
  beforeEach(() => {
    (global as any).__DEV__ = true;
    mockApiCall.mockReset();
    mockSaveAuthTokens.mockReset();
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

  it('logs an Android-specific diagnostic when Google sign-in throws DEVELOPER_ERROR', async () => {
    const socialAuth = loadSocialAuthModule('web-client-id', 'android');
    const developerError = new Error('DEVELOPER_ERROR');
    (developerError as Error & { code?: string }).code = 'DEVELOPER_ERROR';
    mockGoogleSignIn.mockRejectedValue(developerError);

    await expect(socialAuth.getGoogleIdToken()).rejects.toThrow('DEVELOPER_ERROR');

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Android DEVELOPER_ERROR detected'),
      expect.objectContaining({
        code: 'DEVELOPER_ERROR',
        message: 'DEVELOPER_ERROR',
      })
    );
  });

  it('uses the configured Google web client id when requesting an id token', async () => {
    const socialAuth = loadSocialAuthModule('web-client-id');
    const googleIdToken = createJwt({
      aud: 'web-client-id',
      azp: 'android-client-id',
      iss: 'https://accounts.google.com',
      exp: 1_900_000_000,
      sub: 'google-user-id',
    });
    mockGoogleSignIn.mockResolvedValue({
      idToken: googleIdToken,
      user: {
        email: 'person@example.com',
        name: 'Person Example',
        givenName: 'Person',
        familyName: 'Example',
      },
    });

    const result = await socialAuth.getGoogleIdToken();

    expect(mockGoogleConfigure).toHaveBeenCalledWith({
      webClientId: 'web-client-id',
    });
    expect(mockGoogleHasPlayServices).toHaveBeenCalledWith({
      showPlayServicesUpdateDialog: true,
    });
    expect(result).toEqual(
      expect.objectContaining({
        idToken: googleIdToken,
        details: expect.objectContaining({
          email: 'person@example.com',
        }),
      })
    );
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '[Google Sign-In] Android ID token claims',
      expect.objectContaining({
        aud: 'web-client-id',
        azp: 'android-client-id',
        iss: 'https://accounts.google.com',
        exp: 1_900_000_000,
        hasSub: true,
      })
    );
    expect(JSON.stringify(mockConsoleWarn.mock.calls)).not.toContain(googleIdToken);
  });

  it('does not call the legacy social token exchange endpoint', async () => {
    const socialAuth = loadSocialAuthModule('web-client-id');

    const result = await socialAuth.exchangeSocialToken({
      provider: 'google',
      intent: 'login',
      idToken: 'google-id-token',
      details: {
        email: 'person@example.com',
      },
      createIfMissing: false,
    });

    expect(result).toEqual({
      status: 410,
      response: expect.objectContaining({
        provider: 'google',
        message: 'Legacy social-token exchange is disabled. Please use Clerk social sign-in.',
      }),
    });
    expect(mockApiCall).not.toHaveBeenCalled();
    expect(mockSaveAuthTokens).not.toHaveBeenCalled();
  });
});
