import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useTheme } from '@react-navigation/native';
import { SearchStackParamsList } from './types';
import Search from '../screens/main/search';
import UserProfile from '../screens/main/userProfile';
import mainPageOptions from './global';

const Stack = createNativeStackNavigator<SearchStackParamsList>();

function SearchStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Search"
        component={Search}
        options={({ navigation }) => mainPageOptions(navigation, colors.text, 'Search')}
      />
      <Stack.Screen name="UserProfile" component={UserProfile} />
    </Stack.Navigator>
  );
}

export default SearchStack;
