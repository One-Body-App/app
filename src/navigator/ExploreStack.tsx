import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTheme } from '@react-navigation/native';
import Explore from '../screens/explore';

import UserProfile from '../screens/main/userProfile';
import { ExploreStackParamsList } from './types';
import { Colors } from '../styles';
import mainPageOptions from './global';

const Stack = createNativeStackNavigator<ExploreStackParamsList>();

function ExploreStack() {
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        animation: 'slide_from_right',
        animationDuration: 750,
        statusBarStyle: dark ? 'light' : 'dark',
        headerTransparent: true,
        headerBlurEffect: dark ? 'systemMaterialDark' : 'systemMaterialLight',
      }}
    >
      <Stack.Screen
        name="Explore"
        component={Explore}
        options={({ navigation }) =>
          mainPageOptions(navigation, dark ? colors.text : Colors.primary.brand, 'Explore')
        }
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: colors.background },
          title: '',
          contentStyle: { backgroundColor: Colors.neutral[700] },
        }}
      />
    </Stack.Navigator>
  );
}

export default ExploreStack;
