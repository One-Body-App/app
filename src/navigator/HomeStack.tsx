/* eslint-disable react/no-unstable-nested-components */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useTheme } from '@react-navigation/native';
import { TouchableOpacity, View } from 'react-native';
import { Notification } from 'iconsax-react-native';
import Home, { FeedTypes } from '../screens/home';
import UserProfile from '../screens/main/userProfile';
import { HomeStackParamsList } from './types';
import Notifications from '../screens/notifications';
import { Colors } from '../styles';

import Logo from '@/assets/icons/logo.svg';
import LogoWhite from '@/assets/icons/logo_white.svg';
import mainPageOptions from './global';
import Watch from '../screens/home/watch';

const Stack = createNativeStackNavigator<HomeStackParamsList>();
function HomeStack() {
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={() => {
        return {
          // drawerType,
          headerTintColor: dark ? colors.text : Colors.primary.brand,

          drawerActiveBackgroundColor: Colors.neutral[600],
          drawerActiveTintColor: dark ? Colors.primarySapphire[500] : Colors.primary.brand,
        };
      }}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        initialParams={{
          selectedTab: FeedTypes.Connected,
        }}
        options={({ navigation }) => {
          return {
            ...mainPageOptions(navigation, dark ? colors.text : Colors.primary.brand, 'Home'),
            title: 'Home',
            headerTitleAlign: 'center',
            headerTitle: () => {
              return (
                <View style={{ height: 28, width: 28 }}>
                  {dark ? (
                    <LogoWhite style={{ height: 28, width: 28 }} />
                  ) : (
                    <Logo style={{ height: 28, width: 28 }} />
                  )}
                </View>
              );
            },
            headerRight: () => (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('MainRoot', {
                      screen: 'Main',
                      params: { screen: 'HomeTab', params: { screen: 'Notifications' } },
                    });
                  }}
                >
                  <Notification
                    style={{ height: 24, width: 24 }}
                    color={Colors.primary.brand}
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
            ),
          };
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="WatchPortal"
        component={Watch}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: colors.background },
          title: '',
          contentStyle: { backgroundColor: Colors.neutral[700] },
        }}
      />
    </Stack.Navigator>
  );
}

export default HomeStack;
