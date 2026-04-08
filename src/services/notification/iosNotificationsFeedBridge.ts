import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const EVENT_NAME = 'iosNotificationsFeedEvent';

type NativeIosNotificationsFeedModule = {
  getPendingNotifications: () => Promise<FirebaseMessagingTypes.RemoteMessage[]>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

const nativeModule =
  Platform.OS === 'ios'
    ? (NativeModules.IOSNotificationsFeedBridge as
        | Partial<NativeIosNotificationsFeedModule>
        | undefined)
    : undefined;

const normalizeRemoteMessage = (
  value: FirebaseMessagingTypes.RemoteMessage | null | undefined
): FirebaseMessagingTypes.RemoteMessage | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return typeof value.messageId === 'string' && value.messageId.trim() ? value : null;
};

export const subscribeToIosForegroundNotificationFeed = (
  listener: (payload: FirebaseMessagingTypes.RemoteMessage) => void | Promise<void>
) => {
  if (
    Platform.OS !== 'ios' ||
    !nativeModule ||
    typeof nativeModule.getPendingNotifications !== 'function'
  ) {
    return () => undefined;
  }

  const emitter = new NativeEventEmitter(nativeModule as never);
  const subscription = emitter.addListener(EVENT_NAME, (rawPayload) => {
    const payload = normalizeRemoteMessage(rawPayload as FirebaseMessagingTypes.RemoteMessage);
    if (!payload) {
      return;
    }

    Promise.resolve(listener(payload)).catch(() => undefined);
  });

  nativeModule
    .getPendingNotifications()
    .then((items) => {
      items.forEach((item) => {
        const payload = normalizeRemoteMessage(item);
        if (!payload) {
          return;
        }

        Promise.resolve(listener(payload)).catch(() => undefined);
      });
    })
    .catch(() => undefined);

  return () => {
    subscription.remove();
  };
};
