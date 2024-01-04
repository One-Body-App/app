import React, { useRef, useState, useEffect } from 'react';

import {
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { TextInput } from 'react-native';
import { validateFields } from '@/utils/validation/validate-fields';
import { loginSocialRequest, signUp } from '@/src/redux/actions/AuthActions';
import validator from '@/utils/validation/validator';
import { GeneralStyle } from '../../constants/GeneralStyle';
import { useDispatch, useSelector } from 'react-redux';
import { styles } from './styles';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import { OpenURLButton, PRIVACY_POLICY_URL, TERMS_CONDITIONS_URL } from '@/services/constants';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { useTheme } from '@react-navigation/native';
import Recaptcha, { RecaptchaHandles } from 'react-native-recaptcha-that-works';
import { ScrollView } from 'react-native';
import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout, { BottomStepsText } from '../layout/UserStepsLayout';
import { button } from '@/src/styles/buttons';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import { Colors, Typography } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { StyledText } from '@/src/components/styled/Text';
import { setAccountType, setLoader } from '@/src/redux/actions/GeneralActions';
import { requestUserPermission } from '@/services/notification/notificationServices';
import axios from 'axios';
import { processLogin } from '@/services/login';
import SignupButtons from '@/src/components/SignupButtons';
import Button from '@/src/components/Button';
import { ApiCall } from '@/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

const { width: wWidth } = Dimensions.get('window');

type Props = StackScreenProps<MainStackParamList, 'SignUp'>;
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
  const [error, setError] = React.useState<string>();
  const [socialError, setSocialError] = React.useState<string>();
  const [hidePass, setHidePass] = useState(true);
  const [chidePass, setcHidePass] = useState(true);
  const [loading, setIsloading] = useState(false);

  const signUpUser = async () => {
    setIsloading(true);
    setError('');
    const { email, password, name, cPassword, username } = state;
    const emailError = await validator('email', email);
    const nameError = await validator('name', name);
    const usernameError = await validator('username', username);
    const passwordError = await validator('password', password);
    const cPasswordError = await validator('cPassword', cPassword, { password });

    if (!emailError && !passwordError && !nameError && !cPasswordError && !usernameError) {
      if (password == cPassword) {
        const { email, password, name, cPassword, username } = state;
        const data = {
          email,
          name,
          accountType,
          userId: '',
          username,
        };
        const userValidation = await ApiCall({
          route: 'user/validateUserInfo',
          params: data,
          verb: 'post',
        });
        if (userValidation.status == 200) {
          recaptcha.current?.open();
        } else {
          setIsloading(false);
          setError(userValidation.response.message);
        }
        //
      } else {
        setError('Both passwords must match. Please make sure they are identical.');
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
          setError(
            'A user already exists with this email address. Please use another email address'
          );
        }

        if (error.code === 'auth/invalid-email') {
          setError(
            'The email address you provided is not valid. Please enter a valid email address.'
          );
        }
      });
  };

  useEffect(() => {
    if (authState.signUpSuccess) {
      setIsloading(false);
      navigation.replace('Login', { showConfirmationEmailMessage: true });
    } else if (authState.signUpSuccess === false) {
      if (loading) {
        setIsloading(false);
      }

      if (authState?.error && authState?.error.length > 0 && authState?.error[0] != error) {
        setError(authState?.error ? authState?.error[0] : '');
      }
    }

    return () => {
      dispatch(signUp.Reset());
    };
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

      dispatch(loginSocialRequest({ data, seterror: setSocialError, gotoSignup, sendFcm }));
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

            await processLogin(userCredentials, setNewUserCredentials, setToken);
          }
        } catch (error: any) {
          setSocialError(error.nativeErrorMessage);
        }
      };
      getTwitterAuthToken();
    }
  }, [route.params]);

  const headerHeight = useHeaderHeight();

  // const insets = useSafeAreaInsets();
  // console.log(headerHeight);
  // const [topPadding, setTopPadding] = useState(insets.top);
  // console.log(topPadding);
  // useEffect(() => {
  //   // This useEffect is needed because insets are undefined at first for some reason
  //   // https://github.com/th3rdwave/react-native-safe-area-context/issues/54

  //   setTopPadding(insets.top);
  // }, [insets.top]);

  return (
    <UserStepsLayout
      backgroundColor={dark ? colors.background : Colors.neutral[700]}
      keyboardVerticalOffset={
        headerHeight + (Platform.OS == 'ios' ? 0 : 150) + (StatusBar.currentHeight ?? 0)
      }
      hideBottomText={true}
    >
      <ScrollView
        ref={scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
        // style={{ overflow: 'scroll', backgroundColor: 'red' }}
        // style={{
        //   flex: 1,
        //   // padding: 25,
        //   // marginTop: 40,
        // }}
      >
        <View
          style={{
            marginTop: spacing.x24,
            marginBottom: spacing.x24,
            marginHorizontal: spacing.x16,
          }}
        >
          <StyledText style={[Typography.header.h1]}>
            Create an account (
            {route.params.accountType
              ? route.params.accountType?.charAt(0).toUpperCase() +
                route.params.accountType?.slice(1)
              : ''}
            )
          </StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[300], marginTop: spacing.x8 }]}
          >
            Enter your details so that we can get you setup:
          </StyledText>
        </View>
        <View
          style={{
            marginHorizontal: spacing.x16,
            paddingHorizontal: spacing.x16,
            paddingVertical: spacing.x24,
            // flex: 1,
            backgroundColor: colors.card,
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
          <View style={{ marginBottom: spacing.x10 }}>
            <SignupButtons
              wrapperStyles={{ flex: 0 }}
              socialLogin={socialLogin}
              navigation={navigation}
              route={route}
              errorFromLogin={socialError}
              disabled={!!!accountType}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{
                borderBottomColor: Colors.neutral[800],
                borderBottomWidth: borderWidth.thin,
                flex: 1,
              }}
            />

            <StyledText style={{ paddingHorizontal: spacing.x10, color: Colors.neutral[300] }}>
              Or
            </StyledText>
            <View
              style={{
                borderBottomColor: Colors.neutral[800],
                borderBottomWidth: borderWidth.thin,
                flex: 1,
              }}
            />
          </View>
          <StyledTextInput
            wrapperStyle={{ marginTop: spacing.x16 }}
            ref={inputRefs.username}
            value={state.username}
            returnKeyType={'next'}
            returnKeyLabel="next"
            label="Username"
            autoCapitalize={'none'}
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
            autoCorrect={false}
            autoComplete="username"
            keyboardType="default"
            textContentType="username"
            blurOnSubmit={false}
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
            returnKeyLabel="next"
            onFocus={() => setState({ ...state, nameError: '' })}
            onBlur={
              () => {}
              // validateFields(state.name, 'name', (error) =>
              //   setState({ ...state, nameError: error })
              // )
            }
            onSubmitEditing={() => inputRefs.email.current?.focus()}
            onChangeText={(name) => changeHandler('name', name)}
            keyboardType="default"
            autoCapitalize="words"
            blurOnSubmit={false}
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
            returnKeyLabel="next"
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
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            blurOnSubmit={false}
          />

          {state.emailError ? (
            <StyledText style={{ ...GeneralStyle.InputError }}>{state.emailError}</StyledText>
          ) : null}

          <StyledTextInput
            ref={inputRefs.password}
            value={state.password}
            label="Password"
            returnKeyType={'next'}
            returnKeyLabel="next"
            secureTextEntry={hidePass ? true : false}
            textContentType={'newPassword'}
            autoCapitalize={'none'}
            autoCorrect={false}
            passwordRules="minlength: 6; required: digit; required: special; allowed: upper,lower;"
            autoComplete="password-new"
            placeholder="Enter your password"
            blurOnSubmit={false}
            rightIcon={
              <View style={{ justifyContent: 'center' }}>
                <MaterialCommunityIcons
                  name={hidePass ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.primarySapphire[500]}
                  style={{
                    alignSelf: 'center',
                  }}
                  onPress={() => setHidePass(!hidePass)}
                />
              </View>
            }
            wrapperStyle={{ marginTop: 15 }}
            onFocus={() => {
              setState({ ...state, passwordError: '' });
            }}
            onBlur={() =>
              validateFields(state.password, 'password', (error) =>
                setState({ ...state, passwordError: error })
              )
            }
            onSubmitEditing={() => inputRefs.cPassword.current?.focus()}
            onChangeText={(password) => {
              changeHandler('password', password);
            }}
            onEndEditing={(event) => {
              if (event.nativeEvent.text.length === 0) {
                changeHandler('password', '');
              }
            }}
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

          {state.password && state.password != '' && state.password.length > 2 ? (
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
            ref={inputRefs.cPassword}
            value={state.cPassword}
            returnKeyType={'done'}
            returnKeyLabel="done"
            label="Confirm Password"
            autoCapitalize={'none'}
            autoCorrect={false}
            placeholder="Confirm your password"
            secureTextEntry={chidePass ? true : false}
            blurOnSubmit={false}
            rightIcon={
              <View style={{ justifyContent: 'center' }}>
                <MaterialCommunityIcons
                  name={chidePass ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.primarySapphire[500]}
                  style={{
                    alignSelf: 'center',
                  }}
                  onPress={() => setcHidePass(!chidePass)}
                />
              </View>
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

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: spacing.x24 }}>
            <StyledText style={{ color: dark ? colors.text : '#032F3C' }}>
              By creating an account, you agree to our{' '}
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

          {error && error != '' ? (
            <View style={{ padding: 5, flexDirection: 'row', marginBottom: 10 }}>
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
            disabled={
              loading ||
              !state.cPassword ||
              !state.password ||
              !state.email ||
              !state.name ||
              !state.username
            }
          />
        </View>
        <BottomStepsText />
      </ScrollView>
    </UserStepsLayout>
  );
};

export default SignupForm;
