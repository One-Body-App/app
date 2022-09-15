import React, { FC, useEffect, useRef, useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Linking } from 'react-native';
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

import { setAccountType } from '@/src/Redux/actions/GeneralActions';

import { RootStackParamList } from '@/src/Navigation/types';
import { getTwitterLoginToken, processLogin } from '@/src/Services/login';

interface Props extends StackScreenProps<RootStackParamList, 'Login'> {
  showConfirmationEmailMessage: boolean;
  oauthToken?: string;
  oauthVerifier?: string;

  action?: string;
  apiKey?: string;
  lang?: string;
  mode?: string;
  oobCode?: string;
}

const LoginComponent: FC<Props> = ({
  showConfirmationEmailMessage,
  oauthToken,
  oauthVerifier,
  navigation,
  oobCode,
  mode,
  action,
}) => {
  const dispatch = useDispatch();

  const userData = useSelector((state: RootState) => state.auth.userData);

  const inputRefs = {
    email: useRef<any>(),
    password: useRef<any>(),
  };
  const [state, setState] = useState({
    email: '',
    emailError: '',
    password: '',
    passwordError: '',
  });
  const [error, seterror] = useState<string>();
  const [success, setSuccess] = useState<string>('');
  const [hidePass, setHidePass] = useState(true);
  const [token, setToken] = useState('');
  const [showConfirmEmail, setShowConfirmEmail] = useState<boolean>(false);

  const [newUserCredentials, setNewUserCredentials] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);

  const [showSendEmailConfirmation, setShowSendEmailConfirmation] = useState<boolean>(true);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '420515523880-2h4eoqmpti4up6ee2j6evrupaqj5rgb7.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  useEffect(() => {
    if (mode == 'verifyEmail' && action == 'action' && oobCode) {
      const action = async () => {
        try {
          const result = await auth().checkActionCode(oobCode);
          console.log(result);

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
  }, [mode]);

  useEffect(() => {
    if (newUserCredentials) {
      const data = {
        email: newUserCredentials?.user.email,
        name: newUserCredentials?.user.displayName,
        socialData: newUserCredentials?.additionalUserInfo,
        userId: newUserCredentials.user.uid,
        token,
      };

      dispatch(loginSocialRequest({ data, seterror, gotoSignup, sendFcm }));
    }
  }, [newUserCredentials]);

  useEffect(() => {
    if (oauthToken && oauthVerifier) {
      const getTwitterAuthToken = async () => {
        try {
          const options = {
            method: 'POST',
            url: 'https://api.twitter.com/oauth/access_token',
            params: {
              oauth_token: oauthToken,
              oauth_verifier: oauthVerifier,
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

            processLogin(
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
  }, [oauthToken]);

  const signInUser = async () => {
    try {
      const { email, password } = state;
      const emailError = await validator('email', email);
      const passwordError = await validator('password', password);
      seterror('');

      if (!emailError && !passwordError) {
        // dispatch(setLoader(true));
        const emailCredential = await auth().signInWithEmailAndPassword(email, password);
        processLogin(emailCredential, setToken, dispatch, setAccountType, setNewUserCredentials);
        // dispatch(loginRequest({ data, seterror, gotoOtp, sendFcm }));
      } else {
        setState({ ...state, emailError, passwordError });
      }
    } catch (error: any) {
      seterror('User/password combination not found');
      // dispatch(setLoader(false));
    }
  };
  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
  const gotoSignup = () => {
    setShowConfirmEmail(false);
    setNewUserCredentials(null);

    navigation.navigate('AccountType');
  };
  const sendFcm = (token: string) => {
    requestUserPermission(token, true);
  };

  const onTwitterButtonPress = async () => {
    try {
      seterror('');
      setState({ ...state, emailError: '', passwordError: '' });

      const urlToken = await getTwitterLoginToken(false);

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
      setState({ ...state, emailError: '', passwordError: '' });

      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredentials = await auth().signInWithCredential(googleCredential);

      processLogin(userCredentials, setToken, dispatch, setAccountType, setNewUserCredentials);
    } catch (error: any) {
      seterror(error.message);
    }
  };

  const facebookLogin = async () => {
    try {
      seterror('');
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

      processLogin(userCredentials, setToken, dispatch, setAccountType, setNewUserCredentials);
    } catch (error: any) {
      seterror(error.message);
    }
  };

  if (showConfirmationEmailMessage && userData) {
    return (
      <View style={{ marginHorizontal: 25, marginVertical: 10 }}>
        <Text style={{ textAlign: 'center' }}>Please Check your email for a confirmation</Text>
        <Button
          text="Cancel"
          onPress={async () => {
            LoginManager.logOut();
            await auth().signOut();
            dispatch(logout());
          }}
        />
      </View>
    );
  }
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contanier}
      showsVerticalScrollIndicator={false}
    >
      <View>
        {success != null ? (
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
              name={() => (
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
          onBlur={() =>
            validateFields(state.password, 'password', (error: string) =>
              setState({ ...state, passwordError: error })
            )
          }
          onSubmitEditing={() => signInUser()}
          onChangeText={(password) => changeHandler('password', password.trim())}
          blurOnSubmit={false}
        />
        <Text style={{ ...GeneralStyle.InputError, marginLeft: getWidth(10) }}>
          {state.passwordError}
        </Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('forget')} style={styles.forgotPassword}>
        <Text style={styles.forgetStyle}>Forgot Password?</Text>
      </TouchableOpacity>
      <Button
        text={'LOG IN'}
        btnStyle={{ ...GeneralStyle.btn, marginTop: getHeight(2) }}
        btnTextStyle={GeneralStyle.btnText}
        onPress={() => signInUser()}
      />
      {error != null ? (
        <View style={styles.Errorview}>
          <Text style={styles.errortext}>{error}</Text>
        </View>
      ) : null}
      <View style={styles.orView}>
        <View style={styles.line} />
        <Text style={styles.text}>or</Text>
        <View style={styles.line} />
      </View>

      <View style={{ ...styles.SocialView, marginTop: 20 }}>
        <TouchableOpacity onPress={() => googleSignIn()} style={styles.socialContainer}>
          <Google style={{ alignSelf: 'center' }} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => facebookLogin()} style={styles.socialContainer}>
          <Facebook style={{ alignSelf: 'center' }} fill="#1877f2" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onTwitterButtonPress()}>
          <View style={{ ...styles.socialContainer, marginRight: 0 }}>
            <Twitter fill="#00acee" style={{ alignSelf: 'center' }} />
          </View>
        </TouchableOpacity>
      </View>

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
    </KeyboardAwareScrollView>
  );
};

export default LoginComponent;
