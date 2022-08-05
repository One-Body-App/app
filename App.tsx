import React from 'react';
import { useEffect } from 'react';
import { persistor, store } from './src/Redux/store';
import { Provider } from 'react-redux';
import Main from '@/navigation/Main';
import { PersistGate } from 'redux-persist/integration/react';
import SplashScreen from 'react-native-splash-screen';
import { MenuProvider } from 'react-native-popup-menu';
// import GeneralStatusBar from './src/Components/GeneralStatusBar';
import ZendeskChat from 'react-native-zendesk-chat';
import { Text, View } from 'react-native';

const App = () => {
  ZendeskChat.init('ny6aLGLinweALR8qvzeoql7EAo1YpFW8', '6im7AfpfISANDuQOXekDDaEEMBMrhDxPgZPTkfHJ');
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Main />
      </PersistGate>
    </Provider>
  );
};
export default App;
