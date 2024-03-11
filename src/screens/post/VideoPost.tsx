import React, { useState } from 'react';
import Video from 'react-native-video';
import { useTheme } from '@react-navigation/native';
import {
  View,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import FastImage from 'react-native-fast-image';
import StyledText from '@/src/components/styled/Text';
import { borderRadius } from '@/src/styles/outlines';
import StyledTextInput from '@/src/components/styled/TextInput';
import { Colors } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import Button from '@/src/components/Button';
import styles from './styles';
import { MainStackParamList } from '@/src/navigator/types';
import CameraComponent from '@/src/components/VideoPost/Camera';
import { spacing } from '@/src/styles/spacing';

const closeIcon = require('@/assets/images/close.png');
const createWatch = require('@/assets/images/CreateWatch.png');

type Props = StackScreenProps<MainStackParamList, 'VideoPost'>;

function VideoPost({ navigation }: Props) {
  const { colors } = useTheme();
  const [VideoPath, setVideoPath] = useState<string | undefined>(undefined);
  const [content, setContent] = useState<string>('');
  const uploadToMux = async () => {};
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
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 30,
                    overflow: 'hidden',
                    aspectRatio: '9/16',
                    margin: 'auto',
                  }}
                >
                  <Video
                    source={{ uri: VideoPath || '' }}
                    resizeMode="contain"
                    repeat
                    // controls
                    style={{ flex: 1 }}
                  />
                </View>
              </View>

              <View style={styles.banner}>
                <TouchableOpacity
                  onPress={() => {
                    setVideoPath('');
                  }}
                >
                  <FastImage
                    style={{ width: 15, height: 15 }}
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
              <KeyboardAvoidingView style={styles.bottomContainer}>
                <StyledTextInput
                  style={{ height: 100, flexGrow: 1, color: colors.text }}
                  inputStyle={{}}
                  inputWrapperStyle={{
                    paddingVertical: spacing.x10,
                    borderRadius: borderRadius.base,
                  }}
                  value={content}
                  multiline
                  returnKeyType="done"
                  label=""
                  autoCorrect
                  placeholder="What's on your heart?"
                  placeholderTextColor={Colors.neutral[300]}
                  onChangeText={(value) => {
                    setContent(value);
                  }}
                />
                <Button
                  disabled={false}
                  onPress={uploadToMux}
                  btnStyle={[button.primary, { flex: 1, marginTop: 20 }]}
                  disabledBtnStyle={[button.primary, { flex: 1, opacity: 0.5 }]}
                  disabledBtnTextStyle={{}}
                  content={
                    // eslint-disable-next-line react/jsx-no-useless-fragment
                    <>
                      {false ? (
                        <ActivityIndicator />
                      ) : (
                        <StyledText style={{ color: 'white' }}>Post</StyledText>
                      )}
                    </>
                  }
                />
              </KeyboardAvoidingView>
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default VideoPost;
