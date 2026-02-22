/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-unstable-nested-components */
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';

import {
  BottomTabBar,
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { getFocusedRouteNameFromRoute, useTheme } from '@react-navigation/native';
import HomeStack from './HomeStack';
import ExploreStack from './ExploreStack';
import ProfileStack from './ProfileStack';
import { MainBottomStackParamsList } from './types';
import SearchStack from './SearchStack';
import ConnectStack from './ConnectStack';
import PostStack from './PostStack';
import { getHeight } from '@/utils/ResponsiveFun';
import { FeedTypes } from '../screens/home';
import { TabBarAnimationProvider, useTabBarAnimation } from './TabBarAnimationContext';
import ZoeChat from '../screens/main/zoeChat';
import ZoeIcon from '@/assets/svg/zoeicon.svg';
import ZoeIconSelected from '@/assets/svg/zoeicon_selected.svg';

const Tab = createBottomTabNavigator<MainBottomStackParamsList>();

function AnimatedTabBar(props: BottomTabBarProps) {
  const tabBarAnimation = useTabBarAnimation();
  const { state, descriptors, navigation, insets } = props;

  if (!tabBarAnimation) {
    return (
      <BottomTabBar
        state={state}
        descriptors={descriptors}
        navigation={navigation}
        insets={insets}
      />
    );
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        elevation: 20,
        overflow: 'visible',
        transform: [{ translateY: tabBarAnimation.tabBarTranslateY }],
      }}
    >
      <BottomTabBar
        state={state}
        descriptors={descriptors}
        navigation={navigation}
        insets={insets}
      />
    </Animated.View>
  );
}

AnimatedTabBar.propTypes = {
  state: PropTypes.shape({}).isRequired,
  descriptors: PropTypes.shape({}).isRequired,
  navigation: PropTypes.shape({}).isRequired,
  insets: PropTypes.shape({}).isRequired,
};

function TabBarWrapper({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <AnimatedTabBar
      state={state}
      descriptors={descriptors}
      navigation={navigation}
      insets={insets}
    />
  );
}

TabBarWrapper.propTypes = {
  state: PropTypes.shape({}).isRequired,
  descriptors: PropTypes.shape({}).isRequired,
  navigation: PropTypes.shape({}).isRequired,
  insets: PropTypes.shape({}).isRequired,
};

function HomeTabIcon({ color }: { color: string }) {
  return <MaterialIcons name="home" size={24} color={color} />;
}

HomeTabIcon.propTypes = {
  color: PropTypes.string.isRequired,
  focused: PropTypes.bool,
  size: PropTypes.number,
};

function SearchTabIcon({ color }: { color: string }) {
  return <MaterialIcons name="search" size={24} color={color} />;
}

SearchTabIcon.propTypes = {
  color: PropTypes.string.isRequired,
  focused: PropTypes.bool,
  size: PropTypes.number,
};

function ExploreTabIcon({ color }: { color: string }) {
  return <MaterialIcons name="public" size={24} color={color} />;
}

ExploreTabIcon.propTypes = {
  color: PropTypes.string.isRequired,
  focused: PropTypes.bool,
  size: PropTypes.number,
};

function ZoeTabIcon({ focused }: { focused: boolean }) {
  return focused ? <ZoeIconSelected width={24} height={24} /> : <ZoeIcon width={24} height={24} />;
}

ZoeTabIcon.propTypes = {
  color: PropTypes.string.isRequired,
  focused: PropTypes.bool,
  size: PropTypes.number,
};

function BottomStack() {
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarTotalHeight = getHeight(5) + insets.bottom;
  const defaultTabBarStyle = {
    height: tabBarTotalHeight,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    backgroundColor: 'transparent',
    elevation: 0,
    overflow: 'visible' as const,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: insets.bottom,
  };
  const connectVisibleTabBarStyle = {
    height: getHeight(7) + insets.bottom,
    paddingBottom: insets.bottom,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: Platform.OS === 'android' ? colors.background : 'transparent',
    zIndex: 20,
    elevation: 20,
    overflow: 'visible' as const,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  };
  const brandColors = {
    primaryBase: '#41899f',
    primaryDark: '#126b87',
    accentBase: '#41dbe1',
    accentDark: '#12d2d9',
    scale100: '#e6eaec',
    black: '#032f3c',
  };

  const tabBarGradientColors = dark
    ? ['rgba(13,13,13,0.98)', 'rgba(13,13,13,0.92)']
    : ['rgba(246,246,247,0.98)', 'rgba(230,234,236,0.95)'];

  return (
    <TabBarAnimationProvider>
      <Tab.Navigator
        tabBar={TabBarWrapper}
        screenOptions={{
          headerStatusBarHeight: 0,
          headerShown: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          tabBarActiveTintColor: brandColors.primaryDark,
          tabBarInactiveTintColor: dark ? 'rgba(230,234,236,0.65)' : brandColors.black,
          tabBarShowLabel: false,
          tabBarLabelStyle: { paddingTop: 4 },
          tabBarStyle: defaultTabBarStyle,
          tabBarBackground: () => (
            <View style={StyleSheet.absoluteFill}>
              {Platform.OS === 'ios' ? (
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType={dark ? 'dark' : 'light'}
                  blurAmount={20}
                  reducedTransparencyFallbackColor={dark ? '#0D0D0D' : colors.background}
                />
              ) : null}
              <LinearGradient
                colors={tabBarGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderTopWidth: 1,
                    borderTopColor: dark ? 'rgba(255,255,255,0.08)' : brandColors.scale100,
                  },
                ]}
              />
            </View>
          ),
          tabBarItemStyle: {
            paddingTop: 4,
            paddingBottom: 4,
            overflow: 'visible',
          },
          tabBarIconStyle: {
            overflow: 'visible',
          },
          tabBarAllowFontScaling: false,
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          initialParams={{
            screen: 'Home',
            params: {
              selectedTab: FeedTypes.ForYou,
            },
          }}
          options={({ route }) => {
            const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? 'Home';
            const shouldHideTabBar = focusedRouteName === 'Notifications';

            return {
              tabBarLabel: 'Home',
              tabBarIcon: HomeTabIcon,
              tabBarStyle: shouldHideTabBar
                ? { ...defaultTabBarStyle, display: 'none', height: 0, opacity: 0 }
                : defaultTabBarStyle,
            };
          }}
        />
        <Tab.Screen
          name="SearchTab"
          component={ExploreStack}
          options={{
            tabBarLabel: 'Search',
            tabBarIcon: SearchTabIcon,
          }}
        />
        <Tab.Screen
          name="PostTab"
          component={SearchStack}
          options={{
            tabBarLabel: 'Post',
            tabBarIcon: () => (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: brandColors.primaryBase,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="add" size={26} color="white" />
              </View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Post');
            },
          })}
        />
        <Tab.Screen
          name="ExploreTab"
          component={ConnectStack}
          options={({ route }) => {
            const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? 'ConnectPortal';
            const shouldShowTabBar = focusedRouteName === 'ConnectPortal';

            return {
              tabBarLabel: 'Connect',
              tabBarIcon: ExploreTabIcon,
              tabBarStyle: shouldShowTabBar
                ? connectVisibleTabBarStyle
                : { ...connectVisibleTabBarStyle, display: 'none', height: 0, opacity: 0 },
            };
          }}
        />
        <Tab.Screen
          name="MyProfileTab"
          component={ProfileStack}
          options={{
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tab.Screen
          name="ZoeTab"
          component={ZoeChat}
          options={{
            tabBarLabel: 'Zoe',
            tabBarIcon: ZoeTabIcon,
            tabBarStyle: connectVisibleTabBarStyle,
            lazy: false,
            unmountOnBlur: false,
            freezeOnBlur: false,
          }}
        />
      </Tab.Navigator>
    </TabBarAnimationProvider>
  );
}
export default BottomStack;
