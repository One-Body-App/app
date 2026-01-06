import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  requestPermission,
} from '@react-native-firebase/messaging';
import { ApiCall } from '@/src/services/api';
import { getFirebaseApp } from '@/src/services/firebaseApp';

const getMessagingInstance = () => getMessaging(getFirebaseApp());

export const requestUserPermission = async (token: string, notificationStatus: boolean) => {
  const authStatus = await requestPermission(getMessagingInstance());
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;

  if (enabled && notificationStatus) {
    getFcmToken(token);
  }
};
export const getFcmToken = async (token: string) => {
  try {
    // if (fcmToken == null) {
    const fcmtoken = await getToken(getMessagingInstance());
    sendFcm(token, fcmtoken);
    console.log('fcmToken is genrated', fcmtoken);

    // }
  } catch (error: any) {
    console.log('error in fetching fcmToken', error?.message);
  }
};
const sendFcm = async (token: string, fcmtoken: string) => {
  try {
    const res = await ApiCall({
      route: 'user/set-fcm',
      token,
      params: { FCM: fcmtoken },
      verb: 'patch',
    });
    if (res?.status == 200) {
      console.log('fcm res == 200 ... ', res);
    } else {
      console.log('error', res);
    }
  } catch (e: any) {
    console.log('saga error -- ', e.toString());
  }
};

export const appListner = async (navigation, getAllSms) => {
  onNotificationOpenedApp(getMessagingInstance(), (remoteMessage) => {
    console.log(
      'Notification caused app to open from background state:',
      remoteMessage.notification
    );
    console.log('background state', remoteMessage?.data?.receiver);
    if (remoteMessage?.data?.type == 'message') {
      navigation.navigate('conversation', {
        reciver: remoteMessage?.data?.receiver,
        reciverId: remoteMessage?.data?.chatRoom,
      });
      getAllSms(remoteMessage?.data?.chatRoom);
    } else {
      console.log('else working');
    }
  });

  onMessage(getMessagingInstance(), async (remoteMessage) => {
    if (remoteMessage) {
      console.log('Notification caused app to open from quit state:', remoteMessage.notification);
      console.log('forground state', remoteMessage);
      if (remoteMessage?.data?.type == 'message') {
        getAllSms(remoteMessage?.data?.chatRoom);
      } else {
        console.log('else working');
      }
    }
  });
};
