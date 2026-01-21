import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from './constants';

const STORAGE_KEYS = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  accessTokenExpiresAt: 'auth.accessTokenExpiresAt',
  refreshTokenExpiresAt: 'auth.refreshTokenExpiresAt',
};

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

export async function loadAuthTokens(): Promise<StoredAuthTokens | null> {
  const [accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt] =
    await AsyncStorage.multiGet([
      STORAGE_KEYS.accessToken,
      STORAGE_KEYS.refreshToken,
      STORAGE_KEYS.accessTokenExpiresAt,
      STORAGE_KEYS.refreshTokenExpiresAt,
    ]);

  const access = accessToken?.[1] ?? '';
  const refresh = refreshToken?.[1] ?? '';
  const accessExp = Number(accessTokenExpiresAt?.[1] ?? 0);
  const refreshExp = Number(refreshTokenExpiresAt?.[1] ?? 0);

  if (!access || !refresh || !accessExp || !refreshExp) {
    return null;
  }

  return {
    accessToken: access,
    refreshToken: refresh,
    accessTokenExpiresAt: accessExp,
    refreshTokenExpiresAt: refreshExp,
  };
}

export async function saveAuthTokens(tokens: AuthTokens): Promise<StoredAuthTokens> {
  const now = Date.now();
  const accessTokenExpiresAt = now + tokens.expiresIn * 1000;
  const refreshTokenExpiresAt = now + tokens.refreshExpiresIn * 1000;

  await AsyncStorage.multiSet([
    [STORAGE_KEYS.accessToken, tokens.accessToken],
    [STORAGE_KEYS.refreshToken, tokens.refreshToken],
    [STORAGE_KEYS.accessTokenExpiresAt, String(accessTokenExpiresAt)],
    [STORAGE_KEYS.refreshTokenExpiresAt, String(refreshTokenExpiresAt)],
  ]);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}

export async function clearAuthTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.accessToken,
    STORAGE_KEYS.refreshToken,
    STORAGE_KEYS.accessTokenExpiresAt,
    STORAGE_KEYS.refreshTokenExpiresAt,
  ]);
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
