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

const BASE_FONT_SIZE = 14;
const BASE_LINE_HEIGHT = 18;
const BASE_PADDING_HORIZONTAL = 12;
const BASE_PADDING_VERTICAL = 6;

export const TAP_ANIMATION_DURATION_MS = 180;
export const TOPIC_TIER_SCALE = {
  1: 1,
  2: 1.1,
  3: 1.2,
  4: 1.3,
} as const;

const SELECTED_BACKGROUND = '#41899f';
const SELECTED_TEXT = '#ffffff';
const SELECTED_SPLASH = 'rgba(65, 137, 159, 0.22)';

type TopicPalette = {
  backgroundColor: string;
  textColor: string;
};

const LIGHT_TIER_PALETTE: Record<TrendingTopicTier, TopicPalette> = {
  1: { backgroundColor: '#e6eaec', textColor: '#3c4b64' },
  2: { backgroundColor: '#cdd5d8', textColor: '#126b87' },
  3: { backgroundColor: '#d0f6f7', textColor: '#032f3c' },
  4: { backgroundColor: '#89e9ec', textColor: '#000015' },
};

const DARK_TIER_PALETTE: Record<TrendingTopicTier, TopicPalette> = {
  1: { backgroundColor: '#355963', textColor: '#e6eaec' },
  2: { backgroundColor: '#4f6d77', textColor: '#e6eaec' },
  3: { backgroundColor: '#126b87', textColor: '#e6eaec' },
  4: { backgroundColor: '#41899f', textColor: '#ffffff' },
};

export type TrendingTopicTier = 1 | 2 | 3 | 4;

export type TrendingTopicBubbleItem = {
  id: string;
  topic: string;
  popularity: number;
};

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

export const TRENDING_TOPICS_MOCK_DATA: TrendingTopicBubbleItem[] = [
  { id: 'prayer-requests', topic: 'Prayer Requests', popularity: 96 },
  { id: 'local-missions', topic: 'Local Missions', popularity: 88 },
  { id: 'bible-study', topic: 'Bible Study', popularity: 84 },
  { id: 'worship', topic: 'Worship', popularity: 78 },
  { id: 'youth-ministry', topic: 'Youth Ministry', popularity: 68 },
  { id: 'apologetics', topic: 'Apologetics', popularity: 58 },
];

export const mapTrendingTopicResponse = (items: unknown[]): TrendingTopicBubbleItem[] =>
  (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const candidate = item as {
        _id?: string;
        id?: string;
        name?: string;
        title?: string;
        popularity?: number;
      };
      const topic = candidate?.name ?? candidate?.title ?? '';
      if (!topic) {
        return null;
      }

      return {
        id: candidate?._id ?? candidate?.id ?? `topic-${index}`,
        topic,
        popularity:
          typeof candidate?.popularity === 'number' && Number.isFinite(candidate.popularity)
            ? candidate.popularity
            : 1,
      };
    })
    .filter((item): item is TrendingTopicBubbleItem => item !== null);

export const getTopicTier = (
  popularity: number,
  minPopularity: number,
  maxPopularity: number
): TrendingTopicTier => {
  if (maxPopularity <= minPopularity) {
    return 1;
  }

  const normalized = (popularity - minPopularity) / (maxPopularity - minPopularity);
  if (normalized < 0.25) return 1;
  if (normalized < 0.55) return 2;
  if (normalized < 0.8) return 3;
  return 4;
};

export const getTopicScale = (tier: TrendingTopicTier) => TOPIC_TIER_SCALE[tier];

export const getTopicMetrics = (tier: TrendingTopicTier) => {
  const scale = getTopicScale(tier);
  return {
    scale,
    fontSize: BASE_FONT_SIZE * scale,
    lineHeight: BASE_LINE_HEIGHT * scale,
    paddingHorizontal: BASE_PADDING_HORIZONTAL * scale,
    paddingVertical: BASE_PADDING_VERTICAL * scale,
  };
};

export const getTopicPalette = (tier: TrendingTopicTier, isDarkMode: boolean) =>
  (isDarkMode ? DARK_TIER_PALETTE : LIGHT_TIER_PALETTE)[tier];

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
