import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ImageSlide from './ImageSlide';
import { ImageForSlider } from './types';
import { buildSlideHeights, DEFAULT_FEED_ASPECT_RATIO } from './ImageSlider.utils';

type MultiImageHeightMode = 'fixed' | 'animated';
type SliderResizeMode = 'contain' | 'cover';

type ImageSliderProps = {
  images: ImageForSlider[];
  width: number;
  setImageModalIndexVisible?: (item: number) => void;
  onImagePress?: (item: number) => void;
  minAspectRatio?: number;
  maxAspectRatio?: number;
  multiImageHeightMode?: MultiImageHeightMode;
  imageResizeMode?: SliderResizeMode;
  frameBackgroundColor?: string;
};

function ImageSlider({
  images,
  setImageModalIndexVisible,
  onImagePress,
  width,
  minAspectRatio,
  maxAspectRatio,
  multiImageHeightMode = 'fixed',
  imageResizeMode = 'contain',
  frameBackgroundColor,
}: ImageSliderProps) {
  const [active, setActive] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  const resolvedMinAspectRatio = typeof minAspectRatio === 'number' ? minAspectRatio : undefined;
  const resolvedMaxAspectRatio = typeof maxAspectRatio === 'number' ? maxAspectRatio : undefined;
  const feedHeightToUse = safeWidth / DEFAULT_FEED_ASPECT_RATIO;
  const clampedHeights = useMemo(
    () => buildSlideHeights(images, safeWidth, resolvedMinAspectRatio, resolvedMaxAspectRatio),
    [images, safeWidth, resolvedMaxAspectRatio, resolvedMinAspectRatio]
  );
  const fixedMultiImageHeight = feedHeightToUse;
  const isAnimatedHeight = multiImageHeightMode === 'animated' && images.length > 1;
  const animatedOutputHeights =
    clampedHeights.length > 0 ? clampedHeights : images.map(() => feedHeightToUse);
  const animatedInputRange = animatedOutputHeights.map((_, index) => index * safeWidth);
  const animatedHeight =
    animatedInputRange.length > 1
      ? scrollX.interpolate({
          inputRange: animatedInputRange,
          outputRange: animatedOutputHeights,
          extrapolate: 'clamp',
        })
      : (animatedOutputHeights[0] ?? feedHeightToUse);
  const containerHeight = isAnimatedHeight ? animatedHeight : fixedMultiImageHeight;

  if (!safeWidth || images.length === 0) {
    return null;
  }

  const onScrollChange = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(nativeEvent.contentOffset.x / safeWidth);
    if (slide !== active) {
      setActive(slide);
    }
  };

  if (images.length === 1) {
    const singleImageHeight = clampedHeights[0] ?? feedHeightToUse;
    return (
      <ImageSlide
        image={images[0]}
        setImageModalIndexVisible={setImageModalIndexVisible}
        onImagePress={onImagePress}
        width={safeWidth}
        height={singleImageHeight}
        index={0}
        resizeMode={imageResizeMode}
        frameBackgroundColor={frameBackgroundColor}
      />
    );
  }

  return (
    <Animated.View style={{ height: containerHeight }}>
      <Animated.ScrollView
        pagingEnabled
        horizontal
        onScroll={
          isAnimatedHeight
            ? Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                useNativeDriver: false,
                listener: onScrollChange,
              })
            : onScrollChange
        }
        onMomentumScrollEnd={onScrollChange}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={{ width: safeWidth, height: containerHeight }}
      >
        {images.map((image, index) => {
          const slideHeight = isAnimatedHeight
            ? (clampedHeights[index] ?? feedHeightToUse)
            : fixedMultiImageHeight;
          return (
            <ImageSlide
              key={image.id ?? image.url ?? String(index)}
              image={image}
              setImageModalIndexVisible={setImageModalIndexVisible}
              onImagePress={onImagePress}
              width={safeWidth}
              height={slideHeight}
              index={index}
              resizeMode={imageResizeMode}
              frameBackgroundColor={frameBackgroundColor}
            />
          );
        })}
      </Animated.ScrollView>
      <View style={styles.pagination}>
        {images.map((image, index) => (
          <Text
            key={image.id ?? image.url ?? `dot-${index}`}
            style={index === active ? styles.activeDot : styles.dot}
          >
            •
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -15,
    alignSelf: 'center',
  },
  dot: {
    color: '#888',
    fontSize: 50,
  },
  activeDot: {
    color: '#FFF',
    fontSize: 50,
  },
});

export default ImageSlider;
