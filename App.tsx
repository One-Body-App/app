import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-devsettings/withAsyncStorage';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
// import LottieSplashScreen from 'react-native-lottie-splash-screen'; // Note: LottieSplashScreen.hide() is now in AppContent

// import ZendeskChat from 'react-native-zendesk-chat';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import { Linking, Text } from 'react-native'; // Text might not be needed here if not directly used
import { ToastProvider } from 'react-native-toast-notifications';

import * as Sentry from '@sentry/react-native';

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import firebase from '@react-native-firebase/app';
import { persistor, store } from './src/redux/store'; // Make sure this path is correct
import AppContent from './src/navigator/AppContent'; // Import the new component

Sentry.init({
  dsn: 'https://5a54913b45c44079b31e038fc1e7b4aa@o4504958486642688.ingest.sentry.io/4504958800560128',
  enabled: process.env.NODE_ENV === 'production',
});

function App() {
  console.log('App component rendered', process.env.NODE_ENV);
  console.log('Firebase Config:', firebase.apps, !firebase.apps.length);

  const handleDynamicLink = (link: string) => {
    console.log('Dynamic Link handled:', link);
  };

  useEffect(() => {
    const event = Linking.addEventListener('url', ({ url }) => handleDynamicLink(url));
    const unsubscribe = dynamicLinks().onLink((url) => handleDynamicLink(url.url));
    return () => {
      event.remove();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDynamicLink(url);
      }
    });
  }, []);

  console.log('App started');
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <KeyboardProvider>
            <SafeAreaProvider>
              <ToastProvider offsetTop={60}>
                <PersistGate loading={null} persistor={persistor}>
                  {/* Render the new AppContent component here */}
                  <AppContent />
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
