import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthorizationStatus,
  FirebaseMessagingTypes,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  requestPermission,
  deleteToken,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { ApiCall } from '@/src/services/api';
import { queueRemoteNotificationPayload, QueuedPushNotification } from './pushNotificationStorage';

const FCM_TOKEN_CACHE_KEY = '@onebody/push/fcm-token';

const isAuthorizedStatus = (status: number) =>
  status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;

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
  const hasAndroidPermission = await getAndroidPostNotificationsPermission();
  if (!hasAndroidPermission) {
    return false;
  }

  const messaging = getMessaging();

  try {
    const authStatus = await requestPermission(messaging);
    return isAuthorizedStatus(authStatus);
  } catch (_error) {
    return Platform.OS === 'android';
  }
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
    return undefined;
  }

  const messaging = getMessaging();
  const tokenValue = nextToken || (await getToken(messaging));
  if (!tokenValue) {
    return undefined;
  }

  const cachedToken = await AsyncStorage.getItem(FCM_TOKEN_CACHE_KEY);
  if (!force && cachedToken === tokenValue) {
    return tokenValue;
  }

  const didSave = await sendTokenToBackend(authToken, tokenValue);
  if (didSave) {
    await AsyncStorage.setItem(FCM_TOKEN_CACHE_KEY, tokenValue);
    return tokenValue;
  }

  return undefined;
};

export const enablePushNotifications = async (authToken: string, forceTokenSync = false) => {
  const granted = await ensurePushPermission();
  if (!granted) {
    return false;
  }

  const syncedToken = await syncPushTokenWithBackend(authToken, undefined, forceTokenSync);
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
