declare module 'react-native-config' {
  export interface NativeConfig {
    BASE_URL: string;

    PRIVACY_POLICY_URL: string;
    TERMS_CONDITIONS_URL: string;
    GOOGLE_LOGIN_CLIENT_ID: string;

    INSTAGRAM_APP_ID: string;
    INSTAGRAM_LOGIN_REDIRECT: string;
    INSTAGRAM_CONNECT_REDIRECT: string;

    INSTAGRAM_RECONNECT_REDIRECT: string;
    NO_PROFILE_IMAGE: string;
    NO_POST_IMAGE_URL: string;

    TWITTER_CLIENT_ID: string;
    GIPHY_KEY_IOS: string;
    GIPHY_KEY_ANDROID: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
