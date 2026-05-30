import {
  extractEditedFrames as nativeExtractEditedFrames,
  exportEditedVideo as nativeExportEditedVideo,
} from 'react-native-video-trim';
import { Platform } from 'react-native';
import type {
  EditedFrameOptions,
  ExportedVideoResult,
  ExportVideoOptions,
} from 'react-native-video-trim';

const ensureFileUri = (value: string) => {
  if (!value) {
    return '';
  }
  if (value.startsWith('file://') || value.startsWith('content://')) {
    return value;
  }
  return `file://${value}`;
};

export const normalizeVideoProcessingUri = (value?: string | null) => {
  if (!value) {
    return '';
  }
  return ensureFileUri(value);
};

export const stripFileScheme = (value: string) =>
  value.startsWith('file://') ? value.slice(7) : value;

type NativeVideoTrimModule = {
  extractEditedFrames: (url: string, options: EditedFrameOptions) => Promise<string[]>;
  exportEditedVideo: (url: string, options: ExportVideoOptions) => Promise<ExportedVideoResult>;
};

const nativeVideoTrim = {
  extractEditedFrames: nativeExtractEditedFrames,
  exportEditedVideo: nativeExportEditedVideo,
} as NativeVideoTrimModule;

const logVideoProcessing = (message: string, payload?: Record<string, unknown>) => {
  if (__DEV__) {
    console.log('[NativeVideoProcessing]', message, payload ?? {});
  }
};

const getUriScheme = (value: string) => {
  if (value.startsWith('content://')) {
    return 'content';
  }
  if (value.startsWith('file://')) {
    return 'file';
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return 'remote';
  }
  return 'path';
};

export const extractEditedFrames = async (url: string, options: EditedFrameOptions) => {
  const framePaths = await nativeVideoTrim.extractEditedFrames(url, options);
  return framePaths.map(normalizeVideoProcessingUri);
};

export const exportEditedVideo = async (url: string, options: ExportVideoOptions) => {
  const encoder = Platform.OS === 'ios' || Platform.OS === 'android' ? 'mpeg4' : 'platform-default';
  logVideoProcessing('export-start', {
    encoder,
    inputScheme: getUriScheme(url),
    trimStartMs: options.startTime,
    trimEndMs: options.endTime,
    cropRect: {
      x: options.cropX,
      y: options.cropY,
      width: options.cropWidth,
      height: options.cropHeight,
    },
    outputSize: {
      width: options.outputWidth,
      height: options.outputHeight,
    },
    videoBitrate: options.videoBitrate,
    audioBitrate: options.audioBitrate,
  });

  try {
    const result = await nativeVideoTrim.exportEditedVideo(url, options);
    const normalizedResult = {
      ...result,
      outputPath: normalizeVideoProcessingUri(result.outputPath),
    };
    logVideoProcessing('export-success', {
      encoder,
      outputPath: normalizedResult.outputPath,
      durationMs: normalizedResult.duration,
      width: normalizedResult.width,
      height: normalizedResult.height,
    });
    return normalizedResult;
  } catch (error) {
    logVideoProcessing('export-failed', {
      encoder,
      inputScheme: getUriScheme(url),
      message: error instanceof Error ? error.message : String(error ?? ''),
    });
    throw error;
  }
};
