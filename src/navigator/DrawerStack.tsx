import React, { useEffect } from 'react';
import {
  DrawerToggleButton,
  createDrawerNavigator,
  getDrawerStatusFromState,
} from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import {
  Animated,
  Platform,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  View,
  useWindowDimensions,
} from 'react-native';
import { Home3, Profile2User } from 'iconsax-react-native';
import { Route, getFocusedRouteNameFromRoute, useTheme } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { HandsPraying } from 'phosphor-react-native';

import Geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import { HeaderBackButton } from '@react-navigation/elements';
import { MainDrawerParamsList } from './types';
import OnboardingStack from './OnboardingStack';
import { RootState } from '../redux/reducers/rootReducer';
import { Colors } from '../styles';

import Connections from '@/src/screens/main/connections';
import SettingsStack from './SettingsStack';
import Logo from '@/assets/icons/logo.svg';
import LogoWhite from '@/assets/icons/logo_white.svg';
import MainTabStack from './BottomTabStack';
import DrawerContent from './DrawerContent';
import PrayerWallStack from './PrayerWallStack';
import Saved from '../screens/main/saved';
import { getHeight } from '@/utils/ResponsiveFun';

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
      return 'Profile';
    default:
      return '';
  }
}

function DrawerNav() {
  const authState = useSelector((state: RootState) => state.auth);
  const dimensions = useWindowDimensions();

  const { dark, colors } = useTheme();

  const requestNotificationPermission = async () => {
    await messaging().requestPermission();
  };

  const requestlocationPermison = async () => {
    try {
      if (Platform.OS === 'ios') {
        Geolocation.requestAuthorization();

        // if (permissions == 'granted') {
        //   Geolocation.getCurrentPosition((info) => {
        //     getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
        //   });
        // }
      } else {
        // if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        //   //To Check, If Permission is granted
        //   Geolocation.getCurrentPosition((info) => {
        //     getcurrentLocation(info.coords?.longitude, info.coords?.latitude);
        //   });
        // }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    requestlocationPermison();
  }, []);

  if (authState.getProfileData?.isProfileCompleted) {
    let drawerType: 'front' | 'back' | 'slide' | 'permanent' = 'front';

    if (dimensions.width >= 768) {
      drawerType = 'permanent';
    } else if (Platform.OS === 'ios') {
      drawerType = 'slide';
    }
    return (
      <DrawerStack.Navigator
        backBehavior="history"
        screenOptions={() => {
          return {
            drawerType,
            headerShown: false,
            headerTintColor: dark ? colors.text : Colors.primary.brand,

            drawerActiveBackgroundColor: Colors.neutral[600],
            drawerActiveTintColor: dark ? Colors.primarySapphire[500] : Colors.primary.brand,

            // headerLeft: (props) => {
            //   const isDrawerOpen = getDrawerStatusFromState(navigation.getState()) === 'open';

            //   if (navigation.canGoBack() && !isDrawerOpen) {
            //     return (
            //       <HeaderBackButton labelVisible={false} onPress={() => navigation.goBack()} />
            //     );
            //   }
            //   return <DrawerToggleButton {...props} />;
            // },
          };
        }}
        drawerContent={(props) => <DrawerContent {...props} />}
      >
        <DrawerStack.Screen
          name="Main"
          component={MainTabStack}
          options={() => {
            return {
              title: 'Home',
              drawerIcon: ({ color, size }) => {
                return <Home3 size={size} color={color} />;
              },
            };
          }}
        />

        <DrawerStack.Screen
          name="Saved"
          component={Saved}
          options={{
            headerShown: true,
            title: 'Saved Posts',
            drawerIcon: ({ color, size }) => {
              return <Feather name="bookmark" size={size} color={color} />;
            },
          }}
        />

        <DrawerStack.Screen
          name="Connections"
          component={Connections}
          options={({ navigation }) => {
            return {
              headerShown: true,
              title: 'My Connections',
              drawerIcon: ({ color, size }) => {
                return <Profile2User size={size} color={color} />;
              },
            };
          }}
        />

        <DrawerStack.Screen
          name="PrayerWall"
          component={PrayerWallStack}
          options={({ navigation }) => {
            return {
              title: 'Prayer Wall',

              drawerIcon: ({ color, size }) => {
                return <HandsPraying size={size} color={color} />;
              },
            };
          }}
        />

        <DrawerStack.Screen
          name="Settings"
          component={SettingsStack}
          options={({ navigation }) => {
            return {
              drawerItemStyle: { height: 0 },
            };
          }}
        />

        {/* <DrawerStack.Screen name="Help" component={Help} /> */}
      </DrawerStack.Navigator>
    );
  }

  return <OnboardingStack />;
}

export default DrawerNav;
