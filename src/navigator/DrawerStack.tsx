/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { createDrawerNavigator, getDrawerStatusFromState } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { Platform, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Profile2User } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';
import Feather from '@react-native-vector-icons/feather';

import { HeaderBackButton } from '@react-navigation/elements';
import { MainDrawerParamsList } from './types';
import OnboardingStack from './OnboardingStack';
import { RootState } from '../redux/reducers/rootReducer';
import { Colors } from '../styles';

import Prayers from '@/assets/svg/prayers.svg';
import ZoeIcon from '@/assets/svg/zoeicon.svg';
import Connections from '@/src/screens/main/connections';
import SettingsStack from './SettingsStack';
import MainTabStack from './BottomTabStack';
import DrawerContent from './DrawerContent';
import PrayerWallStack from './PrayerWallStack';
import Saved from '../screens/main/saved';
import ZoeChat from '../screens/main/zoeChat';
import mainPageOptions from './global';
import Home2Icon from '@/assets/icons/home2.svg';
import { getDrawerNavMode } from '@/src/utils/authFlow';

const DrawerStack = createDrawerNavigator<MainDrawerParamsList>();

function DrawerPlaceholderScreen() {
  const { colors } = useTheme();

  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

function DrawerNav() {
  const authState = useSelector((state: RootState) => state.auth);
  const dimensions = useWindowDimensions();

  const { dark, colors } = useTheme();
  const drawerNavMode = getDrawerNavMode(authState);

  if (drawerNavMode === 'main') {
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
            swipeEnabled: false,
            headerShown: false,
            headerTintColor: dark ? colors.text : Colors.primary.brand,

            drawerActiveBackgroundColor: Colors.neutral[600],
            drawerActiveTintColor: dark ? '#ffffff' : '#126b87',
            drawerInactiveTintColor: dark ? colors.text : '#032f3c',

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
                return <Home2Icon width={size} height={size} color={color} />;
              },
            };
          }}
        />

        <DrawerStack.Screen
          name="ZoeAI"
          component={ZoeChat}
          options={{
            headerShown: false,
            title: 'ZoeAI',
            drawerLabel: 'ZoeAI',
            drawerIcon: ({ color, size }) => <ZoeIcon width={size} height={size} color={color} />,
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
              headerLeft: () => (
                <TouchableOpacity
                  style={{ marginHorizontal: 11, padding: 4 }}
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather
                    name="chevron-left"
                    size={28}
                    color={dark ? colors.text : Colors.primary.brand}
                  />
                </TouchableOpacity>
              ),
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
              drawerItemStyle: { display: 'none', height: 0 },
              drawerIcon: ({ color, size }) => {
                return <Prayers width={size} height={size} color={color} />;
              },
            };
          }}
        />

        <DrawerStack.Screen
          name="Settings"
          component={SettingsStack}
          options={() => {
            return {
              drawerItemStyle: { display: 'none', height: 0 },
            };
          }}
        />

        {/* <DrawerStack.Screen name="Help" component={Help} /> */}
      </DrawerStack.Navigator>
    );
  }

  if (drawerNavMode === 'onboarding') {
    return <OnboardingStack />;
  }

  let drawerType: 'front' | 'back' | 'slide' | 'permanent' = 'front';

  if (dimensions.width >= 768) {
    drawerType = 'permanent';
  } else if (Platform.OS === 'ios') {
    drawerType = 'slide';
  }

  return (
    <DrawerStack.Navigator
      backBehavior="history"
      screenOptions={{
        drawerType,
        swipeEnabled: false,
        headerShown: false,
      }}
      drawerContent={() => <DrawerPlaceholderScreen />}
    >
      <DrawerStack.Screen
        name="Main"
        component={DrawerPlaceholderScreen}
        options={{
          title: 'Home',
          drawerItemStyle: { display: 'none', height: 0 },
        }}
      />
      <DrawerStack.Screen
        name="ZoeAI"
        component={DrawerPlaceholderScreen}
        options={{
          drawerItemStyle: { display: 'none', height: 0 },
        }}
      />
      <DrawerStack.Screen
        name="Saved"
        component={DrawerPlaceholderScreen}
        options={{
          drawerItemStyle: { display: 'none', height: 0 },
        }}
      />
      <DrawerStack.Screen
        name="Connections"
        component={DrawerPlaceholderScreen}
        options={{
          drawerItemStyle: { display: 'none', height: 0 },
        }}
      />
      <DrawerStack.Screen
        name="PrayerWall"
        component={DrawerPlaceholderScreen}
        options={{
          drawerItemStyle: { display: 'none', height: 0 },
        }}
      />
      <DrawerStack.Screen
        name="Settings"
        component={DrawerPlaceholderScreen}
        options={{
          drawerItemStyle: { display: 'none', height: 0 },
        }}
      />
    </DrawerStack.Navigator>
  );
}

export default DrawerNav;
