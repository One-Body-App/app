import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { DisplayedNotification } from '@notifee/react-native';
import { Platform } from 'react-native';
import { isIsoWithZone, nowUtcIso, parseIsoOrNull } from '@/src/utils/time';

const QUEUED_NOTIFICATIONS_KEY = '@onebody/push/queued-notifications';
const MAX_QUEUED_NOTIFICATIONS = 100;

export type QueuedPushNotification = {
  id: string;
  title: string;
  body: string;
  url?: string;
  iconUrl?: string;
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
  const createdAt = message?.data?.createdAt;
  if (typeof createdAt === 'string' && isIsoWithZone(createdAt)) {
    return createdAt.trim();
  }

  const sentTime = message?.sentTime;
  if (typeof sentTime === 'number' && Number.isFinite(sentTime) && sentTime > 0) {
    const parsedSent = parseIsoOrNull(sentTime);
    if (parsedSent) {
      return parsedSent.toISOString();
    }
  }

  return nowUtcIso();
};

const resolveNotificationIconUrl = (messageData: Record<string, string>) => {
  const value =
    messageData.iconUrl ||
    messageData.iconURL ||
    messageData.notificationIconUrl ||
    messageData.notificationIconURL ||
    messageData.imageUrl ||
    messageData.imageURL ||
    '';
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
};

const getDisplayedNotificationCreatedAt = (
  displayed: DisplayedNotification,
  messageData: Record<string, string>
) => {
  const dataCreatedAt = messageData.createdAt;
  if (typeof dataCreatedAt === 'string' && isIsoWithZone(dataCreatedAt)) {
    return dataCreatedAt.trim();
  }

  const displayedDate = parseIsoOrNull(displayed.date);
  if (displayedDate) {
    return displayedDate.toISOString();
  }

  return nowUtcIso();
};

const mergeQueuedNotifications = (
  existing: QueuedPushNotification[],
  incoming: QueuedPushNotification[]
) => {
  if (!incoming.length) {
    return existing;
  }

  const mergedById = new Map(existing.map((item) => [item.id, item]));
  incoming.forEach((item) => {
    const current = mergedById.get(item.id);
    mergedById.set(item.id, {
      ...current,
      ...item,
      read: current?.read === true ? true : Boolean(item.read),
    });
  });

  return Array.from(mergedById.values())
    .sort(
      (first, second) =>
        (parseIsoOrNull(second.createdAt)?.getTime() || 0) -
        (parseIsoOrNull(first.createdAt)?.getTime() || 0)
    )
    .slice(0, MAX_QUEUED_NOTIFICATIONS);
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
  const iconUrl = resolveNotificationIconUrl(messageData);

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
    iconUrl,
    type: messageData.type || messageData.notificationType || messageData.targetType || undefined,
    campaignId,
    data: messageData,
    createdAt: getMessageCreatedAt(message),
    read: false,
    source: 'push',
  };
};

export const buildQueuedNotificationFromDisplayedNotification = (
  displayed?: DisplayedNotification | null
): QueuedPushNotification | null => {
  const notification = displayed?.notification;
  if (!notification?.remote) {
    return null;
  }

  const messageData = toStringRecord(notification.data);
  const notificationId =
    (typeof notification.id === 'string' && notification.id.trim()) ||
    notification.remote.messageId ||
    messageData.notificationId ||
    messageData.id ||
    messageData.campaignId ||
    '';

  if (!notificationId) {
    return null;
  }

  return {
    id: notificationId,
    title:
      notification.title ||
      messageData.title ||
      messageData.notificationTitle ||
      messageData.campaignTitle ||
      'New notification',
    body:
      notification.body || messageData.body || messageData.description || messageData.message || '',
    url: messageData.url || messageData.deepLink || messageData.link || undefined,
    iconUrl: resolveNotificationIconUrl(messageData),
    type: messageData.type || messageData.notificationType || messageData.targetType || undefined,
    campaignId: messageData.campaignId || messageData.campaignID || undefined,
    data: messageData,
    createdAt: getDisplayedNotificationCreatedAt(displayed, messageData),
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

const upsertQueuedNotifications = async (items: QueuedPushNotification[]) => {
  if (!items.length) {
    return [];
  }

  const existing = await readQueuedNotificationsRaw();
  const nextQueue = mergeQueuedNotifications(existing, items);
  await writeQueuedNotificationsRaw(nextQueue);
  return nextQueue;
};

export const getQueuedNotifications = async (): Promise<QueuedPushNotification[]> => {
  const queued = await readQueuedNotificationsRaw();
  return queued.sort(
    (first, second) =>
      (parseIsoOrNull(second.createdAt)?.getTime() || 0) -
      (parseIsoOrNull(first.createdAt)?.getTime() || 0)
  );
};

export const queueRemoteNotificationPayload = async (
  message?: FirebaseMessagingTypes.RemoteMessage | null
): Promise<QueuedPushNotification | null> => {
  if (__DEV__ && Platform.OS === 'android' && message) {
    const notificationAndroid = (message.notification as any)?.android as
      | { imageUrl?: string; icon?: string }
      | undefined;
    const dataIconUrl = message.data?.iconUrl || message.data?.notificationIconUrl || '';
    const dataImageUrl = message.data?.imageUrl || message.data?.imageURL || '';
    console.log('[PushDebug] incoming_payload_visuals', {
      messageId: message.messageId,
      notificationIcon: notificationAndroid?.icon,
      notificationImageUrl: notificationAndroid?.imageUrl,
      dataIconUrl,
      dataImageUrl,
    });
  }

  const nextItem = buildQueuedNotificationFromRemoteMessage(message);
  if (!nextItem) {
    return null;
  }

  await upsertQueuedNotifications([nextItem]);
  return nextItem;
};

export const syncIosDisplayedRemoteNotifications = async (): Promise<number> => {
  if (Platform.OS !== 'ios') {
    return 0;
  }

  const displayedNotifications = await notifee.getDisplayedNotifications();
  const queuedNotifications = displayedNotifications
    .map(buildQueuedNotificationFromDisplayedNotification)
    .filter((item): item is QueuedPushNotification => item !== null);

  if (!queuedNotifications.length) {
    return 0;
  }

  await upsertQueuedNotifications(queuedNotifications);
  return queuedNotifications.length;
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
