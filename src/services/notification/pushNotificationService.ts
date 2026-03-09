import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthorizationStatus,
  FirebaseMessagingTypes,
  getAPNSToken,
  isDeviceRegisteredForRemoteMessages,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onTokenRefresh,
  requestPermission,
  registerDeviceForRemoteMessages,
  deleteToken,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import DeviceInfo from 'react-native-device-info';
import { PermissionsAndroid, Platform } from 'react-native';
import { ApiCall } from '@/src/services/api';
import {
  buildQueuedNotificationFromRemoteMessage,
  queueRemoteNotificationPayload,
  QueuedPushNotification,
} from './pushNotificationStorage';
import { registerChatDeviceToken, unregisterChatDeviceToken } from '@/src/services/chat/api';

const FCM_TOKEN_CACHE_KEY = '@onebody/push/fcm-token';
const DEFAULT_ANDROID_CHANNEL_ID = 'onebody-default';
// iOS uses the app icon for push identity; custom push icons are Android-only.

const isAuthorizedStatus = (status: number) =>
  status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;

const toTokenPreview = (token?: string | null) => {
  if (!token) {
    return '';
  }
  if (token.length <= 12) {
    return token;
  }
  return `${token.slice(0, 6)}...${token.slice(-6)}`;
};

const permissionStatusToLabel = (status: number) => {
  switch (status) {
    case AuthorizationStatus.NOT_DETERMINED:
      return 'NOT_DETERMINED';
    case AuthorizationStatus.DENIED:
      return 'DENIED';
    case AuthorizationStatus.AUTHORIZED:
      return 'AUTHORIZED';
    case AuthorizationStatus.PROVISIONAL:
      return 'PROVISIONAL';
    case AuthorizationStatus.EPHEMERAL:
      return 'EPHEMERAL';
    default:
      return 'UNKNOWN';
  }
};

const logPushDebug = (event: string, details: Record<string, unknown> = {}) => {
  if (!__DEV__) {
    return;
  }
  console.log(`[PushDebug] ${event}`, details);
};

export type PushDebugSnapshot = {
  platform: string;
  isDeviceRegisteredForRemoteMessages: boolean;
  permissionStatus: number;
  permissionStatusLabel: string;
  apnsTokenPresent: boolean;
  apnsTokenPreview?: string;
  fcmTokenPresent: boolean;
  fcmTokenPreview?: string;
};

const ensureRemoteMessageRegistration = async () => {
  const messaging = getMessaging();
  try {
    if (!isDeviceRegisteredForRemoteMessages(messaging)) {
      await registerDeviceForRemoteMessages(messaging);
    }
  } catch (_error) {
    // continue with best-effort registration state
  }
  return messaging;
};

const getAndroidPostNotificationsPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const androidVersion = typeof Platform.Version === 'number' ? Platform.Version : 0;
  if (androidVersion < 33) {
    return true;
  }

  const permission =
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS || 'android.permission.POST_NOTIFICATIONS';

  const alreadyGranted = await PermissionsAndroid.check(permission as any);
  if (alreadyGranted) {
    return true;
  }

  const permissionResult = await PermissionsAndroid.request(permission as any);
  return permissionResult === PermissionsAndroid.RESULTS.GRANTED;
};

export const ensurePushPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    // Android 13+ requires POST_NOTIFICATIONS runtime permission.
    // Android 12 and below grant notification capability at install time.
    return getAndroidPostNotificationsPermission();
  }

  const messaging = await ensureRemoteMessageRegistration();

  try {
    const authStatus = await requestPermission(messaging);
    return isAuthorizedStatus(authStatus);
  } catch (_error) {
    return false;
  }
};

export const getPushDebugSnapshot = async (options?: {
  requestIosPermission?: boolean;
}): Promise<PushDebugSnapshot> => {
  const messaging = await ensureRemoteMessageRegistration();
  const shouldRequestIosPermission = options?.requestIosPermission === true;

  let permissionStatus = AuthorizationStatus.AUTHORIZED;
  if (Platform.OS === 'ios') {
    permissionStatus = shouldRequestIosPermission
      ? await requestPermission(messaging)
      : await hasPermission(messaging);
  }

  const fcmToken = await getToken(messaging).catch(() => '');
  const apnsToken = Platform.OS === 'ios' ? await getAPNSToken(messaging).catch(() => null) : null;

  return {
    platform: Platform.OS,
    isDeviceRegisteredForRemoteMessages: isDeviceRegisteredForRemoteMessages(messaging),
    permissionStatus,
    permissionStatusLabel: permissionStatusToLabel(permissionStatus),
    apnsTokenPresent: Boolean(apnsToken),
    apnsTokenPreview: toTokenPreview(apnsToken || ''),
    fcmTokenPresent: Boolean(fcmToken),
    fcmTokenPreview: toTokenPreview(fcmToken),
  };
};

const sendTokenToBackend = async (authToken: string, tokenValue: string) => {
  const deviceId = DeviceInfo.getUniqueIdSync();
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  const response = await ApiCall({
    route: 'user/set-fcm',
    token: authToken,
    params: { FCM: tokenValue, deviceId, platform },
    verb: 'patch',
  });

  // Keep chat device-token registry synced for E2EE push fallback.
  await registerChatDeviceToken(
    {
      deviceId,
      platform,
      token: tokenValue,
    },
    authToken
  ).catch(() => undefined);

  return response.status === 200;
};

export const syncPushTokenWithBackend = async (
  authToken: string,
  nextToken?: string,
  force = false
): Promise<string | undefined> => {
  if (!authToken) {
    logPushDebug('sync_skipped_missing_auth_token');
    return undefined;
  }

  const messaging = await ensureRemoteMessageRegistration();
  const tokenValue = nextToken || (await getToken(messaging));
  logPushDebug('sync_token_loaded', {
    hasNextToken: Boolean(nextToken),
    tokenPresent: Boolean(tokenValue),
    tokenPreview: toTokenPreview(tokenValue || ''),
    isDeviceRegisteredForRemoteMessages: isDeviceRegisteredForRemoteMessages(messaging),
    force,
  });

  if (!tokenValue) {
    logPushDebug('sync_skipped_missing_token');
    return undefined;
  }

  const cachedToken = await AsyncStorage.getItem(FCM_TOKEN_CACHE_KEY);
  if (!force && cachedToken === tokenValue) {
    logPushDebug('sync_skipped_cached_token_match', {
      tokenPreview: toTokenPreview(tokenValue),
    });
    return tokenValue;
  }

  const didSave = await sendTokenToBackend(authToken, tokenValue);
  logPushDebug('sync_backend_result', {
    didSave,
    tokenPreview: toTokenPreview(tokenValue),
  });
  if (didSave) {
    await AsyncStorage.setItem(FCM_TOKEN_CACHE_KEY, tokenValue);
    return tokenValue;
  }

  return undefined;
};

const ensureAndroidDefaultChannel = async () => {
  if (Platform.OS !== 'android') {
    return DEFAULT_ANDROID_CHANNEL_ID;
  }
  return notifee.createChannel({
    id: DEFAULT_ANDROID_CHANNEL_ID,
    name: 'General Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'onebodynotificationwave',
  });
};

const toNotificationDataRecord = (value?: Record<string, string>) => {
  if (!value) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>((accumulator, [key, item]) => {
    if (typeof item === 'string' && item.length > 0) {
      accumulator[key] = item;
    }
    return accumulator;
  }, {});
};

const isChatPushPayload = (remoteMessage?: FirebaseMessagingTypes.RemoteMessage | null) =>
  remoteMessage?.data?.type === 'chat_e2ee_message';

const hasAndroidVisibleNotificationPayload = (
  remoteMessage?: FirebaseMessagingTypes.RemoteMessage | null
) => {
  if (!remoteMessage) {
    return false;
  }

  return Boolean(
    remoteMessage.notification?.title ||
      remoteMessage.notification?.body ||
      (remoteMessage.notification as { android?: { imageUrl?: string; icon?: string } } | undefined)
        ?.android?.imageUrl ||
      (remoteMessage.notification as { android?: { imageUrl?: string; icon?: string } } | undefined)
        ?.android?.icon
  );
};

const resolveAndroidNotificationImageUrl = (
  remoteMessage?: FirebaseMessagingTypes.RemoteMessage | null,
  payload?: QueuedPushNotification | null
) => {
  const messageData = payload?.data || {};
  const androidNotification = remoteMessage?.notification as
    | { android?: { imageUrl?: string; icon?: string } }
    | undefined;

  return (
    messageData.notificationImageUrl ||
    messageData.imageUrl ||
    messageData.imageURL ||
    androidNotification?.android?.imageUrl ||
    undefined
  );
};

export const shouldDisplayAndroidLocalNotification = (
  remoteMessage?: FirebaseMessagingTypes.RemoteMessage | null,
  options?: { isForeground?: boolean }
) => {
  if (Platform.OS !== 'android' || !remoteMessage || isChatPushPayload(remoteMessage)) {
    return false;
  }

  const payload = buildQueuedNotificationFromRemoteMessage(remoteMessage);
  if (!payload || (!payload.title && !payload.body)) {
    return false;
  }

  if (options?.isForeground) {
    return true;
  }

  return !hasAndroidVisibleNotificationPayload(remoteMessage);
};

export const displayAndroidLocalNotificationIfNeeded = async (
  remoteMessage?: FirebaseMessagingTypes.RemoteMessage | null,
  options?: {
    isForeground?: boolean;
    payload?: QueuedPushNotification | null;
  }
) => {
  if (!shouldDisplayAndroidLocalNotification(remoteMessage, options)) {
    return false;
  }

  const payload = options?.payload || buildQueuedNotificationFromRemoteMessage(remoteMessage);
  if (!payload) {
    return false;
  }

  const channelId = await ensureAndroidDefaultChannel();
  const imageUrl = resolveAndroidNotificationImageUrl(remoteMessage, payload);
  const notificationData = toNotificationDataRecord({
    ...(payload.data || {}),
    notificationId: payload.id,
    title: payload.title,
    body: payload.body,
    url: payload.url || payload.data?.url || payload.data?.deepLink || payload.data?.link || '',
    type: payload.type || payload.data?.type || 'activity',
  });

  await notifee.displayNotification({
    id: payload.id,
    title: payload.title,
    body: payload.body,
    data: notificationData,
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
      smallIcon: 'ic_stat_notification',
      color: '#0A84FF',
      sound: 'onebodynotificationwave',
      ...(payload.iconUrl ? { largeIcon: payload.iconUrl } : {}),
      ...(imageUrl
        ? {
            style: {
              type: AndroidStyle.BIGPICTURE,
              picture: imageUrl,
            },
          }
        : {}),
    },
  });

  return true;
};

export const enablePushNotifications = async (authToken: string, forceTokenSync = false) => {
  await ensureAndroidDefaultChannel();
  logPushDebug('enable_push_start', {
    forceTokenSync,
    hasAuthToken: Boolean(authToken),
    platform: Platform.OS,
  });

  const granted = await ensurePushPermission();
  logPushDebug('enable_push_permission_result', { granted, platform: Platform.OS });
  if (!granted) {
    return false;
  }

  const snapshot = await getPushDebugSnapshot().catch(() => undefined);
  if (snapshot) {
    logPushDebug('enable_push_snapshot', snapshot);
  }

  const syncedToken = await syncPushTokenWithBackend(authToken, undefined, forceTokenSync);
  logPushDebug('enable_push_complete', { synced: Boolean(syncedToken) });
  return Boolean(syncedToken);
};

export const disablePushNotifications = async (authToken?: string) => {
  const messaging = getMessaging();

  try {
    await deleteToken(messaging);
  } catch (_error) {
    // ignore local token delete failures
  }

  await AsyncStorage.removeItem(FCM_TOKEN_CACHE_KEY);

  if (!authToken) {
    return;
  }

  try {
    const deviceId = DeviceInfo.getUniqueIdSync();
    await ApiCall({
      route: 'user/set-fcm',
      token: authToken,
      params: { FCM: '', deviceId, platform: Platform.OS === 'ios' ? 'ios' : 'android' },
      verb: 'patch',
    });

    await unregisterChatDeviceToken(deviceId, authToken).catch(() => undefined);
  } catch (_error) {
    // ignore backend cleanup failures
  }
};

export const subscribeToPushTokenRefresh = (
  getAuthToken: () => string | undefined,
  isPushEnabled: () => boolean
) => {
  const messaging = getMessaging();

  return onTokenRefresh(messaging, async (tokenValue) => {
    if (!isPushEnabled()) {
      return;
    }

    const authToken = getAuthToken();
    if (!authToken) {
      return;
    }

    await syncPushTokenWithBackend(authToken, tokenValue, true);
  });
};

export const subscribeToForegroundPushMessages = (
  listener: (
    payload: QueuedPushNotification,
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ) => void | Promise<void>
) => {
  const messaging = getMessaging();

  return onMessage(messaging, async (remoteMessage) => {
    if (__DEV__ && Platform.OS === 'android') {
      const notificationAndroid = (remoteMessage.notification as any)?.android as
        | { imageUrl?: string; icon?: string }
        | undefined;
      console.log('[PushDebug] foreground_payload_visuals', {
        messageId: remoteMessage.messageId,
        notificationIcon: notificationAndroid?.icon,
        notificationImageUrl: notificationAndroid?.imageUrl,
        dataIconUrl:
          remoteMessage.data?.iconUrl || remoteMessage.data?.notificationIconUrl || undefined,
        dataImageUrl: remoteMessage.data?.imageUrl || remoteMessage.data?.imageURL || undefined,
      });
    }

    const payload = await queueRemoteNotificationPayload(remoteMessage);
    if (!payload) {
      return;
    }

    await listener(payload, remoteMessage);
  });
};

export const clearCachedPushToken = async () => {
  await AsyncStorage.removeItem(FCM_TOKEN_CACHE_KEY);
};
