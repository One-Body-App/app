import {
  View,
  StyleSheet,
  TouchableOpacity,
  NativeModules,
  NativeEventEmitter,
  Image,
  ActivityIndicator,
} from 'react-native';
import React, {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
// import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import {
  Camera,
  CameraPermissionStatus,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import FastImage from 'react-native-fast-image';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
// import { isValidVideo, showEditor } from 'react-native-video-trim';
import videoPostStyles from './styles';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';
import StyledText from '../styled/Text';

const cameraIos = require('@/assets/icons/camera-ios.png');

type Props = {
  setVideoPath: Dispatch<SetStateAction<string | undefined>>;
};

function CameraComponent({ setVideoPath, children }: PropsWithChildren<Props>) {
  const permission = useCameraPermission();
  const camera = useRef<Camera>(null);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
  const [latestGalleryImg, setLatestGalleryImg] = useState<any>('/');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideo, setRecordedVideo] = useState<any>('');
  const devices = useCameraDevice(isFrontCamera ? 'front' : 'back');
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionStatus>('not-determined');

  const handleSelectionFromGallery = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'video',
      selectionLimit: 1,
    };
    const response = await launchImageLibrary(options);
    if (response?.assets && response?.assets.length > 0) {
      setRecordedVideo(response?.assets[0]?.uri);
      // isValidVideo(response?.assets[0]?.uri || 'xxxx');
      // showEditor(response?.assets[0]?.uri || '', {
      //   saveToPhoto: false,
      //   enableSaveDialog: false,
      //   maxDuration: 60,
      //   cancelDialogMessage: 'Are you sure you want to delete this?',
      //   cancelDialogConfirmText: 'Delete',
      // });
    }
  };

  const handleStartRecording = async () => {
    if (!isRecording) {
      try {
        if (camera.current) {
          setIsRecording(true);
          camera.current.startRecording({
            videoCodec: 'h265',
            onRecordingFinished: async (video) => {
              setRecordedVideo(video);
              // isValidVideo(video?.path || '');
              // showEditor(video?.path || '', {
              //   saveToPhoto: false,
              //   maxDuration: 60,
              //   enableSaveDialog: false,
              // });
            },
            onRecordingError: (error) => {
              console.log('🚀 ~ handleStartRecording ~ error:', error);
              console.error(error);
            },
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

  const fetchPhotos = useCallback(async () => {
    // const res = await CameraRoll.getPhotos({
    //   first: 1,
    // });
    // const image_url = res?.edges[0]?.node?.image;
    // setLatestGalleryImg(image_url?.uri);
  }, []);

  const getPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    const microphonePermission = await Camera.requestMicrophonePermission();

    if (cameraPermission === 'denied' || microphonePermission === 'denied') {
      // await Linking.openSettings();
      await permission.requestPermission();
    }
    setCameraPermission(cameraPermission);
  };

  useEffect(() => {
    getPermissions();
    fetchPhotos();
    const eventEmitter = new NativeEventEmitter(NativeModules.VideoTrim);
    const subscription = eventEmitter.addListener('VideoTrim', async (event) => {
      switch (event.name) {
        case 'onFinishTrimming': {
          // on trimming is done
          // if (Platform.OS === 'ios') {
          setVideoPath(event?.outputPath);
          // } else {
          //   const asset = await CameraRoll.saveAsset(event?.outputPath || '');
          //   setVideoPath(asset.node.image.uri);
          // }

          break;
        }
        case 'onError': {
          console.log('🚀 ~ handleStartRecording ~ error:', event);
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
      <View style={videoPostStyles.noCam}>
        <StyledText>Camera not available</StyledText>
      </View>
    );
  }

  if (cameraPermission === 'not-determined') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary.brand} />
      </View>
    );
  }

  return (
    <>
      <Camera ref={camera} style={StyleSheet.absoluteFill} device={devices} isActive video audio />
      {children}
      <View style={videoPostStyles.cameraBtncontainer}>
        <View style={videoPostStyles.btnSubContainer}>
          <TouchableOpacity
            style={{ justifyContent: 'center' }}
            onPress={handleSelectionFromGallery}
          >
            <View style={videoPostStyles.galleryPreview}>
              <Image
                style={videoPostStyles.imgPreview}
                resizeMode="cover"
                source={{ uri: latestGalleryImg }}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={videoPostStyles.recordButton} onPress={handleStartRecording}>
            <View
              style={[
                videoPostStyles.recordBtnView,
                {
                  margin: isRecording ? spacing.x10 : 3,
                  borderRadius: isRecording ? 8 : 30,
                  transform: [{ scale: isRecording ? 0.8 : 1 }],
                },
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ justifyContent: 'center' }}
            onPress={() => {
              setIsFrontCamera((prevState) => !prevState);
            }}
          >
            <FastImage
              style={videoPostStyles.flipCameraImg}
              resizeMode={FastImage.resizeMode.contain}
              source={cameraIos}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

export default CameraComponent;
