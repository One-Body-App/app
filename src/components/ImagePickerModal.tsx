import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import { Colors } from '../styles';
import StyledText from './styled/Text';
import CustomModal from './CustomModal';

type Props = {
  visible: boolean;
  hideVisible: () => void;
  galleryImage: () => void;
  cameraImage: () => void;
};
function ImagePickerModal(props: Props) {
  const { visible, hideVisible, galleryImage, cameraImage } = props;
  return (
    <CustomModal modalVisible={visible} onclose={hideVisible} style={styles.bottomView}>
      <View style={styles.content2}>
        <View style={[styles.headLine, { backgroundColor: Colors.neutral[600] }]} />
        <View style={[styles.container, { backgroundColor: Colors.neutral[800] }]}>
          <TouchableOpacity style={styles.boxes} onPress={galleryImage}>
            <Icon name="photo-video" size={35} color="#126B87" />
            <StyledText
              style={{
                width: '50%',
                textAlign: 'center',
                marginTop: getHeight(1),
              }}
            >
              Choose From Gallery
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.boxes} onPress={cameraImage}>
            <Icon name="camera-retro" size={35} color="#126B87" />
            <StyledText
              style={{
                width: '50%',
                textAlign: 'center',
                marginTop: getHeight(1),
              }}
            >
              Open Camera
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </CustomModal>
  );
}

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
    alignItems: 'center',
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
    height: getHeight(25),
  },
  headLine: {
    height: 6,
    width: 55,
    borderRadius: 5,

    marginBottom: 5,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',

    flexDirection: 'row',
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
