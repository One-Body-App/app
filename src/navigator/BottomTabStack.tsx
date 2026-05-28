/* eslint-disable react/no-unstable-nested-components */
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  BottomTabBar,
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {
  getFocusedRouteNameFromRoute,
  useFocusEffect,
  useIsFocused,
  useNavigationState,
  useTheme,
} from '@react-navigation/native';
import HomeStack from './HomeStack';
import ExploreStack from './ExploreStack';
import ProfileStack from './ProfileStack';
import { MainBottomStackParamsList } from './types';
import ConnectStack from './ConnectStack';
import { getHeight } from '@/utils/ResponsiveFun';
import { FeedTypes } from '../screens/home';
import { getHomeTabVisibilityState } from './homeTabRouteVisibility';
import { useTabBarAnimation } from './TabBarAnimationContext';
import { RootTabTransitionProvider, useRootTabTransition } from './RootTabTransitionContext';
import { ROOT_TAB_SCENE_MOTION_MODE } from './motionPolicy';
import { AnimatedRootTabName } from './rootTabTransition';
import ConnectIcon from '@/assets/icons/connect.svg';
import Home2Icon from '@/assets/icons/home2.svg';
import MessagesIcon from '@/assets/icons/messages.svg';
import MessagesStack from './MessagesStack';
import { useChatUnreadCount } from '@/src/services/chat/unreadIndicator';
import { buildTabBarVisibilityStyle } from './tabBarStyle';
import { shouldHideActiveTabBarWrapper } from './activeTabBarVisibility';

const Tab = createBottomTabNavigator<MainBottomStackParamsList>();

function DirectionalTabScene({
  children,
  tabName,
}: {
  children: React.ReactNode;
  tabName: AnimatedRootTabName;
}) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { latestTransition } = useRootTabTransition() ?? {};
  const translateX = useRef(new Animated.Value(0)).current;
  const runningAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastHandledTransitionTokenRef = useRef(0);
  const isFocusedRef = useRef(false);

  // Track focus/blur only. Reset animated values on blur so the screen
  // is in a clean state when it becomes visible again.
  // Does NOT depend on latestTransition — prevents the double-fire that
  // caused the Android offset glitch.
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;

      return () => {
        isFocusedRef.current = false;
        runningAnimation.current?.stop();
        runningAnimation.current = null;
        translateX.setValue(0);
        opacity.setValue(1);
        scale.setValue(1);
      };
    }, [translateX, opacity, scale])
  );

  useFocusEffect(
    useCallback(() => {
      if (ROOT_TAB_SCENE_MOTION_MODE === 'off') {
        return undefined;
      }
      if (!latestTransition) {
        return undefined;
      }
      if (latestTransition.toTab !== tabName) {
        return undefined;
      }
      if (latestTransition.direction === 'none') {
        return undefined;
      }
      if (latestTransition.token === lastHandledTransitionTokenRef.current) {
        return undefined;
      }

      lastHandledTransitionTokenRef.current = latestTransition.token;
      runningAnimation.current?.stop();

      if (ROOT_TAB_SCENE_MOTION_MODE === 'lite') {
        // Android: use opacity-only transition to avoid translateX offset glitches
        // caused by native-driver setValue/start race conditions on the bridge.
        translateX.setValue(0);
        opacity.setValue(0.82);
        scale.setValue(1);
        runningAnimation.current = Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
      } else {
        const initialOffsetMagnitude = screenWidth * 0.12;
        const initialOffset =
          latestTransition.direction === 'left' ? initialOffsetMagnitude : -initialOffsetMagnitude;
        translateX.setValue(initialOffset);
        opacity.setValue(0.97);
        scale.setValue(0.992);
        runningAnimation.current = Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
      }

      runningAnimation.current.start(({ finished }) => {
        if (finished) {
          translateX.setValue(0);
          opacity.setValue(1);
          scale.setValue(1);
        }
        runningAnimation.current = null;
      });

      return () => {
        runningAnimation.current?.stop();
        runningAnimation.current = null;
      };
    }, [latestTransition, opacity, scale, screenWidth, tabName, translateX])
  );

  if (ROOT_TAB_SCENE_MOTION_MODE === 'off') {
    return <View style={{ flex: 1, backgroundColor: colors.background }}>{children}</View>;
  }

  if (ROOT_TAB_SCENE_MOTION_MODE === 'lite') {
    return (
      <Animated.View
        collapsable={false}
        style={{
          flex: 1,
          backgroundColor: colors.background,
          opacity,
        }}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      collapsable={false}
      renderToHardwareTextureAndroid
      style={{
        flex: 1,
        backgroundColor: colors.background,
        opacity,
        overflow: 'hidden',
        transform: [{ translateX }, { scale }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function RootTabTransitionReporter({ state }: { state: BottomTabBarProps['state'] }) {
  const transitionContext = useRootTabTransition();

  useLayoutEffect(() => {
    const activeRoute = state.routes[state.index];
    transitionContext?.reportActiveTab(activeRoute?.name);
  }, [state.index, state.routes, transitionContext]);

  return null;
}

function HomeTabWrapper() {
  return (
    <DirectionalTabScene tabName="HomeTab">
      <HomeStack />
    </DirectionalTabScene>
  );
}

function ExploreTabWrapper() {
  return (
    <DirectionalTabScene tabName="ExploreTab">
      <ExploreStack />
    </DirectionalTabScene>
  );
}

function ConnectTabWrapper() {
  return (
    <DirectionalTabScene tabName="ConnectTab">
      <ConnectStack />
    </DirectionalTabScene>
  );
}

function MessagesTabWrapper() {
  return (
    <DirectionalTabScene tabName="Messages">
      <MessagesStack />
    </DirectionalTabScene>
  );
}

function PostTabPlaceholder() {
  return null;
}

function getActiveRouteNameFromNavigationState(state: {
  index?: number;
  routes?: { name?: unknown }[];
}) {
  const activeRoute =
    state && Array.isArray(state.routes) ? state.routes[state.index ?? 0] : undefined;

  return typeof activeRoute?.name === 'string' ? activeRoute.name : undefined;
}

function useIsMainDrawerRouteActive() {
  return useNavigationState((state) => getActiveRouteNameFromNavigationState(state) === 'Main');
}

export function AnimatedTabBar(props: BottomTabBarProps) {
  const tabBarAnimation = useTabBarAnimation();
  const { state, descriptors, navigation, insets } = props;
  const shouldHideWrapper = shouldHideActiveTabBarWrapper({ state, descriptors });

  if (shouldHideWrapper) {
    return null;
  }

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
    <>
      <RootTabTransitionReporter state={state} />
      <AnimatedTabBar
        state={state}
        descriptors={descriptors}
        navigation={navigation}
        insets={insets}
      />
    </>
  );
}

TabBarWrapper.propTypes = {
  state: PropTypes.shape({}).isRequired,
  descriptors: PropTypes.shape({}).isRequired,
  navigation: PropTypes.shape({}).isRequired,
  insets: PropTypes.shape({}).isRequired,
};

function HomeTabIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 28, height: 28 }}>
      <Home2Icon width={28} height={28} color={color} />
    </View>
  );
}

HomeTabIcon.propTypes = {
  color: PropTypes.string.isRequired,
};

function ExploreTabIcon({ color }: { color: string }) {
  return <MaterialIcons name="search" size={28} color={color} />;
}

ExploreTabIcon.propTypes = {
  color: PropTypes.string.isRequired,
};

function ConnectTabIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 28, height: 28 }}>
      <ConnectIcon width={28} height={28} color={color} />
    </View>
  );
}

ConnectTabIcon.propTypes = {
  color: PropTypes.string.isRequired,
};

function ChatTabIcon({ color }: { color: string }) {
  const size = 22;
  const unreadCount = useChatUnreadCount();
  let badgeLabel: string | null = null;
  let badge = null;

  if (unreadCount >= 2 && unreadCount < 20) {
    badgeLabel = String(unreadCount);
  } else if (unreadCount >= 20 && unreadCount < 100) {
    badgeLabel = '20+';
  } else if (unreadCount >= 100) {
    badgeLabel = '100+';
  }

  if (unreadCount === 1) {
    badge = (
      <View
        style={{
          position: 'absolute',
          top: -2,
          right: -3,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#12d2d9',
        }}
      />
    );
  } else if (badgeLabel) {
    badge = (
      <View
        style={{
          position: 'absolute',
          top: -5,
          right: -8,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: '#12d2d9',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            color: '#032f3c',
            fontSize: 12,
            fontWeight: 'bold',
            lineHeight: 16,
          }}
        >
          {badgeLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <MessagesIcon width={size} height={size} color={color} />
      {badge}
    </View>
  );
}

ChatTabIcon.propTypes = {
  color: PropTypes.string.isRequired,
};

type BottomStackProps = {
  isDrawerFocused?: boolean;
};

function BottomStackNavigator({ isDrawerFocused = true }: BottomStackProps) {
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarAnimation = useTabBarAnimation();
  const isMainDrawerRouteActive = useIsMainDrawerRouteActive();
  const shouldRenderSharedTabBar =
    isDrawerFocused && isMainDrawerRouteActive && !tabBarAnimation?.hiddenOwnerId;
  const tabBarTotalHeight = getHeight(7) + insets.bottom;
  const baseVisibleTabBarStyle = {
    height: tabBarTotalHeight,
    paddingBottom: insets.bottom,
    overflow: 'visible' as const,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  };
  const defaultTabBarStyle = {
    ...baseVisibleTabBarStyle,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    backgroundColor: 'transparent',
    elevation: 0,
  };
  const raisedTabBarStyle = {
    ...baseVisibleTabBarStyle,
    borderTopWidth: 1,
    borderTopColor: 'rgba(230,234,236,0.08)',
    zIndex: 20,
    elevation: 20,
  };
  const brandColors = {
    primaryBase: '#41899f',
    primaryDark: '#126b87',
    accentBase: '#41dbe1',
    accentDark: '#12d2d9',
    scale100: '#e6eaec',
    black: '#032f3c',
  };

  // iOS: translucent glass over BlurView. Android: solid — no native blur available.
  let tabBarGradientColors: [string, string];
  if (Platform.OS === 'ios') {
    tabBarGradientColors = dark
      ? ['rgba(13,13,13,0.72)', 'rgba(13,13,13,0.65)']
      : ['rgba(246,246,247,0.72)', 'rgba(230,234,236,0.65)'];
  } else {
    tabBarGradientColors = dark
      ? ['rgba(13,13,13,0.98)', 'rgba(13,13,13,0.92)']
      : ['rgba(246,246,247,0.98)', 'rgba(230,234,236,0.95)'];
  }

  return (
    <RootTabTransitionProvider>
      <Tab.Navigator
        tabBar={(props) => (shouldRenderSharedTabBar ? <TabBarWrapper {...props} /> : null)}
        sceneContainerStyle={{ backgroundColor: colors.background }}
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
                  blurAmount={25}
                  reducedTransparencyFallbackColor={dark ? '#0D0D0D' : colors.background}
                />
              ) : null}
              <LinearGradient
                colors={tabBarGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderTopWidth: 1,
                    borderTopColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
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
          component={HomeTabWrapper}
          initialParams={{
            screen: 'Home',
            params: {
              selectedTab: FeedTypes.ForYou,
            },
          }}
          options={({ route }) => {
            const { shouldHideTabBar } = getHomeTabVisibilityState(route);

            return {
              tabBarLabel: 'Home',
              tabBarIcon: HomeTabIcon,
              tabBarStyle: buildTabBarVisibilityStyle(defaultTabBarStyle, !shouldHideTabBar),
            };
          }}
        />
        <Tab.Screen
          name="ExploreTab"
          component={ExploreTabWrapper}
          options={{
            tabBarLabel: 'Explore',
            tabBarIcon: ExploreTabIcon,
            tabBarStyle: defaultTabBarStyle,
          }}
        />
        <Tab.Screen
          name="PostTab"
          component={PostTabPlaceholder}
          options={{
            tabBarLabel: 'Post',
            tabBarIcon: () => (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: brandColors.primaryDark,
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
          name="ConnectTab"
          component={ConnectTabWrapper}
          options={({ route }) => {
            const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? 'ConnectMap';
            const shouldShowTabBar =
              focusedRouteName === 'ConnectPortal' ||
              focusedRouteName === 'ConnectMap' ||
              focusedRouteName === 'ConnectGoLanding' ||
              focusedRouteName === 'ConnectPlacesHome' ||
              focusedRouteName === 'ConnectServeHome';

            return {
              tabBarLabel: 'Connect',
              tabBarIcon: ConnectTabIcon,
              tabBarStyle: buildTabBarVisibilityStyle(defaultTabBarStyle, shouldShowTabBar),
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
          name="Messages"
          component={MessagesTabWrapper}
          options={({ route }) => {
            const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? 'MessagesList';
            const shouldShowTabBar = focusedRouteName === 'MessagesList';

            return {
              tabBarLabel: 'Chat',
              tabBarIcon: ChatTabIcon,
              tabBarStyle: buildTabBarVisibilityStyle(raisedTabBarStyle, shouldShowTabBar),
              lazy: false,
              unmountOnBlur: false,
              freezeOnBlur: false,
            };
          }}
        />
      </Tab.Navigator>
    </RootTabTransitionProvider>
  );
}

function BottomStack() {
  const isDrawerFocused = useIsFocused();

  return <BottomStackNavigator isDrawerFocused={isDrawerFocused} />;
}

export default BottomStack;
