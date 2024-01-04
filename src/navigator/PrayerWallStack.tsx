import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React from 'react';

import { PrayerWallStackParamsList } from './types';
import { Colors } from '../styles';
import { useTheme } from '@react-navigation/native';
import Prayer from '../screens/Main/Prayer';

import UserProfile from '../screens/Main/UserProfile';
import NewPrayer from '../screens/Main/Prayer/NewPrayer';
import SinglePrayer from '../screens/Main/Prayer/Single';

const Stack = createNativeStackNavigator<PrayerWallStackParamsList>();

const PrayerWall = () => {
  const headerOptions: NativeStackNavigationOptions = {
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  const { colors } = useTheme();

  return (
    <Stack.Navigator>
      <Stack.Screen name="index" component={Prayer} options={{ headerShown: false }} />
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
      <Stack.Screen
        name="Prayer"
        component={NewPrayer}
        options={({ navigation, route }) => {
          return {
            // presentation: 'formSheet',
            title: route.params?.postId ? 'Edit Post on Prayer Wall' : 'Post on Prayer Wall',
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
        options={{
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: colors.background },
          title: 'Post',
          contentStyle: { backgroundColor: Colors.neutral[700] },
        }}
      />
    </Stack.Navigator>
  );
};

export default PrayerWall;
