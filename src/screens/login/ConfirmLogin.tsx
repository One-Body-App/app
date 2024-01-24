import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import auth from '@react-native-firebase/auth';
import { useTheme } from '@react-navigation/native';
import LoginComponent from '@/src/components/loginComponent';

import { RootState } from '@/src/redux/reducers/rootReducer';
import { setLoginVerificationBackPage } from '@/src/redux/actions/GeneralActions';
import NewPassword from '../newPassword/NewPassword';
import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

type Props = StackScreenProps<MainStackParamList, 'ConfirmLogin'>;

function ConfirmLogin({ route, navigation }: Props) {
  const [enabledLoginProviders, setEnabledLoginProviders] = useState<string[]>();

  const authReducer = useSelector((state: RootState) => state.auth);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const dispatch = useDispatch();
  const { dark, colors } = useTheme();

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    if (route.params?.toScreen) {
      dispatch(
        setLoginVerificationBackPage(route.params?.toScreen, route.params?.toScreenRouteParams)
      );
    }
    if (authReducer.userData?.email) {
      const getSignInMethods = async () => {
        const providers = await auth().fetchSignInMethodsForEmail(
          authReducer.userData?.email ?? ''
        );

        setEnabledLoginProviders(providers);
      };
      getSignInMethods();
    }
  }, []);

  return (
    <UserStepsLayout
      backgroundColor={dark ? colors.background : Colors.neutral[700]}
      keyboardAvoidingViewStyle={{}}
    >
      <ScrollView style={{ flexGrow: 1, marginTop: spacing.x24 }}>
        {route?.params?.mode == 'resetPassword' ? (
          <NewPassword {...route.params} />
        ) : (
          <LoginComponent
            showConfirmationEmailMessage={false}
            verifyAccount
            currentUserEmail={userData?.email ?? ''}
            enabledLoginProviders={enabledLoginProviders}
            {...route.params}
          />
        )}
      </ScrollView>
    </UserStepsLayout>
  );
}

export default ConfirmLogin;
