import React, { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { Text, View, TouchableOpacity, Platform, ScrollView, Alert, Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TextInput } from 'react-native-paper';
import CheckBox from '@react-native-community/checkbox';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { validateFields } from '@/utils/validation/validate-fields';
import validator from '@/utils/validation/validator';
import { GeneralStyle } from '../../constants/GeneralStyle';
import { useNavigation } from '@react-navigation/native';

import Google from '@/assets/svg/G.svg';
import Twitter from '@/assets/svg/Twitter.svg';
import Button from '../Button';
import { useDispatch, useSelector } from 'react-redux';
import { styles } from './styles';
import { appColor } from '../../constants';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Modal from 'react-native-modal';
import { LoginButton, LoginManager, AccessToken, LoginResult } from 'react-native-fbsdk-next';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { NativeModules } from 'react-native';
const { RNTwitterSignIn } = NativeModules;

import {
  getFcmToken,
  requestUserPermission,
} from '../../Services/Notification/notificationServices';

import { RootState } from '@/src/Redux/reducers/rootReducer';
import GradientButton from '../GradientButton';
import { loginSocialRequest, logout } from '@/src/Redux/actions/AuthActions';
import { ApiCall } from '@/src/Services/api';
import { setAccountType } from '@/src/Redux/actions/GeneralActions';

RNTwitterSignIn.init('TWITTER_CONSUMER_KEY', 'TWITTER_CONSUMER_SECRET').then(() =>
  console.log('Twitter SDK initialized')
);

type Props = {
  showConfirmationEmailMessage: boolean;
};

const LoginComponent = ({ showConfirmationEmailMessage }: Props) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
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
  const [hidePass, setHidePass] = useState(true);
  const [token, setToken] = useState('');
  const [showConfirmEmail, setShowConfirmEmail] = useState<boolean>(false);
  const [loggingIn, setLoginingIn] = useState<boolean>(false);
  const [newUserCredentials, setNewUserCredentials] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);
  const [showSendEmailConfirmation, setShowSendEmailConfirmation] = useState<boolean>(true);

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

  const signInUser = async () => {
    try {
      const { email, password } = state;
      const emailError = await validator('email', email);
      const passwordError = await validator('password', password);

      if (!emailError && !passwordError) {
        seterror('');
        // dispatch(setLoader(true));
        const emailCredential = await auth().signInWithEmailAndPassword(email, password);
        processLogin(emailCredential);
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
    setLoginingIn(false);
    navigation.navigate('AccountType');
  };
  const sendFcm = (token: string) => {
    requestUserPermission(token);
  };

  const onTwitterButtonPress = async () => {
    // Perform the login request
    const { authToken, authTokenSecret } = await RNTwitterSignIn.logIn();

    // Create a Twitter credential with the tokens
    const twitterCredential = auth.TwitterAuthProvider.credential(authToken, authTokenSecret);
    const userCredenttials = await auth().signInWithCredential(twitterCredential);
    // Sign-in the user with the credential
    return processLogin(userCredenttials);
  };

  const onFacebookButtonPress = async () => {
    // Attempt login with permissions
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

    // Sign-in the user with the credential
    const userCredentials = await auth().signInWithCredential(facebookCredential);

    processLogin(userCredentials);
  };

  // const _responseInfoCallback = (error, result) => {
  //   if (error) {
  //     console.log('error', error);
  //   } else {
  //     dispatch(setLoader(true));
  //     const data = {
  //       email: result?.email,
  //       name: result?.name,
  //       socialId: result?.id,
  //     };
  //     dispatch(loginRequest({ data, seterror, gotoOtp, sendFcm }));
  //     console.log('result', result);
  //   }
  // };
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

    // Start the sign-in request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });
    console.log(appleAuthRequestResponse);
    // Ensure Apple returned a user identityToken
    if (!appleAuthRequestResponse.identityToken) {
      throw new Error('Apple Sign-In failed - no identify token returned');
    }

    // Create a Firebase credential from the response
    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
    const userCredential = await auth().signInWithCredential(appleCredential);

    processLogin(userCredential);
    // Sign the user in with the credential
    // return auth().signInWithCredential(appleCredential);
  }

  useEffect(() => {
    // GoogleSignin.configure({
    //   webClientId: '512417049240-6vh8920rfurcnk167qu150469elt1g5g.apps.googleusercontent.com',
    //   offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
    //   forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
    //   iosClientId: '512417049240-3iiavsfsmg3nknovem6rvakj6e7ceiga.apps.googleusercontent.com', // [iOS] optional, if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
    // });

    GoogleSignin.configure({
      // scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
      webClientId: '420515523880-2h4eoqmpti4up6ee2j6evrupaqj5rgb7.apps.googleusercontent.com', // client ID of type WEB for your server (needed to verify user ID and offline access)
      offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
      // hostedDomain: '', // specifies a hosted domain restriction
      forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
      // accountName: '', // [Android] specifies an account name on the device that should be used
      // iosClientId: '<FROM DEVELOPER CONSOLE>', // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
      // googleServicePlistPath: '', // [iOS] if you renamed your GoogleService-Info file, new name here, e.g. GoogleService-Info-Staging
      // openIdRealm: '', // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
      // profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
    });
  }, []);
  const signIn = async () => {
    try {
      // await GoogleSignin.hasPlayServices();
      // const userInfo = await GoogleSignin.signIn();
      // dispatch(setLoader(true));
      // const data = {
      //   email: userInfo?.user?.email,
      //   name: userInfo?.user?.name,
      //   socialId: userInfo?.user?.id,
      // };
      // dispatch(loginSocialRequest({ data, seterror, gotoOtp, sendFcm }));
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      processLogin(userCredential);
      // Sign-in the user with the credential
      // return auth().signInWithCredential(googleCredential);
    } catch (error: any) {
      console.log('Message', error.message);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
      } else {
        // some other error happened
      }
      // if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      //   console.log('User Cancelled the Login Flow');
      // } else if (error.code === statusCodes.IN_PROGRESS) {
      //   console.log('Signing In');
      // } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      //   console.log('Play Services Not Available or Outdated');
      // } else {
      //   console.log('Some Other Error Happened');
      // }
    }
  };

  const facebookLogin = async (result: LoginResult, error: Record<string, unknown>) => {
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

    processLogin(userCredentials);
  };

  const processLogin = async (userCredentials: FirebaseAuthTypes.UserCredential) => {
    const token = await userCredentials.user.getIdToken();
    setToken(token);
    setLoginingIn(true);
    dispatch(setAccountType(''));

    if (userCredentials.additionalUserInfo?.isNewUser) {
      setNewUserCredentials(userCredentials);
    } else {
      const userProfileResult = await ApiCall({
        token: token,
        route: 'auth/my-profile',
        verb: 'get',
      });
      console.log(userProfileResult);
      if (userProfileResult.status == 200) {
        if (userProfileResult.response == '') {
          setNewUserCredentials(userCredentials);
        } else {
          if (!userCredentials.user.email || !userCredentials.user.emailVerified) {
            //   dispatch(
            //     getuserGet({
            //       token,
            //     })
            //   );
            // } else {
            if (!userCredentials.user.email && userCredentials.additionalUserInfo?.profile?.email) {
              await userCredentials.user.updateEmail(
                userCredentials.additionalUserInfo?.profile?.email
              );
            }
            // setShowConfirmEmail(true);
          }
        }
      } else {
        // setToken('');
        // auth().signOut();
        setNewUserCredentials(userCredentials);
      }
    }
  };

  const fbButton = createRef<LoginButton>();
  console.log(userData, 'userData');
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
        <TouchableOpacity onPress={() => signIn()} style={styles.socialContainer}>
          <Google style={{ alignSelf: 'center' }} />
        </TouchableOpacity>

        <LoginButton
          permissions={['public_profile', 'email']}
          style={{
            ...styles.socialContainer,
            height: getHeight(5),
            width: getWidth(25),
          }}
          ref={fbButton}
          onLoginFinished={async (error, result) => facebookLogin(result, error)}
        />

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
