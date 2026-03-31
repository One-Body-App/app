import { useCallback, useRef } from 'react';
import { AppState, InteractionManager, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import type { PendingVideoUpload } from '@/src/services/videoProcessing/types';
import {
  resumePendingVideoUploads,
  subscribePendingVideoUploads,
} from '@/src/services/videoProcessing/videoUploadQueue';
import useMountEffect from '@/src/hooks/useMountEffect';

export const VIDEO_UPLOAD_RESUME_DELAY_MS = 1200;

export const shouldAutoResumePendingVideoUploads = (platformOS: string) =>
  platformOS === 'ios' || platformOS === 'android';

type InteractionManagerLike = Pick<typeof InteractionManager, 'runAfterInteractions'>;
type AppStateLike = Pick<typeof AppState, 'currentState' | 'addEventListener'>;
type SubscribeToUploads = (listener: (items: PendingVideoUpload[]) => void) => () => void;
type ShowUploadToast = (
  message: string,
  options: {
    type: 'success' | 'danger';
    placement: 'bottom';
  }
) => void;

export type VideoUploadTerminalToastEvent = {
  dedupeKey: string;
  message: string;
  type: 'success' | 'danger';
};

const normalizeFailureMessage = (message?: string) => {
  const normalizedMessage = String(message ?? '').trim();
  if (!normalizedMessage) {
    return null;
  }
  if (/Command failed with state/i.test(normalizedMessage)) {
    return 'Your Watch video could not be processed after editing. Please try again.';
  }
  return normalizedMessage;
};

export const getPendingVideoUploadToastEvent = (
  item: PendingVideoUpload
): VideoUploadTerminalToastEvent | null => {
  if (item.status === 'complete') {
    return {
      dedupeKey: `${item.id}:complete`,
      message: 'Your Watch video is live.',
      type: 'success',
    };
  }

  if (item.status !== 'failed') {
    return null;
  }

  const fallbackMessage =
    item.failureCode === 'nsfw-blocked'
      ? 'This video violates content standards and cannot be posted to Watch.'
      : item.failureCode === 'moderation-failed'
        ? 'Your Watch video could not be reviewed locally. Please try again.'
        : item.failureCode === 'missing-source'
          ? 'Your Watch video could not be completed because the original file is no longer available.'
          : item.failureCode === 'invalid-edit'
            ? 'Your Watch video could not be processed because the trim or crop settings were invalid.'
            : item.failureCode === 'network'
              ? 'Your Watch video upload did not finish. Please try again.'
              : 'Your Watch video could not be processed after editing. Please try again.';

  return {
    dedupeKey: `${item.id}:failed`,
    message: normalizeFailureMessage(item.lastError) ?? fallbackMessage,
    type: 'danger',
  };
};

export const collectPendingVideoUploadToastEvents = (
  items: PendingVideoUpload[],
  deliveredKeys: Set<string>
) => {
  const events: VideoUploadTerminalToastEvent[] = [];

  items.forEach((item) => {
    const event = getPendingVideoUploadToastEvent(item);
    if (!event || deliveredKeys.has(event.dedupeKey)) {
      return;
    }
    deliveredKeys.add(event.dedupeKey);
    events.push(event);
  });

  return events;
};

type Props = {
  platformOS?: string;
  delayMs?: number;
  appState?: AppStateLike;
  interactionManager?: InteractionManagerLike;
  onResumeUploads?: () => Promise<void> | void;
  subscribeToUploads?: SubscribeToUploads;
  showUploadToast?: ShowUploadToast;
};

export default function VideoProcessingRuntime({
  platformOS = Platform.OS,
  delayMs = VIDEO_UPLOAD_RESUME_DELAY_MS,
  appState = AppState,
  interactionManager = InteractionManager,
  onResumeUploads = resumePendingVideoUploads,
  subscribeToUploads = subscribePendingVideoUploads,
  showUploadToast,
}: Props) {
  const cleanupRef = useRef<(() => void) | null>(null);
  const appStateRef = useRef<AppStateStatus>(appState.currentState);
  const deliveredTerminalKeysRef = useRef(new Set<string>());
  const appStateApiRef = useRef(appState);
  appStateApiRef.current = appState;
  const onResumeUploadsRef = useRef(onResumeUploads);
  onResumeUploadsRef.current = onResumeUploads;
  const subscribeToUploadsRef = useRef(subscribeToUploads);
  subscribeToUploadsRef.current = subscribeToUploads;
  const showUploadToastRef = useRef<ShowUploadToast>(showUploadToast ?? (() => undefined));
  showUploadToastRef.current = showUploadToast ?? (() => undefined);

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
  const scheduleResumeRef = useRef(scheduleResume);
  scheduleResumeRef.current = scheduleResume;

  useMountEffect(() => {
    scheduleResumeRef.current();
    const unsubscribeUploads = subscribeToUploadsRef.current((items) => {
      const nextEvents = collectPendingVideoUploadToastEvents(
        items,
        deliveredTerminalKeysRef.current
      );
      nextEvents.forEach((event) => {
        showUploadToastRef.current(event.message, {
          type: event.type,
          placement: 'bottom',
        });
      });
    });

    const subscription = appStateApiRef.current.addEventListener('change', (nextAppState) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextAppState;

      if (wasBackground && nextAppState === 'active') {
        scheduleResumeRef.current();
      }
    });

    return () => {
      cleanupRef.current?.();
      unsubscribeUploads();
      subscription.remove();
    };
  });

  return null;
}
