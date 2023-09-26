import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import React from 'react';
import Explore from '../screens/explore';

import UserProfile from '../screens/main/userProfile';
import { MainDrawerParamsList } from './types';
import OnboardingStack from './OnboardingStack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/reducers/rootReducer';
import {
  Animated,
  Platform,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Colors } from '../styles';
import { Home3, Notification, Profile2User, Setting2 } from 'iconsax-react-native';
import {
  CommonActions,
  Route,
  getFocusedRouteNameFromRoute,
  getStateFromPath,
  useTheme,
} from '@react-navigation/native';
import Saved from '../screens/main/saved';
import Feather from 'react-native-vector-icons/Feather';
import Connections from '../screens/main/connections';
import SettingsStack from './SettingsStack';
import Logo from '@/assets/icons/logo.svg';
import MainTabStack from './BottomTabStack';
import FastImage from 'react-native-fast-image';
import { spacing } from '../styles/spacing';
import DrawerContent from './DrawerContent';

const DrawerStack = createDrawerNavigator<MainDrawerParamsList>();
type HeaderProps = Omit<TextProps, 'style'> & {
  tintColor?: string;
  style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
};

function getHeaderTitle(route: Partial<Route<string>>) {
  // If the focused route is not found, we need to assume it's the initial screen
  // This can happen during if there hasn't been any navigation inside the screen
  // In our case, it's "Feed" as that's the first screen inside the navigator
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeTab';

  switch (routeName) {
    case 'HomeTab':
      return 'Home';
    case 'SearchTab':
      return 'Search';
    case 'ExploreTab':
      return 'Discover Accounts';
    case 'MyProfileTab':
      return 'Profile';
  }
}

const DrawerNav = () => {
  const authState = useSelector((state: RootState) => state.auth);
  const dimensions = useWindowDimensions();

  return (
    <>
      {!authState.getProfileData?.isProfileCompleted ? (
        <DrawerStack.Navigator
          screenOptions={{
            drawerType:
              dimensions.width >= 768 ? 'permanent' : Platform.OS == 'ios' ? 'slide' : 'front',
            headerTintColor: Colors.primary.brand,

            drawerActiveBackgroundColor: Colors.neutral[600],
            headerStyle: {
              backgroundColor: 'white',
            },
          }}
          drawerContent={(props) => <DrawerContent {...props} />}
        >
          <DrawerStack.Screen
            name="Main"
            component={MainTabStack}
            options={({ route, navigation }) => ({
              title: 'Home',
              drawerIcon: ({ color, size, focused }) => {
                return <Home3 size={size} color={color} />;
              },

              headerTitleAlign:
                getHeaderTitle(route) == 'Home' || Platform.OS == 'ios' ? 'center' : 'left',
              headerTitle: ({ tintColor, style, children, ...rest }: HeaderProps) => {
                const { colors } = useTheme();
                const title = getHeaderTitle(route);

                if (title == 'Home') {
                  return (
                    <View style={{ height: 28, width: 28 }}>
                      <Logo style={{ height: 28, width: 28 }} />
                    </View>
                  );
                }
                return (
                  <Animated.Text
                    accessibilityRole="header"
                    aria-level="1"
                    numberOfLines={1}
                    children={title}
                    {...rest}
                    style={[
                      styles.title,
                      { color: tintColor === undefined ? colors.text : tintColor },
                      style,
                    ]}
                  />
                );
              },

              headerRight() {
                const routeName = getHeaderTitle(route);
                if (routeName == 'Home') {
                  return (
                    <View style={{ flexDirection: 'row', paddingRight: spacing.x24 }}>
                      <TouchableOpacity
                        onPress={() => {
                          navigation.navigate('Notifications');
                        }}
                        // style={{ paddingRight: spacing.x24 }}
                      >
                        <Notification
                          style={{ height: 24, width: 24 }}
                          color={Colors.primary.brand}
                          strokeWidth={0.2}
                        />
                      </TouchableOpacity>
                      {/* <TouchableOpacity onPress={() => {}}>
                            <Message
                              style={{ height: 24, width: 24 }}
                              stroke={Colors.primary.brand}
                              strokeWidth={0.2}
                            />
                          </TouchableOpacity> */}
                    </View>
                  );
                }
              },
            })}
          />

          <DrawerStack.Screen
            name="Saved"
            component={Saved}
            options={{
              title: 'Saved Posts',
              drawerIcon: ({ color, size, focused }) => {
                return <Feather name="bookmark" size={size} color={color} />;
              },
            }}
          />

          <DrawerStack.Screen
            name="Connections"
            component={Connections}
            options={{
              title: 'My Connections',
              drawerIcon: ({ color, size, focused }) => {
                return <Profile2User size={size} color={color} />;
              },
            }}
          />

          <DrawerStack.Screen
            name="Settings"
            component={SettingsStack}
            options={{
              drawerItemStyle: { height: 0 },
            }}
          />

          {/* <DrawerStack.Screen name="Help" component={Help} /> */}
        </DrawerStack.Navigator>
      ) : (
        <OnboardingStack />
      )}
    </>
  );
};

export default DrawerNav;

const styles = StyleSheet.create({
  title: Platform.select({
    ios: {
      fontSize: 17,
      fontWeight: '600',
    },
    android: {
      fontSize: 20,
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal',
    },
    default: {
      fontSize: 18,
      fontWeight: '500',
    },
  }),
});
