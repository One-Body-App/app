import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  View,
  StyleSheet,
  Platform,
  StyleProp,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import BottomSheetEntranceGlow from './BottomSheetEntranceGlow';
import { getKeyboardAvoidanceOffset } from './CustomModal.utils';

export default function CustomModal({
  modalVisible,
  onclose,
  children,
  style,
  enableEntranceGlow = false,
  avoidKeyboard = false,
  externalTranslateY,
}: {
  modalVisible: boolean;
  onclose?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  enableEntranceGlow?: boolean;
  avoidKeyboard?: boolean;
  externalTranslateY?: SharedValue<number>;
}) {
  const translateY = useSharedValue(0);
  const previouslyVisibleRef = useRef(false);
  const hasPlayedEntranceGlowRef = useRef(false);
  const [glowPlayKey, setGlowPlayKey] = useState(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const { height: screenHeight } = useWindowDimensions();

  const handleClose = useCallback(() => {
    if (onclose) {
      onclose();
    }
  }, [onclose]);

  useEffect(() => {
    const opening = modalVisible && !previouslyVisibleRef.current;
    if (opening) {
      translateY.value = 0;
      setKeyboardOffset(0);
      if (enableEntranceGlow && !hasPlayedEntranceGlowRef.current) {
        hasPlayedEntranceGlowRef.current = true;
        setGlowPlayKey((previous) => previous + 1);
      }
    }
    if (!modalVisible) {
      setKeyboardOffset(0);
    }
    previouslyVisibleRef.current = modalVisible;
  }, [enableEntranceGlow, modalVisible, translateY]);

  const resolveKeyboardOffset = useCallback(
    (height: number) =>
      getKeyboardAvoidanceOffset({
        avoidKeyboard,
        modalVisible,
        keyboardHeight: height,
        sheetHeight,
        viewportHeight: screenHeight,
      }),
    [avoidKeyboard, modalVisible, screenHeight, sheetHeight]
  );

  useEffect(() => {
    if (!avoidKeyboard || !modalVisible) {
      return undefined;
    }

    const updateOffset = (event: { endCoordinates?: { height?: number } }) => {
      setKeyboardOffset(resolveKeyboardOffset(event.endCoordinates?.height ?? 0));
    };

    const resetOffset = () => {
      setKeyboardOffset(0);
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const frameEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidChangeFrame';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, updateOffset);
    const onFrame = Keyboard.addListener(frameEvent, updateOffset);
    const onHide = Keyboard.addListener(hideEvent, resetOffset);

    return () => {
      onShow.remove();
      onFrame.remove();
      onHide.remove();
    };
  }, [avoidKeyboard, modalVisible, resolveKeyboardOffset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: translateY.value + (externalTranslateY?.value ?? 0) - keyboardOffset,
      },
    ],
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        translateY.value = withTiming(screenHeight, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(handleClose)();
          }
          translateY.value = 0;
        });
      } else {
        translateY.value = withSpring(0);
      }
    });

  return (
    <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={onclose}>
      <Pressable style={styles.backdrop} onPress={onclose}>
        <View pointerEvents="none" style={styles.backdrop}>
          <View style={styles.backdropScrim} />
        </View>
      </Pressable>

      <View style={styles.wrapper} pointerEvents="box-none">
        {enableEntranceGlow ? (
          <BottomSheetEntranceGlow playKey={glowPlayKey} style={styles.entranceGlow} />
        ) : null}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            testID="custom-modal-sheet"
            onLayout={(event) => {
              const nextHeight = event.nativeEvent.layout.height;
              if (nextHeight > 0 && nextHeight !== sheetHeight) {
                setSheetHeight(nextHeight);
              }
            }}
            style={[styles.modalContainer, style, animatedStyle]}
          >
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 0,
    margin: 0,
  },
  entranceGlow: {
    height: 460,
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '100%',
    minHeight: '50%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#032f3c',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
