import { AUDIO_BITRATE } from '@/src/services/videoProcessing/videoEditMath';
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

const sanitizeRatio = (ratio?: number) => {
  if (!Number.isFinite(ratio) || !ratio || ratio <= 0) {
    return FALLBACK_ASPECT_RATIO;
  }
  return ratio;
};

export const isSuccessfulStatus = (status?: number) =>
  Number.isFinite(status) && Number(status) >= 200 && Number(status) < 300;

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
