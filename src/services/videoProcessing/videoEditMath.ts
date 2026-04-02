import { VideoCropRect, VideoDimensions, VideoRatioId, VideoTransformState } from './types';

export const SUPPORTED_VIDEO_RATIO_IDS: VideoRatioId[] = ['1:1', '4:3', '16:9', '9:16'];

export const MIN_VIDEO_EDITOR_SCALE = 1;
export const MAX_VIDEO_EDITOR_SCALE = 6;

export const VIDEO_RATIO_CONFIG = {
  '1:1': {
    ratio: 1,
    outputWidth: 1080,
    outputHeight: 1080,
    videoBitrate: 3_500_000,
  },
  '4:3': {
    ratio: 4 / 3,
    outputWidth: 1440,
    outputHeight: 1080,
    videoBitrate: 4_000_000,
  },
  '16:9': {
    ratio: 16 / 9,
    outputWidth: 1920,
    outputHeight: 1080,
    videoBitrate: 5_000_000,
  },
  '9:16': {
    ratio: 9 / 16,
    outputWidth: 1080,
    outputHeight: 1920,
    videoBitrate: 5_000_000,
  },
} satisfies Record<
  VideoRatioId,
  {
    ratio: number;
    outputWidth: number;
    outputHeight: number;
    videoBitrate: number;
  }
>;

export const AUDIO_BITRATE = 128_000;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const resolveCropRect = (
  containerWidth: number,
  containerHeight: number,
  ratioId: VideoRatioId
): VideoCropRect => {
  const { ratio } = VIDEO_RATIO_CONFIG[ratioId];
  const safeWidth = Math.max(1, containerWidth);
  const safeHeight = Math.max(1, containerHeight);

  let cropWidth = safeWidth;
  let cropHeight = cropWidth / ratio;
  if (cropHeight > safeHeight) {
    cropHeight = safeHeight;
    cropWidth = cropHeight * ratio;
  }

  return {
    x: (safeWidth - cropWidth) / 2,
    y: (safeHeight - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
};

export const resolveCoverSize = (
  sourceWidth: number,
  sourceHeight: number,
  cropWidth: number,
  cropHeight: number
) => {
  const scale = Math.max(cropWidth / sourceWidth, cropHeight / sourceHeight);
  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
    scale,
  };
};

export const clampVideoTransform = (
  transform: VideoTransformState,
  source: VideoDimensions,
  cropRect: VideoCropRect
): VideoTransformState => {
  if (!source.width || !source.height || !cropRect.width || !cropRect.height) {
    return {
      scale: MIN_VIDEO_EDITOR_SCALE,
      translateX: 0,
      translateY: 0,
    };
  }

  const safeScale = clamp(transform.scale, MIN_VIDEO_EDITOR_SCALE, MAX_VIDEO_EDITOR_SCALE);
  const cover = resolveCoverSize(source.width, source.height, cropRect.width, cropRect.height);
  const drawWidth = cover.width * safeScale;
  const drawHeight = cover.height * safeScale;

  const horizontalSlack = Math.max(0, (drawWidth - cropRect.width) / 2);
  const verticalSlack = Math.max(0, (drawHeight - cropRect.height) / 2);

  return {
    scale: safeScale,
    translateX: clamp(transform.translateX, -horizontalSlack, horizontalSlack),
    translateY: clamp(transform.translateY, -verticalSlack, verticalSlack),
  };
};

export const resolveDisplayedVideoFrame = (
  source: VideoDimensions,
  cropRect: VideoCropRect,
  transform: VideoTransformState
) => {
  const cover = resolveCoverSize(source.width, source.height, cropRect.width, cropRect.height);
  const drawWidth = cover.width * transform.scale;
  const drawHeight = cover.height * transform.scale;
  return {
    x: cropRect.x + cropRect.width / 2 - drawWidth / 2 + transform.translateX,
    y: cropRect.y + cropRect.height / 2 - drawHeight / 2 + transform.translateY,
    width: drawWidth,
    height: drawHeight,
  };
};

export const resolveSourceCrop = (
  source: VideoDimensions,
  cropRect: VideoCropRect,
  transform: VideoTransformState
) => {
  const cover = resolveCoverSize(source.width, source.height, cropRect.width, cropRect.height);
  const effectiveScale = cover.scale * transform.scale;
  const sourceCropWidth = cropRect.width / effectiveScale;
  const sourceCropHeight = cropRect.height / effectiveScale;
  const left = (source.width - sourceCropWidth) / 2 - transform.translateX / effectiveScale;
  const top = (source.height - sourceCropHeight) / 2 - transform.translateY / effectiveScale;

  return {
    cropX: clamp(left, 0, source.width - sourceCropWidth),
    cropY: clamp(top, 0, source.height - sourceCropHeight),
    cropWidth: clamp(sourceCropWidth, 2, source.width),
    cropHeight: clamp(sourceCropHeight, 2, source.height),
  };
};

export const createDefaultVideoTransform = (): VideoTransformState => ({
  scale: MIN_VIDEO_EDITOR_SCALE,
  translateX: 0,
  translateY: 0,
});

export const resolveClosestVideoRatioId = (
  width?: number,
  height?: number,
  fallbackRatioId: VideoRatioId = '9:16'
): VideoRatioId => {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !width ||
    !height ||
    width <= 0 ||
    height <= 0
  ) {
    return fallbackRatioId;
  }

  const targetRatio = width / height;
  return SUPPORTED_VIDEO_RATIO_IDS.reduce((closestRatioId, ratioId) => {
    const currentDelta = Math.abs(VIDEO_RATIO_CONFIG[ratioId].ratio - targetRatio);
    const bestDelta = Math.abs(VIDEO_RATIO_CONFIG[closestRatioId].ratio - targetRatio);
    return currentDelta < bestDelta ? ratioId : closestRatioId;
  }, fallbackRatioId);
};

export const resolveModerationFrameCount = (durationMs: number) => {
  const seconds = Math.max(1, durationMs / 1000);
  return Math.min(10, Math.max(2, Math.round(seconds)));
};
