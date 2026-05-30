import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { ApiCall } from '@/services/api';

export type FeedTelemetryFeedType = 'connected' | 'foryou' | 'read' | 'watch' | 'pray';

export type FeedTelemetryEventType =
  | 'impression'
  | 'dwell'
  | 'open_comments'
  | 'open_post'
  | 'open_article'
  | 'media_open'
  | 'reaction'
  | 'reaction_removed'
  | 'share'
  | 'save'
  | 'unsave'
  | 'video_play'
  | 'video_pause';

export type FeedTelemetryEventInput = {
  eventType: FeedTelemetryEventType | string;
  feedType: FeedTelemetryFeedType;
  postId: string;
  eventId?: string;
  canonicalEventName?: string;
  postType?: string;
  contentType?: string;
  tags?: string[];
  durationMs?: number;
  position?: number;
  source?: string;
  occurredAt?: string;
  timestamp?: string;
  sessionId?: string;
  requestId?: string;
  userId?: string;
  authorId?: string;
  surface?: string;
  surfaceTab?: string;
  entrypoint?: string;
  rankPosition?: number;
  feedAlgorithm?: string;
  experimentBucket?: string;
  isOwnPost?: boolean;
  isRepost?: boolean;
  privacyState?: string;
  result?: string;
  metadata?: Record<string, unknown>;
};

const MAX_BATCH_SIZE = 50;
const MAX_QUEUE_SIZE = 500;
const FLUSH_INTERVAL_MS = 4000;
const QUEUE_PERSIST_DELAY_MS = 300;
const MAX_DURATION_MS = 3600000;
const FEED_TELEMETRY_STORAGE_KEY = '@onebody/feed-telemetry-queue.v2';

let queue: FeedTelemetryEventInput[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;
let authToken: string | undefined;
let authRejectedToken: string | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let hasHydratedQueue = false;
let hydrateQueuePromise: Promise<void> | null = null;

const sanitizeDurationMs = (durationMs?: number): number | undefined => {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs)) {
    return undefined;
  }
  const normalized = Math.floor(durationMs);
  if (normalized < 0) {
    return 0;
  }
  if (normalized > MAX_DURATION_MS) {
    return MAX_DURATION_MS;
  }
  return normalized;
};

const normalizeTelemetryEvent = (event: FeedTelemetryEventInput): FeedTelemetryEventInput => ({
  ...event,
  durationMs: sanitizeDurationMs(event.durationMs),
  occurredAt: event.occurredAt ?? event.timestamp ?? new Date().toISOString(),
  timestamp: event.timestamp ?? event.occurredAt ?? new Date().toISOString(),
  rankPosition: event.rankPosition ?? event.position,
});

const clearFlushTimer = () => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
};

const clearPersistTimer = () => {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
};

const persistQueueToStorage = async () => {
  if (!hasHydratedQueue) {
    return;
  }
  try {
    if (queue.length < 1) {
      await AsyncStorage.removeItem(FEED_TELEMETRY_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(
      FEED_TELEMETRY_STORAGE_KEY,
      JSON.stringify(queue.map(normalizeTelemetryEvent))
    );
  } catch (_error) {
    // Telemetry persistence must not block user flows.
  }
};

const schedulePersistQueue = () => {
  if (!hasHydratedQueue || persistTimer) {
    return;
  }
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistQueueToStorage().catch(() => undefined);
  }, QUEUE_PERSIST_DELAY_MS);
};

const ensureQueueHydrated = async () => {
  if (hasHydratedQueue) {
    return;
  }
  if (hydrateQueuePromise) {
    await hydrateQueuePromise;
    return;
  }

  hydrateQueuePromise = (async () => {
    try {
      const rawValue = await AsyncStorage.getItem(FEED_TELEMETRY_STORAGE_KEY);
      if (!rawValue) {
        hasHydratedQueue = true;
        return;
      }

      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        queue = [...parsed.map(normalizeTelemetryEvent), ...queue].slice(-MAX_QUEUE_SIZE);
      }
    } catch (_error) {
      // Ignore malformed persisted telemetry. Runtime queue remains authoritative.
    } finally {
      hasHydratedQueue = true;
      hydrateQueuePromise = null;
      schedulePersistQueue();
    }
  })();

  await hydrateQueuePromise;
};

const scheduleFlush = () => {
  if (flushTimer || queue.length < 1) {
    return;
  }
  if (authToken && authRejectedToken && authToken === authRejectedToken) {
    return;
  }
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushFeedTelemetry().catch(() => undefined);
  }, FLUSH_INTERVAL_MS);
};

const ensureAppStateListener = () => {
  if (appStateSubscription) {
    return;
  }

  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState !== 'active') {
      flushFeedTelemetry().catch(() => undefined);
    }
  });
};

export const setFeedTelemetryAuthToken = (token?: string) => {
  const tokenChanged = token !== authToken;
  authToken = token;
  ensureQueueHydrated().catch(() => undefined);
  if (!token) {
    authRejectedToken = null;
    return;
  }
  if (tokenChanged && authRejectedToken) {
    authRejectedToken = null;
  }
  if (token && queue.length > 0) {
    flushFeedTelemetry(token).catch(() => undefined);
  }
};

export const trackFeedTelemetry = (event: FeedTelemetryEventInput) => {
  if (!event?.postId || !event?.feedType || !event?.eventType) {
    return;
  }

  ensureQueueHydrated().catch(() => undefined);
  ensureAppStateListener();

  queue.push(normalizeTelemetryEvent(event));

  if (queue.length > MAX_QUEUE_SIZE) {
    queue = queue.slice(queue.length - MAX_QUEUE_SIZE);
  }
  schedulePersistQueue();

  if (queue.length >= MAX_BATCH_SIZE) {
    flushFeedTelemetry().catch(() => undefined);
    return;
  }

  scheduleFlush();
};

export const flushFeedTelemetry = async (tokenOverride?: string) => {
  await ensureQueueHydrated();
  if (isFlushing || queue.length < 1) {
    return;
  }

  const tokenToUse = tokenOverride ?? authToken;
  if (!tokenToUse) {
    scheduleFlush();
    return;
  }
  if (authRejectedToken && authRejectedToken === tokenToUse) {
    return;
  }

  isFlushing = true;
  clearFlushTimer();
  clearPersistTimer();

  const batch = queue.slice(0, MAX_BATCH_SIZE).map(normalizeTelemetryEvent);
  queue = queue.slice(batch.length);

  try {
    const result = await ApiCall({
      route: 'user/feed-telemetry/batch',
      token: tokenToUse,
      verb: 'post',
      suppressErrorLog: true,
      params: {
        events: batch,
      },
    });

    if (result.status !== 200) {
      queue = [...batch, ...queue].slice(-MAX_QUEUE_SIZE);
      schedulePersistQueue();
      if (result.status === 401 || result.status === 403) {
        authRejectedToken = tokenToUse;
        if (__DEV__) {
          console.log('[FeedTelemetry] Pausing telemetry flush after auth rejection', {
            status: result.status,
          });
        }
      }
    } else if (authRejectedToken === tokenToUse) {
      authRejectedToken = null;
    }
  } catch (error) {
    queue = [...batch, ...queue].slice(-MAX_QUEUE_SIZE);
    schedulePersistQueue();
  } finally {
    isFlushing = false;
    if (queue.length > 0) {
      scheduleFlush();
      schedulePersistQueue();
    } else {
      persistQueueToStorage().catch(() => undefined);
    }
  }
};

export const resetFeedTelemetryStateForTests = async () => {
  queue = [];
  clearFlushTimer();
  clearPersistTimer();
  isFlushing = false;
  authToken = undefined;
  authRejectedToken = null;
  hasHydratedQueue = true;
  hydrateQueuePromise = null;
  await AsyncStorage.removeItem(FEED_TELEMETRY_STORAGE_KEY);
};

ensureQueueHydrated().catch(() => undefined);
