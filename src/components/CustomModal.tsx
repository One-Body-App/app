import React, { useCallback, useEffect } from 'react';
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
  const handleClose = useCallback(() => {
    if (onclose) {
      onclose();
    }
  }, [onclose]);

  useEffect(() => {
    if (modalVisible) {
      translateY.value = 0;
    }
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
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrapper}
        pointerEvents="box-none"
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalContainer, style, animatedStyle]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 0,
    margin: 0,
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '100%',
    minHeight: '50%',
    width: '100%',
  },
});
