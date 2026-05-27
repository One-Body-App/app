import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';

import { useTheme } from '@react-navigation/native';
import { Platform, Pressable } from 'react-native';
import Home, { FeedTypes } from '../screens/home';
import UserProfile from '../screens/main/userProfile';
import { HomeStackParamsList } from './types';
import Notifications from '../screens/notifications';
import NotificationSettings from '../screens/main/notificationSettings';
import { Colors } from '../styles';
import { spacing } from '../styles/spacing';
import { STANDARD_STACK_ANIMATION_OPTIONS } from './motionPolicy';

const Stack = createNativeStackNavigator<HomeStackParamsList>();
function HomeStack() {
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={() => {
        return {
          // drawerType,
          gestureEnabled: false,
          fullScreenGestureEnabled: false,
          ...STANDARD_STACK_ANIMATION_OPTIONS,
          statusBarStyle: dark ? 'light' : 'dark',
          statusBarColor: Platform.OS === 'android' && dark ? '#0D0D0D' : 'transparent',
          statusBarTranslucent: true,
          headerTintColor: dark ? colors.text : Colors.primary.brand,
          headerTransparent: false,
          headerShadowVisible: false,

          drawerActiveBackgroundColor: Colors.neutral[600],
          drawerActiveTintColor: dark ? '#ffffff' : '#126b87',
        };
      }}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        initialParams={{
          selectedTab: FeedTypes.ForYou,
        }}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: colors.background },
          title: '',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
        options={({ navigation }) => ({
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          title: 'Notification Settings',
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: dark ? colors.text : Colors.primary.brand,
          headerTitleAlign: Platform.OS === 'android' ? 'left' : 'center',
          headerTitleStyle: { color: dark ? colors.text : Colors.primary.brand },
          headerLeftContainerStyle: { paddingLeft: spacing.x8 },
          headerRightContainerStyle: { paddingRight: spacing.x8 },
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={dark ? colors.text : Colors.primary.brand}
              />
            </Pressable>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

export default HomeStack;
