import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Explore from '../screens/Main/Explore';

import UserProfile from '../screens/Main/UserProfile';

const Stack = createNativeStackNavigator();
const ExploreStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Explore} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
    </Stack.Navigator>
  );
};

export default ExploreStack;
