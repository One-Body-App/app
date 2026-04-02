import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import Explore from '../screens/explore';

import UserProfile from '../screens/main/userProfile';
import { ExploreStackParamsList } from './types';
import { STANDARD_STACK_ANIMATION_OPTIONS } from './motionPolicy';

const Stack = createNativeStackNavigator<ExploreStackParamsList>();

function ExploreStack() {
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        ...STANDARD_STACK_ANIMATION_OPTIONS,
        statusBarStyle: dark ? 'light' : 'dark',
        ...(Platform.OS === 'android'
          ? {
              statusBarTranslucent: true,
              statusBarColor: 'transparent',
            }
          : {}),
      }}
    >
      <Stack.Screen
        name="Explore"
        component={Explore}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{
          headerBackTitleVisible: false,
          headerTransparent: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          title: '',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack.Navigator>
  );
}

export default ExploreStack;
