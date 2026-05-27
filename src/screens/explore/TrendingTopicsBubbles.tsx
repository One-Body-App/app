import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import {
  getTopicMetrics,
  getTopicPalette,
  getTopicTier,
  TAP_ANIMATION_DURATION_MS,
  type TrendingTopicBubbleItem,
} from './TrendingTopicsBubbles.utils';

const SELECTED_BACKGROUND = '#41899f';
const SELECTED_TEXT = '#ffffff';
const SELECTED_SPLASH = 'rgba(65, 137, 159, 0.22)';

type TrendingTopicsBubblesProps = {
  topics: TrendingTopicBubbleItem[];
  onTopicPress: (topic: string) => void;
  style?: StyleProp<ViewStyle>;
};

type TopicPillProps = {
  item: TrendingTopicBubbleItem;
  minPopularity: number;
  maxPopularity: number;
  onTopicPress: (topic: string) => void;
  isDarkMode: boolean;
};

const TopicPill = memo(
  ({ item, minPopularity, maxPopularity, onTopicPress, isDarkMode }: TopicPillProps) => {
    const tier = useMemo(
      () => getTopicTier(item.popularity, minPopularity, maxPopularity),
      [item.popularity, maxPopularity, minPopularity]
    );
    const metrics = useMemo(() => getTopicMetrics(tier), [tier]);
    const palette = useMemo(() => getTopicPalette(tier, isDarkMode), [isDarkMode, tier]);
    const [isSelected, setIsSelected] = useState(false);
    const splashOpacity = useRef(new Animated.Value(0)).current;
    const splashScale = useRef(new Animated.Value(0.86)).current;
    const contentScale = useRef(new Animated.Value(1)).current;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isAnimatingRef = useRef(false);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const clearSelection = useCallback(() => {
      isAnimatingRef.current = false;
      setIsSelected(false);
    }, []);

    const handlePressIn = useCallback(() => {
      setIsSelected(true);
    }, []);

    const handlePressOut = useCallback(() => {
      if (!isAnimatingRef.current) {
        setIsSelected(false);
      }
    }, []);

    const handlePress = useCallback(() => {
      if (isAnimatingRef.current) {
        return;
      }

      isAnimatingRef.current = true;
      setIsSelected(true);
      splashOpacity.setValue(1);
      splashScale.setValue(0.86);
      contentScale.setValue(1);

      Animated.parallel([
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: TAP_ANIMATION_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(splashScale, {
          toValue: 1.15,
          duration: TAP_ANIMATION_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(contentScale, {
            toValue: 1.03,
            duration: 90,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(contentScale, {
            toValue: 1,
            duration: 90,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        onTopicPress(item.topic);
        clearSelection();
      }, TAP_ANIMATION_DURATION_MS);
    }, [clearSelection, contentScale, item.topic, onTopicPress, splashOpacity, splashScale]);

    const pillPalette = isSelected
      ? { backgroundColor: SELECTED_BACKGROUND, textColor: SELECTED_TEXT }
      : palette;

    return (
      <Pressable
        accessibilityRole="button"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.pill,
          {
            backgroundColor: pillPalette.backgroundColor,
            paddingHorizontal: metrics.paddingHorizontal,
            paddingVertical: metrics.paddingVertical,
          },
        ]}
        testID={`trending-topic-pressable-${item.id}`}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.splash,
            {
              backgroundColor: SELECTED_SPLASH,
              borderColor: SELECTED_BACKGROUND,
              opacity: splashOpacity,
              transform: [{ scale: splashScale }],
            },
          ]}
        />
        <Animated.View style={{ transform: [{ scale: contentScale }] }}>
          <Text
            style={[
              styles.pillText,
              {
                color: pillPalette.textColor,
                fontSize: metrics.fontSize,
                lineHeight: metrics.lineHeight,
                fontWeight: tier >= 3 ? '700' : '600',
              },
            ]}
          >
            {item.topic}
          </Text>
        </Animated.View>
      </Pressable>
    );
  }
);

TopicPill.displayName = 'TopicPill';

function TrendingTopicsBubbles({ topics, onTopicPress, style }: TrendingTopicsBubblesProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const normalizedTopics = useMemo(
    () => topics.filter((item) => item.topic.trim().length > 0),
    [topics]
  );
  const popularityValues = useMemo(
    () => normalizedTopics.map((item) => item.popularity).filter((value) => Number.isFinite(value)),
    [normalizedTopics]
  );
  const minPopularity = popularityValues.length > 0 ? Math.min(...popularityValues) : 1;
  const maxPopularity = popularityValues.length > 0 ? Math.max(...popularityValues) : 1;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [topics]);

  return (
    <View style={[styles.container, style]}>
      {normalizedTopics.map((item) => (
        <TopicPill
          key={item.id}
          isDarkMode={isDarkMode}
          item={item}
          maxPopularity={maxPopularity}
          minPopularity={minPopularity}
          onTopicPress={onTopicPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  pill: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 999,
  },
  pillText: {
    fontFamily: 'Rubik-Bold',
  },
  splash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
  },
});

export default TrendingTopicsBubbles;
