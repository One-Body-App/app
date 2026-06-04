import React from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSignIn } from '@clerk/expo/legacy';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { getProfile, setLoginData } from '@/src/redux/actions/AuthActions';
import { getValidAccessToken } from '@/src/services/authTokens';
import { syncClerkUserProfile } from '@/src/services/clerkSync';
import GeneralStyle from '../../constants/GeneralStyle';
import Button from '@/components/Button';

import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { borderRadius } from '@/src/styles/outlines';
import StyledTextInput from '@/components/styled/TextInput';
import { button } from '@/src/styles/buttons';
import {
  getResetPasswordErrorMessage,
  getResetPasswordStrength,
} from '../resetPassword/resetPasswordUtils';

type Props = NativeStackScreenProps<MainStackParamList, 'ForgotPassword'>;

const emailvalidate = (text: string) => {
  const reg = /^\w+([.\-+]?\w+)*@\w+([.-]?\w+)*(\.\w\w+)+$/;

  if (reg.test(text) === false) {
    return true;
  }
  return false;
};

type ResetStep = 'email' | 'code' | 'complete';

const getResetEmailAddressId = (result: any) => {
  const factors = Array.isArray(result?.supportedFirstFactors)
    ? result.supportedFirstFactors
    : Array.isArray(result?.supported_first_factors)
      ? result.supported_first_factors
      : [];
  const factor = factors.find((item: any) => item?.strategy === 'reset_password_email_code');
  return factor?.emailAddressId ?? factor?.email_address_id;
};

function ForgotPassword({ route, navigation }: Props) {
  const [email, setEmail] = React.useState<string>(route?.params?.email ?? '');
  const [error, seterror] = React.useState<string>('');
  const [showSuccess, setShowSuccess] = React.useState<boolean>(false);
  const [step, setStep] = React.useState<ResetStep>('email');
  const [code, setCode] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const { colors } = useTheme();
  const { isLoaded, signIn, setActive } = useSignIn();
  const strength = getResetPasswordStrength(password);

  const dispatch = useDispatch();

  const completeResetSession = async (createdSessionId?: string | null) => {
    if (!createdSessionId || !setActive) {
      setStep('complete');
      setShowSuccess(true);
      return;
    }

    await setActive({ session: createdSessionId });
    const accessToken = await getValidAccessToken({ forceRefreshClerk: true });
    if (!accessToken) {
      throw new Error('Unable to start Clerk session.');
    }

    const syncResult = await syncClerkUserProfile({
      email: email.trim().toLowerCase(),
      token: accessToken,
    });
    if (syncResult.status !== 200) {
      throw new Error(
        typeof syncResult.response?.message === 'string'
          ? syncResult.response.message
          : 'Unable to finish sign in after resetting your password.'
      );
    }

    dispatch(setLoginData({ token: accessToken, resetProfile: true, authMethod: 'password' }));
    dispatch(getProfile.Success(syncResult.response?.user ?? syncResult.response));
    navigation.reset({ index: 0, routes: [{ name: 'MainRoot' as any }] });
  };

  const requestResetCode = async () => {
    if (emailvalidate(email) || email == null) {
      seterror('Email not valid!!');
      return;
    }

    if (!isLoaded || !signIn) {
      seterror('Password reset is still loading. Please try again.');
      return;
    }

    seterror('');
    dispatch(setLoader(true));
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await signIn.create({
        identifier: normalizedEmail,
        strategy: 'reset_password_email_code',
      } as any);
      const emailAddressId = getResetEmailAddressId(result);
      if (result.status === 'needs_first_factor' && emailAddressId) {
        await signIn.prepareFirstFactor({
          strategy: 'reset_password_email_code',
          emailAddressId,
        } as any);
      }
      setEmail(normalizedEmail);
      setCode('');
      setPassword('');
      setConfirmPassword('');
      setShowSuccess(true);
      setStep('code');
    } catch (e: any) {
      seterror(getResetPasswordErrorMessage(e));
    } finally {
      dispatch(setLoader(false));
    }
  };

  const finishReset = async () => {
    if (!isLoaded || !signIn) {
      seterror('Password reset is still loading. Please try again.');
      return;
    }
    if (!code.trim()) {
      seterror('Enter the verification code.');
      return;
    }
    if (password.length < 8) {
      seterror('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      seterror('Passwords do not match.');
      return;
    }

    seterror('');
    dispatch(setLoader(true));
    try {
      let result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password,
      } as any);

      if (result.status === 'needs_new_password') {
        result = await signIn.resetPassword({
          password,
          signOutOfOtherSessions: true,
        });
      }

      if (result.status !== 'complete') {
        throw new Error('Additional verification is required before resetting your password.');
      }

      await completeResetSession(result.createdSessionId);
    } catch (e: any) {
      seterror(getResetPasswordErrorMessage(e));
    } finally {
      dispatch(setLoader(false));
    }
  };

  return (
    <UserStepsLayout backgroundColor={colors.background} showCustomHeaderOnAndroid>
      <ScrollView style={{ flexGrow: 1 }}>
        <View style={{ marginHorizontal: spacing.x16 }}>
          <View style={{ marginVertical: spacing.x16 }}>
            <StyledText style={Typography.header.h1}>Forgot your password?</StyledText>

            <StyledText
              style={[
                Typography.subheader.R,
                { color: Colors.neutral[200], marginTop: spacing.x8 },
              ]}
            >
              No problem! Enter the email address that you signed up with to reset it.
            </StyledText>
          </View>
          <View
            style={{
              paddingHorizontal: spacing.x16,
              paddingVertical: spacing.x24,

              backgroundColor: colors.background,
              borderRadius: borderRadius.base,
              marginBottom: spacing.x64,
              marginTop: spacing.x32,
            }}
          >
            <View style={{ flex: 1 }}>
              {showSuccess && step === 'code' ? (
                <View
                  style={[
                    GeneralStyle.MessageView,
                    { backgroundColor: Colors.successFeedback.background },
                  ]}
                >
                  <StyledText style={GeneralStyle.successtext}>
                    If an account exists for that email, we sent a verification code.
                  </StyledText>
                </View>
              ) : null}
              {showSuccess && step === 'complete' ? (
                <View
                  style={[
                    GeneralStyle.MessageView,
                    { backgroundColor: Colors.successFeedback.background },
                  ]}
                >
                  <StyledText style={GeneralStyle.successtext}>
                    Password updated. You can sign in with your new password.
                  </StyledText>
                </View>
              ) : null}
              <StyledTextInput
                wrapperStyle={{ flex: 1 }}
                value={email}
                keyboardType="email-address"
                label="Email"
                placeholder="Email address"
                autoComplete="email"
                autoCapitalize="none"
                onChangeText={(e) => {
                  setEmail(e);
                  setShowSuccess(false);
                  setStep('email');
                }}
              />
              {step === 'code' ? (
                <>
                  <StyledTextInput
                    wrapperStyle={{ flex: 1 }}
                    value={code}
                    keyboardType="number-pad"
                    label="Verification code"
                    placeholder="Enter code"
                    autoCapitalize="none"
                    onChangeText={(nextCode) => setCode(nextCode)}
                  />
                  <StyledTextInput
                    wrapperStyle={{ flex: 1 }}
                    value={password}
                    label="New password"
                    placeholder="New password"
                    secureTextEntry
                    onChangeText={(nextPassword) => {
                      setPassword(nextPassword);
                      seterror('');
                    }}
                  />
                  <View style={{ marginTop: spacing.x8, marginBottom: spacing.x16 }}>
                    <View
                      style={{
                        height: 4,
                        borderRadius: borderRadius.max,
                        backgroundColor: Colors.neutral[600],
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: 4,
                          width: strength.width,
                          backgroundColor: strength.color,
                        }}
                      />
                    </View>
                    <StyledText style={[Typography.body.x1, { color: strength.color }]}>
                      {strength.label}
                    </StyledText>
                  </View>
                  <StyledTextInput
                    wrapperStyle={{ flex: 1 }}
                    value={confirmPassword}
                    label="Confirm new password"
                    placeholder="Confirm new password"
                    secureTextEntry
                    onChangeText={(nextPassword) => {
                      setConfirmPassword(nextPassword);
                      seterror('');
                    }}
                  />
                </>
              ) : null}
              {error != null ? (
                <StyledText style={{ ...GeneralStyle.InputError }}>{error}</StyledText>
              ) : null}
            </View>
            <Button
              text={step === 'code' ? 'Update Password' : 'Send Reset Code'}
              btnStyle={[
                button.primary,
                {
                  flex: 1,
                },
              ]}
              disabled={!email || step === 'complete'}
              disabledBtnStyle={[
                button.primary,
                {
                  backgroundColor: Colors.primarySapphire[200],
                  flex: 1,
                  opacity: 0.4,
                },
              ]}
              onPress={() => (step === 'code' ? finishReset() : requestResetCode())}
              btnTextStyle={{ color: '#FFF' }}
              disabledBtnTextStyle={{ color: Colors.primarySapphire[600] }}
            />
          </View>

          <View style={{ alignItems: 'center' }}>
            <Button
              onPress={() => {
                Linking.openURL('mailto:support@onebodyapp.com');
              }}
              text="Still having issues? "
              wrapperViewBtnStyle={{ marginTop: spacing.x32 }}
              btnTextStyle={[Typography.subheader.R, { color: Colors.neutral[200] }]}
              rightIcon={
                <StyledText style={{ color: Colors.primarySapphire.brand }}>Contact us</StyledText>
              }
            />
          </View>
        </View>

        {/* <>
              <TextInput
                style={{ ...GeneralStyle.input, marginTop: getHeight(3) }}
                theme={{ roundness: 10 }}
                value={email}
                error={emailError}
                onChangeText={(e) => {
                  setEmail(e), setEmailError(false);
                }}
                keyboardType="email-address"
                mode="outlined"
                activeOutlinecolor={Colors.primarySapphire[500]}
                label={'E-mail'}
                autoComplete="email"
              />
              {error != null ? (
                <View style={styles.emailerrorview}>
                  <Text style={styles.emailerrortext}>{error}</Text>
                </View>
              ) : null}
            </>


          {!showSuccess ? (
            <Button
              text={'SEND RESET LINK'}
              btnStyle={{ marginHorizontal: 24 }}
              // btnStyle={{
              //   ...GeneralStyle.btn,
              //   marginTop: getHeight(5),
              //   backgroundColor: scheme == 'dark' ? '#fff' : '#0C5C75',
              // }}
              // btnTextStyle={GeneralStyle.btnText}
              onPress={() => forget()}
            />
          ) : (
            <View style={{ marginTop: 10 }}>
              <Button text={'GO BACK'} onPress={() => navigation.goBack()} />
            </View>
          )} */}
      </ScrollView>
    </UserStepsLayout>
  );
}

export default ForgotPassword;
