import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  Platform,
  Animated,
  Easing,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useFocusEffect } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { StackScreenProps } from '@react-navigation/stack';
import { SettingsStackParamsList } from '@/src/navigator/types';
import {
  APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  APP_HEADER_SIDE_WIDTH,
} from '@/src/styles/headerLayout';

type Props = StackScreenProps<SettingsStackParamsList, 'CreatorSuccess'>;

const CONFETTI_COUNT = 90;
const CONFETTI_EXPLOSION_SPEED = 350;
const CONFETTI_FALL_SPEED = 2600;
const CONFETTI_POST_BLAST_BUFFER_MS = 100;
const CONFETTI_REVEAL_DELAY_MS = CONFETTI_EXPLOSION_SPEED + CONFETTI_POST_BLAST_BUFFER_MS;
const PULSE_STEP_DURATION_MS = 18000;
const CONFETTI_COLORS = [
  '#032F3C',
  '#126B87',
  '#41899F',
  '#71A6B7',
  '#12D2D9',
  '#41DBE1',
  '#89E9EC',
  '#E6EAEC',
];

// --- Dynamic Brand Palette ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#032F3C' : '#FFFFFF',
  surface: isDark ? 'rgba(11, 60, 74, 0.6)' : '#F2F3F3',
  surfaceBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E6EAEC',
  primary: '#126B87',
  accent: '#12D2D9',
  textMain: isDark ? '#FFFFFF' : '#032F3C',
  textMuted: isDark ? '#81979E' : '#68828A',
  circleBorder: isDark ? 'rgba(18, 210, 217, 0.15)' : 'rgba(18, 107, 135, 0.15)',
  headerBg: isDark ? 'rgba(3, 47, 60, 0.9)' : 'rgba(255, 255, 255, 0.9)',
});

function CreatorSubmitSuccess({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const colors = getThemeColors(isDark);
  const { width } = useWindowDimensions();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showDelayedSuccessMark, setShowDelayedSuccessMark] = useState(false);
  const [iconCenter, setIconCenter] = useState<{ x: number; y: number } | null>(null);
  const [isCelebrationActive, setIsCelebrationActive] = useState(false);
  const [focusCycle, setFocusCycle] = useState(0);

  const clearRevealTimeout = useCallback(() => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const stopPulseLoop = useCallback(() => {
    pulseLoopRef.current?.stop();
    pulseLoopRef.current = null;
    pulseAnim.stopAnimation();
    pulseAnim.setValue(0);
  }, [pulseAnim]);

  const startPulseLoop = useCallback(() => {
    stopPulseLoop();
    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: PULSE_STEP_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: PULSE_STEP_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current.start();
  }, [pulseAnim, stopPulseLoop]);

  const resetCelebration = useCallback(() => {
    clearRevealTimeout();
    stopPulseLoop();
    setShowDelayedSuccessMark(false);
    setIsCelebrationActive(false);
  }, [clearRevealTimeout, stopPulseLoop]);

  useFocusEffect(
    useCallback(() => {
      resetCelebration();
      setIsCelebrationActive(true);
      setFocusCycle((value) => value + 1);

      return () => {
        resetCelebration();
      };
    }, [resetCelebration])
  );

  const handleConfettiStart = useCallback(() => {
    clearRevealTimeout();
    revealTimeoutRef.current = setTimeout(() => {
      setShowDelayedSuccessMark(true);
      startPulseLoop();
    }, CONFETTI_REVEAL_DELAY_MS);
  }, [clearRevealTimeout, startPulseLoop]);

  const handleIconStageLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
    const nextCenter = {
      x: x + layoutWidth / 2,
      y: y + layoutHeight / 2,
    };

    setIconCenter((current) => {
      if (current && current.x === nextCenter.x && current.y === nextCenter.y) {
        return current;
      }

      return nextCenter;
    });
  }, []);

  // Interpolations for a radiating ripple effect
  const checkmarkScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1],
  });

  const circleSmallScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  const circleMediumScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });

  const circleLargeScale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  const circleOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.6, 1],
  });

  const onReturnHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as any }],
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.headerBg, borderBottomColor: colors.surfaceBorder },
        ]}
      >
        <View style={styles.headerSideSlot}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color={colors.textMain} />
          </Pressable>
        </View>
        {Platform.OS === 'ios' ? (
          <View style={styles.headerCenterWrap} pointerEvents="none">
            <Text style={[styles.headerTitle, { color: colors.textMain }]}>
              Creator Application
            </Text>
          </View>
        ) : (
          <View style={styles.headerTitleAndroidWrap}>
            <Text style={[styles.headerTitle, { color: colors.textMain }]}>
              Creator Application
            </Text>
          </View>
        )}
        <View style={styles.headerSideSlot} />
      </View>

      <View style={styles.mainContent}>
        {isCelebrationActive && iconCenter && focusCycle > 0 ? (
          <View
            style={styles.confettiLayer}
            pointerEvents="none"
            testID="creator-success-confetti-host"
          >
            <ConfettiCannon
              key={focusCycle}
              autoStart
              colors={CONFETTI_COLORS}
              count={CONFETTI_COUNT}
              explosionSpeed={CONFETTI_EXPLOSION_SPEED}
              fadeOut
              fallSpeed={CONFETTI_FALL_SPEED}
              onAnimationStart={handleConfettiStart}
              origin={iconCenter}
            />
          </View>
        ) : null}

        {showDelayedSuccessMark ? (
          <View
            style={styles.circlesWrapper}
            pointerEvents="none"
            testID="creator-success-pulse-rings"
          >
            <Animated.View
              style={[
                styles.circleLarge,
                {
                  width: width * 1.5,
                  height: width * 1.5,
                  borderRadius: width * 0.75,
                },
                {
                  borderColor: colors.circleBorder,
                  transform: [{ scale: circleLargeScale }],
                  opacity: circleOpacity,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.circleMedium,
                  {
                    width,
                    height: width,
                    borderRadius: width * 0.5,
                  },
                  {
                    borderColor: colors.circleBorder,
                    transform: [{ scale: circleMediumScale }],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.circleSmall,
                    {
                      width: width * 0.5,
                      height: width * 0.5,
                      borderRadius: width * 0.25,
                    },
                    {
                      borderColor: colors.circleBorder,
                      transform: [{ scale: circleSmallScale }],
                    },
                  ]}
                />
              </Animated.View>
            </Animated.View>
          </View>
        ) : null}

        {/* Abstract background watermark */}
        <View style={styles.watermarkWrapper} pointerEvents="none">
          <MaterialCommunityIcons name="account-group" size={400} color={colors.accent} />
        </View>

        <View style={styles.successVisualContainer}>
          <View
            onLayout={handleIconStageLayout}
            style={styles.iconStage}
            testID="creator-success-icon-stage"
          >
            {showDelayedSuccessMark ? (
              <Animated.View
                style={[
                  styles.iconGlow,
                  {
                    backgroundColor: colors.accent,
                    transform: [{ scale: checkmarkScale }],
                  },
                ]}
                testID="creator-success-delayed-checkmark"
              >
                <MaterialCommunityIcons name="check-bold" size={60} color={colors.background} />
              </Animated.View>
            ) : null}
          </View>

          <View style={styles.textContainer}>
            <View
              style={[
                styles.missionPill,
                {
                  backgroundColor: isDark ? 'rgba(18, 210, 217, 0.1)' : 'rgba(18, 210, 217, 0.2)',
                  borderColor: colors.circleBorder,
                },
              ]}
            >
              <Text style={[styles.missionPillText, { color: colors.accent }]}>
                PROFILE REVIEW IN PROGRESS
              </Text>
            </View>
            <Text style={[styles.mainHeading, { color: colors.textMain }]}>
              Application Received!
            </Text>
            <Text style={[styles.subHeading, { color: colors.textMuted }]}>
              Thank you for your heart to serve the One Body community. Our team is reviewing your
              application to ensure alignment with our shared mission. Expect an update within 24-48
              hours.
            </Text>
          </View>
        </View>

        {/* Secondary Info Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <View
            style={[
              styles.infoIconWrapper,
              { backgroundColor: isDark ? 'rgba(18, 107, 135, 0.3)' : 'rgba(18, 210, 217, 0.2)' },
            ]}
          >
            <MaterialCommunityIcons name="auto-fix" size={24} color={colors.accent} />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={[styles.infoTitle, { color: colors.textMain }]}>
              May God bless your ministry!
            </Text>
            <Text style={[styles.infoSub, { color: colors.textMuted }]}>
              We look forward to partnering with you to build the Kingdom!
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Action Shell */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder },
        ]}
      >
        <Pressable
          style={[styles.returnButton, { backgroundColor: colors.primary }]}
          onPress={onReturnHome}
        >
          <Text style={[styles.returnButtonText, { color: '#FFFFFF' }]}>Go Home</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    minHeight: APP_HEADER_ROW_HEIGHT,
    borderBottomWidth: 1,
    zIndex: 10,
    transform: [{ translateY: APP_HEADER_ROW_OFFSET }],
  },
  headerSideSlot: {
    minWidth: APP_HEADER_SIDE_WIDTH + 40,
    minHeight: APP_HEADER_ROW_HEIGHT,
    justifyContent: 'center',
  },
  headerCenterWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 24 + APP_HEADER_SIDE_WIDTH,
    right: 24 + APP_HEADER_SIDE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleAndroidWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Rubik-Bold',
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: Platform.OS === 'android' ? 'left' : 'center',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  circlesWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '10%',
    zIndex: 1,
  },
  circleLarge: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleMedium: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSmall: {
    borderWidth: 1,
  },
  watermarkWrapper: {
    position: 'absolute',
    right: -100,
    top: '15%',
    opacity: 0.03,
  },
  successVisualContainer: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 2,
  },
  iconStage: {
    width: 120,
    height: 120,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#12D2D9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  missionPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  missionPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    zIndex: 2,
  },
  infoIconWrapper: {
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: Platform.OS === 'ios' ? 32 : 24,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    borderRadius: 28,
  },
  returnButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginRight: 8,
  },
});

export default CreatorSubmitSuccess;
