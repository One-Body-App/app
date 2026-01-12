import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform } from 'react-native';

import { OnboardingStackParamList } from './types';

import OnboardingIntro from '../screens/onboardingSteps/onboardingIntro';
import OnboardingDateOfBirth from '../screens/onboardingSteps/onboardingDateOfBirth';
import OnboardingInfluencers from '../screens/onboardingSteps/onboardingInfluencers';
import OnboardingInterests from '../screens/onboardingSteps/onboardingInterests';
import OnboardingLocation from '../screens/onboardingSteps/onboardingLocation';
import OnboardingOrganizationContact from '../screens/onboardingSteps/onboardingOrganizationContact';
import OnboardingOrganizationInfo from '../screens/onboardingSteps/onboardingOrganizationInfo';
import OnboardingOrganizationType from '../screens/onboardingSteps/onboardingOrganizationType';
import { headerOptions } from './global';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

function OnboardingStack() {
  return (
    <Stack.Navigator initialRouteName="OnboardingIntro">
      <Stack.Screen
        name="OnboardingIntro"
        component={OnboardingIntro}
        options={{
          ...headerOptions,
          headerShown: Platform.OS !== 'android',
        }}
      />
      <Stack.Screen
        name="OnboardingDateOfBirth"
        component={OnboardingDateOfBirth}
        options={{
          ...(Platform.OS === 'ios' ? headerOptions : {}),
          ...(Platform.OS === 'android' && { headerShown: false }),
        }}
      />
      <Stack.Screen
        name="OnboardingInfluencers"
        component={OnboardingInfluencers}
        options={headerOptions}
      />
      <Stack.Screen
        name="OnboardingInterests"
        component={OnboardingInterests}
        options={headerOptions}
      />
      <Stack.Screen
        name="OnboardingLocation"
        component={OnboardingLocation}
        options={headerOptions}
      />
      <Stack.Screen
        name="OnboardingOrganizationContact"
        component={OnboardingOrganizationContact}
        options={headerOptions}
      />
      <Stack.Screen
        name="OnboardingOrganizationInfo"
        component={OnboardingOrganizationInfo}
        options={headerOptions}
      />
      <Stack.Screen
        name="OnboardingOrganizationType"
        component={OnboardingOrganizationType}
        options={headerOptions}
      />
    </Stack.Navigator>
  );
}

export default OnboardingStack;
