import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import LoginComponent from '@/src/components/LoginComponent';

import { styles } from './styles';
import { StackScreenProps } from '@react-navigation/stack';

import { RootNonUserStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { useTheme } from '@react-navigation/native';
import { Colors } from '@/src/styles';

type Props = StackScreenProps<RootNonUserStackParamList, 'Login'>;

const Login = ({ route, navigation }: Props) => {
  const loginProviders = ['password', 'google.com', 'facebook.com', 'twitter.com', 'apple'];
  const { dark, colors } = useTheme();

  return (
    <UserStepsLayout backgroundColor={dark ? colors.background : Colors.neutral[700]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // contentContainerStyle={{
        //   marginTop: 615,
        // }}
        keyboardVerticalOffset={60}
      >
        <ScrollView style={{ flex: 1 }}>
          <LoginComponent
            showConfirmationEmailMessage={route?.params?.showConfirmationEmailMessage ?? false}
            enabledLoginProviders={loginProviders}
            {...route.params}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </UserStepsLayout>
  );
};

export default Login;
