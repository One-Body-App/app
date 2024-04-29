import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useTheme } from '@react-navigation/native';
import { SearchStackParamsList } from './types';
import Search from '../screens/main/search';
import UserProfile from '../screens/main/userProfile';
import mainPageOptions from './global';
import { Colors } from '../styles';

const Stack = createNativeStackNavigator<SearchStackParamsList>();

function SearchStack() {
  const { dark, colors } = useTheme();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Search"
        component={Search}
        options={({ navigation }) =>
          mainPageOptions(navigation, dark ? colors.text : Colors.primary.brand, 'Search')
        }
      />
      <Stack.Screen
        name="UserProfile"
        options={{
          headerBackTitleVisible: false,
          title: 'Profile ',
        }}
        component={UserProfile}
      />
    </Stack.Navigator>
  );
}

export default SearchStack;
