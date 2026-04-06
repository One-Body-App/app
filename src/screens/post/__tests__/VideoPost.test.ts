/* eslint-disable import/first */
jest.mock('@/src/services/videoProcessing/videoUploadQueue', () => ({
  enqueuePendingVideoUpload: jest.fn(),
  requestPendingVideoUploadsStart: jest.fn(),
}));

import { finalizeQueuedWatchUpload, QUEUED_WATCH_UPLOAD_TOAST_MESSAGE } from '../videoPostUtils';
import type { VideoEditRecipe } from '@/src/services/videoProcessing/types';

const baseRecipe: VideoEditRecipe = {
  sourceUri: 'file:///tmp/source.mp4',
  caption: 'caption',
  trimStartMs: 0,
  trimEndMs: 20_000,
  trimDurationMs: 20_000,
  ratioId: '9:16',
  cropRect: {
    x: 0,
    y: 0,
    width: 720,
    height: 1280,
  },
  transform: {
    scale: 1,
    translateX: 0,
    translateY: 0,
  },
  sourceWidth: 1080,
  sourceHeight: 1920,
  outputWidth: 1080,
  outputHeight: 1920,
  videoBitrate: 5_000_000,
  audioBitrate: 128_000,
};

describe('VideoPost queued upload handoff', () => {
  it('enqueues the upload, shows the queued toast, delegates queue start, and exits the screen', async () => {
    const enqueueUpload = jest.fn().mockResolvedValue(undefined);
    const requestUploadStart = jest.fn();
    const showQueuedUploadToast = jest.fn();
    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    await finalizeQueuedWatchUpload({
      navigation,
      recipe: baseRecipe,
      showQueuedUploadToast,
      enqueueUpload,
      requestUploadStart,
    });

    expect(enqueueUpload).toHaveBeenCalledWith(baseRecipe, { startImmediately: false });
    expect(showQueuedUploadToast).toHaveBeenCalledWith(QUEUED_WATCH_UPLOAD_TOAST_MESSAGE, {
      type: 'success',
      placement: 'bottom',
    });
    expect(requestUploadStart).toHaveBeenCalledTimes(1);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
