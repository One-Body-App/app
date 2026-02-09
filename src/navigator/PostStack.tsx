import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Explore from '../screens/explore';

import { ExploreStackParamsList } from './types';

const Stack = createNativeStackNavigator<ExploreStackParamsList>();

function PostStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
      }}
    >
      <Stack.Screen name="Explore" component={Explore} options={{ headerShown: false }} />
      {/* <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: colors.background },
          title: '',
          contentStyle: { backgroundColor: Colors.neutral[700] },
        }}
      /> */}
    </Stack.Navigator>
  );
}

export default PostStack;
