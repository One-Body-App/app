import { Image, TouchableOpacity, View } from 'react-native';
import { GiphyMediaView } from '@giphy/react-native-sdk';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { ImageForSlider } from './ImageSlider';

function ImageSlide({
  image,
  setImageModalIndexVisible,
  height,
  width,
  maxHeight,
  index,
}: {
  image: ImageForSlider;
  setImageModalIndexVisible: (item: number) => void;
  width: number;
  height: number;
  maxHeight: number;
  index: number;
}) {
  return (
    <TouchableOpacity
      key={index}
      style={{
        flexGrow: 1,
      }}
      onPress={() => {
        if (image.type == 'image') {
          setImageModalIndexVisible(index);
        }
      }}
    >
      <View
        style={{
          width,
          height,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {image.type == 'gif' ? (
          <GiphyMediaView
            media={{ ...image, id: image.id ?? '' }}
            resizeMode="cover"
            style={{
              flexGrow: 1,
              aspectRatio: image.gifAspectRatio,
              borderRadius: borderRadius.small,

              overflow: 'hidden',
            }}
          />
        ) : (
          <Image
            style={{
              borderRadius: borderRadius.small,
              aspectRatio: image.width > image.height ? 16 / 9 : 9 / 16,
              width: image.width > image.height ? width : undefined,
              height: image.width > image.height ? undefined : maxHeight,
            }}
            source={{ uri: image?.url }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default ImageSlide;
