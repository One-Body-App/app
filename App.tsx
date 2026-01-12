import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-devsettings/withAsyncStorage';

import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import LottieSplashScreen from 'react-native-lottie-splash-screen'; // Note: LottieSplashScreen.hide() is now in AppContent

// import ZendeskChat from 'react-native-zendesk-chat';
import { getDynamicLinks, onLink } from '@react-native-firebase/dynamic-links';
import { Linking } from 'react-native';
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

import { persistor, store } from './src/redux/store'; // Make sure this path is correct
import AppContent from './src/navigator/AppContent'; // Import the new component
import { getFirebaseApp } from './src/services/firebaseApp';

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

  useEffect(() => {
    const event = Linking.addEventListener('url', () => handleDynamicLink());
    const unsubscribe = onLink(links, () => handleDynamicLink());
    return () => {
      event.remove();
      unsubscribe();
    };
  }, [links]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDynamicLink();
      }
    });
  }, []);

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        // Define the MINIMUM time you want the splash screen to be visible.
        // This should be *slightly longer* than your Lottie animation's actual duration.
        // Example: If your Lottie is 2 seconds, use 2500ms (2.5 seconds).
        const MIN_SPLASH_DISPLAY_TIME_MS = 3500; // Adjust this value!

        // Record when the JS side starts its initialization (approximate start of splash screen visibility)
        const jsLoadStartTime = Date.now();

        // Calculate how much more time we need to wait to meet the minimum display time
        const elapsed = Date.now() - jsLoadStartTime;
        const remainingWaitTime = Math.max(0, MIN_SPLASH_DISPLAY_TIME_MS - elapsed);

        // Wait for the remaining time
        await new Promise((resolve) => {
          setTimeout(resolve, remainingWaitTime);
        });
      } catch (e) {
        console.error('App initialization failed', e);
        // Handle error: perhaps show an error screen after a delay
      } finally {
        // Once all prep work and the minimum display time are met, mark app as ready
        setAppIsReady(true);
      }
    }

    prepareApp();
  }, []); // Run once when the component mounts

  useEffect(() => {
    if (appIsReady) {
      LottieSplashScreen.hide();
    }
  }, [appIsReady]); // Run this effect when `appIsReady` changes

  // While the app is not ready, return null or a simple loading indicator
  // The native splash screen will remain visible during this time.
  if (!appIsReady) {
    return null; // Don't render your main app content yet
  }

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
