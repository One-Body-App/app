import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import VideoProcessingRuntime, {
  collectPendingVideoUploadToastEvents,
  getPendingVideoUploadToastEvent,
  shouldAutoResumePendingVideoUploads,
  shouldResumePendingVideoUploadsOnLifecycle,
  VIDEO_UPLOAD_RESUME_DELAY_MS,
} from '../VideoProcessingRuntime';
import type { PendingVideoUpload } from '@/src/services/videoProcessing/types';

jest.mock('@/src/services/videoProcessing/videoUploadQueue', () => ({
  getPendingVideoUploadsSnapshot: jest.fn(() => []),
  hydratePendingVideoUploads: jest.fn(async () => []),
  startPendingVideoUploads: jest.fn().mockResolvedValue(undefined),
  resumePendingVideoUploads: jest.fn().mockResolvedValue(undefined),
  subscribePendingVideoUploadsStartRequests: jest.fn(() => () => undefined),
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
          onResumeUploads={onResumeUploads}
          onHydrateUploads={onHydrateUploads}
          getUploadsSnapshot={getUploadsSnapshot}
        />
      );
    });
    expect(tree!.toJSON()).toBeNull();

    expect(onHydrateUploads).toHaveBeenCalledTimes(1);
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

  it('starts queued uploads after receiving a deferred start request', async () => {
    const onStartUploads = jest.fn().mockResolvedValue(undefined);
    let startRequestHandler: (() => void) | undefined;

    const interactionManager = {
      runAfterInteractions: jest.fn((callback: () => void) => {
        callback();
        return { cancel: jest.fn() };
      }),
    };
    const subscribeToStartRequests = jest.fn((listener: () => void) => {
      startRequestHandler = listener;
      return () => undefined;
    });

    await act(async () => {
      TestRenderer.create(
        <VideoProcessingRuntime
          platformOS="android"
          interactionManager={interactionManager as any}
          onStartUploads={onStartUploads}
          subscribeToStartRequests={subscribeToStartRequests}
        />
      );
    });

    await act(async () => {
      startRequestHandler?.();
      jest.advanceTimersByTime(VIDEO_UPLOAD_RESUME_DELAY_MS);
    });

    expect(onStartUploads).toHaveBeenCalledTimes(1);
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
