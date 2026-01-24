import React from 'react';
import { ScrollView } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import LoginComponent from '@/components/loginComponent';

import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';

type Props = StackScreenProps<MainStackParamList, 'Login'>;

function Login({ route }: Props) {
  const loginProviders = ['password'];
  useTheme();

  return (
    <UserStepsLayout backgroundColor={Colors.neutral[700]} showCustomHeaderOnAndroid>
      <ScrollView
        keyboardShouldPersistTaps="always"
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LoginComponent
          showConfirmationEmailMessage={route?.params?.showConfirmationEmailMessage ?? false}
          enabledLoginProviders={loginProviders}
          state={route?.params?.state}
          code={route?.params?.code}
          oauth_token={route?.params?.oauth_token}
          oauth_verifier={route?.params?.oauth_verifier}
        />
      </ScrollView>
    </UserStepsLayout>
  );
}

export default Login;
