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

  dispatch(setAccountType(''));

  if (userCredentials.additionalUserInfo?.isNewUser) {
    setNewUserCredentials(userCredentials);
  } else {
    const userProfileResult = await ApiCall({
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

export const getTwitterLoginToken = async (signup?: boolean) => {
  const options = {
    method: 'GET',
    url: `${BASE_URL}/auth/twitter-token${signup ? '?signup=1' : ''}`,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const result = await axios.request(options);
  const token = result.data?.oAuthToken;

  return token;
};
