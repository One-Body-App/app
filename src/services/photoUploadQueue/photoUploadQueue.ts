import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PendingPhotoUpload, PendingPhotoUploadStatus, PhotoUploadRecipe } from './types';

export const PHOTO_UPLOAD_QUEUE_STORAGE_KEY = 'photo-upload.pending.v1';
export const PHOTO_UPLOAD_MAX_RETRY_COUNT = 3;
export const PHOTO_UPLOAD_RETRY_BACKOFF_BASE_MS = process.env.JEST_WORKER_ID ? 5 : 5_000;
export const PHOTO_UPLOAD_RETRY_BACKOFF_MULTIPLIER = 2;
export const PHOTO_UPLOAD_RETRY_BACKOFF_MAX_MS = process.env.JEST_WORKER_ID ? 50 : 60_000;

const ACTIVE_PHOTO_STATUSES = new Set<PendingPhotoUploadStatus>([
  'queued',
  'moderating',
  'uploading',
]);

export type PhotoUploadResult = {
  postId?: string;
  pendingReview?: boolean;
};

export type PhotoUploadModerationOutcome = {
  blocked: boolean;
  reason?: string;
};

export type PhotoUploadQueueDependencies = {
  storage: Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;
  moderateRecipe: (recipe: PhotoUploadRecipe) => Promise<PhotoUploadModerationOutcome>;
  uploadRecipe: (recipe: PhotoUploadRecipe) => Promise<PhotoUploadResult>;
  now: () => string;
  scheduleRetry: (delayMs: number, callback: () => void) => () => void;
  log?: (message: string, payload?: Record<string, unknown>) => void;
};

export type PhotoUploadQueueListener = (items: PendingPhotoUpload[]) => void;

export type PhotoUploadEnqueueOptions = {
  startImmediately?: boolean;
};

export type PhotoUploadQueue = {
  hydrate: () => Promise<PendingPhotoUpload[]>;
  enqueue: (
    recipe: PhotoUploadRecipe,
    options?: PhotoUploadEnqueueOptions
  ) => Promise<PendingPhotoUpload>;
  drain: () => Promise<void>;
  resume: () => Promise<void>;
  getItems: () => PendingPhotoUpload[];
  waitForIdle: () => Promise<void>;
  subscribe: (listener: PhotoUploadQueueListener) => () => void;
};

const newId = (): string =>
  `pq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const cloneItems = (items: PendingPhotoUpload[]) => items.map((item) => ({ ...item }));

const normalizeOnHydrate = (item: PendingPhotoUpload): PendingPhotoUpload => {
  if (item.status === 'complete' || item.status === 'failed') {
    return item;
  }
  // Anything mid-flight at process exit gets sent back to the queued lane so
  // it picks up cleanly on the next drain.
  return { ...item, status: 'queued' };
};

const errorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Photo upload failed.';
};

export const createPhotoUploadQueue = (
  dependencies: PhotoUploadQueueDependencies
): PhotoUploadQueue => {
  let items: PendingPhotoUpload[] = [];
  let isHydrated = false;
  let isDraining = false;
  const listeners = new Set<PhotoUploadQueueListener>();
  const pendingRetries = new Set<() => void>();
  let idleResolvers: Array<() => void> = [];

  const log = (message: string, payload?: Record<string, unknown>) => {
    dependencies.log?.(message, payload);
  };

  const persist = async () => {
    try {
      await dependencies.storage.setItem(PHOTO_UPLOAD_QUEUE_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      log('photoUploadQueue:persist:error', { message: errorMessage(error) });
    }
  };

  const notify = () => {
    const snapshot = cloneItems(items);
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        log('photoUploadQueue:listener:error', { message: errorMessage(error) });
      }
    });
  };

  const resolveIdleIfQuiet = () => {
    // "Idle" means nothing is actively being processed. A pending retry counts
    // as scheduled-but-not-running, so it does not block idle; the host
    // (Composer / runtime host) can decide whether to await it.
    const hasActive = items.some(
      (item) =>
        ACTIVE_PHOTO_STATUSES.has(item.status) && !(item.status === 'queued' && item.nextRetryAt)
    );
    if (hasActive || isDraining) {
      return;
    }
    const resolvers = idleResolvers;
    idleResolvers = [];
    resolvers.forEach((resolve) => resolve());
  };

  const update = async (id: string, patch: Partial<PendingPhotoUpload>) => {
    items = items.map((item) =>
      item.id === id ? { ...item, ...patch, updatedAt: dependencies.now() } : item
    );
    await persist();
    notify();
  };

  const hydrate = async (): Promise<PendingPhotoUpload[]> => {
    if (isHydrated) {
      return cloneItems(items);
    }
    try {
      const raw = await dependencies.storage.getItem(PHOTO_UPLOAD_QUEUE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PendingPhotoUpload[];
        items = parsed.map(normalizeOnHydrate);
      }
    } catch (error) {
      log('photoUploadQueue:hydrate:error', { message: errorMessage(error) });
      items = [];
    }
    isHydrated = true;
    await persist();
    notify();
    return cloneItems(items);
  };

  const findActiveItem = (): PendingPhotoUpload | undefined =>
    // Skip items that are scheduled for a retry - their scheduled callback
    // will re-trigger a drain at the right time.
    items.find((item) => item.status === 'queued' && !item.nextRetryAt);

  const processItem = async (item: PendingPhotoUpload) => {
    await update(item.id, { status: 'moderating' });
    try {
      const moderation = await dependencies.moderateRecipe(item.recipe);
      if (moderation.blocked) {
        await update(item.id, {
          status: 'failed',
          failureReason: moderation.reason ?? 'moderation-blocked',
        });
        return;
      }
      await update(item.id, { status: 'uploading' });
      const result = await dependencies.uploadRecipe(item.recipe);
      await update(item.id, {
        status: 'complete',
        postId: result.postId,
        pendingReview: result.pendingReview,
      });
    } catch (error) {
      const current = items.find((entry) => entry.id === item.id);
      if (!current) {
        return;
      }
      const nextRetryCount = current.retryCount + 1;
      if (nextRetryCount >= PHOTO_UPLOAD_MAX_RETRY_COUNT) {
        await update(item.id, {
          status: 'failed',
          retryCount: nextRetryCount,
          failureReason: errorMessage(error),
        });
        return;
      }
      const backoff = Math.min(
        PHOTO_UPLOAD_RETRY_BACKOFF_BASE_MS *
          PHOTO_UPLOAD_RETRY_BACKOFF_MULTIPLIER ** current.retryCount,
        PHOTO_UPLOAD_RETRY_BACKOFF_MAX_MS
      );
      const nextRetryAt = new Date(Date.now() + backoff).toISOString();
      await update(item.id, {
        status: 'queued',
        retryCount: nextRetryCount,
        failureReason: errorMessage(error),
        nextRetryAt,
      });
      const cancel = dependencies.scheduleRetry(backoff, () => {
        pendingRetries.delete(cancel);
        // Clear nextRetryAt synchronously so the next drain picks the item up.
        items = items.map((entry) =>
          entry.id === item.id ? { ...entry, nextRetryAt: undefined } : entry
        );
        drain().catch(() => {});
      });
      pendingRetries.add(cancel);
    }
  };

  const drainNext = async (): Promise<void> => {
    const next = findActiveItem();
    if (!next) {
      return;
    }
    await processItem(next);
    return drainNext();
  };

  const drain = async (): Promise<void> => {
    if (isDraining) {
      return;
    }
    isDraining = true;
    try {
      await drainNext();
    } finally {
      isDraining = false;
      resolveIdleIfQuiet();
    }
  };

  const enqueue = async (
    recipe: PhotoUploadRecipe,
    options?: PhotoUploadEnqueueOptions
  ): Promise<PendingPhotoUpload> => {
    if (!isHydrated) {
      await hydrate();
    }
    const now = dependencies.now();
    const item: PendingPhotoUpload = {
      id: newId(),
      status: 'queued',
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
      recipe,
    };
    items = [...items, item];
    await persist();
    notify();
    if (options?.startImmediately !== false) {
      drain().catch((error) => {
        log('photoUploadQueue:drain:error', { message: errorMessage(error) });
      });
    }
    return { ...item };
  };

  const resume = async (): Promise<void> => {
    await hydrate();
    await drain();
  };

  const getItems = (): PendingPhotoUpload[] => cloneItems(items);

  const waitForIdle = (): Promise<void> =>
    new Promise((resolve) => {
      const hasActive = items.some(
        (item) =>
          ACTIVE_PHOTO_STATUSES.has(item.status) && !(item.status === 'queued' && item.nextRetryAt)
      );
      if (!hasActive && !isDraining) {
        resolve();
        return;
      }
      idleResolvers.push(resolve);
    });

  const subscribe = (listener: PhotoUploadQueueListener) => {
    listeners.add(listener);
    listener(cloneItems(items));
    return () => {
      listeners.delete(listener);
    };
  };

  return { hydrate, enqueue, drain, resume, getItems, waitForIdle, subscribe };
};

// Convenience singleton used by the Composer + the runtime host (T11/T17).
// Constructed lazily so AsyncStorage isn't touched at module-load time during
// Jest setup.
let cachedQueue: PhotoUploadQueue | null = null;
let cachedQueueFactory: (() => PhotoUploadQueue) | null = null;

export const setPhotoUploadQueueFactory = (factory: () => PhotoUploadQueue) => {
  cachedQueueFactory = factory;
  cachedQueue = null;
};

export const getPhotoUploadQueue = (): PhotoUploadQueue => {
  if (!cachedQueue) {
    if (!cachedQueueFactory) {
      throw new Error(
        'photoUploadQueue: no factory registered. Call setPhotoUploadQueueFactory at app boot.'
      );
    }
    cachedQueue = cachedQueueFactory();
  }
  return cachedQueue;
};
