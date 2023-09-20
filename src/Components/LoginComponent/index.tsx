import React, { FC, useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  useColorScheme,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useDispatch, useSelector } from 'react-redux';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Modal from 'react-native-modal';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import axios from 'axios';
import { StackScreenProps } from '@react-navigation/stack';

import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { validateFields } from '@/utils/validation/validate-fields';
import validator from '@/utils/validation/validator';
import { GeneralStyle } from '../../constants/GeneralStyle';
import Google from '@/assets/svg/G.svg';
import Twitter from '@/assets/svg/Twitter.svg';
import Facebook from '@/assets/svg/Facebook.svg';
import Apple from '@/assets/svg/Apple.svg';
import Button from '../Button';

import { styles } from './styles';
import { appColor } from '../../constants';
import { requestUserPermission } from '../../Services/Notification/notificationServices';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import GradientButton from '../GradientButton';
import {
  loginSocialRequest,
  logout,
  sendVerificationEmail,
  signUp,
} from '@/src/Redux/actions/AuthActions';

import { setAccountType, setLoader } from '@/src/Redux/actions/GeneralActions';

import { RootStackParamList } from '@/src/_Navigation/types';
import { getTwitterLoginToken, processLogin } from '@/src/Services/login';
import { BASE_URL, GOOGLE_LOGIN_CLIENT_ID, OpenURLButton } from '@/src/Services/constants';
import { useToast } from 'react-native-toast-notifications';
import G from '@/assets/svg/G.svg';
import { CompositeScreenProps, useNavigation, useTheme } from '@react-navigation/native';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { MainStackParamList } from '@/src/navigator/types';
import { StyledText } from '../styled/Text';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { openInbox } from 'react-native-email-link';
import { button } from '@/src/styles/buttons';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { StyledTextInput } from '../styled/TextInput';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ConfirmLogin'>;

interface Props {
  showConfirmationEmailMessage: boolean;
  verifyAccount?: boolean;
  oauth_token?: string;
  oauth_verifier?: string;

  provider?: string;
  action?: string;
  apiKey?: string;
  lang?: string;
  mode?: string;
  oobCode?: string;
  currentUserEmail?: string;
  onlyPassword?: boolean;
  toScreenRouteParams?: Record<string, string>;
  errorFromLogin?: string;
  updateParent?: Function;

  enabledLoginProviders?: string[];
}

const LoginComponent: FC<Props> = ({
  showConfirmationEmailMessage,
  oauth_token,
  oauth_verifier,
  oobCode,
  mode,
  action,
  provider,
  verifyAccount,

  currentUserEmail,
  onlyPassword,
  toScreenRouteParams,
  enabledLoginProviders,
  updateParent,
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const authState = useSelector((state: RootState) => state.auth);
  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);
  const toScreen = useSelector((state: RootState) => state.general.loginVerficationBackPage);
  const toScreenParams = useSelector(
    (state: RootState) => state.general.loginVerficationBackPageParams
  );

  const inputRefs = {
    email: useRef<any>(),
    password: useRef<any>(),
  };
  const [state, setState] = useState({
    email: currentUserEmail ?? '',
    emailError: '',
    password: '',
    passwordError: '',
  });

  const toast = useToast();

  const [error, seterror] = useState<string>();
  const [success, setSuccess] = useState<string>('');
  const [hidePass, setHidePass] = useState(true);
  const [isVerificationNeeded, setIsVerificationNeeded] = useState<boolean>(false);
  const [token, setToken] = useState('');
  const [showConfirmEmail, setShowConfirmEmail] = useState<boolean>(false);

  const [newUserCredentials, setNewUserCredentials] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);

  const [showSendEmailConfirmation, setShowSendEmailConfirmation] = useState<boolean>(true);

  const accountType = useSelector((state: RootState) => state.general.accountType);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_LOGIN_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });

    // navigation.addListener('beforeRemove', (e) => {
    //   LoginManager.logOut();
    //   if (auth().currentUser?.uid) {
    //     auth().signOut();

    //     auth().currentUser?.reload();
    //   }
    //   dispatch(logout());
    // });
  }, []);

  useEffect(() => {
    if (mode == 'verifyEmail' && action == 'action' && oobCode) {
      const action = async () => {
        try {
          const result = await auth().checkActionCode(oobCode);

          if (result.operation == 'VERIFY_EMAIL') {
            await auth().applyActionCode(oobCode);

            setSuccess('Email verification successful. Please Sign in to your account');
          }
        } catch (e: any) {
          console.log(e);
          seterror('Invalid Verification code, please try again.');
        }
      };
      action();
    }

    if (mode == 'verifyAndChangeEmail' && action == 'action' && oobCode) {
      const action = async () => {
        try {
          const result = await auth().checkActionCode(oobCode);
          await auth().applyActionCode(oobCode);

          setSuccess('Email changed successful. Please Sign in to your account');
          setState({ ...state, email: result.data.email ?? '' });
        } catch (e: any) {
          if (updateParent) {
            updateParent(false);
          }
          navigation.goBack();
          toast.show('Invalid Verification code, please try again.', {
            placement: 'top',
            type: 'danger',
          });
        }
      };
      action();
    }
  }, [mode]);

  // useEffect(() => {
  //   if (action == 'confirmation' && provider == 'twitter') {

  //   }
  // }, [action]);

  useEffect(() => {
    const checkNewUserCredentials = async () => {
      if (newUserCredentials && accountType) {
        const data = {
          email: newUserCredentials?.user.email,
          name: newUserCredentials?.user.displayName,
          socialData: newUserCredentials?.additionalUserInfo,
          userId: newUserCredentials.user.uid,
          token,
          accountType: accountType,
        };

        dispatch(loginSocialRequest({ data, seterror, gotoSignup, sendFcm }));
      } else if (newUserCredentials) {
        seterror('User not found, please register to continue');
        newUserCredentials.user.delete();
        LoginManager.logOut();
        await auth().signOut();
        await auth().currentUser?.reload();
        dispatch(logout());
      }
    };

    if (newUserCredentials) {
      checkNewUserCredentials();
    }
  }, [newUserCredentials]);

  useEffect(() => {
    if (oauth_token && oauth_verifier) {
      const getTwitterAuthToken = async () => {
        try {
          const options = {
            method: 'POST',
            url: 'https://api.twitter.com/oauth/access_token',
            params: {
              oauth_token: oauth_token,
              oauth_verifier: oauth_verifier,
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

            if (
              !!verifyAccount &&
              !!onlyPassword &&
              userCredentials.user.email !== currentUserEmail
            ) {
              if (updateParent) {
                updateParent(false);
              }
              navigation.goBack();
              toast.show(`Please login with the current user's email`, {
                type: 'error',
                placement: 'top',
              });
            } else {
              if (verifyAccount) {
                if (toScreen) {
                  navigation.goBack();

                  navigation.push(toScreen as keyof MainStackParamList, {
                    setError: seterror,
                    ...toScreenParams,
                  });
                } else {
                  if (updateParent) {
                    updateParent(true);
                  }
                  navigation.goBack();
                }
              } else {
                processLogin(userCredentials, setNewUserCredentials, setToken);
              }
            }
          }
        } catch (error: any) {
          if (error.nativeErrorMessage.includes('auth/user-not-found')) {
            seterror('User/password combination not found');
          } else {
            seterror(error.nativeErrorMessage);
          }
        }
      };
      getTwitterAuthToken();
    }
  }, [oauth_token]);

  useEffect(() => {
    if (authState?.sendVerificationEmailSuccess == true) {
      toast.show(`Verification email successfully sent. Check your inbox.`, {
        type: 'success',
        placement: 'top',
      });
    }
  }, [authState?.sendVerificationEmailSuccess]);

  const signInUser = async () => {
    try {
      const { email, password } = state;
      const emailError = await validator('email', email);
      const passwordError = await validator('password', password);
      seterror('');

      if (!!verifyAccount && !!onlyPassword && email !== currentUserEmail) {
        throw { message: "Please login with the current user's email" };
      }

      if (!emailError && !passwordError) {
        dispatch(setLoader(true));

        const emailCredential = await auth().signInWithEmailAndPassword(email, password);

        if (verifyAccount) {
          setState({ ...state, password: '' });

          if (mode == 'verifyEmail') {
            await processLogin(emailCredential, setNewUserCredentials, setToken);
          } else {
            if (toScreen) {
              navigation.goBack();
              navigation.push(toScreen as keyof MainStackParamList, {
                setError: seterror,
                ...toScreenRouteParams,
              });
            } else {
              if (updateParent) {
                updateParent(true);
              }
              navigation.goBack();
            }
          }
        } else {
          if (emailCredential.user.emailVerified) {
            dispatch(setLoader(false));
          } else {
            setIsVerificationNeeded(true);
            await processLogin(emailCredential, setNewUserCredentials, setToken);

            dispatch(setLoader(false));
          }
        }

        // dispatch(loginRequest({ data, seterror, gotoOtp, sendFcm }));
      } else {
        setState({ ...state, emailError, passwordError });
      }
    } catch (error: any) {
      let message = 'User/password combination not found';
      if (
        error.message &&
        !error.message.includes('auth/user-not-found') &&
        !error.message.includes('auth/wrong-password')
      ) {
        message = error.message;
      }
      seterror(message);
      dispatch(setLoader(false));
    }
  };
  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
  const gotoSignup = async () => {
    setShowConfirmEmail(false);
    setNewUserCredentials(null);
    dispatch(setAccountType(''));

    await auth().currentUser?.reload();
    await auth().currentUser?.getIdToken(true);
  };
  const sendFcm = (token: string) => {
    requestUserPermission(token, true);
  };

  const onTwitterButtonPress = async () => {
    try {
      seterror('');
      setState({ ...state, emailError: '', passwordError: '' });

      const urlToken = await getTwitterLoginToken(false, verifyAccount);

      if (urlToken) {
        OpenURLButton(
          `https://api.twitter.com/oauth/authenticate?oauth_token=${urlToken}`,
          false,
          true,
          verifyAccount
            ? 'onebodyapp://app.onebodyapp.com/auth/confirmation'
            : 'onebodyapp://app.onebodyapp.com/login/twitter'
        );

        // Linking.openURL(`https://api.twitter.com/oauth/authenticate?oauth_token=${urlToken}`);
      }
    } catch (e) {
      console.log(e);
    }
  };

  async function onAppleButtonPress() {
    // performs login request
    // const appleAuthRequestResponse = await appleAuth.performRequest({
    //   requestedOperation: appleAuth.Operation.LOGIN,
    //   requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    // });

    // // get current authentication state for user
    // // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
    // const credentialState = await appleAuth.getCredentialStateForUser(
    //   appleAuthRequestResponse.user
    // );

    // // use credentialState response to ensure the user is authenticated
    // if (credentialState === appleAuth.State.AUTHORIZED) {
    //   console.warn('apple response', appleAuthRequestResponse);

    //   // user is authenticated
    // }
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user
      );

      if (credentialState === appleAuth.State.AUTHORIZED) {
        const userCredentials = await auth().signInWithCredential(appleCredential);

        processLogin(userCredentials, setNewUserCredentials, setToken);
      }
    } catch (error: any) {
      if (error.code != appleAuth.Error.CANCELED && error.message) seterror(error.message);
    }
  }

  const googleSignIn = async () => {
    try {
      seterror('');
      dispatch(setLoader(true));
      setState({ ...state, emailError: '', passwordError: '' });

      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredentials = await auth().signInWithCredential(googleCredential);

      if (!!verifyAccount && !!onlyPassword && userCredentials.user.email !== currentUserEmail) {
        navigation.goBack();
        toast.show(`Please login with the current user's email`, {
          type: 'error',
          placement: 'top',
        });
      } else {
        if (verifyAccount) {
          if (toScreen) {
            navigation.goBack();

            navigation.push(toScreen as keyof MainStackParamList, {
              setError: seterror,
              ...toScreenParams,
            });
          } else {
            if (updateParent) {
              updateParent(true);
            }
            navigation.goBack();
          }
        } else {
          await processLogin(userCredentials, setNewUserCredentials, setToken);
        }
      }
      dispatch(setLoader(false));
    } catch (error: any) {
      if (!error.message.includes('Code=-5')) {
        seterror(error.message.replace(`[${error.code}]`, ''));
      }
    }
  };

  const facebookLogin = async () => {
    try {
      seterror('');
      dispatch(setLoader(true));
      setState({ ...state, emailError: '', passwordError: '' });

      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw 'User cancelled the login process';
      }

      // Once signed in, get the users AccesToken
      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        throw 'Something went wrong obtaining access token';
      }

      // Create a Firebase credential with the AccessToken
      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);

      const userCredentials = await auth().signInWithCredential(facebookCredential);

      if (!!verifyAccount && !!onlyPassword && userCredentials.user.email !== currentUserEmail) {
        navigation.goBack();
        toast.show(`Please login with the current user's email`, {
          type: 'error',
          placement: 'top',
        });
      } else {
        if (verifyAccount) {
          if (toScreen) {
            navigation.goBack();

            navigation.push(toScreen as keyof MainStackParamList, {
              setError: seterror,
              ...toScreenParams,
            });
          } else {
            if (updateParent) {
              updateParent(true);
            }
            navigation.goBack();
          }
        } else {
          await processLogin(userCredentials, setNewUserCredentials, setToken);
        }
      }

      dispatch(setLoader(false));
    } catch (error: any) {
      if (error.message) seterror(error.message.replace(`[${error.code}]`, ''));
    }
  };

  const scheme = useColorScheme();
  const { colors } = useTheme();

  if (isVerificationNeeded || (showConfirmationEmailMessage && userProfile)) {
    return (
      <View style={{ marginHorizontal: spacing.x16, flex: 1 }}>
        <StyledText style={Typography.header.h1}>Verify your email address</StyledText>
        <StyledText
          style={[
            Typography.subheader.R,
            { color: Colors.neutral[300], marginTop: spacing.x8, marginBottom: spacing.x48 },
          ]}
        >
          You’ll need to verify your email to complete your account activation.
        </StyledText>
        <Button
          text="Go to My Email"
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          onPress={() => {
            openInbox();
          }}
          btnTextStyle={{ color: '#FFF' }}
        />
        <Button
          onPress={() => {
            dispatch(sendVerificationEmail.Request({ token: userProfile?.token }));
          }}
          text={'Didn’t get mail? '}
          wrapperViewBtnStyle={{ marginTop: 40, justifyContent: 'flex-end' }}
          btnTextStyle={[Typography.subheader.R, { color: Colors.neutral[300] }]}
          rightIcon={
            <StyledText style={{ color: Colors.primarySapphire.brand }}>Resend email</StyledText>
          }
        />
      </View>
    );
  }

  const getButtonTextStyle = () => {
    return { ...styles.btnTitle, color: scheme == 'dark' ? '#838383' : Colors.primary.brand };
  };

  const getButtonContainer = () => {
    return { ...styles.buttonContainer, borderColor: colors.border };
  };

  const getDisabledButtonTextStyle = () => {
    return {
      ...styles.disabledBtnTextStyle,
      color: scheme == 'dark' ? '#3a3a3a' : '#B3C1C5',
      borderColor: colors.border,
    };
  };

  const getDisabledButtonStyle = () => {
    return { ...styles.disabledButtonContainer, borderColor: colors.border };
  };

  return (
    <View style={{ flex: 1, marginHorizontal: spacing.x16 }}>
      <View style={{ marginVertical: spacing.x16 }}>
        <StyledText style={[Typography.header.h1]}>
          {verifyAccount ? 'Verify your account information' : 'Welcome back'}
        </StyledText>

        {!verifyAccount ? (
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[300], marginTop: spacing.x8 }]}
          >
            Sign in to your account
          </StyledText>
        ) : null}
      </View>
      <View
        style={{
          paddingHorizontal: spacing.x16,
          paddingVertical: spacing.x24,

          backgroundColor: colors.background,
          borderRadius: borderRadius.base,
          marginBottom: spacing.x64,
        }}
      >
        {verifyAccount && error ? (
          <View style={{ ...styles.Errorview }}>
            <StyledText style={styles.errortext}>{error}</StyledText>
          </View>
        ) : null}
        {!verifyAccount ? (
          <View>
            <TouchableOpacity
              style={{ flexDirection: 'row', marginBottom: spacing.x24, flex: 1 }}
              onPress={() => {
                navigation.replace('AccountType');
              }}
            >
              <StyledText style={{ color: Colors.neutral[300] }}>New to OneBody? </StyledText>
              <StyledText style={{ color: Colors.primarySapphire.brand }}>
                Create an account
              </StyledText>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          {enabledLoginProviders && enabledLoginProviders?.indexOf('password') > -1 ? (
            <View style={{ flex: 2, flexGrow: 1, flexShrink: 0 }}>
              {success ? (
                <View
                  style={[
                    GeneralStyle.MessageView,
                    { backgroundColor: Colors.successFeedback.background },
                  ]}
                >
                  <StyledText style={styles.successtext}>{success}</StyledText>
                </View>
              ) : null}
              <StyledTextInput
                wrapperStyle={{ flex: 1 }}
                ref={inputRefs.email}
                value={state.email}
                returnKeyType={'next'}
                keyboardType="email-address"
                label={'Email'}
                placeholder="Email address"
                autoComplete="email"
                autoCapitalize="none"
                onFocus={() => setState({ ...state, emailError: '' })}
                onBlur={() =>
                  validateFields(state.email, 'email', (error: string) =>
                    setState({ ...state, emailError: error })
                  )
                }
                onSubmitEditing={() => inputRefs.password?.current.focus()}
                onChangeText={(email) => changeHandler('email', email.trim())}
              />
              {state.emailError ? (
                <StyledText style={{ ...GeneralStyle.InputError }}>{state.emailError}</StyledText>
              ) : null}

              <StyledTextInput
                wrapperStyle={{ marginTop: 15, flex: 1 }}
                ref={inputRefs.password}
                value={state.password}
                returnKeyType={'send'}
                label={'Password'}
                placeholder="Password"
                secureTextEntry={hidePass ? true : false}
                rightIcon={
                  <View style={{ justifyContent: 'center' }}>
                    <MaterialCommunityIcons
                      name={hidePass ? 'eye-outline' : 'eye-off-outline'}
                      size={15}
                      color={Colors.primarySapphire[500]}
                      onPress={() => setHidePass(!hidePass)}
                    />
                  </View>
                }
                onFocus={() => setState({ ...state, passwordError: '' })}
                onSubmitEditing={() => signInUser()}
                onChangeText={(password) => changeHandler('password', password.trim())}
              />
              {state.passwordError ? (
                <StyledText style={{ ...GeneralStyle.InputError }}>
                  {state.passwordError}
                </StyledText>
              ) : null}
            </View>
          ) : null}

          <View style={{ flex: 1 }}>
            {enabledLoginProviders &&
            enabledLoginProviders?.includes('password') &&
            ((enabledLoginProviders && enabledLoginProviders?.includes('google.com')) ||
              (enabledLoginProviders && enabledLoginProviders?.includes('facebook.com')) ||
              (enabledLoginProviders && enabledLoginProviders?.includes('twitter.com'))) ? (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1,
                  marginTop: 20,
                }}
              >
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
            ) : null}

            {enabledLoginProviders ? (
              <View
                style={{
                  marginVertical: 20,
                  flex: 1,
                  flexDirection: 'column',
                }}
              >
                <View style={{ flexDirection: 'row', flex: 1 }}>
                  {enabledLoginProviders &&
                  enabledLoginProviders?.includes('google.com') &&
                  enabledLoginProviders?.includes('password') ? (
                    <View style={{ paddingHorizontal: 10, flex: 1 }}>
                      <Button
                        onPress={() => googleSignIn()}
                        wrapperViewBtnStyle={{ flex: 1 }}
                        leftIcon={<Google style={{ alignSelf: 'center' }} fill={'#000'} />}
                        btnStyle={[getButtonContainer(), { marginHorizontal: 0, flex: 1 }]}
                      />
                    </View>
                  ) : (
                    <>
                      {enabledLoginProviders && enabledLoginProviders?.includes('google.com') ? (
                        <Button
                          text={'Log in with Google'}
                          leftIcon={<G style={{ marginRight: 7 }} height={getHeight(5)} />}
                          btnStyle={getButtonContainer()}
                          btnTextStyle={getButtonTextStyle()}
                          onPress={() => googleSignIn()}
                          disabledBtnStyle={getDisabledButtonStyle()}
                          disabledBtnTextStyle={getDisabledButtonTextStyle()}
                          wrapperBtnStyle={{ width: '100%' }}
                        />
                      ) : null}
                    </>
                  )}

                  {/* {enabledLoginProviders &&
        enabledLoginProviders?.includes('facebook.com') &&
        enabledLoginProviders?.includes('password') ? (
          <View style={{ paddingHorizontal: 10, flex: 1 }}>
            <Button
              onPress={() => facebookLogin()}
              wrapperViewBtnStyle={{ flex: 1 }}
              leftIcon={<Facebook style={{ alignSelf: 'center' }} fill="#1877f2" />}
              btnStyle={[getButtonContainer(), { marginHorizontal: 0, flex: 1 }]}
            />
          </View>
        ) : (
          // <TouchableOpacity onPress={() => facebookLogin()} style={styles.socialContainer}>
          //   <Facebook style={{ alignSelf: 'center' }} fill="#1877f2" />
          // </TouchableOpacity>
          <>
            {enabledLoginProviders && enabledLoginProviders?.includes('facebook.com') ? (
              <Button
                text={'Login with Facebook'}
                leftIcon={<Facebook style={{ marginLeft: 5, marginRight: 10 }} fill="#1877f2" />}
                btnStyle={getButtonContainer()}
                btnTextStyle={getButtonTextStyle()}
                onPress={() => {
                  facebookLogin();
                }}
                disabledBtnStyle={getDisabledButtonStyle()}
                disabledBtnTextStyle={getDisabledButtonTextStyle()}
                wrapperBtnStyle={{
                  width: '100%',

                  paddingVertical: 10,
                }}
              />
            ) : null}
          </>
        )} */}

                  {enabledLoginProviders &&
                  enabledLoginProviders?.includes('twitter.com') &&
                  enabledLoginProviders?.includes('password') ? (
                    <View style={{ paddingHorizontal: 10, flex: 1 }}>
                      <Button
                        onPress={() => onTwitterButtonPress()}
                        wrapperViewBtnStyle={{ flex: 1 }}
                        leftIcon={<Twitter fill="#00acee" style={{ alignSelf: 'center' }} />}
                        btnStyle={[
                          getButtonContainer(),
                          {
                            marginHorizontal: 0,
                            flex: 1,
                          },
                        ]}
                      />
                    </View>
                  ) : (
                    <>
                      {enabledLoginProviders && enabledLoginProviders?.includes('twitter.com') ? (
                        <Button
                          text={'Login with Twitter'}
                          leftIcon={
                            <Twitter
                              style={{ marginRight: 7 }}
                              height={getHeight(5)}
                              fill="#00acee"
                            />
                          }
                          btnStyle={getButtonContainer()}
                          btnTextStyle={getButtonTextStyle()}
                          onPress={() => {
                            onTwitterButtonPress();
                          }}
                          disabledBtnStyle={getDisabledButtonStyle()}
                          disabledBtnTextStyle={getDisabledButtonTextStyle()}
                          wrapperBtnStyle={{ width: '100%' }}
                        />
                      ) : null}
                    </>
                  )}

                  {enabledLoginProviders &&
                  enabledLoginProviders?.includes('apple') &&
                  enabledLoginProviders?.includes('password') &&
                  Platform.OS == 'ios' ? (
                    <View style={{ paddingHorizontal: 10, flex: 1 }}>
                      <Button
                        onPress={() => onAppleButtonPress()}
                        wrapperViewBtnStyle={{ flex: 1 }}
                        leftIcon={
                          <FontAwesome
                            name="apple"
                            style={{
                              // flex: 1,
                              // marginRight: getWidth(3),
                              // color: disabled ? (dark ? colors.text : '#B3C1C5') : '',
                              color: colors.text,
                            }}
                            size={22}
                          />
                        }
                        btnStyle={[getButtonContainer(), { marginHorizontal: 0, flex: 1 }]}
                      />
                    </View>
                  ) : (
                    <>
                      {enabledLoginProviders &&
                      enabledLoginProviders?.includes('apple') &&
                      Platform.OS == 'ios' ? (
                        <Button
                          text={'Login with Apple'}
                          leftIcon={<Apple style={{ marginRight: 7 }} height={getHeight(5)} />}
                          btnStyle={getButtonContainer()}
                          btnTextStyle={getButtonTextStyle()}
                          onPress={() => {
                            onAppleButtonPress();
                          }}
                          disabledBtnStyle={getDisabledButtonStyle()}
                          disabledBtnTextStyle={getDisabledButtonTextStyle()}
                          wrapperBtnStyle={{ width: '100%' }}
                        />
                      ) : null}
                    </>
                  )}
                </View>
                {!verifyAccount &&
                enabledLoginProviders &&
                enabledLoginProviders?.includes('password') ? (
                  <View style={{ alignItems: 'flex-end', flex: 1, marginTop: 15 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                      <StyledText style={{ color: Colors.primarySapphire.brand }}>
                        Forgot Password?
                      </StyledText>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ) : null}
            {enabledLoginProviders && enabledLoginProviders?.includes('password') ? (
              <View style={{ marginHorizontal: 10 }}>
                <Button
                  text="Sign in"
                  disabled={!state.password || !state.email}
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
                  onPress={() => signInUser()}
                  btnTextStyle={{ color: '#FFF' }}
                />
              </View>
            ) : null}

            {verifyAccount ? (
              <View style={{ marginTop: enabledLoginProviders ? 20 : 0 }}>
                <Button
                  text="Cancel"
                  btnStyle={[
                    {
                      flex: 1,
                    },
                  ]}
                  onPress={() => {
                    dispatch(signUp.Reset());
                    if (updateParent) {
                      updateParent(false);
                    }
                    navigation.goBack();
                  }}
                  btnTextStyle={{ color: Colors.neutral[300] }}
                />
              </View>
            ) : null}

            {!verifyAccount && error ? (
              <View style={{ ...styles.Errorview, marginTop: 20 }}>
                <StyledText style={styles.errortext}>{error}</StyledText>
              </View>
            ) : null}
          </View>
        </View>

        <View>
          {!verifyAccount ? (
            <Modal
              backdropOpacity={0.3}
              isVisible={showConfirmEmail}
              onBackdropPress={() => setShowConfirmEmail(false)}
              onSwipeComplete={() => setShowConfirmEmail(false)}
              swipeDirection={['down']}
              style={styles.bottomView}
            >
              <View style={styles.content2}>
                <View style={{ ...styles.contanier, paddingHorizontal: 15 }}>
                  <View>
                    <Button
                      text="Cancel"
                      onPress={async () => {
                        const FBToken = await AccessToken.getCurrentAccessToken();
                        if (FBToken) {
                          LoginManager.logOut();
                          await auth().signOut();
                          await auth().currentUser?.reload();
                        }
                        setShowConfirmEmail(false);
                        setNewUserCredentials(null);
                      }}
                    />
                  </View>

                  <ScrollView>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        flexWrap: 'wrap',
                      }}
                    >
                      <StyledText>Please Confirm email</StyledText>
                    </View>
                  </ScrollView>

                  {showSendEmailConfirmation ? (
                    <GradientButton
                      text={'SEND EMAIL CONFIRMATION'}
                      btnStyle={styles.btn2}
                      btnTextStyle={styles.btnText2}
                      onPress={() => {
                        setShowSendEmailConfirmation(false);
                        auth().currentUser?.sendEmailVerification();
                      }}
                    />
                  ) : (
                    <StyledText>Confirmation email sent</StyledText>
                  )}
                </View>
              </View>
            </Modal>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default LoginComponent;
