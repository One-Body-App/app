import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LoginComponent from '@/components/LoginComponent';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import GradientHeader from '@/components/GradientHeader';
import { appColor } from '../../../constants';
import { styles } from './styles';

const Login = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />
      <GradientHeader />
      <LinearGradient colors={[appColor.PrimaryColor, appColor.PrimaryColor]} style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            navigation.navigate('AccountType');
          }}
        >
          <Animated.Text style={styles.TabTex}>Sign up</Animated.Text>
          <View style={styles.animatedview2} />
        </TouchableOpacity>
        <View style={styles.tabItem}>
          <Animated.Text style={styles.selectedTabText}>Log in</Animated.Text>
          <View style={styles.animatedview} />
        </View>
      </LinearGradient>
      <LoginComponent />
    </View>
  );
};

export default Login;
