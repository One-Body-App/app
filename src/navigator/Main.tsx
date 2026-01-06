import {
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
} from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, useColorScheme } from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import {
  getAuth,
  getIdToken,
  getIdTokenResult,
  onIdTokenChanged,
} from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useToast } from 'react-native-toast-notifications';

import { isEqual } from 'lodash';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  getMessaging,
  getInitialNotification,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import { ReactionProvider } from 'react-native-reactions';
import { GiphySDK } from '@giphy/react-native-sdk';
import LottieSplashScreen from 'react-native-lottie-splash-screen';
import { RootState } from '../redux/reducers/rootReducer';
import { setLoginData, setUserData, getProfile } from '../redux/actions/AuthActions';
import ForgotPassword from '../screens/forgotPassword';
import Login from '../screens/login';
import Signup from '../screens/signup';

import { MainStackParamList } from './types';

import Intro from '../screens/intro';

import { Colors } from '../styles';
import AccountType from '../screens/accountType';
import ConfirmLogin from '../screens/login/ConfirmLogin';

import DrawerNav from './DrawerStack';
import NewPost from '../screens/post/NewPost';

import SinglePost from '../screens/post/Single';
import VideoPost from '../screens/post/VideoPost';
import RssPost from '../screens/post/RssPost';
import { headerOptions } from './global';
import { getFirebaseApp } from '../services/firebaseApp';

const closeIcon = require('@/assets/images/close.png');

GiphySDK.configure({ apiKey: 'dZgwmqczMQ90a2MtLZ87SchEGITNJlPw' });
const MainStack = createNativeStackNavigator<MainStackParamList>();

const serializeFirebaseUser = (firebaseUser: FirebaseAuthTypes.User | null) => {
  if (!firebaseUser) {
    return null;
  }

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    emailVerified: firebaseUser.emailVerified,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    phoneNumber: firebaseUser.phoneNumber,
    providerData: firebaseUser.providerData,
    isAnonymous: firebaseUser.isAnonymous,
    metadata: firebaseUser.metadata,
    providerId: firebaseUser.providerId,
    refreshToken: firebaseUser.refreshToken,
    tenantId: firebaseUser.tenantId,
  };
};

const getIdTokenWithTimeout = async (firebaseUser: FirebaseAuthTypes.User, timeoutMs = 5000) => {
  return Promise.race([
    getIdToken(firebaseUser),
    new Promise<string>((_resolve, reject) => {
      setTimeout(() => reject(new Error('getIdToken timeout')), timeoutMs);
    }),
  ]);
};

function Main() {
  const toast = useToast();
  const loader = useSelector((state: RootState) => state.general.loader);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [initializing, setInitializing] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [token, setToken] = useState<string>('');
  const firebaseApp = getFirebaseApp();
  const firebaseAuth = getAuth(firebaseApp);
  const firebaseMessaging = getMessaging(firebaseApp);
  useEffect(() => {
    toast.hideAll();

    if (loader) {
      toast.show(<ActivityIndicator color="#12D2D9" />, {
        placement: 'top',
      });
    } else {
      toast.hideAll();
    }
  }, [loader, toast]);

  const onAuthStateChanged = async (firebaseUser: FirebaseAuthTypes.User | null) => {
    let firebaseToken: string | undefined;
    try {
      firebaseToken = firebaseUser ? await getIdTokenWithTimeout(firebaseUser) : undefined;
    } catch (error) {
      firebaseToken = undefined;
    }

    if (!isEqual(firebaseUser, user)) {
      let tokenResult: FirebaseAuthTypes.IdTokenResult | undefined;
      if (firebaseUser) {
        try {
          tokenResult = await getIdTokenResult(firebaseUser);
        } catch (error) {
          /* noop on token result fetch failure */
        }
      }

      setUser(firebaseUser);
      dispatch(
        setUserData({
          ...serializeFirebaseUser(firebaseUser),
          tokenResult,
        })
      );
    }

    const nextToken = firebaseToken && firebaseToken.length > 0 ? firebaseToken : 'unauthorized';
    if (!isEqual(nextToken, token)) {
      setToken(nextToken);
    }
    if (!authChecked) {
      setAuthChecked(true);
      setInitializing(false);
    }
  };

  useEffect(() => {
    const subscriber = onIdTokenChanged(firebaseAuth, onAuthStateChanged);

    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
      setInitializing(false);
      LottieSplashScreen.hide();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hasValidToken = !!user && token !== '' && token !== 'unauthorized';
    if (hasValidToken) {
      dispatch(setLoginData({ token }));
      dispatch(
        getProfile.Request({
          token,
        })
      );
    } else if (token === 'unauthorized') {
      dispatch(setLoginData({ token: '' }));
    }

    if (token == 'unauthorized') {
      if (initializing) setInitializing(false);
    }

    if (!initializing) {
      // if (Platform.OS == 'android') {
      // LottieSplashScreen.hide();
      // } else {
      setTimeout(() => {
        LottieSplashScreen.hide();
      }, 5500);
      // }
    }
  }, [token, user, initializing]);

  const linking: LinkingOptions<MainStackParamList> = {
    prefixes: ['https://app.onebodyapp.com', 'onebodyapp://'],
    config: {
      screens: {
        ConfirmLogin: {
          path: '/auth/:action/:provider?',
        },
        // Settings: {
        //   screens: {
        //     ConfirmLogin: {
        //       path: '/auth/:action/:provider?',
        //     },
        //   },
        // },
        SignUp: {
          path: '/signup/:action',
        },
        Login: {
          path: '/login/:action',
        },
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
                InfluencerStepTwo: {
                  path: '/influencer/login/:action',
                },

                InfluencerSettings: {
                  path: '/influencer-settings/:action/:service',
                },
              },
            },
          },
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
      const message = await getInitialNotification(firebaseMessaging);

      // Get the `url` property from the notification which corresponds to a screen
      // This property needs to be set on the notification payload when sending it
      return message?.data?.url as string;
    },
    subscribe(listener) {
      const onReceiveURL = ({ url }: { url: string }) => listener(url);

      // Listen to incoming links from deep linking
      const subscription = Linking.addEventListener('url', onReceiveURL);

      // Listen to firebase push notifications
      const unsubscribeNotification = onNotificationOpenedApp(firebaseMessaging, (message) => {
        const url = message.data?.url as string;

        if (url) {
          // Any custom logic to check whether the URL needs to be handled
          // ...

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
      background: Colors.main.white,
      card: Colors.neutral[800],
      text: Colors.neutral.brand,
      primary: Colors.primarySapphire.brand,
      border: Colors.neutral[900],
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0D0D0D',
      card: '#121212',
      text: '#F6F7F8',
      primary: Colors.primarySapphire.brand,
      border: '#1B1B1B',
    },
  };

  const scheme = useColorScheme();

  if (!authChecked && initializing) {
    return null;
  }

  return (
    <NavigationContainer linking={linking} theme={scheme === 'dark' ? darkTheme : theme}>
      <ReactionProvider>
        {/* <AppProvider> */}

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
                options={({ route }) => {
                  return {
                    // presentation: 'formSheet',
                    title: route.params?.postId ? 'Edit Post' : 'Create Post',
                    headerBackTitleVisible: false,
                    // headerLeft: (props) => {
                    //   const { dark, colors } = useTheme();
                    //   return (
                    //     <TouchableOpacity
                    //       onPress={() => {
                    //         if (props.canGoBack) {
                    //           navigation.pop();
                    //         }
                    //       }}
                    //     >
                    //       <MaterialCommunityIcons
                    //         name="window-close"
                    //         size={18}
                    //         color={dark ? colors.text : Colors.primary.brand}
                    //       />
                    //     </TouchableOpacity>
                    //   );
                    // },
                  };
                }}
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
              headerTitleStyle: {
                fontSize: 20,
              },
            }}
          />
        </MainStack.Navigator>
        {/* </AppProvider> */}
      </ReactionProvider>
    </NavigationContainer>
  );
}

export default Main;
