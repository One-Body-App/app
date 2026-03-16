/* eslint-disable react/no-unstable-nested-components */
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { Animated, Dimensions, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';

import {
  BottomTabBar,
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {
  getFocusedRouteNameFromRoute,
  useFocusEffect,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import HomeStack from './HomeStack';
import ExploreStack from './ExploreStack';
import ProfileStack from './ProfileStack';
import { MainBottomStackParamsList } from './types';
import ConnectStack from './ConnectStack';
import { getHeight } from '@/utils/ResponsiveFun';
import { FeedTypes } from '../screens/home';
import { TabBarAnimationProvider, useTabBarAnimation } from './TabBarAnimationContext';
import ConnectIcon from '@/assets/icons/connect.svg';
import Home2Icon from '@/assets/icons/home2.svg';
import MessagesIcon from '@/assets/icons/messages.svg';
import MessagesStack from './MessagesStack';
import { useChatUnreadCount } from '@/src/services/chat/unreadIndicator';

const Tab = createBottomTabNavigator<MainBottomStackParamsList>();

const SCREEN_WIDTH = Dimensions.get('window').width;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getScreenParam = (params: unknown): string | undefined => {
  if (!isRecord(params)) {
    return undefined;
  }
  const { screen } = params;
  return typeof screen === 'string' ? screen : undefined;
};

const getNestedScreenParam = (params: unknown): string | undefined => {
  if (!isRecord(params)) {
    return undefined;
  }
  return getScreenParam(params.params);
};

const getActiveNestedRouteName = (route: any): string | undefined => {
  if (!route) {
    return undefined;
  }

  const { state } = route;
  if (!state || !Array.isArray(state.routes) || typeof state.index !== 'number') {
    if (typeof route.params?.screen === 'string') {
      return route.params.screen;
    }
    return route.name;
  }

  const childRoute = state.routes[state.index];
  if (!childRoute) {
    return route.name;
  }

  return getActiveNestedRouteName(childRoute) ?? childRoute.name;
};

function SlideInOnFocus({
  children,
  direction = 'right',
}: {
  children: React.ReactNode;
  direction?: 'left' | 'right';
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const hasFocusedOnce = useRef(false);
  const runningAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const shouldAnimateRef = useRef(false);
  const navigation = useNavigation();
  const initialOffset = direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (!navigation.isFocused()) {
        shouldAnimateRef.current = true;
      }
    });
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        shouldAnimateRef.current = false;
        translateX.setValue(0);
        return () => {
          runningAnimation.current?.stop();
          runningAnimation.current = null;
          translateX.setValue(0);
        };
      }

      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        shouldAnimateRef.current = false;
        translateX.setValue(0);
        return () => {
          runningAnimation.current?.stop();
          runningAnimation.current = null;
          translateX.setValue(0);
        };
      }

      if (!shouldAnimateRef.current) {
        translateX.setValue(0);
        return () => {
          runningAnimation.current?.stop();
          runningAnimation.current = null;
          translateX.setValue(0);
        };
      }

      shouldAnimateRef.current = false;
      runningAnimation.current?.stop();
      translateX.setValue(initialOffset);
      runningAnimation.current = Animated.timing(translateX, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      runningAnimation.current.start(() => {
        runningAnimation.current = null;
      });

      return () => {
        runningAnimation.current?.stop();
        runningAnimation.current = null;
        translateX.setValue(0);
      };
    }, [initialOffset, translateX])
  );

  if (Platform.OS === 'android') {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  return <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>{children}</Animated.View>;
}

function HomeTabWrapper() {
  return (
    <SlideInOnFocus direction="left">
      <HomeStack />
    </SlideInOnFocus>
  );
}

function ExploreTabWrapper() {
  return (
    <SlideInOnFocus>
      <ExploreStack />
    </SlideInOnFocus>
  );
}

function ConnectTabWrapper() {
  return (
    <SlideInOnFocus>
      <ConnectStack />
    </SlideInOnFocus>
  );
}

function PostTabPlaceholder() {
  return null;
}

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

function ChatTabIcon({ focused, color }: { focused: boolean; color: string }) {
  const size = 22;
  const unreadCount = useChatUnreadCount();

  const badgeLabel =
    unreadCount < 2
      ? null
      : unreadCount < 20
        ? String(unreadCount)
        : unreadCount < 100
          ? '20+'
          : '100+';

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <MessagesIcon width={size} height={size} color={color} />
      {unreadCount === 1 ? (
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
      ) : badgeLabel ? (
        <View
          style={{
            position: 'absolute',
            top: -5,
            right: -8,
            minWidth: 16,
            height: 14,
            borderRadius: 7,
            backgroundColor: '#12d2d9',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <Text
            style={{
              color: '#032f3c',
              fontSize: 8,
              fontWeight: 'bold',
              lineHeight: 14,
            }}
          >
            {badgeLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

ChatTabIcon.propTypes = {
  color: PropTypes.string.isRequired,
  focused: PropTypes.bool,
};

function BottomStack() {
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarTotalHeight = getHeight(7) + insets.bottom;
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
    borderTopColor: 'rgba(230,234,236,0.08)',
    zIndex: 20,
    elevation: 20,
    overflow: 'visible' as const,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  };
  const exploreTabBarStyle = {
    ...defaultTabBarStyle,
    height: getHeight(7) + insets.bottom,
    paddingBottom: insets.bottom,
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
        sceneContainerStyle={
          Platform.OS === 'android' ? { backgroundColor: 'transparent' } : undefined
        }
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
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: dark ? '#0D0D0D' : colors.background,
                  },
                ]}
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
          component={HomeTabWrapper}
          initialParams={{
            screen: 'Home',
            params: {
              selectedTab: FeedTypes.ForYou,
            },
          }}
          options={({ route }) => {
            const pendingScreen = getScreenParam(route.params);
            const nestedPendingScreen = getNestedScreenParam(route.params);
            const focusedRouteName =
              getActiveNestedRouteName(route) ??
              (typeof pendingScreen === 'string' ? pendingScreen : undefined) ??
              (typeof nestedPendingScreen === 'string' ? nestedPendingScreen : undefined) ??
              getFocusedRouteNameFromRoute(route) ??
              'Home';
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
          name="ExploreTab"
          component={ExploreTabWrapper}
          options={{
            tabBarLabel: 'Explore',
            tabBarIcon: ExploreTabIcon,
            tabBarStyle: exploreTabBarStyle,
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
              tabBarStyle: shouldShowTabBar
                ? exploreTabBarStyle
                : { ...exploreTabBarStyle, display: 'none', height: 0, opacity: 0 },
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
          component={MessagesStack}
          options={({ route }) => {
            const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? 'MessagesList';
            const shouldShowTabBar = focusedRouteName === 'MessagesList';

            return {
              tabBarLabel: 'Chat',
              tabBarIcon: ChatTabIcon,
              tabBarStyle: shouldShowTabBar
                ? connectVisibleTabBarStyle
                : { ...connectVisibleTabBarStyle, display: 'none', height: 0, opacity: 0 },
              lazy: false,
              unmountOnBlur: false,
              freezeOnBlur: false,
            };
          }}
        />
      </Tab.Navigator>
    </TabBarAnimationProvider>
  );
}
export default BottomStack;
