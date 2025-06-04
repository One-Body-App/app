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

const closeIcon = require('@/assets/images/close.png');

GiphySDK.configure({ apiKey: 'dZgwmqczMQ90a2MtLZ87SchEGITNJlPw' });
const MainStack = createNativeStackNavigator<MainStackParamList>();

function Main() {
  const toast = useToast();
  const loader = useSelector((state: RootState) => state.general.loader);
  const authState = useSelector((state: RootState) => state.auth);
  // console.log(authState);
  const dispatch = useDispatch();

  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [token, setToken] = useState<string>('');
  // console.log(token);
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
    console.log('AuthState changed', authState.getProfileSuccess);
    if (initializing && authState.getProfileSuccess !== undefined) {
      setInitializing(false);
    } else if (!initializing && authState.getProfileSuccess === undefined && !authState.isLoading) {
      setInitializing(true);
    }
  }, [authState.getProfileSuccess]);

  const onAuthStateChanged = async function (firebaseUser: FirebaseAuthTypes.User | null) {
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

    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    console.log('Main useEffect triggered', initializing, token, user);
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

    // Always hide splash screen after a short delay
    const splashTimer = setTimeout(() => {
      console.log('Hiding splash screen');
      LottieSplashScreen.hide();
    }, 1500); // Use a shorter timeout

    return () => {
      clearTimeout(splashTimer);
    };
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
      const message = await messaging().getInitialNotification();

      // Get the `url` property from the notification which corresponds to a screen
      // This property needs to be set on the notification payload when sending it
      return message?.data?.url as string;
    },
    subscribe(listener) {
      const onReceiveURL = ({ url }: { url: string }) => listener(url);

      // Listen to incoming links from deep linking
      const subscription = Linking.addEventListener('url', onReceiveURL);

      // Listen to firebase push notifications
      const unsubscribeNotification = messaging().onNotificationOpenedApp((message) => {
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
      primary: Colors.primary.brand,
      // card: Colors.neutral[800],
      border: Colors.neutral[900],
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      // Colors.neutral[900]
      primary: '#5B7279',
      // card: Colors.neutral[700],
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
