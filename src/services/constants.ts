import { unescape } from 'lodash';
import { Linking } from 'react-native';

import Config from 'react-native-config';

import InAppBrowser from 'react-native-inappbrowser-reborn';
import { sha256 } from 'js-sha256';
import { Buffer } from 'buffer';
import axios from 'axios';

export const BASE_URL = Config.BASE_URL ?? '';
export const { PRIVACY_POLICY_URL } = Config;
export const { TERMS_CONDITIONS_URL } = Config;
export const { GOOGLE_LOGIN_CLIENT_ID } = Config;
export const { INSTAGRAM_APP_ID } = Config;
export const { INSTAGRAM_LOGIN_REDIRECT } = Config;
export const { INSTAGRAM_CONNECT_REDIRECT } = Config;
export const { INSTAGRAM_RECONNECT_REDIRECT } = Config;
export const { NO_PROFILE_IMAGE } = Config;
export const { NO_POST_IMAGE_URL } = Config;
export const { GIPHY_KEY_IOS } = Config;
export const { GIPHY_KEY_ANDROID } = Config;
export const { MAPBOX_PUBLIC_TOKEN } = Config;
export const ENABLE_NATIVE_CHAT = ['1', 'true', 'yes', 'on'].includes(
  String(Config.ENABLE_NATIVE_CHAT ?? '')
    .toLowerCase()
    .trim()
);

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
        } else if (isAuthLogin && authRedirect) {
          const result = await InAppBrowser.openAuth(url, authRedirect, {
            // iOS Properties
            ephemeralWebSession: false,
            // Android Properties
            showTitle: false,
            enableUrlBarHiding: true,
            enableDefaultShare: false,
          });

          if (result.type === 'success') {
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
  } catch (error: any) {
    console.log(error.message);
  }
};

export const getCloser = (value: number, checkOne: number, checkTwo: number) =>
  Math.abs(value - checkOne) < Math.abs(value - checkTwo) ? checkOne : checkTwo;

export const decodeHTMLEntities = (str: string) => {
  let newStr = str;
  if (str) {
    newStr = str.replace(/&#038/gim, '&');
  }

  return newStr;
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
        code,
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

    return undefined;
  } catch (error: any) {
    console.log(error);
    return undefined;
  }
};
