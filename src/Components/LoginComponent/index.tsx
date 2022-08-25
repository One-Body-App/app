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

import Google from '@/assets/svg/Google.svg';
import Apple from '@/assets/svg/Apple.svg';
import Button from '../Button';
import { useDispatch, useSelector } from 'react-redux';
import { styles } from './styles';
import { appColor } from '../../constants';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Modal from 'react-native-modal';

import {
  getFcmToken,
  requestUserPermission,
} from '../../Services/Notification/notificationServices';
import { LoginButton, LoginManager, AccessToken, LoginResult } from 'react-native-fbsdk-next';
import { getuserGet } from '@/src/Redux/actions/UserAction';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import GradientButton from '../GradientButton';
import { loginSocialRequest } from '@/src/Redux/actions/AuthActions';
import { ApiCall } from '@/src/Services/api';
import InAppBrowser from 'react-native-inappbrowser-reborn';

const LoginComponent = () => {
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
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [acceptTermsConditions, setAcceptTermsConditions] = useState<boolean>(false);
  const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState<boolean>(false);

  // useEffect(() => {
  //   if (!userData && token) {
  //     navigation.navigate('Signup');
  //   }
  // }, [userData]);

  useEffect(() => {
    if (isNewUser) setShowConfirmEmail(true);
  }, [isNewUser]);

  const signInUser = async () => {
    try {
      const { email, password } = state;
      const emailError = await validator('email', email);
      const passwordError = await validator('password', password);

      if (!emailError && !passwordError) {
        seterror('');
        // dispatch(setLoader(true));
        await auth().signInWithEmailAndPassword(email, password);
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
    navigation.navigate('Signup');
  };
  const sendFcm = (token: string) => {
    requestUserPermission(token);
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

    // Ensure Apple returned a user identityToken
    if (!appleAuthRequestResponse.identityToken) {
      throw new Error('Apple Sign-In failed - no identify token returned');
    }

    // Create a Firebase credential from the response
    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

    // Sign the user in with the credential
    return auth().signInWithCredential(appleCredential);
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

      // Sign-in the user with the credential
      return auth().signInWithCredential(googleCredential);
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

    processLogin(facebookCredential);
  };

  const processLogin = async (credential: FirebaseAuthTypes.AuthCredential) => {
    const userCredentials = await auth().signInWithCredential(credential);
    const token = await userCredentials.user.getIdToken();
    setToken(token);
    console.log(userCredentials, 'userCredentialsuserCredentialsuserCredentials');
    if (userCredentials.additionalUserInfo?.isNewUser) {
      setIsNewUser(true);
      // dispatch(loginSocialRequest({ data, seterror, gotoOtp, sendFcm }));
    } else {
      const userProfileResult = await ApiCall({
        token: token,
        route: 'individual/my-profile',
        verb: 'get',
      });

      if (userProfileResult.status == 200) {
        if (userProfileResult.response == '') {
          setIsNewUser(true);
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
            setShowConfirmEmail(true);
          }
        }
      } else {
        setToken('');
        auth().signOut();
      }
    }
  };

  const OpenURLButton = async (url: string) => {
    try {
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.open(url, {
          // iOS Properties
          // dismissButtonStyle: 'cancel',
          // preferredBarTintColor: '#453AA4',
          // preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'fullScreen',
          modalTransitionStyle: 'coverVertical',
          modalEnabled: true,
          enableBarCollapsing: false,
          // Android Properties
          showTitle: true,
          // toolbarColor: '#6200EE',
          // secondaryToolbarColor: 'black',
          // navigationBarColor: 'black',
          // navigationBarDividerColor: 'white',
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
          animations: {
            startEnter: 'slide_in_right',
            startExit: 'slide_out_left',
            endEnter: 'slide_in_left',
            endExit: 'slide_out_right',
          },
        });
        // await this.sleep(800);
        // Alert.alert(JSON.stringify(result));
      } else Linking.openURL(url);
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const fbButton = createRef<LoginButton>();
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
      <TouchableOpacity
        onPress={() => navigation.navigate({ key: 'forget' })}
        style={styles.forgotPassword}
      >
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

      <View style={styles.SocialView}>
        <TouchableOpacity onPress={() => signIn()}>
          <Google style={styles.socialContainer} />
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

        {Platform.OS == 'ios' ? (
          <TouchableOpacity onPress={() => onAppleButtonPress()}>
            <Apple style={styles.socialContainer} />
          </TouchableOpacity>
        ) : null}
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
                  setIsNewUser(false);
                }}
              />
            </View>

            <ScrollView>
              {isNewUser ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    flexWrap: 'wrap',
                  }}
                >
                  <View
                    style={{
                      marginTop: getHeight(3),
                      flexDirection: 'row',

                      alignItems: 'stretch',
                      flexWrap: 'wrap',
                      marginHorizontal: 4,
                    }}
                  >
                    <CheckBox
                      value={acceptTermsConditions}
                      onValueChange={() => {
                        setAcceptTermsConditions(!acceptTermsConditions);
                      }}
                    />
                    <Button
                      text="I have read and I accept the"
                      btnStyle={{ marginLeft: 10, marginRight: 2 }}
                      btnTextStyle={styles.paragraph}
                      onPress={() => setAcceptTermsConditions(!acceptTermsConditions)}
                    />

                    <Button
                      text="Terms and Conditions."
                      btnStyle={{ marginLeft: 2 }}
                      btnTextStyle={styles.textButton}
                      onPress={() => OpenURLButton('https://google.com')}
                    />
                  </View>

                  <View
                    style={{
                      marginTop: getHeight(3),
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginHorizontal: 4,
                    }}
                  >
                    <CheckBox
                      value={acceptPrivacyPolicy}
                      onValueChange={() => {
                        setAcceptPrivacyPolicy(!acceptPrivacyPolicy);
                      }}
                    />
                    <Button
                      text="I have read and I accept the"
                      btnStyle={{ marginLeft: 10, marginRight: 2 }}
                      btnTextStyle={styles.paragraph}
                      onPress={() => setAcceptPrivacyPolicy(!acceptPrivacyPolicy)}
                    />

                    <Button
                      text="Privacy Policy."
                      btnStyle={{ marginLeft: 2 }}
                      btnTextStyle={styles.textButton}
                      onPress={() => OpenURLButton('https://google.com')}
                    />
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    flexWrap: 'wrap',
                  }}
                >
                  <Text>Please Confirm email</Text>
                </View>
              )}
            </ScrollView>

            {isNewUser ? (
              <GradientButton
                text={'CONTINUE'}
                disabled={!acceptPrivacyPolicy || !acceptTermsConditions}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={async () => {
                  const user = auth().currentUser;
                  const token = await user?.getIdToken();

                  const data = {
                    email: user?.email,
                    name: user?.displayName,
                    socialData: {
                      id: user?.providerData[0].uid,
                      providerId: user?.providerData[0].providerId,
                    },
                    userId: user?.uid,
                  };
                  dispatch(loginSocialRequest({ token, data, seterror, gotoSignup, sendFcm }));
                }}
              />
            ) : (
              <GradientButton
                text={'SEND EMAIL CONFIRMATION'}
                btnStyle={styles.btn2}
                btnTextStyle={styles.btnText2}
                onPress={() => {}}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
};

export default LoginComponent;
