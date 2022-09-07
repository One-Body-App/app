import React, { useEffect } from 'react';
import { Text, View, Image, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import G from '@/assets/svg/G.svg';
import Facebook from '@/assets/svg/Facebook.svg';
import Twitter from '@/assets/svg/Twitter.svg';
import { styles } from './styles';
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import InAppBrowser from 'react-native-inappbrowser-reborn';
// import {
//   LoginButton,
//   AccessToken,
//   LoginManager,
//   GraphRequest,
//   GraphRequestManager,
// } from 'react-native-fbsdk';
// import { GoogleSignin, statusCodes } from '@react-native-community/google-signin';

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

const SignupButtons = () => {
  const navigation = useNavigation();
  const AccountType = useSelector((state) => state.general.accountType);

  const _responseInfoCallback = (error, result) => {
    if (error) {
      console.log('error', error);
    } else {
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
    // try {
    //   await GoogleSignin.hasPlayServices();
    //   const userInfo = await GoogleSignin.signIn();
    //   console.log('google user info', userInfo);
    // } catch (error) {
    //   console.log('Message', error.message);
    //   if (error.code === statusCodes.SIGN_IN_CANCELLED) {
    //     console.log('User Cancelled the Login Flow');
    //   } else if (error.code === statusCodes.IN_PROGRESS) {
    //     console.log('Signing In');
    //   } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    //     console.log('Play Services Not Available or Outdated');
    //   } else {
    //     console.log('Some Other Error Happened');
    //   }
    // }
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
            AccountType != null ? signIn() : null;
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
            AccountType != null ? signIn() : null;
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
            AccountType != null ? signIn() : null;
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
        <View style={{ ...styles.center, paddingBottom: 80 }}>
          <Text style={{ color: '#032F3C' }}>By signing up, you agree to our</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => OpenURLButton('https://google.com')}>
              <Text style={styles.text}>User Agreements</Text>
            </TouchableOpacity>
            <Text style={styles.simpleText}> & </Text>
            <TouchableOpacity onPress={() => OpenURLButton('https://google.com')}>
              <Text style={styles.text}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.alreadyAccountContainer}>Already Have an account?</Text>
          <TouchableOpacity
            style={{ marginLeft: 5, marginTop: 5, marginBottom: 20 }}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={{ ...styles.helight, textDecorationLine: 'underline' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default SignupButtons;
