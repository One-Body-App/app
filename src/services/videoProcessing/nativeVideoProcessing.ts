import {
  extractEditedFrames as nativeExtractEditedFrames,
  exportEditedVideo as nativeExportEditedVideo,
} from 'react-native-video-trim';
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

export const extractEditedFrames = async (url: string, options: EditedFrameOptions) => {
  const framePaths = await nativeVideoTrim.extractEditedFrames(url, options);
  return framePaths.map(normalizeVideoProcessingUri);
};

export const exportEditedVideo = async (url: string, options: ExportVideoOptions) => {
  const result = await nativeVideoTrim.exportEditedVideo(url, options);
  return {
    ...result,
    outputPath: normalizeVideoProcessingUri(result.outputPath),
  };
};
