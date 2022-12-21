import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { ApiCall } from '@/src/Services/api';
import { BASE_URL } from './constants';
import axios from 'axios';

export const processLogin = async (
  userCredentials: FirebaseAuthTypes.UserCredential,
  setToken: Function,
  dispatch: Function,
  setAccountType: Function,
  setNewUserCredentials: Function
) => {
  const token = await userCredentials.user.getIdToken();
  setToken(token);

  let userProfileResult;

  if (userCredentials.additionalUserInfo?.isNewUser) {
    setNewUserCredentials(userCredentials);
  } else {
    userProfileResult = await ApiCall({
      token: token,
      route: 'auth/my-profile',
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
        return userProfileResult.response;
      }
    } else {
      setNewUserCredentials(userCredentials);
    }
  }
};

export const getTwitterLoginToken = async (signup?: boolean, confirmation?: boolean) => {
  let params = '';

  if (signup) {
    params = '?signup=1';
  }

  if (confirmation) {
    params = '?confirmation=1';
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
