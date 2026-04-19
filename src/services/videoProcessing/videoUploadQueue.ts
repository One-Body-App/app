import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import type { ClientModerationScores, PendingVideoUpload, VideoEditRecipe } from './types';
import { AUDIO_BITRATE } from './videoEditMath';
import { deriveVideoAspectRatio, validateExportedVideoForWatch } from './videoUploadValidation';
import {
  hasTimedOutNativeMuxStartup,
  NativeMuxDirectUploadError,
  getNativeMuxDirectUploads,
  isNativeMuxDirectUploadAvailable,
  resumeNativeMuxDirectUploads,
  startNativeMuxDirectUpload,
  waitForNativeMuxDirectUpload,
  type NativeMuxDirectUploadRecord,
} from './muxDirectUploadBridge';
import {
  extractEditedFrames,
  exportEditedVideo,
  normalizeVideoProcessingUri,
  stripFileScheme,
} from './nativeVideoProcessing';
import { ApiCall } from '@/src/services/api';
import { queueTaggedNotificationDemo } from '@/src/services/notification/taggedNotificationDispatch';
import {
  buildImageDataUri,
  callBackendFallbackModeration,
} from '@/src/services/moderation/clientModeration';

const VIDEO_UPLOAD_QUEUE_STORAGE_KEY = 'video-processing.pending-watch-posts.v1';
const MAX_RETRY_COUNT = 3;
const RETRY_BACKOFF_BASE_MS = process.env.JEST_WORKER_ID ? 20 : 5_000;
const RETRY_BACKOFF_MULTIPLIER = 2;
const RETRY_BACKOFF_MAX_MS = process.env.JEST_WORKER_ID ? 100 : 60_000;
const REMOTE_POLL_BASE_INTERVAL_MS = process.env.JEST_WORKER_ID ? 0 : 3000;
const REMOTE_POLL_MULTIPLIER = 1.8;
const REMOTE_POLL_MAX_INTERVAL_MS = process.env.JEST_WORKER_ID ? 0 : 30000;
const REMOTE_POLL_JITTER_RATIO = 0.2;
const REMOTE_POLL_TIMEOUT_MS = 10 * 60 * 1000;
const MISSING_VIDEO_TRACK_GRACE_MS = 90 * 1000;
const MAX_NATIVE_CRASH_RECOVERY_COUNT = 1;

type QueueFailureCode = NonNullable<PendingVideoUpload['failureCode']>;
type WatchBackendProcessingStatus = NonNullable<PendingVideoUpload['watchProcessingStatus']>;
type UploadTransport = NonNullable<PendingVideoUpload['uploadTransport']>;
type WatchPostResponse = {
  _id?: string;
  postId?: string;
  playBackId?: string;
  processingStatus?: WatchBackendProcessingStatus;
  moderationStatus?: 'ACTIVE' | 'PENDING_REVIEW' | 'REMOVED' | 'VERIFIED_SAFE';
  pendingReview?: boolean;
  message?: string;
  syncFailureReason?: string;
};
type WatchSyncFailureReason =
  | 'missing_video_track'
  | 'invalid_duration'
  | 'invalid_dimensions'
  | 'unsupported_aspect_ratio';
type TerminalWatchSyncFailureReason = Exclude<WatchSyncFailureReason, 'missing_video_track'>;
type WatchResponseDisposition =
  | 'ready'
  | 'pending'
  | 'submitted_for_review'
  | 'grace_period_pending_sync_failure'
  | 'terminal_review_failure'
  | 'terminal_sync_failure';
type ClassifiedWatchResponse = {
  disposition: WatchResponseDisposition;
  watchId?: string;
  playBackId?: string;
  watchProcessingStatus: WatchBackendProcessingStatus;
  syncFailureReason?: WatchSyncFailureReason;
  downgradedByMissingVideoTrackGrace?: boolean;
};
type UploadVideoResult = {
  uploadId: string;
  uploadTransport: UploadTransport;
  nativeUploadState?: NonNullable<PendingVideoUpload['nativeUploadState']>;
};
type UploadVideoOptions = {
  forceUploadTransport?: NonNullable<PendingVideoUpload['forcedUploadTransport']>;
  onNativeUploadPrepared?: (preparedUpload: UploadVideoResult) => Promise<void> | void;
};

type QueueDependencies = {
  storage: Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;
  fileExists: (uri: string) => Promise<boolean>;
  deleteFile: (uri: string) => Promise<void>;
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
  uploadVideo: (
    processedVideoUri: string,
    options?: UploadVideoOptions
  ) => Promise<UploadVideoResult>;
  resumeNativeUploads: () => Promise<NativeMuxDirectUploadRecord[]>;
  getNativeUploads: () => Promise<NativeMuxDirectUploadRecord[]>;
  waitForNativeUpload: (uploadId: string) => Promise<void>;
  createWatchPost: (item: PendingVideoUpload) => Promise<WatchPostResponse | void>;
  getWatchPostStatus: (watchId: string) => Promise<WatchPostResponse>;
  now: () => string;
  log: (message: string, payload?: Record<string, unknown>) => void;
};

type VideoUploadQueueListener = (items: PendingVideoUpload[]) => void;

type VideoUploadQueue = {
  hydrate: () => Promise<PendingVideoUpload[]>;
  enqueue: (
    recipe: VideoEditRecipe,
    options?: {
      startImmediately?: boolean;
    }
  ) => Promise<PendingVideoUpload>;
  start: () => Promise<void>;
  resume: () => Promise<void>;
  getItems: () => PendingVideoUpload[];
  waitForIdle: () => Promise<void>;
  subscribe: (listener: VideoUploadQueueListener) => () => void;
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
const ACTIVE_QUEUE_STATUSES = new Set<PendingVideoUpload['status']>([
  'queued',
  'moderating',
  'compressing',
  'uploading',
  'posting',
  'processing_remote',
]);

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
  const normalizedRecipe: VideoEditRecipe = {
    ...item.recipe,
    mentionedUserIds: Array.isArray(item.recipe?.mentionedUserIds)
      ? item.recipe.mentionedUserIds
      : [],
    mentions: Array.isArray(item.recipe?.mentions) ? item.recipe.mentions : [],
  };

  if (item.status === 'complete' || item.status === 'failed') {
    return {
      ...item,
      recipe: normalizedRecipe,
    };
  }

  if (
    item.status === 'processing_remote' ||
    (item.status === 'uploading' && item.uploadTransport === 'mux_sdk')
  ) {
    return {
      ...item,
      recipe: normalizedRecipe,
    };
  }

  return {
    ...item,
    recipe: normalizedRecipe,
    status: 'queued',
  };
};

const resolveWatchId = (watch: WatchPostResponse | void) => {
  const candidate = watch?._id ?? watch?.postId;
  return typeof candidate === 'string' && candidate.trim() !== '' ? candidate.trim() : undefined;
};

const resolveWatchPlaybackId = (watch: WatchPostResponse | void) => {
  const candidate = watch?.playBackId;
  return typeof candidate === 'string' && candidate.trim() !== '' ? candidate.trim() : undefined;
};

const normalizeWatchProcessingStatus = (
  watch: WatchPostResponse | void,
  fallback: WatchBackendProcessingStatus
): WatchBackendProcessingStatus => {
  if (
    watch?.processingStatus === 'READY' ||
    watch?.processingStatus === 'PROCESSING' ||
    watch?.processingStatus === 'FAILED_SYNC' ||
    watch?.processingStatus === 'FAILED_REVIEW'
  ) {
    return watch.processingStatus;
  }

  if (typeof watch?.playBackId === 'string' && watch.playBackId.trim() !== '') {
    return 'READY';
  }

  return fallback;
};

const TERMINAL_WATCH_SYNC_FAILURE_REASONS = new Set<TerminalWatchSyncFailureReason>([
  'invalid_duration',
  'invalid_dimensions',
  'unsupported_aspect_ratio',
]);

const resolveWatchSyncFailureReason = (
  watch: WatchPostResponse | void
): WatchSyncFailureReason | undefined => {
  const candidate = watch?.syncFailureReason;
  return candidate === 'missing_video_track' ||
    TERMINAL_WATCH_SYNC_FAILURE_REASONS.has(candidate as TerminalWatchSyncFailureReason)
    ? (candidate as WatchSyncFailureReason)
    : undefined;
};

const classifyWatchResponse = (
  watch: WatchPostResponse | void,
  fallback: WatchBackendProcessingStatus,
  options?: {
    remoteProcessingAgeMs?: number;
  }
): ClassifiedWatchResponse => {
  if (!watch) {
    return {
      disposition: fallback === 'READY' ? 'ready' : 'pending',
      watchProcessingStatus: fallback,
    };
  }

  const watchId = resolveWatchId(watch);
  const playBackId = resolveWatchPlaybackId(watch);
  const watchProcessingStatus = normalizeWatchProcessingStatus(watch, fallback);
  const syncFailureReason = resolveWatchSyncFailureReason(watch);
  const remoteProcessingAgeMs = options?.remoteProcessingAgeMs ?? 0;
  const pendingReview =
    watch?.pendingReview === true || watch?.moderationStatus === 'PENDING_REVIEW';

  if (playBackId) {
    return {
      disposition: 'ready',
      watchId,
      playBackId,
      watchProcessingStatus: 'READY',
      syncFailureReason,
    };
  }

  if (pendingReview || watchProcessingStatus === 'FAILED_REVIEW') {
    return {
      disposition: 'submitted_for_review',
      watchId,
      watchProcessingStatus,
      syncFailureReason,
    };
  }

  if (
    watchProcessingStatus === 'FAILED_SYNC' &&
    syncFailureReason === 'missing_video_track' &&
    remoteProcessingAgeMs < MISSING_VIDEO_TRACK_GRACE_MS
  ) {
    return {
      disposition: 'grace_period_pending_sync_failure',
      watchId,
      watchProcessingStatus,
      syncFailureReason,
      downgradedByMissingVideoTrackGrace: true,
    };
  }

  if (watchProcessingStatus === 'FAILED_SYNC' && syncFailureReason) {
    return {
      disposition: 'terminal_sync_failure',
      watchId,
      watchProcessingStatus,
      syncFailureReason,
    };
  }

  if (watchProcessingStatus === 'READY') {
    return {
      disposition: 'ready',
      watchId,
      playBackId,
      watchProcessingStatus,
      syncFailureReason,
    };
  }

  return {
    disposition: 'pending',
    watchId,
    watchProcessingStatus,
    syncFailureReason,
  };
};

const resolveWatchFailureMessage = (watch: WatchPostResponse | void) => {
  const normalizedMessage = normalizeFailureMessage(watch?.message);
  if (normalizedMessage && normalizedMessage !== 'Video processing failed.') {
    return normalizedMessage;
  }

  return 'Your Watch video could not be synced from Mux.';
};

const parseTimestampMs = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const resolveRemoteProcessingAgeMs = (
  remotePollStartedAt: string | undefined,
  nowIsoString: string
) => {
  const startedAtMs = parseTimestampMs(remotePollStartedAt);
  const nowMs = parseTimestampMs(nowIsoString) ?? Date.now();
  if (typeof startedAtMs !== 'number') {
    return 0;
  }
  return Math.max(0, nowMs - startedAtMs);
};

const clampRemotePollDelay = (value: number) =>
  Math.min(Math.max(value, REMOTE_POLL_BASE_INTERVAL_MS), REMOTE_POLL_MAX_INTERVAL_MS);

const clampRetryBackoffDelay = (value: number) =>
  Math.min(Math.max(value, RETRY_BACKOFF_BASE_MS), RETRY_BACKOFF_MAX_MS);

const UINT32_MOD = 4294967296;

const hashJitterSeed = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % UINT32_MOD;
  }
  return hash;
};

const computeNextRemotePollDelayMs = (item: PendingVideoUpload) => {
  if (REMOTE_POLL_BASE_INTERVAL_MS <= 0) {
    return 0;
  }

  const attempt = Math.max(0, item.remotePollAttempt ?? 0);
  const baseDelay = clampRemotePollDelay(
    Math.round(REMOTE_POLL_BASE_INTERVAL_MS * REMOTE_POLL_MULTIPLIER ** attempt)
  );
  const jitterSeed = hashJitterSeed(`${item.id}:${attempt}`);
  const jitterRatio = ((jitterSeed % 1000) / 1000) * 2 - 1;
  return Math.round(baseDelay * (1 + jitterRatio * REMOTE_POLL_JITTER_RATIO));
};

const computeRetryBackoffDelayMs = (retryCount: number) => {
  const attempt = Math.max(0, retryCount - 1);
  return clampRetryBackoffDelay(
    Math.round(RETRY_BACKOFF_BASE_MS * RETRY_BACKOFF_MULTIPLIER ** attempt)
  );
};

const resolveNextRetryAt = (retryCount: number, nowIsoString: string) => {
  const baseTime = parseTimestampMs(nowIsoString) ?? Date.now();
  return new Date(baseTime + computeRetryBackoffDelayMs(retryCount)).toISOString();
};

const resolveNextRemotePollAt = (item: PendingVideoUpload, nowIsoString: string) => {
  const baseTime = parseTimestampMs(nowIsoString) ?? Date.now();
  return new Date(baseTime + computeNextRemotePollDelayMs(item)).toISOString();
};

const isRemotePollTimedOut = (item: PendingVideoUpload, nowIsoString: string) => {
  const startedAtMs = parseTimestampMs(item.remotePollStartedAt);
  const nowMs = parseTimestampMs(nowIsoString) ?? Date.now();
  if (!startedAtMs) {
    return false;
  }
  return nowMs - startedAtMs >= REMOTE_POLL_TIMEOUT_MS;
};

const isNativeMuxUploadItem = (item: PendingVideoUpload) =>
  item.status === 'uploading' && item.uploadTransport === 'mux_sdk';

const isNativeMuxUploadRecordActive = (record?: NativeMuxDirectUploadRecord | null) =>
  record?.state === 'uploading' || record?.state === 'paused';

const hasNativeCrashRecoveryRemaining = (item: PendingVideoUpload) =>
  (item.nativeCrashRecoveryCount ?? 0) < MAX_NATIVE_CRASH_RECOVERY_COUNT;

const buildNativeStartupFailureMessage = (record?: NativeMuxDirectUploadRecord | null) => {
  const startupStep = typeof record?.startupStep === 'string' ? record.startupStep.trim() : '';
  if (startupStep) {
    return `Native Mux upload stalled before its first callback (${startupStep}).`;
  }

  return 'Native Mux upload stalled before its first callback.';
};

const VIDEO_MODERATION_SAMPLE_FRAME_COUNT = 5;

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
  deleteFile: async (uri) => {
    if (!uri || uri.startsWith('content://')) {
      return;
    }

    try {
      await RNFS.unlink(stripFileScheme(uri));
    } catch {
      // ignore temporary file cleanup failures
    }
  },
  moderateVideo: async (recipe) => {
    const frameUris = await extractEditedFrames(recipe.sourceUri, {
      startTime: recipe.trimStartMs,
      endTime: recipe.trimEndMs,
      cropX: recipe.cropRect.x,
      cropY: recipe.cropRect.y,
      cropWidth: recipe.cropRect.width,
      cropHeight: recipe.cropRect.height,
      outputWidth: recipe.outputWidth,
      outputHeight: recipe.outputHeight,
      frameCount: VIDEO_MODERATION_SAMPLE_FRAME_COUNT,
    });

    if (frameUris.length < 1) {
      throw new Error('No video frames available for moderation.');
    }

    try {
      const payload = await Promise.all(frameUris.map((uri) => buildImageDataUri(uri)));
      const moderation = await callBackendFallbackModeration({
        type: 'video',
        content: payload,
      });
      const moderationScores = moderation.matchedCategories
        ? Object.fromEntries(
            moderation.matchedCategories.map((item) => [item.category, item.score])
          )
        : {};

      return {
        moderationDecision:
          moderation.finalAction === 'allow'
            ? 'safe'
            : moderation.finalAction === 'pending_review'
              ? 'unsure'
              : 'blocked',
        moderationScores,
        moderationError: moderation.finalAction === 'allow' ? undefined : moderation.finalAction,
      };
    } finally {
      await Promise.all(
        frameUris.map(async (uri) => {
          if (!uri || uri.startsWith('content://')) {
            return;
          }
          try {
            await RNFS.unlink(stripFileScheme(uri));
          } catch {
            // ignore temporary frame cleanup failures
          }
        })
      );
    }
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
  uploadVideo: async (processedVideoUri, options = {}) => {
    const uploadLink = await ApiCall<{
      url?: string;
      id?: string;
      message?: string;
    }>({
      route: 'watch/authenticated-link/mux',
      verb: 'get',
      token: true,
    });

    if (
      uploadLink.status < 200 ||
      uploadLink.status >= 300 ||
      !uploadLink.response?.url ||
      !uploadLink.response?.id
    ) {
      throw new QueueError(
        'network',
        uploadLink.response?.message || 'Unable to initialize video upload.',
        true
      );
    }

    if (processedVideoUri.startsWith('file://') && process.env.JEST_WORKER_ID) {
      return {
        uploadId: uploadLink.response.id,
        uploadTransport: 'raw_put_fallback',
      };
    }

    // eslint-disable-next-line global-require
    const rnFetchBlobModule = require('rn-fetch-blob');
    const RNFetchBlob = rnFetchBlobModule.default ?? rnFetchBlobModule;
    const uploadUrl = uploadLink.response.url;
    let uploadSourcePath = stripFileScheme(processedVideoUri);
    let cleanupUploadCopy: (() => Promise<void>) | null = null;

    if (processedVideoUri.startsWith('content://')) {
      const tempDirectory = RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath;
      const tempUploadPath = `${stripFileScheme(
        normalizeVideoProcessingUri(tempDirectory)
      )}/watch_upload_${Date.now()}.mp4`;
      await RNFetchBlob.fs.cp(processedVideoUri, tempUploadPath);
      uploadSourcePath = tempUploadPath;
      cleanupUploadCopy = async () => {
        try {
          await RNFS.unlink(tempUploadPath);
        } catch {
          // ignore temporary upload copy cleanup failures
        }
      };
    }

    const normalizedUploadFileUri = uploadSourcePath.startsWith('file://')
      ? uploadSourcePath
      : `file://${uploadSourcePath}`;
    const prefersNativeUpload =
      options.forceUploadTransport !== 'raw_put_fallback' &&
      (Platform.OS === 'ios' || Platform.OS === 'android') &&
      isNativeMuxDirectUploadAvailable();

    if (prefersNativeUpload) {
      try {
        await options.onNativeUploadPrepared?.({
          uploadId: uploadLink.response.id,
          uploadTransport: 'mux_sdk',
          nativeUploadState: 'uploading',
        });

        await startNativeMuxDirectUpload({
          uploadId: uploadLink.response.id,
          uploadUrl,
          fileUri: normalizedUploadFileUri,
        });

        if (cleanupUploadCopy) {
          await cleanupUploadCopy();
        }

        return {
          uploadId: uploadLink.response.id,
          uploadTransport: 'mux_sdk',
          nativeUploadState: 'success',
        };
      } catch (error) {
        const nativeError =
          error instanceof NativeMuxDirectUploadError
            ? error
            : new NativeMuxDirectUploadError(normalizeFailureMessage(error));

        if (!nativeError.startedBytes) {
          if (nativeError.code === 'startup_timeout') {
            if (cleanupUploadCopy) {
              await cleanupUploadCopy();
            }
            throw nativeError;
          }
          // fall through to the existing raw PUT implementation before any bytes have been sent
        } else {
          if (cleanupUploadCopy) {
            await cleanupUploadCopy();
          }
          throw new QueueError('network', nativeError.message, true);
        }
      }
    }

    let uploadResponse;
    try {
      uploadResponse = await RNFetchBlob.fetch(
        'PUT',
        uploadUrl,
        undefined,
        RNFetchBlob.wrap(uploadSourcePath)
      );
    } finally {
      if (cleanupUploadCopy) {
        await cleanupUploadCopy();
      }
    }
    const uploadInfo = uploadResponse?.info?.();
    if (!uploadInfo) {
      throw new QueueError('network', 'Video upload returned an empty response.', true);
    }
    const { status } = uploadInfo;
    if (status < 200 || status >= 300) {
      throw new QueueError('network', `Video upload failed (${status}).`, true);
    }

    return {
      uploadId: uploadLink.response.id,
      uploadTransport: 'raw_put_fallback',
    };
  },
  resumeNativeUploads: async () => {
    if (!isNativeMuxDirectUploadAvailable()) {
      return [];
    }

    try {
      return await resumeNativeMuxDirectUploads();
    } catch (error) {
      if (__DEV__) {
        console.log('[VideoUploadQueue]', 'resume-native-uploads-failed', error);
      }
      return [];
    }
  },
  getNativeUploads: async () => {
    if (!isNativeMuxDirectUploadAvailable()) {
      return [];
    }

    try {
      return await getNativeMuxDirectUploads();
    } catch (error) {
      if (__DEV__) {
        console.log('[VideoUploadQueue]', 'get-native-uploads-failed', error);
      }
      return [];
    }
  },
  waitForNativeUpload: async (uploadId) => {
    await waitForNativeMuxDirectUpload(uploadId);
  },
  createWatchPost: async (item) => {
    if (!item.processedWidth || !item.processedHeight) {
      throw new QueueError(
        'processing',
        'Processed video metadata is missing before watch post creation.'
      );
    }

    const aspectRatio = deriveVideoAspectRatio(item.processedWidth, item.processedHeight);
    if (!aspectRatio) {
      throw new QueueError('processing', 'Processed video aspect ratio is invalid.');
    }

    const response = await ApiCall<WatchPostResponse>({
      route: 'watch/post',
      verb: 'post',
      token: true,
      params: {
        uploadId: item.uploadId,
        content: item.recipe.caption.trim(),
        mentionedUserIds: item.recipe.mentionedUserIds ?? [],
        mentions: item.recipe.mentions ?? [],
        aspectRatio,
        videoWidth: item.processedWidth,
        videoHeight: item.processedHeight,
      },
    });

    if (response.status !== 200 && response.status !== 201) {
      const isTransientStatus =
        response.status === 408 || response.status === 429 || response.status >= 500;
      throw new QueueError(
        'network',
        response.response?.message || 'Unable to create watch post.',
        isTransientStatus
      );
    }

    queueTaggedNotificationDemo({
      notificationType: 'tagged',
      actorId: String(item.recipe.actorId ?? '').trim(),
      postId: String(
        response.response?._id ?? response.response?.postId ?? item.watchId ?? ''
      ).trim(),
      postType: 'watch',
      taggedUserIds: item.recipe.mentionedUserIds ?? [],
    }).catch(() => undefined);

    return response.response;
  },
  getWatchPostStatus: async (watchId) => {
    const response = await ApiCall<WatchPostResponse>({
      route: `watch/status/${watchId}`,
      verb: 'get',
      token: true,
    });

    if (response.status !== 200 || !response.response) {
      throw new QueueError(
        'network',
        response.response?.message || 'Unable to refresh Watch processing status.',
        true
      );
    }

    return response.response;
  },
  now: () => new Date().toISOString(),
  log: (message, payload) => {
    if (__DEV__) {
      console.log('[VideoUploadQueue]', message, payload ?? {});
    }
  },
};

export const createVideoUploadQueue = (
  overrides: Partial<QueueDependencies> = {}
): VideoUploadQueue => {
  const dependencies: QueueDependencies = {
    ...defaultDependencies,
    ...overrides,
  };
  let items: PendingVideoUpload[] = [];
  let hasHydrated = false;
  let processingPromise: Promise<void> | null = null;
  let wakeQueueResolver: (() => void) | null = null;
  const listeners = new Set<VideoUploadQueueListener>();

  const serializeItemsForStorage = (value: PendingVideoUpload[]) =>
    JSON.stringify(value.filter((item) => ACTIVE_QUEUE_STATUSES.has(item.status)));

  const notifyListeners = () => {
    const snapshot = cloneItems(items);
    listeners.forEach((listener) => {
      listener(snapshot);
    });
  };

  const getCurrentTimestampMs = () => parseTimestampMs(dependencies.now()) ?? Date.now();

  const getNextProcessableItem = () =>
    items.find((item) => {
      if (item.status !== 'queued') {
        return false;
      }

      const nextRetryAtMs = parseTimestampMs(item.nextRetryAt);
      if (!nextRetryAtMs) {
        return true;
      }

      return nextRetryAtMs <= getCurrentTimestampMs();
    }) ??
    items.find((item) => isNativeMuxUploadItem(item)) ??
    items.find((item) => {
      if (item.status !== 'processing_remote') {
        return false;
      }

      const nextPollAtMs = parseTimestampMs(item.nextRemotePollAt);
      if (!nextPollAtMs) {
        return true;
      }

      return nextPollAtMs <= getCurrentTimestampMs();
    });

  const getNextRemotePollDelay = () => {
    const now = getCurrentTimestampMs();
    const delays = items
      .filter((item) => item.status === 'processing_remote')
      .map((item) => {
        const nextPollAtMs = parseTimestampMs(item.nextRemotePollAt);
        return typeof nextPollAtMs === 'number' ? Math.max(0, nextPollAtMs - now) : 0;
      });

    if (!delays.length) {
      return null;
    }

    return Math.min(...delays);
  };

  const getNextQueuedRetryDelay = () => {
    const now = getCurrentTimestampMs();
    const delays = items
      .filter(
        (item) => item.status === 'queued' && typeof parseTimestampMs(item.nextRetryAt) === 'number'
      )
      .map((item) => {
        const nextRetryAtMs = parseTimestampMs(item.nextRetryAt)!;
        return Math.max(0, nextRetryAtMs - now);
      });

    if (!delays.length) {
      return null;
    }

    return Math.min(...delays);
  };

  const wakeQueue = () => {
    wakeQueueResolver?.();
    wakeQueueResolver = null;
  };

  const waitForWakeOrTimeout = async (timeoutMs: number) => {
    if (timeoutMs <= 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => {
        if (wakeQueueResolver === resolve) {
          wakeQueueResolver = null;
        }
        resolve();
      }, timeoutMs);

      wakeQueueResolver = () => {
        clearTimeout(timeoutId);
        wakeQueueResolver = null;
        resolve();
      };
    });
  };

  const persist = async () => {
    await dependencies.storage.setItem(
      VIDEO_UPLOAD_QUEUE_STORAGE_KEY,
      serializeItemsForStorage(items)
    );
  };

  const getItemById = (id: string) => items.find((item) => item.id === id);

  const logStage = (
    item: Pick<PendingVideoUpload, 'id' | 'status' | 'uploadId' | 'watchId'>,
    processingStage:
      | 'queued'
      | 'start'
      | 'moderation_bypassed'
      | 'exporting'
      | 'uploading'
      | 'posting'
      | 'processing_remote',
    payload?: Record<string, unknown>
  ) => {
    dependencies.log('queue-stage', {
      id: item.id,
      status: item.status,
      uploadId: item.uploadId,
      watchId: item.watchId,
      processingStage,
      ...(payload ?? {}),
    });
  };

  const cleanupItemArtifacts = async (item: PendingVideoUpload) => {
    if (item.processedVideoUri) {
      await dependencies.deleteFile(item.processedVideoUri);
    }
  };

  const logWatchResponse = (
    event: 'watch-post-response' | 'watch-status-response',
    item: PendingVideoUpload,
    watch: WatchPostResponse | void,
    classified: ClassifiedWatchResponse,
    options?: {
      remotePollStartedAt?: string;
      remoteProcessingAgeMs?: number;
    }
  ) => {
    dependencies.log(event, {
      uploadId: item.uploadId,
      watchId: classified.watchId,
      processingStatus: watch?.processingStatus,
      playBackId: resolveWatchPlaybackId(watch),
      syncFailureReason: watch?.syncFailureReason,
      remotePollStartedAt: options?.remotePollStartedAt,
      remoteProcessingAgeMs: options?.remoteProcessingAgeMs,
      message: watch?.message,
      disposition: classified.disposition,
      downgradedByMissingVideoTrackGrace: classified.downgradedByMissingVideoTrackGrace ?? false,
    });
  };

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
    notifyListeners();
    wakeQueue();
  };

  const recoverItemFromNativeStartupTimeout = async (
    item: PendingVideoUpload,
    reason: string,
    record?: NativeMuxDirectUploadRecord | null
  ) => {
    const currentItem = getItemById(item.id) ?? item;
    if (!hasNativeCrashRecoveryRemaining(currentItem)) {
      return false;
    }

    await updateItem(
      currentItem.id,
      {
        status: 'queued',
        uploadId: undefined,
        uploadTransport: undefined,
        nativeUploadState: undefined,
        forcedUploadTransport: 'raw_put_fallback',
        nativeCrashRecoveryCount: (currentItem.nativeCrashRecoveryCount ?? 0) + 1,
        nextRetryAt: undefined,
        lastError: undefined,
        failureCode: undefined,
      },
      'native-startup-recovered'
    );
    dependencies.log('native-startup-recovery', {
      id: currentItem.id,
      uploadId: currentItem.uploadId,
      reason,
      startupState: record?.startupState,
      startupStep: record?.startupStep,
      startupUpdatedAt: record?.startupUpdatedAt,
      firstCallbackAt: record?.firstCallbackAt,
    });
    return true;
  };

  const recoverItemsWithTimedOutNativeStartup = (
    source: 'hydrate' | 'resume',
    value: PendingVideoUpload[],
    nativeUploads: NativeMuxDirectUploadRecord[]
  ) => {
    const nativeUploadsById = new Map(nativeUploads.map((record) => [record.uploadId, record]));
    let didRecoverItem = false;

    const nextItems: PendingVideoUpload[] = value.map((item) => {
      if (
        !item.uploadId ||
        item.uploadTransport !== 'mux_sdk' ||
        !hasNativeCrashRecoveryRemaining(item)
      ) {
        return item;
      }

      const nativeUpload = nativeUploadsById.get(item.uploadId);
      if (!hasTimedOutNativeMuxStartup(nativeUpload)) {
        return item;
      }

      didRecoverItem = true;
      dependencies.log('native-startup-recovered-on-resume', {
        id: item.id,
        source,
        uploadId: item.uploadId,
        startupStep: nativeUpload?.startupStep,
        startupUpdatedAt: nativeUpload?.startupUpdatedAt,
      });
      return {
        ...item,
        status: 'queued',
        uploadId: undefined,
        uploadTransport: undefined,
        nativeUploadState: undefined,
        forcedUploadTransport: 'raw_put_fallback',
        nativeCrashRecoveryCount: (item.nativeCrashRecoveryCount ?? 0) + 1,
        nextRetryAt: undefined,
        updatedAt: dependencies.now(),
        lastError: undefined,
        failureCode: undefined,
      } satisfies PendingVideoUpload;
    });

    return {
      items: nextItems,
      didRecoverItem,
    };
  };

  const hydrate = async () => {
    if (hasHydrated) {
      const snapshot = cloneItems(items);
      notifyListeners();
      return snapshot;
    }

    const stored = await dependencies.storage.getItem(VIDEO_UPLOAD_QUEUE_STORAGE_KEY);
    if (!stored) {
      hasHydrated = true;
      notifyListeners();
      return [];
    }

    try {
      const parsed = JSON.parse(stored) as PendingVideoUpload[];
      if (Array.isArray(parsed)) {
        const nextItems = await Promise.all(
          parsed.map(async (item) => {
            if (!ACTIVE_QUEUE_STATUSES.has(item.status)) {
              await cleanupItemArtifacts(item);
              return null;
            }

            return normalizePendingItemForResume(item);
          })
        );
        const hydratedItems = nextItems.filter(Boolean) as PendingVideoUpload[];
        const nativeUploads = await dependencies.getNativeUploads();
        items = recoverItemsWithTimedOutNativeStartup(
          'hydrate',
          hydratedItems,
          nativeUploads
        ).items;
      } else {
        items = [];
      }
      await persist();
    } catch {
      items = [];
      await persist();
    }

    hasHydrated = true;
    const snapshot = cloneItems(items);
    notifyListeners();
    return snapshot;
  };

  const handleFailure = async (item: PendingVideoUpload, error: unknown) => {
    const failure =
      error instanceof QueueError
        ? error
        : new QueueError('processing', normalizeFailureMessage(error), false);
    const nextRetryCount = item.retryCount + 1;

    if (failure.retryable && nextRetryCount <= MAX_RETRY_COUNT) {
      const retryStatus: PendingVideoUpload['status'] =
        item.status === 'processing_remote' ? 'processing_remote' : 'queued';
      const nowIsoString = dependencies.now();

      await updateItem(
        item.id,
        {
          retryCount: nextRetryCount,
          status: retryStatus,
          nextRetryAt:
            retryStatus === 'queued' ? resolveNextRetryAt(nextRetryCount, nowIsoString) : undefined,
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
        nextRetryAt: undefined,
        lastError: failure.message,
        failureCode: failure.code,
      },
      'failed'
    );
    await cleanupItemArtifacts(item);
  };

  const moderateItem = async (item: PendingVideoUpload) => {
    if (item.moderationDecision) {
      return;
    }

    await updateItem(
      item.id,
      {
        status: 'moderating',
        nextRetryAt: undefined,
      },
      'moderating'
    );
    let moderation;
    try {
      moderation = await dependencies.moderateVideo(item.recipe);
    } catch (error) {
      throw new QueueError(
        'moderation-failed',
        normalizeFailureMessage(error) || 'Video moderation failed locally.'
      );
    }

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
      throw new QueueError('nsfw-blocked', 'Video blocked by moderation.');
    }

    if (moderation.moderationDecision === 'unsure') {
      throw new QueueError('nsfw-blocked', 'Video requires review before it can be published.');
    }

    if (moderation.moderationDecision === 'unclassified') {
      throw new QueueError(
        'moderation-failed',
        moderation.moderationError || 'Video moderation could not classify the upload.'
      );
    }
  };

  const compressItem = async (item: PendingVideoUpload) => {
    if (item.processedVideoUri && item.processedWidth && item.processedHeight) {
      return;
    }

    await updateItem(
      item.id,
      {
        status: 'compressing',
        nextRetryAt: undefined,
      },
      'compressing'
    );
    logStage(item, 'exporting', {
      sourceUri: item.recipe.sourceUri,
    });
    let exported: Awaited<ReturnType<QueueDependencies['exportVideo']>>;
    try {
      exported = await dependencies.exportVideo(item.recipe);
    } catch (error) {
      dependencies.log('export-failed', {
        id: item.id,
        uploadId: item.uploadId,
        processingStage: 'exporting',
        message: normalizeFailureMessage(error),
      });
      throw error;
    }
    dependencies.log('export-success', {
      id: item.id,
      uploadId: item.uploadId,
      processingStage: 'exporting',
      processedVideoUri: exported.processedVideoUri,
      processedDuration: exported.processedDuration,
      processedWidth: exported.processedWidth,
      processedHeight: exported.processedHeight,
    });
    const validation = await validateExportedVideoForWatch({
      recipe: item.recipe,
      exported,
      fileExists: dependencies.fileExists,
    });
    if (!validation.isValid) {
      await dependencies.deleteFile(exported.processedVideoUri);
      throw new QueueError('processing', validation.message);
    }

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
    if (item.uploadId && item.uploadTransport !== 'mux_sdk') {
      return;
    }

    if (
      item.uploadId &&
      item.uploadTransport === 'mux_sdk' &&
      item.nativeUploadState === 'success'
    ) {
      return;
    }

    if (!item.processedVideoUri) {
      throw new QueueError('processing', 'Processed video missing before upload.');
    }

    await updateItem(
      item.id,
      {
        status: 'uploading',
        nextRetryAt: undefined,
      },
      'uploading'
    );
    logStage(item, 'uploading', {
      forcedUploadTransport: item.forcedUploadTransport,
      processedVideoUri: item.processedVideoUri,
    });
    let uploaded: UploadVideoResult;
    try {
      uploaded = await dependencies.uploadVideo(item.processedVideoUri, {
        forceUploadTransport: item.forcedUploadTransport,
        onNativeUploadPrepared: async (preparedUpload) => {
          await updateItem(
            item.id,
            {
              uploadId: preparedUpload.uploadId,
              uploadTransport: preparedUpload.uploadTransport,
              nativeUploadState: preparedUpload.nativeUploadState,
              nextRetryAt: undefined,
            },
            'native-upload-started'
          );
        },
      });
    } catch (error) {
      if (
        error instanceof NativeMuxDirectUploadError &&
        error.code === 'startup_timeout' &&
        (await recoverItemFromNativeStartupTimeout(item, error.message))
      ) {
        return;
      }

      throw error;
    }
    await updateItem(
      item.id,
      {
        uploadId: uploaded.uploadId,
        uploadTransport: uploaded.uploadTransport,
        nativeUploadState: uploaded.nativeUploadState,
        forcedUploadTransport: undefined,
        nextRetryAt: undefined,
      },
      'uploaded'
    );
  };

  const postItem = async (item: PendingVideoUpload) => {
    if (!item.uploadId) {
      throw new QueueError('processing', 'Upload id missing before posting.');
    }

    await updateItem(
      item.id,
      {
        status: 'posting',
        nextRetryAt: undefined,
      },
      'posting'
    );
    logStage(item, 'posting');
    const nowIsoString = dependencies.now();
    const createdWatch = await dependencies.createWatchPost({
      ...item,
      status: 'posting',
    });
    const classifiedWatch = classifyWatchResponse(createdWatch, 'READY', {
      remoteProcessingAgeMs: 0,
    });
    const watchId = classifiedWatch.watchId ?? item.watchId;

    logWatchResponse('watch-post-response', item, createdWatch, classifiedWatch, {
      remotePollStartedAt:
        classifiedWatch.disposition === 'grace_period_pending_sync_failure'
          ? nowIsoString
          : undefined,
      remoteProcessingAgeMs: 0,
    });

    if (classifiedWatch.disposition === 'terminal_sync_failure') {
      throw new QueueError('processing', resolveWatchFailureMessage(createdWatch));
    }

    if (classifiedWatch.disposition === 'submitted_for_review') {
      const latestItem = getItemById(item.id) ?? item;
      await updateItem(
        item.id,
        {
          status: 'complete',
          watchId,
          watchProcessingStatus: classifiedWatch.watchProcessingStatus,
          playBackId: undefined,
          remotePollAttempt: undefined,
          remotePollStartedAt: undefined,
          nextRemotePollAt: undefined,
          nextRetryAt: undefined,
          lastError: undefined,
          failureCode: undefined,
        },
        'submitted-for-review'
      );
      await cleanupItemArtifacts(latestItem);
      return;
    }

    if (
      classifiedWatch.disposition === 'pending' ||
      classifiedWatch.disposition === 'grace_period_pending_sync_failure'
    ) {
      if (!watchId) {
        throw new QueueError(
          'processing',
          'Watch processing status could not be tracked after upload.'
        );
      }

      await updateItem(
        item.id,
        {
          status: 'processing_remote',
          watchId,
          watchProcessingStatus: classifiedWatch.watchProcessingStatus,
          remotePollAttempt: 0,
          remotePollStartedAt: nowIsoString,
          nextRemotePollAt: nowIsoString,
          nextRetryAt: undefined,
          lastError: undefined,
          failureCode: undefined,
        },
        'processing-remote'
      );
      return;
    }

    await updateItem(
      item.id,
      {
        status: 'complete',
        watchId,
        playBackId: classifiedWatch.playBackId,
        watchProcessingStatus: 'READY',
        remotePollAttempt: undefined,
        remotePollStartedAt: undefined,
        nextRemotePollAt: undefined,
        nextRetryAt: undefined,
        lastError: undefined,
        failureCode: undefined,
      },
      'complete'
    );
    await cleanupItemArtifacts(item);
  };

  const processNativeUploadingItem = async (item: PendingVideoUpload) => {
    if (!item.uploadId) {
      throw new QueueError('processing', 'Upload id missing while waiting for native upload.');
    }

    const nativeUploads = await dependencies.getNativeUploads();
    const currentNativeUpload = nativeUploads.find(
      (nativeUpload) => nativeUpload.uploadId === item.uploadId
    );

    if (hasTimedOutNativeMuxStartup(currentNativeUpload)) {
      if (
        await recoverItemFromNativeStartupTimeout(
          item,
          buildNativeStartupFailureMessage(currentNativeUpload),
          currentNativeUpload
        )
      ) {
        return;
      }

      throw new QueueError('network', buildNativeStartupFailureMessage(currentNativeUpload), true);
    }

    if (currentNativeUpload?.state === 'success') {
      await updateItem(
        item.id,
        {
          nativeUploadState: 'success',
          nextRetryAt: undefined,
        },
        'native-upload-success'
      );
      return;
    }

    if (currentNativeUpload?.state === 'failed') {
      throw new QueueError(
        'network',
        currentNativeUpload.errorMessage || 'Native Mux upload failed.',
        true
      );
    }

    await updateItem(
      item.id,
      {
        nativeUploadState: isNativeMuxUploadRecordActive(currentNativeUpload)
          ? currentNativeUpload?.state
          : (item.nativeUploadState ?? 'uploading'),
        nextRetryAt: undefined,
      },
      'native-upload-waiting'
    );

    try {
      await dependencies.waitForNativeUpload(item.uploadId);
    } catch (error) {
      if (
        error instanceof NativeMuxDirectUploadError &&
        error.code === 'startup_timeout' &&
        (await recoverItemFromNativeStartupTimeout(item, error.message, currentNativeUpload))
      ) {
        return;
      }

      throw error;
    }

    await updateItem(
      item.id,
      {
        nativeUploadState: 'success',
        nextRetryAt: undefined,
      },
      'native-upload-success'
    );
  };

  const processRemoteItem = async (item: PendingVideoUpload) => {
    if (!item.watchId) {
      throw new QueueError('processing', 'Watch id missing while waiting for remote processing.');
    }

    const currentItem = getItemById(item.id) ?? item;
    const nowIsoString = dependencies.now();
    const remoteProcessingAgeMs = resolveRemoteProcessingAgeMs(
      currentItem.remotePollStartedAt,
      nowIsoString
    );
    const nextRemotePollAtMs = parseTimestampMs(currentItem.nextRemotePollAt);
    if (typeof nextRemotePollAtMs === 'number' && nextRemotePollAtMs > getCurrentTimestampMs()) {
      return;
    }

    if (isRemotePollTimedOut(currentItem, nowIsoString)) {
      throw new QueueError(
        'processing',
        'Your Watch video timed out while Mux was still processing it.'
      );
    }

    let latestWatch: WatchPostResponse;
    try {
      logStage(currentItem, 'processing_remote', {
        remotePollAttempt: currentItem.remotePollAttempt ?? 0,
        nextRemotePollAt: currentItem.nextRemotePollAt,
      });
      latestWatch = await dependencies.getWatchPostStatus(item.watchId);
    } catch (error) {
      const nextAttempt = (currentItem.remotePollAttempt ?? 0) + 1;
      await updateItem(
        item.id,
        {
          status: 'processing_remote',
          watchId: currentItem.watchId,
          watchProcessingStatus: 'PROCESSING',
          remotePollAttempt: nextAttempt,
          remotePollStartedAt: currentItem.remotePollStartedAt ?? nowIsoString,
          nextRemotePollAt: resolveNextRemotePollAt(
            {
              ...currentItem,
              remotePollAttempt: nextAttempt,
            },
            nowIsoString
          ),
          lastError: undefined,
          failureCode: undefined,
        },
        'processing-remote-retry'
      );
      return;
    }

    const remoteWatch = classifyWatchResponse(latestWatch, 'PROCESSING', {
      remoteProcessingAgeMs,
    });

    logWatchResponse('watch-status-response', item, latestWatch, remoteWatch, {
      remotePollStartedAt: currentItem.remotePollStartedAt,
      remoteProcessingAgeMs,
    });

    if (remoteWatch.disposition === 'terminal_sync_failure') {
      throw new QueueError('processing', resolveWatchFailureMessage(latestWatch));
    }

    if (remoteWatch.disposition === 'submitted_for_review') {
      const latestItem = getItemById(item.id) ?? item;
      await updateItem(
        item.id,
        {
          status: 'complete',
          watchProcessingStatus: remoteWatch.watchProcessingStatus,
          watchId: remoteWatch.watchId ?? latestItem.watchId ?? item.watchId,
          playBackId: undefined,
          remotePollAttempt: undefined,
          remotePollStartedAt: undefined,
          nextRemotePollAt: undefined,
          nextRetryAt: undefined,
          lastError: undefined,
          failureCode: undefined,
        },
        'submitted-for-review'
      );
      await cleanupItemArtifacts(latestItem);
      return;
    }

    if (remoteWatch.disposition === 'ready') {
      const latestItem = getItemById(item.id) ?? item;
      await updateItem(
        item.id,
        {
          status: 'complete',
          watchProcessingStatus: 'READY',
          watchId: remoteWatch.watchId ?? latestItem.watchId ?? item.watchId,
          playBackId: remoteWatch.playBackId,
          remotePollAttempt: undefined,
          remotePollStartedAt: undefined,
          nextRemotePollAt: undefined,
          nextRetryAt: undefined,
          lastError: undefined,
          failureCode: undefined,
        },
        'complete'
      );
      await cleanupItemArtifacts(latestItem);
      return;
    }

    const nextWatchId = resolveWatchId(latestWatch) ?? item.watchId;
    const nextAttempt = (currentItem.remotePollAttempt ?? 0) + 1;
    await updateItem(
      item.id,
      {
        status: 'processing_remote',
        watchProcessingStatus: remoteWatch.watchProcessingStatus,
        watchId: nextWatchId,
        remotePollAttempt: nextAttempt,
        remotePollStartedAt: currentItem.remotePollStartedAt ?? nowIsoString,
        nextRemotePollAt: resolveNextRemotePollAt(
          {
            ...currentItem,
            remotePollAttempt: nextAttempt,
          },
          nowIsoString
        ),
        nextRetryAt: undefined,
        lastError: undefined,
        failureCode: undefined,
      },
      'processing-remote'
    );
  };

  const processSingleItem = async (nextItem: PendingVideoUpload) => {
    try {
      if (isNativeMuxUploadItem(nextItem)) {
        await processNativeUploadingItem(nextItem);
        const afterNativeUpload = getItemById(nextItem.id);
        if (!afterNativeUpload || afterNativeUpload.status === 'failed') {
          return;
        }
        if (afterNativeUpload.nativeUploadState !== 'success') {
          return;
        }
        await postItem(afterNativeUpload);
        const afterPosting = getItemById(nextItem.id);
        if (!afterPosting || afterPosting.status === 'failed') {
          return;
        }
        if (afterPosting.status === 'processing_remote') {
          await processRemoteItem(afterPosting);
        }
        return;
      }

      if (nextItem.status === 'processing_remote') {
        await processRemoteItem(nextItem);
        return;
      }

      if (!nextItem.processedVideoUri) {
        const sourceExists = await dependencies.fileExists(nextItem.recipe.sourceUri);
        if (!sourceExists) {
          throw new QueueError('missing-source', 'Selected video file is no longer available.');
        }
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
      if (afterUpload.status === 'queued' || !afterUpload.uploadId) {
        return;
      }

      await postItem(afterUpload);
      const afterPosting = getItemById(nextItem.id);
      if (!afterPosting || afterPosting.status === 'failed') {
        return;
      }

      if (afterPosting.status === 'processing_remote') {
        await processRemoteItem(afterPosting);
      }
    } catch (error) {
      const currentItem = getItemById(nextItem.id);
      if (currentItem) {
        await handleFailure(currentItem, error);
      }
    }
  };

  const processQueue = async () => {
    await hydrate();

    while (true) {
      const nextItem = getNextProcessableItem();
      if (nextItem) {
        // eslint-disable-next-line no-await-in-loop
        await processSingleItem(nextItem);
      } else {
        const nextRemoteDelay = getNextRemotePollDelay();
        const nextQueuedRetryDelay = getNextQueuedRetryDelay();
        const nextDelayCandidates = [nextRemoteDelay, nextQueuedRetryDelay].filter(
          (value): value is number => value !== null
        );
        if (!nextDelayCandidates.length) {
          return;
        }

        // eslint-disable-next-line no-await-in-loop
        await waitForWakeOrTimeout(Math.min(...nextDelayCandidates));
      }
    }
  };

  const ensureProcessing = async () => {
    if (processingPromise) {
      return processingPromise;
    }

    dependencies.log('queue-start', {
      queuedCount: items.filter((item) => item.status === 'queued').length,
      activeCount: items.length,
      processingStage: 'start',
    });
    processingPromise = processQueue()
      .catch((error) => {
        dependencies.log('queue-crashed', { message: normalizeFailureMessage(error) });
      })
      .finally(() => {
        processingPromise = null;
      });
    return processingPromise;
  };

  const start = async () => ensureProcessing();

  const enqueue = async (
    recipe: VideoEditRecipe,
    options?: {
      startImmediately?: boolean;
    }
  ) => {
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
    notifyListeners();
    wakeQueue();
    logStage(item, 'queued', {
      startImmediately: options?.startImmediately !== false,
    });
    if (options?.startImmediately !== false) {
      ensureProcessing().catch(() => undefined);
    }
    return item;
  };

  const resume = async () => {
    await hydrate();
    const nativeUploads = await dependencies.resumeNativeUploads();
    const normalized = items.map(normalizePendingItemForResume);
    items = recoverItemsWithTimedOutNativeStartup('resume', normalized, nativeUploads).items;
    await persist();
    notifyListeners();
    wakeQueue();
    await ensureProcessing();
  };

  const getItems = () => cloneItems(items);

  const waitForIdle = async () => {
    await processingPromise;
  };

  const subscribe = (listener: VideoUploadQueueListener) => {
    listeners.add(listener);
    listener(cloneItems(items));
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    hydrate,
    enqueue,
    start,
    resume,
    getItems,
    waitForIdle,
    subscribe,
  };
};

const defaultQueue = createVideoUploadQueue();

export const hydratePendingVideoUploads = () => defaultQueue.hydrate();
export const enqueuePendingVideoUpload = (
  recipe: VideoEditRecipe,
  options?: {
    startImmediately?: boolean;
  }
) => defaultQueue.enqueue(recipe, options);
export const startPendingVideoUploads = () => defaultQueue.start();
export const resumePendingVideoUploads = () => defaultQueue.resume();
export const getPendingVideoUploadsSnapshot = () => defaultQueue.getItems();
export const waitForPendingVideoUploadsIdle = () => defaultQueue.waitForIdle();
export const subscribePendingVideoUploads = (listener: VideoUploadQueueListener) =>
  defaultQueue.subscribe(listener);

export {
  MISSING_VIDEO_TRACK_GRACE_MS,
  MAX_RETRY_COUNT,
  VIDEO_UPLOAD_QUEUE_STORAGE_KEY,
  QueueError,
  normalizePendingItemForResume,
};
