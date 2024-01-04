import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import Home from '../screens/home';
import UserProfile from '../screens/Main/UserProfile';
import { HomeStackParamsList } from './types';
import Notifications from '../screens/notifications';
import { useTheme } from '@react-navigation/native';
import { Colors } from '../styles';

const Stack = createNativeStackNavigator<HomeStackParamsList>();
const HomeStack = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ presentation: 'modal' }}
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
};

export default HomeStack;
