import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import validator from '@/utils/validation/validator';
import { MainStackParamList } from '@/src/navigator/types';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { setLoginData } from '@/src/redux/actions/AuthActions';
import { loginWithEmailAndPassword, verifyEmailTwoFactorCode } from '@/services/login';
import { ApiCall } from '@/src/services/api';

import Button from '../Button';
import StyledText from '../styled/Text';
import StyledTextInput from '../styled/TextInput';
import { styles } from './styles';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Login'>;

interface Props {
  showConfirmationEmailMessage: boolean;
  currentUserEmail?: string;
  onlyPassword?: boolean;
  enabledLoginProviders?: string[];
  [key: string]: any;
}

function LoginComponent({ showConfirmationEmailMessage, currentUserEmail, onlyPassword }: Props) {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();

  const emailRef = useRef(currentUserEmail ?? '');
  const passwordRef = useRef('');
  const totpRef = useRef('');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [needsEmailTwoFactor, setNeedsEmailTwoFactor] = useState(false);
  const [isVerificationNeeded, setIsVerificationNeeded] = useState(false);

  const [form, setForm] = useState({
    email: currentUserEmail ?? '',
    emailError: '',
    password: '',
    passwordError: '',
    twoFactorCode: '',
    emailTwoFactorCode: '',
  });

  const canEditEmail = !onlyPassword;

  const resolvedEmail = useMemo(() => (form.email || emailRef.current || '').trim(), [form.email]);
  const resolvedPassword = useMemo(() => form.password || passwordRef.current, [form.password]);
  const resolvedTwoFactor = useMemo(
    () => form.twoFactorCode || totpRef.current,
    [form.twoFactorCode]
  );

  const resetForm = useCallback(() => {
    emailRef.current = currentUserEmail ?? '';
    passwordRef.current = '';
    totpRef.current = '';
    setForm({
      email: currentUserEmail ?? '',
      emailError: '',
      password: '',
      passwordError: '',
      twoFactorCode: '',
      emailTwoFactorCode: '',
    });
    setError('');
    setSuccess('');
    setNeedsTwoFactor(false);
    setNeedsEmailTwoFactor(false);
    setIsVerificationNeeded(false);
  }, [currentUserEmail]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    resetForm();
    setIsRefreshing(false);
  }, [resetForm]);

  const sendVerificationEmail = useCallback(async () => {
    try {
      dispatch(setLoader(true));
      await ApiCall({
        route: 'auth/sendVerificationEmail',
        verb: 'post',
        token: true,
        params: {},
      });
      setSuccess('Verification email sent. Check your inbox.');
      setError('');
    } catch {
      setError('Unable to send verification email. Please try again.');
    } finally {
      dispatch(setLoader(false));
    }
  }, [dispatch]);

  const signInUser = useCallback(async () => {
    try {
      setError('');
      setSuccess('');

      if (!!onlyPassword && resolvedEmail !== (currentUserEmail ?? '')) {
        setError("Please login with the current user's email.");
        return;
      }

      if (!needsEmailTwoFactor) {
        const emailError = await validator('email', resolvedEmail);
        const passwordError = await validator('password', resolvedPassword);
        setForm((prev) => ({ ...prev, emailError, passwordError }));
        if (emailError || passwordError) {
          return;
        }
      }

      dispatch(setLoader(true));

      if (needsEmailTwoFactor) {
        const code = (form.emailTwoFactorCode || '').trim();
        if (!code) {
          setError('Enter the code we sent to your email.');
          return;
        }

        const res = await verifyEmailTwoFactorCode({
          email: resolvedEmail,
          code,
        });

        if (res.status !== 200) {
          const message = (res.response as any)?.message ?? 'Invalid code. Please try again.';
          setError(message);
          return;
        }

        const accessToken = (res.response as any)?.tokens?.accessToken;
        const user = (res.response as any)?.user;
        if (!accessToken) {
          setError('Unable to sign in. Please try again.');
          return;
        }

        dispatch(setLoginData({ token: accessToken }));

        if (user?.emailVerified) {
          navigation.reset({ index: 0, routes: [{ name: 'MainRoot' as any }] });
          return;
        }

        setIsVerificationNeeded(true);
        navigation.navigate('ConfirmLogin' as any, { showConfirmationEmailMessage: true });
        return;
      }

      const res = await loginWithEmailAndPassword({
        email: resolvedEmail,
        password: resolvedPassword,
        twoFactorCode: needsTwoFactor ? resolvedTwoFactor : undefined,
      });

      if (res.status !== 200) {
        const message = (res.response as any)?.message ?? 'Unable to sign in. Please try again.';
        if (typeof message === 'string' && message.toLowerCase().includes('two-factor')) {
          setNeedsTwoFactor(true);
          setError('Enter your authenticator code to continue.');
        } else {
          setError(message);
        }
        return;
      }

      if ((res.response as any)?.twoFactorRequired && (res.response as any)?.method === 'email') {
        setNeedsEmailTwoFactor(true);
        setSuccess('Check your email for a login code, then enter it below.');
        return;
      }

      const accessToken = (res.response as any)?.tokens?.accessToken;
      const user = (res.response as any)?.user;

      if (!accessToken) {
        setError('Unable to sign in. Please try again.');
        return;
      }

      dispatch(setLoginData({ token: accessToken }));

      if (user?.emailVerified) {
        navigation.reset({ index: 0, routes: [{ name: 'MainRoot' as any }] });
        return;
      }

      setIsVerificationNeeded(true);
      navigation.navigate('ConfirmLogin' as any, { showConfirmationEmailMessage: true });
    } catch (e: any) {
      setError(e?.message ?? 'Unable to sign in. Please try again.');
    } finally {
      dispatch(setLoader(false));
    }
  }, [
    currentUserEmail,
    dispatch,
    navigation,
    needsEmailTwoFactor,
    needsTwoFactor,
    onlyPassword,
    resolvedEmail,
    resolvedPassword,
    resolvedTwoFactor,
    form.emailTwoFactorCode,
  ]);

  const showVerifyPrompt = showConfirmationEmailMessage || isVerificationNeeded;

  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      removeClippedSubviews={false}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.container}>
        <StyledText style={styles.Header}>Welcome back</StyledText>

        {!!error && (
          <View style={styles.Errorview}>
            <StyledText style={styles.errortext}>{error}</StyledText>
          </View>
        )}

        {!!success && (
          <View style={styles.center}>
            <StyledText style={styles.text}>{success}</StyledText>
          </View>
        )}

        <StyledTextInput
          label="Email"
          value={form.email}
          editable={canEditEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(value: string) => {
            emailRef.current = value;
            setForm((prev) => ({ ...prev, email: value, emailError: '' }));
          }}
        />
        {!!form.emailError && <StyledText style={styles.fieldError}>{form.emailError}</StyledText>}

        <StyledTextInput
          label="Password"
          value={form.password}
          secureTextEntry
          autoCapitalize="none"
          onChangeText={(value: string) => {
            passwordRef.current = value;
            setForm((prev) => ({ ...prev, password: value, passwordError: '' }));
          }}
        />
        {!!form.passwordError && (
          <StyledText style={styles.fieldError}>{form.passwordError}</StyledText>
        )}

        {needsTwoFactor && (
          <StyledTextInput
            label="Authenticator Code"
            value={form.twoFactorCode}
            keyboardType="number-pad"
            onChangeText={(value: string) => {
              totpRef.current = value;
              setForm((prev) => ({ ...prev, twoFactorCode: value }));
            }}
          />
        )}

        {needsEmailTwoFactor && (
          <StyledTextInput
            label="Email Code"
            value={form.emailTwoFactorCode}
            keyboardType="number-pad"
            onChangeText={(value: string) => {
              setForm((prev) => ({ ...prev, emailTwoFactorCode: value }));
            }}
          />
        )}

        <Button
          text={needsEmailTwoFactor ? 'Verify code' : 'Sign in'}
          btnStyle={styles.btn}
          btnTextStyle={styles.btnTitle}
          onPress={signInUser}
        />

        {showVerifyPrompt && (
          <View style={styles.center}>
            <StyledText style={styles.simpleText}>
              Verify your email to continue. Tap below to resend the verification email.
            </StyledText>
            <TouchableOpacity
              onPress={() => {
                sendVerificationEmail();
              }}
            >
              <StyledText style={styles.helight}>Resend verification email</StyledText>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={() => {
            Alert.alert('Forgot password', 'We’ll email you a link to set a new password.');
            navigation.navigate('ForgotPassword' as any, { email: resolvedEmail } as any);
          }}
        >
          <StyledText style={styles.helight}>Forgot password?</StyledText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default LoginComponent;
