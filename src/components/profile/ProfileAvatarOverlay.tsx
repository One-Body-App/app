import React from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import FastImage from '@/components/primitives/FastImage';
import { ProfileAvatarAnimationResult, TIMING_CONFIG } from './useProfileAvatarAnimation';

type Props = {
  imageUri: string | undefined;
  animation: ProfileAvatarAnimationResult;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
// Only wrap BlurView in Animated on iOS — on Android we use a plain dark overlay instead
const AnimatedBlurView = Platform.OS === 'ios' ? Animated.createAnimatedComponent(BlurView) : null;

export default function ProfileAvatarOverlay({ imageUri, animation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const {
    expandedSize,
    isOpen,
    imageXCoord,
    imageYCoord,
    imageSize,
    imageScale,
    backdropOpacity,
    closeBtnOpacity,
    open,
    close,
  } = animation;

  // Captured at gesture start to compute total distance moved
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      // Snapshot current position so distance is relative to where the gesture began
      panStartX.value = imageXCoord.value;
      panStartY.value = imageYCoord.value;
      closeBtnOpacity.value = withTiming(0, { duration: 200 });
    })
    .onChange((event) => {
      if (isOpen.value === 0) {
        return;
      }
      imageXCoord.value += event.changeX / 2;
      imageYCoord.value += event.changeY / 2;

      const deltaX = imageXCoord.value - panStartX.value;
      const deltaY = imageYCoord.value - panStartY.value;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      imageScale.value = interpolate(distance, [0, screenWidth / 2], [1, 0.9], {
        extrapolateRight: 'clamp',
      });
      backdropOpacity.value = interpolate(distance, [0, screenWidth / 2], [1, 0], {
        extrapolateRight: 'clamp',
      });
    })
    .onFinalize(() => {
      const deltaX = imageXCoord.value - panStartX.value;
      const deltaY = imageYCoord.value - panStartY.value;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      imageScale.value = withTiming(1, TIMING_CONFIG);

      if (distance > expandedSize / 2) {
        close();
      } else {
        open();
      }
    });

  // pointerEvents toggled via JS state avoids an animated style on Android
  // (animated pointerEvents is unreliable on older RN/Android versions)
  const rContainerStyle = useAnimatedStyle(() => ({
    pointerEvents: isOpen.value === 1 ? 'auto' : 'none',
  }));

  const rImageStyle = useAnimatedStyle(() => ({
    opacity: isOpen.value,
    transform: [
      {
        translateX: imageXCoord.value - expandedSize / 2 + (imageSize.value * imageScale.value) / 2,
      },
      {
        translateY: imageYCoord.value - expandedSize / 2 + (imageSize.value * imageScale.value) / 2,
      },
      { scale: (imageSize.value / expandedSize) * imageScale.value },
    ],
  }));

  // iOS: animate blur intensity via animatedProps (avoids full component re-render)
  const blurAnimatedProps = useAnimatedProps(() => ({
    blurAmount: backdropOpacity.value * 10,
  }));

  // Android / fallback: plain dark overlay with animated opacity — no GPU compositing layer
  const rDarkOverlayStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.85,
  }));

  const rCloseBtnStyle = useAnimatedStyle(() => ({
    opacity: closeBtnOpacity.value,
  }));

  return (
    <GestureDetector gesture={pan}>
      <AnimatedPressable
        style={[StyleSheet.absoluteFill, styles.container, rContainerStyle]}
        onPress={close}
      >
        {Platform.OS === 'ios' && AnimatedBlurView ? (
          // iOS: system blur for the frosted-glass effect
          <AnimatedBlurView
            blurType="dark"
            style={StyleSheet.absoluteFill}
            animatedProps={blurAnimatedProps}
          />
        ) : (
          // Android: flat dark overlay — far cheaper, no separate compositing layer
          <Animated.View style={[StyleSheet.absoluteFill, styles.darkOverlay, rDarkOverlayStyle]} />
        )}

        <Animated.View style={[styles.closeButton, rCloseBtnStyle, { top: insets.top + 16 }]}>
          <Icon name="close" size={22} color="#FFFFFF" />
        </Animated.View>

        <AnimatedPressable
          style={[styles.avatarImage, { width: expandedSize, height: expandedSize }, rImageStyle]}
          onPress={close}
        >
          {imageUri ? (
            <FastImage
              source={{ uri: imageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : null}
        </AnimatedPressable>
      </AnimatedPressable>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  avatarImage: {
    borderRadius: 999,
    overflow: 'hidden',
    position: 'absolute',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    left: 16,
    padding: 4,
    position: 'absolute',
    width: 36,
  },
  container: {
    elevation: 999,
    zIndex: 999,
  },
  darkOverlay: {
    backgroundColor: '#000000',
  },
});
