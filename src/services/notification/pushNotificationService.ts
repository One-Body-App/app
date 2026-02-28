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
import { PermissionsAndroid, Platform } from 'react-native';
import { ApiCall } from '@/src/services/api';
import { queueRemoteNotificationPayload, QueuedPushNotification } from './pushNotificationStorage';

const FCM_TOKEN_CACHE_KEY = '@onebody/push/fcm-token';
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
  const response = await ApiCall({
    route: 'user/set-fcm',
    token: authToken,
    params: { FCM: tokenValue },
    verb: 'patch',
  });

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

export const enablePushNotifications = async (authToken: string, forceTokenSync = false) => {
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
    await ApiCall({
      route: 'user/set-fcm',
      token: authToken,
      params: { FCM: '' },
      verb: 'patch',
    });
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
