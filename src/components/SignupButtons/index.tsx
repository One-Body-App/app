import React, { useEffect, useState } from 'react';
import { Text, View, useColorScheme, Platform, ViewStyle, StyleSheet } from 'react-native';

import { useDispatch } from 'react-redux';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  AppleAuthProvider,
  FirebaseAuthTypes,
  GoogleAuthProvider,
  getAuth,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import Button from '../Button';
import G from '@/assets/svg/G.svg';
import { styles } from './styles';

import { processLogin } from '@/services/login';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { GOOGLE_LOGIN_CLIENT_ID } from '@/services/constants';
import { MainStackParamList } from '@/src/navigator/types';
import { appColor } from '@/src/constants';

interface Props extends StackScreenProps<MainStackParamList, 'SignUp'> {
  errorFromLogin?: string;

  socialLogin: Function;
  disabled?: boolean;
  wrapperStyles?: ViewStyle;
}

function SignupButtons({ errorFromLogin, socialLogin, disabled, wrapperStyles }: Props) {
  const [error, seterror] = useState<string>(errorFromLogin ?? '');

  const dispatch = useDispatch();
  const [newUserCredentials, setNewUserCredentials] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);
  const firebaseAuth = getAuth(getApp());

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
  }, [newUserCredentials, socialLogin]);

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
      const appleCredential = AppleAuthProvider.credential(identityToken, nonce);

      // get current authentication state for user
      // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user
      );

      // use credentialState response to ensure the user is authenticated
      if (credentialState === appleAuth.State.AUTHORIZED) {
        const userCredentials = await signInWithCredential(firebaseAuth, appleCredential);

        processLogin(userCredentials, setNewUserCredentials);
      }
    } catch (appleAuthError: any) {
      if (appleAuthError.code !== appleAuth.Error.CANCELED && appleAuthError.message)
        seterror(appleAuthError.message);
    }
  };

  const googleSignIn = async () => {
    try {
      dispatch(setLoader(true));
      seterror('');

      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      const userCredentials = await signInWithCredential(firebaseAuth, googleCredential);

      processLogin(userCredentials, setNewUserCredentials);
    } catch (googleSignInError: any) {
      if (!googleSignInError.message.includes('Code=-5')) {
        seterror(googleSignInError.message.replace(`[${googleSignInError.code}]`, ''));
      }
    }
  };

  const scheme = useColorScheme();
  const { dark, colors } = useTheme();
  const isIos = Platform.OS === 'ios';
  const glassOverlay = dark ? 'rgba(10, 18, 24, 0.35)' : 'rgba(255, 255, 255, 0.22)';

  const getButtonTextStyle = () => {
    return { ...styles.btnTitle, color: scheme === 'dark' ? '#838383' : '#032F3C' };
  };

  const getButtonContainer = () => {
    return {
      ...styles.buttonContainer,
      borderColor: appColor.SecoundryColor,
    };
  };
  const getGlassWrapperStyle = () => {
    return {
      ...getButtonContainer(),
      borderWidth: 0,
      borderColor: 'transparent',
      overflow: 'hidden',
    };
  };
  const getGlassButtonStyle = () => {
    return {
      ...getButtonContainer(),
      marginHorizontal: 0,
      backgroundColor: 'transparent',
    };
  };

  const getDisabledButtonTextStyle = () => {
    return {
      ...styles.disabledBtnTextStyle,
      color: scheme === 'dark' ? '#3a3a3a' : '#B3C1C5',
      borderColor: colors.border,
    };
  };

  const getDisabledButtonStyle = () => {
    return {
      ...styles.buttonContainer,
      borderColor: appColor.SecoundryColor,
    };
  };
  const getGlassDisabledButtonStyle = () => {
    return {
      ...getDisabledButtonStyle(),
      marginHorizontal: 0,
      backgroundColor: 'transparent',
    };
  };

  return (
    <>
      <View style={[styles.buttonList, wrapperStyles]}>
        {isIos ? (
          <View style={getGlassWrapperStyle()}>
            <BlurView
              pointerEvents="none"
              blurType={dark ? 'dark' : 'light'}
              blurAmount={18}
              reducedTransparencyFallbackColor={colors.card}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: glassOverlay }]}
            />
            <Button
              disabled={disabled}
              leftIcon={<G height={40} />}
              btnStyle={getGlassButtonStyle()}
              btnTextStyle={getButtonTextStyle()}
              onPress={() => {
                if (!disabled) {
                  googleSignIn();
                }
              }}
              disabledBtnStyle={getGlassDisabledButtonStyle()}
              disabledBtnTextStyle={getDisabledButtonTextStyle()}
              wrapperViewBtnStyle={styles.buttonsWrapper}
            />
          </View>
        ) : (
          <Button
            disabled={disabled}
            leftIcon={<G height={40} />}
            btnStyle={getButtonContainer()}
            btnTextStyle={getButtonTextStyle()}
            onPress={() => {
              if (!disabled) {
                googleSignIn();
              }
            }}
            disabledBtnStyle={getDisabledButtonStyle()}
            disabledBtnTextStyle={getDisabledButtonTextStyle()}
            wrapperViewBtnStyle={styles.buttonsWrapper}
          />
        )}
        {isIos ? (
          <View style={getGlassWrapperStyle()}>
            <BlurView
              pointerEvents="none"
              blurType={dark ? 'dark' : 'light'}
              blurAmount={18}
              reducedTransparencyFallbackColor={colors.card}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: glassOverlay }]}
            />
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
                if (!disabled) {
                  onAppleButtonPress();
                }
              }}
              btnStyle={getGlassButtonStyle()}
              disabledBtnStyle={getGlassDisabledButtonStyle()}
              btnTextStyle={getButtonTextStyle()}
              disabledBtnTextStyle={getDisabledButtonTextStyle()}
              wrapperViewBtnStyle={styles.buttonsWrapper}
            />
          </View>
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
