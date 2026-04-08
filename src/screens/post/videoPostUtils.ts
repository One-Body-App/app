import { CommonActions } from '@react-navigation/native';
import {
  AUDIO_BITRATE,
  resolveSupportedUploadRatioId,
} from '@/src/services/videoProcessing/videoEditMath';
import { enqueuePendingVideoUpload } from '@/src/services/videoProcessing/videoUploadQueue';
import type {
  VideoCropRect,
  VideoEditRecipe,
  VideoRatioId,
  VideoTransformState,
} from '@/src/services/videoProcessing/types';

const FALLBACK_ASPECT_RATIO = 16 / 9;

export type ConfirmedVideoCropSelection = {
  cropRect: VideoCropRect;
  ratioId: VideoRatioId;
  outputWidth: number;
  outputHeight: number;
  videoBitrate: number;
  sourceWidth: number;
  sourceHeight: number;
  transform: VideoTransformState;
};

export const QUEUED_WATCH_UPLOAD_TOAST_MESSAGE =
  "Your Watch video was queued for background processing. We'll notify you when it's live.";
export const BLOCKED_WATCH_CAPTION_MESSAGE =
  'This caption violates content standards and cannot be posted to Watch.';
export const UNSUPPORTED_UPLOAD_VIDEO_RATIO_MESSAGE =
  'Only 1:1, 4:3, 16:9, and 9:16 videos can be uploaded to Watch.';

type VideoPostNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
  navigate: (routeName: string, params?: object) => void;
  dispatch: (action: unknown) => void;
};

type QueuePendingWatchUpload = typeof enqueuePendingVideoUpload;
type ShowQueuedWatchUploadToast = (
  message: string,
  options: {
    type: 'success';
    placement: 'bottom';
  }
) => void;

type ClientWatchCaptionModerationRule = {
  id: string;
  pattern: RegExp;
};

export type ClientWatchCaptionModerationResult = {
  blocked: boolean;
  matchedRuleIds: string[];
};

const CLIENT_WATCH_CAPTION_BLOCK_RULES: ClientWatchCaptionModerationRule[] = [
  {
    id: 'explicit-sexual-content',
    pattern: /\b(?:porn|xxx|onlyfans|nudes?|sex\s*tape)\b/i,
  },
  {
    id: 'sexual-violence',
    pattern: /\b(?:rape|raped|raping)\b/i,
  },
  {
    id: 'extreme-hate-slur',
    pattern: /\b(?:nigg(?:er|a)|fagg?(?:ot)?)\b/i,
  },
  {
    id: 'self-harm-threat',
    pattern: /\b(?:kill yourself|kys)\b/i,
  },
];

const sanitizeRatio = (ratio?: number) => {
  if (!Number.isFinite(ratio) || !ratio || ratio <= 0) {
    return FALLBACK_ASPECT_RATIO;
  }
  return ratio;
};

const normalizeVideoDimension = (value?: number) => {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return undefined;
  }
  return Math.round(value);
};

export const resolveInitialVideoRatioId = (
  preferredRatioId?: VideoRatioId,
  width?: number,
  height?: number
): VideoRatioId | null => {
  if (preferredRatioId) {
    return preferredRatioId;
  }

  const normalizedWidth = normalizeVideoDimension(width);
  const normalizedHeight = normalizeVideoDimension(height);
  if (!normalizedWidth || !normalizedHeight) {
    return null;
  }

  return resolveSupportedUploadRatioId(normalizedWidth, normalizedHeight);
};

export const isSuccessfulStatus = (status?: number) =>
  Number.isFinite(status) && Number(status) >= 200 && Number(status) < 300;

export const moderateWatchCaptionLocally = (
  caption: string
): ClientWatchCaptionModerationResult => {
  const normalizedCaption = String(caption ?? '').trim();
  if (!normalizedCaption) {
    return {
      blocked: false,
      matchedRuleIds: [],
    };
  }

  const matchedRuleIds = CLIENT_WATCH_CAPTION_BLOCK_RULES.filter(({ pattern }) =>
    pattern.test(normalizedCaption)
  ).map(({ id }) => id);

  return {
    blocked: matchedRuleIds.length > 0,
    matchedRuleIds,
  };
};

const ensureFileUri = (value: string) => {
  if (!value) {
    return '';
  }
  if (value.startsWith('file://') || value.startsWith('content://')) {
    return value;
  }
  return `file://${value}`;
};

const stripFileUriScheme = (value: string) =>
  value.startsWith('file://') ? value.slice(7) : value;

const getVideoFileExtension = (value: string) => {
  const cleanPath = value.split(/[?#]/)[0] || value;
  const fileName = cleanPath.split('/').pop() || cleanPath;
  const extensionMatch = fileName.match(/(\.[A-Za-z0-9]+)$/);
  return extensionMatch?.[1] || '.mp4';
};

export const copyVideoSourceToAppCache = async ({
  sourceUri,
  cachesDirectoryPath,
  temporaryDirectoryPath,
  copyFile,
  now = Date.now,
  random = Math.random,
}: {
  sourceUri: string;
  cachesDirectoryPath?: string | null;
  temporaryDirectoryPath?: string | null;
  copyFile: (sourcePath: string, targetPath: string) => Promise<void>;
  now?: () => number;
  random?: () => number;
}) => {
  const normalizedSourceUri = String(sourceUri || '').trim();
  if (!normalizedSourceUri) {
    throw new Error('Selected video file is missing.');
  }

  if (normalizedSourceUri.startsWith('content://')) {
    return normalizedSourceUri;
  }

  const sourcePath = stripFileUriScheme(normalizedSourceUri);
  const baseDirectory = String(cachesDirectoryPath || temporaryDirectoryPath || '').trim();
  if (!baseDirectory) {
    return ensureFileUri(sourcePath);
  }

  const extension = getVideoFileExtension(sourcePath);
  const targetPath = `${baseDirectory.replace(/\/+$/, '')}/onebody_watch_source_${now()}_${Math.round(
    random() * 1000
  )}${extension}`;
  await copyFile(sourcePath, targetPath);
  return ensureFileUri(targetPath);
};

export const getVideoFitSize = (
  containerWidth: number,
  containerHeight: number,
  ratio?: number
) => {
  const safeWidth = Number.isFinite(containerWidth) && containerWidth > 0 ? containerWidth : 1;
  const safeHeight =
    Number.isFinite(containerHeight) && containerHeight > 0 ? containerHeight : safeWidth;
  const safeRatio = sanitizeRatio(ratio);

  let width = safeWidth;
  let height = width / safeRatio;

  if (height > safeHeight) {
    height = safeHeight;
    width = height * safeRatio;
  }

  return { width, height, ratio: safeRatio };
};

const gcd = (a: number, b: number): number => {
  const absA = Math.abs(Math.trunc(a));
  const absB = Math.abs(Math.trunc(b));
  if (!absA || !absB) {
    return 1;
  }
  let x = absA;
  let y = absB;
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
};

export const formatAspectRatioLabel = (width?: number, height?: number, ratio?: number) => {
  if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    Number(width) > 0 &&
    Number(height) > 0
  ) {
    const roundedWidth = Math.round(Number(width));
    const roundedHeight = Math.round(Number(height));
    const divisor = gcd(roundedWidth, roundedHeight);
    const normalizedWidth = Math.max(1, Math.round(roundedWidth / divisor));
    const normalizedHeight = Math.max(1, Math.round(roundedHeight / divisor));
    if (normalizedWidth <= 40 && normalizedHeight <= 40) {
      return `${normalizedWidth}:${normalizedHeight}`;
    }
  }

  const safeRatio = sanitizeRatio(ratio);
  if (safeRatio >= 1) {
    return `${safeRatio.toFixed(2)}:1`;
  }
  return `1:${(1 / safeRatio).toFixed(2)}`;
};

export const buildPendingVideoUploadRecipe = ({
  sourceUri,
  caption,
  trimStartMs,
  trimEndMs,
  trimDurationMs,
  confirmedCropSelection,
}: {
  sourceUri: string;
  caption: string;
  trimStartMs: number;
  trimEndMs: number;
  trimDurationMs: number;
  confirmedCropSelection: ConfirmedVideoCropSelection;
}): VideoEditRecipe => {
  const normalizedSourceUri = String(sourceUri || '').trim();
  if (!normalizedSourceUri) {
    throw new Error('Selected video file is missing.');
  }

  if (!confirmedCropSelection?.sourceWidth || !confirmedCropSelection?.sourceHeight) {
    throw new Error('Video crop settings are incomplete.');
  }

  if (
    !Number.isFinite(trimStartMs) ||
    !Number.isFinite(trimEndMs) ||
    trimEndMs <= trimStartMs ||
    trimDurationMs <= 0
  ) {
    throw new Error('Video trim settings are invalid.');
  }

  return {
    sourceUri: normalizedSourceUri,
    caption: String(caption ?? ''),
    trimStartMs,
    trimEndMs,
    trimDurationMs,
    ratioId: confirmedCropSelection.ratioId,
    cropRect: confirmedCropSelection.cropRect,
    transform: confirmedCropSelection.transform,
    sourceWidth: confirmedCropSelection.sourceWidth,
    sourceHeight: confirmedCropSelection.sourceHeight,
    outputWidth: confirmedCropSelection.outputWidth,
    outputHeight: confirmedCropSelection.outputHeight,
    videoBitrate: confirmedCropSelection.videoBitrate,
    audioBitrate: AUDIO_BITRATE,
  };
};

const navigateAfterQueueingWatchUpload = (navigation: VideoPostNavigation) => {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'MainRoot',
          params: {
            screen: 'Main',
            params: {
              screen: 'HomeTab',
              params: {
                screen: 'Home',
                params: {},
              },
            },
          },
        } as never,
      ],
    })
  );
};

export const finalizeQueuedWatchUpload = async ({
  navigation,
  recipe,
  showQueuedUploadToast,
  enqueueUpload = enqueuePendingVideoUpload,
}: {
  navigation: VideoPostNavigation;
  recipe: VideoEditRecipe;
  showQueuedUploadToast: ShowQueuedWatchUploadToast;
  enqueueUpload?: QueuePendingWatchUpload;
}) => {
  await enqueueUpload(recipe, { startImmediately: false });

  showQueuedUploadToast(QUEUED_WATCH_UPLOAD_TOAST_MESSAGE, {
    type: 'success',
    placement: 'bottom',
  });

  navigateAfterQueueingWatchUpload(navigation);
};
