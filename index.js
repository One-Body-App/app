/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry, Platform } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { name as appName } from './app.json';
import { queueRemoteNotificationPayload } from './src/services/notification/pushNotificationStorage';
import { handleBackgroundChatPush } from './src/services/chat/backgroundHandler';

if (typeof process !== 'undefined') {
  process.env = process.env || {};
  if (typeof process.env.EXPO_OS === 'undefined') {
    process.env.EXPO_OS = Platform.OS;
  }
}

const App = require('./App').default;

setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  const handledByChat = await handleBackgroundChatPush(remoteMessage).catch(() => false);
  if (handledByChat) {
    return;
  }
  await queueRemoteNotificationPayload(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
