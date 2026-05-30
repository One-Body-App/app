import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, NO_PROFILE_IMAGE } from './constants';

const STORAGE_KEY = '@onebody:introAvatars';
const AVATAR_COUNT = 4;
const DEFAULT_PROFILE_PLACEHOLDER_PATH = '/user/no-image.png';

type CachedAvatars = {
  urls: (string | null)[];
  fetchedAt: number;
};

const EMPTY_AVATAR_SLOTS: (string | null)[] = Array(AVATAR_COUNT).fill(null);

function getIntroAvatarUrl(): string {
  const trimmedBaseUrl = String(BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const publicOrigin = trimmedBaseUrl.replace(/\/api$/i, '');
  return `${publicOrigin}/intro-avatars.json`;
}

function isValidHttpUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\/.+/i.test(value.trim());
}

function isPlaceholderProfileImageUrl(value: unknown): boolean {
  if (!isValidHttpUrl(value)) return false;
  const trimmed = value.trim();
  const configuredPlaceholderUrl = String(NO_PROFILE_IMAGE || '').trim();

  if (
    configuredPlaceholderUrl &&
    trimmed.toLowerCase() === configuredPlaceholderUrl.toLowerCase()
  ) {
    return true;
  }

  try {
    const pathname = new URL(trimmed).pathname.replace(/\/+/g, '/').toLowerCase();
    return pathname.endsWith(DEFAULT_PROFILE_PLACEHOLDER_PATH);
  } catch {
    return /\/user\/no-image\.png(?:$|[?#])/i.test(trimmed);
  }
}

function sanitizeAvatarUrls(values: unknown[]): string[] {
  return values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => isValidHttpUrl(value) && !isPlaceholderProfileImageUrl(value));
}

async function fetchFromNetwork(): Promise<string[] | null> {
  try {
    const response = await fetch(getIntroAvatarUrl(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const data: Array<{ profileImage: string }> = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const urls = sanitizeAvatarUrls(data.map((item) => item?.profileImage));
    return urls.length > 0 ? urls : null;
  } catch {
    return null;
  }
}

async function persistCache(urls: string[]): Promise<void> {
  const payload: CachedAvatars = { urls, fetchedAt: Date.now() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

async function readCache(): Promise<CachedAvatars | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedAvatars> | null;
    return {
      urls: sanitizeAvatarUrls(Array.isArray(parsed?.urls) ? parsed.urls : []),
      fetchedAt: typeof parsed?.fetchedAt === 'number' ? parsed.fetchedAt : 0,
    };
  } catch {
    return null;
  }
}

function padToCount(urls: (string | null)[]): (string | null)[] {
  const result = (urls ?? []).slice(0, AVATAR_COUNT);
  while (result.length < AVATAR_COUNT) result.push(null);
  return result;
}

/**
 * Returns exactly 4 entries: CDN URL strings or null (caller falls back to static asset).
 * Always attempts a network refresh on cold start and falls back to cache when needed.
 */
export default async function getCachedIntroAvatars(): Promise<(string | null)[]> {
  const [cached, fresh] = await Promise.all([readCache(), fetchFromNetwork()]);
  if (fresh && fresh.length > 0) {
    try {
      await persistCache(fresh);
    } catch {
      /* cache write failed, non-fatal */
    }
    return padToCount(fresh);
  }

  return cached ? padToCount(cached.urls) : [...EMPTY_AVATAR_SLOTS];
}
