/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry, Platform } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { name as appName } from './app.json';
import { queueRemoteNotificationPayload } from './src/services/notification/pushNotificationStorage';
import { handleBackgroundChatPush } from './src/services/chat/backgroundHandler';
import { displayAndroidLocalNotificationIfNeeded } from './src/services/notification/pushNotificationService';

if (typeof process !== 'undefined') {
  process.env = process.env || {};
  if (typeof process.env.EXPO_OS === 'undefined') {
    process.env.EXPO_OS = Platform.OS;
  }
}

const App = require('./App').default;

setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  const payload = await queueRemoteNotificationPayload(remoteMessage);
  const handledByChat = await handleBackgroundChatPush(remoteMessage).catch(() => false);
  if (handledByChat) {
    return;
  }
  await displayAndroidLocalNotificationIfNeeded(remoteMessage, {
    isForeground: false,
    payload,
  }).catch(() => false);
});

AppRegistry.registerComponent(appName, () => App);
