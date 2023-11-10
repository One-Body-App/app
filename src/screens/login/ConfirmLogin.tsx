import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import LoginComponent from '@/src/components/loginComponent';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import GradientHeader from '@/src/components/GradientHeader';
import { appColor } from '../../constants';
import { styles } from './styles';
import { StackScreenProps } from '@react-navigation/stack';
import GoBackIcon from '@/src/components/GoBackIcon';
import { RootStackParamList } from '@/src/_Navigation/types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { setLoginVerificationBackPage } from '@/src/Redux/actions/GeneralActions';
import auth from '@react-native-firebase/auth';
import { CompositeScreenProps, useTheme } from '@react-navigation/native';
import NewPassword from '../newPassword/NewPassword';
import { MainStackParamList, SettingsStackParamsList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

type Props = StackScreenProps<MainStackParamList, 'ConfirmLogin'>;

const ConfirmLogin = ({ route, navigation }: Props) => {
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
            verifyAccount={true}
            currentUserEmail={userData?.email ?? ''}
            enabledLoginProviders={enabledLoginProviders}
            {...route.params}
          />
        )}
      </ScrollView>
    </UserStepsLayout>
  );
};

export default ConfirmLogin;
