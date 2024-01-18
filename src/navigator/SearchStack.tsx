import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { SearchStackParamsList } from './types';
import Search from '../screens/main/search';
import UserProfile from '../screens/main/userProfile';

const Stack = createNativeStackNavigator<SearchStackParamsList>();

function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Search" component={Search} options={{ headerShown: false }} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
    </Stack.Navigator>
  );
}

export default SearchStack;
