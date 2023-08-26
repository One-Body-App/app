import React, { useEffect, useState } from 'react';
import ConfirmPassword from '../screens/Auth/ConfirmPassword';

import NewPassword from '../screens/Auth/NewPassword';
import PhoneValidateOtp from '../screens/main/PhoneValidateOtp';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PasswordResetOtp from '../screens/Auth/PasswordResetOtp';

import PrivacyPolicy from '../screens/main/PrivacyPolicy';
import EndUserAgrement from '../screens/main/EndUserAgrement';
import Login from '../screens/login';
import Signup from '../screens/signup';
import AccountType from '../screens/Auth/AccountType';
import SignupForm from '../screens/signup';
import ForgotPassword from '../screens/forgotPassword';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SignUp">
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={Signup} />
      <Stack.Screen name="AccountType" component={AccountType} />
      <Stack.Screen name="SignupForm" component={SignupForm} />
      <Stack.Screen name="forget" component={ForgotPassword} />

      <Stack.Screen name="PhoneValidateOtp" component={PhoneValidateOtp} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <Stack.Screen name="EndUserAgrement" component={EndUserAgrement} />
      <Stack.Screen name="confirm" component={ConfirmPassword} />
      <Stack.Screen name="newpassword" component={NewPassword} />
      <Stack.Screen name="PasswordResetOtp" component={PasswordResetOtp} />
    </Stack.Navigator>
  );
};

export default AuthStack;
function getcurrentLocation(longitude: number, latitude: number) {
  throw new Error('Function not implemented.');
}
