import ImagePicker, {
  type Image as ImageCropPickerImage,
  type Video as ImageCropPickerVideo,
} from 'react-native-image-crop-picker';
import { Platform } from 'react-native';
import {
  CLIENT_IMAGE_MAX_HEIGHT,
  CLIENT_IMAGE_MAX_WIDTH,
  CLIENT_IMAGE_PICKER_QUALITY,
} from '@/src/screens/post/uploadImageConfig';
import {
  extractExifOrientation,
  resolveEditorExifOrientation,
} from '@/src/screens/post/uploadImageOrientation';
import {
  DEFAULT_MAX_COUNT,
  DEFAULT_MAX_FILE_SIZE_BYTES,
  type SelectedMedia,
  type SelectMediaMode,
  type SelectMediaResult,
} from './types';

type PickFromLibraryOptions = {
  mode: SelectMediaMode;
  maxCount?: number;
  maxFileSizeBytes?: number;
  preserveOriginal?: boolean;
};

type PickedAsset = ImageCropPickerImage | ImageCropPickerVideo;

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

const inferKind = (asset: PickedAsset): 'photo' | 'video' => {
  const mime = asset.mime ?? '';
  if (mime.startsWith('video/')) {
    return 'video';
  }
  if (mime.startsWith('image/')) {
    return 'photo';
  }
  // image-crop-picker also exposes a `duration` on videos.
  return (asset as ImageCropPickerVideo).duration ? 'video' : 'photo';
};

const inferFileName = (asset: PickedAsset, kind: 'photo' | 'video', index: number): string => {
  const existing = asset.filename;
  if (existing) {
    return existing;
  }
  const stamp = `${Date.now()}_${index}`;
  return kind === 'video' ? `video_${stamp}.mp4` : `image_${stamp}.jpg`;
};

const ensureJpegName = (name: string): string => {
  if (name.toLowerCase().endsWith('.jpg') || name.toLowerCase().endsWith('.jpeg')) {
    return name;
  }
  const base = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
  return `${base}.jpg`;
};

const toSelectedMedia = (
  asset: PickedAsset,
  index: number,
  preserveOriginal: boolean
): SelectedMedia | null => {
  if (!asset?.path) {
    return null;
  }
  const kind = inferKind(asset);
  const baseFileName = inferFileName(asset, kind, index);
  const fileName =
    kind === 'photo' && !preserveOriginal ? ensureJpegName(baseFileName) : baseFileName;
  const mime = asset.mime || (kind === 'photo' ? 'image/jpeg' : 'video/mp4');
  return {
    id: newId(),
    kind,
    uri: normalizeUri(asset.path),
    fileName,
    fileSize: typeof asset.size === 'number' ? asset.size : undefined,
    type: mime,
    width: typeof asset.width === 'number' ? asset.width : undefined,
    height: typeof asset.height === 'number' ? asset.height : undefined,
    durationMs:
      kind === 'video' && typeof (asset as ImageCropPickerVideo).duration === 'number'
        ? Math.max(0, Math.round((asset as ImageCropPickerVideo).duration ?? 0))
        : undefined,
    exifOrientation:
      kind === 'photo'
        ? resolveEditorExifOrientation({
            orientation: extractExifOrientation(asset as ImageCropPickerImage),
            source: 'react-native-image-crop-picker',
            platform: Platform.OS,
          })
        : undefined,
    source: 'library',
  };
};

const resolveMediaTypeOption = (mode: SelectMediaMode): 'photo' | 'video' | 'any' => {
  if (mode === 'photo') return 'photo';
  if (mode === 'video') return 'video';
  return 'any';
};

export const pickFromLibrary = async (
  options: PickFromLibraryOptions
): Promise<SelectMediaResult> => {
  const mediaType = resolveMediaTypeOption(options.mode);
  const maxCount = options.maxCount ?? DEFAULT_MAX_COUNT;
  const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
  const preserveOriginal = Boolean(options.preserveOriginal);
  const supportsMultiple = mediaType !== 'video' && maxCount > 1;

  try {
    const selection = await ImagePicker.openPicker({
      // Mixed selection: image-crop-picker accepts 'any', which returns photos and videos together.
      mediaType: mediaType as 'photo' | 'video' | 'any',
      multiple: supportsMultiple,
      maxFiles: supportsMultiple ? maxCount : undefined,
      compressImageQuality: preserveOriginal ? undefined : CLIENT_IMAGE_PICKER_QUALITY,
      compressImageMaxWidth: preserveOriginal ? undefined : CLIENT_IMAGE_MAX_WIDTH,
      compressImageMaxHeight: preserveOriginal ? undefined : CLIENT_IMAGE_MAX_HEIGHT,
      forceJpg: preserveOriginal ? undefined : true,
      includeExif: true,
    });

    const assets: PickedAsset[] = Array.isArray(selection) ? selection : [selection];
    const items: SelectedMedia[] = [];
    for (let index = 0; index < assets.length; index += 1) {
      const asset = assets[index];
      const candidate = toSelectedMedia(asset, index, preserveOriginal);
      if (candidate) {
        if (typeof candidate.fileSize === 'number' && candidate.fileSize > maxFileSizeBytes) {
          return {
            status: 'rejected',
            reason: 'too-large',
            message: `File "${candidate.fileName ?? 'item'}" exceeds the ${Math.round(
              maxFileSizeBytes / (1024 * 1024)
            )} MB limit.`,
          };
        }
        items.push(candidate);
      }
    }

    if (items.length === 0) {
      return { status: 'cancelled' };
    }
    return { status: 'ok', items };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (
      message.includes('cancelled') ||
      message.includes('canceled') ||
      message.includes('User cancelled')
    ) {
      return { status: 'cancelled' };
    }
    if (message.toLowerCase().includes('permission')) {
      return { status: 'rejected', reason: 'permission', message };
    }
    return { status: 'rejected', reason: 'error', message };
  }
};
