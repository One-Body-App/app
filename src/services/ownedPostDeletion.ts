import ApiCall from '@/services/api';
import { PostType } from '@/utils/types';

export type OwnedPostType = PostType.social | PostType.prayer | PostType.watch;

export type OwnedPostDeletedEvent = {
  type: OwnedPostType;
  id: string;
};

type OwnedPostDeletedListener = (event: OwnedPostDeletedEvent) => void;

const ownedPostDeletedListeners = new Set<OwnedPostDeletedListener>();

const toMessage = (response: unknown, fallback: string) => {
  if (response && typeof response === 'object' && 'message' in response) {
    const { message } = response as { message?: unknown };
    if (typeof message === 'string' && message.trim().length > 0) {
      return message.trim();
    }
  }

  return fallback;
};

export const normalizeOwnedPostType = (value: unknown): OwnedPostType | null => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (normalized === PostType.social) {
    return PostType.social;
  }
  if (normalized === PostType.prayer) {
    return PostType.prayer;
  }
  if (normalized === PostType.watch) {
    return PostType.watch;
  }

  return null;
};

export const getOwnedPostDeleteRoute = (type: OwnedPostType, id: string) => {
  switch (type) {
    case PostType.social:
      return `social/remove-post/${id}`;
    case PostType.prayer:
      return `prayer/${id}`;
    case PostType.watch:
      return `watch/${id}`;
    default:
      return null;
  }
};

export const subscribeToOwnedPostDeleted = (listener: OwnedPostDeletedListener) => {
  ownedPostDeletedListeners.add(listener);

  return () => {
    ownedPostDeletedListeners.delete(listener);
  };
};

export const emitOwnedPostDeleted = (event: OwnedPostDeletedEvent) => {
  ownedPostDeletedListeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // Ignore listener failures so one stale subscriber does not block others.
    }
  });
};

export const deleteOwnedPost = async ({
  type,
  id,
  token,
}: {
  type: unknown;
  id: string;
  token?: string;
}) => {
  const normalizedType = normalizeOwnedPostType(type);
  const normalizedId = String(id ?? '').trim();

  if (!normalizedType || normalizedId.length < 1) {
    return {
      ok: false,
      status: 400,
      message: 'Unable to delete this post right now.',
    };
  }

  const route = getOwnedPostDeleteRoute(normalizedType, normalizedId);
  if (!route) {
    return {
      ok: false,
      status: 400,
      message: 'Unable to delete this post right now.',
    };
  }

  const response = await ApiCall({
    route,
    verb: 'delete',
    token,
  });

  if (response?.status === 200) {
    return {
      ok: true,
      status: 200,
      type: normalizedType,
      id: normalizedId,
    };
  }

  return {
    ok: false,
    status: response?.status ?? 400,
    message: toMessage(response?.response, 'Unable to delete this post right now.'),
  };
};
