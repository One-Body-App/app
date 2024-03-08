import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  NativeEventEmitter,
  NativeModules,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Animated,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { ActivityIndicator } from 'react-native-paper';
import FastImage from 'react-native-fast-image';
import { StackScreenProps } from '@react-navigation/stack';
import Video from 'react-native-video';
import { isValidVideo, showEditor } from 'react-native-video-trim';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import base64 from 'base-64';
import axios from 'axios';
import { useTheme } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import styles from './styles';
import { MainStackParamList } from '@/src/navigator/types';
import { button } from '@/src/styles/buttons';
import Button from '@/src/components/Button';
import StyledText from '@/src/components/styled/Text';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import StyledTextInput from '@/src/components/styled/TextInput';
import { ApiCall } from '@/src/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MUX_SECRET_KEY, MUX_TOKEN_ID } from '@/src/services/constants';
import { FeedTypes } from '../home';

const closeIcon = require('@/assets/images/close.png');
const createWatch = require('@/assets/images/CreateWatch.png');
const cameraIos = require('@/assets/icons/camera-ios.png');

type Props = StackScreenProps<MainStackParamList, 'VideoPost'>;

function VideoPost({ navigation }: Props) {
  const { colors } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideo, setRecordedVideo] = useState<any>('');
  const [content, setContent] = useState<string>('');
  const [VideoPath, setVideoPath] = useState<string>('');
  const [latestGalleryImg, setLatestGalleryImg] = useState<any>('');
  const devices = useCameraDevice(isFrontCamera ? 'front' : 'back');
  const camera = useRef<Camera>(null);
  const animatedColor = new Animated.Value(0);

  useEffect(() => {
    async function getPermission() {
      await Camera.requestCameraPermission();
    }
    getPermission();
    fetchPhotos();
  }, []);

  const fetchPhotos = useCallback(async () => {
    const res = await CameraRoll.getPhotos({
      first: 1,
    });
    const image_url = res?.edges[0]?.node?.image;

    setLatestGalleryImg(image_url?.uri);
  }, []);

  useEffect(() => {
    async function getPermissions() {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();

      if (cameraPermission === 'denied' || microphonePermission === 'denied') {
        // await Linking.openSettings();
      }
    }
    getPermissions();
    fetchPhotos();
    const eventEmitter = new NativeEventEmitter(NativeModules.VideoTrim);
    const subscription = eventEmitter.addListener('VideoTrim', (event) => {
      switch (event.name) {
        case 'onFinishTrimming': {
          // on trimming is done

          setVideoPath(event?.outputPath);
          break;
        }
        case 'onError': {
          break;
        }
        default:
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (devices == null) {
    return (
      <View style={styles.noCam}>
        <Text>Camera not available</Text>
      </View>
    );
  }
  const toggleCamera = () => {
    setIsFrontCamera((prevState) => !prevState);
  };
  const handleStartRecording = async () => {
    if (!isRecording) {
      try {
        if (camera.current) {
          setIsRecording(true);
          Animated.timing(animatedColor, {
            toValue: 100,
            duration: 5,
            useNativeDriver: false, // You can set it to true if using Reanimated 2
          }).start();
          camera.current.startRecording({
            onRecordingFinished: (video) => {
              setRecordedVideo(video);
              isValidVideo(video?.path || '').then((res) => console.log(res));

              showEditor(video?.path || '', {
                saveToPhoto: false,
                maxDuration: 60,
              });
            },
            onRecordingError: (error) => console.error(error),
          });
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      setIsRecording(false);
      camera.current?.stopRecording();
    }
  };

  // const handleSaveVideo = async () => {
  //   try {
  //     if (recordedVideo && recordedVideo.path) {
  //       await CameraRoll.save(recordedVideo.path, {
  //         type: 'video',
  //         album: 'Secrate Face Changer',
  //       });
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const handleSelectionFromGallery = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'video',
      selectionLimit: 1,
    };
    const response = await launchImageLibrary(options);
    if (response?.assets && response?.assets.length > 0) {
      setRecordedVideo(response?.assets[0]?.uri);
      isValidVideo(response?.assets[0]?.uri || '').then((res) => {});
      showEditor(response?.assets[0]?.uri || '', {
        saveToPhoto: false,
        maxDuration: 60,
      });
    }
  };

  const backgroundColor = animatedColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['white', 'red'],
  });
  const uploadToMux = async () => {
    const muxLink = await ApiCall({
      route: `watch/authenticated-link/mux`,
      verb: 'get',
      token,
    });

    try {
      const imageResponse = await fetch(VideoPath, {
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
                      screen: 'Home',
                      params: {
                        selectedTab: FeedTypes.Watch,
                      },
                    },
                  },
                });
              }
            }
          });
      });
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.subContainer}>
          {!VideoPath ? (
            <>
              <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={devices}
                isActive
                video
              />
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
              {/* //  Bottom section of camera with buttons */}
              <View style={styles.cameraBtncontainer}>
                <View style={styles.btnSubContainer}>
                  <TouchableOpacity
                    style={{ justifyContent: 'center' }}
                    onPress={handleSelectionFromGallery}
                  >
                    <View style={styles.galleryPreview}>
                      <Image
                        style={styles.imgPreview}
                        resizeMode="cover"
                        source={{ uri: latestGalleryImg }}
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.recordButton} onPress={handleStartRecording}>
                    <View
                      style={[styles.recordBtnView, { backgroundColor: `${backgroundColor}` }]}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={{ justifyContent: 'center' }} onPress={toggleCamera}>
                    <FastImage
                      style={styles.flipCameraImg}
                      resizeMode={FastImage.resizeMode.contain}
                      source={cameraIos}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={{ flex: 1 }}>
              <Video
                source={{ uri: VideoPath || '' }}
                resizeMode="cover"
                repeat
                // controls
                style={{ flex: 1 }}
              />
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
            </View>
          )}
        </View>
        {!isRecording && (
          <KeyboardAvoidingView
            behavior="position"
            keyboardVerticalOffset={-30}
            style={styles.bottomContainer}
          >
            <StyledTextInput
              style={{ height: 100, flexGrow: 1, color: colors.text }}
              inputStyle={{}}
              inputWrapperStyle={{ paddingVertical: spacing.x10, borderRadius: borderRadius.base }}
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
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

export default VideoPost;
