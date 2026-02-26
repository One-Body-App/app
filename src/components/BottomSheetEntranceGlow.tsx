import { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type BottomSheetEntranceGlowProps = {
  playKey: number;
  style?: StyleProp<ViewStyle>;
};

const GLOW_DURATION_MS = 700;
const GLOW_PEAK_MS = 220;
const GLOW_TRAVEL_DISTANCE = 118;
const GLOW_PEAK_OPACITY = 0.94;

function BottomSheetEntranceGlow({ playKey, style }: BottomSheetEntranceGlowProps) {
  const translateY = useSharedValue(GLOW_TRAVEL_DISTANCE);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    if (playKey < 1) {
      return;
    }

    translateY.value = GLOW_TRAVEL_DISTANCE;
    opacity.value = 0;
    scale.value = 0.92;

    translateY.value = withTiming(-12, {
      duration: GLOW_DURATION_MS,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    scale.value = withSequence(
      withTiming(1.06, {
        duration: GLOW_PEAK_MS,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(1, {
        duration: GLOW_DURATION_MS - GLOW_PEAK_MS,
        easing: Easing.out(Easing.quad),
      })
    );
    opacity.value = withSequence(
      withTiming(GLOW_PEAK_OPACITY, {
        duration: GLOW_PEAK_MS,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(0, {
        duration: GLOW_DURATION_MS - GLOW_PEAK_MS,
        easing: Easing.inOut(Easing.cubic),
      })
    );
  }, [opacity, playKey, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      <Animated.View style={[styles.glowLayer, animatedStyle]}>
        <LinearGradient
          colors={['rgba(3,47,60,0)', 'rgba(18,107,135,0.32)', 'rgba(18,210,217,0.56)']}
          locations={[0, 0.44, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.leftOrb} />
        <View style={styles.rightOrb} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 440,
    overflow: 'hidden',
  },
  glowLayer: {
    position: 'absolute',
    left: -88,
    right: -88,
    bottom: -196,
    height: 520,
    borderRadius: 260,
  },
  leftOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    left: 18,
    top: 86,
    backgroundColor: 'rgba(18,107,135,0.34)',
  },
  rightOrb: {
    position: 'absolute',
    width: 288,
    height: 288,
    borderRadius: 144,
    right: 12,
    top: 24,
    backgroundColor: 'rgba(18,210,217,0.34)',
  },
});

export default BottomSheetEntranceGlow;
