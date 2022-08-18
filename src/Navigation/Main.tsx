import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { useDispatch, useSelector } from 'react-redux';
import { AppProvider } from '../../app-context';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

import AuthStack from './AuthStack';
import HomeStack from './HomeStack';
import { RootState } from '../Redux/reducers/rootReducer';
import { getuserGet } from '../Redux/actions/UserAction';
import { setLoginData } from '../Redux/actions/AuthActions';
import { isEqual } from 'lodash';
import { setLoader } from '../Redux/actions/GeneralActions';
import Toast from 'react-native-toast-message';
// import { getuserGet } from '../Redux/actions/AuthActions';

// let initializing = true;

const Main = () => {
  const loader = useSelector((state: RootState) => state.general.loader);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const dispatch = useDispatch();

  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [token, setToken] = useState<string>('');

  const onAuthStateChanged = async function (firebaseUser: FirebaseAuthTypes.User | null) {
    const firebaseToken = await firebaseUser?.getIdToken();

    if (!isEqual(firebaseUser, user)) {
      setUser(firebaseUser);
    }

    if (!isEqual(firebaseToken, token)) {
      setToken(firebaseToken ?? '');
    }
  };

  useEffect(() => {
    const subscriber = auth().onIdTokenChanged(onAuthStateChanged);
    dispatch(setLoader(true));

    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (user) {
      dispatch(setLoginData({ token, user: user.toJSON() }));
    }

    if (token) {
      dispatch(
        getuserGet({
          token,
        })
      );
    }
    setInitializing(false);
  }, [token, user]);

  return (
    <>
      <NavigationContainer>
        <AppProvider>
          {loader || initializing ? (
            <View style={styles.loaderbackground}>
              <View>
                <ActivityIndicator size={getHeight(5)} color="#126B87" />
              </View>
            </View>
          ) : !user ? (
            <AuthStack />
          ) : (
            <HomeStack userData={userData} user={user} />
          )}
        </AppProvider>
        <Toast topOffset={100} bottomOffset={100} position="bottom" />
      </NavigationContainer>
    </>
  );
};
const styles = StyleSheet.create({
  loaderbackground: {
    justifyContent: 'center',
    alignItems: 'center',
    height: getHeight(110),
    width: getWidth(100),
    backgroundColor: 'rgba(52, 52, 52, 0.5)',
    position: 'absolute',
    alignSelf: 'center',
  },
});
export default Main;
