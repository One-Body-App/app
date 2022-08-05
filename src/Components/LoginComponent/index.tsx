import React, { createRef, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TextInput } from 'react-native-paper';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { validateFields } from '@/utils/validation/validate-fields';
import { loginRequest, loginSocialRequest } from '@/redux/actions/AuthActions';
import { setLoader } from '@/redux/actions/GernalActions';
import validator from '@/utils/validation/validator';
import { GernalStyle } from '../../constants/GernalStyle';
import { useNavigation } from '@react-navigation/native';
import Facebook from '@/assets/svg/Facebook.svg';
import Google from '@/assets/svg/Google.svg';
import Apple from '@/assets/svg/Apple.svg';
import Button from '../Button';
import { useDispatch } from 'react-redux';
import { styles } from './styles';
import { appColor } from '../../constants';
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
// import {
//   LoginButton,
//   AccessToken,
//   LoginManager,
//   GraphRequest,
//   GraphRequestManager,
// } from 'react-native-fbsdk';
// import { GoogleSignin, statusCodes } from '@react-native-community/google-signin';
import {
  getFcmToken,
  requestUserPermission,
} from '../../Services/Notification/notificationServices';

const LoginComponent = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const inputRefs = {
    email: useRef(null),
    password: useRef(null),
  };
  const [state, setState] = useState({
    email: '',
    emailError: '',
    password: '',
    passwordError: '',
  });
  const [error, seterror] = React.useState();
  const [hidePass, setHidePass] = useState(true);

  const signInUser = async () => {
    const { email, password } = state;
    const emailError = await validator('email', email);
    const passwordError = await validator('password', password);

    if (!emailError && !passwordError) {
      dispatch(setLoader(true));
      const data = { username: email, password: password };
      dispatch(loginRequest({ data, seterror, gotoOtp, sendFcm }));
    } else {
      setState({ ...state, emailError, passwordError });
    }
  };
  const changeHandler = (type, value) => setState({ ...state, [type]: value });
  const gotoOtp = () => {
    navigation.navigate('PhoneValidateOtp');
  };
  const sendFcm = (token) => {
    requestUserPermission(token);
  };

  const _responseInfoCallback = (error, result) => {
    if (error) {
      console.log('error', error);
    } else {
      dispatch(setLoader(true));
      const data = {
        email: result?.email,
        name: result?.name,
        socialId: result?.id,
      };
      dispatch(loginRequest({ data, seterror, gotoOtp, sendFcm }));
      console.log('result', result);
    }
  };
  async function onAppleButtonPress() {
    // performs login request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    // get current authentication state for user
    // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
    const credentialState = await appleAuth.getCredentialStateForUser(
      appleAuthRequestResponse.user
    );

    // use credentialState response to ensure the user is authenticated
    if (credentialState === appleAuth.State.AUTHORIZED) {
      console.warn('apple response', appleAuthRequestResponse);

      // user is authenticated
    }
  }

  // useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId: '512417049240-6vh8920rfurcnk167qu150469elt1g5g.apps.googleusercontent.com',
  //     offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  //     forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
  //     iosClientId: '512417049240-3iiavsfsmg3nknovem6rvakj6e7ceiga.apps.googleusercontent.com', // [iOS] optional, if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
  //   });
  // }, []);
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
    } catch (error) {
      // console.log('Message', error.message);
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
  const fbButton = createRef();
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.contanier}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <TextInput
          style={GernalStyle.input}
          theme={{ roundness: 10 }}
          ref={inputRefs.email}
          value={state.email}
          returnKeyType={'next'}
          keyboardType="email-address"
          mode="outlined"
          outlineColor={appColor.InputOutlineColor}
          activeOutlineColor={appColor.InstructionColor}
          label={'E-mail'}
          onFocus={() => setState({ ...state, emailError: '' })}
          onBlur={() =>
            validateFields(state.email, 'email', (error) =>
              setState({ ...state, emailError: error })
            )
          }
          onSubmitEditing={() => inputRefs.password.current.focus()}
          onChangeText={(email) => changeHandler('email', email.trim())}
          blurOnSubmit={false}
        />
        <Text style={{ ...GernalStyle.InputError, marginLeft: getWidth(10) }}>
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
          style={GernalStyle.input}
          onFocus={() => setState({ ...state, passwordError: '' })}
          onBlur={() =>
            validateFields(state.password, 'password', (error) =>
              setState({ ...state, passwordError: error })
            )
          }
          onSubmitEditing={() => signInUser()}
          onChangeText={(password) => changeHandler('password', password.trim())}
          blurOnSubmit={false}
        />
        <Text style={{ ...GernalStyle.InputError, marginLeft: getWidth(10) }}>
          {state.passwordError}
        </Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('forget')} style={styles.forgotPassword}>
        <Text style={styles.forgetStyle}>Forgot Password?</Text>
      </TouchableOpacity>
      <Button
        text={'LOG IN'}
        btnStyle={{ ...GernalStyle.btn, marginTop: getHeight(2) }}
        btnTextStyle={GernalStyle.btnText}
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

        {/* <LoginButton
          style={{
            ...styles.socialContainer,
            height: getHeight(5),
            width: getWidth(25),
          }}
          ref={fbButton}
          onLoginFinished={(error, result) => {
            if (error) {
              console.log('login has error: ' + error);
            } else if (result.isCancelled) {
              console.log('login is cancelled.');
            } else {
              console.log('login is done.');

              AccessToken.getCurrentAccessToken().then((data) => {
                const infoRequest = new GraphRequest(
                  '/me?fields=name,picture,email,first_name,last_name',
                  null,
                  _responseInfoCallback
                );
                // Start the graph request.
                new GraphRequestManager().addRequest(infoRequest).start();
              });
              // AccessToken.getCurrentAccessToken().then(data => {
              //   console.log(data.accessToken.toString());
              //   initUser(data.accessToken);
              // });
            }
          }}
          onLogoutFinished={() => console.log('logout.')}
        /> */}
        {/* <TouchableOpacity onPress={() => fbButton.current.handleOnPress()}>
          <Facebook
            style={{
              width: getWidth(90),
              height: getHeight(5),
              backgroundColor: 'white',
              alignSelf: 'center',
            }}
          />
        </TouchableOpacity> */}

        {Platform.OS == 'android' ? (
          <Apple style={styles.socialContainer} />
        ) : (
          <TouchableOpacity onPress={() => onAppleButtonPress()}>
            <Apple style={styles.socialContainer} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
};

export default LoginComponent;
