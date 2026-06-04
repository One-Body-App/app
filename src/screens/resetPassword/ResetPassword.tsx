import React, { useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';

import Button from '@/components/Button';
import StyledText from '@/components/styled/Text';
import StyledTextInput from '@/components/styled/TextInput';
import GeneralStyle from '@/src/constants/GeneralStyle';
import { MainStackParamList } from '@/src/navigator/types';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/src/services/api';
import { Colors, Typography } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import UserStepsLayout from '../layout/UserStepsLayout';
import { getResetPasswordErrorMessage, getResetPasswordStrength } from './resetPasswordUtils';

type Props = NativeStackScreenProps<MainStackParamList, 'ResetPassword'>;

function ResetPassword({ route, navigation }: Props) {
  const token = route.params?.token ?? '';
  const inputRefs = {
    password: useRef<TextInput>(null),
    confirm: useRef<TextInput>(null),
  };
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirm, setHideConfirm] = useState(true);
  const [error, setError] = useState(token ? '' : 'This reset link is invalid or expired.');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const toast = useToast();
  const strength = getResetPasswordStrength(password);

  const goToForgotPassword = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'ForgotPassword' }],
    });
  };

  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { resetPassword: true } }],
    });
  };

  const submit = async () => {
    if (submitting || success) return;

    if (!token) {
      setError('This reset link is invalid or expired. Please request a new one.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSubmitting(true);
    dispatch(setLoader(true));

    try {
      const result = await ApiCall<{ message?: string }>({
        route: 'auth/reset-password/confirm',
        verb: 'post',
        params: { token, password },
      });

      if (result.status >= 400) {
        // Throw a real Error (eslint no-throw-literal); the message carries the
        // server text so getResetPasswordErrorMessage still maps it correctly.
        throw new Error(result.response?.message ?? 'Password reset failed');
      }

      setSuccess(true);
      toast.show('Password reset successfully', {
        type: 'success',
        duration: 2500,
      });
      setTimeout(goToLogin, 1200);
    } catch (e: any) {
      setError(getResetPasswordErrorMessage(e));
    } finally {
      setSubmitting(false);
      dispatch(setLoader(false));
    }
  };

  return (
    <UserStepsLayout backgroundColor={colors.background} showCustomHeaderOnAndroid>
      <ScrollView style={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ marginHorizontal: spacing.x16 }}>
          <View style={{ marginVertical: spacing.x16 }}>
            <StyledText style={Typography.header.h1}>Create new password</StyledText>
            <StyledText
              style={[
                Typography.subheader.R,
                { color: Colors.neutral[200], marginTop: spacing.x8 },
              ]}
            >
              Secure your account with a strong, unique password that you do not use elsewhere.
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
            {error ? (
              <View
                style={[
                  GeneralStyle.MessageView,
                  { backgroundColor: Colors.errorFeedback.background },
                ]}
              >
                <StyledText style={{ color: Colors.errorFeedback.text, flex: 1 }}>
                  {error}
                </StyledText>
              </View>
            ) : null}

            {success ? (
              <View
                style={[
                  GeneralStyle.MessageView,
                  { backgroundColor: Colors.successFeedback.background },
                ]}
              >
                <StyledText style={GeneralStyle.successtext}>
                  Password updated. Redirecting to sign in...
                </StyledText>
              </View>
            ) : null}

            <StyledTextInput
              wrapperStyle={{ flex: 1 }}
              ref={inputRefs.password}
              value={password}
              returnKeyType="next"
              label="New password"
              secureTextEntry={hidePassword}
              rightIcon={
                <View style={{ justifyContent: 'center' }}>
                  <MaterialCommunityIcons
                    name={hidePassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={Colors.primarySapphire[500]}
                    onPress={() => setHidePassword((value) => !value)}
                  />
                </View>
              }
              placeholder="New password"
              editable={!success && Boolean(token)}
              onChangeText={(nextPassword) => {
                setPassword(nextPassword);
                setError('');
              }}
              onSubmitEditing={() => inputRefs.confirm.current?.focus()}
              blurOnSubmit={false}
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
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: spacing.x8,
                }}
              >
                <StyledText style={[Typography.body.x1, { color: strength.color }]}>
                  {strength.label}
                </StyledText>
                <StyledText style={[Typography.body.x1, { color: Colors.neutral[200] }]}>
                  Min. 8 characters
                </StyledText>
              </View>
            </View>

            <StyledTextInput
              wrapperStyle={{ flex: 1 }}
              ref={inputRefs.confirm}
              value={confirmPassword}
              returnKeyType="done"
              label="Confirm new password"
              secureTextEntry={hideConfirm}
              rightIcon={
                <View style={{ justifyContent: 'center' }}>
                  <MaterialCommunityIcons
                    name={hideConfirm ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={Colors.primarySapphire[500]}
                    onPress={() => setHideConfirm((value) => !value)}
                  />
                </View>
              }
              placeholder="Confirm new password"
              editable={!success && Boolean(token)}
              onChangeText={(nextPassword) => {
                setConfirmPassword(nextPassword);
                setError('');
              }}
              onSubmitEditing={() => submit()}
              blurOnSubmit={false}
            />

            <Button
              text="Update password"
              btnStyle={[button.primary, { flex: 1, marginTop: spacing.x24 }]}
              disabled={!token || success || submitting}
              disabledBtnStyle={[
                button.primary,
                {
                  backgroundColor: Colors.primarySapphire[200],
                  flex: 1,
                  marginTop: spacing.x24,
                  opacity: 0.4,
                },
              ]}
              onPress={submit}
              btnTextStyle={{ color: '#FFF' }}
              disabledBtnTextStyle={{ color: Colors.primarySapphire[600] }}
            />

            {!token ? (
              <Button
                text="Request a new reset link"
                onPress={goToForgotPassword}
                wrapperViewBtnStyle={{ marginTop: spacing.x16 }}
                btnTextStyle={[Typography.subheader.R, { color: Colors.primarySapphire.brand }]}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </UserStepsLayout>
  );
}

export default ResetPassword;
