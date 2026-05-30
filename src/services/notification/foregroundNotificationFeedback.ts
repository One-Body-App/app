import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import { QueuedPushNotification, queueRemoteNotificationPayload } from './pushNotificationStorage';
import { emitNotificationRefresh } from './notificationRefreshSignal';

type ToastLike = {
  show: (message: string, options?: Record<string, unknown>) => unknown;
};

const isChatPayload = (payload?: { type?: string; data?: Record<string, unknown> }) =>
  payload?.type === 'chat_e2ee_message' || payload?.data?.type === 'chat_e2ee_message';

const buildToastMessage = (payload: QueuedPushNotification) => {
  const title = payload.title?.trim() || '';
  const body = payload.body?.trim() || '';

  if (title && body) {
    return `${title}\n${body}`;
  }

  return title || body;
};

export const showForegroundNotificationToast = (
  toast: ToastLike,
  payload: QueuedPushNotification
) => {
  if (!payload || isChatPayload(payload)) {
    return false;
  }

  const message = buildToastMessage(payload);
  if (!message) {
    return false;
  }

  toast.show(message, {
    id: `foreground-notification:${payload.id}`,
    placement: 'top',
    duration: 4000,
  });
  return true;
};

export const handleQueuedForegroundNotification = (
  toast: ToastLike,
  payload: QueuedPushNotification
) => {
  if (!payload || isChatPayload(payload)) {
    return false;
  }

  emitNotificationRefresh();
  return showForegroundNotificationToast(toast, payload);
};

export const handleIosForegroundRemoteMessage = async (
  toast: ToastLike,
  payload: FirebaseMessagingTypes.RemoteMessage
) => {
  const queuedPayload = await queueRemoteNotificationPayload(payload);
  if (!queuedPayload || isChatPayload(queuedPayload)) {
    return null;
  }

  emitNotificationRefresh();
  showForegroundNotificationToast(toast, queuedPayload);
  return queuedPayload;
};
