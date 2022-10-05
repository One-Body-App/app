import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, Linking, useColorScheme } from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import G from '@/assets/svg/G.svg';
import Facebook from '@/assets/svg/Facebook.svg';
import Twitter from '@/assets/svg/Twitter.svg';
import { styles } from './styles';

import { getTwitterLoginToken, processLogin } from '@/src/Services/login';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import { setAccountType, setLoader } from '@/src/Redux/actions/GeneralActions';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import {
  GOOGLE_LOGIN_CLIENT_ID,
  OpenURLButton,
  PRIVACY_POLICY_URL,
  TERMS_CONDITIONS_URL,
} from '@/src/Services/constants';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import { useTheme } from '@react-navigation/native';

interface Props extends StackScreenProps<RootStackParamList, 'SignUp'> {
  errorFromLogin?: string;

  socialLogin: Function;
}

const SignupButtons = ({ navigation, errorFromLogin, socialLogin }: Props) => {
  const [error, seterror] = useState<string>(errorFromLogin ?? '');

  const [state, setState] = useState({
    email: '',
    emailError: '',
    password: '',
    passwordError: '',
  });

  const [token, setToken] = useState('');

  const dispatch = useDispatch();
  const accounType = useSelector((state: RootState) => state.general.accountType);

  const [newUserCredentials, setNewUserCredentials] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);

  const AccountType = useSelector((state: RootState) => state.general.accountType);

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

  const onTwitterButtonPress = async () => {
    try {
      dispatch(setLoader(true));
      seterror('');
      setState({ ...state, emailError: '', passwordError: '' });

      const urlToken = await getTwitterLoginToken(true);

      if (urlToken) {
        Linking.openURL(`https://api.twitter.com/oauth/authenticate?oauth_token=${urlToken}`);
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

      processLogin(userCredentials, setToken, dispatch, setAccountType, setNewUserCredentials);
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
      seterror(error.message.replace(`[${error.code}]`, ''));
    }
  };

  const disabled = !!!AccountType;

  const scheme = useColorScheme();
  const { colors } = useTheme();

  const getButtonTextStyle = () => {
    return { ...styles.btnTitle, color: scheme == 'dark' ? '#838383' : '#032F3C' };
  };

  const getButtonContainer = () => {
    return { ...styles.buttonContainer, borderColor: colors.border };
  };

  const getDisabledButtonTextStyle = () => {
    //  selected == 'organization'
    //    ? scheme == 'dark'
    //      ? '#81979E'
    //      : '#032F3C'
    //    : scheme == 'dark'
    //    ? '#032F3C'
    //      : '#B3C1C5';

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
    <LinearGradient
      colors={
        scheme == 'dark'
          ? [colors.background, colors.background, '#434748']
          : [colors.background, colors.background, '#E0EEF3']
      }
      style={styles.container}
    >
      <View style={styles.buttonList}>
        <Button
          disabled={disabled}
          text={'Sign up with Google'}
          leftIcon={<G style={{ marginRight: 7 }} height={getHeight(5)} />}
          btnStyle={getButtonContainer()}
          btnTextStyle={getButtonTextStyle()}
          onPress={() => {
            AccountType != null ? googleSignIn() : null;
          }}
          disabledBtnStyle={getDisabledButtonStyle()}
          disabledBtnTextStyle={getDisabledButtonTextStyle()}
          wrapperBtnStyle={{ width: 225 }}
        />
        <Button
          disabled={disabled}
          text={'Sign up with Facebook'}
          leftIcon={<Facebook style={{ marginLeft: 5, marginRight: 10 }} fill="#1877f2" />}
          btnStyle={getButtonContainer()}
          btnTextStyle={getButtonTextStyle()}
          onPress={() => {
            AccountType != null ? facebookLogin() : null;
          }}
          disabledBtnStyle={getDisabledButtonStyle()}
          disabledBtnTextStyle={getDisabledButtonTextStyle()}
          wrapperBtnStyle={{
            width: 225,

            paddingVertical: 10,
          }}
        />

        <Button
          disabled={disabled}
          text={'Sign up with Twitter'}
          leftIcon={<Twitter style={{ marginRight: 7 }} height={getHeight(5)} fill="#00acee" />}
          btnStyle={getButtonContainer()}
          btnTextStyle={getButtonTextStyle()}
          onPress={() => {
            AccountType != null ? onTwitterButtonPress() : null;
          }}
          disabledBtnStyle={getDisabledButtonStyle()}
          disabledBtnTextStyle={getDisabledButtonTextStyle()}
          wrapperBtnStyle={{ width: 225 }}
        />

        <Button
          disabled={disabled}
          text={'Sign up with Email'}
          leftIcon={
            <Ionicons
              name="mail"
              style={{ marginRight: getWidth(3), color: disabled ? '#B3C1C5' : '' }}
              size={getFontSize(4)}
            />
          }
          onPress={() => {
            AccountType != null ? navigation.navigate('SignupForm') : null;
          }}
          btnStyle={getButtonContainer()}
          disabledBtnStyle={getDisabledButtonStyle()}
          btnTextStyle={getButtonTextStyle()}
          disabledBtnTextStyle={getDisabledButtonTextStyle()}
          wrapperBtnStyle={{ width: 225 }}
        />
        {error != null ? (
          <View style={styles.Errorview}>
            <Text style={styles.errortext}>{error}</Text>
          </View>
        ) : null}
        <View style={{ ...styles.center, paddingBottom: 80 }}>
          <Text style={{ color: scheme == 'dark' ? colors.text : '#032F3C' }}>
            By signing up, you agree to our
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => OpenURLButton(PRIVACY_POLICY_URL)}>
              <Text style={{ ...styles.text, color: scheme == 'dark' ? colors.text : '#81979E' }}>
                User Agreements
              </Text>
            </TouchableOpacity>
            <Text
              style={{ ...styles.simpleText, color: scheme == 'dark' ? colors.text : '#81979E' }}
            >
              {' '}
              &{' '}
            </Text>
            <TouchableOpacity onPress={() => OpenURLButton(TERMS_CONDITIONS_URL)}>
              <Text style={{ ...styles.text, color: scheme == 'dark' ? colors.text : '#81979E' }}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              ...styles.alreadyAccountContainer,
              color: scheme == 'dark' ? colors.text : '#032F3C',
            }}
          >
            Already Have an account?
          </Text>
          <TouchableOpacity
            style={{ marginLeft: 5, marginTop: 5, marginBottom: 20 }}
            onPress={() => navigation.navigate('Login', {})}
          >
            <Text style={{ ...styles.helight, textDecorationLine: 'underline' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default SignupButtons;
