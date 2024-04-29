import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React from 'react';

import { useTheme } from '@react-navigation/native';
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

function PrayerWall() {
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="index"
        component={Prayer}
        options={({ navigation }) => {
          if (navigation.canGoBack()) {
            return {
              title: 'Pray',
              headerLeft: (props) => {
                return (
                  <HeaderBackButton
                    style={{
                      marginHorizontal: Platform.OS == 'ios' ? 0 : undefined,
                      marginLeft: Platform.OS == 'ios' ? -5 : undefined,
                      width: Platform.OS == 'ios' ? 40 : undefined,
                    }}
                    labelVisible={false}
                    onPress={() => navigation.goBack()}
                  />
                );
              },
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
            headerStyle: { backgroundColor: colors.background },
            title: '',
            contentStyle: { backgroundColor: Colors.neutral[700] },
          };
        }}
      />
      <Stack.Screen
        name="Prayer"
        component={NewPrayer}
        options={({ route }) => {
          return {
            headerBackTitleVisible: false,
            headerBackTitle: 'Back',
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
        options={() => {
          return {
            headerBackTitleVisible: false,
            headerStyle: { backgroundColor: colors.background },

            title: 'Post',
            contentStyle: { backgroundColor: Colors.neutral[700] },
          };
        }}
      />
    </Stack.Navigator>
  );
}

export default PrayerWall;
