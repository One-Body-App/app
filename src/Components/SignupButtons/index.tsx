import React, { useEffect } from 'react';
import { Text, View, Image, TouchableOpacity, Platform } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '../Button';
import G from '@/assets/svg/G.svg';
import { styles } from './styles';
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
// import {
//   LoginButton,
//   AccessToken,
//   LoginManager,
//   GraphRequest,
//   GraphRequestManager,
// } from 'react-native-fbsdk';
// import { GoogleSignin, statusCodes } from '@react-native-community/google-signin';

const SignupButtons = () => {
  const navigation = useNavigation();
  const AccountType = useSelector((state) => state.gernal.AccountType);

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
  return (
    <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.container}>
      <View style={styles.buttonList}>
        <Button
          text={'Sign up with Google'}
          leftIcon={<G style={{ marginRight: 7 }} height={getHeight(5)} />}
          btnStyle={styles.buttonContainer}
          btnTextStyle={styles.btnTitle}
          onPress={() => {
            AccountType != null ? signIn() : navigation.navigate('AccountType');
          }}
        />
        {/* <LoginButton
          style={{
            ...styles.buttonContainer,
            borderWidth: 0,
          }}
          onLoginFinished={(error, result) => {
            if (error) {
              console.log('login has error: ' + result.error);
            } else if (result.isCancelled) {
              console.log('login is cancelled.');
            } else {
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
        {/* <Button
          text={'Sign up with Facebook'}
          leftIcon={
            <FontAwesome
              name="facebook-f"
              style={{marginRight: getWidth(3)}}
              size={getFontSize(4)}
              color={'blue'}
            />
          }
          btnStyle={styles.buttonContainer}
          btnTextStyle={styles.btnTitle}
          onPress={() => {
            AccountType != null
              ? navigation.navigate('SignupForm')
              : navigation.navigate('AccountType');
          }}
        /> */}
        {Platform.OS == 'ios' ? (
          <Button
            text={'Sign up with Apple'}
            leftIcon={
              <FontAwesome
                name="apple"
                style={{ marginRight: getWidth(3) }}
                size={getFontSize(4)}
              />
            }
            btnStyle={styles.buttonContainer}
            btnTextStyle={styles.btnTitle}
            onPress={() => {
              AccountType != null ? onAppleButtonPress() : navigation.navigate('AccountType');
            }}
          />
        ) : null}
        <Button
          text={'Sign up with Email'}
          leftIcon={
            <Ionicons name="mail" style={{ marginRight: getWidth(3) }} size={getFontSize(4)} />
          }
          onPress={() => {
            AccountType != null
              ? navigation.navigate('SignupForm')
              : navigation.navigate('AccountType');
          }}
          btnStyle={styles.buttonContainer}
          btnTextStyle={styles.btnTitle}
        />
        <View style={styles.center}>
          <Text style={{ color: '#032F3C' }}>By signing up, you agree to our</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => navigation.navigate('EndUserAgrement')}>
              <Text style={styles.text}>User Agreements</Text>
            </TouchableOpacity>
            <Text style={styles.simpleText}> & </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.text}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Image
        style={styles.footer}
        resizeMode="stretch"
        source={require('@/assets/images/waveBG.png')}
      />
      <View
        style={{
          ...styles.footer,
          justifyContent: 'center',
          alignItems: 'center',
          height: getHeight(9),
        }}
      >
        <Text style={styles.helight}>Unify the Body</Text>
        <Text style={{ color: 'gray', marginTop: 2 }}>1 Cor. 12:12</Text>
      </View>
    </LinearGradient>
  );
};

export default SignupButtons;
