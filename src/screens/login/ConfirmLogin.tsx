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
  const hasNavigatedRef = React.useRef(false);

  const authReducer = useSelector((state: RootState) => state.auth);
  const userData = useSelector((state: RootState) => state.auth.userData);
  const dispatch = useDispatch();
  const { dark, colors } = useTheme();

  // Consolidated verification check that prevents double navigation
  const checkAndNavigateIfVerified = useCallback(async () => {
    // Prevent multiple navigation attempts
    if (hasNavigatedRef.current) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ConfirmLogin] Navigation already triggered, skipping check');
      }
      return;
    }

    const { currentUser } = getAuth(getApp());
    if (!currentUser) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ConfirmLogin] No current user');
      }
      return;
    }

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[ConfirmLogin] Checking verification status...');
    }

    await reload(currentUser);
    const verified = getAuth(getApp()).currentUser?.emailVerified;

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[ConfirmLogin] After reload, emailVerified:', verified);
    }

    if (verified && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      // Force token refresh to ensure profile is fetched
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ConfirmLogin] Getting fresh token and navigating...');
      }
      await getIdToken(currentUser, true);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainRoot' }],
      });
    }
  }, [navigation]);

  // Disable focus-based navigation check entirely on iOS
  // LoginComponent handles verification and navigation reliably
  // This prevents duplicate navigation attempts that cause the "flash" bug
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'ios') {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(
            '[ConfirmLogin useFocusEffect] iOS - skipping focus check, LoginComponent handles navigation'
          );
        }
        return () => undefined;
      }

      if (!route.params?.oobCode) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(
            '[ConfirmLogin useFocusEffect] No oobCode, skipping focus check (LoginComponent will handle)'
          );
        }
        return () => undefined;
      }

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ConfirmLogin useFocusEffect] Screen focused with oobCode');
      }

      // Small delay to allow LoginComponent's verification to complete first
      const timer = setTimeout(() => {
        checkAndNavigateIfVerified();
      }, 500);

      return () => clearTimeout(timer);
    }, [route.params?.oobCode, checkAndNavigateIfVerified])
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
        allParams: route.params,
      });
    }

    // Log if we received email verification parameters
    if (route.params?.mode === 'verifyEmail' && route.params?.oobCode) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log(
          '[ConfirmLogin] Email verification link detected - will process in LoginComponent'
        );
      }
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
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ConfirmLogin AppState] App state changed to:', nextAppState);
      }
      // Disable AppState navigation on iOS - LoginComponent handles it
      if (Platform.OS === 'ios') {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[ConfirmLogin AppState] iOS - skipping, LoginComponent handles navigation');
        }
        return;
      }
      if (nextAppState === 'active') {
        // Use the consolidated check to prevent double navigation
        checkAndNavigateIfVerified();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [navigation, route.params, authReducer.userData?.email, dispatch, checkAndNavigateIfVerified]);

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
