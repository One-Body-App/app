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

  const getImageAspectRatio = (image: ImageForSlider) => {
    const gifAspectRatio = Number(image.gifAspectRatio);
    if (image.type === 'gif' && Number.isFinite(gifAspectRatio) && gifAspectRatio > 0) {
      return gifAspectRatio;
    }
    const imageWidth = Number(image.width);
    const imageHeight = Number(image.height);
    if (
      Number.isFinite(imageWidth) &&
      Number.isFinite(imageHeight) &&
      imageWidth > 0 &&
      imageHeight > 0
    ) {
      return imageWidth / imageHeight;
    }
    return 4 / 5;
  };
  const feedAspectRatio = 4 / 5;
  const heightToUse = safeWidth / feedAspectRatio;

  const onScrollChange = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.ceil(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
    if (slide !== active) {
      setActive(slide);
    }
  };

  if (images.length === 1) {
    const singleImageAspectRatio = getImageAspectRatio(images[0]);
    const singleImageHeight = safeWidth / singleImageAspectRatio;
    return (
      <ImageSlide
        image={images[0]}
        setImageModalIndexVisible={setImageModalIndexVisible}
        width={safeWidth}
        height={singleImageHeight}
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
