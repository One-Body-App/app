import React, { useRef, useState } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  useColorScheme,
  Animated,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput as NativeTextInput } from 'react-native';

import { validateFields } from '@/utils/validation/validate-fields';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import GoBackIcon from '@/components/GoBackIcon';
import { setLoginData, signUpRequest } from '@/redux//actions/AuthActions';
import GradientHeader from '@/components/GradientHeader';
import validator from '@/utils/validation/validator';
import { setAccountType, setLoader } from '@/redux//actions/GeneralActions';
import LinearGradient from 'react-native-linear-gradient';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput } from 'react-native-paper';
import Button from '@/components/Button';
import { appColor } from '../../../constants';
import { styles } from './styles';
import auth from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import { OpenURLButton, PRIVACY_POLICY_URL, TERMS_CONDITIONS_URL } from '@/src/Services/constants';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { RootStackParamList } from '@/src/Navigation/types';
import { useTheme } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { faUsers } from '@fortawesome/free-solid-svg-icons/faUsers';
import Recaptcha, { RecaptchaHandles } from 'react-native-recaptcha-that-works';

const { width: wWidth } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'SignupForm'>;
const animatedBarWidth = new Animated.Value(0);
const animatedInnerBarWidth = new Animated.Value(0);
const widthByPercent = (percentage: number, containerWidth = wWidth) => {
  const value = (percentage * containerWidth) / 100;
  return Math.round(value);
};

const showFullBar = (isShow = true) => {
  const barWidth = isShow ? widthByPercent(70) : 0;
  Animated.timing(animatedBarWidth, {
    toValue: barWidth,
    duration: 20,
    useNativeDriver: true,
  }).start();
};

const SignupForm = ({ navigation }: Props) => {
  const recaptcha = useRef<RecaptchaHandles | null>(null);
  const barWidth = widthByPercent(70);
  const AccountType = useSelector((state: RootState) => state.general.accountType);
  const dispatch = useDispatch();

  const inputRefs = {
    email: useRef<NativeTextInput>(null),
    password: useRef<NativeTextInput>(null),
    cPassword: useRef<NativeTextInput>(null),
    name: useRef<NativeTextInput>(null),
    username: useRef<NativeTextInput>(null),
  };
  const [state, setState] = useState({
    email: '',
    emailError: '',
    password: '',
    passwordError: '',
    cPassword: '',
    cPasswordError: '',
    name: '',
    nameError: '',
    username: '',
    usernameError: '',
  });
  const [error, seterror] = React.useState<string>();
  const [hidePass, setHidePass] = useState(true);
  const [chidePass, setcHidePass] = useState(true);
  const [loading, setIsloading] = useState(false);
  const scheme = useColorScheme();

  const signUpUser = async () => {
    setIsloading(true);
    const { email, password, name, cPassword, username } = state;
    const emailError = await validator('email', email);
    const nameError = await validator('name', name);
    const usernameError = await validator('username', username);
    const passwordError = await validator('password', password);
    const cPasswordError = await validator('cPassword', cPassword, { password });

    if (!emailError && !passwordError && !nameError && !cPasswordError && !usernameError) {
      if (password == cPassword) {
        recaptcha.current?.open();

        //
      } else {
        seterror('Both passwords MUST match!');
      }
    } else {
      setIsloading(false);
      setState({
        ...state,
        emailError,
        passwordError,
        cPasswordError,
        nameError,
      });
    }
  };

  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
  const { dark, colors } = useTheme();

  const getButtonTextStyle = (selected: boolean) => {
    if (selected) {
      return {
        ...styles.btnText,
        color: scheme == 'dark' ? colors.text : '#032F3C',
      };
    }

    return { ...styles.btnText, color: scheme == 'dark' ? '#838383' : '#B3C1C5' };
  };

  const getButtonContainer = (selected: boolean) => {
    if (selected) {
      return { ...styles.btnSelected, borderColor: colors.border };
    } else {
      return { ...styles.btn, borderColor: colors.border };
    }
  };

  const onVerify = (token: string) => {
    const { email, password, name, cPassword, username } = state;
    console.log(token);
    const data = {
      email,
      name,
      accountType: AccountType,
      userId: '',
      username,
    };
    // auth()
    //   .createUserWithEmailAndPassword(email, password)
    //   .then(async (user) => {
    //     // await user.user.sendEmailVerification();
    //     // const token = await user.user.getIdToken();
    //     // user.user.updatePhoneNumber()
    //     data.userId = user.user.uid;

    //     // dispatch(setLoginData({ token: await user.user.getIdToken() }));
    //     dispatch(
    //       signUpRequest({
    //         data,
    //         seterror,
    //         go: () =>
    //           // navigation.pop()
    //           navigation.replace('Login', { showConfirmationEmailMessage: true }),

    //         // navigation.reset({
    //         //   index: 1,
    //         //   routes: [
    //         //     { name: 'SignUp' },
    //         //     { name: 'Login', params: { showConfirmationEmailMessage: true } },
    //         //   ],
    //         // }),
    //       })
    //     );
    //     setIsloading(false);
    //   })
    //   .catch((error) => {
    //     setIsloading(false);
    //     if (error.code === 'auth/email-already-in-use') {
    //       seterror('That email address is already in use!');
    //       console.log('That email address is already in use!');
    //     }

    //     if (error.code === 'auth/invalid-email') {
    //       seterror('That email address is invalid!');
    //       console.log('That email address is invalid!');
    //     }

    //     console.error(error);
    //   });
  };

  const onExpire = () => {
    console.warn('expired!');
  };

  const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/g;
  const atLeastOneUppercase = /[A-Z]/g; // capital letters from A to Z
  const atLeastOneLowercase = /[a-z]/g; // small letters from a to z
  const atLeastOneNumeric = /[0-9]/g; // numbers from 0 to 9
  const atLeastOneSpecialChar = /[#?!@$%^&*-]/g; // any of the special characters within the square brackets
  const sixCharsOrMore = /.{6,}/g; // six characters or more

  const passwordTracker = {
    uppercase: state.password.match(atLeastOneUppercase),
    // lowercase: state.password.match(atLeastOneLowercase),
    number: state.password.match(atLeastOneNumeric),
    specialChar: state.password.match(atLeastOneSpecialChar),
    sixCharsOrMore: state.password.match(sixCharsOrMore),
  };

  const passwordStrength = Object.values(passwordTracker).filter((value) => value).length;

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor={appColor.StatusBarColor}
        barStyle="light-content"
        hidden={false}
        translucent={true}
      />

      <GradientHeader
        left={
          <GoBackIcon
            color={'#FFF'}
            style={{ width: '100%', paddingHorizontal: 20, marginTop: 20 }}
          />
        }
      />
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.background, colors.background, dark ? colors.background : '#E0EEF3']}
          style={{ flex: 1, paddingBottom: 110 }}
        >
          <View style={{ paddingHorizontal: 25, flex: 1 }}>
            <Text
              style={{
                marginTop: 24,
                marginBottom: 16,
                textAlign: 'center',
                color: scheme == 'dark' ? colors.text : '#4F6D77',
                fontWeight: '500',
                fontFamily: 'Rubik-Regular',
                fontSize: 16,
                maxWidth: 250,
                width: '100%',
                alignSelf: 'center',
              }}
            >
              What type of profile would you like?
            </Text>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Button
                text={'Individual'}
                btnStyle={getButtonContainer(AccountType == 'individual')}
                RightIcon={null}
                leftIcon={
                  <FontAwesomeIcon
                    icon={faUser}
                    style={{ margin: 5 }}
                    size={getFontSize(1.8)}
                    color={
                      AccountType == 'individual'
                        ? scheme == 'dark'
                          ? colors.text
                          : '#032F3C'
                        : scheme == 'dark'
                        ? '#838383'
                        : '#B3C1C5'
                    }
                  />
                }
                btnTextStyle={getButtonTextStyle(AccountType == 'individual')}
                onPress={() => {
                  dispatch(setAccountType('individual'));
                }}
              />
              <Button
                text={'Organization'}
                RightIcon={null}
                btnStyle={getButtonContainer(AccountType == 'organization')}
                leftIcon={
                  <FontAwesomeIcon
                    icon={faUsers}
                    style={{ margin: 5 }}
                    size={getFontSize(3)}
                    color={
                      AccountType == 'organization'
                        ? scheme == 'dark'
                          ? colors.text
                          : '#032F3C'
                        : scheme == 'dark'
                        ? '#838383'
                        : '#B3C1C5'
                    }
                  />
                }
                btnTextStyle={getButtonTextStyle(AccountType == 'organization')}
                onPress={() => {
                  dispatch(setAccountType('organization'));
                }}
              />
            </View>
          </View>
          <View style={{ paddingHorizontal: 25, paddingBottom: 15, flex: 1 }}>
            <TextInput
              style={{ ...GeneralStyle.input, marginTop: 15 }}
              theme={{ roundness: 10 }}
              ref={inputRefs.username}
              value={state.username}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={appColor.InstructionColor}
              outlineColor={'#888C93'}
              label={'Username'}
              onFocus={() => setState({ ...state, nameError: '' })}
              onBlur={() =>
                validateFields(state.username, 'username', (error) =>
                  setState({ ...state, usernameError: error })
                )
              }
              onSubmitEditing={() => inputRefs.username.current?.focus()}
              onChangeText={(username) => changeHandler('username', username)}
              blurOnSubmit={false}
              autoCorrect={false}
              autoComplete="username"
              keyboardType="default"
              autoCapitalize="none"
            />
            {state.usernameError ? (
              <Text
                style={{ ...GeneralStyle.InputError, marginLeft: getWidth(5), marginBottom: 10 }}
              >
                {state.usernameError}
              </Text>
            ) : null}

            <TextInput
              style={{ ...GeneralStyle.input, marginTop: 15 }}
              theme={{ roundness: 10 }}
              ref={inputRefs.name}
              value={state.name}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={appColor.InstructionColor}
              outlineColor={'#888C93'}
              label={'Your Name'}
              onFocus={() => setState({ ...state, nameError: '' })}
              onBlur={() =>
                validateFields(state.name, 'name', (error) =>
                  setState({ ...state, nameError: error })
                )
              }
              onSubmitEditing={() => inputRefs.email.current?.focus()}
              onChangeText={(name) => changeHandler('name', name)}
              blurOnSubmit={false}
              keyboardType="default"
              autoCapitalize="words"
            />
            {state.nameError ? (
              <Text
                style={{ ...GeneralStyle.InputError, marginLeft: getWidth(5), marginBottom: 10 }}
              >
                {state.nameError}
              </Text>
            ) : null}

            <TextInput
              style={{ ...GeneralStyle.input, marginTop: 15 }}
              theme={{ roundness: 10 }}
              ref={inputRefs.email}
              value={state.email}
              returnKeyType={'next'}
              keyboardType="email-address"
              mode="outlined"
              activeOutlineColor={appColor.InstructionColor}
              outlineColor={'#888C93'}
              label={'Your email'}
              autoCorrect={false}
              onFocus={() => setState({ ...state, emailError: '' })}
              onBlur={() =>
                validateFields(state.email, 'email', (error) =>
                  setState({ ...state, emailError: error })
                )
              }
              onSubmitEditing={() => inputRefs.password.current?.focus()}
              onChangeText={(email) => changeHandler('email', email.trim())}
              blurOnSubmit={false}
              autoCapitalize="none"
            />
            {state.emailError ? (
              <Text
                style={{ ...GeneralStyle.InputError, marginLeft: getWidth(5), marginBottom: 10 }}
              >
                {state.emailError}
              </Text>
            ) : null}

            <TextInput
              theme={{ roundness: 10 }}
              activeOutlineColor={appColor.InstructionColor}
              outlineColor={'#888C93'}
              ref={inputRefs.password}
              value={state.password}
              returnKeyType={'next'}
              label={'Password'}
              mode="outlined"
              secureTextEntry={hidePass ? true : false}
              right={
                <TextInput.Icon
                  icon={() => (
                    <MaterialCommunityIcons
                      name={hidePass ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={'#5B7279'}
                      style={{
                        alignSelf: 'center',

                        marginTop: getHeight(1),
                      }}
                      onPress={() => setHidePass(!hidePass)}
                    />
                  )}
                />
              }
              style={{ ...GeneralStyle.input, marginTop: 15 }}
              onFocus={() => setState({ ...state, passwordError: '' })}
              onBlur={() =>
                validateFields(state.password, 'password', (error) =>
                  setState({ ...state, passwordError: error })
                )
              }
              onSubmitEditing={() => inputRefs.cPassword.current?.focus()}
              onChangeText={(password) => changeHandler('password', password)}
              blurOnSubmit={false}
            />

            {/* <View style={[styles.passwordStrengthWrapper]}>
              <Animated.View
                style={[
                  styles.passwordStrengthBar,

                  { backgroundColor: '#ffffff', width: animatedBarWidth },
                ]}
              >
                <Animated.View
                  style={[styles.innerPasswordStrengthBar, { width: animatedInnerBarWidth }]}
                />
              </Animated.View>
            </View> */}

            {state.password.length > 0 ? (
              <View style={{ marginVertical: 10 }}>
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
                    <Text style={{ color: !passwordTracker.sixCharsOrMore ? 'red' : 'green' }}>
                      At least 6 characters
                    </Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row' }}>
                  <MaterialCommunityIcons
                    name={!passwordTracker.specialChar ? 'close' : 'check'}
                    size={20}
                    color={!passwordTracker.specialChar ? 'red' : 'green'}
                  />
                  <Text style={{ color: !passwordTracker.specialChar ? 'red' : 'green' }}>
                    At least 1 special character
                  </Text>
                </View>

                <View style={{ flexDirection: 'row' }}>
                  <MaterialCommunityIcons
                    name={!passwordTracker.number ? 'close' : 'check'}
                    size={20}
                    color={!passwordTracker.number ? 'red' : 'green'}
                  />
                  <Text style={{ color: !passwordTracker.number ? 'red' : 'green' }}>
                    Contains at least 1 number
                  </Text>
                </View>
              </View>
            ) : null}

            <TextInput
              theme={{ roundness: 10 }}
              activeOutlineColor={appColor.InstructionColor}
              outlineColor={'#888C93'}
              ref={inputRefs.cPassword}
              value={state.cPassword}
              returnKeyType={'done'}
              label={'Confirm Password'}
              mode="outlined"
              secureTextEntry={chidePass ? true : false}
              right={
                <TextInput.Icon
                  icon={() => (
                    <MaterialCommunityIcons
                      name={chidePass ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={'#5B7279'}
                      style={{
                        alignSelf: 'center',

                        marginTop: getHeight(1),
                      }}
                      onPress={() => setcHidePass(!chidePass)}
                    />
                  )}
                />
              }
              style={{ ...GeneralStyle.input, marginTop: 15 }}
              onFocus={() => setState({ ...state, cPasswordError: '' })}
              onBlur={() =>
                validateFields(
                  state.cPassword,
                  'cPassword',
                  (error) => setState({ ...state, cPasswordError: error }),
                  { password: state.password }
                )
              }
              onSubmitEditing={() => signUpUser()}
              onChangeText={(cPassword) => changeHandler('cPassword', cPassword)}
              blurOnSubmit={false}
            />
            <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(5) }}>
              {state.cPasswordError}
            </Text>

            <Recaptcha
              ref={recaptcha}
              siteKey="6Ld3BoolAAAAAIZJUxipD6Xdv1mOXZfXnW71A0o_"
              baseUrl="http://www.onebodyapp.com"
              onVerify={onVerify}
              onExpire={onExpire}
              size="invisible"
            />

            <View style={{ ...styles.center, paddingBottom: 20 }}>
              <Text style={{ color: dark ? colors.text : '#032F3C' }}>
                By signing up, you agree to our
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => OpenURLButton(PRIVACY_POLICY_URL)}>
                  <Text style={[styles.text, { color: dark ? colors.text : '#81979E' }]}>
                    User Agreements
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.simpleText, { color: dark ? colors.text : '#81979E' }]}>
                  {' '}
                  &{' '}
                </Text>
                <TouchableOpacity onPress={() => OpenURLButton(TERMS_CONDITIONS_URL)}>
                  <Text style={[styles.text, { color: dark ? colors.text : '#81979E' }]}>
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {error != null ? (
              <View style={styles.singerrorview1}>
                <Text style={styles.singerrortext}>{error}</Text>
              </View>
            ) : null}

            <Button
              text={'SIGN UP'}
              disabled={loading}
              onPress={() => {
                signUpUser();
              }}
              // btnTextStyle={[GeneralStyle.btnText, { color: dark ? colors.text : '#E6EAEC' }]}
              // disabledBtnStyle={{
              //   ...GeneralStyle.btn,
              //   marginTop: getHeight(2),
              // }}
              // disabledBtnTextStyle={GeneralStyle.btnText}
              // btnStyle={{
              //   ...GeneralStyle.btn,
              //   marginTop: getHeight(2),
              //   backgroundColor: scheme == 'dark' ? colors.card : '#0C5C75',
              // }}
              mode="contained"
              paper
              btnStyle={{ marginHorizontal: 0 }}
            />
          </View>
        </LinearGradient>

        <View>
          <Image
            style={styles.footer}
            resizeMode="stretch"
            source={require('@/assets/images/waveBG.png')}
          />
          <View
            style={{
              ...styles.footer,
              justifyContent: 'center',
              alignItems: 'center',
              height: getHeight(9),
            }}
          >
            <Text style={styles.helight}>Unify the Body</Text>
            <Text style={{ color: 'gray', marginTop: 2 }}>1 Cor. 12:12</Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default SignupForm;
