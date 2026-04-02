import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from '@react-navigation/native';
import EditProfile from '../screens/main/editProfile';

import MyProfile from '../screens/main/myProfile';
import { MyProfileStackParamsList } from './types';
import { Colors } from '../styles';
import InviteFriend from '../screens/main/inviteFriend';
import { STANDARD_STACK_ANIMATION_OPTIONS } from './motionPolicy';

const Stack = createNativeStackNavigator<MyProfileStackParamsList>();

function ProfileStack() {
  const { dark, colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        ...STANDARD_STACK_ANIMATION_OPTIONS,
        statusBarStyle: dark ? 'light' : 'dark',
        headerTransparent: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="MyProfile" component={MyProfile} options={{ headerShown: false }} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={() => {
          return {
            // headerShown: false,
            headerBackTitleVisible: false,
            headerStyle: { backgroundColor: colors.background },
            title: 'Edit Profile',
            contentStyle: { backgroundColor: Colors.neutral[700] },
          };
        }}
      />
      <Stack.Screen
        name="InviteFriends"
        component={InviteFriend}
        options={() => {
          return {
            headerBackTitleVisible: false,
            headerShown: true,
            headerTransparent: true,
            headerTintColor: '#fff',
            title: 'Invite',
          };
        }}
      />
    </Stack.Navigator>
  );
}

export default ProfileStack;
