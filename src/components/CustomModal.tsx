import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import BottomSheetEntranceGlow from './BottomSheetEntranceGlow';

const screenHeight = Dimensions.get('window').height;

export default function CustomModal({
  modalVisible,
  onclose,
  children,
  style,
}: {
  modalVisible: boolean;
  onclose?: () => void;
  children: React.ReactNode;
  style?: object;
}) {
  const translateY = useSharedValue(0);
  const previouslyVisibleRef = useRef(false);
  const hasPlayedEntranceGlowRef = useRef(false);
  const [glowPlayKey, setGlowPlayKey] = useState(0);

  const handleClose = useCallback(() => {
    if (onclose) {
      onclose();
    }
  }, [onclose]);

  useEffect(() => {
    const opening = modalVisible && !previouslyVisibleRef.current;
    if (opening) {
      translateY.value = 0;
      if (!hasPlayedEntranceGlowRef.current) {
        hasPlayedEntranceGlowRef.current = true;
        setGlowPlayKey((previous) => previous + 1);
      }
    }
    previouslyVisibleRef.current = modalVisible;
  }, [modalVisible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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
      <TouchableWithoutFeedback onPress={onclose}>
        <View style={styles.backdrop}>
          <View style={styles.backdropScrim} />
        </View>
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrapper}
        pointerEvents="box-none"
      >
        <BottomSheetEntranceGlow playKey={glowPlayKey} style={styles.entranceGlow} />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalContainer, style, animatedStyle]}>
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
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
    zIndex: 1,
  },
});
