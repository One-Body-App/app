import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useTheme } from '@react-navigation/native';
import { Platform } from 'react-native';
import Home, { FeedTypes } from '../screens/home';
import UserProfile from '../screens/main/userProfile';
import { HomeStackParamsList } from './types';
import Notifications from '../screens/notifications';
import { Colors } from '../styles';
import { STANDARD_STACK_ANIMATION_OPTIONS } from './motionPolicy';

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
          ...STANDARD_STACK_ANIMATION_OPTIONS,
          statusBarStyle: dark ? 'light' : 'dark',
          statusBarColor: Platform.OS === 'android' && dark ? '#0D0D0D' : 'transparent',
          statusBarTranslucent: true,
          headerTintColor: dark ? colors.text : Colors.primary.brand,
          headerTransparent: false,
          headerShadowVisible: false,

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
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
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
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack.Navigator>
  );
}

export default HomeStack;
