import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

function ImageSlider({
  images,
  setImageModalIndexVisible,
}: {
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  setImageModalIndexVisible: (item: number) => void;
}) {
  const { width } = Dimensions.get('window');
  const height = width * 0.7;

  const [active, setActive] = useState(0);

  const onScrollChange = ({ nativeEvent }) => {
    const slide = Math.ceil(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
    if (slide !== active) {
      setActive(slide);
    }
  };

  return (
    <View>
      <ScrollView
        pagingEnabled
        horizontal
        onScroll={onScrollChange}
        showsHorizontalScrollIndicator={false}
        style={{ width, height }}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={{
              flexGrow: 1,

              padding: spacing.x10,
            }}
            onPress={() => {
              setImageModalIndexVisible(index);
            }}
          >
            <View
              style={{
                width,
                height: width * (image.width > image.height ? 16 / 9 : 9 / 16),
                backgroundColor: 'red',
              }}
            >
              {/* <Image  source={{ uri: image.url }} style={{ resizeMode: 'cover' }} /> */}
              <Image
                // resizeMode={image.width > image.height ? 'cover' : 'stretch'}
                style={{
                  borderRadius: borderRadius.small,
                  aspectRatio: image.width > image.height ? 16 / 9 : 9 / 16,
                  // width: 250,
                  maxHeight: 300,
                }}
                // modalImageResizeMode="center"
                // modalImageResizeMode="cover"
                // modalImageStyle={{
                //   flexGrow: 1,
                //   aspectRatio: image.width > image.height ? 16 / 9 : 9 / 16,
                // }}
                source={{ uri: image?.url }}
              />
            </View>
          </TouchableOpacity>
        ))}
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
