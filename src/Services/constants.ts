// export const BASE_URL = 'https://api.onebodyapp.com/api';
import { unescape } from 'lodash';
import { Linking } from 'react-native';
import {
  PROD_BASE_URL,
  DEV_BASE_URL,
  STAGING_BASE_URL,
  PRIVACY_POLICY_URL as _PRIVACY_POLICY_URL,
  TERMS_CONDITIONS_URL as _TERMS_CONDITIONS_URL,
  GOOGLE_LOGIN_CLIENT_ID as _GOOGLE_LOGIN_CLIENT_ID,
  INSTAGRAM_APP_ID as _INSTAGRAM_APP_ID,
  INSTAGRAM_LOGIN_REDIRECT as _INSTAGRAM_LOGIN_REDIRECT,
  INSTAGRAM_CONNECT_REDIRECT as _INSTAGRAM_CONNECT_REDIRECT,
  INSTAGRAM_RECONNECT_REDIRECT as _INSTAGRAM_RECONNECT_REDIRECT,
  NO_PROFILE_IMAGE as _NO_PROFILE_IMAGE,
  NO_POST_IMAGE_URL as _NO_POST_IMAGE_URL,
  TWITTER_CLIENT_ID as _TWITTER_CLIENT_ID,
} from 'react-native-dotenv';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { sha256 } from 'react-native-sha256';
import { Buffer } from 'buffer';
import axios from 'axios';

const IS_STAGING = true;

//export const BASE_URL = __DEV__ ? DEV_BASE_URL : IS_STAGING ? STAGING_BASE_URL : PROD_BASE_URL;
export const BASE_URL = IS_STAGING ? STAGING_BASE_URL : PROD_BASE_URL;

export const PRIVACY_POLICY_URL = _PRIVACY_POLICY_URL;

export const TERMS_CONDITIONS_URL = _TERMS_CONDITIONS_URL;

export const GOOGLE_LOGIN_CLIENT_ID = _GOOGLE_LOGIN_CLIENT_ID;

export const NO_PROFILE_IMAGE = _NO_PROFILE_IMAGE;
export const NO_POST_IMAGE_URL = _NO_POST_IMAGE_URL;

export const INSTAGRAM_APP_ID = _INSTAGRAM_APP_ID;
export const INSTAGRAM_LOGIN_REDIRECT = _INSTAGRAM_LOGIN_REDIRECT;
export const INSTAGRAM_CONNECT_REDIRECT = _INSTAGRAM_CONNECT_REDIRECT;
export const INSTAGRAM_RECONNECT_REDIRECT = _INSTAGRAM_RECONNECT_REDIRECT;
export const TWITTER_CLIENT_ID = _TWITTER_CLIENT_ID;

export const OpenURLButton = async (
  url: string,
  externalBrowser?: boolean,
  isAuthLogin?: boolean,
  authRedirect?: string
) => {
  try {
    if (await InAppBrowser.isAvailable()) {
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        if (externalBrowser) {
          Linking.openURL(url);
        } else {
          if (isAuthLogin && authRedirect) {
            const result = await InAppBrowser.openAuth(url, authRedirect, {
              // iOS Properties
              ephemeralWebSession: false,
              // Android Properties
              showTitle: false,
              enableUrlBarHiding: true,
              enableDefaultShare: false,
            });

            if (result.type == 'success') {
              Linking.openURL(result.url);
            }
          } else {
            const urlToUse = unescape(decodeURI(decodeHTMLEntities(url)));
            await InAppBrowser.open(urlToUse, {
              readerMode: false,
              animated: true,
              modalPresentationStyle: 'fullScreen',
              modalTransitionStyle: 'coverVertical',
              modalEnabled: true,
              enableBarCollapsing: false,

              showTitle: true,
              enableUrlBarHiding: true,
              enableDefaultShare: true,
              forceCloseOnRedirection: false,
              animations: {
                startEnter: 'slide_in_right',
                startExit: 'slide_out_left',
                endEnter: 'slide_in_left',
                endExit: 'slide_out_right',
              },
            });
          }
        }
      }
    }
  } catch (error: any) {
    console.log(error);
    console.log(error.message);
  }
};

export const getCloser = (value: number, checkOne: number, checkTwo: number) =>
  Math.abs(value - checkOne) < Math.abs(value - checkTwo) ? checkOne : checkTwo;

export const decodeHTMLEntities = (str: string) => {
  if (str) {
    str = str.replace(/&#038/gim, '&');
  }

  return str;
};

export const codeChallenge = async () => {
  const hash = await sha256(new Date().getTime().toString());
  const bufferObj = Buffer.from(hash, 'utf8');

  return bufferObj.toString('base64');
  // return '';
};

export const getInstagramAuthToken = async (
  code: string,
  userToken: string,
  redirectUrl: string
) => {
  try {
    const options = {
      method: 'POST',
      url: `${BASE_URL}/auth/instagram-token`,
      data: {
        redirect_uri: redirectUrl,
        code: code,
        updateUser: true,
      },
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${userToken}`,
      },
    };

    const result = await axios.request(options);

    if (result && result.data?.access_token) {
      InAppBrowser.closeAuth();
      console.log(result.data);
      return {
        instagramTokenExpiresAt: result.data?.expiresAt,
        instagramTokenExpiresAtReal: result.data?.expiresAtReal,
        instagramUsername: result.data?.instagramHandler,
        instagramId: result.data?.instagramId,
        instagramToken: result.data?.instagramToken,
      };
    }
  } catch (error: any) {
    console.log(error);
  }
};

export const getTwitterAuthToken = async (
  code: string,
  codeConfirmation: string,
  userToken: string,
  redirectUrl: string
) => {
  try {
    const options = {
      method: 'POST',
      url: `${BASE_URL}/auth/twitter-token-oauth-2`,
      data: {
        redirect_uri: redirectUrl,
        code: code,
        codeVerifier: codeConfirmation,
        updateUser: true,
      },
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${userToken}`,
      },
    };

    const result = await axios.request(options);

    if (result.data) {
      InAppBrowser.closeAuth();

      return {
        twitterTokenExpires: result.data?.expiresAt,
        twitterTokenExpiresAtReal: result.data?.expiresAtReal,
        twitterUsername: result.data?.twitterHandler,
        twitterId: result.data?.twitterId,
        twitterToken: result.data?.twitterToken,
        twitterRefreshToken: result.data?.twitterRefreshToken,
      };
    }
  } catch (error: any) {
    console.log(error.text);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }
    console.log(error.config);
  }
};
