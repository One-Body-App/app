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

function ImageSlider({
  images,
  setImageModalIndexVisible,
  width,
}: {
  images: ImageForSlider[];
  width: number;
  setImageModalIndexVisible: (item: number) => void;
}) {
  const [active, setActive] = useState(0);
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  if (!safeWidth || images.length === 0) {
    return null;
  }

  let aspectRatio = 0;

  for (let i = 0; i < images.length; i++) {
    const imgWidth = Number.isFinite(images[i].width) ? images[i].width : 1;
    const imgHeight = Number.isFinite(images[i].height) ? images[i].height : 1;
    const newAspectRatio = imgWidth < imgHeight ? 16 / 9 : 9 / 16;
    if (aspectRatio < newAspectRatio) {
      aspectRatio = newAspectRatio;
    }
  }
  const height = safeWidth * aspectRatio;

  const onScrollChange = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.ceil(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
    if (slide !== active) {
      setActive(slide);
    }
  };

  const maxHeight = 400;
  const heightToUse = maxHeight < height ? maxHeight : height;

  if (images.length === 1) {
    return (
      <ImageSlide
        image={images[0]}
        setImageModalIndexVisible={setImageModalIndexVisible}
        width={safeWidth}
        height={heightToUse}
        maxHeight={maxHeight}
        index={0}
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
              maxHeight={maxHeight}
              index={index}
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
