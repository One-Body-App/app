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
import { PanGestureHandler, State } from 'react-native-gesture-handler';

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

  const onGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
    useNativeDriver: true,
  });

  const onHandlerStateChange = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationY > 100) {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onclose();
          translateY.setValue(0);
        });
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <Modal
      visible={modalVisible}
      animationType="fade"
      transparent
      onRequestClose={onclose}
      style={style}
    >
      <TouchableWithoutFeedback onPress={onclose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrapper}
      >
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View style={[styles.modalContainer, { transform: [{ translateY }] }]}>
            {children}
          </Animated.View>
        </PanGestureHandler>
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
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
});
