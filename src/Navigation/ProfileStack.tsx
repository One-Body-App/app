import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import EditProfile from '../screens/main/EditProfile';

import MyProfile from '../screens/main/MyProfile';

const Stack = createNativeStackNavigator();
const ExploreStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={MyProfile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
    </Stack.Navigator>
  );
};

export default ExploreStack;
