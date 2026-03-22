import { useCallback, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SpringboardPreset } from '@/src/navigator/motionPolicy';

type UseSpringboardEntryOptions = {
  initialOffsetY?: number;
  initialScale?: number;
  initialDelayMs?: number;
  preset?: SpringboardPreset;
  staggerMs?: number;
};

export default function useSpringboardEntry(
  replayToken: number,
  sectionCount: number,
  options?: UseSpringboardEntryOptions
) {
  const preset = options?.preset ?? 'full';
  const initialOffsetY = options?.initialOffsetY ?? (preset === 'lite' ? 10 : 22);
  const initialScale =
    options?.initialScale ?? (preset === 'full' ? (Platform.OS === 'android' ? 0.992 : 0.985) : 1);
  const initialDelayMs = options?.initialDelayMs ?? (preset === 'lite' ? 140 : 480);
  const staggerMs = options?.staggerMs ?? (Platform.OS === 'android' ? 40 : 55);
  const valuesRef = useRef<Animated.Value[]>([]);
  const lastHandledReplayTokenRef = useRef(0);
  const runningAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  while (valuesRef.current.length < sectionCount) {
    valuesRef.current.push(new Animated.Value(1));
  }

  useFocusEffect(
    useCallback(() => {
      const animatedValues = valuesRef.current.slice(0, sectionCount);

      if (preset === 'off') {
        runningAnimationRef.current?.stop();
        animatedValues.forEach((value) => value.setValue(1));
        return () => {
          runningAnimationRef.current?.stop();
          runningAnimationRef.current = null;
        };
      }

      if (!replayToken || replayToken === lastHandledReplayTokenRef.current) {
        return undefined;
      }

      lastHandledReplayTokenRef.current = replayToken;
      runningAnimationRef.current?.stop();
      animatedValues.forEach((value) => value.setValue(0));
      const valuesToAnimate = preset === 'lite' ? animatedValues.slice(0, 1) : animatedValues;

      runningAnimationRef.current = Animated.sequence([
        Animated.delay(initialDelayMs),
        Animated.stagger(
          preset === 'lite' ? 0 : staggerMs,
          valuesToAnimate.map((value) =>
            preset === 'lite' || Platform.OS === 'android'
              ? Animated.timing(value, {
                  toValue: 1,
                  duration: preset === 'lite' ? 180 : 220,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                })
              : Animated.spring(value, {
                  toValue: 1,
                  damping: 18,
                  mass: 0.92,
                  stiffness: 210,
                  useNativeDriver: true,
                })
          )
        ),
      ]);
      runningAnimationRef.current.start(() => {
        animatedValues.forEach((value) => value.setValue(1));
        runningAnimationRef.current = null;
      });

      return () => {
        runningAnimationRef.current?.stop();
        runningAnimationRef.current = null;
      };
    }, [initialDelayMs, preset, replayToken, sectionCount, staggerMs])
  );

  const getSpringboardStyle = useCallback(
    (index: number) => {
      if (preset === 'off' || (preset === 'lite' && index > 0)) {
        return undefined;
      }

      const value = valuesRef.current[Math.min(index, valuesRef.current.length - 1)];
      if (!value) {
        return undefined;
      }

      if (preset === 'lite') {
        return {
          opacity: value.interpolate({
            inputRange: [0, 1],
            outputRange: [0.72, 1],
          }),
        };
      }

      return {
        opacity: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.45, 1],
        }),
        transform: [
          {
            translateY: value.interpolate({
              inputRange: [0, 1],
              outputRange: [initialOffsetY, 0],
            }),
          },
          {
            scale: value.interpolate({
              inputRange: [0, 1],
              outputRange: [initialScale, 1],
            }),
          },
        ],
      };
    },
    [initialOffsetY, initialScale, preset]
  );

  return {
    getSpringboardStyle,
  };
}
