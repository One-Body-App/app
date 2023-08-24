import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { SearchStackParamsList } from './types';
import Search from '../screens/main/search';

const Stack = createNativeStackNavigator<SearchStackParamsList>();

const SearchStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Search" component={Search} />
    </Stack.Navigator>
  );
};

export default SearchStack;
