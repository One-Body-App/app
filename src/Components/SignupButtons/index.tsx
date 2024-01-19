import React, { useEffect, useState } from 'react';
import { Text, View, useColorScheme, Platform, StyleProp, ViewStyle } from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Button from '../Button';
import G from '@/assets/svg/G.svg';
import Facebook from '@/assets/svg/Facebook.svg';
import Twitter from '@/assets/svg/Twitter.svg';
import { styles } from './styles';

import { getTwitterLoginToken, processLogin } from '@/services/login';
import { setAccountType, setLoader } from '@/src/redux/actions/GeneralActions';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { GOOGLE_LOGIN_CLIENT_ID, OpenURLButton } from '@/services/constants';
import { MainStackParamList } from '@/src/navigator/types';

interface Props extends StackScreenProps<MainStackParamList, 'SignUp'> {
  errorFromLogin?: string;

  socialLogin: Function;
  disabled?: boolean;
  wrapperStyles?: ViewStyle;
}

function SignupButtons({ errorFromLogin, socialLogin, disabled, wrapperStyles }: Props) {
  const [error, seterror] = useState<string>(errorFromLogin ?? '');

  const [state, setState] = useState({
    email: '',
    emailError: '',
    password: '',
    passwordError: '',
  });

  const dispatch = useDispatch();
  const accounType = useSelector((state: RootState) => state.general.accountType);

  const [newUserCredentials, setNewUserCredentials] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);

  useEffect(() => {
    seterror(errorFromLogin ?? '');
  }, [errorFromLogin]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_LOGIN_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  useEffect(() => {
    socialLogin(newUserCredentials);
  }, [newUserCredentials]);

  const onAppleButtonPress = async () => {
    try {
      // performs login request
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

      // get current authentication state for user
      // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user
      );

      // use credentialState response to ensure the user is authenticated
      if (credentialState === appleAuth.State.AUTHORIZED) {
        const userCredentials = await auth().signInWithCredential(appleCredential);

        processLogin(userCredentials, setNewUserCredentials);
      }
    } catch (error: any) {
      if (error.code != appleAuth.Error.CANCELED && error.message) seterror(error.message);
    }
  };

  const onTwitterButtonPress = async () => {
    try {
      dispatch(setLoader(true));
      seterror('');
      setState({ ...state, emailError: '', passwordError: '' });

      const urlToken = await getTwitterLoginToken(true);

      if (urlToken) {
        // OpenURLButton(`https://api.twitter.com/oauth/authenticate?oauth_token=${urlToken}`);
        OpenURLButton(
          `https://api.twitter.com/oauth/authenticate?oauth_token=${urlToken}`,
          false,
          true,
          'onebodyapp://app.onebodyapp.com/signup/twitter'
        );
      }
    } catch (e) {
      console.log(e);
    }
  };

  const googleSignIn = async () => {
    try {
      dispatch(setLoader(true));
      seterror('');
      setState({ ...state, emailError: '', passwordError: '' });

      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      const userCredentials = await auth().signInWithCredential(googleCredential);
      console.log(userCredentials);
      processLogin(userCredentials, setNewUserCredentials);
    } catch (error: any) {
      if (!error.message.includes('Code=-5')) {
        seterror(error.message.replace(`[${error.code}]`, ''));
      }
    }
  };

  const facebookLogin = async () => {
    try {
      dispatch(setLoader(true));
      seterror('');
      setState({ ...state, emailError: '', passwordError: '' });
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('User cancelled the login process');
      }

      // Once signed in, get the users AccesToken
      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        throw new Error('Something went wrong obtaining access token');
      }

      // Create a Firebase credential with the AccessToken
      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
      const userCredentials = await auth().signInWithCredential(facebookCredential);

      processLogin(userCredentials, setNewUserCredentials);
    } catch (error: any) {
      if (error.message) seterror(error.message.replace(`[${error.code}]`, ''));
    }
  };

  const scheme = useColorScheme();
  const { dark, colors } = useTheme();

  const getButtonTextStyle = () => {
    return { ...styles.btnTitle, color: scheme == 'dark' ? '#838383' : '#032F3C' };
  };

  const getButtonContainer = () => {
    return {
      ...styles.buttonContainer,
      borderColor: colors.border,
    };
  };

  const getDisabledButtonTextStyle = () => {
    return {
      ...styles.disabledBtnTextStyle,
      color: scheme == 'dark' ? '#3a3a3a' : '#B3C1C5',
      borderColor: colors.border,
    };
  };

  const getDisabledButtonStyle = () => {
    return {
      ...styles.buttonContainer,
      borderColor: colors.border,
    };
  };

  return (
    <>
      <View style={[styles.buttonList, wrapperStyles]}>
        <Button
          disabled={disabled}
          leftIcon={<G height={40} />}
          btnStyle={getButtonContainer()}
          btnTextStyle={getButtonTextStyle()}
          onPress={() => {
            if (disabled != null) {
              googleSignIn();
            }
          }}
          disabledBtnStyle={getDisabledButtonStyle()}
          disabledBtnTextStyle={getDisabledButtonTextStyle()}
          wrapperViewBtnStyle={styles.buttonsWrapper}
        />
        {/* <Button
          disabled={disabled}
          leftIcon={<Facebook fill="#1877f2" />}
          btnStyle={getButtonContainer()}
          btnTextStyle={getButtonTextStyle()}
          onPress={() => {
            disabled != null ? facebookLogin() : null;
          }}
          disabledBtnStyle={getDisabledButtonStyle()}
          disabledBtnTextStyle={getDisabledButtonTextStyle()}
          wrapperViewBtnStyle={styles.buttonsWrapper}
        /> */}

        <Button
          disabled={disabled}
          leftIcon={<Twitter fill="#00acee" />}
          btnStyle={getButtonContainer()}
          btnTextStyle={getButtonTextStyle()}
          onPress={() => {
            disabled != null ? onTwitterButtonPress() : null;
          }}
          disabledBtnStyle={getDisabledButtonStyle()}
          disabledBtnTextStyle={getDisabledButtonTextStyle()}
          wrapperViewBtnStyle={styles.buttonsWrapper}
        />

        {Platform.OS == 'ios' ? (
          <Button
            disabled={disabled}
            leftIcon={
              <FontAwesome
                name="apple"
                style={{
                  color: dark ? colors.text : '#B3C1C5',
                }}
                size={30}
              />
            }
            onPress={() => {
              disabled != null ? onAppleButtonPress() : null;
            }}
            btnStyle={getButtonContainer()}
            disabledBtnStyle={getDisabledButtonStyle()}
            btnTextStyle={getButtonTextStyle()}
            disabledBtnTextStyle={getDisabledButtonTextStyle()}
            wrapperViewBtnStyle={styles.buttonsWrapper}
          />
        ) : null}
      </View>

      {error != null ? (
        <View style={styles.Errorview}>
          <Text style={styles.errortext}>{error}</Text>
        </View>
      ) : null}
    </>
  );
}

export default SignupButtons;
