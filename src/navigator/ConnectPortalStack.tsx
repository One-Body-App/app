import React from 'react';
import { View, TouchableOpacity } from 'react-native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Notification } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';
import ConnectPortalHome from '../screens/ConnectPortalHome/ConnectPortalHome';
import People from '../components/ConnectPortal/Places/People';
import Go from '../components/ConnectPortal/Go';
import Serve from '../components/ConnectPortal/Serve/Serve';
import FilterScreen from '../components/ConnectPortal/Places/FilterScreen';
import FilterServeScreen from '../components/ConnectPortal/Serve/FilterServeScreen';
import HomeScreenServe from '../components/ConnectPortal/Serve/HomeScreenServe';
import HomeScreenPlace from '../components/ConnectPortal/Places/HomeScreenPlace';
import mainPageOptions from './global';
import { Colors } from '../styles';
import { ConnectPortalStackParamsList } from './types';

const Stack = createNativeStackNavigator<ConnectPortalStackParamsList>();

function ConnectPortalStack() {
  const { dark, colors } = useTheme();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ConnectPortalHome"
        options={({ navigation }) => {
          return {
            ...mainPageOptions(
              navigation,
              dark ? colors.text : Colors.primary.brand,
              'Connect Portal'
            ),
            title: 'Connect Portal',
            headerTitleAlign: 'center',
          };
        }}
        component={ConnectPortalHome}
      />

      <Stack.Screen name="People" component={People} />

      <Stack.Screen name="FilterScreen" component={FilterScreen} />

      <Stack.Screen name="Go" component={Go} />

      <Stack.Screen name="Serve" component={Serve} />

      <Stack.Screen name="FilterServeScreen" component={FilterServeScreen} />
    </Stack.Navigator>
  );
}

export default ConnectPortalStack;
