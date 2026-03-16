import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Colors } from '../styles';
import { ConnectStackParamsList } from './types';
import ListViewScreen from '../screens/connectportal/listview';
import MapViewScreen from '../screens/connectportal/mapview';
import UserProfile from '../screens/main/userProfile';
import ConnectPortalPlaceholderScreen from '../screens/connectportal/placeholder';
import GoLandingScreen from '../screens/connectportal/go/landing';
import EventDashboardScreen from '../screens/connectportal/go/eventdash';
import MyEventsScreen from '../screens/connectportal/go/myevents';
import EventViewScreen from '../screens/connectportal/go/eventview';
import EventAnalyticsScreen from '../screens/connectportal/go/eventanalytics';
import BasicInfoScreen from '../screens/connectportal/go/createflow/create.go.step1';
import DateLocationScreen from '../screens/connectportal/go/createflow/create.go.step2';
import DetailsAndCapacityScreen from '../screens/connectportal/go/createflow/create.go.step3';
import TicketingTypeScreen from '../screens/connectportal/go/createflow/create.go.step4';
import ConfigureTicketsFreeScreen from '../screens/connectportal/go/createflow/create.go.step5';
import PayoutMethodScreen from '../screens/connectportal/go/createflow/create.go.step6payout';
import ReviewAndConfirmScreen from '../screens/connectportal/go/createflow/create.go.step6';
import EventSuccessScreen from '../screens/connectportal/go/createflow/create.go.step7';
import { ConnectPortalProvider } from '../services/connectPortal/provider';

const Stack = createNativeStackNavigator<ConnectStackParamsList>();

function ConnectStack() {
  const { dark, colors } = useTheme();

  return (
    <ConnectPortalProvider>
      <Stack.Navigator
        initialRouteName="ConnectMap"
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
          name="ConnectPortal"
          component={ListViewScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ConnectMap"
          component={MapViewScreen}
          options={{
            headerShown: false,
            statusBarStyle: dark ? 'light' : 'dark',
            statusBarColor: Platform.OS === 'android' ? 'transparent' : undefined,
            statusBarTranslucent: true,
            contentStyle:
              Platform.OS === 'android' ? { backgroundColor: 'transparent' } : undefined,
          }}
        />
        <Stack.Screen
          name="ConnectGoLanding"
          component={GoLandingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoEventDash"
          component={EventDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoMyEvents"
          component={MyEventsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoEventView"
          component={EventViewScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoEventAnalytics"
          component={EventAnalyticsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoCreateStep1"
          component={BasicInfoScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoCreateStep2"
          component={DateLocationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoCreateStep3"
          component={DetailsAndCapacityScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoCreateStep4"
          component={TicketingTypeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoCreateStep5"
          component={ConfigureTicketsFreeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoCreateStep6Payout"
          component={PayoutMethodScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoCreateStep6Review"
          component={ReviewAndConfirmScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectGoCreateStep7Success"
          component={EventSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectPlacesHome"
          component={ConnectPortalPlaceholderScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConnectServeHome"
          component={ConnectPortalPlaceholderScreen}
          options={{ headerShown: false }}
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
    </ConnectPortalProvider>
  );
}

export default ConnectStack;
