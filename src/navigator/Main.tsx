import {
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
} from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  StyleSheet,
  useColorScheme,
} from 'react-native';
// import { ActivityIndicator } from 'react-native-paper';

import { useDispatch, useSelector } from 'react-redux';
// import { AppProvider } from '../../app-context';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useToast } from 'react-native-toast-notifications';

import { RootState } from '../Redux/reducers/rootReducer';
import { getUserProfile } from '../Redux/actions/UserAction';
import { setLoginData, setUserData, getProfile } from '../Redux/actions/AuthActions';
import { isEqual } from 'lodash';
import { setLoader } from '../Redux/actions/GeneralActions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccountType from '../screens/Auth/AccountType';
import ConfirmPassword from '../screens/Auth/ConfirmPassword';
import ForgotPassword from '../screens/Auth/ForgetPassword';
import Login from '../screens/Auth/Login';
import NewPassword from '../screens/Auth/NewPassword';
import PasswordResetOtp from '../screens/Auth/PasswordResetOtp';
import Signup from '../screens/Auth/Signup';
import SignupForm from '../screens/Auth/SignupForm';
import InfluencerStepOne from '../screens/BecomeInfluencer/InfluencerStepOne';
import InfluencerSettings from '../screens/Main/influencerSettings';
import InfluencerStepThree from '../screens/BecomeInfluencer/InfluencerStepThree';
import InfluencerStepTwo from '../screens/BecomeInfluencer/InfluencerStepTwo';
import LoadingPage from '../screens/loadingPage';
import AddPhoneNumber from '../screens/Main/AddPhoneNumber';
import BlogView from '../screens/Main/BlogView';
import RemoveAccount from '../screens/Main/RemoveAccount';
import RemoveAccountConfirmation from '../screens/Main/RemoveAccountConfirmation';
import EditProfile from '../screens/Main/EditProfile';
import EndUserAgrement from '../screens/Main/EndUserAgrement';
import Help from '../screens/Main/Help';
import Faqs from '../screens/Main/Help/Faqs';
import IndividualSteps from '../screens/Main/IndividualSteps';
import ConversationScreen from '../screens/Main/Message/conversation';
import OrgnizationSteps from '../screens/Main/OrgnizationSteps';
import PasswordChange from '../screens/Main/PasswordChange';
import PhoneNumberUpdate from '../screens/Main/PhoneNumberUpdate';
import PhoneValidate from '../screens/Main/PhoneValidate';
import PhoneValidateOtp from '../screens/Main/PhoneValidateOtp';

import PrivacyPolicy from '../screens/Main/PrivacyPolicy';
import Search from '../screens/Main/Search';

import Drawer from '../Navigation/Drawer';
import { RootStackParamList } from './types';
import ConfirmLogin from '../screens/Auth/Login/ConfirmLogin';
import EmailChange from '../screens/Main/EmailChange';
import messaging from '@react-native-firebase/messaging';
import InfluencerStepFour from '../screens/BecomeInfluencer/InfluencerStepFour';
import NotificationSettings from '../screens/Main/notificationSettings';

const Stack = createNativeStackNavigator();
const Main = () => {
  const toast = useToast();
  const loader = useSelector((state: RootState) => state.general.loader);
  //const userProfile = useSelector((state: RootState) => state.auth.getProfileData);
  //const userToken = useSelector((state: RootState) => state.auth.userToken);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [initializing, setInitializing] = useState<boolean>(true);
  // const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    toast.hideAll();

    if (loader) {
      toast.show(<ActivityIndicator color="#12D2D9" />, {
        placement: 'top',
      });
    } else {
      toast.hideAll();
    }
  }, [loader]);

  useEffect(() => {
    if (initializing && authState.getProfileSuccess != undefined) setInitializing(false);
  }, [authState.getProfileSuccess]);

  const onAuthStateChanged = async function (firebaseUser: FirebaseAuthTypes.User | null) {
    const firebaseToken = await firebaseUser?.getIdToken();

    if (!isEqual(firebaseUser, user)) {
      // if (firebaseUser?.email && firebaseUser?.emailVerified) {
      setUser(firebaseUser);

      dispatch(
        setUserData({
          ...firebaseUser?.toJSON(),
          tokenResult: await firebaseUser?.getIdTokenResult(),
        })
      );
      // }
    }

    if (!isEqual(firebaseToken, token)) {
      setToken(firebaseToken ?? 'unauthorized');
    }
  };

  useEffect(() => {
    const subscriber = auth().onIdTokenChanged(onAuthStateChanged);

    // dispatch(setLoader(true));

    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (user && token) {
      dispatch(setLoginData({ token }));
    }

    if (token) {
      dispatch(
        getProfile.Request({
          token,
        })
      );
    }

    if (token == 'unauthorized') {
      if (initializing) setInitializing(false);
    }
  }, [token, user, initializing]);

  // useEffect(() => {
  //   if (authState.getProfileSuccess == false) {
  //     setInitializing(false);
  //   }
  // }, [authState.getProfileSuccess]);

  const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['https://app.onebodyapp.com', 'onebodyapp://'],
    config: {
      screens: {
        ConfirmLogin: {
          path: '/auth/:action/:provider?',
        },
        SignUp: {
          path: '/signup/:action',
        },
        Login: {
          path: '/login/:action',
        },
        InfluencerStepTwo: {
          path: '/influencer/login/:action',
        },

        InfluencerSettings: {
          path: '/influencer-settings/:action/:service',
        },
      },
    },
    async getInitialURL() {
      // Check if app was opened from a deep link
      const url = await Linking.getInitialURL();

      if (url != null) {
        return url;
      }

      // Check if there is an initial firebase notification
      const message = await messaging().getInitialNotification();

      // Get the `url` property from the notification which corresponds to a screen
      // This property needs to be set on the notification payload when sending it
      return message?.data?.url;
    },
    subscribe(listener) {
      const onReceiveURL = ({ url }: { url: string }) => listener(url);

      // Listen to incoming links from deep linking
      const subscription = Linking.addEventListener('url', onReceiveURL);

      // Listen to firebase push notifications
      const unsubscribeNotification = messaging().onNotificationOpenedApp((message) => {
        const url = message.data?.url;

        if (url) {
          // Any custom logic to check whether the URL needs to be handled
          //...

          // Call the listener to let React Navigation handle the URL
          listener(url);
        }
      });

      return () => {
        // Clean up the event listeners
        subscription.remove();
        unsubscribeNotification();
      };
    },
  };

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#FFF',
      primary: '#032F3C',
      card: '#F6F6F6',
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,

      primary: '#5B7279',
      card: '#191919',
    },
  };

  const scheme = useColorScheme();

  if (initializing) {
    return (
      <ImageBackground
        resizeMode="cover"
        style={{
          width: '100%',
          height: '100%',

          justifyContent: 'center',
          alignItems: 'center',
        }}
        source={require('@/assets/images/Loading.gif')}
      ></ImageBackground>
    );
  }

  return (
    <NavigationContainer linking={linking} theme={scheme === 'dark' ? darkTheme : theme}>
      {/* <AppProvider> */}
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SignUp">
        {user &&
        token &&
        authState.getProfileData &&
        (authState.getProfileData?.accountType == 'individual' ||
          authState.getProfileData?.accountType == 'organization') &&
        user?.emailVerified ? (
          <>
            {authState.getProfileData.isProfileCompleted ? (
              <>
                <Stack.Screen name="LoadingPage" component={LoadingPage} />
                <Stack.Screen name="Bottombar" component={Drawer} />
                {/* <Stack.Screen name="InfluencerSettings" component={InfluencerSettings} />
                <Stack.Screen name="NotificationSettings" component={NotificationSettings} />
                <Stack.Screen name="InfluencerStepOne" component={InfluencerStepOne} />
                <Stack.Screen name="InfluencerStepTwo" component={InfluencerStepTwo} />
                <Stack.Screen name="InfluencerStepThree" component={InfluencerStepThree} />
                <Stack.Screen name="InfluencerStepFour" component={InfluencerStepFour} /> */}
                {/* <Stack.Screen name="Prayer" component={Prayer} /> */}
                {/* <Stack.Screen name="Help" component={Help} /> */}
                {/* <Stack.Screen name="Faqs" component={Faqs} />
                <Stack.Screen name="RemoveAccount" component={RemoveAccount} />

                <Stack.Screen name="PasswordChange" component={PasswordChange} />
                <Stack.Screen name="EmailChange" component={EmailChange} />

                <Stack.Screen name="phoneValidate" component={PhoneValidate} />
                <Stack.Screen name="confirm" component={ConfirmPassword} />
                <Stack.Screen name="newpassword" component={NewPassword} />
                <Stack.Screen name="conversation" component={ConversationScreen} />

                <Stack.Screen
                  name="RemoveAccountConfirmation"
                  component={RemoveAccountConfirmation}
                /> */}
                {/* <Stack.Screen name="PhoneNumberUpdate" component={PhoneNumberUpdate} />
                  <Stack.Screen name="AddPhoneNumber" component={AddPhoneNumber} /> */}

                {/* <Stack.Screen name="UserProfile" component={UserProfile} /> */}

                {/* <Stack.Screen
                  name="Search"
                  component={Search}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                  name="BlogView"
                  component={BlogView}
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen
                  name="ConfirmLogin"
                  component={ConfirmLogin}
                  options={{ presentation: 'modal' }}
                /> */}
              </>
            ) : (
              <>
                {authState.getProfileData?.accountType == 'individual' ? (
                  <Stack.Screen name="IndividualSteps" component={IndividualSteps} />
                ) : (
                  <Stack.Screen name="OrgnizationSteps" component={OrgnizationSteps} />
                )}
              </>
            )}
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={Signup} />

            <Stack.Screen name="SignupForm" component={SignupForm} />
            <Stack.Screen name="forget" component={ForgotPassword} />

            <Stack.Screen name="newpassword" component={NewPassword} />

            <Stack.Screen
              name="ConfirmLogin"
              component={ConfirmLogin}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
      {/* </AppProvider> */}
    </NavigationContainer>
  );
};
const styles = StyleSheet.create({
  loaderbackground: {
    justifyContent: 'center',
    alignItems: 'center',
    height: getHeight(110),
    width: getWidth(100),
    backgroundColor: 'rgba(52, 52, 52, 0.5)',
    position: 'absolute',
    alignSelf: 'center',
  },
});
export default Main;
