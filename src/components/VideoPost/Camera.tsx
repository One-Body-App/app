import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  BackHandler,
  StatusBar,
  type GestureResponderEvent,
} from 'react-native';
import React, {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { Camera, type CameraPermissionStatus } from 'react-native-vision-camera/src/Camera';
import type { VideoStabilizationMode } from 'react-native-vision-camera/src/types/CameraDevice';
import { Templates } from 'react-native-vision-camera/src/devices/Templates';
import { useCameraDevice } from 'react-native-vision-camera/src/hooks/useCameraDevice';
import { useCameraFormat } from 'react-native-vision-camera/src/hooks/useCameraFormat';
import FastImage from 'react-native-fast-image';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import videoPostStyles from './styles';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';
import StyledText from '../styled/Text';

const cameraIos = require('@/assets/icons/camera-ios.png');

const FORMAT_PRESETS = ['Video', 'Instagram', 'Snapchat'] as const;
const FPS_PRESETS = [24, 30, 60] as const;
const BITRATE_PRESETS = ['low', 'normal', 'high'] as const;
const CODEC_PRESETS = ['h264', 'h265'] as const;
const FILTER_PRESETS = [
  { id: 'None', overlay: 'transparent' },
  { id: 'Cool', overlay: 'rgba(52, 152, 219, 0.12)' },
  { id: 'Warm', overlay: 'rgba(241, 196, 15, 0.12)' },
  { id: 'Mono', overlay: 'rgba(120, 120, 120, 0.14)' },
] as const;

type FormatPreset = (typeof FORMAT_PRESETS)[number];
type FpsPreset = (typeof FPS_PRESETS)[number];
type BitratePreset = (typeof BITRATE_PRESETS)[number];
type CodecPreset = (typeof CODEC_PRESETS)[number];

type Props = {
  setVideoPath: Dispatch<SetStateAction<string | undefined>>;
  onClose?: () => void;
};

function CameraComponent({ setVideoPath, onClose, children }: PropsWithChildren<Props>) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const insets = useSafeAreaInsets();
  const camera = useRef<Camera>(null);
  const focusResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
  const [latestGalleryImg, setLatestGalleryImg] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isCameraInitialized, setIsCameraInitialized] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const devices = useCameraDevice(isFrontCamera ? 'front' : 'back');
  const [formatPreset, setFormatPreset] = useState<FormatPreset>('Video');
  const [fps, setFps] = useState<FpsPreset>(30);
  const [videoBitRate, setVideoBitRate] = useState<BitratePreset>('high');
  const [videoCodec, setVideoCodec] = useState<CodecPreset>('h265');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [videoHdr, setVideoHdr] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [exposure, setExposure] = useState<number>(0);
  const [stabilizationMode, setStabilizationMode] = useState<VideoStabilizationMode>('auto');
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [cameraPermissionStatus, setCameraPermissionStatus] =
    useState<CameraPermissionStatus>('not-determined');
  const [microphonePermissionStatus, setMicrophonePermissionStatus] =
    useState<CameraPermissionStatus>('not-determined');
  const format = useCameraFormat(devices, Templates[formatPreset]);

  const ensureFileUri = useCallback((value?: string) => {
    if (!value) {
      return '';
    }
    if (value.startsWith('file://') || value.startsWith('content://')) {
      return value;
    }
    return `file://${value}`;
  }, []);

  const handleSelectionFromGallery = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'video',
      selectionLimit: 1,
      includeExtra: true,
      assetRepresentationMode: 'current',
      ...(Platform.OS === 'ios'
        ? {
            presentationStyle: 'fullScreen',
          }
        : {}),
    };
    const response = await launchImageLibrary(options).catch(() => undefined);
    if (!response?.assets || response.assets.length < 1) {
      return;
    }

    const selectedAsset = response.assets[0] as (typeof response.assets)[number] & {
      originalPath?: string;
    };
    const preferredSourcePath =
      (Platform.OS === 'android' ? selectedAsset.originalPath : undefined) || selectedAsset.uri;

    const resolvedSourceUri = ensureFileUri(preferredSourcePath);
    if (!resolvedSourceUri) {
      return;
    }

    setVideoPath(resolvedSourceUri);
  };

  const cycleFormatPreset = useCallback(() => {
    setFormatPreset((currentPreset) => {
      const currentIndex = FORMAT_PRESETS.indexOf(currentPreset);
      return FORMAT_PRESETS[(currentIndex + 1) % FORMAT_PRESETS.length];
    });
  }, []);

  const cycleFps = useCallback(() => {
    setFps((currentValue) => {
      const currentIndex = FPS_PRESETS.indexOf(currentValue);
      return FPS_PRESETS[(currentIndex + 1) % FPS_PRESETS.length];
    });
  }, []);

  const cycleBitRate = useCallback(() => {
    setVideoBitRate((currentValue) => {
      const currentIndex = BITRATE_PRESETS.indexOf(currentValue);
      return BITRATE_PRESETS[(currentIndex + 1) % BITRATE_PRESETS.length];
    });
  }, []);

  const cycleVideoCodec = useCallback(() => {
    setVideoCodec((currentValue) => {
      const currentIndex = CODEC_PRESETS.indexOf(currentValue);
      return CODEC_PRESETS[(currentIndex + 1) % CODEC_PRESETS.length];
    });
  }, []);

  const cycleFilter = useCallback(() => {
    setSelectedFilterIndex((currentValue) => (currentValue + 1) % FILTER_PRESETS.length);
  }, []);

  const safeFps = useMemo(() => {
    if (!format) return fps;
    return Math.min(format.maxFps, Math.max(format.minFps, fps));
  }, [format, fps]);

  const safeZoom = useMemo(() => {
    if (!devices) return zoom;
    return Math.min(devices.maxZoom, Math.max(devices.minZoom, zoom));
  }, [devices, zoom]);

  const safeExposure = useMemo(() => {
    if (!devices) return exposure;
    return Math.min(devices.maxExposure, Math.max(devices.minExposure, exposure));
  }, [devices, exposure]);

  const safeStabilizationMode = useMemo(() => {
    if (!format?.videoStabilizationModes?.length) return 'off';
    if (format.videoStabilizationModes.includes(stabilizationMode)) return stabilizationMode;
    return format.videoStabilizationModes[0];
  }, [format?.videoStabilizationModes, stabilizationMode]);
  const topInset = useMemo(() => {
    const androidInset = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
    return Math.max(insets.top, androidInset) + spacing.x10;
  }, [insets.top]);

  const hasCameraPermissions =
    cameraPermissionStatus === 'granted' && microphonePermissionStatus === 'granted';
  const selectedFilter = FILTER_PRESETS[selectedFilterIndex];

  const handleClose = useCallback(async () => {
    if (isRecording) {
      try {
        await camera.current?.cancelRecording();
      } catch (error) {
        // Ignore cancellation errors while exiting the camera.
      } finally {
        setIsRecording(false);
      }
    }

    if (onClose) {
      onClose();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [isRecording, navigation, onClose]);

  const handleFocusTap = useCallback(
    async (event: GestureResponderEvent) => {
      if (!devices?.supportsFocus || !camera.current) {
        return;
      }
      const { locationX, locationY } = event.nativeEvent;
      setFocusPoint({ x: locationX, y: locationY });
      if (focusResetTimerRef.current) {
        clearTimeout(focusResetTimerRef.current);
      }

      try {
        await camera.current.focus({ x: locationX, y: locationY });
      } catch (error) {
        // Ignore focus failures for unsupported hardware paths.
      }

      focusResetTimerRef.current = setTimeout(() => {
        setFocusPoint(null);
      }, 900);
    },
    [devices?.supportsFocus]
  );

  const handleStartRecording = async () => {
    if (!isRecording) {
      try {
        if (camera.current && isCameraInitialized) {
          setIsRecording(true);
          setIsSettingsOpen(false);
          camera.current.startRecording({
            flash: flashMode,
            fileType: 'mp4',
            videoCodec,
            onRecordingFinished: async (video) => {
              setIsRecording(false);
              const resolvedVideoPath = ensureFileUri(video?.path);
              if (resolvedVideoPath) {
                setVideoPath(resolvedVideoPath);
              }
            },
            onRecordingError: (error) => {
              setIsRecording(false);
              console.log('🚀 ~ handleStartRecording ~ error:', error);
              console.error(error);
            },
          });
        }
      } catch (error) {
        setIsRecording(false);
        console.log(error);
      }
    } else {
      try {
        await camera.current?.stopRecording();
      } catch (error) {
        console.log(error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await CameraRoll.getPhotos({
        first: 1,
      });
      const imageUrl = res?.edges[0]?.node?.image?.uri || null;
      setLatestGalleryImg(imageUrl);
    } catch (error) {
      setLatestGalleryImg(null);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    let nextCameraPermission = Camera.getCameraPermissionStatus();
    if (nextCameraPermission !== 'granted') {
      nextCameraPermission = await Camera.requestCameraPermission();
    }

    let nextMicrophonePermission = Camera.getMicrophonePermissionStatus();
    if (nextMicrophonePermission !== 'granted') {
      nextMicrophonePermission = await Camera.requestMicrophonePermission();
    }

    setCameraPermissionStatus(nextCameraPermission);
    setMicrophonePermissionStatus(nextMicrophonePermission);
  }, []);

  useEffect(() => {
    requestPermissions();
    fetchPhotos();
  }, [fetchPhotos, requestPermissions]);

  useEffect(() => {
    if (!devices) {
      return;
    }
    setIsCameraInitialized(false);
    setZoom(devices.neutralZoom);
    setExposure(Math.max(devices.minExposure, Math.min(devices.maxExposure, 0)));
  }, [devices]);

  useEffect(() => {
    if (!format?.supportsVideoHdr) {
      setVideoHdr(false);
    }
    if (!format?.videoStabilizationModes?.includes(stabilizationMode)) {
      setStabilizationMode(format?.videoStabilizationModes?.[0] || 'off');
    }
  }, [format, stabilizationMode]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });

    return () => {
      backSubscription.remove();
    };
  }, [handleClose]);

  useEffect(() => {
    return () => {
      if (focusResetTimerRef.current) {
        clearTimeout(focusResetTimerRef.current);
      }
    };
  }, []);

  if (devices == null) {
    return (
      <View style={videoPostStyles.noCam}>
        <StyledText>Camera not available</StyledText>
      </View>
    );
  }

  if (
    cameraPermissionStatus === 'not-determined' ||
    microphonePermissionStatus === 'not-determined'
  ) {
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

  if (!hasCameraPermissions) {
    return (
      <View style={videoPostStyles.noCam}>
        <StyledText>Camera and microphone permissions are required.</StyledText>
        <TouchableOpacity style={videoPostStyles.permissionButton} onPress={requestPermissions}>
          <StyledText style={videoPostStyles.permissionButtonText}>Allow Access</StyledText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={devices}
        isActive
        preview
        photo
        video
        audio={isAudioEnabled}
        format={format}
        fps={safeFps}
        zoom={safeZoom}
        exposure={safeExposure}
        torch={flashMode}
        videoHdr={Boolean(videoHdr && format?.supportsVideoHdr)}
        lowLightBoost={false}
        videoStabilizationMode={safeStabilizationMode}
        videoBitRate={videoBitRate}
        resizeMode="contain"
        androidPreviewViewType={Platform.OS === 'android' ? 'surface-view' : undefined}
        isMirrored={isFrontCamera}
        enableZoomGesture
        onTouchEnd={handleFocusTap}
        onInitialized={() => setIsCameraInitialized(true)}
        onError={(error) => {
          setIsCameraInitialized(false);
          console.error('[VisionCamera] runtime error', error);
        }}
      />
      {focusPoint ? (
        <View
          pointerEvents="none"
          style={[
            videoPostStyles.focusRing,
            {
              left: Math.max(0, focusPoint.x - 28),
              top: Math.max(0, focusPoint.y - 28),
            },
          ]}
        />
      ) : null}

      {selectedFilter.overlay !== 'transparent' ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: selectedFilter.overlay }]}
        />
      ) : null}

      <View style={[videoPostStyles.cameraTopRow, { top: topInset }]}>
        <TouchableOpacity style={videoPostStyles.roundIconButton} onPress={handleClose}>
          <MaterialIcons name="close" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={[videoPostStyles.cameraRightRail, { top: topInset }]}>
        <TouchableOpacity
          style={videoPostStyles.roundIconButton}
          onPress={() => setFlashMode((value) => (value === 'on' ? 'off' : 'on'))}
        >
          <MaterialIcons
            name={flashMode === 'on' ? 'flash-on' : 'flash-off'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={videoPostStyles.roundIconButton}
          onPress={() => setIsAudioEnabled((value) => !value)}
        >
          <MaterialIcons name={isAudioEnabled ? 'mic' : 'mic-off'} size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            videoPostStyles.roundIconButton,
            !format?.supportsVideoHdr && videoPostStyles.roundIconButtonDisabled,
          ]}
          onPress={() => setVideoHdr((value) => !value)}
          disabled={!format?.supportsVideoHdr}
        >
          <MaterialIcons name="hdr-weak" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={videoPostStyles.roundIconButton} onPress={cycleFilter}>
          <MaterialIcons name="filter-vintage" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={videoPostStyles.roundIconButton}
          onPress={() => setIsSettingsOpen((value) => !value)}
        >
          <MaterialIcons name="tune" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {isSettingsOpen ? (
        <View style={[videoPostStyles.cameraSettingsCard, { top: topInset + spacing.x60 }]}>
          <TouchableOpacity style={videoPostStyles.cameraSettingsRow} onPress={cycleFormatPreset}>
            <StyledText style={videoPostStyles.cameraSettingsKey}>Size</StyledText>
            <StyledText style={videoPostStyles.cameraSettingsValue}>{formatPreset}</StyledText>
          </TouchableOpacity>
          <TouchableOpacity style={videoPostStyles.cameraSettingsRow} onPress={cycleFps}>
            <StyledText style={videoPostStyles.cameraSettingsKey}>FPS</StyledText>
            <StyledText style={videoPostStyles.cameraSettingsValue}>{safeFps}</StyledText>
          </TouchableOpacity>
          <TouchableOpacity style={videoPostStyles.cameraSettingsRow} onPress={cycleBitRate}>
            <StyledText style={videoPostStyles.cameraSettingsKey}>Bitrate</StyledText>
            <StyledText style={videoPostStyles.cameraSettingsValue}>{videoBitRate}</StyledText>
          </TouchableOpacity>
          <TouchableOpacity style={videoPostStyles.cameraSettingsRow} onPress={cycleVideoCodec}>
            <StyledText style={videoPostStyles.cameraSettingsKey}>Codec</StyledText>
            <StyledText style={videoPostStyles.cameraSettingsValue}>{videoCodec}</StyledText>
          </TouchableOpacity>
          <View style={videoPostStyles.cameraSettingsRow}>
            <StyledText style={videoPostStyles.cameraSettingsKey}>Filter</StyledText>
            <StyledText style={videoPostStyles.cameraSettingsValue}>{selectedFilter.id}</StyledText>
          </View>
        </View>
      ) : null}

      {children}
      <View style={videoPostStyles.cameraBtncontainer}>
        {!isCameraInitialized ? (
          <View style={videoPostStyles.cameraInitializingChip}>
            <StyledText style={videoPostStyles.cameraInitializingText}>
              Preparing camera...
            </StyledText>
          </View>
        ) : null}
        <View style={videoPostStyles.btnSubContainer}>
          <TouchableOpacity
            style={{ justifyContent: 'center' }}
            onPress={handleSelectionFromGallery}
          >
            <View style={videoPostStyles.galleryPreview}>
              {latestGalleryImg ? (
                <Image
                  style={videoPostStyles.imgPreview}
                  resizeMode="contain"
                  source={{ uri: latestGalleryImg }}
                />
              ) : (
                <View
                  style={[videoPostStyles.imgPreview, { backgroundColor: 'rgba(0,0,0,0.2)' }]}
                />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              videoPostStyles.recordButton,
              !isCameraInitialized && videoPostStyles.recordButtonDisabled,
            ]}
            onPress={handleStartRecording}
            disabled={!isCameraInitialized}
          >
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
