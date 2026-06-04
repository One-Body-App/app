import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-devsettings/withAsyncStorage';

import { useLayoutEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// import ZendeskChat from 'react-native-zendesk-chat';
import { getDynamicLinks, onLink } from '@react-native-firebase/dynamic-links';
import { Linking } from 'react-native';
import { ToastProvider } from 'react-native-toast-notifications';
import Config from 'react-native-config';
import { ClerkProvider, useAuth, useClerk } from '@clerk/expo';
import { passkeys } from '@clerk/expo/passkeys';
import { tokenCache } from '@clerk/expo/token-cache';

import * as Sentry from '@sentry/react-native';

/**
 * Sample React Native App
 * https://reactnative.dev
 *
 * @format
 */

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { persistor, store } from './src/redux/store'; // Make sure this path is correct
import AppContent from './src/navigator/AppContent'; // Import the new component
import { getFirebaseApp } from './src/services/firebaseApp';
import VideoUploadRuntimeHost from './src/components/post/VideoUploadRuntimeHost';
import useMountEffect from './src/hooks/useMountEffect';
import { clearClerkSessionAccessors, setClerkSessionAccessors } from './src/services/clerkSession';

Sentry.init({
  dsn: 'https://5a54913b45c44079b31e038fc1e7b4aa@o4504958486642688.ingest.sentry.io/4504958800560128',
  enabled: process.env.NODE_ENV === 'production',
});

const nativeConfig = Config as unknown as Record<string, string | undefined>;
const clerkPublishableKey =
  nativeConfig.CLERK_PUBLISHABLE_KEY ?? nativeConfig.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const clerkTaskUrls = {
  'choose-organization': 'onebodyapp://login/choose-organization',
  'reset-password': 'onebodyapp://login/reset-password',
  'setup-mfa': 'onebodyapp://login/setup-mfa',
};

function ClerkSessionBridge() {
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  useLayoutEffect(() => {
    setClerkSessionAccessors({
      getToken: (options) => getToken(options),
      signOut: () => signOut(),
    });

    return clearClerkSessionAccessors;
  }, [getToken, signOut]);

  return null;
}

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
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      tokenCache={tokenCache}
      taskUrls={clerkTaskUrls}
      __experimental_passkeys={passkeys}
    >
      <Provider store={store}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <SafeAreaProvider>
              <ToastProvider offsetTop={60}>
                <PersistGate loading={null} persistor={persistor}>
                  <ClerkSessionBridge />
                  <VideoUploadRuntimeHost />
                  {/* Render the new AppContent component here */}
                  <AppContent />
                </PersistGate>
              </ToastProvider>
            </SafeAreaProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </Provider>
    </ClerkProvider>
  );
}
export default Sentry.wrap(App);
