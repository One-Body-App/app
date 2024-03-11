import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useTheme } from '@react-navigation/native';
import { DrawerToggleButton, getDrawerStatusFromState } from '@react-navigation/drawer';
import { HeaderBackButton } from '@react-navigation/elements';
import { Animated, StyleProp, TextProps, TextStyle, View } from 'react-native';
import Home, { FeedTypes } from '../screens/home';
import UserProfile from '../screens/main/userProfile';
import { HomeStackParamsList } from './types';
import Notifications from '../screens/notifications';
import { Colors } from '../styles';

import Logo from '@/assets/icons/logo.svg';
import LogoWhite from '@/assets/icons/logo_white.svg';
import mainPageOptions from './global';
import Watch from '../screens/home/watch';

type HeaderProps = Omit<TextProps, 'style'> & {
  tintColor?: string;
  style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
};

const Stack = createNativeStackNavigator<HomeStackParamsList>();
function HomeStack() {
  // const { colors } = useTheme();
  const { dark, colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => {
        return {
          // drawerType,
          headerTintColor: dark ? colors.text : Colors.primary.brand,

          drawerActiveBackgroundColor: Colors.neutral[600],
          drawerActiveTintColor: dark ? Colors.primarySapphire[500] : Colors.primary.brand,
          headerLeft: (props) => {
            const isDrawerOpen =
              getDrawerStatusFromState(navigation.getParent().getState()) === 'open';

            if (navigation.canGoBack() && !isDrawerOpen) {
              return <HeaderBackButton labelVisible={false} onPress={() => navigation.goBack()} />;
            }
            return <DrawerToggleButton {...props} />;
          },
        };
      }}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        initialParams={{
          selectedTab: FeedTypes.Connected,
        }}
        options={({ navigation }) => {
          return {
            ...mainPageOptions(navigation, colors.text, 'Home'),
            title: 'Home',
            headerTitleAlign: 'center',
            headerTitle: ({ tintColor, style, children, ...rest }: HeaderProps) => {
              return (
                <View style={{ height: 28, width: 28 }}>
                  {dark ? (
                    <LogoWhite style={{ height: 28, width: 28 }} />
                  ) : (
                    <Logo style={{ height: 28, width: 28 }} />
                  )}
                </View>
              );
            },
            //   const title = getHeaderTitle(route);

            //   if (title == 'Home') {
            //     return (
            //       <View style={{ height: 28, width: 28 }}>
            //         {dark ? (
            //           <LogoWhite style={{ height: 28, width: 28 }} />
            //         ) : (
            //           <Logo style={{ height: 28, width: 28 }} />
            //         )}
            //       </View>
            //     );
            //   }

            //   return (
            //     <Animated.Text
            //       accessibilityRole="header"
            //       aria-level="1"
            //       numberOfLines={1}
            //       // eslint-disable-next-line react/no-children-prop
            //       children={title}
            //       {...rest}
            //       style={[
            //         styles.title,
            //         { color: tintColor === undefined ? colors.text : tintColor },
            //         style,
            //       ]}
            //     />
            //   );
            // },
          };
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="WatchPortal"
        component={Watch}
        options={{
          presentation: 'card',
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
          contentStyle: { backgroundColor: Colors.neutral[700] },
        }}
      />
    </Stack.Navigator>
  );
}

export default HomeStack;
