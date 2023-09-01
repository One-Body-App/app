import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { TextInput } from 'react-native';
import { validateFields } from '@/utils/validation/validate-fields';
import { loginSocialRequest, signUp } from '@/redux//actions/AuthActions';
import validator from '@/utils/validation/validator';
import { GeneralStyle } from '../../constants/GeneralStyle';
import { useDispatch, useSelector } from 'react-redux';
import { styles } from './styles';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import { OpenURLButton, PRIVACY_POLICY_URL, TERMS_CONDITIONS_URL } from '@/src/Services/constants';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { useTheme } from '@react-navigation/native';
import Recaptcha, { RecaptchaHandles } from 'react-native-recaptcha-that-works';
import { ScrollView } from 'react-native';
import { RootNonUserStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import { button } from '@/src/styles/buttons';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import { Colors, Typography } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { StyledText } from '@/src/components/styled/Text';
import { setAccountType, setLoader } from '@/src/Redux/actions/GeneralActions';
import { requestUserPermission } from '@/src/Services/Notification/notificationServices';
import axios from 'axios';
import { processLogin } from '@/src/Services/login';
import SignupButtons from '@/src/components/SignupButtons';
import Button from '@/src/components/Button';

const { width: wWidth } = Dimensions.get('window');

type Props = StackScreenProps<RootNonUserStackParamList, 'SignUp'>;
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

const SignupForm = ({ navigation, route }: Props) => {
  const recaptcha = useRef<RecaptchaHandles | null>(null);
  const scrollView = useRef<ScrollView | null>(null);
  const accountType = route.params.accountType;
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [token, setToken] = useState('');
  const [newUserCredentials, setNewUserCredentials] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);

  const inputRefs = {
    email: useRef<TextInput>(null),
    password: useRef<TextInput>(null),
    cPassword: useRef<TextInput>(null),
    name: useRef<TextInput>(null),
    username: useRef<TextInput>(null),
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
        console.log('recaptcha.current?.open');
        recaptcha.current?.open();

        //
      } else {
        seterror('Both passwords MUST match!');
      }
    } else {
      setIsloading(false);
      if (usernameError) {
        scrollView.current?.scrollTo({ y: 130 });
      } else if (nameError) {
        scrollView.current?.scrollTo({ y: 190 });
      } else if (emailError) {
        scrollView.current?.scrollTo({ y: 250 });
      } else if (cPasswordError) {
        scrollView.current?.scrollTo({ y: 310 });
      }
      Keyboard.dismiss();
      setState({
        ...state,
        emailError,
        passwordError,
        cPasswordError,
        nameError,
        usernameError,
      });
    }
  };

  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
  const { dark, colors } = useTheme();

  const onVerify = (token: string) => {
    const { email, password, name, cPassword, username } = state;

    const data = {
      email,
      name,
      accountType,
      userId: '',
      username,
    };
    auth()
      .createUserWithEmailAndPassword(email, password)
      .then(async (user) => {
        // await user.user.sendEmailVerification();
        const token = await user.user.getIdToken();
        // user.user.updatePhoneNumber()
        data.userId = user.user.uid;

        // dispatch(setLoginData({ token: await user.user.getIdToken() }));
        dispatch(signUp.Request({ data: data, token: token }));
      })
      .catch((error) => {
        setIsloading(false);
        if (error.code === 'auth/email-already-in-use') {
          seterror('That email address is already in use!');
          console.log('That email address is already in use!');
        }

        if (error.code === 'auth/invalid-email') {
          seterror('That email address is invalid!');
          console.log('That email address is invalid!');
        }

        console.log('Firebase login error', error);
      });
  };

  useEffect(() => {
    if (authState.signUpSuccess) {
      setIsloading(false);
      navigation.replace('Login', { showConfirmationEmailMessage: true });
    } else if (authState.signUpSuccess == false) {
      setIsloading(false);
      console.log('Register Error', authState?.error);
      seterror(authState?.error ? authState?.error[0] : '');
    }
  }, [authState.signUpSuccess]);

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

  const gotoSignup = async () => {
    setNewUserCredentials(null);
    dispatch(setAccountType(''));
    dispatch(setLoader(false));

    await auth().currentUser?.reload();
    await auth().currentUser?.getIdToken(true);
  };

  const sendFcm = (token: string) => {
    requestUserPermission(token, true);
  };

  const socialLogin = (newUserCredentials: FirebaseAuthTypes.UserCredential | null) => {
    if (newUserCredentials) {
      const emailParts = newUserCredentials?.user.email?.split('@');
      let username = newUserCredentials?.user.email?.replace('@', '');

      if (emailParts && emailParts[0]) {
        username = emailParts[0] + new Date().getTime();
      }

      const data = {
        email: newUserCredentials?.user.email,
        name: newUserCredentials?.user.displayName,
        socialData: newUserCredentials?.additionalUserInfo,
        userId: newUserCredentials.user.uid,
        username,

        accountType: accountType,
        token,
      };

      dispatch(loginSocialRequest({ data, seterror, gotoSignup, sendFcm }));
    }
  };

  useEffect(() => {
    socialLogin(newUserCredentials);
  }, [newUserCredentials]);

  useEffect(() => {
    if (route.params?.oauth_token && route.params?.oauth_verifier) {
      const getTwitterAuthToken = async () => {
        try {
          const options = {
            method: 'POST',
            url: 'https://api.twitter.com/oauth/access_token',
            params: {
              oauth_token: route.params?.oauth_token,
              oauth_verifier: route.params?.oauth_verifier,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          };
          const result = await axios.request(options);

          if (result.data) {
            const tokenData = result.data.split('&')?.map((item: string) => {
              return item.split('=')[1];
            });

            const twitterCredential = auth.TwitterAuthProvider.credential(
              tokenData[0],
              tokenData[1]
            );

            const userCredentials = await auth().signInWithCredential(twitterCredential);

            await processLogin(
              userCredentials,
              setToken,
              dispatch,
              setAccountType,
              setNewUserCredentials
            );
          }
        } catch (error: any) {
          seterror(error.nativeErrorMessage);
        }
      };
      getTwitterAuthToken();
    }
  }, [route.params]);

  return (
    <UserStepsLayout backgroundColor={dark ? colors.background : Colors.neutral[600]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // contentContainerStyle={{
        //   marginTop: 615,
        // }}
        keyboardVerticalOffset={60}
      >
        <ScrollView style={{ flex: 1 }} ref={scrollView}>
          <View style={{ marginVertical: spacing.x48, marginHorizontal: spacing.x16 }}>
            <StyledText style={[Typography.header.h1]}>
              Create an account (
              {route.params.accountType
                ? route.params.accountType?.charAt(0).toUpperCase() +
                  route.params.accountType?.slice(1)
                : ''}
              )
            </StyledText>
            <StyledText
              style={[
                Typography.subheader.R,
                { color: Colors.neutral[200], marginTop: spacing.x8 },
              ]}
            >
              Enter your details to enable us setup your account
            </StyledText>
          </View>
          <View
            style={{
              marginHorizontal: spacing.x16,
              paddingHorizontal: spacing.x16,
              paddingVertical: spacing.x24,
              flex: 1,
              backgroundColor: '#FFF',
              borderRadius: borderRadius.base,
              marginBottom: spacing.x64,
            }}
          >
            <TouchableOpacity
              style={{ flexDirection: 'row', marginBottom: spacing.x24 }}
              onPress={() => {
                navigation.replace('Login');
              }}
            >
              <StyledText>Already have an account? </StyledText>
              <StyledText style={{ color: Colors.primarySapphire.brand }}>Sign in</StyledText>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <SignupButtons
                socialLogin={socialLogin}
                navigation={navigation}
                route={route}
                errorFromLogin={error}
                disabled={!!!accountType}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <View
                style={{
                  borderBottomColor: Colors.neutral[700],
                  borderBottomWidth: borderWidth.thin,
                  flex: 1,
                }}
              />

              <StyledText style={{ paddingHorizontal: spacing.x10, color: Colors.neutral[200] }}>
                Or
              </StyledText>
              <View
                style={{
                  borderBottomColor: Colors.neutral[700],
                  borderBottomWidth: borderWidth.thin,
                  flex: 1,
                }}
              />
            </View>
            <StyledTextInput
              wrapperStyle={{ marginTop: 15 }}
              ref={inputRefs.username}
              value={state.username}
              returnKeyType={'next'}
              label="Username"
              onFocus={() => setState({ ...state, usernameError: '' })}
              placeholder="Enter username"
              onBlur={
                () => {}
                // validateFields(state.username, 'username', (error) =>
                //   setState({ ...state, usernameError: error })
                // )
              }
              onSubmitEditing={() => inputRefs.name.current?.focus()}
              onChangeText={(username) => changeHandler('username', username)}
              blurOnSubmit={false}
              autoCorrect={false}
              autoComplete="username"
              keyboardType="default"
              autoCapitalize="none"
              textContentType="username"
            />

            {state.usernameError ? (
              <StyledText style={{ ...GeneralStyle.InputError }}>{state.usernameError}</StyledText>
            ) : null}

            <StyledTextInput
              wrapperStyle={{ marginTop: 15 }}
              ref={inputRefs.name}
              label="Full Name"
              placeholder="Enter your full name"
              value={state.name}
              returnKeyType={'next'}
              onFocus={() => setState({ ...state, nameError: '' })}
              onBlur={
                () => {}
                // validateFields(state.name, 'name', (error) =>
                //   setState({ ...state, nameError: error })
                // )
              }
              onSubmitEditing={() => inputRefs.email.current?.focus()}
              onChangeText={(name) => changeHandler('name', name)}
              blurOnSubmit={false}
              keyboardType="default"
              autoCapitalize="words"
            />

            {state.nameError ? (
              <StyledText style={{ ...GeneralStyle.InputError }}>{state.nameError}</StyledText>
            ) : null}

            <StyledTextInput
              wrapperStyle={{ marginTop: 15 }}
              ref={inputRefs.email}
              value={state.email}
              label="Email"
              placeholder="Enter your email"
              returnKeyType={'next'}
              keyboardType="email-address"
              autoCorrect={false}
              onFocus={() => setState({ ...state, emailError: '' })}
              onBlur={
                () => {}
                // validateFields(state.email, 'email', (error) =>
                //   setState({ ...state, emailError: error })
                // )
              }
              onSubmitEditing={() => inputRefs.password.current?.focus()}
              onChangeText={(email) => changeHandler('email', email.trim())}
              blurOnSubmit={false}
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />

            {state.emailError ? (
              <StyledText style={{ ...GeneralStyle.InputError }}>{state.emailError}</StyledText>
            ) : null}

            <StyledTextInput
              ref={inputRefs.password}
              value={state.password}
              label="Password"
              returnKeyType={'next'}
              secureTextEntry={hidePass ? true : false}
              textContentType={'newPassword'}
              passwordRules="minlength: 6; required: digit; required: special; allowed: upper,lower;"
              autoComplete="password-new"
              placeholder="Enter your password"
              rightIcon={
                <MaterialCommunityIcons
                  name={hidePass ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={'#5B7279'}
                  style={{
                    alignSelf: 'center',
                  }}
                  onPress={() => setHidePass(!hidePass)}
                />
              }
              autoCorrect={false}
              wrapperStyle={{ marginTop: 15 }}
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
                    <StyledText
                      style={{ color: !passwordTracker.sixCharsOrMore ? 'red' : 'green' }}
                    >
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
              ref={inputRefs.cPassword}
              value={state.cPassword}
              returnKeyType={'done'}
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry={chidePass ? true : false}
              rightIcon={
                <MaterialCommunityIcons
                  name={chidePass ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={'#5B7279'}
                  style={{
                    alignSelf: 'center',
                  }}
                  onPress={() => setcHidePass(!chidePass)}
                />
              }
              wrapperStyle={{ marginTop: 15 }}
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
            <StyledText style={{ ...GeneralStyle.InputError }}>{state.cPasswordError}</StyledText>

            <Recaptcha
              ref={recaptcha}
              siteKey="6Ld3BoolAAAAAIZJUxipD6Xdv1mOXZfXnW71A0o_"
              baseUrl="http://www.onebodyapp.com"
              onVerify={onVerify}
              onExpire={onExpire}
              size="invisible"
            />

            <View style={{ flexDirection: 'row', flex: 1, flexWrap: 'wrap', marginBottom: 20 }}>
              <StyledText style={{ color: dark ? colors.text : '#032F3C' }}>
                By creating an account, you agree to our
              </StyledText>

              <TouchableOpacity onPress={() => OpenURLButton(PRIVACY_POLICY_URL)}>
                <StyledText style={[{ color: dark ? colors.text : Colors.primarySapphire.brand }]}>
                  User Agreements
                </StyledText>
              </TouchableOpacity>
              <StyledText style={[{ color: dark ? colors.text : Colors.primarySapphire.brand }]}>
                {' '}
                &{' '}
              </StyledText>
              <TouchableOpacity onPress={() => OpenURLButton(TERMS_CONDITIONS_URL)}>
                <StyledText style={[{ color: dark ? colors.text : Colors.primarySapphire.brand }]}>
                  Privacy Policy
                </StyledText>
              </TouchableOpacity>
            </View>

            {error != null ? (
              <View style={{ padding: 5, flexDirection: 'row' }}>
                <StyledText
                  style={{
                    color: 'red',
                    // left: getWidth(3),
                    // width: getWidth(78),
                    // fontSize: getFontSize(2),
                  }}
                >
                  {error}
                </StyledText>
              </View>
            ) : null}

            <Button
              text="Create Account"
              btnStyle={[
                button.primary,
                {
                  flex: 1,
                },
              ]}
              disabledBtnStyle={[
                button.primary,
                {
                  flex: 1,
                  opacity: 0.4,
                },
              ]}
              onPress={() => {
                signUpUser();
              }}
              btnTextStyle={{ color: '#FFF' }}
              disabledBtnTextStyle={{ color: '#FFF' }}
              wrapperBtnStyle={{ flex: 1 }}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </UserStepsLayout>
  );
};

export default SignupForm;
