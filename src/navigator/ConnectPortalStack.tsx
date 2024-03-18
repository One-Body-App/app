import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ConnectPortalHome from '../screens/ConnectPortalHome/ConnectPortalHome';
import People from '../components/ConnectPortal/People';

const Stack = createStackNavigator();

function ConnectPortalStack() {
  return (
    <Stack.Navigator initialRouteName="ConnectPortalHome" headerMode="none">
      <Stack.Screen name="ConnectPortalHome" component={ConnectPortalHome} />

      <Stack.Screen name="People" component={People} />
    </Stack.Navigator>
  );
}

export default ConnectPortalStack;
