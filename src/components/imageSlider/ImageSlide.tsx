import { Image, Pressable, View } from 'react-native';
import { GiphyMediaView } from '@giphy/react-native-sdk';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { ImageForSlider } from './types';
import type { ScrollIntentLock } from '@/src/hooks/useScrollIntentLock';

function ImageSlide({
  image,
  setImageModalIndexVisible,
  height,
  width,
  maxHeight,
  index,
  scrollIntent,
  interactionKey,
}: {
  image: ImageForSlider;
  setImageModalIndexVisible: (item: number) => void;
  width: number;
  height: number;
  maxHeight: number;
  index: number;
  scrollIntent?: ScrollIntentLock;
  interactionKey?: string;
}) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : maxHeight;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : maxHeight;
  const mediaKey = interactionKey ?? `media-${index}`;
  const playHandlers = scrollIntent?.bindCardGestureHandlers(mediaKey, {
    onPress: () => {
      setImageModalIndexVisible(index);
    },
  }) ?? {
    onPress: () => {
      setImageModalIndexVisible(index);
    },
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
        }}
      >
        {image.type == 'gif' ? (
          <GiphyMediaView
            media={{ ...image, id: image.id ?? '' }}
            resizeMode="cover"
            style={{
              width: safeWidth,
              height: safeHeight,
              borderRadius: borderRadius.small,

              overflow: 'hidden',
            }}
          />
        ) : (
          <Image
            style={{
              borderRadius: borderRadius.small,
              width: safeWidth,
              height: safeHeight,
            }}
            resizeMode="cover"
            source={{ uri: image?.url ?? '' }}
          />
        )}
        <Pressable
          {...playHandlers}
          android_disableSound
          hitSlop={10}
          style={{
            position: 'absolute',
            width: 46,
            height: 46,
            borderRadius: 23,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.35)',
          }}
        >
          <MaterialIcons name="play-arrow" size={28} color={Colors.neutral[900]} />
        </Pressable>
      </View>
    </View>
  );
}

export default ImageSlide;
