import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import Home from '../screens/main/home';
import UserProfile from '../screens/main/userProfile';

const Stack = createNativeStackNavigator();
const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
    </Stack.Navigator>
  );
};

export default HomeStack;
