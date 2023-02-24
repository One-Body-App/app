import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import LoginComponent from '@/components/LoginComponent';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import GradientHeader from '@/components/GradientHeader';
import { appColor } from '../../../constants';
import { styles } from './styles';
import { StackScreenProps } from '@react-navigation/stack';
import GoBackIcon from '@/src/Components/GoBackIcon';
import { RootStackParamList } from '@/src/Navigation/types';
import { useTheme } from '@react-navigation/native';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

const Login = ({ route, navigation }: Props) => {
  const loginProviders = ['password', 'google.com', 'facebook.com', 'twitter.com', 'apple'];
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />

      <GradientHeader
        title="Log In"
        left={<GoBackIcon color={'#FFF'} style={{ width: '100%', paddingHorizontal: 20 }} />}
      />

      <LoginComponent
        showConfirmationEmailMessage={route.params?.showConfirmationEmailMessage ?? false}
        navigation={navigation}
        route={route}
        enabledLoginProviders={loginProviders}
        {...route.params}
      />
    </View>
  );
};

export default Login;
