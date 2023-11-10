import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React from 'react';

import { OnboardingStackParamList } from './types';

import OnboardingIntro from '../screens/onboardingSteps/onboardingIntro';
import OnboardingChurchAttend from '../screens/onboardingSteps/onboardingChurchAttend';
import OnboardingChurchType from '../screens/onboardingSteps/onboardingChurchType';
import OnboardingDateOfBirth from '../screens/onboardingSteps/onboardingDateOfBirth';
import OnboardingInfluencers from '../screens/onboardingSteps/onboardingInfluencers';
import OnboardingInterests from '../screens/onboardingSteps/onboardingInterests';
import OnboardingLocation from '../screens/onboardingSteps/onboardingLocation';
import OnboardingOrganizationContact from '../screens/onboardingSteps/onboardingOrganizationContact';
import OnboardingOrganizationInfo from '../screens/onboardingSteps/onboardingOrganizationInfo';
import OnboardingOrganizationType from '../screens/onboardingSteps/onboardingOrganizationType';

import { headerOptions } from './Main';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingStack = () => {
  return (
    <Stack.Navigator initialRouteName="OnboardingIntro">
      <Stack.Screen name="OnboardingIntro" component={OnboardingIntro} options={headerOptions} />
      <Stack.Screen
        name="OnboardingChurchAttend"
        component={OnboardingChurchAttend}
        options={headerOptions}
      />
      <Stack.Screen
        name="OnboardingChurchType"
        component={OnboardingChurchType}
        options={headerOptions}
      />
      <Stack.Screen
        name="OnboardingDateOfBirth"
        component={OnboardingDateOfBirth}
        options={headerOptions}
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
};

export default OnboardingStack;
