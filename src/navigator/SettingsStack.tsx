import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React from 'react';

import { SettingsStackParamsList } from './types';
import RemoveAccount from '../screens/main/RemoveAccount';
import NotificationSettings from '../screens/main/notificationSettings';
import InfluencerSettings from '../screens/main/influencerSettings';
import Settings from '../screens/main/settings';
import ConfirmLogin from '../screens/login/ConfirmLogin';
import EmailChange from '../screens/main/emailChange';
import PasswordChange from '../screens/main/passwordChange';
import InfluencerStepOne from '../screens/InfluencerApplication/InfluencerStepOne';
import InfluencerStepTwo from '../screens/InfluencerApplication/InfluencerStepTwo';
import InfluencerStepThree from '../screens/InfluencerApplication/InfluencerStepThree';
import InfluencerStepFour from '../screens/InfluencerApplication/InfluencerStepFour';
import NewPassword from '../screens/newPassword/NewPassword';
import RemoveAccountConfirmation from '../screens/main/RemoveAccountConfirmation';
import { Colors } from '../styles';
import { useTheme } from '@react-navigation/native';

const Stack = createNativeStackNavigator<SettingsStackParamsList>();

const SettingsStack = () => {
  const headerOptions: NativeStackNavigationOptions = {
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  const { colors } = useTheme();

  return (
    <Stack.Navigator initialRouteName="SettingsMain">
      <Stack.Screen
        name="SettingsMain"
        component={Settings}
        options={{ headerShown: false, contentStyle: { backgroundColor: Colors.neutral[700] } }}
      />
      {/* <Stack.Screen
        name="ConfirmLogin"
        component={ConfirmLogin}
        options={{ ...headerOptions, presentation: 'modal' }}
      /> */}

      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
        options={headerOptions}
      />
      <Stack.Screen
        name="InfluencerSettings"
        component={InfluencerSettings}
        options={headerOptions}
      />
      <Stack.Screen
        name="EmailChange"
        component={EmailChange}
        options={{
          ...headerOptions,
          title: 'Update Email',
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="PasswordChange"
        component={PasswordChange}
        options={{
          ...headerOptions,
          title: 'Update Password',
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="InfluencerStepOne"
        component={InfluencerStepOne}
        options={headerOptions}
      />
      <Stack.Screen
        name="InfluencerStepTwo"
        component={InfluencerStepTwo}
        options={headerOptions}
      />
      <Stack.Screen
        name="InfluencerStepThree"
        component={InfluencerStepThree}
        options={headerOptions}
      />
      <Stack.Screen
        name="InfluencerStepFour"
        component={InfluencerStepFour}
        options={headerOptions}
      />
      <Stack.Screen name="NewPassword" component={NewPassword} options={headerOptions} />
      <Stack.Screen
        name="RemoveAccount"
        component={RemoveAccount}
        options={{
          ...headerOptions,
          title: 'Delete Account',
          headerStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack.Navigator>
  );
};

export default SettingsStack;
