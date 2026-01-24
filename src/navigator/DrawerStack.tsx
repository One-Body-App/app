/* eslint-disable react/no-unstable-nested-components */
import React, { useCallback, useEffect } from 'react';
import { createDrawerNavigator, getDrawerStatusFromState } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { Platform, View, useWindowDimensions } from 'react-native';
import { Home3, Profile2User } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';
import Feather from '@react-native-vector-icons/feather';
import { HandsPraying } from 'phosphor-react-native';

import { getMessaging, requestPermission } from '@react-native-firebase/messaging';
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
import mainPageOptions from './global';

const DrawerStack = createDrawerNavigator<MainDrawerParamsList>();

function DrawerNav() {
  const authState = useSelector((state: RootState) => state.auth);
  const dimensions = useWindowDimensions();
  const firebaseMessaging = getMessaging();

  const { dark, colors } = useTheme();

  const requestNotificationPermission = useCallback(async () => {
    await requestPermission(firebaseMessaging);
  }, [firebaseMessaging]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

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

            headerLeft: (props: { tintColor?: string }) => {
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

        <DrawerStack.Screen
          name="Connections"
          component={Connections}
          options={() => {
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
          options={() => {
            return {
              title: 'Prayer Wall',
              drawerItemStyle: { height: 0 },
              drawerIcon: ({ color, size }) => {
                return <HandsPraying size={size} color={color} />;
              },
            };
          }}
        />

        <DrawerStack.Screen
          name="Settings"
          component={SettingsStack}
          options={() => {
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
