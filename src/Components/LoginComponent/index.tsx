import React, { FC, useEffect, useRef, useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Linking, useColorScheme } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TextInput } from 'react-native-paper';
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
import Button from '../Button';
import { styles } from './styles';
import { appColor } from '../../constants';
import { requestUserPermission } from '../../Services/Notification/notificationServices';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import GradientButton from '../GradientButton';
import { loginSocialRequest, logout } from '@/src/Redux/actions/AuthActions';

import { setAccountType, setLoader } from '@/src/Redux/actions/GeneralActions';

import { RootStackParamList } from '@/src/Navigation/types';
import { getTwitterLoginToken, processLogin } from '@/src/Services/login';
import { BASE_URL, GOOGLE_LOGIN_CLIENT_ID } from '@/src/Services/constants';
import { useToast } from 'react-native-toast-notifications';
import G from '@/assets/svg/G.svg';
import { useTheme } from '@react-navigation/native';

interface Props extends StackScreenProps<RootStackParamList, any> {
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

  enabledLoginProviders?: string[];
}

const LoginComponent: FC<Props> = ({
  showConfirmationEmailMessage,
  oauth_token,
  oauth_verifier,
  navigation,
  oobCode,
  mode,
  action,
  provider,
  verifyAccount,

  currentUserEmail,
  onlyPassword,
  toScreenRouteParams,
  enabledLoginProviders,
}) => {
  const dispatch = useDispatch();

  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
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
  }, []);

  useEffect(() => {
    if (mode == 'verifyEmail' && action == 'action' && oobCode) {
      const action = async () => {
        try {
          const result = await auth().checkActionCode(oobCode);

          if (result.operation == 'VERIFY_EMAIL') {
            await auth().applyActionCode(oobCode);

            setSuccess('Email verification successful. Please login');
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

          setSuccess('Email changed successful. Please login again');
          setState({ ...state, email: result.data.email ?? '' });
        } catch (e: any) {
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
          role: accountType,
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
    checkNewUserCredentials();
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
              userCredentials.user.email != currentUserEmail
            ) {
              navigation.goBack();
              toast.show(`Please login with the current user's email`, {
                type: 'error',
                placement: 'top',
              });
            } else {
              if (verifyAccount) {
                if (toScreen) {
                  navigation.goBack();

                  navigation.push(toScreen as keyof RootStackParamList, {
                    setError: seterror,
                    ...toScreenParams,
                  });
                } else {
                  navigation.goBack();
                }
              } else {
                processLogin(
                  userCredentials,
                  setToken,
                  dispatch,
                  setAccountType,
                  setNewUserCredentials
                );
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

  const signInUser = async () => {
    try {
      const { email, password } = state;
      const emailError = await validator('email', email);
      const passwordError = await validator('password', password);
      seterror('');

      if (!!verifyAccount && !!onlyPassword && email != currentUserEmail) {
        throw { message: "Please login with the current user's email" };
      }

      if (!emailError && !passwordError) {
        dispatch(setLoader(true));

        const emailCredential = await auth().signInWithEmailAndPassword(email, password);

        if (verifyAccount) {
          setState({ ...state, password: '' });

          if (toScreen) {
            navigation.goBack();
            navigation.push(toScreen as keyof RootStackParamList, {
              setError: seterror,
              ...toScreenRouteParams,
            });
          } else {
            navigation.goBack();
          }
        } else {
          if (emailCredential.user.emailVerified) {
            await processLogin(
              emailCredential,
              setToken,
              dispatch,
              setAccountType,
              setNewUserCredentials
            );
            dispatch(setLoader(false));
          } else {
            setIsVerificationNeeded(true);
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
        Linking.openURL(`https://api.twitter.com/oauth/authenticate?oauth_token=${urlToken}`);
      }
    } catch (e) {
      console.log(e);
    }
  };

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

      if (!!verifyAccount && !!onlyPassword && userCredentials.user.email != currentUserEmail) {
        navigation.goBack();
        toast.show(`Please login with the current user's email`, {
          type: 'error',
          placement: 'top',
        });
      } else {
        if (verifyAccount) {
          if (toScreen) {
            navigation.goBack();
            console.log(toScreen);
            navigation.push(toScreen as keyof RootStackParamList, {
              setError: seterror,
              ...toScreenParams,
            });
          } else {
            navigation.goBack();
          }
        } else {
          await processLogin(
            userCredentials,
            setToken,
            dispatch,
            setAccountType,
            setNewUserCredentials
          );
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

      if (!!verifyAccount && !!onlyPassword && userCredentials.user.email != currentUserEmail) {
        navigation.goBack();
        toast.show(`Please login with the current user's email`, {
          type: 'error',
          placement: 'top',
        });
      } else {
        if (verifyAccount) {
          if (toScreen) {
            navigation.goBack();
            console.log(toScreen);
            navigation.push(toScreen as keyof RootStackParamList, {
              setError: seterror,
              ...toScreenParams,
            });
          } else {
            navigation.goBack();
          }
        } else {
          await processLogin(
            userCredentials,
            setToken,
            dispatch,
            setAccountType,
            setNewUserCredentials
          );
        }
      }

      dispatch(setLoader(false));
    } catch (error: any) {
      seterror(error.message.replace(`[${error.code}]`, ''));
    }
  };

  const scheme = useColorScheme();
  const { colors } = useTheme();

  if (isVerificationNeeded || (showConfirmationEmailMessage && userProfile)) {
    return (
      <View style={{ marginHorizontal: 25, marginVertical: 10 }}>
        <Text
          style={{
            ...styles.btnTitle,
            fontFamily: 'Rubik-Bold',
            fontSize: 20,
            textAlign: 'center',
            marginTop: 20,
          }}
        >
          Verify your email address
        </Text>
        <Text style={{ ...styles.paragraph, textAlign: 'center', marginTop: 10, marginBottom: 30 }}>
          You’ll need to verify your email to complete your account activation.
        </Text>

        <GradientButton
          text={'Resend email'}
          onPress={async () => {
            try {
              const options = {
                method: 'POST',
                url: `${BASE_URL}/auth/sendVerificationEmail`,

                headers: {
                  'Content-Type': 'application/json',
                  authorization: `Bearer ${userProfile?.token}`,
                },
              };
              const result = await axios.request(options);
            } catch (e) {
              console.log(e);
            }
          }}
          btnStyle={{
            ...GeneralStyle.btn,
            height: getHeight(7),

            backgroundColor: '#0C5C75',
          }}
          btnTextStyle={GeneralStyle.btnText}
        />
        <Button
          text={'Cancel'}
          btnStyle={{
            ...GeneralStyle.btn,
            marginHorizontal: 20,
            // backgroundColor: colors.background,
          }}
          btnTextStyle={{
            marginHorizontal: 20,
            color: '#70747D',
            fontSize: 14,
          }}
          onPress={async () => {
            LoginManager.logOut();
            await auth().signOut();
            await auth().currentUser?.reload();
            dispatch(logout());

            navigation.goBack();
          }}
        />
      </View>
    );
  }

  const getButtonTextStyle = () => {
    return { ...styles.btnTitle, color: scheme == 'dark' ? '#838383' : '#032F3C' };
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
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contanier}
      showsVerticalScrollIndicator={false}
    >
      {enabledLoginProviders && enabledLoginProviders?.indexOf('password') > -1 ? (
        <View>
          {success ? (
            <View style={styles.Errorview}>
              <Text style={styles.successtext}>{success}</Text>
            </View>
          ) : null}

          <TextInput
            style={GeneralStyle.input}
            theme={{ roundness: 10 }}
            ref={inputRefs.email}
            value={state.email}
            returnKeyType={'next'}
            keyboardType="email-address"
            mode="outlined"
            outlineColor={appColor.InputOutlineColor}
            activeOutlineColor={appColor.InstructionColor}
            label={'E-mail'}
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
            blurOnSubmit={false}
          />
          <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(10) }}>
            {state.emailError}
          </Text>

          <TextInput
            theme={{ roundness: 10 }}
            activeOutlineColor={appColor.InstructionColor}
            outlineColor={appColor.InputOutlineColor}
            ref={inputRefs.password}
            value={state.password}
            returnKeyType={'send'}
            label={'Password'}
            mode="outlined"
            secureTextEntry={hidePass ? true : false}
            right={
              <TextInput.Icon
                icon={() => (
                  <MaterialCommunityIcons
                    name={hidePass ? 'eye-off-outline' : 'eye-outline'}
                    size={getFontSize(3)}
                    color={'#5B7279'}
                    style={styles.icon}
                    onPress={() => setHidePass(!hidePass)}
                  />
                )}
              />
            }
            style={GeneralStyle.input}
            onFocus={() => setState({ ...state, passwordError: '' })}
            onSubmitEditing={() => signInUser()}
            onChangeText={(password) => changeHandler('password', password.trim())}
            blurOnSubmit={false}
          />
          {state.passwordError ? (
            <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(10) }}>
              {state.passwordError}
            </Text>
          ) : null}
        </View>
      ) : null}

      {!verifyAccount && enabledLoginProviders && enabledLoginProviders?.includes('password') ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('forget')}
          style={styles.forgotPassword}
        >
          <Text style={styles.forgetStyle}>Forgot Password?</Text>
        </TouchableOpacity>
      ) : null}

      {enabledLoginProviders && enabledLoginProviders?.includes('password') ? (
        <View style={{ marginHorizontal: 10 }}>
          <Button
            text={'LOG IN'}
            disabled={!state.password || !state.email}
            btnStyle={{
              ...GeneralStyle.btn,

              marginTop: getHeight(2),
              backgroundColor: scheme == 'dark' ? '#fff' : '#0C5C75',
            }}
            disabledBtnStyle={{
              ...GeneralStyle.btn,
              marginTop: getHeight(2),

              backgroundColor: '#E6EAEC',
            }}
            btnTextStyle={GeneralStyle.btnText}
            disabledBtnTextStyle={GeneralStyle.btnText}
            onPress={() => signInUser()}
          />
        </View>
      ) : null}

      {error ? (
        <View style={{ ...styles.Errorview, marginTop: 20 }}>
          <Text style={styles.errortext}>{error}</Text>
        </View>
      ) : null}

      {enabledLoginProviders &&
      enabledLoginProviders?.includes('password') &&
      ((enabledLoginProviders && enabledLoginProviders?.includes('google.com')) ||
        (enabledLoginProviders && enabledLoginProviders?.includes('facebook.com')) ||
        (enabledLoginProviders && enabledLoginProviders?.includes('twitter.com'))) ? (
        <View style={styles.orView}>
          <View style={styles.line} />
          <Text style={styles.text}>or</Text>
          <View style={styles.line} />
        </View>
      ) : null}

      <View style={{ ...styles.SocialView, marginTop: 20 }}>
        {enabledLoginProviders &&
        enabledLoginProviders?.includes('google.com') &&
        enabledLoginProviders?.includes('password') ? (
          <TouchableOpacity onPress={() => googleSignIn()} style={styles.socialContainer}>
            <Google style={{ alignSelf: 'center' }} />
          </TouchableOpacity>
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

        {enabledLoginProviders &&
        enabledLoginProviders?.includes('facebook.com') &&
        enabledLoginProviders?.includes('password') ? (
          <TouchableOpacity onPress={() => facebookLogin()} style={styles.socialContainer}>
            <Facebook style={{ alignSelf: 'center' }} fill="#1877f2" />
          </TouchableOpacity>
        ) : (
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
        )}

        {enabledLoginProviders &&
        enabledLoginProviders?.includes('twitter.com') &&
        enabledLoginProviders?.includes('password') ? (
          <TouchableOpacity onPress={() => onTwitterButtonPress()}>
            <View style={{ ...styles.socialContainer, marginRight: 0 }}>
              <Twitter fill="#00acee" style={{ alignSelf: 'center' }} />
            </View>
          </TouchableOpacity>
        ) : (
          <>
            {enabledLoginProviders && enabledLoginProviders?.includes('twitter.com') ? (
              <Button
                text={'Login with Twitter'}
                leftIcon={
                  <Twitter style={{ marginRight: 7 }} height={getHeight(5)} fill="#00acee" />
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
      </View>

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
                  <Text>Please Confirm email</Text>
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
                <Text>Confirmation email sent</Text>
              )}
            </View>
          </View>
        </Modal>
      ) : null}
    </KeyboardAwareScrollView>
  );
};

export default LoginComponent;
