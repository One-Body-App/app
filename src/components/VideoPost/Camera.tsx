import React, { useRef, useState, useEffect, useCallback, FC } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import {
  Camera,
  CameraPermissionStatus,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import FastImage from 'react-native-fast-image';
import StyledText from '../styled/Text';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';
import videoPostStyles from './styles';

const cameraIos = require('@/assets/icons/camera-ios.png');

interface CameraComponentProps {
  setVideoPath: (path: string | undefined) => void;
}

function CameraComponent({ setVideoPath }: CameraComponentProps) {
  const permission = useCameraPermission();
  const camera = useRef<Camera>(null);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
  const [latestGalleryImg, setLatestGalleryImg] = useState<string>('/');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  // Removed unused recordedVideo state
  const devices = useCameraDevice(isFrontCamera ? 'front' : 'back');
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionStatus>('not-determined');

  const handleSelectionFromGallery = async () => {
    const response = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 1,
    });
    if (response?.assets && response.assets.length > 0) {
      const uri = response.assets[0]?.uri;
      if (uri) {
        setVideoPath(uri);
      }
    }
  };

  const handleStartRecording = async () => {
    if (!isRecording && camera.current) {
      try {
        setIsRecording(true);
        camera.current.startRecording({
          videoCodec: 'h265',
          onRecordingFinished: (video) => {
            // setRecordedVideo(video.path); // removed unused state
            setVideoPath(video.path);
            setIsRecording(false);
          },
          onRecordingError: (error) => {
            // console.error('Recording error:', error);
            setIsRecording(false);
          },
        });
      } catch (error) {
        // console.error('Start recording error:', error);
        setIsRecording(false);
      }
    } else {
      camera.current?.stopRecording();
      setIsRecording(false);
    }
  };

  const fetchPhotos = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });
    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0]?.uri;
      if (uri) setLatestGalleryImg(uri);
    }
  }, []);

  const getPermissions = async () => {
    const cameraPerm = await Camera.requestCameraPermission();
    const micPerm = await Camera.requestMicrophonePermission();
    if (cameraPerm === 'denied' || micPerm === 'denied') {
      await permission.requestPermission();
    }
    setCameraPermission(cameraPerm);
  };

  useEffect(() => {
    getPermissions();
  }, []);

  if (!devices) {
    return (
      <View style={videoPostStyles.noCam}>
        <StyledText>Camera not available</StyledText>
      </View>
    );
  }

  if (cameraPermission === 'not-determined') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.brand} />
      </View>
    );
  }

  return (
    <>
      <Camera ref={camera} style={StyleSheet.absoluteFill} device={devices} isActive video audio />
      <View style={videoPostStyles.cameraBtncontainer}>
        <View style={videoPostStyles.btnSubContainer}>
          <TouchableOpacity onPress={handleSelectionFromGallery}>
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
          <TouchableOpacity onPress={() => setIsFrontCamera((prev) => !prev)}>
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraComponent;
