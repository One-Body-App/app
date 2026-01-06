// src/AppContent.tsx
import {
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
  getStateFromPath as getStateFromPathDefault,
  useNavigationContainerRef,
  CommonActions,
} from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  useColorScheme,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import {
  getAuth,
  getIdToken,
  getIdTokenResult,
  onIdTokenChanged,
  signOut,
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
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { ReactionProvider } from 'react-native-reactions';
import { GiphySDK } from '@giphy/react-native-sdk';
import LottieSplashScreen from 'react-native-lottie-splash-screen';
import { HeaderBackButton } from '@react-navigation/elements';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
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
import { getFirebaseApp } from '../services/firebaseApp';

const closeIcon = require('../assets/images/close.png'); // Adjust path

GiphySDK.configure({ apiKey: 'dZgwmqczMQ90a2MtLZ87SchEGITNJlPw' });
const MainStack = createNativeStackNavigator<MainStackParamList>();

function ConfirmBackImage() {
  return <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.primary.brand} />;
}

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

// This component now contains all the logic that was in your original Main.tsx
function AppContent() {
  // Renamed from 'Main' to 'AppContent'
  const toast = useToast();
  const loader = useSelector((state: RootState) => state.general.loader);
  const dispatch = useDispatch();

  const [initializing, setInitializing] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [token, setToken] = useState<string>('');
  const [navigationReady, setNavigationReady] = useState<boolean>(false);
  const unverifiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const screenHeight = useRef(Dimensions.get('window').height).current;
  const firebaseApp = getFirebaseApp();
  const firebaseAuth = getAuth(firebaseApp);
  const firebaseMessaging = getMessaging(firebaseApp);
  const firebaseAnalytics = getAnalytics(firebaseApp);
  const navigationRef = useNavigationContainerRef<MainStackParamList>();
  const routeNameRef = useRef<string | undefined>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const overlayTranslate = useRef(new Animated.Value(0)).current;
  const handleConfirmBackPress = useCallback(async () => {
    await signOut(firebaseAuth);
    navigationRef.navigate('Intro');
  }, [firebaseAuth, navigationRef]);
  const renderConfirmBackButton = useCallback(
    () => (
      <HeaderBackButton
        labelVisible={false}
        backImage={ConfirmBackImage}
        onPress={handleConfirmBackPress}
      />
    ),
    [handleConfirmBackPress]
  );

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

  const onAuthStateChanged = async function onAuthStateChanged(
    firebaseUser: FirebaseAuthTypes.User | null
  ) {
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

    if (unverifiedTimeoutRef.current) {
      clearTimeout(unverifiedTimeoutRef.current);
      unverifiedTimeoutRef.current = null;
    }
    if (firebaseUser && !firebaseUser.emailVerified) {
      unverifiedTimeoutRef.current = setTimeout(
        () => {
          signOut(firebaseAuth);
        },
        60 * 60 * 1000
      );
    }
  };

  useEffect(() => {
    const subscriber = onIdTokenChanged(firebaseAuth, onAuthStateChanged);
    setTimeout(() => {
      LottieSplashScreen.hide();
    }, 750);

    return subscriber;
    // Cleanup subscription on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
      setInitializing(false);
      LottieSplashScreen.hide();
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authChecked) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(overlayTranslate, {
          toValue: -screenHeight,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [authChecked, fadeAnim, overlayTranslate, screenHeight]);

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

    if (token === 'unauthorized') {
      if (initializing) setInitializing(false);
    }

    if (!initializing) {
      setTimeout(() => {
        LottieSplashScreen.hide();
      }, 2750);
    }
  }, [dispatch, initializing, token, user]);

  useEffect(() => {
    if (!navigationReady) {
      return;
    }
    const currentRouteName = navigationRef.getCurrentRoute()?.name;
    const hasValidToken = !!user && token !== '' && token !== 'unauthorized';

    if (hasValidToken && user?.emailVerified) {
      if (currentRouteName !== 'MainRoot') {
        navigationRef.dispatch(CommonActions.navigate('MainRoot'));
      }
    } else if (hasValidToken && !user?.emailVerified) {
      if (currentRouteName !== 'ConfirmLogin') {
        navigationRef.dispatch(CommonActions.navigate('ConfirmLogin'));
      }
    }
  }, [navigationReady, navigationRef, token, user]);

  const linkingConfig: LinkingOptions<MainStackParamList>['config'] = {
    screens: {
      ConfirmLogin: { path: '/auth/:action' },
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
  };

  const linking: LinkingOptions<MainStackParamList> = {
    prefixes: ['https://app.onebodyapp.com', 'onebodyapp://'],
    config: linkingConfig,
    getStateFromPath(path, options) {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const adjustedPath = normalizedPath.startsWith('/verify-email')
        ? normalizedPath.replace('/verify-email', '/auth/action')
        : normalizedPath;
      return getStateFromPathDefault(adjustedPath, options ?? linkingConfig);
    },
    async getInitialURL() {
      const url = await Linking.getInitialURL();
      if (url != null) {
        return url;
      }
      const message = await getInitialNotification(firebaseMessaging);
      return message?.data?.url as string;
    },
    subscribe(listener) {
      const onReceiveURL = ({ url }: { url: string }) => listener(url);
      const subscription = Linking.addEventListener('url', onReceiveURL);
      const unsubscribeNotification = onNotificationOpenedApp(firebaseMessaging, (message) => {
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
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={scheme === 'dark' ? darkTheme : theme}
      onReady={() => {
        const routeName = navigationRef.getCurrentRoute()?.name;
        routeNameRef.current = routeName;
        setNavigationReady(true);
        if (routeName) {
          logEvent(firebaseAnalytics, 'screen_view', {
            screen_name: routeName,
            screen_class: routeName,
          });
        }
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.getCurrentRoute()?.name;
        if (currentRouteName && previousRouteName !== currentRouteName) {
          logEvent(firebaseAnalytics, 'screen_view', {
            screen_name: currentRouteName,
            screen_class: currentRouteName,
          });
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      <ReactionProvider>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <MainStack.Navigator initialRouteName="Intro">
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

            <MainStack.Screen name="Intro" component={Intro} options={{ headerShown: false }} />
            <MainStack.Screen name="AccountType" component={AccountType} options={headerOptions} />
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
            <MainStack.Screen
              name="ConfirmLogin"
              component={ConfirmLogin}
              options={{
                presentation: 'modal',
                ...headerOptions,
                headerTintColor: Colors.primary.brand,
                headerBackTitle: '',
                headerBackTitleVisible: false,
                headerLeft: renderConfirmBackButton,
              }}
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
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: Colors.main.white,
              transform: [{ translateY: overlayTranslate }],
            }}
          />
        </Animated.View>
      </ReactionProvider>
    </NavigationContainer>
  );
}

export default AppContent; // Export the new component
