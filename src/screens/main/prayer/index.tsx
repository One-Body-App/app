import React from 'react';
import { Animated, Easing, Platform, StyleSheet, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState<PrayerRoute[]>([
    { key: 'Wall', title: 'Wall' },
    { key: 'Testimonies', title: 'Testimonies' },
    { key: 'Saved', title: 'Saved' },
    { key: 'MyPrayers', title: 'My Prayers' },
  ]);
  const [areSubtabsVisible, setAreSubtabsVisible] = React.useState(true);
  const areSubtabsVisibleRef = React.useRef(true);
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
    setSubtabsVisibility(true);
  }, [setSubtabsVisibility]);
  const handlePrayerScrollStart = React.useCallback(() => {
    setSubtabsVisibility(false);
  }, [setSubtabsVisibility]);
  const handlePrayerScrollEnd = React.useCallback(() => {
    setSubtabsVisibility(true);
  }, [setSubtabsVisibility]);

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
  const ctaRailHeight = spacing.x72 + insets.bottom;
  const shareButtonStyle = isIOS
    ? {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        minHeight: ctaRailHeight,
        paddingTop: spacing.x8,
        paddingBottom: Math.max(insets.bottom, spacing.x24),
        backgroundColor: colors.background,
        zIndex: 40,
        elevation: 40,
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
    outputRange: [0, 70],
    extrapolate: 'clamp',
  });
  const prayerTabBarOpacity = prayerSubtabsVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const prayerTabBarTranslateY = prayerSubtabsVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
    extrapolate: 'clamp',
  });
  const renderScene = React.useCallback(
    (route: PrayerRoute) => {
      switch (route.key) {
        case 'Wall':
          return (
            <WallComponent
              onUserScrollStart={handlePrayerScrollStart}
              onUserScrollEnd={handlePrayerScrollEnd}
            />
          );
        case 'Testimonies':
          return (
            <TestimoniesComponent
              onUserScrollStart={handlePrayerScrollStart}
              onUserScrollEnd={handlePrayerScrollEnd}
            />
          );
        case 'Saved':
          return (
            <PrayerWallSavedPrayersComponent
              onUserScrollStart={handlePrayerScrollStart}
              onUserScrollEnd={handlePrayerScrollEnd}
            />
          );
        case 'MyPrayers':
          return (
            <PrayersComponent
              onUserScrollStart={handlePrayerScrollStart}
              onUserScrollEnd={handlePrayerScrollEnd}
            />
          );
        default:
          return null;
      }
    },
    [handlePrayerScrollEnd, handlePrayerScrollStart]
  );

  const activeRoute = routes[index];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
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
        </Animated.View>
        <View
          testID="prayer-scene-container"
          style={{ flex: 1, marginBottom: ctaRailHeight, backgroundColor: colors.background }}
        >
          {renderScene(activeRoute)}
        </View>
        <Pressable
          testID="prayer-share-cta"
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
        </Pressable>
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
});

export default Prayer;
