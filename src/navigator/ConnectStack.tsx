import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from '@react-navigation/native';
import { Colors } from '../styles';
import { ConnectStackParamsList } from './types';
import ListViewScreen from '../screens/connectportal/listview';
import MapViewScreen from '../screens/connectportal/mapview';
import UserProfile from '../screens/main/userProfile';

const Stack = createNativeStackNavigator<ConnectStackParamsList>();

function ConnectStack() {
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        animation: 'slide_from_right',
        animationDuration: 750,
        statusBarStyle: dark ? 'light' : 'dark',
        headerTransparent: true,
        headerBlurEffect: dark ? 'systemMaterialDark' : 'systemMaterialLight',
      }}
    >
      <Stack.Screen
        name="ConnectPortal"
        component={ListViewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ConnectMap"
        component={MapViewScreen}
        options={{
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

export default ConnectStack;
