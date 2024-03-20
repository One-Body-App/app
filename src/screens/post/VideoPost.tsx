import React, { useState } from 'react';
import Video from 'react-native-video';
import { useTheme } from '@react-navigation/native';
import {
  View,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as FileSystem from 'react-native-fs';
import { ActivityIndicator } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import base64 from 'base-64';
import axios from 'axios';
import RNFetchBlob from 'rn-fetch-blob';
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

type Props = StackScreenProps<MainStackParamList, 'VideoPost'>;

function VideoPost({ navigation }: Props) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors } = useTheme();
  const [VideoPath, setVideoPath] = useState<string | undefined>(undefined);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const uploadToMux = async () => {
    setLoading(true);
    try {
      // 1. Fetch the authenticated link from the server
      const muxLink = await ApiCall({
        route: `watch/authenticated-link/mux`,
        verb: 'get',
        token,
      });
      console.log('🚀 ~ VideoPost ~ VideoPath:', VideoPath);
      // 2. Get Video to Blob
      let finalBlob: Blob;
      if (Platform.OS === 'ios') {
        const iosResponse = await RNFetchBlob.fetch('GET', VideoPath!, {});
        const iosBase64Str = iosResponse.data;
        const base64Response = await fetch(`data:video/mp4;base64,${iosBase64Str}`);
        const blob = await base64Response.blob();
        finalBlob = blob;
        console.log('🚀 ~ uploadToMux ~ iosResponse:', blob);
      } else {
        const androidExists = await RNFetchBlob.fs.exists(VideoPath!);
        console.log('🚀 ~ uploadToMux ~ androidExists:', androidExists);
        const androidResponse = await fetch(VideoPath!, {
          method: 'GET',
        }).catch((error) => {
          console.error('🚀 ~ uploadToMux ~ error:', error);
        });
        const blob = androidResponse?.blob();
        // console.log('🚀 ~ uploadToMux ~ aa:', base64Response.data);
        // const blob = await base64Response.data.blob();
        finalBlob = blob ?? undefined;
        // console.log('🚀 ~ uploadToMux ~ aa:', a);
        // const androidResponse = await RNFetchBlob.fs.readFile(VideoPath!, 'base64');
        // const androidBase64Str = androidResponse;
        // const blob = 'a'; // new Blob([a], { type: 'video/mp4' } as any);
        // const base64Response = await fetch(`data:video/mp4;base64,${androidBase64Str}`);
        // const blob = await base64Response.blob();
        // finalBlob = blob;
        // console.log('🚀 ~ uploadToMux ~ response:', blob);
      }
      // const imageResponse = await fetch(VideoPath!, {
      //   method: 'GET',
      // });
      // console.log('🚀 ~ uploadToMux ~ 1', imageResponse);
      // const blob = await imageResponse.blob();
      // console.log('🚀 ~ uploadToMux ~ 2', blob);

      // await RNFetchBlob.fetch('GET', VideoPath!, {})
      //   .then(async (res) => {
      //     console.log('🚀 ~ .then ~ res:', res);
      //     const info = res.info();
      //     console.log('🚀 ~ .then ~ info:', info);
      //     const { status } = res.info();

      //     if (status == 200) {
      //       // the conversion is done in native code
      //       const base64Str = res.blob('video/mp4', 265017);
      //       console.log('🚀 ~ .then ~ base64Str:', base64Str);
      //       // // the following conversions are done in js, it's SYNC
      //       // const text = res.text();
      //       // const json = res.json();
      //     } else {
      //       // handle other status codes
      //     }
      //   })
      //   // Something went wrong:
      //   .catch((errorMessage, statusCode) => {
      //     console.error(errorMessage);
      //     // error handling
      //   });
      if (!finalBlob) {
        await fetch(muxLink.response?.url, {
          method: 'PUT',
          body: finalBlob,
          headers: { 'content-type': finalBlob.type },
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
              console.log('🚀 ~ .then ~ response:', response?.data);
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
                  console.log('🚀 ~ .then ~ responseAsset.data.data:', responseAsset.data.data);
                  // const postVideo = await ApiCall({
                  //   route: `watch/post`,
                  //   verb: 'post',
                  //   params: {
                  //     content,
                  //     videoId: muxLink.response.id,
                  //     playBackId: responseAsset.data.data.playback_ids[0].id,
                  //   },
                  //   token,
                  // });
                  // navigation.navigate('MainRoot', {
                  //   screen: 'Main',
                  //   params: {
                  //     screen: 'HomeTab',
                  //     params: {
                  //       screen: 'WatchPortal',
                  //     },
                  //   },
                  // });
                }
              }
            });
        });
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { marginVertical: Platform.OS == 'ios' ? 50 : 0 }]}>
        <View style={styles.subContainer}>
          {!VideoPath ? (
            <CameraComponent setVideoPath={setVideoPath} />
          ) : (
            <SafeAreaView
              style={{
                flex: 1,
                paddingTop: spacing.x10,
              }}
            >
              <View style={{ flex: 1, alignItems: 'center', paddingTop: 50 }}>
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
