/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect } from 'react';
import { createDrawerNavigator, getDrawerStatusFromState } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { GlobalSearch, Home3, Profile2User } from 'iconsax-react-native';
import { Platform, View, useWindowDimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';
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
import MainTabStack from './BottomTabStack';
import DrawerContent from './DrawerContent';
import PrayerWallStack from './PrayerWallStack';
import Saved from '../screens/main/saved';
import { getHeight } from '@/utils/ResponsiveFun';
import ConnectPortalHome from '../screens/ConnectPortalHome/ConnectPortalHome';
import ConnectPortalStack from './ConnectPortalStack';
import mainPageOptions from './global';

const DrawerStack = createDrawerNavigator<MainDrawerParamsList>();

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
        screenOptions={({ navigation }) => {
          return {
            drawerType,
            headerShown: false,
            headerTintColor: dark ? colors.text : Colors.primary.brand,

            drawerActiveBackgroundColor: Colors.neutral[600],
            drawerActiveTintColor: dark ? Colors.primarySapphire[500] : Colors.primary.brand,

            headerLeft: (props) => {
              const isDrawerOpen = getDrawerStatusFromState(navigation.getState()) === 'open';

              if (navigation.canGoBack() && !isDrawerOpen) {
                return (
                  <HeaderBackButton
                    style={{ marginHorizontal: 11 }}
                    labelVisible={false}
                    onPress={() => navigation.goBack()}
                  />
                );
              }
              const { headerLeft } = mainPageOptions(
                navigation,
                props.tintColor ?? colors.text,
                '',
                {
                  marginHorizontal: 11,
                }
              );

              if (headerLeft) {
                return headerLeft({ canGoBack: false });
              }

              return <View />;
            },
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

        {/* Boton connectPortal */}
        <DrawerStack.Screen
          name="Connect Portal"
          component={ConnectPortalStack}
          options={({ navigation }) => {
            return {
              title: 'Connect Portal',
              drawerIcon: ({ color, size }) => {
                return <GlobalSearch size={size} color={color} />;
              },
            };
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
