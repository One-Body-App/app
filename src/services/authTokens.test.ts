import { clearAuthTokens, getValidAccessToken, loadAuthTokens } from './authTokens';

const mockAxiosPost = jest.fn();
const mockAsyncStorageMultiGet = jest.fn();
const mockAsyncStorageMultiRemove = jest.fn();
const mockGetGenericPassword = jest.fn();
const mockSetGenericPassword = jest.fn();
const mockResetGenericPassword = jest.fn();
const mockGetAllGenericPasswordServices = jest.fn();
const mockGetClerkSessionToken = jest.fn();
const mockSignOutClerkSession = jest.fn();

const AUTH_TOKEN_SERVICE = 'com.onebody.auth.tokens';
const LEGACY_KEYS = [
  'auth.accessToken',
  'auth.refreshToken',
  'auth.accessTokenExpiresAt',
  'auth.refreshTokenExpiresAt',
];

let secureEntries: Record<string, string | undefined>;
let defaultSecureEntry: string | undefined;
let legacyEntries: Record<string, string | undefined>;
let keepNamedAuthEntryOnReset = false;

jest.mock('@react-native-async-storage/async-storage', () => ({
  multiGet: (...args: unknown[]) => mockAsyncStorageMultiGet(...args),
  multiRemove: (...args: unknown[]) => mockAsyncStorageMultiRemove(...args),
}));

jest.mock('axios', () => ({
  post: (...args: unknown[]) => mockAxiosPost(...args),
}));

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
  getGenericPassword: (...args: unknown[]) => mockGetGenericPassword(...args),
  setGenericPassword: (...args: unknown[]) => mockSetGenericPassword(...args),
  resetGenericPassword: (...args: unknown[]) => mockResetGenericPassword(...args),
  getAllGenericPasswordServices: (...args: unknown[]) => mockGetAllGenericPasswordServices(...args),
}));

jest.mock('./clerkSession', () => ({
  getClerkSessionToken: (...args: unknown[]) => mockGetClerkSessionToken(...args),
  signOutClerkSession: (...args: unknown[]) => mockSignOutClerkSession(...args),
}));

const setSecureEntry = (service: string, password?: string) => {
  if (password) {
    secureEntries[service] = password;
    return;
  }

  delete secureEntries[service];
};

describe('authTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    secureEntries = {};
    defaultSecureEntry = undefined;
    legacyEntries = {};
    keepNamedAuthEntryOnReset = false;

    mockAxiosPost.mockResolvedValue({ data: {} });
    mockAsyncStorageMultiGet.mockImplementation(async (keys: string[]) =>
      keys.map((key) => [key, legacyEntries[key] ?? null])
    );
    mockAsyncStorageMultiRemove.mockImplementation(async (keys: string[]) => {
      keys.forEach((key) => {
        delete legacyEntries[key];
      });
    });
    mockGetGenericPassword.mockImplementation(async (options?: { service?: string }) => {
      const service = options?.service;
      const password = service ? secureEntries[service] : defaultSecureEntry;

      if (!password) {
        return false;
      }

      return {
        service: service ?? 'default',
        username: 'onebody',
        password,
      };
    });
    mockSetGenericPassword.mockImplementation(
      async (_username: string, password: string, options?: { service?: string }) => {
        const service = options?.service ?? 'default';

        if (service === 'default') {
          defaultSecureEntry = password;
        } else {
          setSecureEntry(service, password);
        }

        return { service, storage: 'mock' };
      }
    );
    mockResetGenericPassword.mockImplementation(async (options?: { service?: string }) => {
      const service = options?.service;

      if (!service) {
        defaultSecureEntry = undefined;
        return true;
      }

      if (service === AUTH_TOKEN_SERVICE && keepNamedAuthEntryOnReset) {
        return false;
      }

      setSecureEntry(service, undefined);
      return true;
    });
    mockGetAllGenericPasswordServices.mockImplementation(async () => Object.keys(secureEntries));
    mockGetClerkSessionToken.mockResolvedValue(null);
    mockSignOutClerkSession.mockResolvedValue(undefined);
  });

  it('passes force-refresh requests through to the Clerk session token getter', async () => {
    mockGetClerkSessionToken.mockResolvedValue('fresh-clerk-token');

    await expect(getValidAccessToken({ forceRefreshClerk: true })).resolves.toBe(
      'fresh-clerk-token'
    );

    expect(mockGetClerkSessionToken).toHaveBeenCalledWith({ forceRefresh: true });
    expect(mockAsyncStorageMultiGet).not.toHaveBeenCalled();
  });

  it('invalidates the secure auth entry when reset leaves the token behind', async () => {
    setSecureEntry(
      AUTH_TOKEN_SERVICE,
      JSON.stringify({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        accessTokenExpiresAt: Date.now() + 60_000,
        refreshTokenExpiresAt: Date.now() + 120_000,
      })
    );
    keepNamedAuthEntryOnReset = true;

    await clearAuthTokens();

    expect(mockSetGenericPassword).toHaveBeenCalledWith(
      'onebody',
      '{}',
      expect.objectContaining({
        service: AUTH_TOKEN_SERVICE,
      })
    );
    await expect(loadAuthTokens()).resolves.toBeNull();
    expect(mockAsyncStorageMultiRemove).toHaveBeenCalledWith(LEGACY_KEYS);
  });

  it('clears discovered auth-related keychain services without touching unrelated services', async () => {
    setSecureEntry(AUTH_TOKEN_SERVICE, '{}');
    setSecureEntry('com.onebody.auth.tokens.v2', '{}');
    setSecureEntry('com.onebody.chat.keys.v1', '{"chat":true}');

    await clearAuthTokens();

    expect(mockResetGenericPassword).toHaveBeenCalledWith({ service: AUTH_TOKEN_SERVICE });
    expect(mockResetGenericPassword).toHaveBeenCalledWith({
      service: 'com.onebody.auth.tokens.v2',
    });
    expect(mockResetGenericPassword).not.toHaveBeenCalledWith({
      service: 'com.onebody.chat.keys.v1',
    });
  });
});
