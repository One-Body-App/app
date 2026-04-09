import {
  FirebaseMessagingTypes,
  getInitialNotification,
  getMessaging,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import {
  queueRemoteNotificationPayload,
  syncIosDisplayedRemoteNotifications,
} from './pushNotificationStorage';

const IOS_NOTIFICATION_PREFLIGHT_TIMEOUT_MS = 1500;

type IosNotificationPreflightDependencies = {
  getInitialNotification: () => Promise<FirebaseMessagingTypes.RemoteMessage | null>;
  queueRemoteNotificationPayload: (
    message?: FirebaseMessagingTypes.RemoteMessage | null
  ) => Promise<unknown>;
  syncIosDisplayedRemoteNotifications: () => Promise<number>;
};

export type IosNotificationPreflightResult = {
  initialQueued: boolean;
  syncedCount: number;
  didTimeout: boolean;
};

const defaultDependencies: IosNotificationPreflightDependencies = {
  getInitialNotification: () => getInitialNotification(getMessaging()),
  queueRemoteNotificationPayload,
  syncIosDisplayedRemoteNotifications,
};

const runWithTimeout = <T>(
  task: Promise<T>,
  timeoutMs: number,
  fallbackValue: T
): Promise<{ value: T; didTimeout: boolean }> => {
  return new Promise((resolve) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      resolve({ value: fallbackValue, didTimeout: true });
    }, timeoutMs);

    task
      .then((value) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutId);
        resolve({ value, didTimeout: false });
      })
      .catch(() => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutId);
        resolve({ value: fallbackValue, didTimeout: false });
      });
  });
};

export const preloadIosNotificationFeed = async (options?: {
  timeoutMs?: number;
  dependencies?: Partial<IosNotificationPreflightDependencies>;
}): Promise<IosNotificationPreflightResult> => {
  if (Platform.OS !== 'ios') {
    return {
      initialQueued: false,
      syncedCount: 0,
      didTimeout: false,
    };
  }

  const timeoutMs = options?.timeoutMs ?? IOS_NOTIFICATION_PREFLIGHT_TIMEOUT_MS;
  const dependencies: IosNotificationPreflightDependencies = {
    ...defaultDependencies,
    ...options?.dependencies,
  };

  const initialNotificationTask = dependencies.getInitialNotification().then(async (message) => {
    if (!message) {
      return false;
    }

    const queued = await dependencies.queueRemoteNotificationPayload(message);
    return Boolean(queued);
  });

  const syncDisplayedTask = dependencies.syncIosDisplayedRemoteNotifications();

  const [initialResult, syncResult] = await Promise.all([
    runWithTimeout(initialNotificationTask, timeoutMs, false),
    runWithTimeout(syncDisplayedTask, timeoutMs, 0),
  ]);

  return {
    initialQueued: initialResult.value,
    syncedCount: syncResult.value,
    didTimeout: initialResult.didTimeout || syncResult.didTimeout,
  };
};
