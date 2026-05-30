import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { OnboardingStackParamList } from './types';

import OnboardingIntro from '../screens/onboardingSteps/onboardingIntro';
import OnboardingDateOfBirth from '../screens/onboardingSteps/onboardingDateOfBirth';
import OnboardingInfluencers from '../screens/onboardingSteps/onboardingInfluencers';
import OnboardingInterests from '../screens/onboardingSteps/onboardingInterests';
import OnboardingLocation from '../screens/onboardingSteps/onboardingLocation';
import OnboardingOrganizationInfo from '../screens/onboardingSteps/onboardingOrganizationInfo';
import OnboardingOrganizationType from '../screens/onboardingSteps/onboardingOrganizationType';
import OnboardingOrganizationSubtype from '../screens/onboardingSteps/onboardingOrganizationSubtype';
import { headerOptions } from './global';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

function OnboardingStack() {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="OnboardingIntro"
      screenOptions={{
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        statusBarStyle: dark ? 'light' : 'dark',
        ...(Platform.OS === 'android'
          ? {
              statusBarHidden: false,
              statusBarColor: colors.background,
              statusBarTranslucent: false,
            }
          : {}),
        headerShown: false,
        headerTransparent: true,
        headerBlurEffect: dark ? 'systemMaterialDark' : 'systemMaterialLight',
      }}
    >
      <Stack.Screen
        name="OnboardingIntro"
        component={OnboardingIntro}
        options={{
          ...(Platform.OS === 'ios' ? headerOptions : {}),
          headerShown: false,
          ...(Platform.OS === 'android'
            ? {
                statusBarStyle: dark ? 'light' : 'dark',
                statusBarColor: dark ? '#0D0D0D' : '#E6EAEC',
                statusBarTranslucent: false,
              }
            : {}),
        }}
      />
      <Stack.Screen
        name="OnboardingDateOfBirth"
        component={OnboardingDateOfBirth}
        options={{
          ...(Platform.OS === 'ios' ? headerOptions : {}),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OnboardingInfluencers"
        component={OnboardingInfluencers}
        options={{
          ...(Platform.OS === 'ios' ? headerOptions : {}),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OnboardingInterests"
        component={OnboardingInterests}
        options={{
          ...(Platform.OS === 'ios' ? headerOptions : {}),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OnboardingLocation"
        component={OnboardingLocation}
        options={{
          ...(Platform.OS === 'ios' ? headerOptions : {}),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OnboardingOrganizationInfo"
        component={OnboardingOrganizationInfo}
        options={{
          ...(Platform.OS === 'ios' ? headerOptions : {}),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OnboardingOrganizationType"
        component={OnboardingOrganizationType}
        options={{
          ...(Platform.OS === 'ios' ? headerOptions : {}),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OnboardingOrganizationSubtype"
        component={OnboardingOrganizationSubtype}
        options={{
          ...(Platform.OS === 'ios' ? headerOptions : {}),
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default OnboardingStack;
