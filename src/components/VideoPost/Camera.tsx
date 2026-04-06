import {
  AppState,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  BackHandler,
  StatusBar,
  type AppStateStatus,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { PropsWithChildren, useRef, useState, useCallback, useMemo } from 'react';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import {
  Camera,
  type CameraDevice,
  type CameraPermissionStatus,
  type FormatFilter,
  type VideoStabilizationMode,
  useCameraDevice,
  useCameraFormat,
} from 'react-native-vision-camera';
import FastImage from 'react-native-fast-image';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import {
  NavigationProp,
  ParamListBase,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import videoPostStyles from './styles';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';
import useMountEffect from '@/src/hooks/useMountEffect';
import useObservedEffect from '@/src/hooks/useObservedEffect';
import type { SelectedVideoSource } from '@/src/services/videoProcessing/types';
import StyledText from '../styled/Text';

const cameraIos = require('@/assets/icons/camera-ios.png');

const FPS_PRESETS = [24, 30, 60] as const;
const BITRATE_PRESETS = ['low', 'normal', 'high'] as const;
const CODEC_PRESETS = ['h264', 'h265'] as const;
const RECORDER_RATIO_OPTIONS = ['1:1', '4:3', '16:9', '9:16'] as const;
const FILTER_PRESETS = [
  { id: 'None', overlay: 'transparent' },
  { id: 'Cool', overlay: 'rgba(52, 152, 219, 0.12)' },
  { id: 'Warm', overlay: 'rgba(241, 196, 15, 0.12)' },
  { id: 'Mono', overlay: 'rgba(120, 120, 120, 0.14)' },
] as const;
const IOS_CAMERA_RECOVERY_MAX_STAGE = 4;
const CAMERA_SESSION_RELEASE_DELAY_MS = Platform.OS === 'ios' ? 180 : 60;
const IOS_RECORDING_STOP_SETTLE_MS = 400;

type FpsPreset = (typeof FPS_PRESETS)[number];
type BitratePreset = (typeof BITRATE_PRESETS)[number];
type CodecPreset = (typeof CODEC_PRESETS)[number];
type RecorderRatio = (typeof RECORDER_RATIO_OPTIONS)[number];

type Props = {
  setVideoPath: (selection?: SelectedVideoSource) => void;
  onClose?: () => void;
};

export const getDefaultRecorderCaptureSettings = (platformOS: string) => ({
  videoBitRate: (platformOS === 'ios' ? 'normal' : 'high') as BitratePreset,
  videoCodec: (platformOS === 'ios' ? 'h264' : 'h265') as CodecPreset,
});

export const shouldAllowCameraFlip = ({
  isRecording,
  isTearingDown,
  hasTargetDevice,
}: {
  isRecording: boolean;
  isTearingDown: boolean;
  hasTargetDevice: boolean;
}) => !isRecording && !isTearingDown && hasTargetDevice;

const DEFAULT_RECORDER_CAPTURE_SETTINGS = getDefaultRecorderCaptureSettings(Platform.OS);
const DEFAULT_RECORDER_VIDEO_BIT_RATE = DEFAULT_RECORDER_CAPTURE_SETTINGS.videoBitRate;
const DEFAULT_RECORDER_VIDEO_CODEC = DEFAULT_RECORDER_CAPTURE_SETTINGS.videoCodec;

const isRecordingCanceledError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const { code } = error as { code?: unknown };
  return code === 'capture/recording-canceled' || code === 'capture/recording-cancelled';
};

const collectCameraErrorSignals = (
  error: unknown,
  seen = new Set<unknown>(),
  depth = 0
): string[] => {
  if (!error || depth > 3 || seen.has(error)) {
    return [];
  }

  if (typeof error === 'string') {
    return [error];
  }

  if (error instanceof Error) {
    seen.add(error);
    return [
      error.message,
      ...collectCameraErrorSignals((error as Error & { cause?: unknown }).cause, seen, depth + 1),
    ].filter(Boolean);
  }

  if (typeof error !== 'object') {
    return [];
  }

  seen.add(error);
  const candidate = error as Record<string, unknown>;
  const directValues = [
    candidate.code,
    candidate.message,
    candidate.description,
    candidate.localizedDescription,
    candidate.NSLocalizedDescription,
    candidate.NSLocalizedFailureReason,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return [
    ...directValues,
    ...collectCameraErrorSignals(candidate.cause, seen, depth + 1),
    ...collectCameraErrorSignals(candidate.userInfo, seen, depth + 1),
    ...collectCameraErrorSignals(candidate.nativeError, seen, depth + 1),
  ];
};

export const isNoRecordingInProgressError = (error: unknown) => {
  const normalizedSignals = collectCameraErrorSignals(error).map((value) => value.toLowerCase());
  return normalizedSignals.some(
    (value) =>
      value === 'capture/no-recording-in-progress' ||
      value.includes('no active video recording in progress') ||
      value.includes('no recording in progress')
  );
};

const getDeviceDefaultExposure = (device?: CameraDevice) =>
  device ? Math.max(device.minExposure, Math.min(device.maxExposure, 0)) : 0;

const getDeviceDefaultZoom = (device?: CameraDevice) => device?.neutralZoom ?? 1;

const normalizeVideoDimension = (value?: number) => {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return undefined;
  }
  return Math.round(value);
};

function CameraComponent({ setVideoPath, onClose, children }: PropsWithChildren<Props>) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const camera = useRef<Camera>(null);
  const focusResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const teardownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const isRecordingRef = useRef(false);
  const isRecordingTransitionRef = useRef(false);
  const recordingStartedAtRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(true);
  const teardownInProgressRef = useRef(false);
  const recoveryAttemptRef = useRef(false);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
  const [latestGalleryImg, setLatestGalleryImg] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isCameraInitialized, setIsCameraInitialized] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [appStateStatus, setAppStateStatus] = useState<AppStateStatus>(AppState.currentState);
  const [selectedRatio, setSelectedRatio] = useState<RecorderRatio>('9:16');
  const [fps, setFps] = useState<FpsPreset>(30);
  const [videoBitRate, setVideoBitRate] = useState<BitratePreset>(DEFAULT_RECORDER_VIDEO_BIT_RATE);
  const [videoCodec, setVideoCodec] = useState<CodecPreset>(DEFAULT_RECORDER_VIDEO_CODEC);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [videoHdr, setVideoHdr] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [exposure, setExposure] = useState<number>(0);
  const [stabilizationMode, setStabilizationMode] = useState<VideoStabilizationMode>('auto');
  const [cameraRecoveryStage, setCameraRecoveryStage] = useState(0);
  const [cameraSessionNonce, setCameraSessionNonce] = useState(0);
  const [cameraRuntimeErrorMessage, setCameraRuntimeErrorMessage] = useState<string | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [cameraViewportSize, setCameraViewportSize] = useState({ width: 0, height: 0 });
  const [cameraFrameOffset, setCameraFrameOffset] = useState({ x: 0, y: 0 });
  const [cameraPermissionStatus, setCameraPermissionStatus] =
    useState<CameraPermissionStatus>('not-determined');
  const [microphonePermissionStatus, setMicrophonePermissionStatus] =
    useState<CameraPermissionStatus>('not-determined');
  const preferredBackDevice = useCameraDevice('back', {
    physicalDevices: ['wide-angle-camera'],
  });
  const fallbackBackDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const activeDevice = isFrontCamera ? frontDevice : (preferredBackDevice ?? fallbackBackDevice);
  const formatFilters = useMemo<FormatFilter[]>(() => {
    const viewportRatio =
      cameraViewportSize.width > 0 && cameraViewportSize.height > 0
        ? cameraViewportSize.height / cameraViewportSize.width
        : 16 / 9;

    // VisionCamera format ratios are evaluated in sensor-space (landscape-oriented),
    // so we intentionally target a tall ratio for the 9:16 portrait default.
    const targetRatioMap: Record<RecorderRatio, number> = {
      '1:1': 1,
      '4:3': 4 / 3,
      '16:9': 16 / 9,
      '9:16': viewportRatio,
    };
    const targetRatio = targetRatioMap[selectedRatio];

    return [
      { videoAspectRatio: targetRatio },
      { photoAspectRatio: targetRatio },
      { videoResolution: 'max' },
    ];
  }, [cameraViewportSize.height, cameraViewportSize.width, selectedRatio]);
  const format = useCameraFormat(activeDevice, formatFilters);

  const selectedPreviewAspectRatio = useMemo(() => {
    const ratioMap: Record<RecorderRatio, number> = {
      '1:1': 1,
      '4:3': 4 / 3,
      '16:9': 16 / 9,
      '9:16': 9 / 16,
    };
    return ratioMap[selectedRatio];
  }, [selectedRatio]);

  const ensureFileUri = useCallback((value?: string) => {
    if (!value) {
      return '';
    }
    if (value.startsWith('file://') || value.startsWith('content://')) {
      return value;
    }
    return `file://${value}`;
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

  const safeZoom = useMemo(() => {
    if (!activeDevice) return zoom;
    return Math.min(activeDevice.maxZoom, Math.max(activeDevice.minZoom, zoom));
  }, [activeDevice, zoom]);

  const safeExposure = useMemo(() => {
    if (!activeDevice) return exposure;
    return Math.min(activeDevice.maxExposure, Math.max(activeDevice.minExposure, exposure));
  }, [activeDevice, exposure]);

  const safeStabilizationMode = useMemo(() => {
    if (!format?.videoStabilizationModes?.length) return 'off';
    if (format.videoStabilizationModes.includes(stabilizationMode)) return stabilizationMode;
    return format.videoStabilizationModes[0];
  }, [format?.videoStabilizationModes, stabilizationMode]);
  const effectiveFormat = useMemo(() => {
    if (cameraRecoveryStage >= 3) {
      return undefined;
    }
    return format;
  }, [cameraRecoveryStage, format]);
  const effectiveFps = useMemo(() => {
    if (!effectiveFormat) {
      return undefined;
    }
    if (cameraRecoveryStage >= 2) {
      return Math.min(effectiveFormat.maxFps, Math.max(effectiveFormat.minFps, 30));
    }
    return Math.min(effectiveFormat.maxFps, Math.max(effectiveFormat.minFps, fps));
  }, [cameraRecoveryStage, effectiveFormat, fps]);
  const effectiveVideoHdr = Boolean(
    cameraRecoveryStage === 0 && videoHdr && effectiveFormat?.supportsVideoHdr
  );
  const effectiveStabilizationMode = useMemo<VideoStabilizationMode | undefined>(() => {
    if (!effectiveFormat?.videoStabilizationModes?.length || cameraRecoveryStage >= 1) {
      return undefined;
    }
    if (effectiveFormat.videoStabilizationModes.includes(safeStabilizationMode)) {
      return safeStabilizationMode;
    }
    return effectiveFormat.videoStabilizationModes[0];
  }, [cameraRecoveryStage, effectiveFormat, safeStabilizationMode]);
  const effectiveVideoBitRate =
    Platform.OS === 'ios' || cameraRecoveryStage >= 1 ? 'normal' : videoBitRate;
  const effectiveVideoCodec =
    Platform.OS === 'ios' || cameraRecoveryStage >= 1 ? 'h264' : videoCodec;
  const effectiveAudioEnabled = cameraRecoveryStage >= 2 ? false : isAudioEnabled;
  const effectiveTorch = activeDevice?.hasTorch ? flashMode : 'off';
  const cameraSessionKey = useMemo(() => {
    const deviceId = activeDevice?.id ?? 'no-device';
    return `${deviceId}:${selectedRatio}:${cameraRecoveryStage}:${cameraSessionNonce}`;
  }, [activeDevice?.id, cameraRecoveryStage, cameraSessionNonce, selectedRatio]);
  const topInset = useMemo(() => {
    const androidInset = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
    return Math.max(insets.top, androidInset) + spacing.x10;
  }, [insets.top]);
  const landscapeBottomInset = useMemo(() => Math.max(insets.bottom, spacing.x12), [insets.bottom]);

  const hasCameraPermissions =
    cameraPermissionStatus === 'granted' && microphonePermissionStatus === 'granted';
  const selectedFilter = FILTER_PRESETS[selectedFilterIndex];
  const hasFatalCameraRuntimeError =
    Boolean(cameraRuntimeErrorMessage) && cameraRecoveryStage >= IOS_CAMERA_RECOVERY_MAX_STAGE;
  const isAppForeground = appStateStatus === 'active';
  const shouldCameraBeActive =
    sessionActive &&
    isFocused &&
    isAppForeground &&
    Boolean(activeDevice) &&
    hasCameraPermissions &&
    !hasFatalCameraRuntimeError;
  const isLandscapeViewport =
    cameraViewportSize.width > 0 &&
    cameraViewportSize.height > 0 &&
    cameraViewportSize.width > cameraViewportSize.height;
  const isLandscapeMode = isLandscapeViewport;
  const isWideLandscapeCapture = selectedRatio === '16:9' && isLandscapeViewport;
  const landscapeUtilityTop = useMemo(() => topInset + spacing.x60, [topInset]);
  const landscapeRatioBottom = useMemo(
    () => landscapeBottomInset + spacing.x10,
    [landscapeBottomInset]
  );
  const landscapeCaptureTop = useMemo(() => {
    const captureStackHeight = 224;
    const minimumTop = landscapeUtilityTop + spacing.x12;
    const viewportHeight = cameraViewportSize.height;

    if (!isLandscapeMode || viewportHeight <= 0) {
      return minimumTop;
    }

    const centeredTop = (viewportHeight - captureStackHeight) / 2;
    const maxTop = Math.max(minimumTop, viewportHeight - landscapeBottomInset - captureStackHeight);

    return Math.min(Math.max(centeredTop, minimumTop), maxTop);
  }, [cameraViewportSize.height, isLandscapeMode, landscapeBottomInset, landscapeUtilityTop]);
  const landscapeSettingsTop = useMemo(
    () => landscapeUtilityTop + spacing.x8,
    [landscapeUtilityTop]
  );
  const previewFrameSize = useMemo(() => {
    if (
      isWideLandscapeCapture ||
      selectedRatio === '9:16' ||
      cameraViewportSize.width <= 0 ||
      cameraViewportSize.height <= 0
    ) {
      return {
        width: cameraViewportSize.width,
        height: cameraViewportSize.height,
      };
    }

    const maxWidth = cameraViewportSize.width;
    const maxHeight = cameraViewportSize.height;
    let width = maxWidth;
    let height = width / selectedPreviewAspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * selectedPreviewAspectRatio;
    }

    return { width, height };
  }, [
    cameraViewportSize.height,
    cameraViewportSize.width,
    isWideLandscapeCapture,
    selectedPreviewAspectRatio,
    selectedRatio,
  ]);

  const applyCameraDeviceDefaults = useCallback((device?: CameraDevice) => {
    setZoom(getDeviceDefaultZoom(device));
    setExposure(getDeviceDefaultExposure(device));
    if (!(device?.hasTorch ?? false)) {
      setFlashMode('off');
    }
  }, []);

  const resetCameraSessionState = useCallback(
    (device?: CameraDevice) => {
      teardownInProgressRef.current = false;
      recoveryAttemptRef.current = false;
      sessionActiveRef.current = true;
      setIsCameraInitialized(false);
      setCameraRuntimeErrorMessage(null);
      setCameraRecoveryStage(0);
      setSessionActive(true);
      applyCameraDeviceDefaults(device);
      setCameraSessionNonce((value) => value + 1);
    },
    [applyCameraDeviceDefaults]
  );

  const clearFocusState = useCallback(() => {
    if (focusResetTimerRef.current) {
      clearTimeout(focusResetTimerRef.current);
      focusResetTimerRef.current = null;
    }
    setFocusPoint(null);
  }, []);

  const finalizeCameraTeardown = useCallback((next?: () => void) => {
    if (teardownTimerRef.current) {
      clearTimeout(teardownTimerRef.current);
    }

    teardownTimerRef.current = setTimeout(() => {
      teardownTimerRef.current = null;
      if (!isMountedRef.current) {
        return;
      }
      next?.();
    }, CAMERA_SESSION_RELEASE_DELAY_MS);
  }, []);

  const resumeCameraSession = useCallback(() => {
    if (!isMountedRef.current) {
      return;
    }
    resetCameraSessionState(activeDevice);
  }, [activeDevice, resetCameraSessionState]);

  const teardownCameraSession = useCallback(
    async ({ cancelRecording = false, next }: { cancelRecording?: boolean; next?: () => void }) => {
      teardownInProgressRef.current = true;
      sessionActiveRef.current = false;
      setSessionActive(false);
      setIsCameraInitialized(false);
      setIsSettingsOpen(false);
      clearFocusState();

      if (cancelRecording && isRecordingRef.current) {
        try {
          await camera.current?.cancelRecording();
        } catch {
          // Ignore cancellation failures during camera teardown.
        } finally {
          isRecordingRef.current = false;
          if (isMountedRef.current) {
            setIsRecording(false);
          }
        }
      }

      finalizeCameraTeardown(next);
    },
    [clearFocusState, finalizeCameraTeardown]
  );

  const handleSelectionFromGallery = useCallback(() => {
    teardownCameraSession({
      cancelRecording: true,
      next: async () => {
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
          resumeCameraSession();
          return;
        }

        const selectedAsset = response.assets[0] as (typeof response.assets)[number] & {
          originalPath?: string;
        };
        const preferredSourcePath =
          (Platform.OS === 'android' ? selectedAsset.originalPath : undefined) || selectedAsset.uri;

        const resolvedSourceUri = ensureFileUri(preferredSourcePath);
        if (!resolvedSourceUri) {
          resumeCameraSession();
          return;
        }

        setVideoPath({
          uri: resolvedSourceUri,
          width: normalizeVideoDimension(selectedAsset.width),
          height: normalizeVideoDimension(selectedAsset.height),
        });
      },
    }).catch(() => undefined);
  }, [ensureFileUri, resumeCameraSession, setVideoPath, teardownCameraSession]);

  const handleClose = useCallback(async () => {
    await teardownCameraSession({
      cancelRecording: true,
      next: () => {
        if (onClose) {
          onClose();
          return;
        }

        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      },
    });
  }, [navigation, onClose, teardownCameraSession]);

  const handleFocusTap = useCallback(
    async (event: GestureResponderEvent) => {
      if (!activeDevice?.supportsFocus || !camera.current || !shouldCameraBeActive) {
        return;
      }
      const { locationX, locationY } = event.nativeEvent;
      setFocusPoint({ x: cameraFrameOffset.x + locationX, y: cameraFrameOffset.y + locationY });
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
    [activeDevice?.supportsFocus, cameraFrameOffset.x, cameraFrameOffset.y, shouldCameraBeActive]
  );

  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraViewportSize({ width, height });
  }, []);

  const handleCameraFrameLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y } = event.nativeEvent.layout;
    setCameraFrameOffset({ x, y });
  }, []);

  const resetRecordingState = useCallback(() => {
    isRecordingTransitionRef.current = false;
    isRecordingRef.current = false;
    recordingStartedAtRef.current = null;
    if (isMountedRef.current) {
      setIsRecording(false);
    }
  }, []);

  const handleStartRecording = async () => {
    if (isRecordingTransitionRef.current) {
      return;
    }

    if (!isRecordingRef.current) {
      try {
        if (camera.current && isCameraInitialized && shouldCameraBeActive) {
          isRecordingTransitionRef.current = true;
          recordingStartedAtRef.current = Date.now();
          setIsRecording(true);
          isRecordingRef.current = true;
          setIsSettingsOpen(false);
          camera.current.startRecording({
            flash: flashMode,
            fileType: 'mp4',
            videoCodec: effectiveVideoCodec,
            onRecordingFinished: async (video) => {
              resetRecordingState();
              const resolvedVideoPath = ensureFileUri(video?.path);
              if (!resolvedVideoPath) {
                resumeCameraSession();
                return;
              }
              await teardownCameraSession({
                next: () => {
                  setVideoPath({
                    uri: resolvedVideoPath,
                    ratioId: selectedRatio,
                    width: normalizeVideoDimension((video as { width?: number })?.width),
                    height: normalizeVideoDimension((video as { height?: number })?.height),
                  });
                },
              });
            },
            onRecordingError: (error) => {
              resetRecordingState();
              if (isRecordingCanceledError(error)) {
                return;
              }
              console.error('[VisionCamera] recording failed', error);
            },
          });
          isRecordingTransitionRef.current = false;
        }
      } catch (error) {
        resetRecordingState();
        if (!isRecordingCanceledError(error)) {
          console.error('[VisionCamera] failed to start recording', error);
        }
      }
    } else {
      if (
        Platform.OS === 'ios' &&
        recordingStartedAtRef.current !== null &&
        Date.now() - recordingStartedAtRef.current < IOS_RECORDING_STOP_SETTLE_MS
      ) {
        return;
      }

      isRecordingTransitionRef.current = true;
      try {
        await camera.current?.stopRecording();
      } catch (error) {
        if (isRecordingCanceledError(error) || isNoRecordingInProgressError(error)) {
          resetRecordingState();
          return;
        }

        resetRecordingState();
        if (!isRecordingCanceledError(error)) {
          console.error('[VisionCamera] failed to stop recording', error);
        }
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

  useMountEffect(() => {
    requestPermissions();
    fetchPhotos();
  });

  useObservedEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useObservedEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);

  useMountEffect(() => {
    const subscription = AppState.addEventListener('change', setAppStateStatus);
    return () => {
      subscription.remove();
    };
  });

  useObservedEffect(() => {
    if (!activeDevice) {
      return;
    }
    setIsCameraInitialized(false);
    applyCameraDeviceDefaults(activeDevice);
  }, [activeDevice, applyCameraDeviceDefaults]);

  useObservedEffect(() => {
    if (!format?.supportsVideoHdr) {
      setVideoHdr(false);
    }
    if (!format?.videoStabilizationModes?.includes(stabilizationMode)) {
      setStabilizationMode(format?.videoStabilizationModes?.[0] || 'off');
    }
  }, [format, stabilizationMode]);

  useObservedEffect(() => {
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

  const cancelRecordingIfNeeded = useCallback(() => {
    if (isRecordingRef.current) {
      camera.current?.cancelRecording().catch(() => undefined);
    }
  }, []);

  useMountEffect(() => {
    return () => {
      isMountedRef.current = false;
      teardownInProgressRef.current = true;
      sessionActiveRef.current = false;
      if (teardownTimerRef.current) {
        clearTimeout(teardownTimerRef.current);
        teardownTimerRef.current = null;
      }
      if (focusResetTimerRef.current) {
        clearTimeout(focusResetTimerRef.current);
      }
      cancelRecordingIfNeeded();
    };
  });

  useObservedEffect(() => {
    recoveryAttemptRef.current = false;
  }, [cameraRecoveryStage]);

  const retryCameraSession = useCallback(() => {
    resetCameraSessionState(activeDevice);
  }, [activeDevice, resetCameraSessionState]);

  useObservedEffect(() => {
    retryCameraSession();
  }, [activeDevice?.id, retryCameraSession]);

  const handleFlipCamera = useCallback(() => {
    const nextIsFrontCamera = !isFrontCamera;
    const nextDevice = nextIsFrontCamera
      ? frontDevice
      : (preferredBackDevice ?? fallbackBackDevice);
    if (
      !shouldAllowCameraFlip({
        isRecording: isRecordingRef.current,
        isTearingDown: teardownInProgressRef.current,
        hasTargetDevice: Boolean(nextDevice),
      })
    ) {
      return;
    }

    setIsSettingsOpen(false);
    setIsFrontCamera(nextIsFrontCamera);
    clearFocusState();
    resetCameraSessionState(nextDevice);
  }, [
    clearFocusState,
    fallbackBackDevice,
    frontDevice,
    isFrontCamera,
    preferredBackDevice,
    resetCameraSessionState,
  ]);

  useObservedEffect(() => {
    if (!__DEV__ || process.env.JEST_WORKER_ID) {
      return;
    }

    console.log('[VisionCamera] selected recorder device', {
      id: activeDevice?.id,
      position: activeDevice?.position,
      physicalDevices: activeDevice?.physicalDevices,
      isFrontCamera,
      recoveryStage: cameraRecoveryStage,
    });
  }, [
    activeDevice?.id,
    activeDevice?.physicalDevices,
    activeDevice?.position,
    cameraRecoveryStage,
    isFrontCamera,
  ]);

  if (activeDevice == null) {
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

  if (hasFatalCameraRuntimeError) {
    return (
      <View style={videoPostStyles.noCam}>
        <StyledText>Camera unavailable right now.</StyledText>
        <StyledText>{cameraRuntimeErrorMessage}</StyledText>
        <TouchableOpacity style={videoPostStyles.permissionButton} onPress={retryCameraSession}>
          <StyledText style={videoPostStyles.permissionButtonText}>Retry Camera</StyledText>
        </TouchableOpacity>
      </View>
    );
  }

  const cameraProps: any = {
    ref: camera,
    style: StyleSheet.absoluteFill,
    device: activeDevice,
    isActive: shouldCameraBeActive,
    preview: true,
    video: true,
    audio: effectiveAudioEnabled,
    format: effectiveFormat,
    fps: effectiveFps,
    zoom: safeZoom,
    exposure: safeExposure,
    torch: effectiveTorch,
    lowLightBoost: false,
    videoBitRate: effectiveVideoBitRate,
    resizeMode: 'cover',
    androidPreviewViewType: Platform.OS === 'android' ? 'texture-view' : undefined,
    isMirrored: isFrontCamera,
    enableZoomGesture: true,
    onTouchEnd: handleFocusTap,
    onInitialized: () => {
      if (!sessionActiveRef.current) {
        return;
      }
      teardownInProgressRef.current = false;
      recoveryAttemptRef.current = false;
      setCameraRuntimeErrorMessage(null);
      setIsCameraInitialized(true);
    },
    onError: (error: { message: string; code: any }) => {
      if (teardownInProgressRef.current || !sessionActiveRef.current) {
        return;
      }
      setIsCameraInitialized(false);
      const message = error?.message || 'Unable to initialize the camera session.';
      setCameraRuntimeErrorMessage(message);
      if (
        Platform.OS === 'ios' &&
        cameraRecoveryStage < IOS_CAMERA_RECOVERY_MAX_STAGE &&
        !recoveryAttemptRef.current
      ) {
        recoveryAttemptRef.current = true;
        setCameraRecoveryStage((stage) => Math.min(stage + 1, IOS_CAMERA_RECOVERY_MAX_STAGE));
        if (__DEV__) {
          console.warn('[VisionCamera] retrying with safer iOS session config', {
            nextRecoveryStage: cameraRecoveryStage + 1,
            code: error?.code,
            message,
          });
        }
        return;
      }
      console.error('[VisionCamera] runtime error', error);
    },
  };

  if (effectiveVideoHdr) {
    cameraProps.videoHdr = true;
  }

  if (effectiveStabilizationMode) {
    cameraProps.videoStabilizationMode = effectiveStabilizationMode;
  }

  return (
    <>
      <View style={videoPostStyles.cameraViewport} onLayout={handleViewportLayout}>
        <View
          style={[
            videoPostStyles.cameraPreviewFrame,
            {
              width: previewFrameSize.width || '100%',
              height: previewFrameSize.height || '100%',
            },
          ]}
          onLayout={handleCameraFrameLayout}
        >
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Camera key={cameraSessionKey} {...cameraProps} />
          {selectedFilter.overlay !== 'transparent' ? (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: selectedFilter.overlay }]}
            />
          ) : null}
        </View>
      </View>
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

      <View
        style={[
          videoPostStyles.cameraTopRow,
          { top: topInset },
          isLandscapeMode && videoPostStyles.cameraTopRowLandscape,
        ]}
      >
        <TouchableOpacity style={videoPostStyles.roundIconButton} onPress={handleClose}>
          <MaterialIcons name="close" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          isLandscapeMode
            ? videoPostStyles.cameraUtilityRailLandscape
            : videoPostStyles.cameraUtilityRailPortrait,
          { top: isLandscapeMode ? landscapeUtilityTop : topInset },
        ]}
      >
        <TouchableOpacity
          testID="video-recorder-flash-button"
          style={videoPostStyles.roundIconButton}
          onPress={() => setFlashMode((value) => (value === 'on' ? 'off' : 'on'))}
          disabled={!activeDevice?.hasTorch}
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
        <View
          style={[
            isLandscapeMode
              ? videoPostStyles.cameraSettingsCardLandscape
              : videoPostStyles.cameraSettingsCardPortrait,
            { top: isLandscapeMode ? landscapeSettingsTop : topInset + spacing.x60 },
          ]}
        >
          <View style={videoPostStyles.cameraSettingsRow}>
            <StyledText style={videoPostStyles.cameraSettingsKey}>Ratio</StyledText>
            <StyledText style={videoPostStyles.cameraSettingsValue}>{selectedRatio}</StyledText>
          </View>
          <TouchableOpacity style={videoPostStyles.cameraSettingsRow} onPress={cycleFps}>
            <StyledText style={videoPostStyles.cameraSettingsKey}>FPS</StyledText>
            <StyledText style={videoPostStyles.cameraSettingsValue}>
              {effectiveFps ?? fps}
            </StyledText>
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
      <View
        style={[
          videoPostStyles.cameraBtncontainer,
          isLandscapeMode && videoPostStyles.cameraBtncontainerLandscape,
        ]}
      >
        <View
          style={[
            videoPostStyles.ratioSelectorRow,
            isLandscapeMode && videoPostStyles.ratioSelectorRowLandscape,
            isLandscapeMode && { bottom: landscapeRatioBottom },
          ]}
        >
          {RECORDER_RATIO_OPTIONS.map((ratioOption) => {
            const isActive = ratioOption === selectedRatio;
            return (
              <TouchableOpacity
                key={ratioOption}
                style={[
                  videoPostStyles.ratioOptionButton,
                  isActive && videoPostStyles.ratioOptionButtonActive,
                  isRecording && videoPostStyles.ratioOptionButtonDisabled,
                ]}
                onPress={() => setSelectedRatio(ratioOption)}
                disabled={isRecording}
              >
                <StyledText
                  style={[
                    videoPostStyles.ratioOptionText,
                    isActive && videoPostStyles.ratioOptionTextActive,
                  ]}
                >
                  {ratioOption}
                </StyledText>
              </TouchableOpacity>
            );
          })}
        </View>
        {!isCameraInitialized ? (
          <View style={videoPostStyles.cameraInitializingChip}>
            <StyledText style={videoPostStyles.cameraInitializingText}>
              Preparing camera...
            </StyledText>
          </View>
        ) : null}
        <View
          style={[
            videoPostStyles.btnSubContainer,
            isLandscapeMode && videoPostStyles.btnSubContainerLandscape,
            isLandscapeMode && { top: landscapeCaptureTop },
          ]}
        >
          {isLandscapeMode ? (
            <>
              <TouchableOpacity
                testID="video-recorder-flip-camera-button"
                style={{ justifyContent: 'center' }}
                onPress={handleFlipCamera}
              >
                <FastImage
                  style={videoPostStyles.flipCameraImg}
                  resizeMode={FastImage.resizeMode.contain}
                  source={cameraIos}
                />
              </TouchableOpacity>
              <TouchableOpacity
                testID="video-recorder-record-button"
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
            </>
          ) : (
            <>
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
                testID="video-recorder-record-button"
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
                testID="video-recorder-flip-camera-button"
                style={{ justifyContent: 'center' }}
                onPress={handleFlipCamera}
              >
                <FastImage
                  style={videoPostStyles.flipCameraImg}
                  resizeMode={FastImage.resizeMode.contain}
                  source={cameraIos}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </>
  );
}

export default CameraComponent;
