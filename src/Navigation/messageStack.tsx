import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Message from '../screens/main/Message';
import ConversationScreen from '../screens/main/Message/conversation';
import UserProfile from '../screens/main/userProfile';

const stack = createNativeStackNavigator();
const MessageScreens = () => {
  return (
    <stack.Navigator screenOptions={{ headerShown: false }}>
      <stack.Screen name="message" component={Message} />
      <stack.Screen name="conversation" component={ConversationScreen} />
      <stack.Screen name="UserProfile" component={UserProfile} />
    </stack.Navigator>
  );
};
export default MessageScreens;
