import React, { useRef, useState } from 'react';
import { Text, View, TouchableOpacity, TextInput as TextInputNative } from 'react-native';

import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '@/src/components/Header';
import Button from '@/src/components/Button';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import { validateFields } from '@/utils/validation/validate-fields';
import { setLoader } from '@/redux//actions/GeneralActions';
import validator from '@/utils/validation/validator';
import { useToast } from 'react-native-toast-notifications';

import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/_Navigation/types';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { button } from '@/src/styles/buttons';
import { Colors } from '@/src/styles';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import { StyledText } from '@/src/components/styled/Text';
import { spacing } from '@/src/styles/spacing';

type Props = StackScreenProps<RootStackParamList, 'PasswordChange'>;

const PasswordChange = ({ navigation, route }: Props) => {
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

  const [error, seterror] = React.useState();
  const [hidePassN, setHidePassN] = useState(true);
  const [hidePassC, setHidePassC] = useState(true);
  const toast = useToast();

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
        await auth().currentUser?.updatePassword(passwordN);
        navigation.pop(2);
        toast.show('Password updated successfully', {
          type: 'success',
          placement: 'top',
        });
      } else {
        setState({ ...state, passwordErrorN, passwordErrorC });
      }
    } catch (e: any) {
      console.log(e);
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
            returnKeyType={'next'}
            label={'New Password'}
            secureTextEntry={hidePassN ? true : false}
            rightIcon={
              <MaterialCommunityIcons
                name={hidePassN ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={'#5B7279'}
                style={{
                  alignSelf: 'center',
                }}
                onPress={() => setHidePassN(!hidePassN)}
              />
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
            returnKeyType={'done'}
            label={'Confirm Password'}
            secureTextEntry={hidePassC ? true : false}
            rightIcon={
              <MaterialCommunityIcons
                name={hidePassN ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={'#5B7279'}
                style={{
                  alignSelf: 'center',
                }}
                onPress={() => setHidePassN(!hidePassN)}
              />
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
};
export default PasswordChange;
