import React from 'react';
import { useEffect } from 'react';
import { persistor, store } from './src/Redux/store';
import { Provider, useDispatch } from 'react-redux';
import Main from '@/navigation/Main';
import { PersistGate } from 'redux-persist/integration/react';
import SplashScreen from 'react-native-splash-screen';
import ZendeskChat from 'react-native-zendesk-chat';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import { Linking } from 'react-native';
import { ToastProvider } from 'react-native-toast-notifications';

const App = () => {
  const handleDynamicLink = (link: string) => {
    console.log(link);
  };

  useEffect(() => {
    ZendeskChat.init(
      'ny6aLGLinweALR8qvzeoql7EAo1YpFW8',
      '6im7AfpfISANDuQOXekDDaEEMBMrhDxPgZPTkfHJ'
    );
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
          <Main />
        </PersistGate>
      </Provider>
    </ToastProvider>
  );
};
export default App;
