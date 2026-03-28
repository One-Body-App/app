import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import VideoProcessingRuntime, {
  shouldAutoResumePendingVideoUploads,
  VIDEO_UPLOAD_RESUME_DELAY_MS,
} from '../VideoProcessingRuntime';

jest.mock('@/src/services/videoProcessing/videoUploadQueue', () => ({
  resumePendingVideoUploads: jest.fn().mockResolvedValue(undefined),
}));

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

  it('resumes queued uploads on iOS start and foreground', async () => {
    const onResumeUploads = jest.fn().mockResolvedValue(undefined);
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
        />
      );
    });
    expect(tree!.toJSON()).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(VIDEO_UPLOAD_RESUME_DELAY_MS);
    });

    expect(onResumeUploads).toHaveBeenCalledTimes(1);

    await act(async () => {
      appStateHandler?.('background');
      appStateHandler?.('active');
      jest.advanceTimersByTime(VIDEO_UPLOAD_RESUME_DELAY_MS);
    });

    expect(onResumeUploads).toHaveBeenCalledTimes(2);

    await act(async () => {
      tree!.unmount();
    });

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
