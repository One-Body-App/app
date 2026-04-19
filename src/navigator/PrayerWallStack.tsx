import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import React, { useCallback } from 'react';

import { useFocusEffect, useNavigation, useTheme } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrayerWallStackParamsList } from './types';
import { Colors } from '../styles';
import Prayer from '../screens/main/prayer';

import UserProfile from '../screens/main/userProfile';
import NewPrayer from '../screens/main/prayer/NewPrayer';
import SinglePrayer from '../screens/main/prayer/Single';
import mainPageOptions from './global';
import HeaderGradientOverlay from '../components/HeaderGradientOverlay';
import { getHeight } from '@/utils/ResponsiveFun';
import { useTabBarAnimation } from './TabBarAnimationContext';

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
  const insets = useSafeAreaInsets();
  const tabBarAnimation = useTabBarAnimation();
  const footerHeight = getHeight(7) + insets.bottom;

  useFocusEffect(
    useCallback(() => {
      tabBarAnimation?.setTabBarTranslateY(footerHeight);

      return () => {
        tabBarAnimation?.resetTabBar();
      };
    }, [footerHeight, tabBarAnimation])
  );

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        statusBarStyle: dark ? 'light' : 'dark',
        headerTransparent: Platform.OS === 'ios',
        headerBlurEffect: dark ? 'systemMaterialDark' : 'systemMaterialLight',
        headerStyle: Platform.OS === 'android' ? { backgroundColor: colors.background } : undefined,
        headerBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            {Platform.OS === 'ios' ? (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType={dark ? 'materialDark' : 'materialLight'}
                blurAmount={20}
                reducedTransparencyFallbackColor={colors.background}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
            )}
            <HeaderGradientOverlay color={colors.background} />
          </View>
        ),
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
              contentStyle: { backgroundColor: colors.background },
            };
          }

          return {
            ...mainPageOptions(
              navigation,
              dark ? colors.text : Colors.primary.brand,
              'Prayer Wall'
            ),
            contentStyle: { backgroundColor: colors.background },
          };
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
