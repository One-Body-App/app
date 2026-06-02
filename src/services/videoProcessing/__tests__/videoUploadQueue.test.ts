import type { PendingVideoUpload, VideoEditRecipe } from '../types';
import { NativeMuxDirectUploadError } from '../muxDirectUploadBridge';
import {
  MISSING_VIDEO_TRACK_GRACE_MS,
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

jest.mock('@/src/services/notification/taggedNotificationDispatch', () => ({
  queueTaggedNotificationDemo: jest.fn(async () => undefined),
}));

jest.mock('@/src/services/moderation/clientModeration', () => ({
  buildImageDataUri: jest.fn(async () => 'data:image/jpeg;base64,frame'),
  callBackendFallbackModeration: jest.fn(async () => ({
    finalAction: 'allow',
    provider: 'openai',
    flagged: false,
    model: 'omni-moderation-latest',
    results: [],
    matchedCategories: [],
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
        return { moderationDecision: 'safe' as const, moderationScores: null };
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
        processingStatus: 'PROCESSING' as const,
      })
      .mockResolvedValueOnce({
        _id: 'watch-remote-1',
        playBackId: 'playback-remote-1',
        processingStatus: 'READY' as const,
      });
    const transitions: PendingVideoUpload['status'][] = [];
    let lastStatus: PendingVideoUpload['status'] | undefined;
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
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
        processingStatus: 'PROCESSING' as const,
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

  it('treats a generic failed sync during create as pending when a watch id exists', async () => {
    const storage = createMemoryStorage();
    const transitions: PendingVideoUpload['status'][] = [];
    let lastStatus: PendingVideoUpload['status'] | undefined;
    const getWatchPostStatus = jest.fn().mockResolvedValue({
      _id: 'watch-pending-sync-1',
      playBackId: 'playback-pending-sync-1',
      processingStatus: 'READY' as const,
    });
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-pending-sync.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_pending_sync')),
      createWatchPost: jest.fn(async () => ({
        _id: 'watch-pending-sync-1',
        processingStatus: 'FAILED_SYNC' as const,
        message: 'Mux is still preparing playback.',
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
    expect(getWatchPostStatus).toHaveBeenCalledTimes(1);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        watchId: 'watch-pending-sync-1',
        watchProcessingStatus: 'READY',
      }),
    ]);
  });

  it('treats a missing video track during create as pending within the grace window', async () => {
    const storage = createMemoryStorage();
    const log = jest.fn();
    const getWatchPostStatus = jest.fn().mockResolvedValue({
      _id: 'watch-missing-track-create-1',
      playBackId: 'playback-missing-track-create-1',
      processingStatus: 'READY' as const,
    });
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-missing-track-create.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_missing_track_create')),
      createWatchPost: jest.fn(async () => ({
        _id: 'watch-missing-track-create-1',
        processingStatus: 'FAILED_SYNC' as const,
        syncFailureReason: 'missing_video_track',
        message: 'Mux did not produce a playable video track for this Watch upload.',
      })),
      getWatchPostStatus,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log,
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(getWatchPostStatus).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      'watch-post-response',
      expect.objectContaining({
        syncFailureReason: 'missing_video_track',
        remoteProcessingAgeMs: 0,
        disposition: 'grace_period_pending_sync_failure',
        downgradedByMissingVideoTrackGrace: true,
      })
    );
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        watchId: 'watch-missing-track-create-1',
        watchProcessingStatus: 'READY',
      }),
    ]);
  });

  it('keeps polling generic failed sync statuses until a playback id is available', async () => {
    const storage = createMemoryStorage();
    const getWatchPostStatus = jest
      .fn()
      .mockResolvedValueOnce({
        _id: 'watch-generic-sync-1',
        processingStatus: 'FAILED_SYNC' as const,
        message: 'Mux is still preparing playback.',
      })
      .mockResolvedValueOnce({
        _id: 'watch-generic-sync-1',
        processingStatus: 'FAILED_SYNC' as const,
        message: 'Mux is still preparing playback.',
      })
      .mockResolvedValueOnce({
        _id: 'watch-generic-sync-1',
        playBackId: 'playback-generic-sync-1',
        processingStatus: 'READY' as const,
      });
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-generic-sync.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_generic_sync')),
      createWatchPost: jest.fn(async () => ({
        _id: 'watch-generic-sync-1',
        processingStatus: 'PROCESSING' as const,
      })),
      getWatchPostStatus,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(getWatchPostStatus).toHaveBeenCalledTimes(3);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        watchId: 'watch-generic-sync-1',
        watchProcessingStatus: 'READY',
      }),
    ]);
  });

  it('keeps polling missing video track statuses within the grace window until playback is ready', async () => {
    const storage = createMemoryStorage();
    const log = jest.fn();
    const getWatchPostStatus = jest
      .fn()
      .mockResolvedValueOnce({
        _id: 'watch-missing-track-grace-1',
        processingStatus: 'FAILED_SYNC' as const,
        syncFailureReason: 'missing_video_track',
        message: 'Mux did not produce a playable video track for this Watch upload.',
      })
      .mockResolvedValueOnce({
        _id: 'watch-missing-track-grace-1',
        processingStatus: 'FAILED_SYNC' as const,
        syncFailureReason: 'missing_video_track',
        message: 'Mux did not produce a playable video track for this Watch upload.',
      })
      .mockResolvedValueOnce({
        _id: 'watch-missing-track-grace-1',
        playBackId: 'playback-missing-track-grace-1',
        processingStatus: 'READY' as const,
      });
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-missing-track-grace.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_missing_track_grace')),
      createWatchPost: jest.fn(async () => ({
        _id: 'watch-missing-track-grace-1',
        processingStatus: 'PROCESSING' as const,
      })),
      getWatchPostStatus,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:30.000Z'),
      log,
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(getWatchPostStatus).toHaveBeenCalledTimes(3);
    expect(log).toHaveBeenCalledWith(
      'watch-status-response',
      expect.objectContaining({
        syncFailureReason: 'missing_video_track',
        disposition: 'grace_period_pending_sync_failure',
        downgradedByMissingVideoTrackGrace: true,
        remoteProcessingAgeMs: expect.any(Number),
      })
    );
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        watchId: 'watch-missing-track-grace-1',
        watchProcessingStatus: 'READY',
      }),
    ]);
  });

  it('fails when missing video track persists after the grace window', async () => {
    const seed: PendingVideoUpload[] = [
      {
        id: 'watch-missing-track-expired',
        status: 'processing_remote',
        retryCount: 0,
        createdAt: '2026-03-07T10:00:00.000Z',
        updatedAt: '2026-03-07T10:00:00.000Z',
        recipe: baseRecipe,
        moderationDecision: 'unsure' as const,
        moderationScores: null,
        moderationError: 'device-video-moderation-bypassed',
        processedVideoUri: 'file:///tmp/exported-missing-track-expired.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
        uploadId: 'mux_upload_missing_track_expired',
        watchId: 'watch-missing-track-expired',
        watchProcessingStatus: 'FAILED_SYNC',
        remotePollStartedAt: '2026-03-07T10:00:00.000Z',
        nextRemotePollAt: '2026-03-07T10:00:00.000Z',
      },
    ];
    const storage = createMemoryStorage(seed);
    const log = jest.fn();
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-missing-track-expired.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_missing_track_expired')),
      getWatchPostStatus: jest.fn(async () => ({
        _id: 'watch-missing-track-expired',
        processingStatus: 'FAILED_SYNC' as const,
        syncFailureReason: 'missing_video_track',
        message: 'Mux did not produce a playable video track for this Watch upload.',
      })),
      now: jest
        .fn()
        .mockReturnValue(
          new Date(
            Date.parse('2026-03-07T10:00:00.000Z') + MISSING_VIDEO_TRACK_GRACE_MS + 1000
          ).toISOString()
        ),
      log,
    });

    await queue.resume();
    await queue.waitForIdle();

    expect(log).toHaveBeenCalledWith(
      'watch-status-response',
      expect.objectContaining({
        syncFailureReason: 'missing_video_track',
        disposition: 'terminal_sync_failure',
        downgradedByMissingVideoTrackGrace: false,
        remoteProcessingAgeMs: MISSING_VIDEO_TRACK_GRACE_MS + 1000,
      })
    );
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'failed',
        failureCode: 'processing',
        lastError: 'Mux did not produce a playable video track for this Watch upload.',
      }),
    ]);
  });

  it('fails immediately when watch status returns a definitive mux sync failure', async () => {
    const storage = createMemoryStorage();
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-terminal-sync.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_terminal_sync')),
      createWatchPost: jest.fn(async () => ({
        _id: 'watch-terminal-sync-1',
        processingStatus: 'PROCESSING' as const,
      })),
      getWatchPostStatus: jest.fn(async () => ({
        _id: 'watch-terminal-sync-1',
        processingStatus: 'FAILED_SYNC' as const,
        syncFailureReason: 'invalid_duration',
        message: 'This Watch upload has an invalid duration.',
      })),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'failed',
        failureCode: 'processing',
        lastError: 'This Watch upload has an invalid duration.',
      }),
    ]);
  });

  it('completes and marks the upload as submitted for review when watch status returns a review failure', async () => {
    const storage = createMemoryStorage();
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-review-failed.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_review_failed')),
      createWatchPost: jest.fn(async () => ({
        _id: 'watch-review-failed-1',
        processingStatus: 'PROCESSING' as const,
      })),
      getWatchPostStatus: jest.fn(async () => ({
        _id: 'watch-review-failed-1',
        processingStatus: 'FAILED_REVIEW' as const,
        message: 'This Watch video violates content standards and cannot be published.',
      })),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        watchId: 'watch-review-failed-1',
        watchProcessingStatus: 'FAILED_REVIEW',
        playBackId: undefined,
        failureCode: undefined,
        lastError: undefined,
      }),
    ]);
  });

  it('fails when create returns a generic failed sync without a watch id to poll', async () => {
    const storage = createMemoryStorage();
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-missing-watch-id.mp4',
        processedDuration: 12_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_missing_watch_id')),
      createWatchPost: jest.fn(async () => ({
        processingStatus: 'FAILED_SYNC' as const,
        message: 'Mux is still preparing playback.',
      })),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'failed',
        failureCode: 'processing',
        lastError: 'Watch processing status could not be tracked after upload.',
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
        processingStatus: 'READY' as const,
      },
    } as any);

    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
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

  it('moderates sample frames with the backend before export', async () => {
    const storage = createMemoryStorage();
    const log = jest.fn();
    const videoTrimModule = jest.requireMock('react-native-video-trim');
    const moderationModule = jest.requireMock('@/src/services/moderation/clientModeration');
    videoTrimModule.extractEditedFrames.mockResolvedValue(['/tmp/frame-1.jpg', '/tmp/frame-2.jpg']);
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_bypassed_moderation')),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log,
    });

    await queue.enqueue(baseRecipe, { startImmediately: false });
    await queue.start();
    await queue.waitForIdle();

    expect(videoTrimModule.extractEditedFrames).toHaveBeenCalledTimes(1);
    expect(videoTrimModule.extractEditedFrames).toHaveBeenCalledWith(
      baseRecipe.sourceUri,
      expect.objectContaining({
        outputWidth: 180,
        outputHeight: 320,
        frameCount: 3,
      })
    );
    expect(moderationModule.callBackendFallbackModeration).toHaveBeenCalledWith({
      type: 'video',
      content: ['data:image/jpeg;base64,frame', 'data:image/jpeg;base64,frame'],
    });
    expect(videoTrimModule.exportEditedVideo).toHaveBeenCalledTimes(1);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        moderationDecision: 'safe' as const,
        moderationScores: {},
        moderationError: undefined,
      }),
    ]);
  });

  it('continues to upload when backend video pre-screen is unavailable', async () => {
    const storage = createMemoryStorage();
    const videoTrimModule = jest.requireMock('react-native-video-trim');
    const moderationModule = jest.requireMock('@/src/services/moderation/clientModeration');
    const unavailableError = Object.assign(
      new Error('Content moderation is temporarily unavailable'),
      { status: 503 }
    );
    const uploadVideo = jest.fn(async () => createUploadedResult('mux_upload_deferred_review'));
    const createWatchPost = jest.fn(async () => ({
      _id: 'watch-deferred-review',
      processingStatus: 'READY' as const,
    }));

    videoTrimModule.extractEditedFrames.mockResolvedValueOnce(['/tmp/frame-1.jpg']);
    moderationModule.callBackendFallbackModeration.mockRejectedValueOnce(unavailableError);

    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      uploadVideo,
      createWatchPost,
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe, { startImmediately: false });
    await queue.start();
    await queue.waitForIdle();

    expect(uploadVideo).toHaveBeenCalledTimes(1);
    expect(createWatchPost).toHaveBeenCalledTimes(1);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        moderationDecision: 'safe' as const,
        moderationScores: null,
        moderationError: 'Content moderation is temporarily unavailable',
      }),
    ]);
  });

  it('coalesces repeated start calls into a single processing loop', async () => {
    const storage = createMemoryStorage();
    let releaseModeration: (() => void) | undefined;
    const moderationGate = new Promise<void>((resolve) => {
      releaseModeration = resolve;
    });
    const moderateVideo = jest.fn(async () => {
      await moderationGate;
      return {
        moderationDecision: 'safe' as const,
        moderationScores: null,
      };
    });
    const exportVideo = jest.fn(async () => ({
      processedVideoUri: 'file:///tmp/exported-start-once.mp4',
      processedDuration: 12_000,
      processedWidth: 1080,
      processedHeight: 1920,
    }));
    const uploadVideo = jest.fn(async () => createUploadedResult('mux_upload_start_once'));
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

    await queue.enqueue(baseRecipe, { startImmediately: false });

    const firstStart = queue.start();
    const secondStart = queue.start();

    releaseModeration?.();
    await Promise.all([firstStart, secondStart]);
    await queue.waitForIdle();

    expect(moderateVideo).toHaveBeenCalledTimes(1);
    expect(exportVideo).toHaveBeenCalledTimes(1);
    expect(uploadVideo).toHaveBeenCalledTimes(1);
    expect(createWatchPost).toHaveBeenCalledTimes(1);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
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
        moderationDecision: 'safe' as const,
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

  it('fails watch/post 400 responses once without immediately retrying', async () => {
    const storage = createMemoryStorage();
    (ApiCall as jest.Mock)
      .mockResolvedValueOnce({
        status: 200,
        response: {
          url: 'https://mux.example/upload-400',
          id: 'mux_upload_post_400',
        },
      })
      .mockResolvedValueOnce({
        status: 400,
        response: {
          message: 'watch bad request',
        },
      });

    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-watch-post-400.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(ApiCall).toHaveBeenCalledTimes(2);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'failed',
        retryCount: 1,
        failureCode: 'network',
        nextRetryAt: undefined,
        lastError: 'watch bad request',
      }),
    ]);
  });

  it('schedules delayed retries for transient watch/post failures before succeeding', async () => {
    const waitForItem = async (
      queue: ReturnType<typeof createVideoUploadQueue>,
      predicate: (item: PendingVideoUpload | undefined) => boolean,
      label: string
    ) => {
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const currentItem = queue.getItems()[0];
        if (predicate(currentItem)) {
          return currentItem;
        }

        // The Jest backoff is 20ms, so short real-time polling is sufficient here.
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 2);
        });
      }

      throw new Error(`Timed out waiting for ${label}`);
    };

    (ApiCall as jest.Mock)
      .mockResolvedValueOnce({
        status: 200,
        response: {
          url: 'https://mux.example/upload-429',
          id: 'mux_upload_post_429',
        },
      })
      .mockResolvedValueOnce({
        status: 429,
        response: {
          message: 'slow down',
        },
      })
      .mockResolvedValueOnce({
        status: 201,
        response: {
          _id: 'watch-post-429',
          processingStatus: 'READY' as const,
        },
      });

    const queue = createVideoUploadQueue({
      storage: createMemoryStorage(),
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-watch-post-429.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      now: jest.fn(() => new Date().toISOString()),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    const retryingItem = await waitForItem(
      queue,
      (item) =>
        item?.status === 'queued' &&
        item.retryCount === 1 &&
        typeof item.nextRetryAt === 'string' &&
        item.lastError === 'slow down',
      'watch/post retry scheduling'
    );

    expect(Date.parse(retryingItem?.nextRetryAt ?? '')).toBeGreaterThan(Date.now());

    await waitForItem(queue, (item) => item?.status === 'complete', 'completed watch/post retry');

    expect(ApiCall).toHaveBeenCalledTimes(3);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        retryCount: 1,
        watchId: 'watch-post-429',
        nextRetryAt: undefined,
      }),
    ]);
  });

  it('skips queued retries until their backoff window is due', async () => {
    jest.useFakeTimers();
    try {
      let nowMs = Date.parse('2026-03-07T10:00:00.000Z');
      const flushQueue = async () => {
        await Promise.resolve();
        await Promise.resolve();
      };
      const waitForItem = async (
        queue: ReturnType<typeof createVideoUploadQueue>,
        predicate: (item: PendingVideoUpload | undefined) => boolean,
        label: string
      ) => {
        for (let attempt = 0; attempt < 12; attempt += 1) {
          // eslint-disable-next-line no-await-in-loop
          await flushQueue();
          const currentItem = queue.getItems()[0];
          if (predicate(currentItem)) {
            return currentItem;
          }
        }

        throw new Error(`Timed out waiting for ${label}`);
      };
      const now = jest.fn(() => new Date(nowMs).toISOString());
      jest.setSystemTime(nowMs);
      const uploadVideo = jest
        .fn()
        .mockRejectedValueOnce(new QueueError('network', 'temporary upload failure', true))
        .mockResolvedValueOnce(createUploadedResult('mux_upload_after_backoff'));

      const queue = createVideoUploadQueue({
        storage: createMemoryStorage(),
        fileExists: jest.fn(async () => true),
        deleteFile: createDeleteFile(),
        moderateVideo: jest.fn(async () => ({
          moderationDecision: 'safe' as const,
          moderationScores: null,
        })),
        exportVideo: jest.fn(async () => ({
          processedVideoUri: 'file:///tmp/exported-wait-until-due.mp4',
          processedDuration: 20_000,
          processedWidth: 1080,
          processedHeight: 1920,
        })),
        uploadVideo,
        createWatchPost: jest.fn(async () => undefined),
        now,
        log: jest.fn(),
      });

      await queue.enqueue(baseRecipe);
      await waitForItem(
        queue,
        (item) =>
          item?.status === 'queued' &&
          item.retryCount === 1 &&
          item.nextRetryAt === '2026-03-07T10:00:00.020Z',
        'queued upload retry scheduling'
      );

      expect(uploadVideo).toHaveBeenCalledTimes(1);
      expect(queue.getItems()[0]).toEqual(
        expect.objectContaining({
          status: 'queued',
          retryCount: 1,
          nextRetryAt: '2026-03-07T10:00:00.020Z',
        })
      );

      nowMs += 19;
      jest.setSystemTime(nowMs);
      await jest.advanceTimersByTimeAsync(19);
      await flushQueue();

      expect(uploadVideo).toHaveBeenCalledTimes(1);
      expect(queue.getItems()[0]).toEqual(
        expect.objectContaining({
          status: 'queued',
          retryCount: 1,
          nextRetryAt: '2026-03-07T10:00:00.020Z',
        })
      );

      nowMs += 1;
      jest.setSystemTime(nowMs);
      await jest.advanceTimersByTimeAsync(1);
      await waitForItem(queue, (item) => item?.status === 'complete', 'completed upload retry');

      expect(uploadVideo).toHaveBeenCalledTimes(2);
      expect(queue.getItems()).toEqual([
        expect.objectContaining({
          status: 'complete',
          retryCount: 1,
          nextRetryAt: undefined,
        }),
      ]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('retries retryable upload failures and completes when a later retry succeeds', async () => {
    jest.useFakeTimers();
    try {
      let nowMs = Date.parse('2026-03-07T10:00:00.000Z');
      const flushQueue = async () => {
        await Promise.resolve();
        await Promise.resolve();
      };
      const waitForItem = async (
        predicate: (item: PendingVideoUpload | undefined) => boolean,
        label: string
      ) => {
        for (let attempt = 0; attempt < 12; attempt += 1) {
          // eslint-disable-next-line no-await-in-loop
          await flushQueue();
          const currentItem = queue.getItems()[0];
          if (predicate(currentItem)) {
            return currentItem;
          }
        }

        throw new Error(`Timed out waiting for ${label}`);
      };
      const now = jest.fn(() => new Date(nowMs).toISOString());
      jest.setSystemTime(nowMs);
      const storage = createMemoryStorage();
      let uploadAttempts = 0;
      const queue = createVideoUploadQueue({
        storage,
        fileExists: jest.fn(async () => true),
        deleteFile: createDeleteFile(),
        moderateVideo: jest.fn(async () => ({
          moderationDecision: 'safe' as const,
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
        now,
        log: jest.fn(),
      });

      await queue.enqueue(baseRecipe);
      await waitForItem(
        (item) =>
          item?.status === 'queued' &&
          item.retryCount === 1 &&
          item.nextRetryAt === '2026-03-07T10:00:00.020Z',
        'first queued retry'
      );

      nowMs += 20;
      jest.setSystemTime(nowMs);
      await jest.advanceTimersByTimeAsync(20);
      await waitForItem(
        (item) =>
          item?.status === 'queued' &&
          item.retryCount === 2 &&
          item.nextRetryAt === '2026-03-07T10:00:00.060Z',
        'second queued retry'
      );

      nowMs += 40;
      jest.setSystemTime(nowMs);
      await jest.advanceTimersByTimeAsync(40);
      await waitForItem((item) => item?.status === 'complete', 'completed upload');

      const [result] = queue.getItems();
      expect(uploadAttempts).toBe(3);
      expect(result.status).toBe('complete');
      expect(result.retryCount).toBe(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps native upload as the default transport when healthy', async () => {
    const storage = createMemoryStorage();
    const uploadVideo = jest.fn(async (_processedVideoUri: string, options?: any) => {
      expect(options?.forceUploadTransport).toBeUndefined();
      return {
        uploadId: 'mux_upload_native_healthy',
        uploadTransport: 'mux_sdk' as const,
        nativeUploadState: 'success' as const,
      };
    });
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-native-healthy.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo,
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(uploadVideo).toHaveBeenCalledTimes(1);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        uploadTransport: 'mux_sdk',
        nativeUploadState: 'success',
      }),
    ]);
  });

  it('recovers a timed out native startup by retrying only that upload through raw put', async () => {
    const storage = createMemoryStorage();
    const moderateVideo = jest.fn(async () => ({
      moderationDecision: 'safe' as const,
      moderationScores: null,
    }));
    const exportVideo = jest.fn(async () => ({
      processedVideoUri: 'file:///tmp/exported-native-timeout.mp4',
      processedDuration: 20_000,
      processedWidth: 1080,
      processedHeight: 1920,
    }));
    const uploadVideo = jest
      .fn()
      .mockImplementationOnce(async (_processedVideoUri: string, options?: any) => {
        await options?.onNativeUploadPrepared?.({
          uploadId: 'mux_upload_native_timeout',
          uploadTransport: 'mux_sdk',
          nativeUploadState: 'uploading',
        });
        throw new NativeMuxDirectUploadError(
          'Native Mux upload did not emit a callback before timing out.',
          {
            code: 'startup_timeout',
            startedBytes: false,
          }
        );
      })
      .mockImplementationOnce(async (_processedVideoUri: string, options?: any) => {
        expect(options?.forceUploadTransport).toBe('raw_put_fallback');
        return createUploadedResult('mux_upload_recovered_raw_put');
      });

    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo,
      exportVideo,
      uploadVideo,
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe);
    await queue.waitForIdle();

    expect(moderateVideo).toHaveBeenCalledTimes(1);
    expect(exportVideo).toHaveBeenCalledTimes(1);
    expect(uploadVideo).toHaveBeenCalledTimes(2);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        uploadId: 'mux_upload_recovered_raw_put',
        uploadTransport: 'raw_put_fallback',
        nativeCrashRecoveryCount: 1,
        forcedUploadTransport: undefined,
      }),
    ]);
  });

  it('recovers stale native startup markers on resume instead of re-entering native upload', async () => {
    const seed: PendingVideoUpload[] = [
      {
        id: 'resume-native-timeout-item',
        status: 'uploading',
        retryCount: 0,
        createdAt: '2026-03-07T10:00:00.000Z',
        updatedAt: '2026-03-07T10:00:00.000Z',
        recipe: baseRecipe,
        moderationDecision: 'safe' as const,
        moderationScores: null,
        processedVideoUri: 'file:///tmp/exported-native-resume.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
        uploadId: 'mux_upload_resume_native_timeout',
        uploadTransport: 'mux_sdk',
        nativeUploadState: 'uploading',
      },
    ];
    const storage = createMemoryStorage(seed);
    const uploadVideo = jest.fn(async (_processedVideoUri: string, options?: any) => {
      expect(options?.forceUploadTransport).toBe('raw_put_fallback');
      return createUploadedResult('mux_upload_resume_raw_put');
    });
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo: jest.fn(async () => ({
        moderationDecision: 'safe' as const,
        moderationScores: null,
      })),
      exportVideo: jest.fn(async () => ({
        processedVideoUri: 'file:///tmp/exported-native-resume.mp4',
        processedDuration: 20_000,
        processedWidth: 1080,
        processedHeight: 1920,
      })),
      uploadVideo,
      resumeNativeUploads: jest.fn(async () => [
        {
          uploadId: 'mux_upload_resume_native_timeout',
          fileUri: 'file:///tmp/exported-native-resume.mp4',
          state: 'uploading' as const,
          startupState: 'starting' as const,
          startupStep: 'start_called',
          startupUpdatedAt: '2026-03-07T09:59:00.000Z',
        },
      ]),
      getNativeUploads: jest.fn(async () => []),
      createWatchPost: jest.fn(async () => ({
        _id: 'watch-resume-recovery-1',
        playBackId: 'playback-resume-recovery-1',
        processingStatus: 'READY' as const,
      })),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.resume();
    await queue.waitForIdle();

    expect(uploadVideo).toHaveBeenCalledTimes(1);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        uploadId: 'mux_upload_resume_raw_put',
        uploadTransport: 'raw_put_fallback',
        nativeCrashRecoveryCount: 1,
      }),
    ]);
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
        moderationDecision: 'blocked' as const,
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
        moderationDecision: 'safe' as const,
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
      moderationDecision: 'safe' as const,
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

  it('coalesces repeated resume calls into a single processing loop', async () => {
    const seed: PendingVideoUpload[] = [
      {
        id: 'resume-coalesced-item',
        status: 'queued',
        retryCount: 0,
        createdAt: '2026-03-07T10:00:00.000Z',
        updatedAt: '2026-03-07T10:00:00.000Z',
        recipe: baseRecipe,
      },
    ];
    const storage = createMemoryStorage(seed);
    let releaseModeration: (() => void) | undefined;
    const moderationGate = new Promise<void>((resolve) => {
      releaseModeration = resolve;
    });
    const moderateVideo = jest.fn(async () => {
      await moderationGate;
      return {
        moderationDecision: 'safe' as const,
        moderationScores: null,
      };
    });
    const exportVideo = jest.fn(async () => ({
      processedVideoUri: 'file:///tmp/exported-resume-once.mp4',
      processedDuration: 12_000,
      processedWidth: 1080,
      processedHeight: 1920,
    }));
    const uploadVideo = jest.fn(async () => createUploadedResult('mux_upload_resume_once'));
    const createWatchPost = jest.fn(async () => undefined);
    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      moderateVideo,
      exportVideo,
      uploadVideo,
      createWatchPost,
      resumeNativeUploads: jest.fn(async () => []),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    const firstResume = queue.resume();
    const secondResume = queue.resume();

    releaseModeration?.();
    await Promise.all([firstResume, secondResume]);
    await queue.waitForIdle();

    expect(moderateVideo).toHaveBeenCalledTimes(1);
    expect(exportVideo).toHaveBeenCalledTimes(1);
    expect(uploadVideo).toHaveBeenCalledTimes(1);
    expect(createWatchPost).toHaveBeenCalledTimes(1);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        id: 'resume-coalesced-item',
        status: 'complete',
      }),
    ]);
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
        moderationDecision: 'safe' as const,
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
      moderationDecision: 'safe' as const,
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
        moderationDecision: 'safe' as const,
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
          moderationDecision: 'safe' as const,
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
          processingStatus:
            item.id === 'queued-second' ? ('READY' as const) : ('PROCESSING' as const),
        };
      }),
      getWatchPostStatus: jest
        .fn()
        .mockImplementationOnce(async () => {
          events.push('poll:remote-first');
          return {
            _id: 'watch-remote-first',
            processingStatus: 'PROCESSING' as const,
          };
        })
        .mockImplementationOnce(async () => {
          events.push('poll:remote-first-ready');
          return {
            _id: 'watch-remote-first',
            playBackId: 'playback-remote-first',
            processingStatus: 'READY' as const,
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
        moderationDecision: 'safe' as const,
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
        moderationDecision: 'safe' as const,
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
        moderationDecision: 'safe' as const,
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
        moderationDecision: 'safe' as const,
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
        moderationDecision: 'safe' as const,
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
        moderationDecision: 'unclassified' as const,
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

  it('retries fallback moderation with a smaller payload after a 413 response', async () => {
    const storage = createMemoryStorage();
    const videoTrimModule = jest.requireMock('react-native-video-trim');
    const moderationModule = jest.requireMock('@/src/services/moderation/clientModeration');
    const tooLargeError = Object.assign(new Error('Request Entity Too Large'), { status: 413 });

    videoTrimModule.extractEditedFrames
      .mockResolvedValueOnce(['/tmp/frame-1.jpg', '/tmp/frame-2.jpg', '/tmp/frame-3.jpg'])
      .mockResolvedValueOnce(['/tmp/frame-retry.jpg']);
    moderationModule.callBackendFallbackModeration
      .mockRejectedValueOnce(tooLargeError)
      .mockResolvedValueOnce({
        finalAction: 'allow',
        provider: 'openai',
        flagged: false,
        model: 'omni-moderation-latest',
        results: [],
        matchedCategories: [],
      });

    const queue = createVideoUploadQueue({
      storage,
      fileExists: jest.fn(async () => true),
      deleteFile: createDeleteFile(),
      uploadVideo: jest.fn(async () => createUploadedResult('mux_upload_retry_after_413')),
      createWatchPost: jest.fn(async () => undefined),
      now: jest.fn().mockReturnValue('2026-03-07T10:00:00.000Z'),
      log: jest.fn(),
    });

    await queue.enqueue(baseRecipe, { startImmediately: false });
    await queue.start();
    await queue.waitForIdle();

    expect(videoTrimModule.extractEditedFrames).toHaveBeenCalledTimes(2);
    expect(videoTrimModule.extractEditedFrames).toHaveBeenNthCalledWith(
      1,
      baseRecipe.sourceUri,
      expect.objectContaining({
        outputWidth: 180,
        outputHeight: 320,
        frameCount: 3,
      })
    );
    expect(videoTrimModule.extractEditedFrames).toHaveBeenNthCalledWith(
      2,
      baseRecipe.sourceUri,
      expect.objectContaining({
        outputWidth: 90,
        outputHeight: 160,
        frameCount: 1,
      })
    );
    expect(moderationModule.callBackendFallbackModeration).toHaveBeenCalledTimes(2);
    expect(queue.getItems()).toEqual([
      expect.objectContaining({
        status: 'complete',
        moderationDecision: 'safe' as const,
      }),
    ]);
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
        moderationDecision: 'safe' as const,
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
        moderationDecision: 'safe' as const,
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
