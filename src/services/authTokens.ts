import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { BASE_URL } from './constants';

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

let inFlightRefresh: Promise<StoredAuthTokens | null> | null = null;

function isValidStoredTokens(value: Partial<StoredAuthTokens> | null): value is StoredAuthTokens {
  if (!value) {
    return false;
  }

  return Boolean(
    value.accessToken &&
      value.refreshToken &&
      Number.isFinite(value.accessTokenExpiresAt) &&
      Number.isFinite(value.refreshTokenExpiresAt) &&
      value.accessTokenExpiresAt > 0 &&
      value.refreshTokenExpiresAt > 0
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

async function readSecureTokens(): Promise<StoredAuthTokens | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: AUTH_TOKEN_SERVICE,
    });
    if (!credentials) {
      return null;
    }

    const parsed = JSON.parse(credentials.password ?? '{}') as Partial<StoredAuthTokens>;
    return isValidStoredTokens(parsed) ? parsed : null;
  } catch {
    return null;
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

  if (await readSecureTokens()) {
    await invalidateSecureTokens();

    try {
      await Keychain.resetGenericPassword({ service: AUTH_TOKEN_SERVICE });
    } catch {
      // ignore final cleanup failures after invalidation
    }
  }
}

export async function loadAuthTokens(): Promise<StoredAuthTokens | null> {
  const secure = await readSecureTokens();
  if (secure) {
    return secure;
  }

  const legacy = await readLegacyTokens();
  if (!legacy) {
    return null;
  }

  const wroteSecure = await writeSecureTokens(legacy);
  await clearLegacyTokens();
  return wroteSecure ? legacy : null;
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<StoredAuthTokens> {
  const now = Date.now();
  const accessTokenExpiresAt = now + tokens.expiresIn * 1000;
  const refreshTokenExpiresAt = now + tokens.refreshExpiresIn * 1000;

  const storedTokens: StoredAuthTokens = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };

  const wroteSecure = await writeSecureTokens(storedTokens);
  if (wroteSecure) {
    await clearLegacyTokens();
    return storedTokens;
  }

  await clearLegacyTokens();
  throw new Error('Secure token storage unavailable');
}

export async function clearAuthTokens(): Promise<void> {
  inFlightRefresh = null;
  await clearSecureTokens();
  await clearLegacyTokens();
}

function isExpired(expiresAt: number, skewMs = 30_000) {
  return Date.now() + skewMs >= expiresAt;
}

export async function refreshAuthTokens(): Promise<StoredAuthTokens | null> {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = (async () => {
    try {
      const stored = await loadAuthTokens();
      if (!stored) {
        return null;
      }

      if (isExpired(stored.refreshTokenExpiresAt, 0)) {
        await clearAuthTokens();
        return null;
      }

      const url = `${BASE_URL}/auth/refresh`;
      const res = await axios.post(url, { refreshToken: stored.refreshToken });

      const nextTokens: AuthTokens | undefined = res?.data?.tokens;
      if (!nextTokens?.accessToken || !nextTokens?.refreshToken) {
        return null;
      }

      return await saveAuthTokens(nextTokens);
    } catch {
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

export async function getValidAccessToken(): Promise<string | null> {
  const stored = await loadAuthTokens();
  if (!stored) {
    return null;
  }

  if (!isExpired(stored.accessTokenExpiresAt)) {
    return stored.accessToken;
  }

  const refreshed = await refreshAuthTokens();
  return refreshed?.accessToken ?? null;
}
