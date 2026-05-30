import { VIDEO_RATIO_CONFIG } from './videoEditMath';
import type { VideoEditRecipe } from './types';

export const MAX_WATCH_VIDEO_DURATION_MS = 60_000;
export const WATCH_EXPORT_DURATION_TOLERANCE_MS = 250;
export const WATCH_ASPECT_RATIO_TOLERANCE = 0.02;

export type ExportedVideoMetadata = {
  processedVideoUri: string;
  processedDuration: number;
  processedWidth: number;
  processedHeight: number;
};

export type ExportedVideoValidationFailureReason =
  | 'missing_file'
  | 'invalid_dimensions'
  | 'invalid_duration'
  | 'invalid_aspect_ratio';

export type ExportedVideoValidationResult =
  | {
      isValid: true;
      aspectRatio: number;
    }
  | {
      isValid: false;
      reason: ExportedVideoValidationFailureReason;
      message: string;
    };

export const deriveVideoAspectRatio = (width: number, height: number) => {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return width / height;
};

export const validateExportedVideoForWatch = async ({
  recipe,
  exported,
  fileExists,
}: {
  recipe: VideoEditRecipe;
  exported: ExportedVideoMetadata;
  fileExists: (uri: string) => Promise<boolean>;
}): Promise<ExportedVideoValidationResult> => {
  const processedVideoUri = String(exported.processedVideoUri || '').trim();
  if (!processedVideoUri || !(await fileExists(processedVideoUri))) {
    return {
      isValid: false,
      reason: 'missing_file',
      message: 'Processed video file is missing after export.',
    };
  }

  if (
    !Number.isFinite(exported.processedWidth) ||
    !Number.isFinite(exported.processedHeight) ||
    exported.processedWidth <= 0 ||
    exported.processedHeight <= 0
  ) {
    return {
      isValid: false,
      reason: 'invalid_dimensions',
      message: 'Processed video dimensions are invalid.',
    };
  }

  if (!Number.isFinite(exported.processedDuration) || exported.processedDuration <= 0) {
    return {
      isValid: false,
      reason: 'invalid_duration',
      message: 'Processed video duration is invalid.',
    };
  }

  const trimDurationMs = recipe.trimDurationMs ?? recipe.trimEndMs - recipe.trimStartMs;
  const maxAllowedDurationMs = Math.min(
    MAX_WATCH_VIDEO_DURATION_MS,
    trimDurationMs + WATCH_EXPORT_DURATION_TOLERANCE_MS
  );
  if (exported.processedDuration > maxAllowedDurationMs) {
    return {
      isValid: false,
      reason: 'invalid_duration',
      message: 'Processed video duration exceeds the selected trim.',
    };
  }

  const aspectRatio = deriveVideoAspectRatio(exported.processedWidth, exported.processedHeight);
  const expectedAspectRatio = VIDEO_RATIO_CONFIG[recipe.ratioId].ratio;
  if (!aspectRatio || Math.abs(aspectRatio - expectedAspectRatio) > WATCH_ASPECT_RATIO_TOLERANCE) {
    return {
      isValid: false,
      reason: 'invalid_aspect_ratio',
      message: 'Processed video aspect ratio does not match the selected crop.',
    };
  }

  return {
    isValid: true,
    aspectRatio,
  };
};
