import React, { useRef, useState } from 'react';
import { View, TextInput as TextInputNative } from 'react-native';

import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useDispatch } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StackScreenProps } from '@react-navigation/stack';
import { getAuth, updatePassword } from '@react-native-firebase/auth';
import Button from '@/components/Button';
import { validateFields } from '@/utils/validation/validate-fields';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import validator from '@/utils/validation/validator';

import GeneralStyle from '../../../constants/GeneralStyle';
import { button } from '@/src/styles/buttons';
import { Colors } from '@/src/styles';
import StyledTextInput from '@/components/styled/TextInput';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { MainStackParamList } from '@/src/navigator/types';

type Props = StackScreenProps<MainStackParamList, 'PasswordChange'>;

function PasswordChange({ navigation, route }: Props) {
  const dispatch = useDispatch();
  const inputRefs = {
    passwordN: useRef<TextInputNative>(null),
    passwordC: useRef<TextInputNative>(null),
  };
  const [state, setState] = useState({
    passwordError: '',
    passwordN: '',
    passwordErrorN: '',
    passwordC: '',
    passwordErrorC: '',
  });

  const [hidePassN, setHidePassN] = useState(true);
  const [hidePassC, setHidePassC] = useState(true);
  const toast = useToast();
  const firebaseAuth = getAuth();

  const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/g;
  const atLeastOneUppercase = /[A-Z]/g; // capital letters from A to Z
  const atLeastOneLowercase = /[a-z]/g; // small letters from a to z
  const atLeastOneNumeric = /[0-9]/g; // numbers from 0 to 9
  const atLeastOneSpecialChar = /[#?!@$%^&*-]/g; // any of the special characters within the square brackets
  const sixCharsOrMore = /.{6,}/g; // six characters or more

  const passwordTracker = {
    uppercase: state.passwordN.match(atLeastOneUppercase),
    // lowercase: state.passwordN.match(atLeastOneLowercase),
    number: state.passwordN.match(atLeastOneNumeric),
    specialChar: state.passwordN.match(atLeastOneSpecialChar),
    sixCharsOrMore: state.passwordN.match(sixCharsOrMore),
  };

  const passwordStrength = Object.values(passwordTracker).filter((value) => value).length;

  const PasswordUpdate = async () => {
    try {
      const { passwordC, passwordN } = state;
      const passwordErrorC = await validator('passwordC', passwordC);
      const passwordErrorN = await validator('passwordN', passwordN);

      if (!passwordErrorC && !passwordErrorN) {
        dispatch(setLoader(true));
        if (firebaseAuth.currentUser) {
          await updatePassword(firebaseAuth.currentUser, passwordN);
        }
        navigation.pop(2);
        toast.show('Password updated successfully', {
          type: 'success',
          placement: 'top',
        });
      } else {
        setState({ ...state, passwordErrorN, passwordErrorC });
      }
    } catch (e: any) {
      route.params.setError(e.message.replace('[auth/requires-recent-login] ', ''));
      if (e.message == '[auth/requires-recent-login]') {
        toast.show('Please login again', {
          type: 'error',
          placement: 'top',
        });
        navigation.goBack();
      }
    }
  };

  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        style={{ flex: 1, marginTop: spacing.x24, paddingHorizontal: spacing.x24 }}
      >
        <View style={{ flex: 1 }}>
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

            placeholder="New Password"
            onFocus={() => setState({ ...state, passwordErrorN: '' })}
            onBlur={() =>
              validateFields(state.passwordN, 'passwordN', (error) =>
                setState({ ...state, passwordErrorN: error })
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

          {state.passwordErrorN != '' ? (
            <StyledText style={{ ...GeneralStyle.InputError }}>{state.passwordErrorN}</StyledText>
          ) : null}
          {state.passwordN.length > 0 ? (
            <View style={{ marginVertical: spacing.x10 }}>
              {passwordStrength < 5 ? (
                <View style={{ flexDirection: 'row' }}>
                  <MaterialCommunityIcons
                    name={!passwordTracker.sixCharsOrMore ? 'close' : 'check'}
                    size={20}
                    color={!passwordTracker.sixCharsOrMore ? 'red' : 'green'}
                    style={
                      {
                        // alignSelf: 'center',
                        // justifyContent: 'center',
                        // marginTop: getHeight(1),
                      }
                    }
                  />
                  <StyledText style={{ color: !passwordTracker.sixCharsOrMore ? 'red' : 'green' }}>
                    At least 6 characters
                  </StyledText>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row' }}>
                <MaterialCommunityIcons
                  name={!passwordTracker.specialChar ? 'close' : 'check'}
                  size={20}
                  color={!passwordTracker.specialChar ? 'red' : 'green'}
                />
                <StyledText style={{ color: !passwordTracker.specialChar ? 'red' : 'green' }}>
                  At least 1 special character
                </StyledText>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <MaterialCommunityIcons
                  name={!passwordTracker.number ? 'close' : 'check'}
                  size={20}
                  color={!passwordTracker.number ? 'red' : 'green'}
                />
                <StyledText style={{ color: !passwordTracker.number ? 'red' : 'green' }}>
                  Contains at least 1 number
                </StyledText>
              </View>
            </View>
          ) : null}
          <StyledTextInput
            wrapperStyle={{ flex: 1, marginTop: spacing.x24 }}
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
              validateFields(state.passwordC, 'passwordC', (error) =>
                setState({ ...state, passwordErrorC: error })
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
          text="Update Password"
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
      </KeyboardAwareScrollView>
    </View>
  );
}
export default PasswordChange;
