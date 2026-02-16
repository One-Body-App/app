/* eslint-disable react/no-unstable-nested-components */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useTheme } from '@react-navigation/native';
import { Platform, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Home, { FeedTypes } from '../screens/home';
import UserProfile from '../screens/main/userProfile';
import { HomeStackParamsList } from './types';
import Notifications from '../screens/notifications';
import { Colors } from '../styles';

import Watch from '../screens/home/watch';
import { fontSize } from '../styles/typography';

const Stack = createNativeStackNavigator<HomeStackParamsList>();
function HomeStack() {
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={() => {
        return {
          // drawerType,
          gestureEnabled: false,
          fullScreenGestureEnabled: false,
          statusBarStyle: dark ? 'light' : 'dark',
          statusBarColor: Platform.OS === 'android' && dark ? '#0D0D0D' : 'transparent',
          statusBarTranslucent: true,
          headerTintColor: dark ? colors.text : Colors.primary.brand,
          headerTransparent: true,
          headerBlurEffect: dark ? 'systemMaterialDark' : 'systemMaterialLight',

          drawerActiveBackgroundColor: Colors.neutral[600],
          drawerActiveTintColor: dark ? Colors.primarySapphire[500] : Colors.primary.brand,
        };
      }}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        initialParams={{
          selectedTab: FeedTypes.ForYou,
        }}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{
          presentation: Platform.OS === 'ios' ? 'fullScreenModal' : 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="WatchPortal"
        component={Watch}
        options={{
          presentation: 'card',
          animation: 'none',
          headerShown: true,
          headerTintColor: '#fff',
          headerTransparent: true,

          headerBackTitleVisible: false,
          title: 'Watch',
          headerTitle: ({ children, tintColor }) => (
            <Text
              numberOfLines={1}
              style={{
                fontWeight: 'bold',
                color: tintColor ?? 'white',
                fontSize: fontSize.x4.fontSize,
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowRadius: 1,
                textShadowOffset: {
                  width: 1,
                  height: 1,
                },
              }}
            >
              {children}
            </Text>
          ),

          // headerStyle: {
          //   backgroundColor: 'rgba(0,0,0,0.06)',
          // },
          headerBackground: () => (
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0)']}
              locations={[0.8, 1]}
              style={[StyleSheet.absoluteFill, { flex: 1 }]}
            />
          ),
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
