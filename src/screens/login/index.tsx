import React from 'react';
import { ScrollView } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import LoginComponent from '@/src/components/loginComponent';

import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';

type Props = StackScreenProps<MainStackParamList, 'Login'>;

function Login({ route, navigation }: Props) {
  const loginProviders = ['password', 'google.com', 'facebook.com', 'twitter.com', 'apple'];
  const { dark, colors } = useTheme();

  return (
    <UserStepsLayout backgroundColor={dark ? colors.background : Colors.neutral[700]}>
      <ScrollView
        keyboardShouldPersistTaps="always"
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <LoginComponent
          showConfirmationEmailMessage={route?.params?.showConfirmationEmailMessage ?? false}
          enabledLoginProviders={loginProviders}
          {...route.params}
        />
      </ScrollView>
    </UserStepsLayout>
  );
}

export default Login;
