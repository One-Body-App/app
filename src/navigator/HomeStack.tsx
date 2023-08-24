import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import Home from '../screens/main/home';
import UserProfile from '../screens/main/userProfile';
import { HomeStackParamsList } from './types';
import Search from '../screens/main/search';

const Stack = createNativeStackNavigator<HomeStackParamsList>();
const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />

      {/* <Stack.Screen name="UserProfile" component={UserProfile} /> */}

      {/* <Stack.Screen name="LoadingPage" component={LoadingPage} /> */}

      {/* <Stack.Screen name="InfluencerSettings" component={InfluencerSettings} />
               <Stack.Screen name="NotificationSettings" component={NotificationSettings} />
               <Stack.Screen name="InfluencerStepOne" component={InfluencerStepOne} />
               <Stack.Screen name="InfluencerStepTwo" component={InfluencerStepTwo} />
               <Stack.Screen name="InfluencerStepThree" component={InfluencerStepThree} />
               <Stack.Screen name="InfluencerStepFour" component={InfluencerStepFour} /> */}
      {/* <Stack.Screen name="Prayer" component={Prayer} /> */}
      {/* <Stack.Screen name="Help" component={Help} /> */}
      {/* <Stack.Screen name="Faqs" component={Faqs} />
               <Stack.Screen name="RemoveAccount" component={RemoveAccount} />

               <Stack.Screen name="PasswordChange" component={PasswordChange} />
               <Stack.Screen name="EmailChange" component={EmailChange} />

               <Stack.Screen name="phoneValidate" component={PhoneValidate} />
               <Stack.Screen name="confirm" component={ConfirmPassword} />
               <Stack.Screen name="newpassword" component={NewPassword} />
               <Stack.Screen name="conversation" component={ConversationScreen} />

               <Stack.Screen
                 name="RemoveAccountConfirmation"
                 component={RemoveAccountConfirmation}
               /> */}
      {/* <Stack.Screen name="PhoneNumberUpdate" component={PhoneNumberUpdate} />
                 <Stack.Screen name="AddPhoneNumber" component={AddPhoneNumber} /> */}

      {/* <Stack.Screen name="UserProfile" component={UserProfile} /> */}

      {/*
               <Stack.Screen
                 name="BlogView"
                 component={BlogView}
                 options={{ presentation: 'modal' }}
               />
               <Stack.Screen
                 name="ConfirmLogin"
                 component={ConfirmLogin}
                 options={{ presentation: 'modal' }}
               /> */}
    </Stack.Navigator>
  );
};

export default HomeStack;
