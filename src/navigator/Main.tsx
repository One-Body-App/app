import {
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
  Route,
  useTheme,
} from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  Linking,
  Platform,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useToast } from 'react-native-toast-notifications';

import { RootState } from '../Redux/reducers/rootReducer';
import { setLoginData, setUserData, getProfile } from '../Redux/actions/AuthActions';
import { isEqual } from 'lodash';
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import ForgotPassword from '../screens/forgotPassword';
import Login from '../screens/login';
import Signup from '../screens/signup';

import Help from '../screens/main/Help';
import IndividualSteps from '../screens/main/IndividualSteps';
import OrgnizationSteps from '../screens/main/OrgnizationSteps';

import {
  HomeStackParamsList,
  MainDrawerParamsList,
  OnboardingStackParamList,
  RootNonUserStackParamList,
} from './types';
import messaging from '@react-native-firebase/messaging';

import Connections from '../screens/main/connections';
import Saved from '../screens/main/saved';
import Intro from '../screens/intro';

import { createDrawerNavigator } from '@react-navigation/drawer';
import MainTabStack from './BottomTabStack';
import DrawerContent from './DrawerContent';
import Message from '@/assets/icons/message.svg';
import Notification from '@/assets/icons/notification.svg';
import Logo from '@/assets/icons/logo.svg';
import { spacing } from '../styles/spacing';
import { Colors } from '../styles';
import AccountType from '../screens/accountType';
import FastImage from 'react-native-fast-image';
import SettingsStack from './SettingsStack';
import NewPassword from '../screens/newPassword/NewPassword';
import ConfirmLogin from '../screens/login/ConfirmLogin';
import OnboardingStack from './OnboardingStack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

const NonUserStack = createNativeStackNavigator<RootNonUserStackParamList>();
const DrawerStack = createDrawerNavigator<MainDrawerParamsList>();

type HeaderProps = Omit<TextProps, 'style'> & {
  tintColor?: string;
  style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
};

function getHeaderTitle(route: Partial<Route<string>>) {
  // If the focused route is not found, we need to assume it's the initial screen
  // This can happen during if there hasn't been any navigation inside the screen
  // In our case, it's "Feed" as that's the first screen inside the navigator
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeTab';

  switch (routeName) {
    case 'HomeTab':
      return 'Home';
    case 'SearchTab':
      return 'Search';
    case 'ExploreTab':
      return 'Discover Accounts';
    case 'MyProfileTab':
      return 'My account';
  }
}

export const headerOptions: NativeStackNavigationOptions = {
  headerShadowVisible: false,
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerTitle() {
    return (
      <FastImage
        style={{ width: 100, height: 28 }}
        resizeMode={FastImage.resizeMode.contain}
        source={require('@/assets/images/logo_header.png')}
      />
    );
  },
};

const Main = () => {
  const toast = useToast();
  const loader = useSelector((state: RootState) => state.general.loader);
  const authState = useSelector((state: RootState) => state.auth);
  // console.log(authState);
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
  }, [loader]);

  useEffect(() => {
    if (initializing && authState.getProfileSuccess != undefined) {
      setInitializing(false);
    } else if (!initializing && authState.getProfileSuccess == undefined && !authState.isLoading) {
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

  const linking: LinkingOptions<
    HomeStackParamsList & MainDrawerParamsList & RootNonUserStackParamList
  > = {
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
  // console.log(!!user, !!token, !!authState.getProfileData, 'asdfhasjdkfhajksdhfkjashd');

  return (
    <NavigationContainer linking={linking} theme={scheme === 'dark' ? darkTheme : theme}>
      {/* <AppProvider> */}

      {user &&
      token &&
      authState.getProfileData &&
      (authState.getProfileData?.accountType == 'individual' ||
        authState.getProfileData?.accountType == 'organization') &&
      user?.emailVerified ? (
        <>
          {authState.getProfileData.isProfileCompleted ? (
            <DrawerStack.Navigator
              screenOptions={{
                headerTintColor: Colors.primary.brand,
                headerStyle: {
                  backgroundColor: 'white',
                },
              }}
              drawerContent={(props) => <DrawerContent {...props} />}
            >
              <DrawerStack.Screen
                name="Main"
                component={MainTabStack}
                options={({ route, navigation }) => ({
                  headerTitleAlign: getHeaderTitle(route) == 'Home' ? 'center' : 'left',
                  headerTitle: ({ tintColor, style, children, ...rest }: HeaderProps) => {
                    const { colors } = useTheme();
                    const title = getHeaderTitle(route);

                    if (title == 'Home') {
                      return (
                        <View style={{ height: 28, width: 28 }}>
                          <Logo style={{ height: 28, width: 28 }} />
                        </View>
                      );
                    }
                    return (
                      <Animated.Text
                        accessibilityRole="header"
                        aria-level="1"
                        numberOfLines={1}
                        children={title}
                        {...rest}
                        style={[
                          styles.title,
                          { color: tintColor === undefined ? colors.text : tintColor },
                          style,
                        ]}
                      />
                    );
                  },

                  headerRight() {
                    const routeName = getHeaderTitle(route);
                    if (routeName == 'Home') {
                      return (
                        <View style={{ flexDirection: 'row', paddingRight: spacing.x24 }}>
                          <TouchableOpacity
                            onPress={() => {
                              navigation.navigate('Notifications');
                            }}
                            // style={{ paddingRight: spacing.x24 }}
                          >
                            <Notification
                              style={{ height: 24, width: 24 }}
                              stroke={Colors.primary.brand}
                              strokeWidth={0.2}
                            />
                          </TouchableOpacity>
                          {/* <TouchableOpacity onPress={() => {}}>
                            <Message
                              style={{ height: 24, width: 24 }}
                              stroke={Colors.primary.brand}
                              strokeWidth={0.2}
                            />
                          </TouchableOpacity> */}
                        </View>
                      );
                    }
                  },
                })}
              />

              <DrawerStack.Screen name="Connections" component={Connections} />

              <DrawerStack.Screen name="Saved" component={Saved} />

              <DrawerStack.Screen name="Settings" component={SettingsStack} />
              <DrawerStack.Screen name="Help" component={Help} />
            </DrawerStack.Navigator>
          ) : (
            <OnboardingStack />
          )}
        </>
      ) : (
        <NonUserStack.Navigator initialRouteName="Intro">
          <NonUserStack.Screen name="Intro" component={Intro} options={{ headerShown: false }} />
          <NonUserStack.Screen name="AccountType" component={AccountType} options={headerOptions} />
          <NonUserStack.Screen name="Login" component={Login} options={headerOptions} />
          <NonUserStack.Screen name="SignUp" component={Signup} options={headerOptions} />

          <NonUserStack.Screen
            name="ForgotPassword"
            component={ForgotPassword}
            options={headerOptions}
          />
          <NonUserStack.Screen
            name="ConfirmLogin"
            component={ConfirmLogin}
            options={{ presentation: 'modal', ...headerOptions }}
          />
        </NonUserStack.Navigator>
      )}

      {/* </AppProvider> */}
    </NavigationContainer>
  );
};

export default Main;

const styles = StyleSheet.create({
  title: Platform.select({
    ios: {
      fontSize: 17,
      fontWeight: '600',
    },
    android: {
      fontSize: 20,
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal',
    },
    default: {
      fontSize: 18,
      fontWeight: '500',
    },
  }),
});
