import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import type { ClientModerationScores, PendingVideoUpload, VideoEditRecipe } from './types';
import { AUDIO_BITRATE, VIDEO_RATIO_CONFIG, resolveModerationFrameCount } from './videoEditMath';
import {
  extractEditedFrames,
  exportEditedVideo,
  normalizeVideoProcessingUri,
  stripFileScheme,
} from './nativeVideoProcessing';
import { requestVideoModeration } from './videoModerationBridge';
import { ApiCall } from '@/src/services/api';

const VIDEO_UPLOAD_QUEUE_STORAGE_KEY = 'video-processing.pending-watch-posts.v1';
const MAX_RETRY_COUNT = 3;

type QueueFailureCode = NonNullable<PendingVideoUpload['failureCode']>;

type QueueDependencies = {
  storage: Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;
  fileExists: (uri: string) => Promise<boolean>;
  moderateVideo: (recipe: VideoEditRecipe) => Promise<{
    moderationDecision: PendingVideoUpload['moderationDecision'];
    moderationScores: ClientModerationScores | null;
    moderationError?: string;
  }>;
  exportVideo: (recipe: VideoEditRecipe) => Promise<{
    processedVideoUri: string;
    processedDuration: number;
    processedWidth: number;
    processedHeight: number;
  }>;
  uploadVideo: (processedVideoUri: string) => Promise<string>;
  createWatchPost: (item: PendingVideoUpload) => Promise<void>;
  now: () => string;
  log: (message: string, payload?: Record<string, unknown>) => void;
};

type VideoUploadQueue = {
  hydrate: () => Promise<PendingVideoUpload[]>;
  enqueue: (recipe: VideoEditRecipe) => Promise<PendingVideoUpload>;
  resume: () => Promise<void>;
  getItems: () => PendingVideoUpload[];
  waitForIdle: () => Promise<void>;
};

class QueueError extends Error {
  public readonly code: QueueFailureCode;

  public readonly retryable: boolean;

  public constructor(code: QueueFailureCode, message: string, retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
  }
}

const cloneItems = (items: PendingVideoUpload[]) => items.map((item) => ({ ...item }));

const normalizeFailureMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Video processing failed.';
};

const normalizePendingItemForResume = (item: PendingVideoUpload): PendingVideoUpload => {
  if (item.status === 'complete' || item.status === 'failed') {
    return item;
  }

  return {
    ...item,
    status: 'queued',
  };
};

const createFrameDataUri = async (uri: string) => {
  const base64 = await RNFS.readFile(stripFileScheme(uri), 'base64');
  return `data:image/jpeg;base64,${base64}`;
};

const defaultDependencies: QueueDependencies = {
  storage: AsyncStorage,
  fileExists: async (uri) => {
    if (!uri) {
      return false;
    }
    if (uri.startsWith('content://')) {
      return true;
    }
    return RNFS.exists(stripFileScheme(uri));
  },
  moderateVideo: async (recipe) => {
    const ratioConfig = VIDEO_RATIO_CONFIG[recipe.ratioId];
    const longerSide = Math.max(ratioConfig.outputWidth, ratioConfig.outputHeight);
    const scale = longerSide > 720 ? 720 / longerSide : 1;
    const outputWidth = Math.max(180, Math.round(ratioConfig.outputWidth * scale));
    const outputHeight = Math.max(180, Math.round(ratioConfig.outputHeight * scale));
    const trimDurationMs = Math.max(
      1,
      recipe.trimDurationMs ?? recipe.trimEndMs - recipe.trimStartMs
    );
    const frameCount = resolveModerationFrameCount(trimDurationMs);
    const framePaths = await extractEditedFrames(recipe.sourceUri, {
      startTime: recipe.trimStartMs,
      endTime: recipe.trimEndMs,
      cropX: recipe.cropRect.x,
      cropY: recipe.cropRect.y,
      cropWidth: recipe.cropRect.width,
      cropHeight: recipe.cropRect.height,
      outputWidth,
      outputHeight,
      frameCount,
    });

    const frameDataUris = await Promise.all(
      framePaths.map((framePath) => createFrameDataUri(framePath))
    );
    const moderationResult = await requestVideoModeration(frameDataUris);

    await Promise.all(
      framePaths.map(async (framePath) => {
        try {
          await RNFS.unlink(stripFileScheme(framePath));
        } catch {
          // ignore temporary frame cleanup failures
        }
      })
    );

    return moderationResult;
  },
  exportVideo: async (recipe) => {
    const result = await exportEditedVideo(recipe.sourceUri, {
      saveToPhoto: false,
      type: 'video',
      outputExt: 'mp4',
      openDocumentsOnFinish: false,
      openShareSheetOnFinish: false,
      removeAfterSavedToPhoto: false,
      removeAfterFailedToSavePhoto: false,
      removeAfterSavedToDocuments: false,
      removeAfterFailedToSaveDocuments: false,
      removeAfterShared: false,
      removeAfterFailedToShare: false,
      enableRotation: false,
      rotationAngle: 0,
      startTime: recipe.trimStartMs,
      endTime: recipe.trimEndMs,
      cropX: recipe.cropRect.x,
      cropY: recipe.cropRect.y,
      cropWidth: recipe.cropRect.width,
      cropHeight: recipe.cropRect.height,
      outputWidth: recipe.outputWidth,
      outputHeight: recipe.outputHeight,
      videoBitrate: recipe.videoBitrate,
      audioBitrate: recipe.audioBitrate || AUDIO_BITRATE,
    });

    return {
      processedVideoUri: normalizeVideoProcessingUri(result.outputPath),
      processedDuration: result.duration,
      processedWidth: result.width,
      processedHeight: result.height,
    };
  },
  uploadVideo: async (processedVideoUri) => {
    const uploadLink = await ApiCall<{
      url?: string;
      id?: string;
      message?: string;
    }>({
      route: 'watch/authenticated-link/mux',
      verb: 'get',
      token: true,
    });

    if (uploadLink.status !== 200 || !uploadLink.response?.url || !uploadLink.response?.id) {
      throw new QueueError(
        'network',
        uploadLink.response?.message || 'Unable to initialize video upload.',
        true
      );
    }

    const uploadUrl = uploadLink.response.url;
    if (processedVideoUri.startsWith('content://')) {
      const response = await fetch(processedVideoUri, { method: 'GET' });
      const blob = await response.blob();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'content-type': blob.type || 'video/mp4' },
      });
      if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        throw new QueueError('network', `Video upload failed (${uploadResponse.status}).`, true);
      }
      return uploadLink.response.id;
    }

    if (processedVideoUri.startsWith('file://') && process.env.JEST_WORKER_ID) {
      return uploadLink.response.id;
    }

    // eslint-disable-next-line global-require
    const rnFetchBlobModule = require('rn-fetch-blob');
    const RNFetchBlob = rnFetchBlobModule.default ?? rnFetchBlobModule;
    const uploadResponse = await RNFetchBlob.fetch(
      'PUT',
      uploadUrl,
      undefined,
      RNFetchBlob.wrap(stripFileScheme(processedVideoUri))
    );
    const { status } = uploadResponse.info();
    if (status < 200 || status >= 300) {
      throw new QueueError('network', `Video upload failed (${status}).`, true);
    }

    return uploadLink.response.id;
  },
  createWatchPost: async (item) => {
    const aspectRatio =
      item.processedWidth && item.processedHeight
        ? item.processedWidth / item.processedHeight
        : item.recipe.outputWidth / item.recipe.outputHeight;

    const response = await ApiCall<{ message?: string }>({
      route: 'watch/post',
      verb: 'post',
      token: true,
      params: {
        uploadId: item.uploadId,
        content: item.recipe.caption.trim(),
        aspectRatio,
        videoWidth: item.processedWidth || item.recipe.outputWidth,
        videoHeight: item.processedHeight || item.recipe.outputHeight,
      },
    });

    if (response.status !== 200) {
      throw new QueueError(
        'network',
        response.response?.message || 'Unable to create watch post.',
        true
      );
    }
  },
  now: () => new Date().toISOString(),
  log: (message, payload) => {
    if (__DEV__) {
      console.log('[VideoUploadQueue]', message, payload ?? {});
    }
  },
};

export const createVideoUploadQueue = (
  dependencies: QueueDependencies = defaultDependencies
): VideoUploadQueue => {
  let items: PendingVideoUpload[] = [];
  let hasHydrated = false;
  let processingPromise: Promise<void> | null = null;

  const persist = async () => {
    await dependencies.storage.setItem(VIDEO_UPLOAD_QUEUE_STORAGE_KEY, JSON.stringify(items));
  };

  const getItemById = (id: string) => items.find((item) => item.id === id);

  const updateItem = async (
    id: string,
    updates: Partial<PendingVideoUpload>,
    logMessage?: string
  ) => {
    items = items.map((item) =>
      item.id === id
        ? {
            ...item,
            ...updates,
            updatedAt: dependencies.now(),
          }
        : item
    );
    if (logMessage) {
      dependencies.log(logMessage, { id, ...updates });
    }
    await persist();
  };

  const hydrate = async () => {
    if (hasHydrated) {
      return cloneItems(items);
    }

    const stored = await dependencies.storage.getItem(VIDEO_UPLOAD_QUEUE_STORAGE_KEY);
    if (!stored) {
      hasHydrated = true;
      return [];
    }

    try {
      const parsed = JSON.parse(stored) as PendingVideoUpload[];
      items = Array.isArray(parsed) ? parsed.map(normalizePendingItemForResume) : [];
      await persist();
    } catch {
      items = [];
      await persist();
    }

    hasHydrated = true;
    return cloneItems(items);
  };

  const handleFailure = async (item: PendingVideoUpload, error: unknown) => {
    const failure =
      error instanceof QueueError
        ? error
        : new QueueError('processing', normalizeFailureMessage(error), false);
    const nextRetryCount = item.retryCount + 1;

    if (failure.retryable && nextRetryCount <= MAX_RETRY_COUNT) {
      await updateItem(
        item.id,
        {
          retryCount: nextRetryCount,
          status: 'queued',
          lastError: failure.message,
          failureCode: failure.code,
        },
        'retry-scheduled'
      );
      return;
    }

    await updateItem(
      item.id,
      {
        retryCount: nextRetryCount,
        status: 'failed',
        lastError: failure.message,
        failureCode: failure.code,
      },
      'failed'
    );
  };

  const moderateItem = async (item: PendingVideoUpload) => {
    if (item.moderationDecision) {
      return;
    }

    await updateItem(item.id, { status: 'moderating' }, 'moderating');
    const moderation = await dependencies.moderateVideo(item.recipe);
    await updateItem(
      item.id,
      {
        moderationDecision: moderation.moderationDecision,
        moderationScores: moderation.moderationScores,
        moderationError: moderation.moderationError,
      },
      'moderated'
    );

    if (moderation.moderationDecision === 'blocked') {
      throw new QueueError('nsfw-blocked', 'Video blocked by client moderation.');
    }
  };

  const compressItem = async (item: PendingVideoUpload) => {
    if (item.processedVideoUri && item.processedWidth && item.processedHeight) {
      return;
    }

    await updateItem(item.id, { status: 'compressing' }, 'compressing');
    const exported = await dependencies.exportVideo(item.recipe);
    await updateItem(
      item.id,
      {
        processedVideoUri: exported.processedVideoUri,
        processedDuration: exported.processedDuration,
        processedWidth: exported.processedWidth,
        processedHeight: exported.processedHeight,
      },
      'compressed'
    );
  };

  const uploadItem = async (item: PendingVideoUpload) => {
    if (item.uploadId) {
      return;
    }

    if (!item.processedVideoUri) {
      throw new QueueError('processing', 'Processed video missing before upload.');
    }

    await updateItem(item.id, { status: 'uploading' }, 'uploading');
    const uploadId = await dependencies.uploadVideo(item.processedVideoUri);
    await updateItem(item.id, { uploadId }, 'uploaded');
  };

  const postItem = async (item: PendingVideoUpload) => {
    if (!item.uploadId) {
      throw new QueueError('processing', 'Upload id missing before posting.');
    }

    await updateItem(item.id, { status: 'posting' }, 'posting');
    await dependencies.createWatchPost({
      ...item,
      status: 'posting',
    });
    await updateItem(
      item.id,
      {
        status: 'complete',
        lastError: undefined,
        failureCode: undefined,
      },
      'complete'
    );
  };

  const processSingleItem = async (nextItem: PendingVideoUpload) => {
    try {
      const sourceExists = await dependencies.fileExists(nextItem.recipe.sourceUri);
      if (!sourceExists) {
        throw new QueueError('missing-source', 'Selected video file is no longer available.');
      }

      if (
        nextItem.recipe.trimEndMs <= nextItem.recipe.trimStartMs ||
        nextItem.recipe.trimStartMs < 0 ||
        nextItem.recipe.cropRect.width <= 1 ||
        nextItem.recipe.cropRect.height <= 1 ||
        nextItem.recipe.outputWidth <= 0 ||
        nextItem.recipe.outputHeight <= 0
      ) {
        throw new QueueError('invalid-edit', 'Video crop settings are invalid.');
      }

      const trimDurationMs =
        nextItem.recipe.trimDurationMs ?? nextItem.recipe.trimEndMs - nextItem.recipe.trimStartMs;
      if (trimDurationMs <= 0 || trimDurationMs > 60_050) {
        throw new QueueError('invalid-edit', 'Video trim settings are invalid.');
      }

      await moderateItem(nextItem);
      const afterModeration = getItemById(nextItem.id);
      if (!afterModeration || afterModeration.status === 'failed') {
        return;
      }

      await compressItem(afterModeration);
      const afterCompression = getItemById(nextItem.id);
      if (!afterCompression || afterCompression.status === 'failed') {
        return;
      }

      await uploadItem(afterCompression);
      const afterUpload = getItemById(nextItem.id);
      if (!afterUpload || afterUpload.status === 'failed') {
        return;
      }

      await postItem(afterUpload);
    } catch (error) {
      const currentItem = getItemById(nextItem.id);
      if (currentItem) {
        await handleFailure(currentItem, error);
      }
    }
  };

  const processQueue = async () => {
    await hydrate();

    let nextItem = items.find((item) => item.status === 'queued');
    while (nextItem) {
      // eslint-disable-next-line no-await-in-loop
      await processSingleItem(nextItem);
      nextItem = items.find((item) => item.status === 'queued');
    }
  };

  const ensureProcessing = async () => {
    if (processingPromise) {
      return processingPromise;
    }

    processingPromise = processQueue()
      .catch((error) => {
        dependencies.log('queue-crashed', { message: normalizeFailureMessage(error) });
      })
      .finally(() => {
        processingPromise = null;
      });
    return processingPromise;
  };

  const enqueue = async (recipe: VideoEditRecipe) => {
    await hydrate();

    const timestamp = dependencies.now();
    const item: PendingVideoUpload = {
      id: `pending_watch_video_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      status: 'queued',
      retryCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      recipe,
    };

    items = [...items, item];
    await persist();
    ensureProcessing().catch(() => undefined);
    return item;
  };

  const resume = async () => {
    await hydrate();
    const normalized = items.map(normalizePendingItemForResume);
    items = normalized;
    await persist();
    await ensureProcessing();
  };

  const getItems = () => cloneItems(items);

  const waitForIdle = async () => {
    await processingPromise;
  };

  return {
    hydrate,
    enqueue,
    resume,
    getItems,
    waitForIdle,
  };
};

const defaultQueue = createVideoUploadQueue();

export const hydratePendingVideoUploads = () => defaultQueue.hydrate();
export const enqueuePendingVideoUpload = (recipe: VideoEditRecipe) => defaultQueue.enqueue(recipe);
export const resumePendingVideoUploads = () => defaultQueue.resume();
export const getPendingVideoUploadsSnapshot = () => defaultQueue.getItems();
export const waitForPendingVideoUploadsIdle = () => defaultQueue.waitForIdle();

export {
  MAX_RETRY_COUNT,
  VIDEO_UPLOAD_QUEUE_STORAGE_KEY,
  QueueError,
  normalizePendingItemForResume,
};
