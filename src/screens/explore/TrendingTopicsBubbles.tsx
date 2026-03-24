import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  type Simulation,
  type SimulationNodeDatum,
  forceCollide,
  forceSimulation,
  forceManyBody,
  forceX,
  forceY,
} from 'd3-force';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const BUBBLE_COLORS = ['#126b87', '#41899f', '#71a6b7', '#12d2d9', '#41dbe1'] as const;
const LIGHT_BACKGROUND = '#FFFFFF';
const DARK_BACKGROUND = '#000015';
const MIN_RADIUS = 38;
const MAX_RADIUS = 64;
const COLLISION_PADDING = 8;
const MAX_VISIBLE_BUBBLES = 18;
const CONTAINER_PADDING = 14;
const DEFAULT_HEIGHT = 420;
const DRAG_HOLD_MS = 180;
const TAP_SUPPRESSION_MS = 250;

type BubbleAnimatedState = Record<
  string,
  {
    x: number;
    y: number;
    scale: number;
    opacity: number;
    zIndex: number;
  }
>;

export type TrendingTopicBubbleItem = {
  id: string;
  topic: string;
  popularity: number;
};

type BubbleNode = SimulationNodeDatum &
  TrendingTopicBubbleItem & {
    color: string;
    radius: number;
    dragStartX: number;
    dragStartY: number;
    isDragging: boolean;
    entryDelayMs: number;
  };

type TrendingTopicsBubblesProps = {
  topics: TrendingTopicBubbleItem[];
  onTopicPress: (topic: string) => void;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export const TRENDING_TOPICS_MOCK_DATA: TrendingTopicBubbleItem[] = [
  { id: 'prayer-requests', topic: 'Prayer Requests', popularity: 96 },
  { id: 'local-missions', topic: 'Local Missions', popularity: 88 },
  { id: 'bible-study', topic: 'Bible Study', popularity: 84 },
  { id: 'worship', topic: 'Worship', popularity: 78 },
  { id: 'youth-ministry', topic: 'Youth Ministry', popularity: 68 },
  { id: 'apologetics', topic: 'Apologetics', popularity: 58 },
];

export const getBubbleRadius = (
  popularity: number,
  minPopularity: number,
  maxPopularity: number
) => {
  if (maxPopularity <= minPopularity) {
    return (MIN_RADIUS + MAX_RADIUS) / 2;
  }

  const normalized = (popularity - minPopularity) / (maxPopularity - minPopularity);
  return MIN_RADIUS + normalized * (MAX_RADIUS - MIN_RADIUS);
};

export const shouldHandleBubblePress = (suppressedUntil?: number, now = Date.now()) =>
  !suppressedUntil || suppressedUntil <= now;

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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const withAlpha = (hex: string, alpha: string) => `${hex}${alpha}`;

const getRecommendedHeight = (count: number) => {
  if (count > 15) return 500;
  if (count > 10) return 450;
  return DEFAULT_HEIGHT;
};

const getInitialBubblePosition = (
  index: number,
  width: number,
  height: number,
  radius: number,
  total: number
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const ring = Math.floor(index / 6);
  const ringDistance = 26 + ring * 34;

  return {
    x: clamp(centerX + Math.cos(angle) * ringDistance, radius, width - radius),
    y: clamp(centerY + Math.sin(angle) * ringDistance, radius, height - radius),
  };
};

const createAnimatedSnapshot = (
  nodes: BubbleNode[],
  width: number,
  height: number
): BubbleAnimatedState => {
  const nextState: BubbleAnimatedState = {};

  nodes.forEach((node) => {
    const x = clamp(
      node.x ?? width / 2,
      node.radius + CONTAINER_PADDING,
      width - node.radius - CONTAINER_PADDING
    );
    const y = clamp(
      node.y ?? height / 2,
      node.radius + CONTAINER_PADDING,
      height - node.radius - CONTAINER_PADDING
    );
    const nextNode = {
      ...node,
      x,
      y,
    };

    nextState[node.id] = {
      x: nextNode.x,
      y: nextNode.y,
      scale: nextNode.isDragging ? 1.12 : 1,
      opacity: 1,
      zIndex: nextNode.isDragging ? 30 : 2,
    };
  });

  return nextState;
};

type BubbleItemProps = {
  item: BubbleNode;
  animatedNodes: SharedValue<BubbleAnimatedState>;
  onBeginDrag: (id: string) => void;
  onDrag: (id: string, translationX: number, translationY: number) => void;
  onEndDrag: (id: string) => void;
  onTopicPress: (topic: string) => void;
  getSuppressUntil: (id: string) => number | undefined;
  revealProgress: SharedValue<number>;
};

const BubbleItem = memo(
  ({
    item,
    animatedNodes,
    onBeginDrag,
    onDrag,
    onEndDrag,
    onTopicPress,
    getSuppressUntil,
    revealProgress,
  }: BubbleItemProps) => {
    const animatedStyle = useAnimatedStyle(() => {
      const state = animatedNodes.value[item.id];
      const x = state?.x ?? item.radius;
      const y = state?.y ?? item.radius;
      const scale = state?.scale ?? 1;
      const opacity = state?.opacity ?? 0;
      const zIndex = state?.zIndex ?? 1;

      return {
        opacity: withDelay(
          item.entryDelayMs,
          withTiming(opacity * revealProgress.value, { duration: 220 })
        ),
        zIndex,
        transform: [
          { translateX: withSpring(x - item.radius, { damping: 18, stiffness: 180 }) },
          { translateY: withSpring(y - item.radius, { damping: 18, stiffness: 180 }) },
          {
            scale: withSpring(scale * (0.82 + revealProgress.value * 0.18), {
              damping: 16,
              stiffness: 170,
            }),
          },
        ],
      };
    }, [animatedNodes, item.entryDelayMs, item.id, item.radius, revealProgress]);

    const panGesture = useMemo(
      () =>
        Gesture.Pan()
          .activateAfterLongPress(DRAG_HOLD_MS)
          .maxPointers(1)
          .onStart(() => {
            runOnJS(onBeginDrag)(item.id);
          })
          .onUpdate((event) => {
            runOnJS(onDrag)(item.id, event.translationX, event.translationY);
          })
          .onFinalize(() => {
            runOnJS(onEndDrag)(item.id);
          }),
      [item.id, onBeginDrag, onDrag, onEndDrag]
    );

    const fontSize =
      item.topic.length > 18 ? (item.radius >= 56 ? 13 : 12) : item.radius >= 56 ? 15 : 13;
    const textMaxWidth = item.radius * 1.45;
    const bubbleColors =
      item.color === '#12d2d9' || item.color === '#41dbe1'
        ? [withAlpha(item.color, 'D8'), item.color]
        : [withAlpha(item.color, 'E8'), item.color];

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.bubbleAbsolute,
            animatedStyle,
            {
              width: item.radius * 2,
              height: item.radius * 2,
              borderRadius: item.radius,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            style={styles.bubblePressable}
            testID={`trending-topic-pressable-${item.id}`}
            onPress={() => {
              if (!shouldHandleBubblePress(getSuppressUntil(item.id))) {
                return;
              }
              onTopicPress(item.topic);
            }}
          >
            <LinearGradient
              colors={bubbleColors}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.bubbleFill}
            >
              <View style={styles.bubbleShine} />
              <View style={styles.bubbleCoreShadow} />
              <View style={styles.bubbleLabel}>
                <Text
                  numberOfLines={3}
                  style={[
                    styles.bubbleText,
                    {
                      fontSize,
                      lineHeight: fontSize + 3,
                      maxWidth: textMaxWidth,
                    },
                  ]}
                >
                  {item.topic}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    );
  }
);

BubbleItem.displayName = 'BubbleItem';

function TrendingTopicsBubbles({
  topics,
  onTopicPress,
  height,
  style,
}: TrendingTopicsBubblesProps) {
  const colorScheme = useColorScheme();
  const window = useWindowDimensions();
  const visibleTopics = useMemo(() => topics.slice(0, MAX_VISIBLE_BUBBLES), [topics]);
  const resolvedHeight = height ?? getRecommendedHeight(visibleTopics.length);
  const [containerSize, setContainerSize] = useState({
    width: Math.max(window.width - 32, 260),
    height: resolvedHeight,
  });
  const animatedNodes = useSharedValue<BubbleAnimatedState>({});
  const revealProgress = useSharedValue(0);
  const simulationRef = useRef<Simulation<BubbleNode, undefined> | null>(null);
  const nodesRef = useRef<BubbleNode[]>([]);
  const suppressTapUntilRef = useRef<Record<string, number>>({});

  const bubbleNodes = useMemo(() => {
    const popularityValues = visibleTopics.map((item) => item.popularity);
    const minPopularity = Math.min(...popularityValues, 1);
    const maxPopularity = Math.max(...popularityValues, 1);

    return visibleTopics.map((item, index) => {
      const radius = getBubbleRadius(item.popularity, minPopularity, maxPopularity);
      const position = getInitialBubblePosition(
        index,
        containerSize.width,
        containerSize.height,
        radius,
        visibleTopics.length
      );

      return {
        ...item,
        radius,
        color: BUBBLE_COLORS[index % BUBBLE_COLORS.length],
        dragStartX: 0,
        dragStartY: 0,
        isDragging: false,
        entryDelayMs: index * 32,
        x: position.x,
        y: position.y,
      } as BubbleNode;
    });
  }, [containerSize.height, containerSize.width, visibleTopics]);

  const syncAnimatedNodes = useCallback(
    (nodes: BubbleNode[]) => {
      // The d3 simulation runs on the JS thread; each tick mirrors node coordinates
      // into a single Reanimated shared object so the UI thread can animate bubble views.
      animatedNodes.value = createAnimatedSnapshot(
        nodes,
        containerSize.width,
        containerSize.height
      );
    },
    [animatedNodes, containerSize.height, containerSize.width]
  );

  useEffect(() => {
    if (bubbleNodes.length < 1 || containerSize.width <= 0 || containerSize.height <= 0) {
      return undefined;
    }

    simulationRef.current?.stop();
    nodesRef.current = bubbleNodes.map((node) => ({ ...node }));
    revealProgress.value = 0;
    syncAnimatedNodes(nodesRef.current);

    const simulation = forceSimulation(nodesRef.current)
      .alpha(0.95)
      .alphaDecay(0.032)
      .velocityDecay(0.24)
      .force('charge', forceManyBody().strength(-18))
      .force('x', forceX(containerSize.width / 2).strength(0.065))
      .force('y', forceY(containerSize.height / 2).strength(0.065))
      .force(
        'collide',
        forceCollide<BubbleNode>((node) => node.radius + COLLISION_PADDING).strength(1)
      )
      .on('tick', () => {
        syncAnimatedNodes(nodesRef.current);
      });

    simulationRef.current = simulation;
    revealProgress.value = withTiming(1, { duration: 520 });

    return () => {
      simulation.stop();
      if (simulationRef.current === simulation) {
        simulationRef.current = null;
      }
    };
  }, [bubbleNodes, containerSize.height, containerSize.width, revealProgress, syncAnimatedNodes]);

  useEffect(() => {
    return () => {
      simulationRef.current?.stop();
    };
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height: measuredHeight } = event.nativeEvent.layout;
    if (width <= 0 || measuredHeight <= 0) {
      return;
    }

    setContainerSize((current) => {
      if (Math.abs(current.width - width) < 1 && Math.abs(current.height - measuredHeight) < 1) {
        return current;
      }

      return {
        width,
        height: measuredHeight,
      };
    });
  }, []);

  const onBeginDrag = useCallback(
    (id: string) => {
      const simulation = simulationRef.current;
      const node = nodesRef.current.find((entry) => entry.id === id);
      if (!simulation || !node) {
        return;
      }

      node.dragStartX = node.x ?? containerSize.width / 2;
      node.dragStartY = node.y ?? containerSize.height / 2;
      node.isDragging = true;
      node.fx = node.dragStartX;
      node.fy = node.dragStartY;

      simulation.alphaTarget(0.42).restart();
      syncAnimatedNodes(nodesRef.current);
    },
    [containerSize.height, containerSize.width, syncAnimatedNodes]
  );

  const onDrag = useCallback(
    (id: string, translationX: number, translationY: number) => {
      const simulation = simulationRef.current;
      const node = nodesRef.current.find((entry) => entry.id === id);
      if (!simulation || !node) {
        return;
      }

      // Drag gestures pin a node via fx/fy so d3 reflows the surrounding cluster
      // and the other bubbles bounce out of the way while the active bubble moves.
      node.fx = clamp(
        node.dragStartX + translationX,
        node.radius + CONTAINER_PADDING,
        containerSize.width - node.radius - CONTAINER_PADDING
      );
      node.fy = clamp(
        node.dragStartY + translationY,
        node.radius + CONTAINER_PADDING,
        containerSize.height - node.radius - CONTAINER_PADDING
      );

      simulation.alphaTarget(0.42).restart();
      syncAnimatedNodes(nodesRef.current);
    },
    [containerSize.height, containerSize.width, syncAnimatedNodes]
  );

  const onEndDrag = useCallback(
    (id: string) => {
      const simulation = simulationRef.current;
      const node = nodesRef.current.find((entry) => entry.id === id);
      if (!simulation || !node) {
        return;
      }

      node.isDragging = false;
      node.fx = null;
      node.fy = null;
      suppressTapUntilRef.current[id] = Date.now() + TAP_SUPPRESSION_MS;
      simulation.alphaTarget(0).restart();
      syncAnimatedNodes(nodesRef.current);
    },
    [syncAnimatedNodes]
  );

  const getSuppressUntil = useCallback((id: string) => suppressTapUntilRef.current[id], []);

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        {
          height: resolvedHeight,
          backgroundColor: colorScheme === 'dark' ? DARK_BACKGROUND : LIGHT_BACKGROUND,
        },
        style,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={colorScheme === 'dark' ? ['#061126', '#000015'] : ['#f7fdff', '#eef7fb', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.backgroundOrbLeft} />
      <View pointerEvents="none" style={styles.backgroundOrbRight} />
      {bubbleNodes.map((item) => (
        <BubbleItem
          key={item.id}
          item={item}
          animatedNodes={animatedNodes}
          onBeginDrag={onBeginDrag}
          onDrag={onDrag}
          onEndDrag={onEndDrag}
          onTopicPress={onTopicPress}
          getSuppressUntil={getSuppressUntil}
          revealProgress={revealProgress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 20,
    marginTop: 12,
  },
  bubbleAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bubblePressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 999,
  },
  bubbleFill: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  bubbleShine: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: '44%',
    height: '26%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bubbleCoreShadow: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    width: '52%',
    height: '30%',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  bubbleLabel: {
    maxWidth: '88%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  bubbleText: {
    color: '#FFFFFF',
    fontFamily: 'Rubik-Bold',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  backgroundOrbLeft: {
    position: 'absolute',
    top: -48,
    left: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(65, 219, 225, 0.12)',
  },
  backgroundOrbRight: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(18, 107, 135, 0.12)',
  },
});

export default TrendingTopicsBubbles;
