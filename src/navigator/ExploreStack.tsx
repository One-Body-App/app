import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Explore from '../screens/explore';

import UserProfile from '../screens/main/userProfile';
import { ExploreStackParamsList } from './types';

const Stack = createNativeStackNavigator<ExploreStackParamsList>();

const ExploreStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Explore" component={Explore} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
    </Stack.Navigator>
  );
};

export default ExploreStack;
