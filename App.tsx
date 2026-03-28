import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-devsettings/withAsyncStorage';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// import ZendeskChat from 'react-native-zendesk-chat';
import { getDynamicLinks, onLink } from '@react-native-firebase/dynamic-links';
import { Linking } from 'react-native';
import { ToastProvider } from 'react-native-toast-notifications';

import * as Sentry from '@sentry/react-native';

/**
 * Sample React Native App
 * https://reactnative.dev
 *
 * @format
 */

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { persistor, store } from './src/redux/store'; // Make sure this path is correct
import AppContent from './src/navigator/AppContent'; // Import the new component
import { getFirebaseApp } from './src/services/firebaseApp';
import VideoModerationBridge from './src/components/post/VideoModerationBridge';
import useMountEffect from './src/hooks/useMountEffect';

Sentry.init({
  dsn: 'https://5a54913b45c44079b31e038fc1e7b4aa@o4504958486642688.ingest.sentry.io/4504958800560128',
  enabled: process.env.NODE_ENV === 'production',
});

function App() {
  const firebaseApp = getFirebaseApp();
  const links = getDynamicLinks(firebaseApp);
  const handleDynamicLink = () => {
    // Placeholder for dynamic link handling
    // Deep linking is handled by AppContent.tsx
  };

  useMountEffect(() => {
    const event = Linking.addEventListener('url', () => handleDynamicLink());
    const unsubscribe = onLink(links, () => handleDynamicLink());

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDynamicLink();
      }
    });

    return () => {
      event.remove();
      unsubscribe();
    };
  });

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
                  <VideoModerationBridge />
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
