import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from '@react-navigation/native';
import EditProfile from '../screens/main/editProfile';

import MyProfile from '../screens/main/myProfile';
import { MyProfileStackParamsList } from './types';
import { Colors } from '../styles';
import InviteFriend from '../screens/main/inviteFriend';
import mainPageOptions from './global';

const Stack = createNativeStackNavigator<MyProfileStackParamsList>();

function ProfileStack() {
  const { dark, colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        statusBarStyle: dark ? 'light' : 'dark',
        headerTransparent: true,
        headerBlurEffect: dark ? 'systemMaterialDark' : 'systemMaterialLight',
      }}
    >
      <Stack.Screen
        name="MyProfile"
        component={MyProfile}
        options={({ navigation }) =>
          mainPageOptions(navigation, dark ? colors.text : Colors.primary.brand, 'Profile')
        }
      />
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
