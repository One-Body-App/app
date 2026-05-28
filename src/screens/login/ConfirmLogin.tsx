import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@react-navigation/native';

import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  getProfile,
  sendVerificationEmail as sendVerificationEmailAction,
} from '@/src/redux/actions/AuthActions';
import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import Button from '@/components/Button';
import { ApiCall } from '@/src/services/api';
import { syncClerkUserProfile } from '@/src/services/clerkSync';

type Props = StackScreenProps<MainStackParamList, 'ConfirmLogin'>;

function ConfirmLogin({ route }: Props) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const isVerifying = useSelector((state: RootState) => state.auth.verifyEmailTokenPending);
  const verificationError = useSelector((state: RootState) => state.auth.verifyEmailTokenError);
  const { dark, colors } = useTheme();
  const [isResending, setIsResending] = useState(false);
  const [resendTargetEmail] = useState(route?.params?.prefillEmail ?? '');

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

  const refreshProfile = useCallback(async () => {
    if (token) {
      await syncClerkUserProfile({
        email: resendTargetEmail.trim().toLowerCase() || undefined,
      }).catch(() => undefined);
      dispatch(getProfile.Request({ token }));
    }
  }, [dispatch, resendTargetEmail, token]);

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

          {isVerifying ? (
            <View
              style={{
                backgroundColor: dark ? 'rgba(18, 107, 135, 0.12)' : '#EDF7FB',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(18, 107, 135, 0.25)',
              }}
            >
              <StyledText
                style={{
                  fontFamily: 'Rubik',
                  fontSize: 14,
                  lineHeight: 22,
                  color: palette.primary,
                }}
              >
                Verifying your email&hellip;
              </StyledText>
            </View>
          ) : null}

          {verificationError ? (
            <View
              style={{
                backgroundColor: dark ? 'rgba(255, 107, 107, 0.12)' : '#FFF2F2',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(255, 107, 107, 0.25)',
              }}
            >
              <StyledText
                style={{
                  fontFamily: 'Rubik',
                  fontSize: 14,
                  lineHeight: 22,
                  color: Colors.errorFeedback[200],
                }}
              >
                {verificationError}
              </StyledText>
            </View>
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
            disabled={isResending || isVerifying}
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
            disabled={isVerifying}
          />
        </View>
        <View style={{ height: spacing.x24 }} />
      </ScrollView>
    </UserStepsLayout>
  );
}

export default ConfirmLogin;
