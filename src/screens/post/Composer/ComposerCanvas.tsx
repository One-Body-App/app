import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import FastImage from '@/components/primitives/FastImage';
import CustomVideo from '@/src/components/CustomVideo';
import StyledText from '@/components/styled/Text';
import useMountEffect from '@/src/hooks/useMountEffect';
import { getHeight } from '@/utils/ResponsiveFun';
import { composerDurations, composerEasings } from './composerMotion';
import {
  composerSpace,
  composerType,
  resolveComposerPalette,
  type ComposerPalette,
} from './composerTheme';
import type { MediaItem } from './types';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2;

export type ComposerCanvasProps = {
  items: MediaItem[];
  scheme: 'dark' | 'light';
  // Forwarded for empty-state actions; the canvas itself does not own picking.
  onRequestMedia?: () => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  // Space the lectern sheet occupies at the bottom, so the empty-state graphic
  // stays centered in the visible stage above it instead of being clipped.
  reservedBottom?: number;
  // Notifies the host when the active index changes so chips/preview can update.
  onActiveIndexChange?: (index: number, item: MediaItem | undefined) => void;
};

type CanvasItemProps = {
  item: MediaItem;
  width: number;
  height: number;
  palette: ComposerPalette;
  isActive: boolean;
};

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);
const AnimatedCustomVideo = Animated.createAnimatedComponent(CustomVideo);

function CanvasItem({ item, width, height, palette, isActive }: CanvasItemProps) {
  const scale = useSharedValue(MIN_ZOOM);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const previousScale = useSharedValue(MIN_ZOOM);

  const clampZoom = (value: number, min: number, max: number) => {
    'worklet';

    return Math.min(max, Math.max(min, value));
  };

  const resetTransform = useCallback(() => {
    scale.value = withSpring(MIN_ZOOM, { damping: 18, stiffness: 240 });
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  }, [scale, translateX, translateY]);

  const pinch = Gesture.Pinch()
    .enabled(isActive && item.kind !== 'video')
    .onBegin((event) => {
      'worklet';

      previousScale.value = scale.value;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onUpdate((event) => {
      'worklet';

      scale.value = clampZoom(previousScale.value * event.scale, MIN_ZOOM, MAX_ZOOM);
    })
    .onEnd(() => {
      'worklet';

      if (scale.value < 1.05) {
        scale.value = withTiming(MIN_ZOOM, { duration: composerDurations.chip });
        translateX.value = withTiming(0, { duration: composerDurations.chip });
        translateY.value = withTiming(0, { duration: composerDurations.chip });
      }
    })
    .runOnJS(false);

  const pan = Gesture.Pan()
    .enabled(isActive && item.kind !== 'video')
    .minPointers(1)
    .maxPointers(2)
    .onChange((event) => {
      'worklet';

      if (scale.value <= 1.01) return;
      translateX.value += event.changeX;
      translateY.value += event.changeY;
    })
    .runOnJS(false);

  const doubleTap = Gesture.Tap()
    .enabled(isActive)
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';

      if (scale.value > 1.1) {
        scale.value = withTiming(MIN_ZOOM, { duration: composerDurations.chip });
        translateX.value = withTiming(0, { duration: composerDurations.chip });
        translateY.value = withTiming(0, { duration: composerDurations.chip });
      } else {
        scale.value = withTiming(DOUBLE_TAP_ZOOM, { duration: composerDurations.chip });
      }
    })
    .runOnJS(false);

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // When the user swipes away from this slide, snap back to the unzoomed state
  // so the next visit starts clean.
  if (!isActive && scale.value !== MIN_ZOOM) {
    resetTransform();
  }

  if (item.kind === 'video') {
    return (
      <View style={[styles.canvasItem, { width, height, backgroundColor: palette.stage }]}>
        <AnimatedCustomVideo
          source={{ uri: item.uri }}
          paused={!isActive}
          repeat
          muted={false}
          resizeMode="contain"
          style={[styles.media, animatedStyle, { width, height }]}
        />
        {isActive ? (
          <View style={styles.videoBadge}>
            <MaterialIcons name="videocam" size={14} color="#ffffff" />
            <StyledText style={styles.videoBadgeText}>
              {item.durationMs ? formatDuration(item.durationMs) : 'Video'}
            </StyledText>
          </View>
        ) : null}
      </View>
    );
  }

  if (item.kind === 'gif') {
    return (
      <View style={[styles.canvasItem, { width, height, backgroundColor: palette.stage }]}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.mediaSurface, animatedStyle]}>
            <FastImage
              source={{ uri: item.thumbnailUri ?? item.uri }}
              resizeMode="contain"
              style={[styles.media, { width, height }]}
            />
          </Animated.View>
        </GestureDetector>
      </View>
    );
  }

  return (
    <View style={[styles.canvasItem, { width, height, backgroundColor: palette.stage }]}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.mediaSurface, animatedStyle]}>
          <AnimatedFastImage
            source={{ uri: item.uri }}
            resizeMode="contain"
            style={[styles.media, { width, height }]}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

type ComposerEmptyStateProps = {
  palette: ComposerPalette;
  emptyTitle: string;
  emptySubtitle: string;
  showArrow: boolean;
  reservedBottom?: number;
  onLayout: (event: { nativeEvent: { layout: { width: number; height: number } } }) => void;
};

function ComposerEmptyState({
  palette,
  emptyTitle,
  emptySubtitle,
  showArrow,
  reservedBottom,
  onLayout,
}: ComposerEmptyStateProps): React.ReactElement {
  // A slow "load" entrance plus a gentle, continuous breathing so the empty
  // stage feels alive while the user decides what to add.
  const enter = useSharedValue(0);
  const breathe = useSharedValue(0);

  useMountEffect(() => {
    enter.value = withTiming(1, { duration: 900, easing: composerEasings.cinema });
    breathe.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  });

  const contentStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: 0.92 + enter.value * 0.08 }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: enter.value * (0.6 + breathe.value * 0.3),
    transform: [{ scale: 1 + breathe.value * 0.06 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.04 }],
  }));

  return (
    <View
      accessibilityRole="summary"
      onLayout={onLayout}
      style={[
        styles.empty,
        { backgroundColor: palette.stage, paddingBottom: reservedBottom ?? getHeight(12) },
      ]}
    >
      <Animated.View style={[styles.emptyContent, contentStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.emptyHalo, haloStyle, { backgroundColor: palette.stageHighlight }]}
        />
        <Animated.View
          accessibilityLabel="Compose stage"
          style={[
            styles.emptyIconWrap,
            iconStyle,
            { backgroundColor: palette.glass, borderColor: palette.glassBorder },
          ]}
        >
          <MaterialIcons name="auto-awesome" size={32} color={palette.accent} />
        </Animated.View>
        <StyledText style={[styles.emptyTitle, { color: palette.textPrimary }]}>
          {emptyTitle}
        </StyledText>
        <StyledText style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
          {emptySubtitle}
        </StyledText>
        {showArrow ? (
          <View style={styles.emptyAccent}>
            <MaterialIcons name="south" size={20} color={palette.accent} />
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

export default function ComposerCanvas({
  items,
  scheme,
  onRequestMedia,
  emptyTitle = 'What is God doing today?',
  emptySubtitle = 'Tap below to add a photo, video, or word.',
  reservedBottom,
  onActiveIndexChange,
}: ComposerCanvasProps): React.ReactElement {
  const palette = useMemo(() => resolveComposerPalette(scheme), [scheme]);
  const windowDimensions = useWindowDimensions();
  const [layout, setLayout] = useState(() => ({
    width: windowDimensions.width,
    height: windowDimensions.height * 0.6,
  }));
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<MediaItem> | null>(null);

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = event.nativeEvent.layout;
      if (width > 0 && height > 0) {
        setLayout({ width, height });
      }
    },
    []
  );

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!layout.width) return;
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / layout.width);
      if (nextIndex !== activeIndex) {
        setActiveIndex(nextIndex);
        onActiveIndexChange?.(nextIndex, items[nextIndex]);
      }
    },
    [activeIndex, items, layout.width, onActiveIndexChange]
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<MediaItem>) => (
      <CanvasItem
        item={item}
        width={layout.width}
        height={layout.height}
        palette={palette}
        isActive={index === activeIndex}
      />
    ),
    [activeIndex, layout.height, layout.width, palette]
  );

  const keyExtractor = useCallback((item: MediaItem) => item.id, []);
  const getItemLayout = useCallback(
    (_data: ArrayLike<MediaItem> | null | undefined, index: number) => ({
      length: layout.width,
      offset: layout.width * index,
      index,
    }),
    [layout.width]
  );

  if (items.length === 0) {
    return (
      <ComposerEmptyState
        palette={palette}
        emptyTitle={emptyTitle}
        emptySubtitle={emptySubtitle}
        showArrow={Boolean(onRequestMedia)}
        reservedBottom={reservedBottom}
        onLayout={handleLayout}
      />
    );
  }

  return (
    <View onLayout={handleLayout} style={[styles.stage, { backgroundColor: palette.stage }]}>
      <FlatList
        ref={listRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={getItemLayout}
        decelerationRate="fast"
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        removeClippedSubviews
      />

      {items.length > 1 ? (
        <View pointerEvents="none" style={styles.indicators}>
          {items.map((item, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={item.id}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: active ? palette.accent : palette.glass,
                    width: active ? 18 : 6,
                  },
                ]}
              />
            );
          })}
        </View>
      ) : null}

      <View
        pointerEvents="none"
        style={[styles.vignette, { backgroundColor: palette.stageVignette }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    overflow: 'hidden',
  },
  canvasItem: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaSurface: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    alignSelf: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: composerSpace.lg,
    left: composerSpace.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: composerSpace.chipRadius,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  videoBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: composerSpace.xxl,
    // paddingBottom is applied inline (reservedBottom) so the graphic stays
    // centered in the visible stage above the lectern sheet.
    overflow: 'hidden',
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHalo: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 300,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: composerSpace.lg,
  },
  emptyTitle: {
    ...composerType.title,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...composerType.body,
    textAlign: 'center',
    marginTop: composerSpace.xs,
    opacity: 0.85,
  },
  emptyAccent: {
    marginTop: composerSpace.xxl,
    opacity: 0.6,
  },
  indicators: {
    position: 'absolute',
    bottom: composerSpace.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    height: 6,
    borderRadius: 999,
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    opacity: 0.6,
  },
});
