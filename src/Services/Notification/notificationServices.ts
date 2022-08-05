import messaging from '@react-native-firebase/messaging';
import { ApiCall } from '@/services/api';

export const requestUserPermission = async (token) => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    getFcmToken(token);
  }
};
export const getFcmToken = async (token) => {
  try {
    // if (fcmToken == null) {
    const fcmtoken = await messaging().getToken();
    sendFcm(token, fcmtoken);
    console.log('fcmToken is genrated', fcmtoken);

    // }
  } catch (error) {
    console.log('error in featchin fcmToken', error?.message);
    alert(error?.message);
  }
};
const sendFcm = async (token, fcmtoken) => {
  try {
    const res = await ApiCall({
      route: 'user/set-fcm',
      token: token,
      params: { FCM: fcmtoken },
      verb: 'patch',
    });
    if (res?.status == '200') {
      console.log('fcm res == 200 ... ', res);
    } else {
      console.log('error', res);
    }
  } catch (e) {
    console.log('saga error -- ', e.toString());
  }
};

export const appListner = async (navigation, getAllSms) => {
  messaging().onNotificationOpenedApp((remoteMessage) => {
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

  messaging().onMessage(async (remoteMessage) => {
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
