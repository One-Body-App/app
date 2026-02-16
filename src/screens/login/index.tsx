import React, { useState } from 'react';

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
  useTheme();

  return (
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
  );
}

export default Login;
