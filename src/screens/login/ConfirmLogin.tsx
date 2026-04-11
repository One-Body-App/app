import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, View, PermissionsAndroid } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';

import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  getProfile,
  logout,
  sendVerificationEmail as sendVerificationEmailAction,
} from '@/src/redux/actions/AuthActions';
import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import Button from '@/components/Button';
import { ApiCall } from '@/src/services/api';
import { ensurePushPermission } from '@/src/services/notification/pushNotificationService';

type Props = StackScreenProps<MainStackParamList, 'ConfirmLogin'>;

function ConfirmLogin({ route }: Props) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const profile = useSelector((state: RootState) => state.auth.getProfileData);
  const { dark, colors } = useTheme();
  const [isResending, setIsResending] = useState(false);
  const [resendTargetEmail, setResendTargetEmail] = useState(route?.params?.prefillEmail ?? '');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>(
    'idle'
  );
  const [verifyError, setVerifyError] = useState<string>('');
  const verifyHandledRef = React.useRef(false);
  const permissionsRequestedRef = React.useRef(false);

  const palette = useMemo(
    () => ({
      background: Colors.neutral[700],
      card: dark ? '#0D0D0D' : '#FFFFFF',
      cardBorder: dark ? 'rgba(255, 255, 255, 0.08)' : '#F2F3F3',
      textMain: dark ? '#FFFFF7' : '#032F3C',
      textSecondary: dark ? '#999DA1' : '#5A5C5B',
      primary: '#126B87',
      divider: dark ? 'rgba(255, 255, 255, 0.08)' : '#F2F3F3',
    }),
    [dark]
  );

  useEffect(() => {
    const deepLinkToken = route?.params?.token;
    if (!deepLinkToken) {
      return;
    }
    if (verifyHandledRef.current) {
      return;
    }
    // If the profile already shows emailVerified, the token was already consumed.
    // Skip the API call — the auth guard will navigate to MainRoot once profile loads.
    if (profile?.emailVerified) {
      verifyHandledRef.current = true;
      return;
    }
    verifyHandledRef.current = true;

    const run = async () => {
      try {
        setVerifyStatus('verifying');
        setVerifyError('');
        const res = await ApiCall({
          route: 'auth/verify-email',
          verb: 'post',
          params: { token: deepLinkToken },
        });

        if (res?.status === 200) {
          setVerifyStatus('success');
          dispatch(
            getProfile.Success({
              ...(profile ?? {}),
              email: profile?.email ?? resendTargetEmail ?? undefined,
              emailVerified: true,
              isProfileCompleted: profile?.isProfileCompleted ?? false,
            })
          );
          if (token) {
            dispatch(getProfile.Request({ token }));
          }
        } else {
          setVerifyStatus('failed');
          setVerifyError(res?.response?.message ?? 'Verification failed. Please resend the email.');
        }
      } catch (e: any) {
        setVerifyStatus('failed');
        setVerifyError(e?.message ?? 'Verification failed. Please resend the email.');
      }
    };

    run();
  }, [dispatch, profile, profile?.emailVerified, resendTargetEmail, route?.params?.token, token]);

  useEffect(() => {
    if (profile?.email && profile.email !== resendTargetEmail) {
      setResendTargetEmail(profile.email);
    }
  }, [profile?.email, resendTargetEmail]);

  useEffect(() => {
    if (route?.params?.token && verifyStatus !== 'success' && verifyStatus !== 'failed') {
      return;
    }
    if (token) {
      dispatch(getProfile.Request({ token }));
    }
  }, [dispatch, route?.params?.token, token, verifyStatus]);

  const resendVerificationEmail = useCallback(async () => {
    if (!token && !resendTargetEmail) {
      return;
    }
    setIsResending(true);
    if (token) {
      dispatch(
        sendVerificationEmailAction.Request({
          token: true,
          data: {},
          allowFalseSuccess: true,
        })
      );
      setTimeout(() => setIsResending(false), 800);
      return;
    }

    try {
      await ApiCall({
        route: 'auth/sendVerificationEmail/public',
        verb: 'post',
        params: { email: resendTargetEmail.trim().toLowerCase() },
      });
    } finally {
      setTimeout(() => setIsResending(false), 800);
    }
  }, [dispatch, resendTargetEmail, token]);

  const refreshProfile = useCallback(() => {
    if (token) {
      dispatch(getProfile.Request({ token }));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (!profile?.emailVerified) {
      return;
    }
    if (permissionsRequestedRef.current) {
      return;
    }
    permissionsRequestedRef.current = true;

    const requestPermissions = async () => {
      try {
        if (Platform.OS === 'android') {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
            title: 'Allow location',
            message: 'We use your city to help secure your account and content.',
            buttonPositive: 'Allow',
          });
        } else {
          await Geolocation.requestAuthorization();
        }
        await ensurePushPermission();
      } catch (e) {
        // ignore errors
      }
    };

    requestPermissions();
  }, [profile?.emailVerified]);

  const signOut = useCallback(async () => {
    dispatch(logout());
  }, [dispatch]);

  return (
    <UserStepsLayout
      backgroundColor={dark ? colors.background : Colors.neutral[700]}
      showCustomHeaderOnAndroid
    >
      <ScrollView
        style={{ flexGrow: 1, marginTop: spacing.x24 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={{ paddingHorizontal: 16 }}>
          <StyledText
            style={{
              fontFamily: 'Rubik',
              fontWeight: '600',
              fontSize: 34,
              lineHeight: 40,
              color: palette.textMain,
              marginBottom: 8,
            }}
          >
            Verify your email
          </StyledText>
          <StyledText
            style={{
              fontFamily: 'Lato',
              fontSize: 16,
              lineHeight: 24,
              color: palette.textSecondary,
            }}
          >
            We sent a verification link to {resendTargetEmail || 'your email'}. Tap the link to
            continue.
          </StyledText>
        </View>

        <View
          style={{
            marginTop: 24,
            marginHorizontal: 12,
            backgroundColor: palette.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.cardBorder,
            padding: 16,
          }}
        >
          {verifyStatus === 'success' ? (
            <View
              style={{
                backgroundColor: dark ? 'rgba(18, 172, 123, 0.15)' : '#EDFFF9',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(18, 172, 123, 0.25)',
              }}
            >
              <StyledText
                style={{
                  fontFamily: 'Rubik',
                  fontSize: 14,
                  lineHeight: 22,
                  color: '#12AC7B',
                }}
              >
                Email verified. You can return to the app.
              </StyledText>
            </View>
          ) : null}

          {verifyStatus === 'failed' ? (
            <View style={{ marginBottom: 16 }}>
              <StyledText style={{ color: '#DC2C10', fontSize: 12, fontFamily: 'Lato' }}>
                {verifyError}
              </StyledText>
            </View>
          ) : null}

          {route?.params?.showConfirmationEmailMessage ? (
            <View
              style={{
                backgroundColor: dark ? 'rgba(18, 172, 123, 0.15)' : '#EDFFF9',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(18, 172, 123, 0.25)',
              }}
            >
              <StyledText
                style={{
                  fontFamily: 'Rubik',
                  fontSize: 14,
                  lineHeight: 22,
                  color: '#12AC7B',
                }}
              >
                Account created. Check your email to verify your account.
              </StyledText>
            </View>
          ) : null}

          {verifyStatus === 'success' ? (
            <>
              <Button
                text="Continue"
                btnStyle={{
                  backgroundColor: palette.primary,
                  height: 56,
                  width: '100%',
                  borderRadius: 999,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                btnTextStyle={{
                  fontFamily: 'Lato',
                  fontWeight: '600',
                  fontSize: 18,
                  color: '#FFF',
                }}
                onPress={refreshProfile}
                disabled={!token}
              />

              <View style={{ height: 12 }} />
            </>
          ) : null}

          <Button
            text={isResending ? 'Sending…' : 'Resend verification email'}
            btnStyle={{
              backgroundColor: palette.primary,
              height: 56,
              width: '100%',
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            btnTextStyle={{ fontFamily: 'Lato', fontWeight: '600', fontSize: 18, color: '#FFF' }}
            onPress={resendVerificationEmail}
            disabled={isResending}
          />

          <View style={{ height: 12 }} />

          <Button
            text="I already verified"
            btnStyle={{
              backgroundColor: 'transparent',
              height: 56,
              width: '100%',
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: palette.divider,
            }}
            btnTextStyle={{
              fontFamily: 'Lato',
              fontWeight: '600',
              fontSize: 18,
              color: palette.primary,
            }}
            onPress={refreshProfile}
          />

          <View style={{ height: 8 }} />

          <Button
            text="Back to sign in"
            btnStyle={{ backgroundColor: 'transparent' }}
            btnTextStyle={{ fontFamily: 'Lato', fontSize: 16, color: palette.primary }}
            onPress={signOut}
          />
        </View>
        <View style={{ height: spacing.x24 }} />
      </ScrollView>
    </UserStepsLayout>
  );
}

export default ConfirmLogin;
