import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { useSignUp } from '@clerk/expo/legacy';
import Toast from 'react-native-simple-toast';

import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  getProfile,
  sendVerificationEmail as sendVerificationEmailAction,
  setLoginData,
} from '@/src/redux/actions/AuthActions';
import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import Button from '@/components/Button';
import { ApiCall } from '@/src/services/api';
import { syncClerkUserProfile } from '@/src/services/clerkSync';
import { getValidAccessToken } from '@/src/services/authTokens';

type Props = NativeStackScreenProps<MainStackParamList, 'ConfirmLogin'>;

const ALREADY_VERIFIED_SIGN_IN_MESSAGE = 'Your email is already verified. Sign in to continue.';

const getClerkErrorValues = (error: any) => {
  const clerkErrors = Array.isArray(error?.errors) ? error.errors : [];
  return [
    error?.code,
    error?.message,
    ...clerkErrors.flatMap((clerkError: any) => [
      clerkError?.code,
      clerkError?.message,
      clerkError?.longMessage,
    ]),
  ].filter((value): value is string => typeof value === 'string');
};

const getClerkErrorMessage = (error: any, fallback: string) =>
  error?.errors?.[0]?.longMessage ?? error?.errors?.[0]?.message ?? error?.message ?? fallback;

const isAlreadyVerifiedClerkError = (error: any) =>
  getClerkErrorValues(error).some((value) => {
    const normalized = value.toLowerCase().replace(/[_-]+/g, ' ');
    return normalized.includes('already') && normalized.includes('verified');
  });

const getCreatedSessionId = (value: any) => {
  const sessionId = value?.createdSessionId;
  return typeof sessionId === 'string' && sessionId.trim() ? sessionId : undefined;
};

const normalizeClerkMissingField = (field: string) =>
  field
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const normalizeClerkUsername = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_-]+/g, '_');

const getClerkMissingFields = (value: any) => {
  const fields =
    value?.missingFields ??
    value?.missing_fields ??
    value?.missingRequirements ??
    value?.missing_requirements;

  return Array.isArray(fields)
    ? fields.filter((field): field is string => typeof field === 'string')
    : [];
};

const clerkMissingFieldLabel = (field: string) => {
  const normalized = normalizeClerkMissingField(field);
  if (normalized === 'first_name') {
    return 'first name';
  }
  if (normalized === 'last_name') {
    return 'last name';
  }
  if (normalized === 'legal_accepted') {
    return 'terms acceptance';
  }
  return normalized.replace(/_/g, ' ') || field;
};

const getClerkMissingRequirementsMessage = (fields: string[]) => {
  const labels = fields.map(clerkMissingFieldLabel);
  if (labels.length === 0) {
    return 'Additional profile information is required before continuing.';
  }
  const labelList = labels.join(', ');
  return `Clerk needs ${labelList} before continuing. Please go back and complete sign up again.`;
};

const getClerkMissingRequirementsUpdate = (
  missingFields: string[],
  routeParams: Props['route']['params'] | undefined
) => {
  const requestedFields = new Set(
    (missingFields.length
      ? missingFields
      : ['first_name', 'last_name', 'username', 'legal_accepted']
    ).map(normalizeClerkMissingField)
  );
  const update: {
    firstName?: string;
    lastName?: string;
    username?: string;
    legalAccepted?: boolean;
  } = {};

  const firstName = routeParams?.signupFirstName?.trim();
  const lastName = routeParams?.signupLastName?.trim();
  const username = routeParams?.signupUsername?.trim();
  const clerkUsername = username ? normalizeClerkUsername(username) : undefined;

  if (requestedFields.has('first_name') && firstName) {
    update.firstName = firstName;
  }
  if (requestedFields.has('last_name') && lastName) {
    update.lastName = lastName;
  }
  if (requestedFields.has('username') && clerkUsername) {
    update.username = clerkUsername;
  }
  if (requestedFields.has('legal_accepted')) {
    update.legalAccepted = true;
  }

  return update;
};

const getUnpatchedClerkMissingFields = (
  missingFields: string[],
  update: ReturnType<typeof getClerkMissingRequirementsUpdate>
) =>
  missingFields.filter((field) => {
    const normalized = normalizeClerkMissingField(field);
    if (normalized === 'first_name') {
      return !update.firstName;
    }
    if (normalized === 'last_name') {
      return !update.lastName;
    }
    if (normalized === 'username') {
      return !update.username;
    }
    if (normalized === 'legal_accepted') {
      return update.legalAccepted !== true;
    }
    return true;
  });

function ConfirmLogin({ route, navigation }: Props) {
  const dispatch = useDispatch();
  const { isLoaded: isSignUpLoaded, signUp, setActive } = useSignUp();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const isVerifying = useSelector((state: RootState) => state.auth.verifyEmailTokenPending);
  const verificationError = useSelector((state: RootState) => state.auth.verifyEmailTokenError);
  const { dark, colors } = useTheme();
  const [isResending, setIsResending] = useState(false);
  const [resendTargetEmail] = useState(route?.params?.prefillEmail ?? '');
  const [verificationCode, setVerificationCode] = useState('');
  const [clerkError, setClerkError] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const isClerkSignupCode = route?.params?.mode === 'clerk-signup-code';
  const normalizedResendEmail = useMemo(
    () => resendTargetEmail.trim().toLowerCase(),
    [resendTargetEmail]
  );

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
    if (isClerkSignupCode) {
      if (!isSignUpLoaded || !signUp) {
        return;
      }
      setClerkError('');
      setIsResending(true);
      try {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      } catch (error: any) {
        setClerkError(
          error?.errors?.[0]?.longMessage ??
            error?.errors?.[0]?.message ??
            error?.message ??
            'Unable to resend verification code.'
        );
      } finally {
        setTimeout(() => setIsResending(false), 800);
      }
      return;
    }

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
        params: { email: normalizedResendEmail },
      });
    } finally {
      setTimeout(() => setIsResending(false), 800);
    }
  }, [
    dispatch,
    isClerkSignupCode,
    isSignUpLoaded,
    normalizedResendEmail,
    resendTargetEmail,
    signUp,
    token,
  ]);

  const refreshProfile = useCallback(async () => {
    if (token) {
      await syncClerkUserProfile({
        email: normalizedResendEmail || undefined,
      }).catch(() => undefined);
      dispatch(getProfile.Request({ token }));
    }
  }, [dispatch, normalizedResendEmail, token]);

  const returnToLoginForVerifiedSignup = useCallback(() => {
    Toast.show(ALREADY_VERIFIED_SIGN_IN_MESSAGE, Toast.LONG);
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Login' as any,
          params: normalizedResendEmail ? { prefillEmail: normalizedResendEmail } : undefined,
        } as any,
      ],
    });
  }, [navigation, normalizedResendEmail]);

  const completeClerkSignupSession = useCallback(
    async (createdSessionId: string) => {
      if (!setActive) {
        throw new Error('Authentication is still loading. Please try again.');
      }

      await setActive({ session: createdSessionId });
      const [syncResult, accessToken] = await Promise.all([
        syncClerkUserProfile({
          email: normalizedResendEmail || undefined,
          name: route?.params?.signupName,
          username: route?.params?.signupUsername,
          accountType: route?.params?.accountType as any,
        }),
        getValidAccessToken(),
      ]);
      if (!accessToken) {
        throw new Error('Unable to start a Clerk session.');
      }

      dispatch(setLoginData({ token: accessToken, resetProfile: true, authMethod: 'password' }));
      dispatch(getProfile.Success(syncResult.response?.user ?? syncResult.response));
      navigation.reset({ index: 0, routes: [{ name: 'MainRoot' as any }] });
    },
    [
      dispatch,
      navigation,
      normalizedResendEmail,
      route?.params?.accountType,
      route?.params?.signupName,
      route?.params?.signupUsername,
      setActive,
    ]
  );

  const completeOrPatchClerkSignup = useCallback(
    async (result: any) => {
      if (result?.status === 'complete') {
        const createdSessionId = getCreatedSessionId(result) ?? getCreatedSessionId(signUp);
        if (createdSessionId) {
          await completeClerkSignupSession(createdSessionId);
        } else {
          returnToLoginForVerifiedSignup();
        }
        return;
      }

      if (result?.status !== 'missing_requirements') {
        setClerkError('Additional verification is required before continuing.');
        return;
      }

      const missingFields = getClerkMissingFields(result);
      const update = getClerkMissingRequirementsUpdate(missingFields, route?.params);
      const unpatchedFields = getUnpatchedClerkMissingFields(missingFields, update);

      if (__DEV__) {
        console.log('[ConfirmLogin] Clerk signup missing requirements', {
          missingFields,
          patchFields: Object.keys(update),
        });
      }

      if (unpatchedFields.length > 0 || Object.keys(update).length === 0) {
        setClerkError(
          getClerkMissingRequirementsMessage(
            unpatchedFields.length > 0 ? unpatchedFields : missingFields
          )
        );
        return;
      }

      if (typeof signUp?.update !== 'function') {
        setClerkError('Additional profile information is required before continuing.');
        return;
      }

      const updateResult = await signUp.update(update);
      if (updateResult?.status === 'complete') {
        const updatedSessionId = getCreatedSessionId(updateResult) ?? getCreatedSessionId(signUp);
        if (updatedSessionId) {
          await completeClerkSignupSession(updatedSessionId);
        } else {
          returnToLoginForVerifiedSignup();
        }
        return;
      }

      const remainingFields = getClerkMissingFields(updateResult);
      setClerkError(
        getClerkMissingRequirementsMessage(
          remainingFields.length > 0 ? remainingFields : missingFields
        )
      );
    },
    [completeClerkSignupSession, returnToLoginForVerifiedSignup, route?.params, signUp]
  );

  const verifyClerkSignupCode = useCallback(async () => {
    const code = verificationCode.trim();
    if (!isSignUpLoaded || !signUp) {
      setClerkError('Authentication is still loading. Please try again.');
      return;
    }
    const existingSessionId = getCreatedSessionId(signUp);
    if (signUp.status !== 'complete' && !code) {
      setClerkError('Enter the verification code from your email.');
      return;
    }

    setClerkError('');
    setIsSubmittingCode(true);
    try {
      if (signUp.status === 'complete') {
        if (existingSessionId) {
          await completeClerkSignupSession(existingSessionId);
        } else {
          returnToLoginForVerifiedSignup();
        }
        return;
      }

      const result = await signUp.attemptEmailAddressVerification({ code });
      await completeOrPatchClerkSignup(result);
    } catch (error: any) {
      if (isAlreadyVerifiedClerkError(error)) {
        const completedSessionId = getCreatedSessionId(signUp);
        if (completedSessionId) {
          try {
            await completeClerkSignupSession(completedSessionId);
          } catch (sessionError: any) {
            setClerkError(
              getClerkErrorMessage(sessionError, 'Unable to start a Clerk session. Please sign in.')
            );
          }
        } else {
          returnToLoginForVerifiedSignup();
        }
        return;
      }

      setClerkError(getClerkErrorMessage(error, 'Unable to verify this code. Please try again.'));
    } finally {
      setIsSubmittingCode(false);
    }
  }, [
    completeOrPatchClerkSignup,
    completeClerkSignupSession,
    isSignUpLoaded,
    returnToLoginForVerifiedSignup,
    signUp,
    verificationCode,
  ]);

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
            {isClerkSignupCode
              ? `We sent a verification code to ${resendTargetEmail || 'your email'}. Enter it to continue.`
              : `We sent a verification link to ${resendTargetEmail || 'your email'}. Tap the link to continue.`}
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

          {verificationError || clerkError ? (
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
                {clerkError || verificationError}
              </StyledText>
            </View>
          ) : null}

          {isClerkSignupCode ? (
            <>
              <TextInput
                value={verificationCode}
                onChangeText={(value) => {
                  setVerificationCode(value);
                  setClerkError('');
                }}
                placeholder="Verification code"
                placeholderTextColor={palette.textSecondary}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                style={{
                  minHeight: 56,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  marginBottom: 12,
                  backgroundColor: dark ? '#202328' : '#F2F3F3',
                  color: palette.textMain,
                  fontFamily: 'Lato',
                  fontSize: 18,
                }}
              />
              <Button
                text={isSubmittingCode ? 'Verifying...' : 'Verify code'}
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
                onPress={verifyClerkSignupCode}
                disabled={isSubmittingCode || isVerifying}
              />
            </>
          ) : null}

          {isClerkSignupCode ? <View style={{ height: 12 }} /> : null}

          <Button
            text={
              isResending
                ? 'Sending...'
                : isClerkSignupCode
                  ? 'Resend code'
                  : 'Resend verification email'
            }
            btnStyle={{
              backgroundColor: isClerkSignupCode ? 'transparent' : palette.primary,
              height: 56,
              width: '100%',
              borderRadius: 999,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: isClerkSignupCode ? 1 : 0,
              borderColor: palette.divider,
            }}
            btnTextStyle={{
              fontFamily: 'Lato',
              fontWeight: '600',
              fontSize: 18,
              color: isClerkSignupCode ? palette.primary : '#FFF',
            }}
            onPress={resendVerificationEmail}
            disabled={isResending || isVerifying}
          />

          {!isClerkSignupCode ? <View style={{ height: 12 }} /> : null}

          {!isClerkSignupCode ? (
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
          ) : null}
        </View>
        <View style={{ height: spacing.x24 }} />
      </ScrollView>
    </UserStepsLayout>
  );
}

export default ConfirmLogin;
