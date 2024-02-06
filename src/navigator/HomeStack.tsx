import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useTheme } from '@react-navigation/native';
import Home from '../screens/home';
import UserProfile from '../screens/main/userProfile';
import { HomeStackParamsList } from './types';
import Notifications from '../screens/notifications';
import { Colors } from '../styles';

const Stack = createNativeStackNavigator<HomeStackParamsList>();
function HomeStack() {
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
}

export default HomeStack;
