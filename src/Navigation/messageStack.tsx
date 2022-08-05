import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Message from '../screens/Main/Message';
import ConversationScreen from '../screens/Main/Message/conversation';

const stack = createNativeStackNavigator();
const MessageScreens = () => {
  return (
    <stack.Navigator screenOptions={{headerShown: false}}>
      <stack.Screen name="message" component={Message} />
      <stack.Screen name="conversation" component={ConversationScreen} />
    </stack.Navigator>
  );
};
export default MessageScreens;
