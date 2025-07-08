// src/AppContent.tsx
import {
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
} from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, useColorScheme } from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useToast } from 'react-native-toast-notifications';

import { isEqual } from 'lodash';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';
import { ReactionProvider } from 'react-native-reactions';
import { GiphySDK } from '@giphy/react-native-sdk';
import LottieSplashScreen from 'react-native-lottie-splash-screen';
import { RootState } from '../redux/reducers/rootReducer'; // Adjust path relative to AppContent.tsx
import { setLoginData, setUserData, getProfile } from '../redux/actions/AuthActions'; // Adjust path

import ForgotPassword from '../screens/forgotPassword'; // Adjust path
import Login from '../screens/login'; // Adjust path
import Signup from '../screens/signup'; // Adjust path

import { MainStackParamList } from './types'; // Adjust path

import Intro from '../screens/intro'; // Adjust path

import { Colors } from '../styles'; // Adjust path
import AccountType from '../screens/accountType'; // Adjust path
import ConfirmLogin from '../screens/login/ConfirmLogin'; // Adjust path

import DrawerNav from './DrawerStack';
import NewPost from '../screens/post/NewPost'; // Adjust path

import SinglePost from '../screens/post/Single'; // Adjust path
import VideoPost from '../screens/post/VideoPost'; // Adjust path
import RssPost from '../screens/post/RssPost'; // Adjust path
import { headerOptions } from './global'; // Adjust path

const closeIcon = require('../assets/images/close.png'); // Adjust path

GiphySDK.configure({ apiKey: 'dZgwmqczMQ90a2MtLZ87SchEGITNJlPw' });
const MainStack = createNativeStackNavigator<MainStackParamList>();

// This component now contains all the logic that was in your original Main.tsx
function AppContent() {
  // Renamed from 'Main' to 'AppContent'
  const toast = useToast();
  const loader = useSelector((state: RootState) => state.general.loader);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [initializing, setInitializing] = useState<boolean>(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader]);

  useEffect(() => {
    if (initializing && authState.getProfileSuccess !== undefined) {
      setInitializing(false);
    } else if (!initializing && authState.getProfileSuccess === undefined && !authState.isLoading) {
      setInitializing(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.getProfileSuccess]);

  const onAuthStateChanged = async function onAuthStateChanged(
    firebaseUser: FirebaseAuthTypes.User | null
  ) {
    const firebaseToken = await firebaseUser?.getIdToken();

    if (!isEqual(firebaseUser, user)) {
      setUser(firebaseUser);

      dispatch(
        setUserData({
          ...firebaseUser?.toJSON(),
          tokenResult: await firebaseUser?.getIdTokenResult(),
        })
      );
    }

    if (!isEqual(firebaseToken, token)) {
      setToken(firebaseToken ?? 'unauthorized');
    }
  };

  useEffect(() => {
    const subscriber = auth().onIdTokenChanged(onAuthStateChanged);
    setTimeout(() => {
      // LottieSplashScreen.hide();
    }, 5500);

    return subscriber;
    // Cleanup subscription on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (token === 'unauthorized') {
      if (initializing) setInitializing(false);
    }

    if (!initializing) {
      setTimeout(() => {
        // LottieSplashScreen.hide();
      }, 5500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- [token, user, initializing]);
  }, [token, user, initializing]);

  const linking: LinkingOptions<MainStackParamList> = {
    prefixes: ['https://app.onebodyapp.com', 'onebodyapp://'],
    config: {
      screens: {
        ConfirmLogin: { path: '/auth/:action/:provider?' },
        SignUp: { path: '/signup/:action' },
        Login: { path: '/login/:action' },
        MainRoot: {
          screens: {
            Main: {
              screens: {
                ExploreTab: {
                  screens: {
                    UserProfile: {
                      path: '/profile/:id',
                    },
                  },
                },
              },
            },
            Settings: {
              screens: {
                InfluencerStepTwo: { path: '/influencer/login/:action' },
                InfluencerSettings: { path: '/influencer-settings/:action/:service' },
              },
            },
          },
        },
      },
    },
    async getInitialURL() {
      const url = await Linking.getInitialURL();
      if (url != null) {
        return url;
      }
      const message = await messaging().getInitialNotification();
      return message?.data?.url as string;
    },
    subscribe(listener) {
      const onReceiveURL = ({ url }: { url: string }) => listener(url);
      const subscription = Linking.addEventListener('url', onReceiveURL);
      const unsubscribeNotification = messaging().onNotificationOpenedApp((message) => {
        const url = message.data?.url as string;
        if (url) {
          listener(url);
        }
      });
      return () => {
        subscription.remove();
        unsubscribeNotification();
      };
    },
  };

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.main.white,
      primary: Colors.primary.brand,
      border: Colors.neutral[900],
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#5B7279',
      background: Colors.main.white,
    },
  };

  const scheme = useColorScheme();

  if (initializing) {
    return null;
  }

  return (
    <NavigationContainer linking={linking} theme={scheme === 'dark' ? darkTheme : theme}>
      <ReactionProvider>
        <MainStack.Navigator>
          {user &&
          token &&
          authState.getProfileData &&
          (authState.getProfileData?.accountType === 'individual' ||
            authState.getProfileData?.accountType === 'organization') &&
          user?.emailVerified ? (
            <>
              <MainStack.Screen
                name="MainRoot"
                component={DrawerNav}
                options={{ headerShown: false }}
              />
              <MainStack.Screen
                name="SinglePost"
                component={SinglePost}
                options={{ headerBackTitleVisible: false, title: 'Comment' }}
              />
              <MainStack.Screen
                name="SingleRss"
                component={RssPost}
                options={{ headerBackTitleVisible: false, title: 'Comment' }}
              />
              <MainStack.Screen
                name="Post"
                component={NewPost}
                options={({ route }) => ({
                  title: route.params?.postId ? 'Edit Post' : 'Create Post',
                  headerBackTitleVisible: false,
                })}
              />
            </>
          ) : (
            <>
              <MainStack.Screen name="Intro" component={Intro} options={{ headerShown: false }} />
              <MainStack.Screen
                name="AccountType"
                component={AccountType}
                options={headerOptions}
              />
              <MainStack.Screen
                name="Login"
                component={Login}
                options={{
                  ...headerOptions,
                  headerStyle: {
                    backgroundColor:
                      scheme === 'dark' ? darkTheme.colors.background : theme.colors.background,
                  },
                  headerTransparent: false,
                }}
              />
              <MainStack.Screen
                name="SignUp"
                component={Signup}
                options={{
                  ...headerOptions,
                  headerTransparent: false,
                  headerStyle: {
                    backgroundColor:
                      scheme === 'dark' ? darkTheme.colors.background : theme.colors.background,
                  },
                }}
              />
              <MainStack.Screen
                name="ForgotPassword"
                component={ForgotPassword}
                options={{
                  ...headerOptions,
                  headerTransparent: false,
                  headerStyle: {
                    backgroundColor:
                      scheme === 'dark' ? darkTheme.colors.background : theme.colors.background,
                  },
                }}
              />
            </>
          )}
          <MainStack.Screen
            name="ConfirmLogin"
            component={ConfirmLogin}
            options={{ presentation: 'modal', ...headerOptions }}
          />
          <MainStack.Screen
            name="VideoPost"
            component={VideoPost}
            options={{
              headerShown: true,
              headerTransparent: true,
              title: 'Create',
              headerBackImageSource: closeIcon,
              headerTitleAlign: 'center',
              headerBackTitleVisible: false,
              headerTintColor: 'white',
              headerTitleStyle: { fontSize: 20 },
            }}
          />
        </MainStack.Navigator>
      </ReactionProvider>
    </NavigationContainer>
  );
}

export default AppContent; // Export the new component
