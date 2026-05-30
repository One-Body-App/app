import { BASE_URL, NO_PROFILE_IMAGE } from './constants';
import { getValidAccessToken } from './authTokens';

export type MentionUser = {
  id: string;
  username: string;
  name: string;
  profileImage?: string;
  allowTagging?: boolean;
  isProfilePublic?: boolean;
};

const toBearerToken = async (token?: string | null) => {
  if (typeof token === 'string' && token.trim().length > 0) {
    const refreshedToken = await getValidAccessToken();
    return refreshedToken ?? token;
  }

  return (await getValidAccessToken()) ?? '';
};

const resolveUsername = (value: any): string => {
  if (typeof value?.username === 'string') return value.username.trim().toLowerCase();
  if (typeof value?.handler === 'string') return value.handler.trim().toLowerCase();
  return '';
};

const resolveAllowTagging = (value: any): boolean => {
  if (typeof value?.allowTagging === 'boolean') return value.allowTagging;
  if (typeof value?.taggingDisabled === 'boolean') return !value.taggingDisabled;
  return true;
};

const resolveIsProfilePublic = (value: any): boolean => {
  if (typeof value?.isProfilePublic === 'boolean') return value.isProfilePublic;
  if (typeof value?.profileVisibility === 'string')
    return value.profileVisibility.toLowerCase() === 'public';
  if (typeof value?.profile?.isPublic === 'boolean') return value.profile.isPublic;
  return true;
};

const toMentionUser = (value: any): MentionUser | null => {
  const username = resolveUsername(value);
  const id = String(value?.id ?? value?._id ?? '').trim();
  if (!id || !username) {
    return null;
  }

  return {
    id,
    username,
    name:
      typeof value?.name === 'string' && value.name.trim().length > 0
        ? value.name.trim()
        : username,
    profileImage:
      (typeof value?.profileImage === 'string' && value.profileImage) ||
      (typeof value?.profile_image === 'string' && value.profile_image) ||
      (typeof value?.avatar === 'string' && value.avatar) ||
      NO_PROFILE_IMAGE ||
      undefined,
    allowTagging: resolveAllowTagging(value),
    isProfilePublic: resolveIsProfilePublic(value),
  };
};

const resolveErrorMessage = async (response: { json: () => Promise<any>; status: number }) => {
  try {
    const payload = await response.json();
    if (typeof payload?.message === 'string') {
      return payload.message;
    }
    if (Array.isArray(payload?.message)) {
      return payload.message.join(', ');
    }
  } catch {
    // ignore response parsing failures
  }

  return `Request failed with status ${response.status}`;
};

export const fetchUserSuggestions = async ({
  query,
  token,
  limit = 8,
  signal,
  context = 'tagging',
}: {
  query: string;
  token?: string | null;
  limit?: number;
  signal?: AbortSignal;
  context?: 'tagging' | 'mentions';
}) => {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) {
    return [] as MentionUser[];
  }

  const bearerToken = await toBearerToken(token);
  const response = await fetch(`${BASE_URL}/user/search`, {
    method: 'POST',
    signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : undefined),
    },
    body: JSON.stringify({
      text: normalizedQuery,
      type: 'users',
      limit,
      skip: 0,
      context,
    }),
  });

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response));
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map(toMentionUser)
    .filter(
      (value): value is MentionUser =>
        value !== null && value.allowTagging !== false && value.isProfilePublic !== false
    )
    .slice(0, limit);
};

export const fetchUserByHandle = async ({
  handle,
  token,
  signal,
}: {
  handle: string;
  token?: string | null;
  signal?: AbortSignal;
}) => {
  const normalizedHandle = String(handle || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();
  if (!normalizedHandle) {
    throw new Error('Username is required');
  }

  const bearerToken = await toBearerToken(token);
  const response = await fetch(
    `${BASE_URL}/user/by-username/${encodeURIComponent(normalizedHandle)}`,
    {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : undefined),
      },
    }
  );

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response));
  }

  return response.json();
};
