import React, { useState } from 'react';
import Video from 'react-native-video';
import { useTheme } from '@react-navigation/native';
import {
  View,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  KeyboardAvoidingView,
  SafeAreaView,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import base64 from 'base-64';
import axios from 'axios';
import { RootState } from '@/src/redux/reducers/rootReducer';
import StyledText from '@/src/components/styled/Text';
import { borderRadius } from '@/src/styles/outlines';
import StyledTextInput from '@/src/components/styled/TextInput';
import { Colors } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import Button from '@/src/components/Button';
import styles from './styles';
import { ApiCall } from '@/src/services/api';
import { MainStackParamList } from '@/src/navigator/types';
import CameraComponent from '@/src/components/VideoPost/Camera';
import { spacing } from '@/src/styles/spacing';
import { MUX_SECRET_KEY, MUX_TOKEN_ID } from '@/src/services/constants';

const closeIcon = require('@/assets/images/close.png');
const createWatch = require('@/assets/images/CreateWatch.png');

type Props = StackScreenProps<MainStackParamList, 'VideoPost'>;

function VideoPost({ navigation }: Props) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors } = useTheme();
  const [VideoPath, setVideoPath] = useState<string | undefined>(undefined);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const uploadToMux = async () => {
    setLoading(true);
    const muxLink = await ApiCall({
      route: `watch/authenticated-link/mux`,
      verb: 'get',
      token,
    });

    try {
      const imageResponse = await fetch(VideoPath!, {
        method: 'GET',
      });
      const blob = await imageResponse.blob();
      await fetch(muxLink.response?.url, {
        method: 'PUT',
        body: blob,
        headers: { 'content-type': blob.type },
      }).then(async () => {
        const authString = `${MUX_TOKEN_ID}:${MUX_SECRET_KEY}`;
        const response = await axios
          .get(`https://api.mux.com/video/v1/uploads/${muxLink.response.id}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${base64.encode(authString)}`,
            },
          })
          .then(async (response) => {
            if (response.data.data.status === 'waiting') {
              setTimeout(async () => {
                const responseAsset = await axios.get(
                  `https://api.mux.com/video/v1/assets/${response.data.data.asset_id}`,
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Basic ${base64.encode(authString)}`,
                    },
                  }
                );
              }, 3600);
            } else {
              const responseAsset = await axios.get(
                `https://api.mux.com/video/v1/assets/${response.data.data.asset_id}`,
                {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${base64.encode(authString)}`,
                  },
                }
              );
              if (responseAsset.data.data.playback_ids[0].id) {
                const postVideo = await ApiCall({
                  route: `watch/post`,
                  verb: 'post',
                  params: {
                    content,
                    videoId: muxLink.response.id,
                    playBackId: responseAsset.data.data.playback_ids[0].id,
                  },
                  token,
                });
                navigation.navigate('MainRoot', {
                  screen: 'Main',
                  params: {
                    screen: 'HomeTab',
                    params: {
                      screen: 'WatchPortal',
                    },
                  },
                });
              }
            }
          });
      });
      setLoading(false);
    } catch (error) {
      console.log('🚀 ~ uploadToMux ~ response:', error);
      setLoading(false);
    }
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.subContainer}>
          {!VideoPath ? (
            <CameraComponent setVideoPath={setVideoPath}>
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
            <SafeAreaView
              style={{
                flex: 1,
                paddingTop: spacing.x10,
              }}
            >
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 30,
                    overflow: 'hidden',
                    aspectRatio: '9/16',
                    margin: 'auto',
                    marginTop: spacing.x30,
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
                      {loading ? (
                        <ActivityIndicator />
                      ) : (
                        <StyledText style={{ color: 'white' }}>Post</StyledText>
                      )}
                    </>
                  }
                />
              </KeyboardAvoidingView>
            </SafeAreaView>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default VideoPost;
