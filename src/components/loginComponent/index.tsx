import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@react-native-vector-icons/ionicons';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainStackParamList } from '@/src/navigator/types';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { setLoginData } from '@/src/redux/actions/AuthActions';
import { loginWithEmailAndPassword, verifyEmailTwoFactorCode } from '@/services/login';
import {
  ensureGoogleSigninConfigured,
  exchangeSocialToken,
  getAppleIdToken,
  getGoogleIdToken,
} from '@/services/socialAuth';

import Button from '../Button';
import StyledText from '../styled/Text';
import StyledTextInput from '../styled/TextInput';
import createLoginStyles from './styles';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Login'>;

const googleIcon = require('@/assets/icons/google.png');

type LoginComponentProps = {
  currentUserEmail?: string;
  clearOnMountKey?: string;
};

function LoginComponent({ currentUserEmail, clearOnMountKey }: LoginComponentProps) {
  const dispatch = useDispatch();
  const navigation = useNavigation<Nav>();
  const { dark } = useTheme();
  const styles = useMemo(() => createLoginStyles(dark), [dark]);

  const [form, setForm] = useState({
    email: currentUserEmail ?? '',
    emailError: '',
    password: '',
    passwordError: '',
    emailTwoFactorCode: '',
  });
  const [hidePass, setHidePass] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [needsEmailTwoFactor, setNeedsEmailTwoFactor] = useState(false);
  const [locationPrompted, setLocationPrompted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('location_permission_requested').then((val) => {
      setLocationPrompted(val === '1');
    });
  }, []);

  useEffect(() => {
    if (!clearOnMountKey) return;
    setForm({
      email: '',
      emailError: '',
      password: '',
      passwordError: '',
      emailTwoFactorCode: '',
    });
    setError('');
    setNeedsEmailTwoFactor(false);
    setHidePass(true);
    setSocialLoading(false);
  }, [clearOnMountKey]);

  useEffect(() => {
    ensureGoogleSigninConfigured();
  }, []);

  const ensureLocationPermission = useCallback(async () => {
    if (locationPrompted) return;
    try {
      let granted = false;
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Allow location',
            message: 'We use your city to help secure your login.',
            buttonPositive: 'Allow',
          }
        );
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        Geolocation.requestAuthorization();
        granted = true;
      }

      if (granted) {
        Geolocation.getCurrentPosition(
          () => undefined,
          () => undefined,
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
        );
      }
    } catch (e) {
      // ignore permission errors; login can proceed
    } finally {
      await AsyncStorage.setItem('location_permission_requested', '1');
      setLocationPrompted(true);
    }
  }, [locationPrompted]);

  const signInUser = useCallback(async () => {
    try {
      setError('');
      dispatch(setLoader(true));
      await ensureLocationPermission();

      if (needsEmailTwoFactor) {
        if (!form.email || !form.emailTwoFactorCode) {
          setError('Enter the code we sent to your email.');
          return;
        }
        const res = await verifyEmailTwoFactorCode({
          email: form.email,
          code: form.emailTwoFactorCode,
        });
        if (res.status === 200) {
          dispatch(setLoginData({ token: (res.response as any).tokens.accessToken }));
          navigation.reset({ index: 0, routes: [{ name: 'MainRoot' as any }] });
        } else {
          setError('Invalid code. Please try again.');
        }
        return;
      }

      if (!form.email || !form.password) {
        setError('Enter your email and password.');
        return;
      }
      const res = await loginWithEmailAndPassword({ email: form.email, password: form.password });

      if (res.status === 200) {
        if ((res.response as any)?.twoFactorRequired) {
          setNeedsEmailTwoFactor(true);
        } else {
          dispatch(setLoginData({ token: (res.response as any).tokens.accessToken }));
          navigation.reset({ index: 0, routes: [{ name: 'MainRoot' as any }] });
        }
      } else {
        const apiMessage = (res.response as any)?.message;
        setError(
          typeof apiMessage === 'string'
            ? apiMessage
            : 'Unable to sign in. Please check your credentials.'
        );
      }
    } catch (e: any) {
      setError(e?.message ?? 'Sign in failed.');
    } finally {
      dispatch(setLoader(false));
    }
  }, [form, needsEmailTwoFactor, dispatch, navigation, ensureLocationPermission]);

  const handleSocialLogin = useCallback(
    async (provider: 'google' | 'apple') => {
      if (socialLoading) return;
      const providerLabel = provider === 'google' ? 'Google' : 'Apple';
      setError('');
      dispatch(setLoader(true));
      setSocialLoading(true);
      try {
        await ensureLocationPermission();
        const tokenResult =
          provider === 'google' ? await getGoogleIdToken() : await getAppleIdToken();

        if (tokenResult.cancelled) {
          return;
        }

        if (!tokenResult.idToken) {
          setError(`Unable to sign in with ${providerLabel}. Please try again.`);
          return;
        }

        const res = await exchangeSocialToken({
          provider,
          idToken: tokenResult.idToken,
          nonce: tokenResult.nonce,
          details: tokenResult.details,
        });

        if (res.status === 200 && res.response?.tokens?.accessToken) {
          dispatch(setLoginData({ token: res.response.tokens.accessToken }));
          navigation.reset({ index: 0, routes: [{ name: 'MainRoot' as any }] });
        } else {
          const apiMessage = (res.response as any)?.message;
          setError(typeof apiMessage === 'string' ? apiMessage : 'Unable to sign in.');
        }
      } catch (e: any) {
        setError(e?.message ?? 'Sign in failed.');
      } finally {
        dispatch(setLoader(false));
        setSocialLoading(false);
      }
    },
    [dispatch, ensureLocationPermission, navigation, socialLoading]
  );

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 250);
            }}
          />
        }
      >
        <View style={styles.headerFrame}>
          <StyledText style={styles.welcomeText}>Welcome back</StyledText>
          {!needsEmailTwoFactor && (
            <StyledText style={styles.subHeaderText}>Sign in to your account</StyledText>
          )}
        </View>

        <View style={styles.cardContainer}>
          {!needsEmailTwoFactor ? (
            <View style={styles.newAccountRow}>
              <StyledText style={styles.newAccountText}>New to One Body? </StyledText>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('AccountType' as any);
                }}
              >
                <StyledText style={styles.newAccountLink}>Create an account</StyledText>
              </TouchableOpacity>
            </View>
          ) : null}

          {needsEmailTwoFactor && (
            <View style={styles.successAlertBox}>
              <StyledText style={styles.successAlertText}>
                Success! A verification code has been sent to your email.
              </StyledText>
            </View>
          )}

          <View style={styles.inputSpacer}>
            <StyledText style={styles.inputLabel}>Email</StyledText>
            <StyledTextInput
              placeholder="Email Address"
              placeholderTextColor={dark ? '#999DA1' : '#838584'}
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              backgroundColor={dark ? '#202328' : '#F2F3F3'}
              inputWrapperStyle={styles.inputWrapper}
              onChangeText={(v) => setForm({ ...form, email: v.trim() })}
            />
          </View>

          {!needsEmailTwoFactor ? (
            <View style={styles.inputSpacer}>
              <StyledText style={styles.inputLabel}>Password</StyledText>
              <StyledTextInput
                placeholder="Password"
                placeholderTextColor={dark ? '#999DA1' : '#838584'}
                secureTextEntry={hidePass}
                value={form.password}
                backgroundColor={dark ? '#202328' : '#F2F3F3'}
                inputWrapperStyle={styles.inputWrapper}
                onChangeText={(v) => setForm({ ...form, password: v })}
                rightIcon={
                  <Ionicons
                    name={hidePass ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#41dbe1"
                    onPress={() => setHidePass(!hidePass)}
                    style={{ alignSelf: 'center' }}
                  />
                }
              />
            </View>
          ) : (
            <View style={styles.inputSpacer}>
              <StyledText style={styles.inputLabel}>Verification code</StyledText>
              <StyledTextInput
                placeholder="Enter 6-digit code"
                placeholderTextColor={dark ? '#999DA1' : '#838584'}
                keyboardType="number-pad"
                value={form.emailTwoFactorCode}
                backgroundColor={dark ? '#202328' : '#F2F3F3'}
                inputWrapperStyle={styles.inputWrapper}
                onChangeText={(v) => setForm({ ...form, emailTwoFactorCode: v })}
              />
            </View>
          )}

          {!!error && <StyledText style={styles.fieldError}>{error}</StyledText>}

          <Button
            text={needsEmailTwoFactor ? 'Verify Account' : 'Sign In'}
            btnStyle={styles.primaryBtn}
            btnTextStyle={styles.primaryBtnText}
            onPress={signInUser}
          />

          {!needsEmailTwoFactor ? (
            <View style={styles.socialSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <StyledText style={styles.orText}>Or</StyledText>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialIconsRow}>
                <TouchableOpacity
                  style={styles.socialBtn}
                  disabled={socialLoading}
                  onPress={() => handleSocialLogin('google')}
                >
                  <Image source={googleIcon} style={styles.socialIcon} />
                </TouchableOpacity>

                {Platform.OS === 'ios' ? (
                  <TouchableOpacity
                    style={styles.socialBtn}
                    disabled={socialLoading}
                    onPress={() => handleSocialLogin('apple')}
                  >
                    <Ionicons name="logo-apple" size={30} color={dark ? '#FFFFFF' : '#212121'} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('ForgotPassword' as any, { email: form.email } as any);
                }}
              >
                <StyledText style={styles.forgotPasswordText}>Forgot Password?</StyledText>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

export default LoginComponent;
