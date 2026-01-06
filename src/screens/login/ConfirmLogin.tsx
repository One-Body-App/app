import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSignInMethodsForEmail, getAuth, reload } from '@react-native-firebase/auth';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import LoginComponent from '@/components/loginComponent';

import { RootState } from '@/src/redux/reducers/rootReducer';
import { setLoginVerificationBackPage } from '@/src/redux/actions/GeneralActions';
import NewPassword from '../newPassword/NewPassword';
import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { getFirebaseApp } from '@/src/services/firebaseApp';

type Props = StackScreenProps<MainStackParamList, 'ConfirmLogin'>;

function ConfirmLogin({ route, navigation }: Props) {
  const [enabledLoginProviders, setEnabledLoginProviders] = useState<string[]>();

  const authReducer = useSelector((state: RootState) => state.auth);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const dispatch = useDispatch();
  const { dark, colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      if (user) {
        reload(user).then(() => {
          if (auth.currentUser?.emailVerified) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainRoot' }],
            });
          }
        });
      }
    }, [navigation])
  );

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    if (route.params?.toScreen) {
      dispatch(
        setLoginVerificationBackPage(route.params?.toScreen, route.params?.toScreenRouteParams)
      );
    }
    if (authReducer.userData?.email) {
      const getSignInMethods = async () => {
        const providers = await fetchSignInMethodsForEmail(
          getAuth(getFirebaseApp()),
          authReducer.userData?.email ?? ''
        );

        setEnabledLoginProviders(providers);
      };
      getSignInMethods();
    }
  }, []);

  return (
    <UserStepsLayout backgroundColor={dark ? colors.background : Colors.neutral[700]}>
      <ScrollView style={{ flexGrow: 1, marginTop: spacing.x24 }}>
        {route?.params?.mode === 'resetPassword' ? (
          <NewPassword {...route.params} />
        ) : (
          <LoginComponent
            showConfirmationEmailMessage={false}
            currentUserEmail={userData?.email ?? ''}
            enabledLoginProviders={enabledLoginProviders}
            {...route.params}
            verifyAccount
          />
        )}
      </ScrollView>
    </UserStepsLayout>
  );
}

export default ConfirmLogin;
