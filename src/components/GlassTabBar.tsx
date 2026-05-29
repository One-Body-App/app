import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Pressable, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@react-navigation/native';

import StyledText from '@/components/styled/Text';
import { HapticService } from '@/src/services/haptic';
import { Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import {
  getConnectGlassTabTransition,
  type ConnectGlassTabLayout,
} from '@/src/screens/connectportal/glassTabBarMotion';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GlassTab = string | { key: string; label: string };

export type GlassTabBarProps = {
  tabs: GlassTab[];
  activeIndex: number;
  onTabChange: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  renderLabel?: (tab: GlassTab, index: number, isActive: boolean) => React.ReactNode;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getTabKey = (tab: GlassTab, index: number): string =>
  typeof tab === 'string' ? `${index}` : tab.key;

const getTabLabel = (tab: GlassTab): string => (typeof tab === 'string' ? tab : tab.label);

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

function useGlassTabBarPalette() {
  const { dark } = useTheme();

  return useMemo(
    () => ({
      isDark: dark,
      glassFallback: dark ? 'rgba(14,19,26,0.9)' : 'rgba(248,251,252,0.96)',
      liquidShellOuter: dark ? 'rgba(16,22,30,0.38)' : 'rgba(246,249,251,0.96)',
      liquidShell: dark ? 'rgba(20,27,35,0.78)' : 'rgba(255,255,255,0.94)',
      liquidBorder: dark ? 'rgba(255,255,255,0.12)' : 'rgba(220,227,232,0.98)',
      liquidInnerBorder: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)',
      liquidShadow: dark ? '#000000' : '#032f3c',
      liquidShadowOpacity: dark ? 0.18 : 0.14,
      liquidTopHighlightStart: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.94)',
      liquidTopHighlightEnd: dark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0)',
      liquidBottomCausticStart: dark ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0)',
      liquidBottomCausticEnd: dark ? 'rgba(153,192,205,0.06)' : 'rgba(236,240,243,0.32)',
      liquidShellTint: dark ? 'rgba(192,220,232,0.035)' : 'rgba(255,255,255,0.14)',
      liquidPillFill: dark ? 'rgba(235,243,247,0.12)' : 'rgba(255,255,255,0.98)',
      liquidPillMovingFill: dark ? 'rgba(246,252,255,0.16)' : 'rgba(255,255,255,1)',
      liquidPillToneStart: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.84)',
      liquidPillToneEnd: dark ? 'rgba(170,196,207,0.06)' : 'rgba(236,241,244,0.42)',
      liquidPillBorder: dark ? 'rgba(255,255,255,0.18)' : 'rgba(230,235,239,0.98)',
      liquidPillShadow: dark ? '#000000' : '#032f3c',
      liquidPillShadowOpacity: dark ? 0.16 : 0.14,
      liquidPillHighlightStart: dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.96)',
      liquidPillHighlightEnd: dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.3)',
      liquidTabText: dark ? 'rgba(245,249,251,0.96)' : '#032f3c',
      liquidTabTextMuted: dark ? 'rgba(230,234,236,0.46)' : '#032f3c',
      liquidMotionGlow: dark ? 'rgba(245,252,255,0.12)' : 'rgba(255,255,255,0.72)',
      liquidDropletHead: dark ? 'rgba(246,252,255,0.24)' : 'rgba(255,255,255,0.98)',
      liquidDropletTail: dark ? 'rgba(220,235,242,0.12)' : 'rgba(255,255,255,0.68)',
      liquidDropletCore: dark ? 'rgba(228,243,249,0.1)' : 'rgba(255,255,255,0.92)',
      liquidEdgeSweepStart: dark ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0)',
      liquidEdgeSweepMid: dark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.96)',
      liquidEdgeSweepEnd: dark ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0)',
      liquidEdgeRimStart: dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.92)',
      liquidEdgeRimEnd: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
    }),
    [dark]
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GlassTabBar({
  tabs,
  activeIndex,
  onTabChange,
  style,
  renderLabel,
}: GlassTabBarProps) {
  const palette = useGlassTabBarPalette();
  const tabCount = tabs.length;

  // Layout tracking --------------------------------------------------------
  const [tabLayouts, setTabLayouts] = useState<ConnectGlassTabLayout[]>(() =>
    tabs.map(() => ({ x: 0, width: 0 }))
  );

  // Animated values --------------------------------------------------------
  const translateX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;
  const pillScaleY = useRef(new Animated.Value(1)).current;
  const labelProgress = useRef(new Animated.Value(activeIndex)).current;
  const liquidMotionProgress = useRef(new Animated.Value(0)).current;
  const runningAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const animationToken = useRef(0);
  const hasInitialized = useRef(false);
  const [travelDirection, setTravelDirection] = useState<1 | -1>(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const allTabsMeasured = tabLayouts.every((l) => l.width > 0);
  const rowWidth = tabLayouts.reduce((max, l) => Math.max(max, l.x + l.width), 0);

  // Animation helpers ------------------------------------------------------
  const stopLiquidAnimations = useCallback(
    (
      callback: (state: {
        x: number;
        width: number;
        scaleY: number;
        labelValue: number;
        motionValue: number;
      }) => void
    ) => {
      runningAnimation.current?.stop();
      runningAnimation.current = null;

      let pending = 5;
      const nextState = {
        x: 0,
        width: 0,
        scaleY: 1,
        labelValue: activeIndex,
        motionValue: 0,
      };
      const resolve = () => {
        pending -= 1;
        if (pending === 0) {
          callback(nextState);
        }
      };

      translateX.stopAnimation((value) => {
        nextState.x = value;
        resolve();
      });
      pillWidth.stopAnimation((value) => {
        nextState.width = value;
        resolve();
      });
      pillScaleY.stopAnimation((value) => {
        nextState.scaleY = value;
        resolve();
      });
      labelProgress.stopAnimation((value) => {
        nextState.labelValue = value;
        resolve();
      });
      liquidMotionProgress.stopAnimation((value) => {
        nextState.motionValue = value;
        resolve();
      });
    },
    [activeIndex, labelProgress, liquidMotionProgress, pillScaleY, pillWidth, translateX]
  );

  const lastAnimatedIndex = useRef(activeIndex);

  const snapToIndex = useCallback(
    (index: number) => {
      const layout = tabLayouts[index];
      if (!layout?.width) return;
      translateX.setValue(layout.x);
      pillWidth.setValue(layout.width);
      pillScaleY.setValue(1);
      labelProgress.setValue(index);
      liquidMotionProgress.setValue(0);
    },
    [labelProgress, liquidMotionProgress, pillScaleY, pillWidth, tabLayouts, translateX]
  );

  const animateToIndex = useCallback(
    (toIndex: number) => {
      const toLayout = tabLayouts[toIndex];
      if (!toLayout?.width) return;

      stopLiquidAnimations((currentState) => {
        const fromLayout: ConnectGlassTabLayout = {
          x: currentState.x,
          width: currentState.width || toLayout.width,
        };
        const transition = getConnectGlassTabTransition({
          fromLayout,
          toLayout,
          shellWidth: rowWidth,
        });

        if (transition.isNoOp) {
          translateX.setValue(transition.settleX);
          pillWidth.setValue(transition.settleWidth);
          pillScaleY.setValue(1);
          labelProgress.setValue(toIndex);
          liquidMotionProgress.setValue(0);
          setIsTransitioning(false);
          return;
        }

        const nextDirection = transition.movingRight ? 1 : -1;
        const surgeWidth = transition.surgeWidth + 18;
        const surgeX =
          nextDirection === 1 ? transition.surgeX : Math.max(0, transition.surgeX - 12);
        const runToken = animationToken.current + 1;
        animationToken.current = runToken;
        setTravelDirection(nextDirection);
        setIsTransitioning(true);

        translateX.setValue(transition.initialX);
        pillWidth.setValue(transition.initialWidth);
        pillScaleY.setValue(currentState.scaleY);
        labelProgress.setValue(currentState.labelValue);
        liquidMotionProgress.setValue(currentState.motionValue);

        const surgePhase = Animated.parallel([
          Animated.timing(translateX, {
            toValue: surgeX,
            duration: 210,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(pillWidth, {
            toValue: surgeWidth,
            duration: 220,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false,
          }),
          Animated.timing(pillScaleY, {
            toValue: 0.62,
            duration: 190,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false,
          }),
          Animated.timing(liquidMotionProgress, {
            toValue: 1,
            duration: 170,
            easing: Easing.out(Easing.exp),
            useNativeDriver: false,
          }),
        ]);

        const settlePhase = Animated.parallel([
          Animated.timing(translateX, {
            toValue: transition.settleX,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(pillWidth, {
            toValue: transition.settleWidth,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.spring(pillScaleY, {
            toValue: 1,
            tension: 130,
            friction: 7,
            useNativeDriver: false,
          }),
          Animated.timing(liquidMotionProgress, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]);

        runningAnimation.current = Animated.parallel([
          Animated.sequence([surgePhase, settlePhase]),
          Animated.timing(labelProgress, {
            toValue: toIndex,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]);

        runningAnimation.current.start(({ finished }) => {
          if (animationToken.current !== runToken) return;
          setIsTransitioning(false);
          if (finished) {
            HapticService.trigger('selection');
          }
          runningAnimation.current = null;
        });
      });
    },
    [
      labelProgress,
      liquidMotionProgress,
      pillScaleY,
      pillWidth,
      rowWidth,
      stopLiquidAnimations,
      tabLayouts,
      translateX,
    ]
  );

  // Tab press handler ------------------------------------------------------
  const handleTabPress = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      lastAnimatedIndex.current = index;
      if (hasInitialized.current) {
        animateToIndex(index);
      }
      onTabChange(index);
    },
    [activeIndex, animateToIndex, onTabChange]
  );

  // Sync pill for external activeIndex changes
  if (lastAnimatedIndex.current !== activeIndex && hasInitialized.current && allTabsMeasured) {
    lastAnimatedIndex.current = activeIndex;
    snapToIndex(activeIndex);
  }

  // Interpolations ---------------------------------------------------------
  const motionGlowOpacity = liquidMotionProgress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.95, 0.22],
    extrapolate: 'clamp',
  });
  const motionGlowScaleX = liquidMotionProgress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.94, 1.38, 1.12],
    extrapolate: 'clamp',
  });
  const dropletHeadScale = liquidMotionProgress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0.84, 1.68, 1.08],
    extrapolate: 'clamp',
  });
  const dropletHeadOpacity = liquidMotionProgress.interpolate({
    inputRange: [0, 0.12, 0.9, 1],
    outputRange: [0, 0.92, 0.92, 0.2],
    extrapolate: 'clamp',
  });
  const dropletTailScaleX = liquidMotionProgress.interpolate({
    inputRange: [0, 0.28, 0.7, 1],
    outputRange: [0.76, 1.95, 2.7, 1.14],
    extrapolate: 'clamp',
  });
  const dropletTailScaleY = liquidMotionProgress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.9, 0.68, 0.9],
    extrapolate: 'clamp',
  });
  const dropletTailOpacity = liquidMotionProgress.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0, 0.88, 0.28],
    extrapolate: 'clamp',
  });
  const pillLift = liquidMotionProgress.interpolate({
    inputRange: [0, 0.25, 0.8, 1],
    outputRange: [0, -2, -1, 0],
    extrapolate: 'clamp',
  });
  const motionSheenTranslate = liquidMotionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [travelDirection * -14, travelDirection * 14],
    extrapolate: 'clamp',
  });
  const edgeSweepOpacity = liquidMotionProgress.interpolate({
    inputRange: [0, 0.14, 0.5, 1],
    outputRange: [0, 0.96, 0.72, 0.08],
    extrapolate: 'clamp',
  });
  const edgeSweepScaleX = liquidMotionProgress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.84, 1.2, 1.05],
    extrapolate: 'clamp',
  });
  const edgeSweepTranslate = liquidMotionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [travelDirection * -20, travelDirection * 20],
    extrapolate: 'clamp',
  });
  const rimOpacity = liquidMotionProgress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.5, 0.92, 0.28],
    extrapolate: 'clamp',
  });
  const innerBlurOpacity = liquidMotionProgress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0.68, 0.94, 0.58],
    extrapolate: 'clamp',
  });

  // Render -----------------------------------------------------------------
  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: palette.liquidShellOuter,
          borderColor: palette.liquidBorder,
          boxShadow: `0 12px 18px ${
            palette.isDark
              ? `rgba(0, 0, 0, ${palette.liquidShadowOpacity})`
              : `rgba(3, 47, 60, ${palette.liquidShadowOpacity})`
          }`,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.shellInner,
          {
            backgroundColor: palette.liquidShell,
            borderColor: palette.liquidInnerBorder,
          },
        ]}
      >
        <BlurView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          blurType={palette.isDark ? 'dark' : 'light'}
          blurAmount={26}
          reducedTransparencyFallbackColor={palette.glassFallback}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[palette.liquidTopHighlightStart, palette.liquidTopHighlightEnd]}
          locations={[0, 1]}
          style={styles.topReflection}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[palette.liquidBottomCausticStart, palette.liquidBottomCausticEnd]}
          locations={[0, 1]}
          style={styles.bottomCaustic}
        />
        <View
          style={[styles.overlay, { backgroundColor: palette.liquidShellTint }]}
          pointerEvents="none"
        />

        {/* Active pill */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            isTransitioning ? styles.activePillMoving : null,
            {
              backgroundColor: isTransitioning
                ? palette.liquidPillMovingFill
                : palette.liquidPillFill,
              borderColor: palette.liquidPillBorder,
              boxShadow: `0 ${isTransitioning ? 10 : 8}px ${isTransitioning ? 18 : 14}px ${
                palette.isDark
                  ? `rgba(0, 0, 0, ${isTransitioning ? 0.2 : palette.liquidPillShadowOpacity})`
                  : `rgba(3, 47, 60, ${isTransitioning ? 0.2 : palette.liquidPillShadowOpacity})`
              }`,
            },
            {
              width: pillWidth,
              transform: [{ translateX }, { translateY: pillLift }, { scaleY: pillScaleY }],
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.activePillInnerBlurWrap, { opacity: innerBlurOpacity }]}
          >
            <BlurView
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              blurType={palette.isDark ? 'dark' : 'light'}
              blurAmount={palette.isDark ? 18 : 26}
              reducedTransparencyFallbackColor={palette.glassFallback}
            />
          </Animated.View>
          <LinearGradient
            pointerEvents="none"
            colors={[palette.liquidPillToneStart, palette.liquidPillToneEnd]}
            locations={[0, 1]}
            style={styles.activePillTone}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[palette.liquidPillHighlightStart, palette.liquidPillHighlightEnd]}
            locations={[0, 1]}
            style={styles.activePillHighlight}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.activePillEdgeRim, { opacity: rimOpacity }]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={[palette.liquidEdgeRimStart, palette.liquidEdgeRimEnd]}
              locations={[0, 1]}
              style={StyleSheet.absoluteFill}
              start={{ x: travelDirection === 1 ? 0 : 1, y: 0.1 }}
              end={{ x: travelDirection === 1 ? 1 : 0, y: 0.9 }}
            />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activePillEdgeSweepWrap,
              {
                opacity: edgeSweepOpacity,
                transform: [{ translateX: edgeSweepTranslate }, { scaleX: edgeSweepScaleX }],
              },
            ]}
          >
            <AnimatedLinearGradient
              pointerEvents="none"
              colors={[
                palette.liquidEdgeSweepStart,
                palette.liquidEdgeSweepMid,
                palette.liquidEdgeSweepEnd,
              ]}
              locations={[0, 0.5, 1]}
              style={styles.activePillEdgeSweep}
              start={{ x: travelDirection === 1 ? 0 : 1, y: 0.15 }}
              end={{ x: travelDirection === 1 ? 1 : 0, y: 0.85 }}
            />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activePillMotionGlow,
              {
                backgroundColor: palette.liquidMotionGlow,
                opacity: motionGlowOpacity,
                transform: [{ scaleX: motionGlowScaleX }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activePillDropletTail,
              travelDirection === 1
                ? styles.activePillDropletTailRight
                : styles.activePillDropletTailLeft,
              {
                backgroundColor: palette.liquidDropletTail,
                opacity: dropletTailOpacity,
                transform: [{ scaleX: dropletTailScaleX }, { scaleY: dropletTailScaleY }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activePillDropletHead,
              travelDirection === 1
                ? styles.activePillDropletHeadRight
                : styles.activePillDropletHeadLeft,
              {
                backgroundColor: palette.liquidDropletHead,
                opacity: dropletHeadOpacity,
                transform: [{ scale: dropletHeadScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activePillDropletCore,
              {
                backgroundColor: palette.liquidDropletCore,
                opacity: motionGlowOpacity,
                transform: [{ translateX: motionSheenTranslate }],
              },
            ]}
          />
        </Animated.View>

        {/* Tab row */}
        <View style={styles.tabRow}>
          {tabs.map((tab, index) => {
            const activeOpacity = labelProgress.interpolate({
              inputRange: [index - 0.8, index, index + 0.8],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            });
            const activeScale = labelProgress.interpolate({
              inputRange: [index - 0.8, index, index + 0.8],
              outputRange: [0.97, 1, 0.97],
              extrapolate: 'clamp',
            });

            return (
              <Pressable
                key={getTabKey(tab, index)}
                onPress={() => handleTabPress(index)}
                style={styles.tabButton}
                onLayout={(event) => {
                  const { x, width } = event.nativeEvent.layout;
                  setTabLayouts((previous) => {
                    const existing = previous[index];
                    if (existing?.x === x && existing?.width === width) {
                      return previous;
                    }

                    const next = [...previous];
                    next[index] = { x, width };

                    const nowAllMeasured = next.every((l) => l.width > 0);
                    if (nowAllMeasured && !hasInitialized.current) {
                      hasInitialized.current = true;
                      const layout = next[activeIndex];
                      translateX.setValue(layout.x);
                      pillWidth.setValue(layout.width);
                      pillScaleY.setValue(1);
                      labelProgress.setValue(activeIndex);
                      liquidMotionProgress.setValue(0);
                    }

                    return next;
                  });
                }}
              >
                {renderLabel ? (
                  renderLabel(tab, index, index === activeIndex)
                ) : (
                  <View style={styles.tabLabelWrap}>
                    <Animated.View
                      style={[
                        styles.tabTextBaseLayer,
                        {
                          opacity: activeOpacity.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0],
                          }),
                        },
                      ]}
                    >
                      <StyledText
                        style={[styles.tabText, { color: palette.liquidTabTextMuted }]}
                        numberOfLines={1}
                      >
                        {getTabLabel(tab)}
                      </StyledText>
                    </Animated.View>
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.tabTextActiveLayer,
                        {
                          opacity: activeOpacity,
                          transform: [{ scale: activeScale }],
                        },
                      ]}
                    >
                      <StyledText
                        style={[
                          styles.tabText,
                          styles.tabTextActive,
                          { color: palette.liquidTabText },
                        ]}
                        numberOfLines={1}
                      >
                        {getTabLabel(tab)}
                      </StyledText>
                    </Animated.View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(232,240,244,0.92)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  shellInner: {
    margin: 1,
    borderRadius: 25,
    overflow: 'hidden',
    padding: 5,
    borderWidth: 1,
  },
  topReflection: {
    position: 'absolute',
    top: 1,
    left: 8,
    right: 8,
    height: '26%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    zIndex: 1,
  },
  bottomCaustic: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 1,
    height: '20%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  activePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 5,
    borderRadius: 18,
    backgroundColor: 'rgba(65,137,159,0.26)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.98)',
    overflow: 'hidden',
  },
  activePillMoving: {},
  activePillTone: {
    ...StyleSheet.absoluteFillObject,
  },
  activePillInnerBlurWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  activePillHighlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: '32%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  activePillEdgeRim: {
    position: 'absolute',
    top: 1,
    bottom: 1,
    left: 1,
    right: 1,
    borderRadius: 17,
    overflow: 'hidden',
  },
  activePillEdgeSweepWrap: {
    position: 'absolute',
    top: '10%',
    bottom: '10%',
    left: '2%',
    right: '2%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  activePillEdgeSweep: {
    ...StyleSheet.absoluteFillObject,
  },
  activePillMotionGlow: {
    position: 'absolute',
    top: '24%',
    bottom: '24%',
    left: '12%',
    right: '12%',
    borderRadius: 999,
  },
  activePillDropletHead: {
    position: 'absolute',
    top: '12%',
    bottom: '12%',
    width: 22,
    borderRadius: 999,
    boxShadow: '0 0 7px rgba(255, 255, 255, 0.18)',
  },
  activePillDropletHeadLeft: {
    left: 6,
  },
  activePillDropletHeadRight: {
    right: 6,
  },
  activePillDropletTail: {
    position: 'absolute',
    top: '26%',
    bottom: '26%',
    width: 16,
    borderRadius: 999,
  },
  activePillDropletTailLeft: {
    right: 12,
  },
  activePillDropletTailRight: {
    left: 12,
  },
  activePillDropletCore: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '28%',
    alignSelf: 'center',
    borderRadius: 999,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x8,
  },
  tabLabelWrap: {
    height: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabTextBaseLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTextActiveLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(230,234,236,0.7)',
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  tabTextActive: {
    fontFamily: 'Rubik-SemiBold',
    fontWeight: '600',
  },
});
