import { Pressable, View } from 'react-native';
import { GiphyMediaView } from '@giphy/react-native-sdk';
import FastImage from 'react-native-fast-image';
import { Colors } from '@/src/styles';
import { ImageForSlider } from './types';

const MEDIA_RADIUS = 12;
type SliderResizeMode = 'contain' | 'cover';

function ImageSlide({
  image,
  setImageModalIndexVisible,
  height,
  width,
  index,
  resizeMode = 'contain',
  frameBackgroundColor = Colors.containFrame,
}: {
  image: ImageForSlider;
  setImageModalIndexVisible: (item: number) => void;
  width: number;
  height: number;
  index: number;
  resizeMode?: SliderResizeMode;
  frameBackgroundColor?: string;
}) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : safeWidth;
  const openImage = () => {
    setImageModalIndexVisible(index);
  };

  return (
    <View
      key={index}
      style={{
        flexGrow: 1,
      }}
    >
      <View
        style={{
          width: safeWidth,
          height: safeHeight,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor:
            frameBackgroundColor && frameBackgroundColor !== 'transparent'
              ? frameBackgroundColor
              : 'transparent',
          borderRadius: MEDIA_RADIUS,
          overflow: 'hidden',
        }}
      >
        {image.type === 'gif' ? (
          <GiphyMediaView
            media={{ ...image, id: image.id ?? '' }}
            resizeMode={resizeMode}
            style={{
              width: safeWidth,
              height: safeHeight,
              borderRadius: MEDIA_RADIUS,

              overflow: 'hidden',
            }}
          />
        ) : (
          <FastImage
            style={{
              borderRadius: MEDIA_RADIUS,
              width: safeWidth,
              height: safeHeight,
            }}
            resizeMode={resizeMode}
            source={{ uri: image?.url ?? '' }}
          />
        )}
        <Pressable
          onPress={openImage}
          android_disableSound
          hitSlop={10}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        />
      </View>
    </View>
  );
}

export default ImageSlide;
