import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

import { useTheme } from '@react-navigation/native';
import { SettingsStackParamsList } from './types';
import RemoveAccount from '../screens/main/RemoveAccount';
import NotificationSettings from '../screens/main/notificationSettings';
import InfluencerSettings from '../screens/main/influencerSettings';
import Settings from '../screens/main/settings';
import EmailChange from '../screens/main/emailChange';
import PasswordChange from '../screens/main/passwordChange';
import InfluencerStepOne from '../screens/influencerApplication/InfluencerStepOne';

import InfluencerStepThree from '../screens/influencerApplication/InfluencerStepThree';
import InfluencerStepFour from '../screens/influencerApplication/InfluencerStepFour';
import CreatorReview from '../screens/influencerApplication/CreatorStepFive/CreatorReview';
import CreatorSubmitSuccess from '../screens/influencerApplication/SuccessfulSubmit/CreatorSubmitSuccess';
import NewPassword from '../screens/newPassword/NewPassword';
import { Colors } from '../styles';
import InfluencerStepTwo from '../screens/influencerApplication/InfluencerStepTwo';
import { spacing } from '../styles/spacing';

const Stack = createNativeStackNavigator<SettingsStackParamsList>();

function SettingsStack() {
  const headerOptions: NativeStackNavigationOptions = {
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="SettingsMain"
      screenOptions={{
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        statusBarStyle: dark ? 'light' : 'dark',
        headerTransparent: true,
        headerBlurEffect: dark ? 'systemMaterialDark' : 'systemMaterialLight',
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={Settings}
        options={({ navigation }) => ({
          headerBackTitleVisible: false,
          headerShadowVisible: false,
          headerTransparent: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: dark ? colors.text : Colors.primary.brand,
          headerTitleAlign: Platform.OS === 'android' ? 'left' : 'center',
          headerLeftContainerStyle: {
            paddingLeft: spacing.x8,
          },
          headerRightContainerStyle: {
            paddingRight: spacing.x8,
          },
          headerTitleStyle: {
            color: dark ? colors.text : Colors.primary.brand,
          },
          title: 'Settings',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                  return;
                }

                navigation.getParent()?.navigate('HomeTab', {
                  screen: 'Home',
                });
              }}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={dark ? colors.text : Colors.primary.brand}
              />
            </TouchableOpacity>
          ),
          headerRight: () => <View style={{ width: 40, height: 40 }} />,
        })}
      />
      {/* <Stack.Screen
        name="ConfirmLogin"
        component={ConfirmLogin}
        options={{ ...headerOptions, presentation: 'modal' }}
      /> */}

      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
        options={({ navigation }) => ({
          ...headerOptions,
          title: 'Notification Settings',
          headerTransparent: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: dark ? colors.text : Colors.primary.brand,
          headerTitleAlign: Platform.OS === 'android' ? 'left' : 'center',
          headerTitleStyle: { color: dark ? colors.text : Colors.primary.brand },
          headerLeftContainerStyle: { paddingLeft: spacing.x8 },
          headerRightContainerStyle: { paddingRight: spacing.x8 },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                  return;
                }
                navigation.getParent()?.navigate('HomeTab', { screen: 'Home' });
              }}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={dark ? colors.text : Colors.primary.brand}
              />
            </TouchableOpacity>
          ),
          headerRight: () => <View style={{ width: 40, height: 40 }} />,
        })}
      />
      <Stack.Screen
        name="InfluencerSettings"
        component={InfluencerSettings}
        options={{
          ...headerOptions,
          title: 'Creator Settings',
          headerStyle: { backgroundColor: colors.background },
        }}
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
        options={{
          ...headerOptions,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="InfluencerStepTwo"
        component={InfluencerStepTwo}
        options={{
          ...headerOptions,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="InfluencerStepThree"
        component={InfluencerStepThree}
        options={{
          ...headerOptions,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="InfluencerStepFour"
        component={InfluencerStepFour}
        options={{
          ...headerOptions,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreatorReview"
        component={CreatorReview}
        options={{
          ...headerOptions,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreatorSuccess"
        component={CreatorSubmitSuccess}
        options={{
          ...headerOptions,
          headerShown: false,
        }}
      />
      <Stack.Screen name="NewPassword" component={NewPassword} options={headerOptions} />
      <Stack.Screen
        name="RemoveAccount"
        component={RemoveAccount}
        options={{
          ...headerOptions,
          title: 'Remove Account',
          headerStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack.Navigator>
  );
}

export default SettingsStack;
