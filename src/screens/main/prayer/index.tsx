import React from 'react';
import {
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { TabView } from 'react-native-tab-view';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect, useTheme } from '@react-navigation/native';

import WallComponent from '@/components/prayerWallComponent';
import PrayersComponent from '@/components/prayerWallMyPrayersComponent';
import TestimoniesComponent from '@/components/prayerWallTestimoniesComponent';
import { PrayerWallStackParamsList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import PrayerWallSavedPrayersComponent from '@/components/prayerWallSavedPrayersComponent';
import GlassTabBar from '@/components/GlassTabBar';

type Props = StackScreenProps<PrayerWallStackParamsList, 'index'>;
type PrayerRoute = {
  key: string;
  title: string;
};

function Prayer({ navigation }: Props) {
  const isIOS = Platform.OS === 'ios';
  const { dark, colors } = useTheme();
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState<PrayerRoute[]>([
    { key: 'Wall', title: 'Wall' },
    { key: 'Testimonies', title: 'Testimonies' },
    { key: 'Saved', title: 'Saved' },
    { key: 'MyPrayers', title: 'My Prayers' },
  ]);
  const [areSubtabsVisible, setAreSubtabsVisible] = React.useState(true);
  const lastPrayerScrollY = React.useRef(0);
  const lastPrayerSubtabToggleAt = React.useRef(0);
  const prayerScrollAccumulator = React.useRef(0);
  const areSubtabsVisibleRef = React.useRef(true);
  const hasInitializedPrayerScroll = React.useRef(false);
  const hasWallUserScrollGesture = React.useRef(false);
  const prayerSubtabsVisibility = React.useRef(new Animated.Value(1)).current;
  const setSubtabsVisibility = React.useCallback(
    (visible: boolean) => {
      if (areSubtabsVisibleRef.current === visible) {
        return;
      }

      areSubtabsVisibleRef.current = visible;
      setAreSubtabsVisible(visible);
      Animated.timing(prayerSubtabsVisibility, {
        toValue: visible ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [prayerSubtabsVisibility]
  );
  const resetPrayerScrollState = React.useCallback(() => {
    hasInitializedPrayerScroll.current = false;
    hasWallUserScrollGesture.current = false;
    lastPrayerScrollY.current = 0;
    lastPrayerSubtabToggleAt.current = 0;
    prayerScrollAccumulator.current = 0;
    setSubtabsVisibility(true);
  }, [setSubtabsVisibility]);
  const handleWallUserScrollStart = React.useCallback(() => {
    hasWallUserScrollGesture.current = true;
  }, []);
  const handleWallScroll = React.useCallback(
    (offsetY: number) => {
      const now = Date.now();
      const nextY = Math.max(0, offsetY);
      const rawDelta = nextY - lastPrayerScrollY.current;
      const delta = -rawDelta;
      const threshold = 6;
      const topZoneThreshold = 24;
      const toggleDistance = 18;
      const toggleCooldownMs = 180;

      if (!hasWallUserScrollGesture.current) {
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (!hasInitializedPrayerScroll.current) {
        hasInitializedPrayerScroll.current = true;
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (nextY <= topZoneThreshold) {
        prayerScrollAccumulator.current = 0;
        setSubtabsVisibility(true);
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (Math.abs(rawDelta) <= threshold) {
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (now - lastPrayerSubtabToggleAt.current < toggleCooldownMs) {
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (Math.sign(prayerScrollAccumulator.current) !== Math.sign(delta)) {
        prayerScrollAccumulator.current = 0;
      }
      prayerScrollAccumulator.current += delta;

      if (prayerScrollAccumulator.current >= toggleDistance && areSubtabsVisibleRef.current) {
        setSubtabsVisibility(false);
        lastPrayerSubtabToggleAt.current = now;
        prayerScrollAccumulator.current = 0;
      } else if (
        prayerScrollAccumulator.current <= -toggleDistance &&
        !areSubtabsVisibleRef.current
      ) {
        setSubtabsVisibility(true);
        lastPrayerSubtabToggleAt.current = now;
        prayerScrollAccumulator.current = 0;
      }

      lastPrayerScrollY.current = nextY;
    },
    [setSubtabsVisibility]
  );

  useFocusEffect(
    React.useCallback(() => {
      resetPrayerScrollState();
      return undefined;
    }, [resetPrayerScrollState])
  );
  let shareBackgroundColor = 'transparent';
  if (!isIOS) {
    shareBackgroundColor = dark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)';
  }
  const shareButtonStyle = isIOS
    ? {
        position: 'absolute' as const,
        bottom: spacing.x24,
        alignSelf: 'center' as const,
        alignItems: 'center' as const,
        paddingVertical: 0,
        backgroundColor: 'transparent',
      }
    : {
        position: 'absolute' as const,
        bottom: 1,
        left: 0,
        right: 0,
        alignItems: 'center' as const,
        paddingVertical: spacing.x8,
        backgroundColor: shareBackgroundColor,
      };

  const applyTabIndex = React.useCallback(
    (nextIndex: number) => {
      setIndex(nextIndex);
      resetPrayerScrollState();
    },
    [resetPrayerScrollState]
  );
  const prayerSubtabContainerHeight = prayerSubtabsVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 70],
    extrapolate: 'clamp',
  });
  const prayerTabBarOpacity = prayerSubtabsVisibility.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.15, 1],
    extrapolate: 'clamp',
  });
  const prayerTabBarTranslateY = prayerSubtabsVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
    extrapolate: 'clamp',
  });
  const restoreRailOpacity = prayerSubtabsVisibility.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.35, 0],
    extrapolate: 'clamp',
  });
  const renderScene = ({ route }: { route: PrayerRoute }) => {
    switch (route.key) {
      case 'Wall':
        return (
          <WallComponent
            onScrollOffsetChange={handleWallScroll}
            onUserScrollStart={handleWallUserScrollStart}
          />
        );
      case 'Testimonies':
        return <TestimoniesComponent />;
      case 'Saved':
        return <PrayerWallSavedPrayersComponent />;
      case 'MyPrayers':
        return <PrayersComponent />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <TabView
          navigationState={{ index, routes }}
          swipeEnabled={false}
          renderScene={renderScene}
          sceneContainerStyle={{ marginBottom: spacing.x88 }}
          renderTabBar={() => {
            return (
              <Animated.View
                style={[
                  styles.tabBarContainer,
                  {
                    backgroundColor: colors.background,
                    height: prayerSubtabContainerHeight,
                  },
                ]}
              >
                <Animated.View
                  testID="prayer-subtab-rail"
                  pointerEvents={areSubtabsVisible ? 'auto' : 'none'}
                  style={{
                    opacity: prayerTabBarOpacity,
                    transform: [{ translateY: prayerTabBarTranslateY }],
                  }}
                >
                  <GlassTabBar
                    tabs={routes.map((route) => route.title)}
                    activeIndex={index}
                    onTabChange={applyTabIndex}
                  />
                </Animated.View>

                <Animated.View
                  testID="prayer-subtab-restore-rail"
                  pointerEvents={areSubtabsVisible ? 'none' : 'auto'}
                  style={[styles.restoreRailWrap, { opacity: restoreRailOpacity }]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      resetPrayerScrollState();
                    }}
                    style={styles.restoreRailButton}
                  >
                    <View
                      style={[
                        styles.restoreRail,
                        {
                          backgroundColor: dark
                            ? 'rgba(255, 255, 255, 0.38)'
                            : 'rgba(3, 47, 60, 0.22)',
                        },
                      ]}
                    />
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            );
          }}
          onIndexChange={applyTabIndex}
          style={{ flex: 1, backgroundColor: colors.background }}
        />
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Prayer');
          }}
          style={shareButtonStyle}
        >
          <StyledText
            style={{
              color: Colors.primarySapphire.brand,
              textDecorationLine: 'underline',
            }}
          >
            Share a Prayer 🙏
          </StyledText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    paddingHorizontal: spacing.x5,
    paddingTop: spacing.x8,
    overflow: 'hidden',
    zIndex: 5,
    elevation: 5,
  },
  restoreRailWrap: {
    position: 'absolute',
    left: spacing.x5,
    right: spacing.x5,
    bottom: 0,
    alignItems: 'center',
  },
  restoreRailButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 14,
  },
  restoreRail: {
    width: 42,
    height: 4,
    borderRadius: 999,
  },
});

export default Prayer;
