import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Explore from '../screens/explore';

import UserProfile from '../screens/main/userProfile';
import { ExploreStackParamsList } from './types';
import { useTheme } from '@react-navigation/native';
import { Colors } from '../styles';

const Stack = createNativeStackNavigator<ExploreStackParamsList>();

const PostStack = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator>
      <Stack.Screen name="Explore" component={Explore} options={{ headerShown: false }} />
      {/*<Stack.Screen
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
};

export default PostStack;
