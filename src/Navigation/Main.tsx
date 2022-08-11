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
// import { getuserGet } from '../Redux/actions/AuthActions';

const Main = () => {
  const loader = useSelector((state: RootState) => state.general.loader);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const dispatch = useDispatch();

  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>();

  async function onAuthStateChanged(fireabaseUser: FirebaseAuthTypes.User | null) {
    if (fireabaseUser) {
      setUser(fireabaseUser);
      // if (initializing) setInitializing(false);
      const token = await fireabaseUser?.getIdToken();
      console.log(token);
      dispatch(
        getuserGet({
          data: { token },
          go: () => {
            if (initializing) setInitializing(false);
          },
        })
      );
    } else {
      if (initializing) setInitializing(false);
    }
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  console.log(user, 'user');
  return (
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
    </NavigationContainer>
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
