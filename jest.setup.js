import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import React from 'react';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native-devsettings/withAsyncStorage', () => ({}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    onReady: jest.fn(),
  })),
  firebase: {
    app: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/dynamic-links', () => ({
  getDynamicLinks: jest.fn(() => Promise.resolve(null)),
  onLink: jest.fn(() => jest.fn()),
}));

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  getIdToken: jest.fn(() => Promise.resolve('')),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  onMessage: jest.fn(() => jest.fn()),
  requestPermission: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(() => Promise.resolve()),
}));

jest.mock('@giphy/react-native-sdk', () => ({
  GiphySDK: {
    configure: jest.fn(),
  },
}));

jest.mock('react-native-device-info', () => ({
  getDeviceId: jest.fn(() => 'test-device'),
  getModel: jest.fn(() => 'test-model'),
  getSystemVersion: jest.fn(() => '0'),
  getVersion: jest.fn(() => '0.0.0'),
  getBuildNumber: jest.fn(() => '0'),
  getBrand: jest.fn(() => 'test-brand'),
  getSystemName: jest.fn(() => 'test-os'),
  isTablet: jest.fn(() => false),
  hasNotch: jest.fn(() => false),
  hasDynamicIsland: jest.fn(() => false),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({})),
    signOut: jest.fn(() => Promise.resolve()),
    revokeAccess: jest.fn(() => Promise.resolve()),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
  },
}));

jest.mock('react-native-fbsdk-next', () => ({
  LoginManager: {
    logInWithPermissions: jest.fn(() => Promise.resolve({})),
    logOut: jest.fn(),
  },
  AccessToken: {
    getCurrentAccessToken: jest.fn(() => Promise.resolve(null)),
  },
}));

jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: {
    isSupported: true,
    onCredentialRevoked: jest.fn(),
    performRequest: jest.fn(() => Promise.resolve({})),
    Operation: {},
    Scope: {},
  },
}));

jest.mock('react-native-recaptcha-that-works', () => {
  const Recaptcha = React.forwardRef(() => null);

  return {
    __esModule: true,
    default: Recaptcha,
    RecaptchaRef: jest.fn(),
  };
});

jest.mock('react-native-simple-toast', () => ({
  show: jest.fn(),
  showWithGravity: jest.fn(),
  SHORT: 'SHORT',
  LONG: 'LONG',
}));

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
  HapticFeedbackTypes: {},
}));

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
}));

jest.mock('react-native-sound', () => {
  const SoundMock = jest.fn(() => ({
    play: jest.fn(),
    stop: jest.fn(),
    release: jest.fn(),
    setVolume: jest.fn(),
  }));

  SoundMock.setCategory = jest.fn();
  SoundMock.setMode = jest.fn();
  SoundMock.enable = jest.fn();

  return SoundMock;
});

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
}));

jest.mock('react-native-keyboard-controller', () => {
  return {
    KeyboardProvider: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});
