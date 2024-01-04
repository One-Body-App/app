import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { SearchStackParamsList } from './types';
import Search from '../screens/Main/Search';
import UserProfile from '../screens/Main/UserProfile';

const Stack = createNativeStackNavigator<SearchStackParamsList>();

const SearchStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Search" component={Search} options={{ headerShown: false }} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
    </Stack.Navigator>
  );
};

export default SearchStack;
