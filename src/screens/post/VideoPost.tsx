import React, { useState } from 'react';
import { View, Text, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import FastImage from 'react-native-fast-image';
import styles from './styles';
import { MainStackParamList } from '@/src/navigator/types';
import CameraComponent from '@/src/components/VideoPost/Camera';

const closeIcon = require('@/assets/images/close.png');
const createWatch = require('@/assets/images/CreateWatch.png');

type Props = StackScreenProps<MainStackParamList, 'VideoPost'>;

function VideoPost({ navigation }: Props) {
  const [VideoPath, setVideoPath] = useState<string | undefined>(undefined);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.subContainer}>
          {!VideoPath ? (
            <CameraComponent videoPath={VideoPath} setVideoPath={setVideoPath}>
              <View style={styles.cameraView}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.goBack();
                  }}
                >
                  <FastImage
                    style={styles.closeImg}
                    resizeMode={FastImage.resizeMode.contain}
                    source={closeIcon}
                  />
                </TouchableOpacity>
                <FastImage
                  style={{ width: 145 }}
                  resizeMode={FastImage.resizeMode.contain}
                  source={createWatch}
                />
                <View />
              </View>
            </CameraComponent>
          ) : (
            <Text style={styles.button}>Bye</Text>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default VideoPost;
