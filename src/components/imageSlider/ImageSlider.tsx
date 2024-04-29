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

export type ImageType = 'image' | 'gif';
export type ImageForSlider = {
  url: string;
  height: number;
  width: number;
  type: ImageType;
  gifAspectRatio?: number;
  id?: string;
};
function ImageSlider({
  images,
  setImageModalIndexVisible,
  width,
}: {
  images: ImageForSlider[];
  width: number;
  setImageModalIndexVisible: (item: number) => void;
}) {
  let aspectRatio = 0;

  for (let i = 0; i < images.length; i++) {
    const newAspectRatio = images[i].width < images[i].height ? 16 / 9 : 9 / 16;
    if (aspectRatio < newAspectRatio) {
      aspectRatio = newAspectRatio;
    }
  }
  const height = width * aspectRatio;

  const [active, setActive] = useState(0);

  const onScrollChange = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.ceil(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
    if (slide !== active) {
      setActive(slide);
    }
  };

  const maxHeight = 400;
  const heightToUse = maxHeight < height ? maxHeight : height;

  if (images.length == 1) {
    return (
      <ImageSlide
        image={images[0]}
        setImageModalIndexVisible={setImageModalIndexVisible}
        width={width}
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
        style={{ width, height: heightToUse }}
      >
        {images.map((image, index) => {
          return (
            <ImageSlide
              image={image}
              setImageModalIndexVisible={setImageModalIndexVisible}
              width={width}
              height={heightToUse}
              maxHeight={maxHeight}
              index={index}
            />
          );
        })}
      </ScrollView>
      <View style={styles.pagination}>
        {images.map((i, k) => (
          <Text key={k} style={k == active ? styles.activeDot : styles.dot}>
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
