import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ConnectPortalHome from '../screens/ConnectPortalHome/ConnectPortalHome';
import People from '../components/ConnectPortal/Places/People';
import Go from '../components/ConnectPortal/Go';
import Serve from '../components/ConnectPortal/Serve/Serve';
import FilterScreen from '../components/ConnectPortal/Places/FilterScreen';
import FilterServeScreen from '../components/ConnectPortal/Serve/FilterServeScreen';

const Stack = createStackNavigator();

function ConnectPortalStack() {
  return (
    <Stack.Navigator initialRouteName="ConnectPortalHome">
      <Stack.Screen name="ConnectPortalHome" component={ConnectPortalHome} />

      <Stack.Screen name="People" component={People} />

      <Stack.Screen name="FilterScreen" component={FilterScreen} />

      <Stack.Screen name="Go" component={Go} />

      <Stack.Screen name="Serve" component={Serve} />

      <Stack.Screen name="FilterServeScreen" component={FilterServeScreen} />
    </Stack.Navigator>
  );
}

export default ConnectPortalStack;
