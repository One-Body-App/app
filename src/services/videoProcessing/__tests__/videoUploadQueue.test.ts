import type { PendingVideoUpload, VideoEditRecipe } from '../types';
import {
  MAX_RETRY_COUNT,
  QueueError,
  VIDEO_UPLOAD_QUEUE_STORAGE_KEY,
  createVideoUploadQueue,
} from '../videoUploadQueue';

jest.mock('react-native-fs', () => ({
  TemporaryDirectoryPath: '/tmp',
  CachesDirectoryPath: '/tmp',
  readFile: jest.fn(async () => ''),
  unlink: jest.fn(async () => undefined),
  exists: jest.fn(async () => true),
  copyAssetsVideoIOS: jest.fn(async () => undefined),
}));

jest.mock('react-native-video-trim', () => ({
  __esModule: true,
  default: {},
  extractEditedFrames: jest.fn(async () => []),
  exportEditedVideo: jest.fn(async () => ({
    outputPath: 'file:///tmp/exported.mp4',
    duration: 20_000,
    width: 1080,
    height: 1920,
  })),
}));

const baseRecipe: VideoEditRecipe = {
  sourceUri: 'file:///tmp/source.mp4',
  caption: 'queued video',
  trimStartMs: 0,
  trimEndMs: 20_000,
  trimDurationMs: 20_000,
  ratioId: '9:16',
  cropRect: {
    x: 100,
    y: 200,
    width: 800,
    height: 1400,
  },
  transform: {
    scale: 1,
    translateX: 0,
    translateY: 0,
  },
  sourceWidth: 1080,
  sourceHeight: 1920,
  outputWidth: 1080,
  outputHeight: 1920,
  videoBitrate: 5_000_000,
  audioBitrate: 128_000,
};

const createMemoryStorage = (seed?: PendingVideoUpload[]) => {
  const values = new Map<string, string>();
  if (seed) {
    values.set(VIDEO_UPLOAD_QUEUE_STORAGE_KEY, JSON.stringify(seed));
  }

  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
};

describe('videoUploadQueue', () => {
  it('moves a queued item through moderation, compression, upload, and posting', async () => {
    const events: string[] = [];
    const storage = createMemoryStorage();
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      moderateVideo: jest.fn(async () => {
        events.push('moderating');
        return { moderationDecision: 'safe', moderationScores: null };
      }),
      exportVideo: jest.fn(async () => {
        events.push('compressing');
        return {
          processedVideoUri: 'file:///tmp/exported.mp4',
          processedDuration: 12_000,
          processedWidth: 1080,
          processedHeight: 1920,
        };
      }),
      uploadVideo: jest.fn(async () => {
        events.push('uploading');
        return 'mux_upload_1';
      }),
      createWatchPost: jest.fn(async () => {
        events.push('posting');
      }),
      now: jest
        .fn()
        .mockReturnValueOnce('2026-03-07T10:00:00.000Z')
        .mockReturnValue('2026-03-07T10:00:01.000Z'),
      log: jest.fn(),
    });

    const item = await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(item.status).toBe('queued');
    expect(events).toEqual(['moderating', 'compressing', 'uploading', 'posting']);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        id: item.id,
        status: 'complete',
        uploadId: 'mux_upload_1',
        processedVideoUri: 'file:///tmp/exported.mp4',
      }),
    ]);
  });

  it('retries retryable upload failures and completes when a later retry succeeds', async () => {
    const storage = createMemoryStorage();
    let uploadAttempts = 0;
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe',
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => {
        uploadAttempts += 1;
        if (uploadAttempts < 3) {
          throw new QueueError('network', 'temporary upload failure', true);
        }
        return 'mux_upload_retry';
      }),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(uploadAttempts).toBe(3);
    expect(result.status).toBe('complete');
    expect(result.retryCount).toBe(2);
  });

  it('marks blocked videos as failed without retrying processing', async () => {
    const storage = createMemoryStorage();
    const exportVideo = jest.fn(async () => ({
      processedVideoUri: 'file:///tmp/exported.mp4',
      processedDuration: 20_000,
      processedWidth: 1080,
      processedHeight: 1920,
    }));
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'blocked',
        moderationScores: {
          neutral: 0,
          drawing: 0,
          sexy: 0.97,
          porn: 0.12,
          hentai: 0.08,
        },
      })),
      exportVideo,
      uploadVideo: jest.fn(async () => 'mux_upload_blocked'),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(result.status).toBe('failed');
    expect(result.failureCode).toBe('nsfw-blocked');
    expect(exportVideo).not.toHaveBeenCalled();
  });

  it('resumes in-progress items and continues from preserved work', async () => {
    const seed: PendingVideoUpload[] = [
      {
        id: 'resume-item',
        status: 'posting',
        retryCount: 0,
        createdAt: '2026-03-07T10:00:00.000Z',
        updatedAt: '2026-03-07T10:00:00.000Z',
        recipe: baseRecipe,
        moderationDecision: 'safe',
        moderationScores: null,
        processedVideoUri: 'file:///tmp/exported.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
        uploadId: 'mux_upload_resume',
      },
    ];
    const storage = createMemoryStorage(seed);
    const moderateVideo = jest.fn(async () => ({
      moderationDecision: 'safe',
      moderationScores: null,
    }));
    const exportVideo = jest.fn(async () => ({
      processedVideoUri: 'file:///tmp/exported.mp4',
      processedDuration: 20_000,
      processedWidth: 1080,
      processedHeight: 1920,
    }));
    const uploadVideo = jest.fn(async () => 'mux_upload_resume');
    const createWatchPost = jest.fn(async () => undefined);
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      moderateVideo,
      exportVideo,
      uploadVideo,
      createWatchPost,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.resume();
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(result.status).toBe('complete');
    expect(moderateVideo).not.toHaveBeenCalled();
    expect(exportVideo).not.toHaveBeenCalled();
    expect(uploadVideo).not.toHaveBeenCalled();
    expect(createWatchPost).toHaveBeenCalledTimes(1);
  });

  it('stops retrying after the configured retry limit', async () => {
    const storage = createMemoryStorage();
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe',
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => {
        throw new QueueError('network', 'still failing', true);
      }),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(result.status).toBe('failed');
    expect(result.retryCount).toBe(MAX_RETRY_COUNT + 1);
  });

  it('fails invalid trim settings before moderation starts', async () => {
    const storage = createMemoryStorage();
    const moderateVideo = jest.fn(async () => ({
      moderationDecision: 'safe' as const,
      moderationScores: null,
    }));
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      moderateVideo,
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => 'mux_upload_invalid_trim'),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue({
      ...baseRecipe,
      trimStartMs: 10_000,
      trimEndMs: 10_000,
      trimDurationMs: 0,
    });
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(result.status).toBe('failed');
    expect(result.failureCode).toBe('invalid-edit');
    expect(moderateVideo).not.toHaveBeenCalled();
  });
});
