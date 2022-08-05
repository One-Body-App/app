import React, { useEffect } from 'react';
import { Text, ImageBackground, View } from 'react-native';
const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    setTimeout(() => {
      navigation.navigate('Login');
    }, 5000);
  });
  return (
    <ImageBackground
      resizeMode="stretch"
      style={{ flex: 1 }}
      source={require('@/assets/images/Welcome.png')}
    />
  );
};
export default SplashScreen;
