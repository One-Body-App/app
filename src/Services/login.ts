import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { ApiCall } from '@/services/api';
import { BASE_URL } from './constants';
import axios from 'axios';
import { loginSocialRequest } from '../redux/actions/AuthActions';
import { Dispatch } from '@reduxjs/toolkit';
import { requestUserPermission } from './notification/notificationServices';

export const processLogin = async (
  userCredentials: FirebaseAuthTypes.UserCredential,
  setNewUserCredentials: Function,
  setToken?: Function
) => {
  const token = await userCredentials.user.getIdToken();

  if (setToken && token) {
    setToken(token);
  }

  let userProfileResult;

  if (userCredentials.additionalUserInfo?.isNewUser) {
    setNewUserCredentials(userCredentials);
  } else {
    userProfileResult = await ApiCall({
      token: token,
      route: 'user/my-profile',
      verb: 'get',
    });

    if (userProfileResult.status == 200) {
      if (userProfileResult.response == '') {
        setNewUserCredentials(userCredentials);
      } else {
        if (!userCredentials.user.email || !userCredentials.user.emailVerified) {
          if (!userCredentials.user.email && userCredentials.additionalUserInfo?.profile?.email) {
            await userCredentials.user.updateEmail(
              userCredentials.additionalUserInfo?.profile?.email
            );
          }
        }

        if (!userProfileResult.response.FCM) {
          await requestUserPermission(token, userProfileResult.response.pushNotificationsEnabled);
        }
        return userProfileResult.response;
      }
    } else {
      setNewUserCredentials(userCredentials);
    }
  }
};

export const getTwitterLoginToken = async (
  signup?: boolean,
  confirmation?: boolean,
  influencer?: boolean
) => {
  let params = '';

  if (signup) {
    params = '?signup=1';
  }

  if (confirmation) {
    params = '?confirmation=1';
  }

  if (influencer) {
    params = '?influencer=1';
  }

  const options = {
    method: 'GET',
    url: `${BASE_URL}/auth/twitter-token${params ?? ''}`,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const result = await axios.request(options);
  const token = result.data?.oAuthToken;

  return token;
};

export const socialLogin = (
  newUserCredentials: FirebaseAuthTypes.UserCredential | null,
  dispatch: Dispatch<any>,
  data: {
    accountType?: string | null;
    token: string;
    seterror: React.Dispatch<any>;
    gotoSignup: Function;
    sendFcm: Function;
  }
) => {
  if (newUserCredentials) {
    const emailParts = newUserCredentials?.user.email?.split('@');
    let username = newUserCredentials?.user.email?.replace('@', '');

    if (emailParts && emailParts[0]) {
      username = emailParts[0] + new Date().getTime();
    }

    const dataToSend = {
      email: newUserCredentials?.user.email,
      name: newUserCredentials?.user.displayName,
      socialData: newUserCredentials?.additionalUserInfo,
      userId: newUserCredentials.user.uid,
      username,

      accountType: data.accountType,
      token: data.token,
    };

    dispatch(
      loginSocialRequest({
        data: dataToSend,
        seterror: data.seterror,
        gotoSignup: data.gotoSignup,
        sendFcm: data.sendFcm,
      })
    );
  }
};
