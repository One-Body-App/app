// export const BASE_URL = 'https://api.onebodyapp.com/api';
import {
  PROD_BASE_URL,
  DEV_BASE_URL,
  PRIVACY_POLICY_URL as _PRIVACY_POLICY_URL,
  TERMS_CONDITIONS_URL as _TERMS_CONDITIONS_URL,
  GOOGLE_LOGIN_CLIENT_ID as _GOOGLE_LOGIN_CLIENT_ID,
} from 'react-native-dotenv';
import InAppBrowser from 'react-native-inappbrowser-reborn';

export const BASE_URL = __DEV__ ? DEV_BASE_URL : PROD_BASE_URL;
// export const BASE_URL = 'https://192.168.4.134/api';
console.log(BASE_URL, 'BASE_URLBASE_URL');
// export const BASE_URL = PROD_BASE_URL;

export const PRIVACY_POLICY_URL = _PRIVACY_POLICY_URL;

export const TERMS_CONDITIONS_URL = _TERMS_CONDITIONS_URL;

export const GOOGLE_LOGIN_CLIENT_ID = _GOOGLE_LOGIN_CLIENT_ID;

export const OpenURLButton = async (url: string) => {
  try {
    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.open(url, {
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
    } else Linking.openURL(url);
  } catch (error: any) {
    Alert.alert(error.message);
  }
};
