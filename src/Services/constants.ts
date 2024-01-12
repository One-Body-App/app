import { unescape } from 'lodash';
import { Linking } from 'react-native';
import Config from 'react-native-config';
export const BASE_URL = Config.BASE_URL;
export const PRIVACY_POLICY_URL = Config.PRIVACY_POLICY_URL;
export const TERMS_CONDITIONS_URL = Config.TERMS_CONDITIONS_URL;
export const GOOGLE_LOGIN_CLIENT_ID = Config.GOOGLE_LOGIN_CLIENT_ID;
export const INSTAGRAM_APP_ID = Config.INSTAGRAM_APP_ID;
export const INSTAGRAM_LOGIN_REDIRECT = Config.INSTAGRAM_LOGIN_REDIRECT;
export const INSTAGRAM_CONNECT_REDIRECT = Config.INSTAGRAM_CONNECT_REDIRECT;
export const INSTAGRAM_RECONNECT_REDIRECT = Config.INSTAGRAM_RECONNECT_REDIRECT;
export const NO_PROFILE_IMAGE = Config.NO_PROFILE_IMAGE;
export const NO_POST_IMAGE_URL = Config.NO_POST_IMAGE_URL;
export const TWITTER_CLIENT_ID = Config.TWITTER_CLIENT_ID;
export const GIPHY_KEY_IOS = Config.GIPHY_KEY_IOS;
export const GIPHY_KEY_ANDROID = Config.GIPHY_KEY_ANDROID;

import InAppBrowser from 'react-native-inappbrowser-reborn';
import { sha256 } from 'react-native-sha256';
import { Buffer } from 'buffer';
import axios from 'axios';

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

      return {
        instagramTokenExpiresAt: result.data?.expiresAt,
        instagramTokenExpiresAtReal: result.data?.expiresAtReal,
        instagramUsername: result.data?.instagramHandler,
        instagramId: result.data?.instagramId,
        instagramToken: result.data?.instagramToken,
      };
    }
  } catch (error: any) {}
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
