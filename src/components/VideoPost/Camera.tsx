import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import React, { Dispatch, PropsWithChildren, SetStateAction, useRef, useState } from 'react';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import FastImage from 'react-native-fast-image';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import { isValidVideo, showEditor } from 'react-native-video-trim';
import videoPostStyles from './styles';

const cameraIos = require('@/assets/icons/camera-ios.png');

type Props = {
  videoPath?: string;
  setVideoPath: Dispatch<SetStateAction<string | undefined>>;
};

function CameraComponent({ videoPath, setVideoPath, children }: PropsWithChildren<Props>) {
  const camera = useRef<Camera>(null);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
  const [latestGalleryImg, setLatestGalleryImg] = useState<any>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideo, setRecordedVideo] = useState<any>('');
  const devices = useCameraDevice(isFrontCamera ? 'front' : 'back');
  const animatedColor = new Animated.Value(0);

  const backgroundColor = animatedColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['white', 'red'],
  });
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

  if (devices == null) {
    return (
      <View style={videoPostStyles.noCam}>
        <Text>Camera not available</Text>
      </View>
    );
  }

  return (
    <>
      <Camera ref={camera} style={StyleSheet.absoluteFill} device={devices} isActive video />
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
              style={[videoPostStyles.recordBtnView, { backgroundColor: `${backgroundColor}` }]}
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
