import { Platform } from 'react-native';
import { type Asset, type CameraOptions, launchCamera } from 'react-native-image-picker';
import { requestExternalWritePermission } from '@/utils/ImageAndCamera';
import {
  CLIENT_IMAGE_MAX_HEIGHT,
  CLIENT_IMAGE_MAX_WIDTH,
  CLIENT_IMAGE_PICKER_QUALITY,
} from '@/src/screens/post/uploadImageConfig';
import { extractExifOrientation } from '@/src/screens/post/uploadImageOrientation';
import type { SelectedMedia, SelectMediaResult } from './types';

type CaptureFromCameraOptions = {
  // For now we only support photo capture through this helper. Video capture
  // is owned by the Composer's full-screen Vision Camera modal because it is
  // a stateful, long-lived component flow rather than a one-shot call.
  kind: 'photo';
};

const newId = (): string =>
  `mi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeUri = (rawPath?: string): string => {
  if (!rawPath) {
    return '';
  }
  if (
    rawPath.startsWith('file://') ||
    rawPath.startsWith('content://') ||
    rawPath.startsWith('ph://')
  ) {
    return rawPath;
  }
  return `file://${rawPath}`;
};

const ensureJpegName = (name: string, index: number): string => {
  if (!name) {
    return `image_${Date.now()}_${index}.jpg`;
  }
  if (name.toLowerCase().endsWith('.jpg') || name.toLowerCase().endsWith('.jpeg')) {
    return name;
  }
  const base = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
  return `${base}.jpg`;
};

const toSelectedMedia = (asset: Asset, index: number): SelectedMedia | null => {
  if (!asset?.uri) {
    return null;
  }
  return {
    id: newId(),
    kind: 'photo',
    uri: normalizeUri(asset.uri),
    fileName: ensureJpegName(asset.fileName ?? '', index),
    fileSize: typeof asset.fileSize === 'number' ? asset.fileSize : undefined,
    type: asset.type ?? 'image/jpeg',
    width: typeof asset.width === 'number' ? asset.width : undefined,
    height: typeof asset.height === 'number' ? asset.height : undefined,
    exifOrientation: extractExifOrientation(asset),
    source: 'camera',
  };
};

export const captureFromCamera = async (
  options: CaptureFromCameraOptions
): Promise<SelectMediaResult> => {
  if (options.kind !== 'photo') {
    return {
      status: 'rejected',
      reason: 'unsupported',
      message: 'Video capture is handled by the Composer Vision Camera modal.',
    };
  }

  const hasStoragePermission = await requestExternalWritePermission();
  if (!hasStoragePermission) {
    return {
      status: 'rejected',
      reason: 'permission',
      message: 'Storage permission denied.',
    };
  }

  const cameraOptions: CameraOptions = {
    mediaType: 'photo',
    quality: CLIENT_IMAGE_PICKER_QUALITY,
    maxWidth: CLIENT_IMAGE_MAX_WIDTH,
    maxHeight: CLIENT_IMAGE_MAX_HEIGHT,
    includeExtra: true,
    // iOS prefers a presentation style; Android ignores this.
    ...(Platform.OS === 'ios' ? { presentationStyle: 'fullScreen' } : {}),
  };

  const response = await launchCamera(cameraOptions);

  if (response.didCancel) {
    return { status: 'cancelled' };
  }
  if (response.errorCode === 'permission') {
    return { status: 'rejected', reason: 'permission', message: response.errorMessage };
  }
  if (response.errorCode === 'camera_unavailable') {
    return {
      status: 'rejected',
      reason: 'unsupported',
      message: response.errorMessage ?? 'Camera unavailable on this device.',
    };
  }
  if (response.errorCode) {
    return { status: 'rejected', reason: 'error', message: response.errorMessage };
  }

  const items: SelectedMedia[] = (response.assets ?? [])
    .map((asset, index) => toSelectedMedia(asset, index))
    .filter((entry): entry is SelectedMedia => entry !== null);

  if (items.length === 0) {
    return { status: 'cancelled' };
  }
  return { status: 'ok', items };
};
