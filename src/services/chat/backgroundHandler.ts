import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';
import { getValidAccessToken } from '@/src/services/authTokens';
import { decryptE2EEMessage } from './crypto';
import { getMyChatKeypair, getPeerPublicKey } from './keyManager';

const CHAT_PREVIEW_PREF_KEY = '@onebody/chat/preview-enabled';
const CHAT_NOTIFICATION_CHANNEL_ID = 'chat-e2ee-v2';

const isChatPayload = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) =>
  remoteMessage?.data?.type === 'chat_e2ee_message';

const toDataString = (value: unknown) => (typeof value === 'string' ? value : '');

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') {
    return CHAT_NOTIFICATION_CHANNEL_ID;
  }

  return notifee.createChannel({
    id: CHAT_NOTIFICATION_CHANNEL_ID,
    name: 'Secure Messages',
    importance: AndroidImportance.HIGH,
    sound: 'onebodynotificationwave',
  });
};

export const setSecureMessagePreviewEnabled = async (enabled: boolean) => {
  await AsyncStorage.setItem(CHAT_PREVIEW_PREF_KEY, enabled ? '1' : '0');
};

export const isSecureMessagePreviewEnabled = async () => {
  const value = await AsyncStorage.getItem(CHAT_PREVIEW_PREF_KEY);
  return value === '1';
};

const showSecureLocalNotification = async (args: { senderName: string; body: string }) => {
  const channelId = await ensureAndroidChannel();
  await notifee.displayNotification({
    title: args.senderName || 'OneBody',
    body: args.body,
    data: {
      type: 'chat_e2ee_message',
    },
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
      smallIcon: 'ic_stat_notification',
      sound: 'onebodynotificationwave',
    },
    ios: {
      sound: 'onebodynotificationwave.wav',
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
    },
  });
};

export const handleBackgroundChatPush = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
) => {
  if (!isChatPayload(remoteMessage)) {
    return false;
  }

  const senderName = toDataString(remoteMessage.data?.senderName) || 'OneBody';

  try {
    const keypair = await getMyChatKeypair();
    const senderId = toDataString(remoteMessage.data?.senderId);

    if (!senderId) {
      throw new Error('Missing senderId on chat payload');
    }

    const token = await getValidAccessToken();
    const senderPublicKey = await getPeerPublicKey(senderId, token || undefined);

    const decrypted = await decryptE2EEMessage({
      encryptedPayload: toDataString(remoteMessage.data?.encryptedPayload),
      nonce: toDataString(remoteMessage.data?.nonce),
      authTag: toDataString(remoteMessage.data?.authTag),
      aad: toDataString(remoteMessage.data?.aad) || undefined,
      myPrivateKeyBase64: keypair.privateKey,
      peerPublicKeyBase64: senderPublicKey.publicKey,
    });

    const previewEnabled = await isSecureMessagePreviewEnabled();
    await showSecureLocalNotification({
      senderName,
      body: previewEnabled ? decrypted : 'New secure message',
    });

    return true;
  } catch {
    await showSecureLocalNotification({
      senderName,
      body: 'New secure message',
    });
    return true;
  }
};
