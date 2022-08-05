import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { useSelector } from 'react-redux';
import { AppProvider } from '../../app-context';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';

import AuthStack from './AuthStack';
import HomeStack from './HomeStack';

const Main = () => {
  const loader = useSelector((state) => state.gernal.loader);
  const token = useSelector((state) => {
    console.log(state.auth);
    return state.auth.userToken;
  });
  const user = useSelector((state) => state.auth.userData);
  console.log(token, 'token');
  return (
    <NavigationContainer>
      <AppProvider>
        {loader ? (
          <View style={styles.loaderbackground}>
            <View>
              <ActivityIndicator size={getHeight(5)} color="#126B87" />
            </View>
          </View>
        ) : token == null ? (
          <AuthStack />
        ) : (
          <HomeStack />
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
