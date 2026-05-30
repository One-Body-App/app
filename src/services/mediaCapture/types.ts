export type MediaSourceKind = 'library' | 'camera';

export type CapturedMediaKind = 'photo' | 'video';

export type SelectedMedia = {
  id: string;
  kind: CapturedMediaKind;
  uri: string;
  fileName?: string;
  fileSize?: number;
  // MIME type, e.g. "image/jpeg", "video/mp4".
  type?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  // 1..8, as defined by EXIF. Only present for photos when the library returns it.
  exifOrientation?: number;
  source: MediaSourceKind;
};

export type SelectMediaMode = 'photo' | 'video' | 'mixed';

export type SelectMediaOptions = {
  // Whether the picker should produce photos, videos, or accept either.
  mode: SelectMediaMode;
  // Where the media should come from. Defaults to 'library'.
  source?: MediaSourceKind;
  // Max items the user can pick at once (library only). Defaults to 10.
  maxCount?: number;
  // Reject any single asset larger than this. Defaults to 50 MB.
  maxFileSizeBytes?: number;
  // Bypass JPEG-conversion / EXIF normalization. Defaults to false.
  preserveOriginal?: boolean;
};

export type SelectMediaResult =
  | { status: 'cancelled' }
  | {
      status: 'rejected';
      reason: 'too-large' | 'unsupported' | 'permission' | 'error';
      message?: string;
    }
  | { status: 'ok'; items: SelectedMedia[] };

export const DEFAULT_MAX_COUNT = 10;
export const DEFAULT_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
