import { captureFromCamera } from './captureFromCamera';
import { pickFromLibrary } from './pickFromLibrary';
import type { SelectMediaOptions, SelectMediaResult } from './types';

export * from './types';
export { pickFromLibrary } from './pickFromLibrary';
export { captureFromCamera } from './captureFromCamera';

// Single entry point the Composer (and any future surface) calls to obtain
// media. Video camera capture is intentionally NOT covered here - it is owned
// by the Composer's Vision Camera modal which is a stateful component.
export const selectMedia = async (options: SelectMediaOptions): Promise<SelectMediaResult> => {
  const source = options.source ?? 'library';
  if (source === 'camera') {
    if (options.mode === 'video') {
      return {
        status: 'rejected',
        reason: 'unsupported',
        message: 'Use the Composer Vision Camera flow to record video.',
      };
    }
    return captureFromCamera({ kind: 'photo' });
  }
  return pickFromLibrary({
    mode: options.mode,
    maxCount: options.maxCount,
    maxFileSizeBytes: options.maxFileSizeBytes,
    preserveOriginal: options.preserveOriginal,
  });
};
