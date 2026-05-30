import { useCallback, useRef, type MutableRefObject } from 'react';
import { AppState, InteractionManager, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import type { PendingVideoUpload } from '@/src/services/videoProcessing/types';
import {
  getPendingVideoUploadsSnapshot,
  hydratePendingVideoUploads,
  startPendingVideoUploads,
  resumePendingVideoUploads,
  subscribePendingVideoUploads,
} from '@/src/services/videoProcessing/videoUploadQueue';
import useMountEffect from '@/src/hooks/useMountEffect';
import {
  collectPendingVideoUploadToastEvents,
  shouldAutoResumePendingVideoUploads,
  shouldResumePendingVideoUploadsOnLifecycle,
  shouldStartPendingVideoUploadsOnRuntime,
  VIDEO_UPLOAD_RESUME_DELAY_MS,
  type VideoUploadTerminalToastEvent,
} from './VideoProcessingRuntime.utils';

type InteractionManagerLike = Pick<typeof InteractionManager, 'runAfterInteractions'>;
type AppStateLike = Pick<typeof AppState, 'currentState' | 'addEventListener'>;
type SubscribeToUploads = (listener: (items: PendingVideoUpload[]) => void) => () => void;
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
type OnCompleteUpload = (item: PendingVideoUpload) => void;

type Props = {
  platformOS?: string;
  delayMs?: number;
  appState?: AppStateLike;
  interactionManager?: InteractionManagerLike;
  onStartUploads?: () => Promise<void> | void;
  onResumeUploads?: () => Promise<void> | void;
  onHydrateUploads?: HydrateUploads;
  getUploadsSnapshot?: GetUploadsSnapshot;
  subscribeToUploads?: SubscribeToUploads;
  showUploadToast?: ShowUploadToast;
  showUploadNotification?: ShowUploadNotification;
  onCompleteUpload?: OnCompleteUpload;
};

export default function VideoProcessingRuntime({
  platformOS = Platform.OS,
  delayMs = VIDEO_UPLOAD_RESUME_DELAY_MS,
  appState = AppState,
  interactionManager = InteractionManager,
  onStartUploads = startPendingVideoUploads,
  onResumeUploads = resumePendingVideoUploads,
  onHydrateUploads = hydratePendingVideoUploads,
  getUploadsSnapshot = getPendingVideoUploadsSnapshot,
  subscribeToUploads = subscribePendingVideoUploads,
  showUploadToast,
  showUploadNotification,
  onCompleteUpload,
}: Props) {
  const startCleanupRef = useRef<(() => void) | null>(null);
  const resumeCleanupRef = useRef<(() => void) | null>(null);
  const appStateRef = useRef<AppStateStatus>(appState.currentState);
  const deliveredTerminalKeysRef = useRef(new Set<string>());
  const appStateApiRef = useRef(appState);
  appStateApiRef.current = appState;
  const onStartUploadsRef = useRef(onStartUploads);
  onStartUploadsRef.current = onStartUploads;
  const onResumeUploadsRef = useRef(onResumeUploads);
  onResumeUploadsRef.current = onResumeUploads;
  const onHydrateUploadsRef = useRef(onHydrateUploads);
  onHydrateUploadsRef.current = onHydrateUploads;
  const getUploadsSnapshotRef = useRef(getUploadsSnapshot);
  getUploadsSnapshotRef.current = getUploadsSnapshot;
  const subscribeToUploadsRef = useRef(subscribeToUploads);
  subscribeToUploadsRef.current = subscribeToUploads;
  const showUploadToastRef = useRef<ShowUploadToast>(showUploadToast ?? (() => undefined));
  showUploadToastRef.current = showUploadToast ?? (() => undefined);
  const showUploadNotificationRef = useRef<ShowUploadNotification>(
    showUploadNotification ?? (() => undefined)
  );
  showUploadNotificationRef.current = showUploadNotification ?? (() => undefined);
  const onCompleteUploadRef = useRef<OnCompleteUpload>(onCompleteUpload ?? (() => undefined));
  onCompleteUploadRef.current = onCompleteUpload ?? (() => undefined);

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

  const scheduleStartIfNeeded = useCallback((items?: PendingVideoUpload[]) => {
    const snapshot = items ?? getUploadsSnapshotRef.current();
    if (!shouldStartPendingVideoUploadsOnRuntime(snapshot)) {
      return;
    }
    scheduleStartRef.current();
  }, []);

  const scheduleResumeIfNeeded = useCallback(() => {
    if (!shouldResumePendingVideoUploadsOnLifecycle(getUploadsSnapshotRef.current())) {
      return;
    }
    scheduleResumeRef.current();
  }, []);

  useMountEffect(() => {
    Promise.resolve()
      .then(async () => {
        const hydratedItems = await onHydrateUploadsRef.current();
        scheduleStartIfNeeded(hydratedItems);
      })
      .catch(() => undefined);
    const unsubscribeUploads = subscribeToUploadsRef.current((items) => {
      scheduleStartIfNeeded(items);
      const nextEvents = collectPendingVideoUploadToastEvents(
        items,
        deliveredTerminalKeysRef.current
      );
      nextEvents.forEach((event) => {
        const matchedItem = items.find((item) => `${item.id}:${item.status}` === event.dedupeKey);
        if (event.type === 'success' && matchedItem?.status === 'complete') {
          onCompleteUploadRef.current(matchedItem);
        }
        showUploadToastRef.current(event.message, {
          type: event.type,
          placement: 'bottom',
        });
        if (event.type === 'success') {
          showUploadNotificationRef.current(event.dedupeKey, event.message);
        }
      });
    });
    const subscription = appStateApiRef.current.addEventListener('change', (nextAppState) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextAppState;

      if (wasBackground && nextAppState === 'active') {
        scheduleResumeIfNeeded();
      }
    });

    return () => {
      startCleanupRef.current?.();
      resumeCleanupRef.current?.();
      unsubscribeUploads();
      subscription.remove();
    };
  });

  return null;
}
