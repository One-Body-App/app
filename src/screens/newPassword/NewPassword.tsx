import { View, TextInput } from 'react-native';
import React, { useRef, useState } from 'react';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-simple-toast';

import {
  confirmPasswordReset,
  getAuth,
  verifyPasswordResetCode,
} from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import {
  CompositeScreenProps,
  RouteProp,
  useNavigation,
  useRoute,
  useTheme,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useToast } from 'react-native-toast-notifications';

import GeneralStyle from '../../constants/GeneralStyle';
import Button from '../../components/Button';

import { validateFields } from '@/utils/validation/validate-fields';
import { ApiCall } from '@/src/services/api';
import validator from '@/utils/validation/validator';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { MainStackParamList } from '@/src/navigator/types';
import StyledTextInput from '@/components/styled/TextInput';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';

type NewPasswordScreenRouteProp = RouteProp<MainStackParamList, 'ConfirmLogin'>;
type ProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'NewPassword'>;

type Props = MainStackParamList['ConfirmLogin'];

function NewPassword({ oobCode, ...props }: Props) {
  const dispatch = useDispatch();
  const inputRefs = {
    passwordN: useRef<TextInput>(null),
    passwordC: useRef<TextInput>(null),
  };
  const [state, setState] = useState({
    passwordN: '',
    passwordErrorN: '',
    passwordC: '',
    passwordErrorC: '',
  });

  const [error, seterror] = React.useState<string>();
  const route = useRoute<NewPasswordScreenRouteProp>();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const [hidePassN, setHidePassN] = useState(true);
  const [hidePassC, setHidePassC] = useState(true);
  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
  const { colors } = useTheme();
  const toast = useToast();
  const firebaseAuth = getAuth();
  const resetCode = oobCode ?? route.params?.oobCode;
  const resetApiKey = route.params?.apiKey;

  const getPasswordResetErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/expired-action-code':
        return 'This reset link has expired. Please request a new one.';
      case 'auth/invalid-action-code':
        return 'This reset link is invalid or expired. Please request a new one.';
      case 'auth/user-not-found':
        return 'No account was found for this reset link.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      default:
        return 'Unable to reset password. Please try again.';
    }
  };

  const getPasswordResetApiErrorMessage = (code: string) => {
    switch (code) {
      case 'EXPIRED_OOB_CODE':
        return 'This reset link has expired. Please request a new one.';
      case 'INVALID_OOB_CODE':
        return 'This reset link is invalid or expired. Please request a new one.';
      case 'USER_DISABLED':
        return 'This account has been disabled. Please contact support.';
      case 'EMAIL_NOT_FOUND':
        return 'No account was found for this reset link.';
      default:
        return 'Unable to reset password. Please try again.';
    }
  };

  const PasswordUpdate = async () => {
    const { passwordC, passwordN } = state;

    const passwordErrorC = await validator('passwordC', passwordC);
    const passwordErrorN = await validator('passwordN', passwordN);

    if (passwordErrorC || passwordErrorN) {
      setState({ ...state, passwordErrorN, passwordErrorC });
      return;
    }

    if (!resetCode) {
      seterror('This reset link is invalid or expired. Please request a new one.');
      return;
    }

    if (passwordC !== passwordN) {
      seterror('Both passwords MUST match!');
      return;
    }

    dispatch(setLoader(true));
    try {
      const email = await verifyPasswordResetCode(firebaseAuth, resetCode);
      await confirmPasswordReset(firebaseAuth, resetCode, passwordN);

      await ApiCall({
        route: 'auth/sendPasswordChangeConfirmation',
        params: { email },
        verb: 'post',
      });

      navigation.navigate('Login', { resetPassword: true });
      toast.show('Password Reset Sucessfuly', {
        type: 'success',
        duration: 3500,
      });
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/invalid-action-code' && resetApiKey) {
        try {
          const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${resetApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                oobCode: resetCode,
                newPassword: passwordN,
              }),
            }
          );
          const data = await response.json();
          if (!response.ok) {
            const apiError = data?.error?.message ?? 'UNKNOWN';
            throw new Error(apiError);
          }

          await ApiCall({
            route: 'auth/sendPasswordChangeConfirmation',
            params: { email: data?.email },
            verb: 'post',
          });

          navigation.navigate('Login', { resetPassword: true });
          toast.show('Password Reset Sucessfuly', {
            type: 'success',
            duration: 3500,
          });
          return;
        } catch (fallbackError: any) {
          const apiMessage = fallbackError?.message ?? '';
          const fallbackMessage = getPasswordResetApiErrorMessage(apiMessage);
          seterror(fallbackMessage);
          console.log('saga error -- ', fallbackError.toString());
          return;
        }
      }
      const message = getPasswordResetErrorMessage(code);
      seterror(message);
      console.log('saga error -- ', e.toString());
    } finally {
      dispatch(setLoader(false));
    }
  };

  return (
    <View style={{ flex: 1, marginHorizontal: spacing.x16 }}>
      <View style={{ marginVertical: spacing.x16 }}>
        <StyledText style={[Typography.header.h1]}>Reset your password?</StyledText>

        <StyledText
          style={[Typography.subheader.R, { color: Colors.neutral[300], marginTop: spacing.x8 }]}
        >
          Set a new password for your account. Ensure it is secured and easy for you to remember
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
          {error ? (
            <View
              style={[
                GeneralStyle.MessageView,
                { backgroundColor: Colors.errorFeedback.background },
              ]}
            >
              <StyledText style={{ color: Colors.errorFeedback.text, flex: 1 }}>{error}</StyledText>
            </View>
          ) : null}
          {/* {showSuccess ? (
            <View
              style={[
                GeneralStyle.MessageView,
                { backgroundColor: Colors.successFeedback.background },
              ]}
            >
              <StyledText style={GeneralStyle.successtext}>
                If you have an account with us, You will get an email with the instructions to reset
                your password
              </StyledText>
            </View>
          ) : null} */}
          <StyledTextInput
            wrapperStyle={{ flex: 1 }}
            ref={inputRefs.passwordN}
            value={state.passwordN}
            returnKeyType="next"
            label="New Password"
            secureTextEntry={!!hidePassN}
            rightIcon={
              <View style={{ justifyContent: 'center' }}>
                <MaterialCommunityIcons
                  name={hidePassC ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.primarySapphire[500]}
                  style={{
                    alignSelf: 'center',
                  }}
                  onPress={() => setHidePassC(!hidePassC)}
                />
              </View>
            }
            // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}

            placeholder="New Password"
            onFocus={() => setState({ ...state, passwordErrorN: '' })}
            onBlur={() =>
              validateFields(state.passwordN, 'passwordN', (validationError) =>
                setState({ ...state, passwordErrorN: validationError })
              )
            }
            onSubmitEditing={() => {
              if (inputRefs.passwordC.current) {
                inputRefs.passwordC.current.focus();
              }
            }}
            onChangeText={(passwordN) => changeHandler('passwordN', passwordN.trim())}
            blurOnSubmit={false}
          />

          {state.passwordErrorN != null ? (
            <StyledText style={{ ...GeneralStyle.InputError }}>{state.passwordErrorN}</StyledText>
          ) : null}
          <StyledTextInput
            wrapperStyle={{ flex: 1 }}
            ref={inputRefs.passwordC}
            value={state.passwordC}
            returnKeyType="done"
            label="Confirm Password"
            secureTextEntry={!!hidePassC}
            rightIcon={
              <View style={{ justifyContent: 'center' }}>
                <MaterialCommunityIcons
                  name={hidePassN ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.primarySapphire[500]}
                  style={{
                    alignSelf: 'center',
                  }}
                  onPress={() => setHidePassN(!hidePassN)}
                />
              </View>
            }
            // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}

            placeholder="Confirm Password"
            onFocus={() => setState({ ...state, passwordErrorC: '' })}
            onBlur={() =>
              validateFields(state.passwordC, 'passwordC', (validationError) =>
                setState({ ...state, passwordErrorC: validationError })
              )
            }
            onSubmitEditing={() => PasswordUpdate()}
            onChangeText={(passwordC) => changeHandler('passwordC', passwordC.trim())}
            blurOnSubmit={false}
          />
          {state.passwordErrorC != null ? (
            <StyledText style={{ ...GeneralStyle.InputError }}>{state.passwordErrorC}</StyledText>
          ) : null}
        </View>
        <Button
          text="Change Password"
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          disabledBtnStyle={[
            button.primary,
            {
              backgroundColor: Colors.primarySapphire[200],
              flex: 1,
              opacity: 0.4,
            },
          ]}
          onPress={() => {
            PasswordUpdate();
          }}
          btnTextStyle={{ color: '#FFF' }}
          disabledBtnTextStyle={{ color: Colors.primarySapphire[600] }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',

            alignItems: 'center',
            marginTop: 10,
          }}
        >
          <Button
            text="Cancel"
            onPress={() => {
              navigation.goBack();
            }}
          />
        </View>
      </View>
    </View>
    // <>
    //   <View style={styles.options}>
    //     <Text style={styles.title}>New Password</Text>
    //     <Text style={styles.subTitle}>Create your new passsword</Text>
    //   </View>

    //   <View style={{ margin: getHeight(5) }}>
    //     <StyledTextInput
    //       ref={inputRefs.passwordN}
    //       value={state.passwordN}
    //       returnKeyType={'next'}
    //       label={'New Password'}
    //       secureTextEntry={hidePassN ? true : false}
    //       rightIcon={
    //         <MaterialCommunityIcons
    //           name={hidePassN ? 'eye-off-outline' : 'eye-outline'}
    //           size={20}
    //           color={Colors.primarySapphire[500]}
    //           style={{
    //             alignSelf: 'center',

    //             marginTop: getHeight(1),
    //           }}
    //           onPress={() => setHidePassN(!hidePassN)}
    //         />
    //       }
    //       // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}
    //       style={GeneralStyle.input}
    //       placeholder="New Password"
    //       onFocus={() => setState({ ...state, passwordErrorN: '' })}
    //       onBlur={() =>
    //         validateFields(state.passwordN, 'passwordN', (error) =>
    //           setState({ ...state, passwordErrorN: error })
    //         )
    //       }
    //       onSubmitEditing={() => {
    //         if (inputRefs.passwordC.current) {
    //           inputRefs.passwordC.current.focus();
    //         }
    //       }}
    //       onChangeText={(passwordN) => changeHandler('passwordN', passwordN.trim())}
    //       blurOnSubmit={false}
    //     />
    //     <Text style={{ ...GeneralStyle.InputError, marginLeft: 0 }}>{state.passwordErrorN}</Text>

    //     <StyledTextInput
    //       ref={inputRefs.passwordC}
    //       value={state.passwordC}
    //       returnKeyType={'done'}
    //       label={'Confirm Password'}
    //       secureTextEntry={hidePassC ? true : false}
    //       rightIcon={
    //         <MaterialCommunityIcons
    //           name={hidePassC ? 'eye-off-outline' : 'eye-outline'}
    //           size={20}
    //           color={Colors.primarySapphire[500]}
    //           style={styles.hidepicc}
    //           onPress={() => setHidePassC(!hidePassC)}
    //         />
    //       }
    //       // right={<TextInput.Icon name="eye" size={20} color="#5B7279" />}
    //       style={GeneralStyle.input}
    //       placeholder="Confirm Password"
    //       onFocus={() => setState({ ...state, passwordErrorC: '' })}
    //       onBlur={() =>
    //         validateFields(state.passwordC, 'passwordC', (error) =>
    //           setState({ ...state, passwordErrorC: error })
    //         )
    //       }
    //       onSubmitEditing={() => PasswordUpdate()}
    //       onChangeText={(passwordC) => changeHandler('passwordC', passwordC.trim())}
    //       blurOnSubmit={false}
    //     />
    //     <Text style={{ ...GeneralStyle.InputError, marginLeft: 0 }}>{state.passwordErrorC}</Text>
    //   </View>
    //   <Button
    //     text={'CHANGE PASSWORD'}
    //     onPress={() => {
    //       PasswordUpdate();
    //     }}
    //     btnStyle={{ marginHorizontal: 30 }}
    //   />
    //   <Button
    //     text={'Cancel'}
    //     onPress={() => {
    //       navigation.goBack();
    //     }}
    //     btnStyle={{ marginHorizontal: 30, marginTop: 10 }}
    //   />
    // </>
  );
}

export default NewPassword;
