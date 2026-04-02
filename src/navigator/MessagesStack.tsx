import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import { MessagesStackParamsList } from './types';
import ChatListScreen from '../screens/Messages/chat';
import ChatDetailScreen from '../screens/Messages/chatdetails';
import NewMessageScreen from '../screens/Messages/newmessage';
import CreateGroupScreen from '../screens/Messages/creategroup';

const Stack = createNativeStackNavigator<MessagesStackParamsList>();

function MessagesStack() {
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: 'slide_from_right',
        statusBarStyle: dark ? 'light' : 'dark',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        ...(Platform.OS === 'android'
          ? {
              statusBarTranslucent: true,
              statusBarColor: 'transparent',
            }
          : {}),
      }}
    >
      <Stack.Screen
        name="MessagesList"
        component={ChatListScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NewMessage"
        component={NewMessageScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default MessagesStack;
