type ResizeModeValue = 'contain' | 'cover';

export const FEED_TALL_VIDEO_MAX_HEIGHT = 400;
export const BRAND_VIDEO_BACKGROUND = '#032f3c';
export const BRAND_VIDEO_BORDER = '#b3c1c5';
export const NINE_BY_SIXTEEN_RATIO = 9 / 16;
export const NINE_BY_SIXTEEN_TOLERANCE = 0.04;

export type VideoMetadataLike = {
  aspect_ratio?: string;
  aspectRatio?: number | string;
  videoWidth?: number | string;
  videoHeight?: number | string;
  playBackId?: string;
};

export type ResolvedVideoMetadata = {
  aspectRatio: number;
  aspectRatioLabel?: string;
  videoWidth?: number;
  videoHeight?: number;
  isNineBySixteen: boolean;
};

export type FeedVideoLayout = {
  frameWidth: number;
  frameHeight: number;
  resizeMode: ResizeModeValue;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  isCappedTallPreview: boolean;
  aspectRatio: number;
};

export type WatchVideoLayout = {
  frameWidth: number;
  frameHeight: number;
  resizeMode: ResizeModeValue;
  backgroundColor: string;
  isFullScreen: boolean;
  aspectRatio: number;
};

const toPositiveNumber = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const normalizeRatioLabel = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const parseAspectRatioValue = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.includes(':')) {
      const [widthRaw, heightRaw] = trimmed.split(':');
      const width = toPositiveNumber(widthRaw);
      const height = toPositiveNumber(heightRaw);
      if (width && height) {
        return width / height;
      }
    }

    return toPositiveNumber(trimmed);
  }

  return toPositiveNumber(value);
};

export const isNineBySixteenRatio = (aspectRatio?: number) => {
  if (!aspectRatio || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return false;
  }

  return Math.abs(aspectRatio - NINE_BY_SIXTEEN_RATIO) <= NINE_BY_SIXTEEN_TOLERANCE;
};

export const resolveVideoMetadata = (
  metadata: VideoMetadataLike | null | undefined,
  fallbackAspectRatio = 16 / 9
): ResolvedVideoMetadata => {
  const fromAspectRatioString = normalizeRatioLabel(metadata?.aspect_ratio);
  const explicitAspectRatio =
    parseAspectRatioValue(fromAspectRatioString) ?? parseAspectRatioValue(metadata?.aspectRatio);
  const videoWidth = toPositiveNumber(metadata?.videoWidth);
  const videoHeight = toPositiveNumber(metadata?.videoHeight);
  const derivedAspectRatio =
    explicitAspectRatio ?? (videoWidth && videoHeight ? videoWidth / videoHeight : undefined);
  const aspectRatio =
    derivedAspectRatio && Number.isFinite(derivedAspectRatio) && derivedAspectRatio > 0
      ? derivedAspectRatio
      : fallbackAspectRatio;

  return {
    aspectRatio,
    aspectRatioLabel: fromAspectRatioString,
    videoWidth,
    videoHeight,
    isNineBySixteen: isNineBySixteenRatio(aspectRatio),
  };
};

export const getFeedVideoLayout = (
  containerWidth: number,
  metadata: VideoMetadataLike | null | undefined
): FeedVideoLayout => {
  const resolvedWidth = Math.max(containerWidth, 1);
  const resolvedMetadata = resolveVideoMetadata(metadata);
  const naturalHeight = resolvedWidth / resolvedMetadata.aspectRatio;
  const isTallPreview =
    resolvedMetadata.isNineBySixteen && naturalHeight > FEED_TALL_VIDEO_MAX_HEIGHT;
  const frameHeight = isTallPreview ? FEED_TALL_VIDEO_MAX_HEIGHT : naturalHeight;

  return {
    frameWidth: resolvedWidth,
    frameHeight,
    resizeMode: 'contain',
    backgroundColor: BRAND_VIDEO_BACKGROUND,
    borderColor: BRAND_VIDEO_BORDER,
    borderWidth: 1,
    isCappedTallPreview: isTallPreview,
    aspectRatio: resolvedMetadata.aspectRatio,
  };
};

export const getWatchVideoLayout = (
  viewportWidth: number,
  viewportHeight: number,
  metadata: VideoMetadataLike | null | undefined
): WatchVideoLayout => {
  const safeViewportWidth = Math.max(viewportWidth, 1);
  const safeViewportHeight = Math.max(viewportHeight, 1);
  const resolvedMetadata = resolveVideoMetadata(metadata);

  if (resolvedMetadata.isNineBySixteen) {
    return {
      frameWidth: safeViewportWidth,
      frameHeight: safeViewportHeight,
      resizeMode: 'cover',
      backgroundColor: '#000000',
      isFullScreen: true,
      aspectRatio: resolvedMetadata.aspectRatio,
    };
  }

  const viewportRatio = safeViewportWidth / safeViewportHeight;
  const shouldFitToWidth = resolvedMetadata.aspectRatio >= viewportRatio;
  const frameWidth = shouldFitToWidth
    ? safeViewportWidth
    : Math.min(safeViewportWidth, safeViewportHeight * resolvedMetadata.aspectRatio);
  const frameHeight = shouldFitToWidth
    ? frameWidth / resolvedMetadata.aspectRatio
    : safeViewportHeight;

  return {
    frameWidth,
    frameHeight,
    resizeMode: 'contain',
    backgroundColor: BRAND_VIDEO_BACKGROUND,
    isFullScreen: false,
    aspectRatio: resolvedMetadata.aspectRatio,
  };
};
