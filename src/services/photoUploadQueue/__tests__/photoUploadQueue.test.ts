import {
  PHOTO_UPLOAD_MAX_RETRY_COUNT,
  PHOTO_UPLOAD_QUEUE_STORAGE_KEY,
  createPhotoUploadQueue,
  type PhotoUploadQueueDependencies,
} from '../photoUploadQueue';
import type { PhotoUploadRecipe } from '../types';

const baseRecipe = (): PhotoUploadRecipe => ({
  media: [
    {
      uri: 'file:///tmp/a.jpg',
      fileName: 'a.jpg',
      type: 'image/jpeg',
    },
  ],
  caption: 'A peaceful moment.',
  mentionedUserIds: [],
  mentions: [],
  audience: 'everyone',
});

type StorageStub = ReturnType<typeof createStorageStub>;

const createStorageStub = () => {
  let value: string | null = null;
  return {
    getItem: jest.fn(async (key: string) => {
      if (key !== PHOTO_UPLOAD_QUEUE_STORAGE_KEY) return null;
      return value;
    }),
    setItem: jest.fn(async (key: string, raw: string) => {
      if (key === PHOTO_UPLOAD_QUEUE_STORAGE_KEY) value = raw;
    }),
    seed: (entries: unknown) => {
      value = JSON.stringify(entries);
    },
    raw: () => value,
  };
};

type QueueWithStorage = {
  queue: ReturnType<typeof createPhotoUploadQueue>;
  storage: StorageStub;
  moderateRecipe: jest.Mock;
  uploadRecipe: jest.Mock;
  scheduleRetry: jest.Mock;
};

const setupQueue = (
  overrides: Partial<PhotoUploadQueueDependencies> = {}
): QueueWithStorage => {
  const storage = createStorageStub();
  const moderateRecipe = jest.fn(async () => ({ blocked: false }));
  const uploadRecipe = jest.fn(async () => ({ postId: 'p_1' }));
  const scheduledCallbacks: Array<() => void> = [];
  const scheduleRetry = jest.fn((_delay: number, callback: () => void) => {
    scheduledCallbacks.push(callback);
    return () => {
      const index = scheduledCallbacks.indexOf(callback);
      if (index !== -1) scheduledCallbacks.splice(index, 1);
    };
  });

  const queue = createPhotoUploadQueue({
    storage,
    moderateRecipe,
    uploadRecipe,
    now: () => '2026-05-28T00:00:00.000Z',
    scheduleRetry,
    ...overrides,
  });

  return { queue, storage, moderateRecipe, uploadRecipe, scheduleRetry };
};

describe('photoUploadQueue', () => {
  it('happy path: moderation -> upload -> complete', async () => {
    const { queue, uploadRecipe, moderateRecipe } = setupQueue();
    const item = await queue.enqueue(baseRecipe());
    await queue.waitForIdle();
    expect(moderateRecipe).toHaveBeenCalledTimes(1);
    expect(uploadRecipe).toHaveBeenCalledTimes(1);
    const stored = queue.getItems().find((entry) => entry.id === item.id);
    expect(stored?.status).toBe('complete');
    expect(stored?.postId).toBe('p_1');
  });

  it('persists items to storage on every transition', async () => {
    const { queue, storage } = setupQueue();
    await queue.enqueue(baseRecipe());
    await queue.waitForIdle();
    const persisted = JSON.parse(storage.raw() ?? '[]');
    expect(persisted).toHaveLength(1);
    expect(persisted[0].status).toBe('complete');
  });

  it('marks failed when moderation blocks the recipe', async () => {
    const { queue } = setupQueue({
      moderateRecipe: jest.fn(async () => ({ blocked: true, reason: 'sexual-content' })),
    });
    await queue.enqueue(baseRecipe());
    await queue.waitForIdle();
    const [item] = queue.getItems();
    expect(item.status).toBe('failed');
    expect(item.failureReason).toBe('sexual-content');
  });

  it('retries upload errors with exponential backoff up to MAX_RETRY_COUNT', async () => {
    const callbacks: Array<() => void> = [];
    let uploadCalls = 0;
    const upload = jest.fn(async () => {
      uploadCalls += 1;
      if (uploadCalls < PHOTO_UPLOAD_MAX_RETRY_COUNT) {
        throw new Error('transient-network');
      }
      return { postId: 'p_retry' };
    });
    const scheduleRetry = jest.fn((_delay: number, callback: () => void) => {
      callbacks.push(callback);
      return () => undefined;
    });

    const { queue } = setupQueue({ uploadRecipe: upload, scheduleRetry });

    await queue.enqueue(baseRecipe());
    await queue.waitForIdle();
    expect(scheduleRetry).toHaveBeenCalledTimes(1);
    callbacks[0]();
    await queue.waitForIdle();
    expect(scheduleRetry).toHaveBeenCalledTimes(2);
    callbacks[1]();
    await queue.waitForIdle();
    const [item] = queue.getItems();
    expect(item.status).toBe('complete');
    expect(upload).toHaveBeenCalledTimes(PHOTO_UPLOAD_MAX_RETRY_COUNT);
  });

  it('terminates as failed after exhausting retries', async () => {
    const callbacks: Array<() => void> = [];
    const upload = jest.fn(async () => {
      throw new Error('boom');
    });
    const scheduleRetry = jest.fn((_delay: number, callback: () => void) => {
      callbacks.push(callback);
      return () => undefined;
    });

    const { queue } = setupQueue({ uploadRecipe: upload, scheduleRetry });

    await queue.enqueue(baseRecipe());
    await queue.waitForIdle();
    while (callbacks.length > 0) {
      const callback = callbacks.shift();
      callback?.();
      // eslint-disable-next-line no-await-in-loop
      await queue.waitForIdle();
    }
    const [item] = queue.getItems();
    expect(item.status).toBe('failed');
    expect(item.retryCount).toBe(PHOTO_UPLOAD_MAX_RETRY_COUNT);
  });

  it('hydrate brings in-flight items back to queued state', async () => {
    const { queue, storage } = setupQueue();
    storage.seed([
      {
        id: 'pq_stale',
        status: 'uploading',
        retryCount: 0,
        createdAt: '2026-05-27T00:00:00.000Z',
        updatedAt: '2026-05-27T00:00:00.000Z',
        recipe: baseRecipe(),
      },
    ]);
    const restored = await queue.hydrate();
    expect(restored[0].status).toBe('queued');
  });

  it('preserves complete/failed terminal statuses across hydrate', async () => {
    const { queue, storage } = setupQueue();
    storage.seed([
      {
        id: 'pq_done',
        status: 'complete',
        retryCount: 0,
        createdAt: '2026-05-27T00:00:00.000Z',
        updatedAt: '2026-05-27T00:00:00.000Z',
        recipe: baseRecipe(),
      },
      {
        id: 'pq_dead',
        status: 'failed',
        retryCount: PHOTO_UPLOAD_MAX_RETRY_COUNT,
        createdAt: '2026-05-27T00:00:00.000Z',
        updatedAt: '2026-05-27T00:00:00.000Z',
        recipe: baseRecipe(),
      },
    ]);
    const restored = await queue.hydrate();
    expect(restored.map((item) => item.status)).toEqual(['complete', 'failed']);
  });

  it('subscribers receive snapshots on every state change', async () => {
    const { queue } = setupQueue();
    const listener = jest.fn();
    queue.subscribe(listener);
    await queue.enqueue(baseRecipe());
    await queue.waitForIdle();
    // First call: initial snapshot from subscribe(); then each transition.
    expect(listener.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
