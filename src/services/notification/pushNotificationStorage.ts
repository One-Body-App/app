import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

const QUEUED_NOTIFICATIONS_KEY = '@onebody/push/queued-notifications';
const MAX_QUEUED_NOTIFICATIONS = 100;

export type QueuedPushNotification = {
  id: string;
  title: string;
  body: string;
  url?: string;
  type?: string;
  campaignId?: string;
  data?: Record<string, string>;
  createdAt: string;
  read?: boolean;
  source: 'push';
};

const toStringRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
    (accumulator, [key, item]) => {
      if (typeof item === 'string') {
        accumulator[key] = item;
      } else if (typeof item === 'number' || typeof item === 'boolean') {
        accumulator[key] = String(item);
      }
      return accumulator;
    },
    {}
  );
};

const getMessageCreatedAt = (message?: FirebaseMessagingTypes.RemoteMessage) => {
  const sentTime = message?.sentTime;
  if (typeof sentTime === 'number' && Number.isFinite(sentTime) && sentTime > 0) {
    return new Date(sentTime).toISOString();
  }

  const createdAt = message?.data?.createdAt;
  if (typeof createdAt === 'string' && createdAt.length > 0) {
    return createdAt;
  }

  return new Date().toISOString();
};

export const buildQueuedNotificationFromRemoteMessage = (
  message?: FirebaseMessagingTypes.RemoteMessage | null
): QueuedPushNotification | null => {
  if (!message) {
    return null;
  }

  const messageData = toStringRecord(message.data);
  const title =
    message.notification?.title ||
    messageData.title ||
    messageData.notificationTitle ||
    messageData.campaignTitle ||
    'New notification';
  const body =
    message.notification?.body ||
    messageData.body ||
    messageData.description ||
    messageData.message ||
    '';
  const campaignId = messageData.campaignId || messageData.campaignID || undefined;

  const id =
    message.messageId ||
    messageData.notificationId ||
    messageData.id ||
    campaignId ||
    `push-${Date.now()}-${Math.round(Math.random() * 100000)}`;

  return {
    id,
    title,
    body,
    url: messageData.url || messageData.deepLink || messageData.link || undefined,
    type: messageData.type || messageData.notificationType || messageData.targetType || undefined,
    campaignId,
    data: messageData,
    createdAt: getMessageCreatedAt(message),
    read: false,
    source: 'push',
  };
};

const readQueuedNotificationsRaw = async (): Promise<QueuedPushNotification[]> => {
  const rawValue = await AsyncStorage.getItem(QUEUED_NOTIFICATIONS_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as QueuedPushNotification[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => item && typeof item.id === 'string');
  } catch (_error) {
    return [];
  }
};

const writeQueuedNotificationsRaw = async (items: QueuedPushNotification[]) => {
  await AsyncStorage.setItem(QUEUED_NOTIFICATIONS_KEY, JSON.stringify(items));
};

export const getQueuedNotifications = async (): Promise<QueuedPushNotification[]> => {
  const queued = await readQueuedNotificationsRaw();
  return queued.sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
};

export const queueRemoteNotificationPayload = async (
  message?: FirebaseMessagingTypes.RemoteMessage | null
): Promise<QueuedPushNotification | null> => {
  const nextItem = buildQueuedNotificationFromRemoteMessage(message);
  if (!nextItem) {
    return null;
  }

  const existing = await readQueuedNotificationsRaw();
  const withoutDuplicate = existing.filter((item) => item.id !== nextItem.id);
  const nextQueue = [nextItem, ...withoutDuplicate].slice(0, MAX_QUEUED_NOTIFICATIONS);

  await writeQueuedNotificationsRaw(nextQueue);

  return nextItem;
};

export const markQueuedNotificationAsRead = async (notificationId: string) => {
  if (!notificationId) {
    return;
  }

  const existing = await readQueuedNotificationsRaw();
  const nextQueue = existing.map((item) =>
    item.id === notificationId ? { ...item, read: true } : item
  );
  await writeQueuedNotificationsRaw(nextQueue);
};

export const removeQueuedNotification = async (notificationId: string) => {
  if (!notificationId) {
    return;
  }

  const existing = await readQueuedNotificationsRaw();
  const nextQueue = existing.filter((item) => item.id !== notificationId);
  await writeQueuedNotificationsRaw(nextQueue);
};

export const clearQueuedNotifications = async () => {
  await AsyncStorage.removeItem(QUEUED_NOTIFICATIONS_KEY);
};
