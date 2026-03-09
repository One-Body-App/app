import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type EventSubscription,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useToast } from 'react-native-toast-notifications';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  Asset,
  ImageLibraryOptions,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import VideoTrim, { showEditor } from 'react-native-video-trim';
import CameraComponent from '@/src/components/VideoPost/Camera';
import CustomVideo from '@/src/components/CustomVideo';
import { MainStackParamList } from '@/src/navigator/types';
import {
  createDefaultVideoTransform,
  MAX_VIDEO_EDITOR_SCALE,
  MIN_VIDEO_EDITOR_SCALE,
  VIDEO_RATIO_CONFIG,
  clampVideoTransform,
  resolveDisplayedVideoFrame,
  resolveSourceCrop,
  resolveCropRect as resolveEditorCropRect,
} from '@/src/services/videoProcessing/videoEditMath';
import { enqueuePendingVideoUpload } from '@/src/services/videoProcessing/videoUploadQueue';
import type {
  VideoDimensions,
  VideoRatioId,
  VideoTransformState,
} from '@/src/services/videoProcessing/types';

type Props = StackScreenProps<MainStackParamList, 'VideoPost'>;

type ThemePalette = {
  background: string;
  cardBackground: string;
  previewBackground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  border: string;
  overlay: string;
  success: string;
  warning: string;
};

const DARK_PALETTE: ThemePalette = {
  background: '#000015',
  cardBackground: '#032f3c',
  previewBackground: '#000000',
  textPrimary: '#f6f6f7',
  textSecondary: '#b3c1c5',
  textMuted: '#9aacb1',
  primary: '#41899f',
  primarySoft: '#355963',
  border: '#68828a',
  overlay: 'rgba(0,0,0,0.4)',
  success: '#17b26a',
  warning: '#f59e0b',
};

const LIGHT_PALETTE: ThemePalette = {
  background: '#f6f8fa',
  cardBackground: '#ffffff',
  previewBackground: '#0f1720',
  textPrimary: '#032f3c',
  textSecondary: '#355963',
  textMuted: '#5c7480',
  primary: '#126b87',
  primarySoft: '#e6eaec',
  border: '#c8d4d8',
  overlay: 'rgba(0,0,0,0.25)',
  success: '#15803d',
  warning: '#b45309',
};

const RATIO_OPTIONS: VideoRatioId[] = ['1:1', '4:3', '16:9', '9:16'];

const ensureFileUri = (value?: string | null) => {
  if (!value) {
    return '';
  }
  if (value.startsWith('file://') || value.startsWith('content://')) {
    return value;
  }
  return `file://${value}`;
};

const sameTransform = (left: VideoTransformState, right: VideoTransformState) =>
  Math.abs(left.scale - right.scale) < 0.001 &&
  Math.abs(left.translateX - right.translateX) < 0.5 &&
  Math.abs(left.translateY - right.translateY) < 0.5;

const formatTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

function ActionButton({
  icon,
  label,
  onPress,
  styles,
  palette,
  disabled = false,
  iconBackgroundColor,
  iconBorderColor,
  iconColor,
  labelColor,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  palette: ThemePalette;
  disabled?: boolean;
  iconBackgroundColor?: string;
  iconBorderColor?: string;
  iconColor?: string;
  labelColor?: string;
}) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} disabled={disabled}>
      <View
        style={[
          styles.actionIconWrapper,
          {
            backgroundColor: iconBackgroundColor ?? palette.primarySoft,
            borderColor: iconBorderColor ?? palette.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <MaterialIcons name={icon} size={24} color={iconColor ?? palette.textPrimary} />
      </View>
      <Text style={[styles.actionLabel, { color: labelColor ?? palette.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function VideoPost({ navigation, route }: Props) {
  const toast = useToast();
  const { dark } = useTheme();

  const palette = dark ? DARK_PALETTE : LIGHT_PALETTE;
  const styles = useMemo(() => createStyles(), []);
  const listenerSubscription = useRef<Record<string, EventSubscription>>({});
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchStartRef = useRef(1);
  const hasAutoOpenedCameraRef = useRef(false);
  const hasShownTrimWarningRef = useRef(false);
  const videoPreviewRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [isPreparingVideo, setIsPreparingVideo] = useState(false);
  const [isLiveCameraVisible, setIsLiveCameraVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [caption, setCaption] = useState('');
  const [originalVideoUri, setOriginalVideoUri] = useState('');
  const [editableVideoUri, setEditableVideoUri] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStartMs, setTrimStartMs] = useState(0);
  const [trimEndMs, setTrimEndMs] = useState(0);
  const [videoNaturalSize, setVideoNaturalSize] = useState<VideoDimensions>({
    width: 0,
    height: 0,
  });
  const [previewStageSize, setPreviewStageSize] = useState({ width: 1, height: 1 });
  const [selectedRatio, setSelectedRatio] = useState<VideoRatioId>('9:16');
  const [transform, setTransform] = useState<VideoTransformState>(createDefaultVideoTransform());
  const [cropConfirmed, setCropConfirmed] = useState(false);

  const hasVideo = Boolean(editableVideoUri);
  const sourceDurationMs = Math.max(0, Math.round((videoDuration || 0) * 1000));
  const hasTrimSelection = trimEndMs > trimStartMs;
  const resolvedTrimStartMs = hasTrimSelection ? trimStartMs : 0;
  const resolvedTrimEndMs = hasTrimSelection ? trimEndMs : sourceDurationMs;
  const selectedDurationMs = Math.max(
    0,
    resolvedTrimEndMs > resolvedTrimStartMs
      ? resolvedTrimEndMs - resolvedTrimStartMs
      : sourceDurationMs
  );
  const selectedDurationSeconds = selectedDurationMs / 1000;
  const displayCurrentTime = hasTrimSelection
    ? Math.max(0, Math.min(selectedDurationSeconds, currentTime - resolvedTrimStartMs / 1000))
    : currentTime;
  const requiresTrim = selectedDurationMs > 60_050;
  const ratioConfig = VIDEO_RATIO_CONFIG[selectedRatio];
  const cropFrame = useMemo(
    () => resolveEditorCropRect(previewStageSize.width, previewStageSize.height, selectedRatio),
    [previewStageSize.height, previewStageSize.width, selectedRatio]
  );

  const clampedTransform = useMemo(
    () => clampVideoTransform(transform, videoNaturalSize, cropFrame),
    [cropFrame, transform, videoNaturalSize]
  );
  const displayedFrame = useMemo(() => {
    if (!hasVideo || !videoNaturalSize.width || !videoNaturalSize.height) {
      return null;
    }
    return resolveDisplayedVideoFrame(videoNaturalSize, cropFrame, clampedTransform);
  }, [clampedTransform, cropFrame, hasVideo, videoNaturalSize]);

  useEffect(() => {
    if (!sameTransform(transform, clampedTransform)) {
      setTransform(clampedTransform);
    }
  }, [clampedTransform, transform]);

  const resetCropState = useCallback(() => {
    setTransform(createDefaultVideoTransform());
    setCropConfirmed(false);
  }, []);

  const resetTrimState = useCallback(() => {
    setTrimStartMs(0);
    setTrimEndMs(0);
  }, []);

  const applySelectedVideo = useCallback(
    (nextPath: string, nextOriginalPath?: string) => {
      if (nextOriginalPath) {
        setOriginalVideoUri(nextOriginalPath);
      }
      setEditableVideoUri(nextPath);
      setCurrentTime(0);
      setVideoDuration(0);
      resetTrimState();
      setVideoNaturalSize({ width: 0, height: 0 });
      setIsPlaying(true);
      hasShownTrimWarningRef.current = false;
      resetCropState();
    },
    [resetCropState, resetTrimState]
  );

  const resolveVideoUri = useCallback(async (asset?: Asset, explicitUri?: string) => {
    const preferredPath =
      explicitUri ||
      ((Platform.OS === 'android'
        ? (asset as Asset & { originalPath?: string })?.originalPath
        : undefined) ??
        asset?.uri);

    if (!preferredPath) {
      return '';
    }

    const normalizedPath = ensureFileUri(preferredPath);
    if (Platform.OS !== 'ios') {
      return normalizedPath;
    }

    const isIosAssetLibraryPath =
      normalizedPath.startsWith('ph://') || normalizedPath.startsWith('assets-library://');
    if (!isIosAssetLibraryPath) {
      return normalizedPath;
    }

    const baseDir = RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath;
    const sourceName = asset?.fileName?.replace(/\.[^/.]+$/, '') || `video_${Date.now()}`;
    const targetPath = `${baseDir}/${sourceName}_${Date.now()}.mp4`;
    await RNFS.copyAssetsVideoIOS(normalizedPath, targetPath);
    return ensureFileUri(targetPath);
  }, []);

  const handlePreviewLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setPreviewStageSize({ width, height });
    }
  }, []);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const getTrimEditorPath = useCallback((rawPath: string) => {
    if (Platform.OS === 'android' && rawPath.startsWith('file://')) {
      return rawPath.replace('file://', '');
    }
    return rawPath;
  }, []);

  const handleVideoLoad = useCallback(
    (data: any) => {
      const nextDuration = Number(data?.duration || 0);
      const rawWidth = Number(data?.naturalSize?.width);
      const rawHeight = Number(data?.naturalSize?.height);

      setVideoDuration(nextDuration);
      if (
        Number.isFinite(rawWidth) &&
        Number.isFinite(rawHeight) &&
        rawWidth > 0 &&
        rawHeight > 0
      ) {
        setVideoNaturalSize({ width: rawWidth, height: rawHeight });
      }

      if (hasTrimSelection) {
        requestAnimationFrame(() => {
          videoPreviewRef.current?.seek?.(resolvedTrimStartMs / 1000);
          setCurrentTime(resolvedTrimStartMs / 1000);
        });
      }

      if (nextDuration > 60 && !hasShownTrimWarningRef.current && !hasTrimSelection) {
        hasShownTrimWarningRef.current = true;
        toast.show('Trim this video to 60 seconds or less before posting.', { type: 'warning' });
      }
    },
    [hasTrimSelection, resolvedTrimStartMs, toast]
  );

  const handleVideoProgress = useCallback(
    (data: any) => {
      const nextTime = Number(data?.currentTime || 0);
      if (!Number.isFinite(nextTime)) {
        return;
      }

      if (hasTrimSelection) {
        const trimStartSeconds = resolvedTrimStartMs / 1000;
        const trimEndSeconds = resolvedTrimEndMs / 1000;
        if (nextTime >= trimEndSeconds - 0.05) {
          setCurrentTime(trimStartSeconds);
          videoPreviewRef.current?.seek?.(trimStartSeconds);
          return;
        }

        if (nextTime < trimStartSeconds - 0.05) {
          setCurrentTime(trimStartSeconds);
          return;
        }
      }

      setCurrentTime(nextTime);
    },
    [hasTrimSelection, resolvedTrimEndMs, resolvedTrimStartMs]
  );

  const applyVideoFromPickerResponse = useCallback(
    async (response?: ImagePickerResponse, sourceName = 'video') => {
      if (!response || response.didCancel) {
        return;
      }

      if (response.errorCode) {
        toast.show(response.errorMessage || `Unable to load ${sourceName}.`, { type: 'danger' });
        return;
      }

      const selectedAsset = response.assets?.[0];
      if (!selectedAsset) {
        toast.show(`No ${sourceName} selected.`, { type: 'danger' });
        return;
      }

      setIsPreparingVideo(true);
      try {
        const nextPath = await resolveVideoUri(selectedAsset);
        if (!nextPath) {
          toast.show(`Unable to use selected ${sourceName}.`, { type: 'danger' });
          return;
        }

        setSelectedRatio('9:16');
        applySelectedVideo(nextPath, nextPath);
      } catch {
        toast.show(`Unable to prepare selected ${sourceName}.`, { type: 'danger' });
      } finally {
        setIsPreparingVideo(false);
      }
    },
    [applySelectedVideo, resolveVideoUri, toast]
  );

  const handleSelectFromLibrary = useCallback(async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'video',
      selectionLimit: 1,
      includeExtra: true,
      assetRepresentationMode: 'current',
      ...(Platform.OS === 'ios'
        ? {
            formatAsMp4: true,
            presentationStyle: 'fullScreen',
          }
        : {}),
    };
    const response = await launchImageLibrary(options).catch(() => undefined);
    await applyVideoFromPickerResponse(response, 'video');
  }, [applyVideoFromPickerResponse]);

  const handleRecordNewVideo = useCallback(() => {
    setIsLiveCameraVisible(true);
  }, []);

  const handleVisionCameraVideoPath = useCallback(
    (nextValue: React.SetStateAction<string | undefined>) => {
      const resolvedPath =
        typeof nextValue === 'function'
          ? (nextValue as (previousState: string | undefined) => string | undefined)(
              editableVideoUri || undefined
            )
          : nextValue;

      setIsLiveCameraVisible(false);
      if (!resolvedPath) {
        return;
      }

      setIsPreparingVideo(true);
      (async () => {
        try {
          const preparedPath = await resolveVideoUri(undefined, resolvedPath);
          if (!preparedPath) {
            toast.show('Unable to load selected video.', { type: 'danger' });
            return;
          }
          setSelectedRatio('9:16');
          applySelectedVideo(preparedPath, preparedPath);
        } catch {
          toast.show('Unable to prepare selected video.', { type: 'danger' });
        } finally {
          setIsPreparingVideo(false);
        }
      })();
    },
    [applySelectedVideo, editableVideoUri, resolveVideoUri, toast]
  );

  const handleChooseVideoSource = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose From Library', 'Record New Video'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleSelectFromLibrary();
          }
          if (buttonIndex === 2) {
            handleRecordNewVideo();
          }
        }
      );
      return;
    }

    Alert.alert('Select video', 'Choose a source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose From Library', onPress: handleSelectFromLibrary },
      { text: 'Record New Video', onPress: handleRecordNewVideo },
    ]);
  }, [handleRecordNewVideo, handleSelectFromLibrary]);

  const handleTrimPress = useCallback(() => {
    if (!editableVideoUri) {
      toast.show('Please select or record a video first.', { type: 'danger' });
      return;
    }

    const editorPath = getTrimEditorPath(originalVideoUri || editableVideoUri);
    if (!editorPath) {
      toast.show('Unable to open trim editor.', { type: 'danger' });
      return;
    }

    try {
      showEditor(editorPath, {
        saveToPhoto: false,
        emitTrimSelectionOnly: true,
        enableSaveDialog: false,
        alertOnFailToLoad: true,
        alertOnFailMessage: 'Failed to load video',
        alertOnFailTitle: 'Error',
        maxDuration: 60,
        cancelDialogMessage: 'Discard your trim changes?',
        cancelDialogConfirmText: 'Discard',
        trimmingText: 'Preparing trim selection...',
      });
    } catch {
      toast.show('Unable to open trim editor.', { type: 'danger' });
    }
  }, [editableVideoUri, getTrimEditorPath, originalVideoUri, toast]);

  const handleClearTrim = useCallback(() => {
    if (!originalVideoUri) {
      return;
    }
    applySelectedVideo(originalVideoUri);
  }, [applySelectedVideo, originalVideoUri]);

  const handleTogglePlayback = useCallback(() => {
    if (!hasVideo) {
      return;
    }
    setIsPlaying((previous) => !previous);
  }, [hasVideo]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((previous) => !previous);
  }, []);

  const handleConfirmCrop = useCallback(() => {
    if (!hasVideo || !videoNaturalSize.width || !videoNaturalSize.height) {
      toast.show('Wait for the video preview to finish loading.', { type: 'warning' });
      return;
    }

    setCropConfirmed(true);
    toast.show('Crop confirmed locally. Background processing starts after you tap Done.', {
      type: 'success',
    });
  }, [hasVideo, toast, videoNaturalSize.height, videoNaturalSize.width]);

  const handleDonePress = useCallback(async () => {
    if (!originalVideoUri) {
      toast.show('Please select or record a video first.', { type: 'danger' });
      return;
    }

    if (requiresTrim) {
      toast.show('Trim this video to 60 seconds or less before posting.', { type: 'danger' });
      return;
    }

    if (!videoNaturalSize.width || !videoNaturalSize.height) {
      toast.show('Wait for the video to finish loading before posting.', { type: 'warning' });
      return;
    }

    if (!cropConfirmed) {
      toast.show('Confirm your crop before posting.', { type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const sourceCrop = resolveSourceCrop(videoNaturalSize, cropFrame, clampedTransform);
      await enqueuePendingVideoUpload({
        sourceUri: originalVideoUri,
        caption,
        trimStartMs: resolvedTrimStartMs,
        trimEndMs: resolvedTrimEndMs,
        trimDurationMs: selectedDurationMs,
        ratioId: selectedRatio,
        cropRect: sourceCrop,
        transform: clampedTransform,
        sourceWidth: videoNaturalSize.width,
        sourceHeight: videoNaturalSize.height,
        outputWidth: ratioConfig.outputWidth,
        outputHeight: ratioConfig.outputHeight,
        videoBitrate: ratioConfig.videoBitrate,
        audioBitrate: 128_000,
      });

      toast.show(
        'Video queued. We are moderating, compressing, and uploading it in the background.',
        {
          type: 'success',
          placement: 'bottom',
        }
      );

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainRoot', {
          screen: 'Main',
          params: {
            screen: 'HomeTab',
            params: {
              screen: 'Home',
              params: {},
            },
          },
        });
      }
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Unable to queue video.', {
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [
    caption,
    clampedTransform,
    cropConfirmed,
    cropFrame,
    originalVideoUri,
    navigation,
    ratioConfig.outputHeight,
    ratioConfig.outputWidth,
    ratioConfig.videoBitrate,
    requiresTrim,
    resolvedTrimEndMs,
    resolvedTrimStartMs,
    selectedRatio,
    selectedDurationMs,
    toast,
    videoNaturalSize,
  ]);

  const cropGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(hasVideo)
      .onBegin(() => {
        panStartRef.current = {
          x: clampedTransform.translateX,
          y: clampedTransform.translateY,
        };
      })
      .onUpdate((event) => {
        setTransform((previous) =>
          clampVideoTransform(
            {
              ...previous,
              translateX: panStartRef.current.x + event.translationX,
              translateY: panStartRef.current.y + event.translationY,
            },
            videoNaturalSize,
            cropFrame
          )
        );
        setCropConfirmed(false);
      })
      .runOnJS(true);

    const pinch = Gesture.Pinch()
      .enabled(hasVideo)
      .onBegin(() => {
        pinchStartRef.current = clampedTransform.scale;
      })
      .onUpdate((event) => {
        setTransform((previous) =>
          clampVideoTransform(
            {
              ...previous,
              scale: Math.min(
                MAX_VIDEO_EDITOR_SCALE,
                Math.max(MIN_VIDEO_EDITOR_SCALE, pinchStartRef.current * event.scale)
              ),
            },
            videoNaturalSize,
            cropFrame
          )
        );
        setCropConfirmed(false);
      })
      .runOnJS(true);

    return Gesture.Simultaneous(pan, pinch);
  }, [
    clampedTransform.scale,
    clampedTransform.translateX,
    clampedTransform.translateY,
    cropFrame,
    hasVideo,
    videoNaturalSize,
  ]);

  useEffect(() => {
    const incomingVideoPath = route.params?.videoPath;
    let cancelled = false;

    if (!incomingVideoPath) {
      return () => {
        cancelled = true;
      };
    }

    setIsPreparingVideo(true);
    (async () => {
      try {
        const resolvedPath = await resolveVideoUri(undefined, incomingVideoPath);
        if (!cancelled && resolvedPath) {
          setSelectedRatio('9:16');
          applySelectedVideo(resolvedPath, resolvedPath);
        }
      } catch {
        if (!cancelled) {
          toast.show('Unable to load selected video.', { type: 'danger' });
        }
      } finally {
        if (!cancelled) {
          setIsPreparingVideo(false);
          navigation.setParams({ videoPath: undefined });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySelectedVideo, navigation, resolveVideoUri, route.params?.videoPath, toast]);

  useEffect(() => {
    listenerSubscription.current.onFinishTrimming = VideoTrim.onFinishTrimming(
      ({ startTime, endTime }) => {
        const nextTrimStartMs = Math.max(0, Math.round(Number(startTime || 0)));
        const nextTrimEndMs = Math.max(nextTrimStartMs, Math.round(Number(endTime || 0)));
        if (nextTrimEndMs <= nextTrimStartMs) {
          toast.show('Unable to save trim selection.', { type: 'danger' });
          return;
        }

        setTrimStartMs(nextTrimStartMs);
        setTrimEndMs(nextTrimEndMs);
        setCurrentTime(nextTrimStartMs / 1000);
        requestAnimationFrame(() => {
          videoPreviewRef.current?.seek?.(nextTrimStartMs / 1000);
        });
        toast.show('Trim selection saved. Confirm your crop to continue.', { type: 'success' });
      }
    );

    listenerSubscription.current.onError = VideoTrim.onError(({ message }) => {
      toast.show(message || 'Video trim failed.', { type: 'danger' });
    });

    return () => {
      listenerSubscription.current.onFinishTrimming?.remove();
      listenerSubscription.current.onError?.remove();
      listenerSubscription.current = {};
    };
  }, [toast]);

  useEffect(() => {
    if (!hasVideo || !hasTrimSelection) {
      return;
    }

    const trimStartSeconds = resolvedTrimStartMs / 1000;
    setCurrentTime(trimStartSeconds);
    requestAnimationFrame(() => {
      videoPreviewRef.current?.seek?.(trimStartSeconds);
    });
  }, [hasTrimSelection, hasVideo, resolvedTrimStartMs]);

  useEffect(() => {
    if (!route.params?.openCameraOnMount || hasAutoOpenedCameraRef.current) {
      return;
    }
    hasAutoOpenedCameraRef.current = true;
    setIsLiveCameraVisible(true);
    navigation.setParams({ openCameraOnMount: undefined });
  }, [navigation, route.params?.openCameraOnMount]);

  if (isLiveCameraVisible) {
    return (
      <View style={styles.liveCameraContainer}>
        <CameraComponent
          setVideoPath={handleVisionCameraVideoPath}
          onClose={() => setIsLiveCameraVisible(false)}
        />
      </View>
    );
  }

  const cropStatusColor = cropConfirmed ? palette.success : palette.warning;
  const cropStatusLabel = cropConfirmed ? 'Crop confirmed' : 'Crop confirmation required';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {Platform.OS === 'android' ? (
        <StatusBar
          translucent={false}
          backgroundColor={palette.background}
          barStyle={dark ? 'light-content' : 'dark-content'}
        />
      ) : null}

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
          <MaterialIcons name="close" size={28} color={palette.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Edit Video</Text>

        <TouchableOpacity
          style={[
            styles.doneButton,
            {
              backgroundColor: palette.primary,
              opacity: loading || isPreparingVideo ? 0.7 : 1,
            },
          ]}
          onPress={handleDonePress}
          disabled={loading || isPreparingVideo}
        >
          {loading ? (
            <ActivityIndicator color={palette.textPrimary} size="small" />
          ) : (
            <Text style={[styles.doneText, { color: palette.textPrimary }]}>Done</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.previewContainer}>
        <GestureDetector gesture={cropGesture}>
          <View
            style={[styles.previewStage, { backgroundColor: palette.previewBackground }]}
            onLayout={handlePreviewLayout}
          >
            {hasVideo && displayedFrame ? (
              <>
                <View
                  style={[
                    styles.cropWindow,
                    {
                      left: cropFrame.x,
                      top: cropFrame.y,
                      width: cropFrame.width,
                      height: cropFrame.height,
                    },
                  ]}
                >
                  <CustomVideo
                    ref={videoPreviewRef}
                    source={{ uri: editableVideoUri }}
                    resizeMode="cover"
                    paused={!isPlaying}
                    muted={isMuted}
                    onLoad={handleVideoLoad}
                    onProgress={handleVideoProgress}
                    repeat={!hasTrimSelection}
                    style={[
                      styles.videoSurface,
                      {
                        left: displayedFrame.x - cropFrame.x,
                        top: displayedFrame.y - cropFrame.y,
                        width: displayedFrame.width,
                        height: displayedFrame.height,
                      },
                    ]}
                  />
                  <TouchableOpacity
                    style={[
                      styles.playOverlay,
                      { backgroundColor: isPlaying ? 'transparent' : palette.overlay },
                    ]}
                    activeOpacity={0.85}
                    onPress={handleTogglePlayback}
                  >
                    {!isPlaying ? (
                      <View style={styles.playIconWrapper}>
                        <MaterialIcons name="play-arrow" size={40} color={palette.textPrimary} />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                  <View style={styles.gridLineVertical} />
                  <View style={[styles.gridLineVertical, { left: '66.66%' }]} />
                  <View style={styles.gridLineHorizontal} />
                  <View style={[styles.gridLineHorizontal, { top: '66.66%' }]} />
                </View>

                <View
                  style={[
                    styles.maskTop,
                    { height: cropFrame.y, backgroundColor: palette.overlay },
                  ]}
                />
                <View
                  style={[
                    styles.maskBottom,
                    {
                      top: cropFrame.y + cropFrame.height,
                      backgroundColor: palette.overlay,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.maskSide,
                    {
                      top: cropFrame.y,
                      width: cropFrame.x,
                      height: cropFrame.height,
                      backgroundColor: palette.overlay,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.maskSide,
                    {
                      left: cropFrame.x + cropFrame.width,
                      top: cropFrame.y,
                      right: 0,
                      width: Math.max(0, previewStageSize.width - cropFrame.x - cropFrame.width),
                      height: cropFrame.height,
                      backgroundColor: palette.overlay,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.cropFrameOutline,
                    {
                      left: cropFrame.x,
                      top: cropFrame.y,
                      width: cropFrame.width,
                      height: cropFrame.height,
                      borderColor: cropStatusColor,
                    },
                  ]}
                />

                <View style={styles.timeBadge}>
                  <Text style={[styles.timeText, { color: '#f6f6f7' }]}>
                    {formatTime(displayCurrentTime)} / {formatTime(selectedDurationSeconds)}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyVideoState}>
                <MaterialIcons name="videocam" size={46} color={palette.textMuted} />
                <Text style={[styles.emptyVideoText, { color: palette.textSecondary }]}>
                  Select or record a video to continue
                </Text>
                <TouchableOpacity
                  style={[styles.sourcePickerButton, { backgroundColor: palette.primary }]}
                  onPress={handleChooseVideoSource}
                  disabled={isPreparingVideo}
                >
                  {isPreparingVideo ? (
                    <ActivityIndicator size="small" color={palette.textPrimary} />
                  ) : (
                    <Text style={[styles.sourcePickerButtonText, { color: palette.textPrimary }]}>
                      Select Video
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </GestureDetector>
      </View>

      <View style={styles.toolsSection}>
        <View
          style={[
            styles.captionBlock,
            {
              backgroundColor: palette.cardBackground,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.captionLabel, { color: palette.textMuted }]}>Caption</Text>
          <TextInput
            style={[styles.captionInput, { color: palette.textPrimary }]}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption..."
            placeholderTextColor={palette.textMuted}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        <View
          style={[
            styles.statusCard,
            { backgroundColor: palette.cardBackground, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.statusTitle, { color: palette.textPrimary }]}>Trim and Crop</Text>
          <Text style={[styles.statusBody, { color: palette.textSecondary }]}>
            {requiresTrim
              ? 'This clip is longer than 60 seconds. Trim it before posting.'
              : `Selected clip length: ${formatTime(selectedDurationSeconds)}. ${cropStatusLabel}.`}
          </Text>
          <Text style={[styles.statusMeta, { color: cropStatusColor }]}>
            Ratio {selectedRatio} • Output {ratioConfig.outputWidth}x{ratioConfig.outputHeight}
          </Text>
          <Text style={[styles.statusMeta, { color: palette.textMuted }]}>
            Full source: {formatTime(videoDuration)}.
          </Text>
          {hasTrimSelection ? (
            <Text style={[styles.statusMeta, { color: palette.textMuted }]}>
              Trim range: {formatTime(resolvedTrimStartMs / 1000)} -{' '}
              {formatTime(resolvedTrimEndMs / 1000)}. Upload starts only after Done.
            </Text>
          ) : null}
        </View>

        <View style={styles.ratioRow}>
          {RATIO_OPTIONS.map((ratioId) => {
            const selected = ratioId === selectedRatio;
            return (
              <TouchableOpacity
                key={ratioId}
                style={[
                  styles.ratioPill,
                  {
                    backgroundColor: selected ? palette.primary : palette.cardBackground,
                    borderColor: selected ? palette.primary : palette.border,
                  },
                ]}
                onPress={() => {
                  setSelectedRatio(ratioId);
                  resetCropState();
                }}
              >
                <Text
                  style={[
                    styles.ratioPillText,
                    { color: selected ? palette.textPrimary : palette.textSecondary },
                  ]}
                >
                  {ratioId}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.confirmCropButton, { backgroundColor: cropStatusColor }]}
          onPress={handleConfirmCrop}
          disabled={!hasVideo}
        >
          <Text style={styles.confirmCropText}>
            {cropConfirmed ? 'Crop Confirmed' : 'Confirm Crop'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionGrid}>
          <ActionButton
            icon="video-library"
            label="Library"
            onPress={handleSelectFromLibrary}
            styles={styles}
            palette={palette}
            disabled={isPreparingVideo}
          />
          <ActionButton
            icon="videocam"
            label="Record"
            onPress={handleRecordNewVideo}
            styles={styles}
            palette={palette}
            disabled={isPreparingVideo}
            iconBackgroundColor="#d13a3f"
            iconBorderColor="#b82f34"
            iconColor="#ffffff"
            labelColor="#d13a3f"
          />
          <ActionButton
            icon="content-cut"
            label="Trim"
            onPress={handleTrimPress}
            styles={styles}
            palette={palette}
            disabled={!hasVideo}
          />
          <ActionButton
            icon={isMuted ? 'volume-off' : 'volume-up'}
            label={isMuted ? 'Unmute' : 'Mute'}
            onPress={handleToggleMute}
            styles={styles}
            palette={palette}
            disabled={!hasVideo}
          />
          {hasTrimSelection ? (
            <ActionButton
              icon="history"
              label="Full Clip"
              onPress={handleClearTrim}
              styles={styles}
              palette={palette}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    liveCameraContainer: {
      flex: 1,
      backgroundColor: '#000000',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    iconButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
    },
    doneButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 24,
      minWidth: 84,
      alignItems: 'center',
    },
    doneText: {
      fontWeight: '700',
      fontSize: 16,
    },
    previewContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    previewStage: {
      flex: 1,
      borderRadius: 24,
      overflow: 'hidden',
      position: 'relative',
    },
    cropWindow: {
      position: 'absolute',
      overflow: 'hidden',
      borderRadius: 20,
    },
    cropFrameOutline: {
      position: 'absolute',
      borderWidth: 2,
      borderRadius: 20,
    },
    videoSurface: {
      position: 'absolute',
    },
    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playIconWrapper: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    gridLineVertical: {
      position: 'absolute',
      left: '33.33%',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    gridLineHorizontal: {
      position: 'absolute',
      top: '33.33%',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    maskTop: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
    maskBottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    maskSide: {
      position: 'absolute',
      left: 0,
    },
    timeBadge: {
      position: 'absolute',
      bottom: 18,
      right: 18,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
    },
    timeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    emptyVideoState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 12,
    },
    emptyVideoText: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
    sourcePickerButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 18,
    },
    sourcePickerButtonText: {
      fontSize: 14,
      fontWeight: '700',
    },
    toolsSection: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 14,
    },
    captionBlock: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 8,
    },
    captionLabel: {
      fontSize: 11,
      letterSpacing: 0.6,
      fontWeight: '700',
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    captionInput: {
      minHeight: 72,
      maxHeight: 120,
      fontSize: 14,
      fontWeight: '500',
      padding: 0,
    },
    statusCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      gap: 6,
    },
    statusTitle: {
      fontSize: 15,
      fontWeight: '700',
    },
    statusBody: {
      fontSize: 13,
      lineHeight: 18,
    },
    statusMeta: {
      fontSize: 12,
      fontWeight: '600',
    },
    ratioRow: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
    },
    ratioPill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    ratioPillText: {
      fontSize: 13,
      fontWeight: '700',
    },
    confirmCropButton: {
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
    },
    confirmCropText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },
    actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    actionButton: {
      alignItems: 'center',
      minWidth: 64,
      marginBottom: 4,
    },
    actionIconWrapper: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      marginBottom: 8,
    },
    actionLabel: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
