import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import EditProfile from '../screens/main/EditProfile';

import MyProfile from '../screens/main/MyProfile';
import { MyProfileStackParamsList } from './types';

const Stack = createNativeStackNavigator<MyProfileStackParamsList>();

const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyProfile" component={MyProfile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
    </Stack.Navigator>
  );
};

export default ProfileStack;
