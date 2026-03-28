import React, { useCallback, useRef } from 'react';
import { AppState, InteractionManager, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { resumePendingVideoUploads } from '@/src/services/videoProcessing/videoUploadQueue';

export const VIDEO_UPLOAD_RESUME_DELAY_MS = 1200;

export const shouldAutoResumePendingVideoUploads = (platformOS: string) =>
  platformOS === 'ios' || platformOS === 'android';

type InteractionManagerLike = Pick<typeof InteractionManager, 'runAfterInteractions'>;
type AppStateLike = Pick<typeof AppState, 'currentState' | 'addEventListener'>;

type Props = {
  platformOS?: string;
  delayMs?: number;
  appState?: AppStateLike;
  interactionManager?: InteractionManagerLike;
  onResumeUploads?: () => Promise<void> | void;
};

export default function VideoProcessingRuntime({
  platformOS = Platform.OS,
  delayMs = VIDEO_UPLOAD_RESUME_DELAY_MS,
  appState = AppState,
  interactionManager = InteractionManager,
  onResumeUploads = resumePendingVideoUploads,
}: Props) {
  const cleanupRef = useRef<(() => void) | null>(null);
  const appStateRef = useRef<AppStateStatus>(appState.currentState);
  const onResumeUploadsRef = useRef(onResumeUploads);
  onResumeUploadsRef.current = onResumeUploads;

  const scheduleResume = useCallback(() => {
    if (!shouldAutoResumePendingVideoUploads(platformOS)) {
      return;
    }

    cleanupRef.current?.();

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const task = interactionManager.runAfterInteractions(() => {
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          Promise.resolve()
            .then(() => onResumeUploadsRef.current())
            .catch(() => undefined);
        }
      }, delayMs);
    });

    cleanupRef.current = () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      task.cancel();
      cleanupRef.current = null;
    };
  }, [delayMs, interactionManager, platformOS]);

  React.useEffect(() => {
    scheduleResume();

    const subscription = appState.addEventListener('change', (nextAppState) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextAppState;

      if (wasBackground && nextAppState === 'active') {
        scheduleResume();
      }
    });

    return () => {
      cleanupRef.current?.();
      subscription.remove();
    };
  }, [appState, scheduleResume]);

  return null;
}
