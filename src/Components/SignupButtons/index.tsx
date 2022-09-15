import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, Linking } from 'react-native';

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
import { setAccountType } from '@/src/Redux/actions/GeneralActions';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { OpenURLButton, PRIVACY_POLICY_URL, TERMS_CONDITIONS_URL } from '@/src/Services/constants';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';

interface Props extends StackScreenProps<RootStackParamList, 'SignUp'> {
  errorFromLogin?: string;
}

const SignupButtons = ({ navigation, errorFromLogin }: Props) => {
  const [error, seterror] = useState<string>(errorFromLogin ?? '');

  const [state, setState] = useState({
    email: '',
    emailError: '',
    password: '',
    passwordError: '',
  });

  const [token, setToken] = useState('');

  const dispatch = useDispatch();

  const [newUserCredentials, setNewUserCredentials] =
    useState<FirebaseAuthTypes.UserCredential | null>(null);

  const AccountType = useSelector((state: RootState) => state.general.accountType);

  useEffect(() => {
    seterror(errorFromLogin ?? '');
  }, [errorFromLogin]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '420515523880-2h4eoqmpti4up6ee2j6evrupaqj5rgb7.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const onTwitterButtonPress = async () => {
    try {
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

  const disabled = !!!AccountType;

  return (
    <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.container}>
      <View style={styles.buttonList}>
        <Button
          disabled={disabled}
          text={'Sign up with Google'}
          leftIcon={<G style={{ marginRight: 7 }} height={getHeight(5)} />}
          btnStyle={styles.buttonContainer}
          btnTextStyle={styles.btnTitle}
          onPress={() => {
            AccountType != null ? googleSignIn() : null;
          }}
          disabledBtnStyle={styles.disabledButtonContainer}
          disabledBtnTextStyle={styles.disabledBtnTextStyle}
          wrapperBtnStyle={{ width: 225 }}
        />
        <Button
          disabled={disabled}
          text={'Sign up with Facebook'}
          leftIcon={<Facebook style={{ marginLeft: 5, marginRight: 10 }} fill="#1877f2" />}
          btnStyle={styles.buttonContainer}
          btnTextStyle={styles.btnTitle}
          onPress={() => {
            AccountType != null ? facebookLogin() : null;
          }}
          disabledBtnStyle={styles.disabledButtonContainer}
          disabledBtnTextStyle={styles.disabledBtnTextStyle}
          wrapperBtnStyle={{
            width: 225,

            paddingVertical: 10,
          }}
        />

        <Button
          disabled={disabled}
          text={'Sign up with Twitter'}
          leftIcon={<Twitter style={{ marginRight: 7 }} height={getHeight(5)} fill="#00acee" />}
          btnStyle={styles.buttonContainer}
          btnTextStyle={styles.btnTitle}
          onPress={() => {
            AccountType != null ? onTwitterButtonPress() : null;
          }}
          disabledBtnStyle={styles.disabledButtonContainer}
          disabledBtnTextStyle={styles.disabledBtnTextStyle}
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
          btnStyle={styles.buttonContainer}
          disabledBtnStyle={styles.disabledButtonContainer}
          btnTextStyle={styles.btnTitle}
          disabledBtnTextStyle={styles.disabledBtnTextStyle}
          wrapperBtnStyle={{ width: 225 }}
        />
        {error != null ? (
          <View style={styles.Errorview}>
            <Text style={styles.errortext}>{error}</Text>
          </View>
        ) : null}
        <View style={{ ...styles.center, paddingBottom: 80 }}>
          <Text style={{ color: '#032F3C' }}>By signing up, you agree to our</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => OpenURLButton(PRIVACY_POLICY_URL)}>
              <Text style={styles.text}>User Agreements</Text>
            </TouchableOpacity>
            <Text style={styles.simpleText}> & </Text>
            <TouchableOpacity onPress={() => OpenURLButton(TERMS_CONDITIONS_URL)}>
              <Text style={styles.text}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.alreadyAccountContainer}>Already Have an account?</Text>
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
