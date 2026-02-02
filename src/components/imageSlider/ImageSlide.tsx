import { Image, TouchableOpacity, View } from 'react-native';
import { GiphyMediaView } from '@giphy/react-native-sdk';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { ImageForSlider } from './types';

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
  const safeWidth = Number.isFinite(width) && width > 0 ? width : maxHeight;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : maxHeight;
  const imageWidth = Number.isFinite(image.width) && image.width > 0 ? image.width : 1;
  const imageHeight = Number.isFinite(image.height) && image.height > 0 ? image.height : 1;
  const isLandscape = imageWidth > imageHeight;
  const safeGifAspectRatio =
    Number.isFinite(image.gifAspectRatio) && (image.gifAspectRatio ?? 0) > 0
      ? image.gifAspectRatio
      : 1;

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
          width: safeWidth,
          height: safeHeight,
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
              aspectRatio: safeGifAspectRatio,
              borderRadius: borderRadius.small,

              overflow: 'hidden',
            }}
          />
        ) : (
          <Image
            style={{
              borderRadius: borderRadius.small,
              aspectRatio: isLandscape ? 16 / 9 : 9 / 16,
              width: isLandscape ? safeWidth : undefined,
              height: isLandscape ? undefined : maxHeight,
            }}
            source={{ uri: image?.url ?? '' }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default ImageSlide;
