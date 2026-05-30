export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type UploadImageOrientationSource =
  | 'react-native-image-crop-picker'
  | 'react-native-image-picker'
  | 'unknown';

export type OrientationCanvasTransform = {
  matrix: [number, number, number, number, number, number, number, number, number];
  outputWidth: number;
  outputHeight: number;
};

const SWAPPED_ORIENTATION_VALUES = new Set<ExifOrientation>([5, 6, 7, 8]);

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

export const normalizeExifOrientation = (value: unknown): ExifOrientation | undefined => {
  const parsed = toFiniteNumber(value);
  if (!parsed) {
    return undefined;
  }

  if (parsed >= 1 && parsed <= 8) {
    return parsed as ExifOrientation;
  }

  return undefined;
};

export const extractExifOrientation = (value: unknown): ExifOrientation | undefined => {
  if (!value || typeof value !== 'object') {
    return normalizeExifOrientation(value);
  }

  const candidate = value as {
    orientation?: unknown;
    Orientation?: unknown;
    exif?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  };

  return (
    normalizeExifOrientation(candidate.orientation) ||
    normalizeExifOrientation(candidate.Orientation) ||
    normalizeExifOrientation(candidate.exif?.Orientation) ||
    normalizeExifOrientation(candidate.exif?.orientation) ||
    normalizeExifOrientation(candidate.metadata?.Orientation) ||
    normalizeExifOrientation(candidate.metadata?.orientation)
  );
};

export const resolveEditorExifOrientation = ({
  orientation,
  source = 'unknown',
  platform,
}: {
  orientation: unknown;
  source?: UploadImageOrientationSource;
  platform?: string;
}): ExifOrientation | undefined => {
  const normalizedOrientation = normalizeExifOrientation(orientation);
  if (!normalizedOrientation) {
    return undefined;
  }

  // react-native-image-crop-picker on iOS already writes normalized pixels for our
  // current JPG/compression flow, so applying the EXIF rotation again in the editor
  // produces sideways previews.
  if (platform === 'ios' && source === 'react-native-image-crop-picker') {
    return undefined;
  }

  return normalizedOrientation;
};

export const orientationSwapsDimensions = (orientation?: ExifOrientation) =>
  Boolean(orientation && SWAPPED_ORIENTATION_VALUES.has(orientation));

export const getOrientedDimensions = (
  width: number,
  height: number,
  orientation?: ExifOrientation
) => {
  if (orientationSwapsDimensions(orientation)) {
    return {
      width: height,
      height: width,
    };
  }

  return {
    width,
    height,
  };
};

export const getOrientationTransform = (
  width: number,
  height: number,
  orientation?: ExifOrientation
): OrientationCanvasTransform => {
  const { width: outputWidth, height: outputHeight } = getOrientedDimensions(
    width,
    height,
    orientation
  );

  switch (orientation) {
    case 2:
      return {
        matrix: [-1, 0, width, 0, 1, 0, 0, 0, 1],
        outputWidth,
        outputHeight,
      };
    case 3:
      return {
        matrix: [-1, 0, width, 0, -1, height, 0, 0, 1],
        outputWidth,
        outputHeight,
      };
    case 4:
      return {
        matrix: [1, 0, 0, 0, -1, height, 0, 0, 1],
        outputWidth,
        outputHeight,
      };
    case 5:
      return {
        matrix: [0, 1, 0, 1, 0, 0, 0, 0, 1],
        outputWidth,
        outputHeight,
      };
    case 6:
      return {
        matrix: [0, -1, height, 1, 0, 0, 0, 0, 1],
        outputWidth,
        outputHeight,
      };
    case 7:
      return {
        matrix: [0, -1, height, -1, 0, width, 0, 0, 1],
        outputWidth,
        outputHeight,
      };
    case 8:
      return {
        matrix: [0, 1, 0, -1, 0, width, 0, 0, 1],
        outputWidth,
        outputHeight,
      };
    case 1:
    default:
      return {
        matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        outputWidth,
        outputHeight,
      };
  }
};
