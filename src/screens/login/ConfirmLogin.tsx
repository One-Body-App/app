import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, AppState, AppStateStatus, Platform } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAuth,
  getIdToken,
  reload,
  fetchSignInMethodsForEmail,
} from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import LoginComponent from '@/components/loginComponent';

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

  useFocusEffect(
    useCallback(() => {
      const { currentUser } = getAuth(getApp());
      if (currentUser) {
        reload(currentUser).then(async () => {
          if (getAuth(getApp()).currentUser?.emailVerified) {
            // Force token refresh to ensure profile is fetched
            await getIdToken(currentUser, true);
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
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[ConfirmLogin] Screen loaded with params:', {
        mode: route.params?.mode,
        action: route.params?.action,
        hasOobCode: !!route.params?.oobCode,
        oobCodeLength: route.params?.oobCode?.length,
        platform: Platform.OS,
      });
    }

    navigation.setOptions({ gestureEnabled: false });
    if (route.params?.toScreen) {
      dispatch(
        setLoginVerificationBackPage(route.params?.toScreen, route.params?.toScreenRouteParams)
      );
    }
    if (authReducer.userData?.email) {
      const getSignInMethods = async () => {
        const auth = getAuth(getApp());
        const providers = await fetchSignInMethodsForEmail(auth, authReducer.userData?.email ?? '');

        setEnabledLoginProviders(providers);
      };
      getSignInMethods();
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const { currentUser } = getAuth(getApp());
        if (currentUser) {
          reload(currentUser).then(async () => {
            if (getAuth(getApp()).currentUser?.emailVerified) {
              // Force token refresh to ensure global state updates and profile is fetched
              await getIdToken(currentUser, true);
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainRoot' }],
              });
            }
          });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [navigation, route.params, authReducer.userData?.email, dispatch]);

  return (
    <UserStepsLayout
      backgroundColor={dark ? colors.background : Colors.neutral[700]}
      hideBottomText
      showCustomHeaderOnAndroid
    >
      <ScrollView style={{ flexGrow: 1, marginTop: spacing.x24 }}>
        {route?.params?.mode === 'resetPassword' ? (
          <NewPassword oobCode={route.params?.oobCode} />
        ) : (
          <LoginComponent
            showConfirmationEmailMessage={false}
            currentUserEmail={userData?.email ?? ''}
            enabledLoginProviders={enabledLoginProviders}
            action={route.params?.action}
            mode={route.params?.mode}
            oobCode={route.params?.oobCode}
            onlyPassword={route.params?.onlyPassword}
            toScreenRouteParams={route.params?.toScreenRouteParams}
            updateParent={route.params?.updateParent}
            verifyAccount
          />
        )}
      </ScrollView>
    </UserStepsLayout>
  );
}

export default ConfirmLogin;
