import React, { useState } from 'react';
import { Text } from 'react-native';
import { View } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
type Props = {
  visible: boolean;
  hideVisible: () => void;
  galleryImage: () => void;
  cameraImage: () => void;
};
const ImagePickerModal = (props: Props) => {
  return (
    <Modal
      backdropOpacity={0.3}
      isVisible={props.visible}
      onBackdropPress={() => props.hideVisible()}
      onSwipeComplete={() => props.hideVisible()}
      swipeDirection={['down']}
      style={styles.bottomView}
    >
      <View style={styles.content2}>
        <View style={styles.headLine} />
        <View style={styles.container}>
          <TouchableOpacity style={styles.boxes} onPress={props.galleryImage}>
            <Icon name="photo-video" size={35} color="#126B87" />
            <Text
              style={{
                width: '50%',
                textAlign: 'center',
                marginTop: getHeight(1),
              }}
            >
              Choose From Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.boxes} onPress={props.cameraImage}>
            <Icon name="camera-retro" size={35} color="#126B87" />
            <Text
              style={{
                width: '50%',
                textAlign: 'center',
                marginTop: getHeight(1),
              }}
            >
              Open Camera
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba( 0, 0, 0, 0.6 )',
  },
  buttonView: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  IconClose: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  boxesview: {
    justifyContent: 'space-around',
    flex: 1,
    flexDirection: 'row',
  },
  boxes: {
    width: getWidth(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  content2: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 13,
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
    height: getHeight(25),
  },
  headLine: {
    height: 6,
    width: 55,
    borderRadius: 5,
    backgroundColor: '#EAEAEA',
    marginBottom: 5,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',

    flexDirection: 'row',
    backgroundColor: 'white',
  },
  modalView: {
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 3,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    borderTopColor: '#DF4B38',
    borderRightColor: '#DF4B38',
    borderLeftColor: '#DF4B38',
    backgroundColor: 'white',
    width: '100%',
    height: '27%',
    position: 'absolute',
    bottom: 0,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default ImagePickerModal;
