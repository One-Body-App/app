import React, { useState } from 'react';
import { useEffect } from 'react';
import { persistor, store } from './src/Redux/store';
import { Provider, useDispatch } from 'react-redux';
import Main from '@/navigation/Main';
import { PersistGate } from 'redux-persist/integration/react';
import SplashScreen from 'react-native-splash-screen';
// import ZendeskChat from 'react-native-zendesk-chat';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import { Alert, Linking, Platform } from 'react-native';
import { ToastProvider } from 'react-native-toast-notifications';

import {
  configureFonts,
  MD3LightTheme as DefaultTheme,
  Provider as PaperProvider,
} from 'react-native-paper';
import { Appearance } from 'react-native';

const colorsLight = {
  primary: 'rgb(0, 103, 129)',
  onPrimary: 'rgb(255, 255, 255)',
  primaryContainer: 'rgb(185, 234, 255)',
  onPrimaryContainer: 'rgb(0, 31, 41)',
  secondary: 'rgb(76, 98, 107)',
  onSecondary: 'rgb(255, 255, 255)',
  secondaryContainer: 'rgb(207, 230, 241)',
  onSecondaryContainer: 'rgb(7, 30, 38)',
  tertiary: 'rgb(91, 91, 126)',
  onTertiary: 'rgb(255, 255, 255)',
  tertiaryContainer: 'rgb(225, 223, 255)',
  onTertiaryContainer: 'rgb(24, 24, 55)',
  error: 'rgb(186, 26, 26)',
  onError: 'rgb(255, 255, 255)',
  errorContainer: 'rgb(255, 218, 214)',
  onErrorContainer: 'rgb(65, 0, 2)',
  background: 'rgb(251, 252, 254)',
  onBackground: 'rgb(25, 28, 29)',
  surface: 'rgb(251, 252, 254)',
  onSurface: 'rgb(25, 28, 29)',
  surfaceVariant: 'rgb(220, 228, 232)',
  onSurfaceVariant: 'rgb(64, 72, 76)',
  outline: 'rgb(112, 120, 124)',
  outlineVariant: 'rgb(192, 200, 204)',
  shadow: 'rgb(0, 0, 0)',
  scrim: 'rgb(0, 0, 0)',
  inverseSurface: 'rgb(46, 49, 50)',
  inverseOnSurface: 'rgb(239, 241, 242)',
  inversePrimary: 'rgb(95, 212, 253)',
  elevation: {
    level0: 'transparent',
    level1: 'rgb(238, 245, 248)',
    level2: 'rgb(231, 240, 244)',
    level3: 'rgb(223, 236, 240)',
    level4: 'rgb(221, 234, 239)',
    level5: 'rgb(216, 231, 237)',
  },
  surfaceDisabled: 'rgba(25, 28, 29, 0.12)',
  onSurfaceDisabled: 'rgba(25, 28, 29, 0.38)',
  backdrop: 'rgba(42, 50, 53, 0.4)',
};

const colorsDark = {
  primary: 'rgb(95, 212, 253)',
  onPrimary: 'rgb(0, 53, 68)',
  primaryContainer: 'rgb(0, 77, 98)',
  onPrimaryContainer: 'rgb(185, 234, 255)',
  secondary: 'rgb(179, 202, 213)',
  onSecondary: 'rgb(30, 51, 60)',
  secondaryContainer: 'rgb(53, 74, 83)',
  onSecondaryContainer: 'rgb(207, 230, 241)',
  tertiary: 'rgb(196, 195, 235)',
  onTertiary: 'rgb(45, 45, 77)',
  tertiaryContainer: 'rgb(67, 68, 101)',
  onTertiaryContainer: 'rgb(225, 223, 255)',
  error: 'rgb(255, 180, 171)',
  onError: 'rgb(105, 0, 5)',
  errorContainer: 'rgb(147, 0, 10)',
  onErrorContainer: 'rgb(255, 180, 171)',
  background: 'rgb(25, 28, 29)',
  onBackground: 'rgb(225, 227, 228)',
  surface: 'rgb(25, 28, 29)',
  onSurface: 'rgb(225, 227, 228)',
  surfaceVariant: 'rgb(64, 72, 76)',
  onSurfaceVariant: 'rgb(192, 200, 204)',
  outline: 'rgb(138, 146, 150)',
  outlineVariant: 'rgb(64, 72, 76)',
  shadow: 'rgb(0, 0, 0)',
  scrim: 'rgb(0, 0, 0)',
  inverseSurface: 'rgb(225, 227, 228)',
  inverseOnSurface: 'rgb(46, 49, 50)',
  inversePrimary: 'rgb(0, 103, 129)',
  elevation: {
    level0: 'transparent',
    level1: 'rgb(29, 37, 40)',
    level2: 'rgb(31, 43, 47)',
    level3: 'rgb(33, 48, 54)',
    level4: 'rgb(33, 50, 56)',
    level5: 'rgb(35, 54, 60)',
  },
  surfaceDisabled: 'rgba(225, 227, 228, 0.12)',
  onSurfaceDisabled: 'rgba(225, 227, 228, 0.38)',
  backdrop: 'rgba(42, 50, 53, 0.4)',
};

const fontConfig = {
  fontFamily: 'Rubik',
  //   Platform.select({
  //   web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
  //   ios: 'Rubik-Regular',
  //   android: 'Rubik-Regular',
  //   default: 'sans-serif',
  // }),
  // customVariant: {
  //   fontFamily: Platform.select({
  //     web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
  //     ios: 'Rubik-Medium',
  //     android: 'Rubik-Medium',
  //     default: 'sans-serif',
  //   }),
  //   fontWeight: '500',
  //   // fontSize: getFontSize(2.1),
  //   fontSize: 20,
  //   letterSpacing: 1.25,
  //   lineHeight: 22,
  // },
};

const App = () => {
  const colorScheme = Appearance.getColorScheme();

  const [colors, setColors] = useState(colorScheme == 'dark' ? colorsDark : colorsLight);

  useEffect(() => {
    Appearance.addChangeListener(({ colorScheme }) => {
      setColors(colorScheme == 'dark' ? colorsDark : colorsLight);
    });
  }, []);

  const theme = {
    ...DefaultTheme,
    roundness: 2,
    colors,
    fonts: configureFonts({ config: fontConfig }),
  };

  const handleDynamicLink = (link: string) => {
    console.log(link);
  };

  useEffect(() => {
    // ZendeskChat.init(
    //   'ny6aLGLinweALR8qvzeoql7EAo1YpFW8',
    //   '6im7AfpfISANDuQOXekDDaEEMBMrhDxPgZPTkfHJ'
    // );
    SplashScreen.hide();

    const event = Linking.addEventListener('url', ({ url }) => handleDynamicLink(url));

    const unsubscribe = dynamicLinks().onLink((url) => handleDynamicLink(url.url));
    // When the component is unmounted, remove the listener
    return () => {
      event.remove();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // if (Platform.OS === 'ios') {
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDynamicLink(url);
      }
    });
    // } else {
    //   dynamicLinks()
    //     .getInitialLink()
    //     .then((link) => {
    //       console.log(link, 'link');
    //       if (link) {
    //         handleDynamicLink(link.url);
    //       }
    //     });
    // }
  }, []);

  return (
    <ToastProvider offsetTop={60}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <PaperProvider theme={theme}>
            <Main />
          </PaperProvider>
        </PersistGate>
      </Provider>
    </ToastProvider>
  );
};
export default App;
