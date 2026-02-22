import React, { useState } from 'react';
import { Platform, StatusBar } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import LoginComponent from '@/components/loginComponent';

import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';

type Props = StackScreenProps<MainStackParamList, 'Login'>;

function Login({ route }: Props) {
  const [isMfaLaunchScreenVisible, setIsMfaLaunchScreenVisible] = useState(false);
  const clearOnMountKey =
    route?.params?.action ?? (route?.params?.resetPassword ? 'reset' : undefined);
  const { dark } = useTheme();

  return (
    <>
      {Platform.OS === 'android' && !dark ? <StatusBar barStyle="dark-content" /> : null}
      <UserStepsLayout
        backgroundColor={Colors.neutral[700]}
        showCustomHeaderOnAndroid={!isMfaLaunchScreenVisible}
        hideBottomText={isMfaLaunchScreenVisible}
      >
        <LoginComponent
          clearOnMountKey={clearOnMountKey}
          currentUserEmail={route?.params?.prefillEmail}
          initialMfaChallenge={route?.params?.initialMfaChallenge}
          onMfaLaunchScreenChange={setIsMfaLaunchScreenVisible}
        />
      </UserStepsLayout>
    </>
  );
}

export default Login;
