import { useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Easing,
  measure,
  runOnUI,
  SharedValue,
  useAnimatedRef,
  useSharedValue,
  withDelay,
  withTiming,
  AnimatedRef,
} from 'react-native-reanimated';

const DURATION = 250;
export const TIMING_CONFIG = { duration: DURATION, easing: Easing.out(Easing.quad) };
const AVATAR_SIZE = 84;

export type ProfileAvatarAnimationResult = {
  targetRef: AnimatedRef<any>;
  onTargetLayout: () => void;
  expandedSize: number;
  // 1 = open, 0 = closed — numeric flag is cheaper to compare on the UI thread than string
  isOpen: SharedValue<number>;
  imageXCoord: SharedValue<number>;
  imageYCoord: SharedValue<number>;
  imageSize: SharedValue<number>;
  imageScale: SharedValue<number>;
  backdropOpacity: SharedValue<number>;
  closeBtnOpacity: SharedValue<number>;
  open: () => void;
  close: () => void;
  reset: () => void;
};

export function useProfileAvatarAnimation(): ProfileAvatarAnimationResult {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Compute once — stable numbers captured in worklet closures
  const screenCenterX = screenWidth / 2;
  const screenCenterY = screenHeight / 2;
  const expandedSize = screenWidth * 0.65;

  const targetRef = useAnimatedRef<any>();
  const measurementX = useSharedValue(0);
  const measurementY = useSharedValue(0);

  // Numeric 0/1 flag — avoids string comparison on the UI thread every animation frame
  const isOpen = useSharedValue(0);
  const imageXCoord = useSharedValue(screenCenterX - AVATAR_SIZE / 2);
  const imageYCoord = useSharedValue(screenCenterY - AVATAR_SIZE / 2);
  const imageSize = useSharedValue(AVATAR_SIZE);
  const imageScale = useSharedValue(1);
  // Separate backdrop opacity from blur intensity so Android can use a plain dark overlay
  // without triggering BlurView re-renders on every frame
  const backdropOpacity = useSharedValue(0);
  const closeBtnOpacity = useSharedValue(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTargetLayout = () => {
    if (timerRef.current !== null) {
      return;
    }
    timerRef.current = setTimeout(() => {
      runOnUI(() => {
        const result = measure(targetRef);
        if (result === null) {
          return;
        }
        measurementX.value = result.pageX;
        measurementY.value = result.pageY;
        imageXCoord.value = result.pageX;
        imageYCoord.value = result.pageY;
      })();
    }, 500);
  };

  const open = () => {
    'worklet';

    isOpen.value = 1;
    backdropOpacity.value = withTiming(1, TIMING_CONFIG);
    imageSize.value = withTiming(expandedSize, TIMING_CONFIG);
    imageXCoord.value = withTiming(screenCenterX - expandedSize / 2, TIMING_CONFIG);
    imageYCoord.value = withTiming(screenCenterY - expandedSize / 2, TIMING_CONFIG);
    closeBtnOpacity.value = withDelay(DURATION, withTiming(1));
  };

  const close = () => {
    'worklet';

    const x = measurementX.value;
    const y = measurementY.value;
    // Delay the flag so the avatar placeholder doesn't reappear before the image lands
    isOpen.value = withDelay(DURATION, withTiming(0, { duration: 0 }));
    backdropOpacity.value = withTiming(0, TIMING_CONFIG);
    imageSize.value = withTiming(AVATAR_SIZE, TIMING_CONFIG);
    imageXCoord.value = withTiming(x, TIMING_CONFIG);
    imageYCoord.value = withTiming(y, TIMING_CONFIG);
    closeBtnOpacity.value = withTiming(0, { duration: DURATION });
  };

  const reset = () => {
    'worklet';

    const closedX = measurementX.value || screenCenterX - AVATAR_SIZE / 2;
    const closedY = measurementY.value || screenCenterY - AVATAR_SIZE / 2;

    isOpen.value = 0;
    backdropOpacity.value = 0;
    closeBtnOpacity.value = 0;
    imageScale.value = 1;
    imageSize.value = AVATAR_SIZE;
    imageXCoord.value = closedX;
    imageYCoord.value = closedY;
  };

  return {
    targetRef,
    onTargetLayout,
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
    reset,
  };
}
