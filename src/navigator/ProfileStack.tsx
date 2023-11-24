import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import EditProfile from '../screens/main/EditProfile';

import MyProfile from '../screens/main/myProfile';
import { MyProfileStackParamsList } from './types';
import { useTheme } from '@react-navigation/native';
import { Colors } from '../styles';
import InviteFriend from '../screens/main/InviteFriend';

const Stack = createNativeStackNavigator<MyProfileStackParamsList>();

const ProfileStack = () => {
  const { colors } = useTheme();
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyProfile" component={MyProfile} options={{ headerShown: false }} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: colors.background },
          title: 'Edit Profile',
          contentStyle: { backgroundColor: Colors.neutral[700] },
        }}
      />
      <Stack.Screen
        name="InviteFriends"
        component={InviteFriend}
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTintColor: '#fff',
          title: 'Invite',
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
