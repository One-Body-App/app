import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import React from 'react';

import { useNavigation, useTheme } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { Platform } from 'react-native';
import { PrayerWallStackParamsList } from './types';
import { Colors } from '../styles';
import Prayer from '../screens/main/prayer';

import UserProfile from '../screens/main/userProfile';
import NewPrayer from '../screens/main/prayer/NewPrayer';
import SinglePrayer from '../screens/main/prayer/Single';
import mainPageOptions from './global';

const Stack = createNativeStackNavigator<PrayerWallStackParamsList>();
type PrayerWallNavigationProp = NativeStackNavigationProp<PrayerWallStackParamsList>;

function IndexHeaderBackButton() {
  const navigation = useNavigation<PrayerWallNavigationProp>();

  return (
    <HeaderBackButton
      style={{
        marginHorizontal: Platform.OS === 'ios' ? 0 : undefined,
        marginLeft: Platform.OS === 'ios' ? -5 : undefined,
        width: Platform.OS === 'ios' ? 40 : undefined,
      }}
      labelVisible={false}
      onPress={() => navigation.goBack()}
    />
  );
}

function PrayerHeaderBackButton() {
  const navigation = useNavigation<PrayerWallNavigationProp>();

  return <HeaderBackButton labelVisible={false} onPress={() => navigation.goBack()} />;
}

function PrayerWall() {
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        statusBarStyle: dark ? 'light' : 'dark',
        headerTransparent: Platform.OS === 'ios',
        headerBlurEffect: dark ? 'systemMaterialDark' : 'systemMaterialLight',
        headerStyle: Platform.OS === 'android' ? { backgroundColor: colors.background } : undefined,
      }}
    >
      <Stack.Screen
        name="index"
        component={Prayer}
        options={({ navigation }) => {
          if (navigation.canGoBack()) {
            return {
              title: 'Pray',
              headerLeft: IndexHeaderBackButton,
            };
          }

          return mainPageOptions(
            navigation,
            dark ? colors.text : Colors.primary.brand,
            'Prayer Wall'
          );
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfile}
        options={() => {
          return {
            headerBackTitleVisible: false,
            headerTransparent: false,
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            title: '',
            contentStyle: { backgroundColor: colors.background },
          };
        }}
      />
      <Stack.Screen
        name="Prayer"
        component={NewPrayer}
        options={({ route }) => {
          return {
            headerShown: Platform.OS !== 'android',
            headerBackTitleVisible: false,
            headerBackTitle: 'Back',
            title: route.params?.postId ? 'Edit Post on Prayer Wall' : 'Post on Prayer Wall',
            headerLeft: Platform.OS === 'ios' ? PrayerHeaderBackButton : undefined,
            // headerLeft: (props) => {
            //   const { dark, colors } = useTheme();
            //   return (
            //     <TouchableOpacity
            //       onPress={() => {
            //         if (props.canGoBack) {
            //           navigation.pop();
            //         }
            //       }}
            //     >
            //       <MaterialCommunityIcons
            //         name="window-close"
            //         size={18}
            //         color={dark ? colors.text : Colors.primary.brand}
            //       />
            //     </TouchableOpacity>
            //   );
            // },
          };
        }}
      />

      <Stack.Screen
        name="Single"
        component={SinglePrayer}
        options={() => {
          return {
            headerShown: Platform.OS !== 'android',
            headerBackTitleVisible: false,
            headerStyle: { backgroundColor: colors.background },
            title: 'Comment',
            headerLeft: Platform.OS === 'ios' ? PrayerHeaderBackButton : undefined,
            contentStyle: { backgroundColor: Colors.neutral[700] },
          };
        }}
      />
    </Stack.Navigator>
  );
}

export default PrayerWall;
