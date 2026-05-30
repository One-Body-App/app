import React, { useState } from 'react';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LoginComponent from '@/components/loginComponent';

import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';

type Props = NativeStackScreenProps<MainStackParamList, 'Login'>;

const getMfaChallengeKey = (
  challenge: NonNullable<MainStackParamList['Login']>['initialMfaChallenge']
) => {
  if (!challenge) {
    return 'no-mfa';
  }

  return [
    challenge.mfaToken ?? '',
    challenge.enrollmentRequired ? '1' : '0',
    challenge.preferredMethod ?? '',
    challenge.availableMethods?.join(',') ?? '',
    challenge.emailMasked ?? '',
    challenge.reason ?? '',
  ].join('|');
};

function Login({ route }: Props) {
  const [isMfaLaunchScreenVisible, setIsMfaLaunchScreenVisible] = useState(false);
  const clearOnMountKey =
    route?.params?.action ?? (route?.params?.resetPassword ? 'reset' : undefined);
  const loginComponentKey = `${clearOnMountKey ?? 'login'}:${getMfaChallengeKey(route?.params?.initialMfaChallenge)}`;

  return (
    <UserStepsLayout
      backgroundColor={Colors.neutral[700]}
      showCustomHeaderOnAndroid={!isMfaLaunchScreenVisible}
      hideBottomText={isMfaLaunchScreenVisible}
    >
      <LoginComponent
        key={loginComponentKey}
        currentUserEmail={route?.params?.prefillEmail}
        initialMfaChallenge={route?.params?.initialMfaChallenge}
        onMfaLaunchScreenChange={setIsMfaLaunchScreenVisible}
      />
    </UserStepsLayout>
  );
}

export default Login;
