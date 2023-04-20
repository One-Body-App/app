// export const BASE_URL = 'https://api.onebodyapp.com/api';
import { unescape } from 'lodash';
import { Linking } from 'react-native';
import {
  PROD_BASE_URL,
  DEV_BASE_URL,
  PRIVACY_POLICY_URL as _PRIVACY_POLICY_URL,
  TERMS_CONDITIONS_URL as _TERMS_CONDITIONS_URL,
  GOOGLE_LOGIN_CLIENT_ID as _GOOGLE_LOGIN_CLIENT_ID,
  INSTAGRAM_APP_ID as _INSTAGRAM_APP_ID,
  INSTAGRAM_LOGIN_REDIRECT as _INSTAGRAM_LOGIN_REDIRECT,
  INSTAGRAM_CONNECT_REDIRECT as _INSTAGRAM_CONNECT_REDIRECT,
  INSTAGRAM_RECONNECT_REDIRECT as _INSTAGRAM_RECONNECT_REDIRECT,
  NO_PROFILE_IMAGE as _NO_PROFILE_IMAGE,
} from 'react-native-dotenv';
import InAppBrowser from 'react-native-inappbrowser-reborn';

export const BASE_URL = __DEV__ ? DEV_BASE_URL : PROD_BASE_URL;
// export const BASE_URL = 'https://192.168.4.134/api';
// export const BASE_URL = PROD_BASE_URL;
// console.log(BASE_URL, 'BASE_URLBASE_URL');

export const PRIVACY_POLICY_URL = _PRIVACY_POLICY_URL;

export const TERMS_CONDITIONS_URL = _TERMS_CONDITIONS_URL;

export const GOOGLE_LOGIN_CLIENT_ID = _GOOGLE_LOGIN_CLIENT_ID;

export const NO_PROFILE_IMAGE = _NO_PROFILE_IMAGE;

export const INSTAGRAM_APP_ID = _INSTAGRAM_APP_ID;
export const INSTAGRAM_LOGIN_REDIRECT = _INSTAGRAM_LOGIN_REDIRECT;
export const INSTAGRAM_CONNECT_REDIRECT = _INSTAGRAM_CONNECT_REDIRECT;
export const INSTAGRAM_RECONNECT_REDIRECT = _INSTAGRAM_RECONNECT_REDIRECT;

export const OpenURLButton = async (
  url: string,
  externalBrowser?: boolean,
  isAuthLogin?: boolean,
  authRedirect?: string
) => {
  try {
    if (await InAppBrowser.isAvailable()) {
      const canOpen = await Linking.canOpenURL(url);
      const urlToUse = unescape(decodeURI(decodeHTMLEntities(url)));

      if (canOpen) {
        if (externalBrowser) {
          Linking.openURL(urlToUse);
        } else {
          if (isAuthLogin && authRedirect) {
            console.log('asdfasdf', urlToUse, authRedirect, 'urlToUse, authRedirect');
            const result = await InAppBrowser.openAuth(urlToUse, authRedirect, {
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
    console.log(error, 'error');
    console.log(error.message, 'hsd;jkha;jhk');
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
