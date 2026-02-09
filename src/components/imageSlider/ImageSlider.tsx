import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import ImageSlide from './ImageSlide';
import { ImageForSlider } from './types';
import type { ScrollIntentLock } from '@/src/hooks/useScrollIntentLock';

function ImageSlider({
  images,
  setImageModalIndexVisible,
  width,
  scrollIntent,
  mediaKeyPrefix,
}: {
  images: ImageForSlider[];
  width: number;
  setImageModalIndexVisible: (item: number) => void;
  scrollIntent?: ScrollIntentLock;
  mediaKeyPrefix?: string;
}) {
  const [active, setActive] = useState(0);
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  if (!safeWidth || images.length === 0) {
    return null;
  }

  const feedAspectRatio = 4 / 5;
  const heightToUse = safeWidth / feedAspectRatio;

  const onScrollChange = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.ceil(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
    if (slide !== active) {
      setActive(slide);
    }
  };

  if (images.length === 1) {
    return (
      <ImageSlide
        image={images[0]}
        setImageModalIndexVisible={setImageModalIndexVisible}
        width={safeWidth}
        height={heightToUse}
        maxHeight={heightToUse}
        index={0}
        scrollIntent={scrollIntent}
        interactionKey={mediaKeyPrefix ? `${mediaKeyPrefix}-0` : undefined}
      />
    );
  }

  return (
    <View style={{ height: heightToUse }}>
      <ScrollView
        pagingEnabled
        horizontal
        onScroll={onScrollChange}
        showsHorizontalScrollIndicator={false}
        style={{ width: safeWidth, height: heightToUse }}
      >
        {images.map((image, index) => {
          return (
            <ImageSlide
              key={image.id ?? image.url ?? String(index)}
              image={image}
              setImageModalIndexVisible={setImageModalIndexVisible}
              width={safeWidth}
              height={heightToUse}
              maxHeight={heightToUse}
              index={index}
              scrollIntent={scrollIntent}
              interactionKey={mediaKeyPrefix ? `${mediaKeyPrefix}-${index}` : undefined}
            />
          );
        })}
      </ScrollView>
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
    </View>
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
