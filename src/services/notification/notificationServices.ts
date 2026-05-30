import { NavigationProp, ParamListBase } from '@react-navigation/native';
import {
  enablePushNotifications,
  syncPushTokenWithBackend,
  subscribeToForegroundPushMessages,
} from './pushNotificationService';

export const requestUserPermission = async (token: string, notificationStatus: boolean) => {
  if (!notificationStatus) {
    return false;
  }

  return enablePushNotifications(token, true);
};

export const getFcmToken = async (token: string) => {
  return syncPushTokenWithBackend(token, undefined, true);
};

export const appListner = async (
  _navigation: NavigationProp<ParamListBase>,
  getAllSms: (chatRoomId?: string | object) => void | Promise<void>
) => {
  return subscribeToForegroundPushMessages(async (payload) => {
    const chatRoom = payload.data?.chatRoom;
    if (payload.type === 'message' && chatRoom) {
      await getAllSms(chatRoom);
    }
  });
};
