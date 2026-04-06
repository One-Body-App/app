import { useCallback, useRef, type MutableRefObject } from 'react';
import { AppState, InteractionManager, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import type { PendingVideoUpload } from '@/src/services/videoProcessing/types';
import {
  getPendingVideoUploadsSnapshot,
  hydratePendingVideoUploads,
  startPendingVideoUploads,
  resumePendingVideoUploads,
  subscribePendingVideoUploadsStartRequests,
  subscribePendingVideoUploads,
} from '@/src/services/videoProcessing/videoUploadQueue';
import useMountEffect from '@/src/hooks/useMountEffect';

export const VIDEO_UPLOAD_RESUME_DELAY_MS = 1200;

export const shouldAutoResumePendingVideoUploads = (platformOS: string) =>
  platformOS === 'ios' || platformOS === 'android';

export const shouldResumePendingVideoUploadsOnLifecycle = (items: PendingVideoUpload[]) =>
  items.some(
    (item) =>
      item.status === 'processing_remote' ||
      (item.status === 'uploading' && item.uploadTransport === 'mux_sdk')
  );

type InteractionManagerLike = Pick<typeof InteractionManager, 'runAfterInteractions'>;
type AppStateLike = Pick<typeof AppState, 'currentState' | 'addEventListener'>;
type SubscribeToUploads = (listener: (items: PendingVideoUpload[]) => void) => () => void;
type SubscribeToStartRequests = (listener: () => void) => () => void;
type StartUploads = () => Promise<void> | void;
type HydrateUploads = () => Promise<PendingVideoUpload[]>;
type GetUploadsSnapshot = () => PendingVideoUpload[];
type ShowUploadToast = (
  message: string,
  options: {
    type: 'success' | 'danger';
    placement: 'bottom';
  }
) => void;

type ShowUploadNotification = (id: string, message: string) => void;

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
  onStartUploads?: StartUploads;
  onHydrateUploads?: HydrateUploads;
  getUploadsSnapshot?: GetUploadsSnapshot;
  subscribeToUploads?: SubscribeToUploads;
  subscribeToStartRequests?: SubscribeToStartRequests;
  showUploadToast?: ShowUploadToast;
  showUploadNotification?: ShowUploadNotification;
};

export default function VideoProcessingRuntime({
  platformOS = Platform.OS,
  delayMs = VIDEO_UPLOAD_RESUME_DELAY_MS,
  appState = AppState,
  interactionManager = InteractionManager,
  onResumeUploads = resumePendingVideoUploads,
  onStartUploads = startPendingVideoUploads,
  onHydrateUploads = hydratePendingVideoUploads,
  getUploadsSnapshot = getPendingVideoUploadsSnapshot,
  subscribeToUploads = subscribePendingVideoUploads,
  subscribeToStartRequests = subscribePendingVideoUploadsStartRequests,
  showUploadToast,
  showUploadNotification,
}: Props) {
  const resumeCleanupRef = useRef<(() => void) | null>(null);
  const startCleanupRef = useRef<(() => void) | null>(null);
  const appStateRef = useRef<AppStateStatus>(appState.currentState);
  const deliveredTerminalKeysRef = useRef(new Set<string>());
  const appStateApiRef = useRef(appState);
  appStateApiRef.current = appState;
  const onResumeUploadsRef = useRef(onResumeUploads);
  onResumeUploadsRef.current = onResumeUploads;
  const onStartUploadsRef = useRef(onStartUploads);
  onStartUploadsRef.current = onStartUploads;
  const onHydrateUploadsRef = useRef(onHydrateUploads);
  onHydrateUploadsRef.current = onHydrateUploads;
  const getUploadsSnapshotRef = useRef(getUploadsSnapshot);
  getUploadsSnapshotRef.current = getUploadsSnapshot;
  const subscribeToUploadsRef = useRef(subscribeToUploads);
  subscribeToUploadsRef.current = subscribeToUploads;
  const subscribeToStartRequestsRef = useRef(subscribeToStartRequests);
  subscribeToStartRequestsRef.current = subscribeToStartRequests;
  const showUploadToastRef = useRef<ShowUploadToast>(showUploadToast ?? (() => undefined));
  showUploadToastRef.current = showUploadToast ?? (() => undefined);
  const showUploadNotificationRef = useRef<ShowUploadNotification>(
    showUploadNotification ?? (() => undefined)
  );
  showUploadNotificationRef.current = showUploadNotification ?? (() => undefined);

  const scheduleDeferredAction = useCallback(
    (
      actionRef: MutableRefObject<() => Promise<void> | void>,
      cleanupRef: MutableRefObject<(() => void) | null>
    ) => {
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
              .then(() => actionRef.current())
              .catch(() => undefined);
          }
        }, delayMs);
      });

      // eslint-disable-next-line no-param-reassign
      cleanupRef.current = () => {
        cancelled = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        task.cancel();
        // eslint-disable-next-line no-param-reassign
        cleanupRef.current = null;
      };
    },
    [delayMs, interactionManager, platformOS]
  );

  const scheduleResume = useCallback(() => {
    scheduleDeferredAction(onResumeUploadsRef, resumeCleanupRef);
  }, [scheduleDeferredAction]);
  const scheduleStart = useCallback(() => {
    scheduleDeferredAction(onStartUploadsRef, startCleanupRef);
  }, [scheduleDeferredAction]);

  const scheduleResumeRef = useRef(scheduleResume);
  scheduleResumeRef.current = scheduleResume;
  const scheduleStartRef = useRef(scheduleStart);
  scheduleStartRef.current = scheduleStart;

  const scheduleResumeIfNeeded = useCallback(() => {
    if (!shouldResumePendingVideoUploadsOnLifecycle(getUploadsSnapshotRef.current())) {
      return;
    }
    scheduleResumeRef.current();
  }, []);

  useMountEffect(() => {
    Promise.resolve()
      .then(() => onHydrateUploadsRef.current())
      .catch(() => undefined);
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
        if (event.type === 'success') {
          showUploadNotificationRef.current(event.dedupeKey, event.message);
        }
      });
    });
    const unsubscribeStartRequests = subscribeToStartRequestsRef.current(() => {
      scheduleStartRef.current();
    });
    const subscription = appStateApiRef.current.addEventListener('change', (nextAppState) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextAppState;

      if (wasBackground && nextAppState === 'active') {
        scheduleResumeIfNeeded();
      }
    });

    return () => {
      resumeCleanupRef.current?.();
      startCleanupRef.current?.();
      unsubscribeUploads();
      unsubscribeStartRequests();
      subscription.remove();
    };
  });

  return null;
}
