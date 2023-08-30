import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  Linking,
} from 'react-native';
import React, { useRef, useState } from 'react';
import { appColor, COLORS, THEME } from '../../constants';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '../../constants/GeneralStyle';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '../../components/Button';

import { validateFields } from '@/utils/validation/validate-fields';
import LinearGradient from 'react-native-linear-gradient';
import { ApiCall } from '@/services/api';
import validator from '@/utils/validation/validator';
import { useDispatch } from 'react-redux';
import { setLoader } from '@/redux/actions/GeneralActions';
import Toast from 'react-native-simple-toast';
import GoBackIcon from '@/src/components/GoBackIcon';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { RootNonUserStackParamList, SettingsStackParamsList } from '@/src/navigator/types';
import { StackScreenProps } from '@react-navigation/stack';
import {
  CompositeScreenProps,
  RouteProp,
  useNavigation,
  useRoute,
  useTheme,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import { useToast } from 'react-native-toast-notifications';

type NewPasswordScreenRouteProp = RouteProp<RootNonUserStackParamList, 'NewPassword'>;
type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootNonUserStackParamList,
  'NewPassword'
>;

type Props = RootNonUserStackParamList['ConfirmLogin'];

const NewPassword = ({ oobCode, ...props }: Props) => {
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
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const [hidePassN, setHidePassN] = useState(true);
  const [hidePassC, setHidePassC] = useState(true);
  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
  const { colors } = useTheme();
  const toast = useToast();

  const PasswordUpdate = async () => {
    const { passwordC, passwordN } = state;

    const passwordErrorC = await validator('passwordC', passwordC);
    const passwordErrorN = await validator('passwordN', passwordN);

    if (!passwordErrorC && !passwordErrorN && oobCode) {
      dispatch(setLoader(true));

      if (passwordC == passwordN) {
        try {
          const result = await auth().checkActionCode(oobCode);

          if (result.operation == 'PASSWORD_RESET') {
            await auth().confirmPasswordReset(oobCode, passwordN);

            const res = await ApiCall({
              route: 'auth/sendPasswordChangeConfirmation',
              params: { email: result.data.email },
              verb: 'post',
            });

            navigation.navigate('Login');
            toast.show('Password Reset Sucessfuly', {
              type: 'success',
              duration: 3500,
            });
            dispatch(setLoader(false));
          }
        } catch (e: any) {
          seterror('Expired code, please try again.');
          console.log('saga error -- ', e.toString());
        }
      } else {
        seterror('Both passwords MUST match!');
      }
    } else {
      setState({ ...state, passwordErrorN, passwordErrorC });
    }
  };

  return (
    <View style={{ flex: 1, marginHorizontal: spacing.x16 }}>
      <View style={{ marginVertical: spacing.x16 }}>
        <StyledText style={[Typography.header.h1]}>Reset your password?</StyledText>

        <StyledText
          style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
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

          {state.passwordErrorN != null ? (
            <StyledText style={{ ...GeneralStyle.InputError }}>{state.passwordErrorN}</StyledText>
          ) : null}
          <StyledTextInput
            wrapperStyle={{ flex: 1 }}
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
            text={'Cancel'}
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
    //           color={'#5B7279'}
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
    //           color={'#5B7279'}
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
};

export default NewPassword;
