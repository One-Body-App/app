import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as decodeBase64 } from 'base-64';
import * as Keychain from 'react-native-keychain';
import { getClerkSessionToken, signOutClerkSession } from './clerkSession';

const STORAGE_KEYS = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  accessTokenExpiresAt: 'auth.accessTokenExpiresAt',
  refreshTokenExpiresAt: 'auth.refreshTokenExpiresAt',
};
const AUTH_TOKEN_SERVICE = 'com.onebody.auth.tokens';
const AUTH_TOKEN_USERNAME = 'onebody';
const AUTH_TOKEN_SERVICE_PREFIXES = ['com.onebody.auth', AUTH_TOKEN_SERVICE];

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

export type StoredAuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

export type AuthTokenKind = 'clerk' | 'api' | 'unknown';
export type LoadAuthTokensState =
  | { status: 'ok'; tokens: StoredAuthTokens }
  | { status: 'empty' | 'unavailable'; tokens?: undefined };

let inFlightRefresh: Promise<StoredAuthTokens | null> | null = null;

function decodeBase64UrlJson(value: string): Record<string, unknown> | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(decodeBase64(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2 || !parts[1]) {
    return null;
  }

  return decodeBase64UrlJson(parts[1]);
}

export function getAuthTokenKind(token?: string): AuthTokenKind {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return 'unknown';
  }

  const issuer = typeof payload.iss === 'string' ? payload.iss.toLowerCase() : '';
  const subject = typeof payload.sub === 'string' ? payload.sub : '';
  const sessionId = typeof payload.sid === 'string' ? payload.sid : '';
  if (issuer.includes('clerk') || subject.startsWith('user_') || sessionId.startsWith('sess_')) {
    return 'clerk';
  }

  if (
    payload.actorType === 'user' ||
    payload.actorType === 'admin' ||
    typeof payload.accountType === 'string' ||
    typeof payload.role === 'string'
  ) {
    return 'api';
  }

  return 'unknown';
}

export function getAuthTokenExpiresAt(token?: string): number | null {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  return typeof exp === 'number' && Number.isFinite(exp) && exp > 0 ? exp * 1000 : null;
}

export function isAuthTokenExpired(token?: string, skewMs = 30_000): boolean {
  const expiresAt = getAuthTokenExpiresAt(token);
  return expiresAt != null && Date.now() + skewMs >= expiresAt;
}

function isValidStoredTokens(value: Partial<StoredAuthTokens> | null): value is StoredAuthTokens {
  if (!value) {
    return false;
  }

  const { accessTokenExpiresAt, refreshTokenExpiresAt } = value;
  return Boolean(
    value.accessToken &&
      value.refreshToken &&
      typeof accessTokenExpiresAt === 'number' &&
      typeof refreshTokenExpiresAt === 'number' &&
      accessTokenExpiresAt > 0 &&
      refreshTokenExpiresAt > 0
  );
}

async function readLegacyTokens(): Promise<StoredAuthTokens | null> {
  const [accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt] =
    await AsyncStorage.multiGet([
      STORAGE_KEYS.accessToken,
      STORAGE_KEYS.refreshToken,
      STORAGE_KEYS.accessTokenExpiresAt,
      STORAGE_KEYS.refreshTokenExpiresAt,
    ]);

  const candidate: Partial<StoredAuthTokens> = {
    accessToken: accessToken?.[1] ?? '',
    refreshToken: refreshToken?.[1] ?? '',
    accessTokenExpiresAt: Number(accessTokenExpiresAt?.[1] ?? 0),
    refreshTokenExpiresAt: Number(refreshTokenExpiresAt?.[1] ?? 0),
  };

  return isValidStoredTokens(candidate) ? candidate : null;
}

async function clearLegacyTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.accessToken,
    STORAGE_KEYS.refreshToken,
    STORAGE_KEYS.accessTokenExpiresAt,
    STORAGE_KEYS.refreshTokenExpiresAt,
  ]);
}

async function readSecureTokensState(): Promise<LoadAuthTokensState> {
  let credentials: false | Keychain.UserCredentials;
  try {
    credentials = await Keychain.getGenericPassword({
      service: AUTH_TOKEN_SERVICE,
    });
  } catch {
    return { status: 'unavailable' };
  }

  if (!credentials) {
    return { status: 'empty' };
  }

  try {
    const parsed = JSON.parse(credentials.password ?? '{}') as Partial<StoredAuthTokens>;
    return isValidStoredTokens(parsed) ? { status: 'ok', tokens: parsed } : { status: 'empty' };
  } catch {
    return { status: 'empty' };
  }
}

async function writeSecureTokens(tokens: StoredAuthTokens): Promise<boolean> {
  try {
    await Keychain.setGenericPassword(AUTH_TOKEN_USERNAME, JSON.stringify(tokens), {
      service: AUTH_TOKEN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch {
    return false;
  }
}

async function getAuthTokenServices(): Promise<string[]> {
  try {
    const services = await Keychain.getAllGenericPasswordServices();
    const matchingServices = services.filter((service) =>
      AUTH_TOKEN_SERVICE_PREFIXES.some(
        (prefix) => service === prefix || service.startsWith(`${prefix}.`)
      )
    );

    return Array.from(new Set([AUTH_TOKEN_SERVICE, ...matchingServices]));
  } catch {
    return [AUTH_TOKEN_SERVICE];
  }
}

async function invalidateSecureTokens(): Promise<void> {
  try {
    await Keychain.setGenericPassword(AUTH_TOKEN_USERNAME, '{}', {
      service: AUTH_TOKEN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // ignore secure storage overwrite failures
  }
}

async function clearSecureTokens(): Promise<void> {
  const services = await getAuthTokenServices();

  await Promise.all(
    services.map(async (service) => {
      try {
        await Keychain.resetGenericPassword({ service });
      } catch {
        // ignore service-specific cleanup failures
      }
    })
  );

  try {
    await Keychain.resetGenericPassword();
  } catch {
    // ignore default-service cleanup failures
  }

  if ((await readSecureTokensState()).status === 'ok') {
    await invalidateSecureTokens();

    try {
      await Keychain.resetGenericPassword({ service: AUTH_TOKEN_SERVICE });
    } catch {
      // ignore final cleanup failures after invalidation
    }
  }
}

export async function loadAuthTokensState(): Promise<LoadAuthTokensState> {
  const secure = await readSecureTokensState();
  if (secure.status === 'ok') {
    return secure;
  }

  const legacy = await readLegacyTokens();
  if (!legacy) {
    return secure.status === 'unavailable' ? { status: 'unavailable' } : { status: 'empty' };
  }

  if (secure.status !== 'unavailable') {
    const wroteSecure = await writeSecureTokens(legacy);
    if (wroteSecure) {
      await clearLegacyTokens();
    }
    return { status: 'ok', tokens: legacy };
  }

  return { status: 'ok', tokens: legacy };
}

export async function loadAuthTokens(): Promise<StoredAuthTokens | null> {
  const state = await loadAuthTokensState();
  return state.status === 'ok' ? state.tokens : null;
}

export async function saveAuthTokens(_tokens: AuthTokens): Promise<StoredAuthTokens> {
  throw new Error('Legacy API token storage is disabled. Please use Clerk sign-in.');
}

export async function clearAuthTokens(): Promise<void> {
  inFlightRefresh = null;
  try {
    await signOutClerkSession();
  } catch {
    // ignore Clerk sign-out failures during local cleanup
  }
  await clearSecureTokens();
  await clearLegacyTokens();
}

export async function refreshAuthTokens(): Promise<StoredAuthTokens | null> {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = (async () => {
    try {
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

export async function getValidAccessToken(options?: {
  forceRefreshClerk?: boolean;
}): Promise<string | null> {
  return getClerkSessionToken({
    forceRefresh: options?.forceRefreshClerk === true,
  }).catch(() => null);
}

export async function getValidApiAccessToken(): Promise<string | null> {
  return null;
}

export async function recoverAuthAfterUnauthorized(rejectedToken?: string): Promise<string | null> {
  const clerkToken = await getClerkSessionToken({ forceRefresh: true }).catch(() => null);
  if (clerkToken && clerkToken !== rejectedToken) {
    return clerkToken;
  }

  return null;
}
