import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-devsettings/withAsyncStorage';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// import ZendeskChat from 'react-native-zendesk-chat';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import { Linking } from 'react-native';
import { ToastProvider } from 'react-native-toast-notifications';

import * as Sentry from '@sentry/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { persistor, store } from './src/redux/store';
import Main from '@/navigator/Main';

Sentry.init({
  dsn: 'https://5a54913b45c44079b31e038fc1e7b4aa@o4504958486642688.ingest.sentry.io/4504958800560128',
  enabled: process.env.NODE_ENV == 'production',
});

function App() {
  const handleDynamicLink = (link: string) => {
    // console.log(link);
  };

  useEffect(() => {
    // ZendeskChat.init(
    //   'ny6aLGLinweALR8qvzeoql7EAo1YpFW8',
    //   '6im7AfpfISANDuQOXekDDaEEMBMrhDxPgZPTkfHJ'
    // );

    // SplashScreen.hide();

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
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <KeyboardProvider>
            <SafeAreaProvider>
              <ToastProvider offsetTop={60}>
                <PersistGate loading={null} persistor={persistor}>
                  {/* <PaperProvider theme={theme}> */}

                  <Main />

                  {/* </PaperProvider> */}
                </PersistGate>
              </ToastProvider>
            </SafeAreaProvider>
          </KeyboardProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
export default Sentry.wrap(App);
