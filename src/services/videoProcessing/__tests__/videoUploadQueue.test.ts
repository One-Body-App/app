import type { PendingVideoUpload, VideoEditRecipe } from '../types';
import {
  MAX_RETRY_COUNT,
  QueueError,
  VIDEO_UPLOAD_QUEUE_STORAGE_KEY,
  createVideoUploadQueue,
} from '../videoUploadQueue';
import { ApiCall } from '@/src/services/api';

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

jest.mock('@/src/services/api', () => ({
  ApiCall: jest.fn(),
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

const createDeleteFile = () => jest.fn(async () => undefined);
const createUploadedResult = (uploadId: string) => ({
  uploadId,
  uploadTransport: 'raw_put_fallback' as const,
});

describe('videoUploadQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('moves a queued item through moderation, compression, upload, and posting', async () => {
    const events: string[] = [];
    const storage = createMemoryStorage();
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
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
        return createUploadedResult('mux_upload_1');
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
        watchProcessingStatus: 'READY',
        uploadId: 'mux_upload_1',
        processedVideoUri: 'file:///tmp/exported.mp4',
      }),
    ]);
  });

  it('waits for backend READY before completing remotely processed uploads', async () => {
    const storage = createMemoryStorage();
    const getWatchPostStatus = jest
      .fn()
      .mockResolvedValueOnce({
        _id: 'watch-remote-1',
        processingStatus: 'PROCESSING',
      })
      .mockResolvedValueOnce({
        _id: 'watch-remote-1',
        playBackId: 'playback-remote-1',
        processingStatus: 'READY',
      });
    const transitions: PendingVideoUpload['status'][] = [];
    let lastStatus: PendingVideoUpload['status'] | undefined;
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe',
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-remote.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_remote')),
      createWatchPost: jest.fn(async () => ({
        _id: 'watch-remote-1',
        processingStatus: 'PROCESSING',
      })),
      getWatchPostStatus,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    const unsubscribe = queue.subscribe((items) => {
      const status = items[0]?.status;
      if (!status || status === lastStatus) {
        return;
      }
      lastStatus = status;
      transitions.push(status);
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();
    unsubscribe();

    expect(transitions).toEqual([
      'queued',
      'moderating',
      'compressing',
      'uploading',
      'posting',
      'processing_remote',
      'complete',
    ]);
    expect(getWatchPostStatus).toHaveBeenCalledTimes(2);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        watchId: 'watch-remote-1',
        watchProcessingStatus: 'READY',
      }),
    ]);
  });

  it('treats a 201 watch post response as a successful create', async () => {
    const storage = createMemoryStorage();
    const apiCallMock = ApiCall as jest.MockedFunction<typeof ApiCall>;
    apiCallMock.mockResolvedValue({
      status: 201,
      response: {
        _id: 'watch-created-201',
        playBackId: 'playback-created-201',
        processingStatus: 'READY',
      },
    } as any);

    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe',
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-created-201.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_created_201')),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(apiCallMock).toHaveBeenCalledWith(
      expect.objectContaining({
        route: 'watch/post',
        verb: 'post',
      })
    );
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        watchId: 'watch-created-201',
        watchProcessingStatus: 'READY',
        uploadId: 'mux_upload_created_201',
      }),
    ]);
  });

  it('can enqueue without starting processing until explicitly started', async () => {
    const storage = createMemoryStorage();
    const moderateVideo = jest.fn(async () => ({
      moderationDecision: 'safe' as const,
      moderationScores: null,
    }));
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo,
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_delayed')),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    const item = await queue.enqueue(baseRecipe, { startImmediately: false });

    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        id: item.id,
        status: 'queued',
      }),
    ]);
    expect(moderateVideo).not.toHaveBeenCalled();

    await queue.start();
    await queue.waitForIdle();

    expect(moderateVideo).toHaveBeenCalledTimes(1);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        id: item.id,
        status: 'complete',
      }),
    ]);
  });

  it('notifies subscribers when the item moves through terminal queue states', async () => {
    const storage = createMemoryStorage();
    const transitions: PendingVideoUpload['status'][] = [];
    let lastStatus: PendingVideoUpload['status'] | undefined;
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe',
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_subscriber')),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    const unsubscribe = queue.subscribe((items) => {
      const status = items[0]?.status;
      if (!status || status === lastStatus) {
        return;
      }
      lastStatus = status;
      transitions.push(status);
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();
    unsubscribe();

    expect(transitions).toEqual([
      'queued',
      'moderating',
      'compressing',
      'uploading',
      'posting',
      'complete',
    ]);
  });

  it('retries retryable upload failures and completes when a later retry succeeds', async () => {
    const storage = createMemoryStorage();
    let uploadAttempts = 0;
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
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
        return createUploadedResult('mux_upload_retry');
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
      deleteFile: createDeleteFile(),
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
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_blocked')),
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
    const uploadVideo = jest.fn(async () => createUploadedResult('mux_upload_resume'));
    const createWatchPost = jest.fn(async () => undefined);
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
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

  it('resumes remote-processing items by polling status instead of re-uploading', async () => {
    const seed: PendingVideoUpload[] = [
      {
        id: 'resume-remote-item',
        status: 'processing_remote',
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
        uploadId: 'mux_upload_resume_remote',
        watchId: 'watch-resume-remote',
        watchProcessingStatus: 'PROCESSING',
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
    const uploadVideo = jest.fn(async () => createUploadedResult('mux_upload_resume_remote'));
    const createWatchPost = jest.fn(async () => undefined);
    const getWatchPostStatus = jest.fn(async () => ({
      _id: 'watch-resume-remote',
      playBackId: 'playback-resume-remote',
      processingStatus: 'READY' as const,
    }));
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo,
      exportVideo,
      uploadVideo,
      createWatchPost,
      getWatchPostStatus,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.resume();
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(result.status).toBe('complete');
    expect(result.watchProcessingStatus).toBe('READY');
    expect(moderateVideo).not.toHaveBeenCalled();
    expect(exportVideo).not.toHaveBeenCalled();
    expect(uploadVideo).not.toHaveBeenCalled();
    expect(createWatchPost).not.toHaveBeenCalled();
    expect(getWatchPostStatus).toHaveBeenCalledTimes(1);
  });

  it('prioritizes newly queued uploads before continuing remote-processing polls', async () => {
    const seed: PendingVideoUpload[] = [
      {
        id: 'remote-first',
        status: 'processing_remote',
        retryCount: 0,
        createdAt: '2026-03-07T10:00:00.000Z',
        updatedAt: '2026-03-07T10:00:00.000Z',
        recipe: baseRecipe,
        moderationDecision: 'safe',
        moderationScores: null,
        processedVideoUri: 'file:///tmp/exported-remote-first.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
        uploadId: 'mux_upload_remote_first',
        watchId: 'watch-remote-first',
        watchProcessingStatus: 'PROCESSING',
      },
      {
        id: 'queued-second',
        status: 'queued',
        retryCount: 0,
        createdAt: '2026-03-07T10:00:00.000Z',
        updatedAt: '2026-03-07T10:00:00.000Z',
        recipe: {
          ...baseRecipe,
          sourceUri: 'file:///tmp/source-second.mp4',
        },
      },
    ];
    const storage = createMemoryStorage(seed);
    const events: string[] = [];
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async (recipe) => {
        events.push(`moderate:${recipe.sourceUri}`);
        return {
          moderationDecision: 'safe',
          moderationScores: null,
        };
      }),
      exportVideo: jest.fn(async (recipe) => {
        events.push(`export:${recipe.sourceUri}`);
        return {
          processedVideoUri: `file:///tmp/${recipe.sourceUri.includes('second') ? 'queued-second' : 'other'}.mp4`,
          processedDuration: 12_000,
          processedWidth: 1080,
          processedHeight: 1920,
        };
      }),
      uploadVideo: jest.fn(async () => {
        events.push('upload:queued-second');
        return createUploadedResult('mux_upload_queued_second');
      }),
      createWatchPost: jest.fn(async (item) => {
        events.push(`post:${item.id}`);
        return {
          _id: item.id === 'queued-second' ? 'watch-queued-second' : 'watch-unknown',
          processingStatus: item.id === 'queued-second' ? 'READY' : 'PROCESSING',
        };
      }),
      getWatchPostStatus: jest
        .fn()
        .mockImplementationOnce(async () => {
          events.push('poll:remote-first');
          return {
            _id: 'watch-remote-first',
            processingStatus: 'PROCESSING',
          };
        })
        .mockImplementationOnce(async () => {
          events.push('poll:remote-first-ready');
          return {
            _id: 'watch-remote-first',
            playBackId: 'playback-remote-first',
            processingStatus: 'READY',
          };
        }),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.resume();
    await queue.waitForIdle();

    expect(events).toEqual([
      'moderate:file:///tmp/source-second.mp4',
      'export:file:///tmp/source-second.mp4',
      'upload:queued-second',
      'post:queued-second',
      'poll:remote-first',
      'poll:remote-first-ready',
    ]);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        id: 'remote-first',
        status: 'complete',
        watchProcessingStatus: 'READY',
      }),
      expect.objectContaining({
        id: 'queued-second',
        status: 'complete',
        watchProcessingStatus: 'READY',
      }),
    ]);
  });

  it('stops retrying after the configured retry limit', async () => {
    const storage = createMemoryStorage();
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
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
      deleteFile: createDeleteFile(),
      moderateVideo,
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_invalid_trim')),
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

  it('fails locally when export dimensions are invalid before upload', async () => {
    const storage = createMemoryStorage();
    const uploadVideo = jest.fn(async () => createUploadedResult('mux_upload_invalid_dimensions'));
    const createWatchPost = jest.fn(async () => undefined);
    const deleteFile = createDeleteFile();
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile,
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe',
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-invalid-dimensions.mp4',
        processedDuration: 20_000,
        processedWidth: 0,
        processedHeight: 1920,
      })),
      uploadVideo,
      createWatchPost,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(result.status).toBe('failed');
    expect(result.failureCode).toBe('processing');
    expect(uploadVideo).not.toHaveBeenCalled();
    expect(createWatchPost).not.toHaveBeenCalled();
    expect(deleteFile).toHaveBeenCalledWith('file:///tmp/exported-invalid-dimensions.mp4');
  });

  it('notifies subscribers when processing fails before upload', async () => {
    const storage = createMemoryStorage();
    const transitions: PendingVideoUpload['status'][] = [];
    let lastStatus: PendingVideoUpload['status'] | undefined;
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe',
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => {
        throw new Error('Command failed with state COMPLETED and rc 1.');
      }),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_never_called')),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    const unsubscribe = queue.subscribe((items) => {
      const status = items[0]?.status;
      if (!status || status === lastStatus) {
        return;
      }
      lastStatus = status;
      transitions.push(status);
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();
    unsubscribe();

    expect(transitions).toEqual(['queued', 'moderating', 'compressing', 'failed']);
    expect(queue.getItems()[0]).toEqual(
      expect.objectContaining({
        status: 'failed',
        failureCode: 'processing',
      })
    );
  });

  it('fails locally when export duration exceeds the selected trim tolerance', async () => {
    const storage = createMemoryStorage();
    const uploadVideo = jest.fn(async () => createUploadedResult('mux_upload_invalid_duration'));
    const createWatchPost = jest.fn(async () => undefined);
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe',
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-invalid-duration.mp4',
        processedDuration: 20_500,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo,
      createWatchPost,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(result.status).toBe('failed');
    expect(result.failureCode).toBe('processing');
    expect(uploadVideo).not.toHaveBeenCalled();
    expect(createWatchPost).not.toHaveBeenCalled();
  });

  it('fails locally when export aspect ratio does not match the selected watch ratio', async () => {
    const storage = createMemoryStorage();
    const uploadVideo = jest.fn(async () =>
      createUploadedResult('mux_upload_invalid_aspect_ratio')
    );
    const createWatchPost = jest.fn(async () => undefined);
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe',
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-invalid-ratio.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1080,
      })),
      uploadVideo,
      createWatchPost,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(result.status).toBe('failed');
    expect(result.failureCode).toBe('processing');
    expect(uploadVideo).not.toHaveBeenCalled();
    expect(createWatchPost).not.toHaveBeenCalled();
  });

  it('stops unclassified videos before upload or post creation', async () => {
    const storage = createMemoryStorage();
    const exportVideo = jest.fn(async () => ({
      processedVideoUri: 'file:///tmp/exported.mp4',
      processedDuration: 20_000,
      processedWidth: 1080,
      processedHeight: 1920,
    }));
    const uploadVideo = jest.fn(async () => createUploadedResult('mux_upload_unclassified'));
    const createWatchPost = jest.fn(async () => undefined);
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'unclassified',
        moderationScores: null,
        moderationError: 'bridge-unavailable',
      })),
      exportVideo,
      uploadVideo,
      createWatchPost,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(result.status).toBe('failed');
    expect(result.failureCode).toBe('moderation-failed');
    expect(exportVideo).not.toHaveBeenCalled();
    expect(uploadVideo).not.toHaveBeenCalled();
    expect(createWatchPost).not.toHaveBeenCalled();
  });

  it('stops locally when moderation throws before server calls', async () => {
    const storage = createMemoryStorage();
    const uploadVideo = jest.fn(async () => createUploadedResult('mux_upload_runtime_failure'));
    const createWatchPost = jest.fn(async () => undefined);
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => {
        throw new Error('bridge crashed');
      }),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo,
      createWatchPost,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    const [result] = queue.getItems();
    expect(result.status).toBe('failed');
    expect(result.failureCode).toBe('moderation-failed');
    expect(uploadVideo).not.toHaveBeenCalled();
    expect(createWatchPost).not.toHaveBeenCalled();
  });

  it('removes processed temp video after successful posting', async () => {
    const storage = createMemoryStorage();
    const deleteFile = createDeleteFile();
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile,
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe',
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-success.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_cleanup')),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(deleteFile).toHaveBeenCalledWith('file:///tmp/exported-success.mp4');
  });

  it('drops completed items from persisted storage during hydrate', async () => {
    const deleteFile = createDeleteFile();
    const seed: PendingVideoUpload[] = [
      {
        id: 'completed-item',
        status: 'complete',
        retryCount: 0,
        createdAt: '2026-03-07T10:00:00.000Z',
        updatedAt: '2026-03-07T10:00:00.000Z',
        recipe: baseRecipe,
        processedVideoUri: 'file:///tmp/completed.mp4',
      },
      {
        id: 'queued-item',
        status: 'queued',
        retryCount: 0,
        createdAt: '2026-03-07T10:00:00.000Z',
        updatedAt: '2026-03-07T10:00:00.000Z',
        recipe: baseRecipe,
      },
    ];
    const storage = createMemoryStorage(seed);
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile,
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
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_resume')),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    const hydrated = await queue.hydrate();

    expect(hydrated).toEqual([
      expect.objectContaining({
        id: 'queued-item',
        status: 'queued',
      }),
    ]);
    expect(deleteFile).toHaveBeenCalledWith('file:///tmp/completed.mp4');
    const lastPersistedValue = storage.setItem.mock.calls[storage.setItem.mock.calls.length - 1][1];
    expect(JSON.parse(lastPersistedValue)).toEqual([
      expect.objectContaining({
        id: 'queued-item',
        status: 'queued',
      }),
    ]);
  });
});
