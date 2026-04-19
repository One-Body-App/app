import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import VideoProcessingRuntime, {
  collectPendingVideoUploadToastEvents,
  getPendingVideoUploadToastEvent,
  shouldAutoResumePendingVideoUploads,
  shouldStartPendingVideoUploadsOnRuntime,
  shouldResumePendingVideoUploadsOnLifecycle,
  VIDEO_UPLOAD_RESUME_DELAY_MS,
} from '../VideoProcessingRuntime';
import type { PendingVideoUpload } from '@/src/services/videoProcessing/types';

jest.mock('@/src/services/videoProcessing/videoUploadQueue', () => ({
  getPendingVideoUploadsSnapshot: jest.fn(() => []),
  hydratePendingVideoUploads: jest.fn(async () => []),
  startPendingVideoUploads: jest.fn().mockResolvedValue(undefined),
  resumePendingVideoUploads: jest.fn().mockResolvedValue(undefined),
  subscribePendingVideoUploads: jest.fn(() => () => undefined),
}));

const createPendingUpload = (overrides: Partial<PendingVideoUpload> = {}): PendingVideoUpload => ({
  id: 'pending-watch-1',
  status: 'queued',
  retryCount: 0,
  createdAt: '2026-03-07T10:00:00.000Z',
  updatedAt: '2026-03-07T10:00:00.000Z',
  recipe: {
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
  },
  ...overrides,
});

describe('VideoProcessingRuntime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('auto-resumes uploads on both iOS and Android', () => {
    expect(shouldAutoResumePendingVideoUploads('ios')).toBe(true);
    expect(shouldAutoResumePendingVideoUploads('android')).toBe(true);
  });

  it('starts queued uploads only when queued work exists', () => {
    expect(shouldStartPendingVideoUploadsOnRuntime([createPendingUpload()])).toBe(true);
    expect(
      shouldStartPendingVideoUploadsOnRuntime([
        createPendingUpload({
          status: 'processing_remote',
          watchProcessingStatus: 'PROCESSING',
        }),
      ])
    ).toBe(false);
  });

  it('resumes only remote or native in-flight uploads on lifecycle events', () => {
    expect(shouldResumePendingVideoUploadsOnLifecycle([createPendingUpload()])).toBe(false);
    expect(
      shouldResumePendingVideoUploadsOnLifecycle([
        createPendingUpload({
          status: 'processing_remote',
          watchProcessingStatus: 'PROCESSING',
        }),
      ])
    ).toBe(true);
    expect(
      shouldResumePendingVideoUploadsOnLifecycle([
        createPendingUpload({
          status: 'uploading',
          uploadTransport: 'mux_sdk',
          nativeUploadState: 'uploading',
        }),
      ])
    ).toBe(true);
  });

  it('hydrates on mount and resumes only on eligible foreground transitions', async () => {
    const onResumeUploads = jest.fn().mockResolvedValue(undefined);
    const onStartUploads = jest.fn().mockResolvedValue(undefined);
    const onHydrateUploads = jest.fn(async () => []);
    const getUploadsSnapshot = jest.fn().mockReturnValue([
      createPendingUpload({
        status: 'processing_remote',
        watchProcessingStatus: 'PROCESSING',
      }),
    ]);
    const remove = jest.fn();
    let appStateHandler: ((nextAppState: string) => void) | undefined;

    const appState = {
      currentState: 'active',
      addEventListener: jest.fn((_eventName: string, handler: (nextAppState: string) => void) => {
        appStateHandler = handler;
        return { remove };
      }),
    };
    const interactionManager = {
      runAfterInteractions: jest.fn((callback: () => void) => {
        callback();
        return { cancel: jest.fn() };
      }),
    };

    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <VideoProcessingRuntime
          platformOS="ios"
          appState={appState as any}
          interactionManager={interactionManager as any}
          onStartUploads={onStartUploads}
          onResumeUploads={onResumeUploads}
          onHydrateUploads={onHydrateUploads}
          getUploadsSnapshot={getUploadsSnapshot}
        />
      );
    });
    expect(tree!.toJSON()).toBeNull();

    expect(onHydrateUploads).toHaveBeenCalledTimes(1);
    expect(onStartUploads).toHaveBeenCalledTimes(0);
    expect(onResumeUploads).toHaveBeenCalledTimes(0);

    await act(async () => {
      appStateHandler?.('background');
      appStateHandler?.('active');
      jest.advanceTimersByTime(VIDEO_UPLOAD_RESUME_DELAY_MS);
    });

    expect(onResumeUploads).toHaveBeenCalledTimes(1);

    await act(async () => {
      tree!.unmount();
    });

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('starts queued uploads after hydration and queued snapshot updates settle', async () => {
    const onStartUploads = jest.fn().mockResolvedValue(undefined);
    const hydratedItems = [createPendingUpload()];
    const onHydrateUploads = jest.fn(async () => hydratedItems);
    const remove = jest.fn();
    let uploadsListener: ((items: PendingVideoUpload[]) => void) | undefined;

    const subscribeToUploads = jest.fn((listener: (items: PendingVideoUpload[]) => void) => {
      uploadsListener = listener;
      listener([]);
      return () => undefined;
    });
    const appState = {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove })),
    };
    const interactionManager = {
      runAfterInteractions: jest.fn((callback: () => void) => {
        callback();
        return { cancel: jest.fn() };
      }),
    };

    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <VideoProcessingRuntime
          platformOS="ios"
          appState={appState as any}
          interactionManager={interactionManager as any}
          onStartUploads={onStartUploads}
          onHydrateUploads={onHydrateUploads}
          subscribeToUploads={subscribeToUploads}
        />
      );
    });

    await act(async () => {
      jest.advanceTimersByTime(VIDEO_UPLOAD_RESUME_DELAY_MS);
    });

    expect(onStartUploads).toHaveBeenCalledTimes(1);

    await act(async () => {
      uploadsListener?.(hydratedItems);
      jest.advanceTimersByTime(VIDEO_UPLOAD_RESUME_DELAY_MS);
    });

    expect(onStartUploads).toHaveBeenCalledTimes(2);

    await act(async () => {
      tree!.unmount();
    });
  });

  it('publishes completed uploads once when a success event is delivered', async () => {
    let uploadsListener: ((items: PendingVideoUpload[]) => void) | undefined;
    const onCompleteUpload = jest.fn();
    const subscribeToUploads = jest.fn((listener: (items: PendingVideoUpload[]) => void) => {
      uploadsListener = listener;
      return () => undefined;
    });
    const appState = {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    };

    await act(async () => {
      TestRenderer.create(
        <VideoProcessingRuntime
          platformOS="ios"
          appState={appState as any}
          subscribeToUploads={subscribeToUploads}
          onCompleteUpload={onCompleteUpload}
        />
      );
    });

    const completedItem = createPendingUpload({
      status: 'complete',
      playBackId: 'playback-1',
    });

    await act(async () => {
      uploadsListener?.([completedItem]);
    });

    await act(async () => {
      uploadsListener?.([completedItem]);
    });

    expect(onCompleteUpload).toHaveBeenCalledTimes(1);
    expect(onCompleteUpload).toHaveBeenCalledWith(completedItem);
  });

  it('builds a success toast event for completed uploads', () => {
    expect(
      getPendingVideoUploadToastEvent(
        createPendingUpload({
          status: 'complete',
        })
      )
    ).toEqual({
      dedupeKey: 'pending-watch-1:complete',
      message: 'Your Watch video is live.',
      type: 'success',
    });
  });

  it('builds a review toast event for completed uploads awaiting moderation', () => {
    expect(
      getPendingVideoUploadToastEvent(
        createPendingUpload({
          status: 'complete',
          watchProcessingStatus: 'FAILED_REVIEW',
        })
      )
    ).toEqual({
      dedupeKey: 'pending-watch-1:complete',
      message: 'Your Watch video was submitted for review.',
      type: 'success',
    });
  });

  it('normalizes native processing failures into a user-facing toast message', () => {
    expect(
      getPendingVideoUploadToastEvent(
        createPendingUpload({
          status: 'failed',
          failureCode: 'processing',
          lastError: 'Command failed with state COMPLETED and rc 1. command=-i foo',
        })
      )
    ).toEqual({
      dedupeKey: 'pending-watch-1:failed',
      message: 'Your Watch video could not be processed after editing. Please try again.',
      type: 'danger',
    });
  });

  it('does not emit a terminal toast while the backend is still processing remotely', () => {
    expect(
      getPendingVideoUploadToastEvent(
        createPendingUpload({
          status: 'processing_remote',
          watchProcessingStatus: 'PROCESSING',
        })
      )
    ).toBeNull();
  });

  it('does not emit a terminal toast while waiting on a playable link after generic sync failure', () => {
    expect(
      getPendingVideoUploadToastEvent(
        createPendingUpload({
          status: 'processing_remote',
          watchProcessingStatus: 'FAILED_SYNC',
          lastError: 'Mux is still preparing playback.',
        })
      )
    ).toBeNull();
  });

  it('does not emit a terminal toast while missing video track is still inside the grace window', () => {
    expect(
      getPendingVideoUploadToastEvent(
        createPendingUpload({
          status: 'processing_remote',
          watchProcessingStatus: 'FAILED_SYNC',
          lastError: 'Mux did not produce a playable video track for this Watch upload.',
        })
      )
    ).toBeNull();
  });

  it('does not emit a terminal toast while a native startup timeout is being auto-recovered', () => {
    expect(
      getPendingVideoUploadToastEvent(
        createPendingUpload({
          status: 'queued',
          forcedUploadTransport: 'raw_put_fallback',
          nativeCrashRecoveryCount: 1,
          lastError: 'Native Mux upload did not emit a callback before timing out.',
        })
      )
    ).toBeNull();
  });

  it('dedupes complete and failed terminal notifications across repeated snapshots', () => {
    const deliveredKeys = new Set<string>();
    const completeItem = createPendingUpload({
      id: 'complete-1',
      status: 'complete',
    });
    const failedItem = createPendingUpload({
      id: 'failed-1',
      status: 'failed',
      failureCode: 'network',
      lastError: 'Video upload failed (503).',
    });

    expect(collectPendingVideoUploadToastEvents([completeItem, failedItem], deliveredKeys)).toEqual(
      [
        {
          dedupeKey: 'complete-1:complete',
          message: 'Your Watch video is live.',
          type: 'success',
        },
        {
          dedupeKey: 'failed-1:failed',
          message: 'Video upload failed (503).',
          type: 'danger',
        },
      ]
    );

    expect(collectPendingVideoUploadToastEvents([completeItem, failedItem], deliveredKeys)).toEqual(
      []
    );
  });
});
