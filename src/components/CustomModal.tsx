import React, { useRef } from 'react';
import {
  Modal,
  View,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

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
  const translateY = useRef(new Animated.Value(0)).current;

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.setValue(event.translationY);
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          if (onclose) onclose();
          translateY.setValue(0);
        });
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
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
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalContainer, style, { transform: [{ translateY }] }]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 0,
    margin: 0,
  },
  modalContainer: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // padding: 20,
    maxHeight: '100%',
    minHeight: '50%',
  },
});
