import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import useMountEffect from '@/src/hooks/useMountEffect';
import { MainStackParamList } from '@/src/navigator/types';
import {
  createDefaultVideoTransform,
  MAX_VIDEO_EDITOR_SCALE,
  MIN_VIDEO_EDITOR_SCALE,
  VIDEO_RATIO_CONFIG,
  clampVideoTransform,
  resolveClosestVideoRatioId,
  resolveDisplayedVideoFrame,
  resolveSourceCrop,
  resolveCropRect as resolveEditorCropRect,
} from '@/src/services/videoProcessing/videoEditMath';
import type {
  SelectedVideoSource,
  VideoDimensions,
  VideoRatioId,
  VideoTransformState,
} from '@/src/services/videoProcessing/types';
import {
  enqueuePendingVideoUpload,
  startPendingVideoUploads,
} from '@/src/services/videoProcessing/videoUploadQueue';
import {
  buildPendingVideoUploadRecipe,
  ConfirmedVideoCropSelection,
  copyVideoSourceToAppCache,
} from './videoPostUtils';

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
  accent: string;
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
  accent: '#12D2D9',
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
  accent: '#12D2D9',
};

const RATIO_OPTIONS: VideoRatioId[] = ['1:1', '4:3', '16:9', '9:16'];
const IOS_UPLOAD_QUEUE_START_DELAY_MS = 450;
const DEFAULT_UPLOAD_QUEUE_START_DELAY_MS = 150;

type VideoEditorMode = 'crop' | 'edit';

type ConfirmedCropSelection = ConfirmedVideoCropSelection;

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

const normalizeVideoDimension = (value?: number) => {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return undefined;
  }
  return Math.round(value);
};

const resolveInitialRatioId = (
  preferredRatioId?: VideoRatioId,
  width?: number,
  height?: number
): VideoRatioId | null => {
  if (preferredRatioId) {
    return preferredRatioId;
  }

  const normalizedWidth = normalizeVideoDimension(width);
  const normalizedHeight = normalizeVideoDimension(height);
  if (!normalizedWidth || !normalizedHeight) {
    return null;
  }

  return resolveClosestVideoRatioId(normalizedWidth, normalizedHeight);
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
  const insets = useSafeAreaInsets();

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
  const [shouldInferRatioOnLoad, setShouldInferRatioOnLoad] = useState(false);
  const [transform, setTransform] = useState<VideoTransformState>(createDefaultVideoTransform());
  const [editorMode, setEditorMode] = useState<VideoEditorMode>('crop');
  const [confirmedCropSelection, setConfirmedCropSelection] =
    useState<ConfirmedCropSelection | null>(null);
  const [pendingAutoTrimUri, setPendingAutoTrimUri] = useState<string | null>(null);
  const [requiresInitialTrim, setRequiresInitialTrim] = useState(false);
  const [isTrimEditorVisible, setIsTrimEditorVisible] = useState(false);

  const hasVideo = Boolean(editableVideoUri);
  const isCropStep = editorMode === 'crop';
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

  useMountEffect(() => {
    if (!sameTransform(transform, clampedTransform)) {
      setTransform(clampedTransform);
    }
  });

  const resetCropState = useCallback(() => {
    setTransform(createDefaultVideoTransform());
  }, []);

  const resetTrimState = useCallback(() => {
    setTrimStartMs(0);
    setTrimEndMs(0);
  }, []);

  const applySelectedVideo = useCallback(
    (
      nextPath: string,
      nextOriginalPath?: string,
      options?: {
        autoOpenTrimEditor?: boolean;
      }
    ) => {
      const sourceUri = nextOriginalPath || nextPath;
      if (nextOriginalPath) {
        setOriginalVideoUri(nextOriginalPath);
      }
      setEditableVideoUri(nextPath);
      setCurrentTime(0);
      setVideoDuration(0);
      resetTrimState();
      setVideoNaturalSize({ width: 0, height: 0 });
      setIsPlaying(false);
      hasShownTrimWarningRef.current = false;
      setEditorMode(options?.autoOpenTrimEditor ? 'edit' : 'crop');
      setConfirmedCropSelection(null);
      setRequiresInitialTrim(Boolean(options?.autoOpenTrimEditor));
      setIsTrimEditorVisible(false);
      setPendingAutoTrimUri(options?.autoOpenTrimEditor ? sourceUri : null);
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
    if (explicitUri) {
      try {
        return await copyVideoSourceToAppCache({
          sourceUri: normalizedPath,
          cachesDirectoryPath: RNFS.CachesDirectoryPath,
          temporaryDirectoryPath: RNFS.TemporaryDirectoryPath,
          copyFile: async (sourcePath, targetPath) => RNFS.copyFile(sourcePath, targetPath),
        });
      } catch {
        return normalizedPath;
      }
    }

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
        if (shouldInferRatioOnLoad) {
          setSelectedRatio(resolveClosestVideoRatioId(rawWidth, rawHeight));
          setShouldInferRatioOnLoad(false);
        }
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

      requestAnimationFrame(() => {
        setIsPlaying(true);
      });
    },
    [hasTrimSelection, resolvedTrimStartMs, shouldInferRatioOnLoad, toast]
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

        const nextRatioId = resolveInitialRatioId(
          undefined,
          selectedAsset.width,
          selectedAsset.height
        );
        setSelectedRatio(nextRatioId ?? '9:16');
        setShouldInferRatioOnLoad(!nextRatioId);
        applySelectedVideo(nextPath, nextPath, { autoOpenTrimEditor: true });
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
    (selection?: SelectedVideoSource) => {
      setIsLiveCameraVisible(false);
      if (!selection?.uri) {
        return;
      }

      setIsPreparingVideo(true);
      (async () => {
        try {
          const preparedPath = await resolveVideoUri(undefined, selection.uri);
          if (!preparedPath) {
            toast.show('Unable to load selected video.', { type: 'danger' });
            return;
          }

          const nextRatioId = resolveInitialRatioId(
            selection.ratioId,
            selection.width,
            selection.height
          );
          setSelectedRatio(nextRatioId ?? '9:16');
          setShouldInferRatioOnLoad(!nextRatioId);
          applySelectedVideo(preparedPath, preparedPath, { autoOpenTrimEditor: true });
        } catch {
          toast.show('Unable to prepare selected video.', { type: 'danger' });
        } finally {
          setIsPreparingVideo(false);
        }
      })();
    },
    [applySelectedVideo, resolveVideoUri, toast]
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

  const openTrimEditor = useCallback(
    (rawUri?: string) => {
      if (!rawUri) {
        toast.show('Please select or record a video first.', { type: 'danger' });
        return;
      }

      const editorPath = getTrimEditorPath(rawUri);
      if (!editorPath) {
        toast.show('Unable to open trim editor.', { type: 'danger' });
        return;
      }

      try {
        setIsTrimEditorVisible(true);
        showEditor(editorPath, {
          saveToPhoto: false,
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
    },
    [getTrimEditorPath, toast]
  );

  const handleTrimPress = useCallback(() => {
    if (!editableVideoUri) {
      toast.show('Please select or record a video first.', { type: 'danger' });
      return;
    }
    openTrimEditor(originalVideoUri || editableVideoUri);
  }, [editableVideoUri, openTrimEditor, originalVideoUri, toast]);

  useEffect(() => {
    if (!pendingAutoTrimUri || isLiveCameraVisible || isPreparingVideo) {
      return undefined;
    }

    const queuedUri = pendingAutoTrimUri;
    const launchTimeout = setTimeout(
      () => {
        setPendingAutoTrimUri((currentValue) => (currentValue === queuedUri ? null : currentValue));
        openTrimEditor(queuedUri);
      },
      Platform.OS === 'ios' ? 300 : 150
    );

    return () => {
      clearTimeout(launchTimeout);
    };
  }, [isLiveCameraVisible, isPreparingVideo, openTrimEditor, pendingAutoTrimUri]);

  const handleClearTrim = useCallback(() => {
    if (!hasVideo) {
      return;
    }
    resetTrimState();
    setCurrentTime(0);
    requestAnimationFrame(() => {
      videoPreviewRef.current?.seek?.(0);
    });
    toast.show('Trim cleared. The full clip is active again.', { type: 'success' });
  }, [hasVideo, resetTrimState, toast]);

  const handleTogglePlayback = useCallback(() => {
    if (!hasVideo) {
      return;
    }
    setIsPlaying((previous) => !previous);
  }, [hasVideo]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((previous) => !previous);
  }, []);

  const handleCropDonePress = useCallback(() => {
    if (!hasVideo || !videoNaturalSize.width || !videoNaturalSize.height) {
      toast.show('Wait for the video preview to finish loading.', { type: 'warning' });
      return;
    }

    if (requiresTrim) {
      toast.show('Trim this video to 60 seconds or less before continuing.', { type: 'danger' });
      return;
    }

    const sourceCrop = resolveSourceCrop(videoNaturalSize, cropFrame, clampedTransform);
    const confirmedRatioConfig = VIDEO_RATIO_CONFIG[selectedRatio];

    setConfirmedCropSelection({
      cropRect: {
        x: sourceCrop.cropX,
        y: sourceCrop.cropY,
        width: sourceCrop.cropWidth,
        height: sourceCrop.cropHeight,
      },
      ratioId: selectedRatio,
      outputWidth: confirmedRatioConfig.outputWidth,
      outputHeight: confirmedRatioConfig.outputHeight,
      videoBitrate: confirmedRatioConfig.videoBitrate,
      sourceWidth: videoNaturalSize.width,
      sourceHeight: videoNaturalSize.height,
      transform: clampedTransform,
    });
    setEditorMode('edit');
    toast.show('Crop saved. Finish editing and post when ready.', {
      type: 'success',
    });
  }, [clampedTransform, cropFrame, hasVideo, requiresTrim, selectedRatio, toast, videoNaturalSize]);

  const resolveCurrentCropSelection = useCallback((): ConfirmedCropSelection | null => {
    if (!videoNaturalSize.width || !videoNaturalSize.height) {
      return null;
    }

    const sourceCrop = resolveSourceCrop(videoNaturalSize, cropFrame, clampedTransform);
    const ratioConfig = VIDEO_RATIO_CONFIG[selectedRatio];

    return {
      cropRect: {
        x: sourceCrop.cropX,
        y: sourceCrop.cropY,
        width: sourceCrop.cropWidth,
        height: sourceCrop.cropHeight,
      },
      ratioId: selectedRatio,
      outputWidth: ratioConfig.outputWidth,
      outputHeight: ratioConfig.outputHeight,
      videoBitrate: ratioConfig.videoBitrate,
      sourceWidth: videoNaturalSize.width,
      sourceHeight: videoNaturalSize.height,
      transform: clampedTransform,
    };
  }, [clampedTransform, cropFrame, selectedRatio, videoNaturalSize]);

  const handlePostPress = useCallback(async () => {
    const uploadSourceUri = originalVideoUri || editableVideoUri;
    if (!uploadSourceUri) {
      toast.show('Please select or record a video first.', { type: 'danger' });
      return;
    }

    if (requiresInitialTrim) {
      toast.show('Finish trimming before continuing to the editor.', { type: 'warning' });
      return;
    }

    if (requiresTrim) {
      toast.show('Trim this video to 60 seconds or less before posting.', { type: 'danger' });
      return;
    }

    const activeCropSelection = confirmedCropSelection ?? resolveCurrentCropSelection();
    if (!activeCropSelection?.sourceWidth || !activeCropSelection?.sourceHeight) {
      toast.show('Wait for the video to finish loading before posting.', { type: 'warning' });
      return;
    }

    const uploadQueueStartDelayMs =
      Platform.OS === 'ios' ? IOS_UPLOAD_QUEUE_START_DELAY_MS : DEFAULT_UPLOAD_QUEUE_START_DELAY_MS;

    setLoading(true);
    setIsPlaying(false);
    try {
      const recipe = buildPendingVideoUploadRecipe({
        sourceUri: uploadSourceUri,
        caption,
        trimStartMs: resolvedTrimStartMs,
        trimEndMs: resolvedTrimEndMs,
        trimDurationMs: selectedDurationMs,
        confirmedCropSelection: activeCropSelection,
      });

      await enqueuePendingVideoUpload(recipe, { startImmediately: false });

      toast.show(
        "Your Watch video was queued for background processing. We'll notify you when it's live.",
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

      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          startPendingVideoUploads().catch(() => undefined);
        }, uploadQueueStartDelayMs);
      });
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Unable to upload video.', {
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [
    caption,
    confirmedCropSelection,
    editableVideoUri,
    originalVideoUri,
    navigation,
    resolvedTrimEndMs,
    resolvedTrimStartMs,
    requiresInitialTrim,
    requiresTrim,
    resolveCurrentCropSelection,
    selectedDurationMs,
    toast,
  ]);

  const cropGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(hasVideo && isCropStep)
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
      })
      .runOnJS(true);

    const pinch = Gesture.Pinch()
      .enabled(hasVideo && isCropStep)
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
      })
      .runOnJS(true);

    return Gesture.Simultaneous(pan, pinch);
  }, [
    clampedTransform.scale,
    clampedTransform.translateX,
    clampedTransform.translateY,
    cropFrame,
    hasVideo,
    isCropStep,
    videoNaturalSize,
  ]);

  useMountEffect(() => {
    const incomingVideoPath = route.params?.videoPath;
    const incomingVideoRatioId = route.params?.videoRatioId;
    const incomingVideoWidth = route.params?.videoWidth;
    const incomingVideoHeight = route.params?.videoHeight;
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
          const nextRatioId = resolveInitialRatioId(
            incomingVideoRatioId,
            incomingVideoWidth,
            incomingVideoHeight
          );
          setSelectedRatio(nextRatioId ?? '9:16');
          setShouldInferRatioOnLoad(!nextRatioId);
          applySelectedVideo(resolvedPath, resolvedPath, { autoOpenTrimEditor: true });
        }
      } catch {
        if (!cancelled) {
          toast.show('Unable to load selected video.', { type: 'danger' });
        }
      } finally {
        if (!cancelled) {
          setIsPreparingVideo(false);
          navigation.setParams({
            videoPath: undefined,
            videoRatioId: undefined,
            videoWidth: undefined,
            videoHeight: undefined,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  useEffect(() => {
    listenerSubscription.current.onFinishTrimming = VideoTrim.onFinishTrimming(
      async ({ outputPath, startTime, endTime }) => {
        const nextTrimStartMs = Math.max(0, Math.round(Number(startTime || 0)));
        const nextTrimEndMs = Math.max(nextTrimStartMs, Math.round(Number(endTime || 0)));
        if (nextTrimEndMs <= nextTrimStartMs) {
          setIsTrimEditorVisible(false);
          toast.show('Unable to save trim selection.', { type: 'danger' });
          return;
        }

        try {
          const resolvedOutputPath = await resolveVideoUri(undefined, outputPath);
          const nextVideoUri = resolvedOutputPath || editableVideoUri || originalVideoUri;
          if (!nextVideoUri) {
            throw new Error('Unable to load trimmed video.');
          }

          applySelectedVideo(nextVideoUri, nextVideoUri);
          setIsTrimEditorVisible(false);
          setRequiresInitialTrim(false);
          setEditorMode('edit');
          setTrimStartMs(0);
          setTrimEndMs(0);
          setCurrentTime(0);
          requestAnimationFrame(() => {
            videoPreviewRef.current?.seek?.(0);
          });
          toast.show(
            requiresInitialTrim
              ? 'Trim saved. Continue editing and post when ready.'
              : isCropStep
                ? 'Trim selection saved. Tap Done to continue.'
                : 'Trim selection saved. Review and post when ready.',
            { type: 'success' }
          );
        } catch {
          setIsTrimEditorVisible(false);
          toast.show('Unable to load trimmed video.', { type: 'danger' });
        }
      }
    );

    listenerSubscription.current.onCancel = VideoTrim.onCancel(() => {
      setIsTrimEditorVisible(false);
      if (requiresInitialTrim) {
        toast.show('Video trim was canceled.', { type: 'warning' });
        handleBackPress();
      }
    });

    listenerSubscription.current.onCancelTrimming = VideoTrim.onCancelTrimming(() => {
      setIsTrimEditorVisible(false);
    });

    listenerSubscription.current.onHide = VideoTrim.onHide(() => {
      setIsTrimEditorVisible(false);
    });

    listenerSubscription.current.onShow = VideoTrim.onShow(() => {
      setIsTrimEditorVisible(true);
    });

    listenerSubscription.current.onError = VideoTrim.onError(({ message }) => {
      setIsTrimEditorVisible(false);
      toast.show(message || 'Video trim failed.', { type: 'danger' });
      if (requiresInitialTrim) {
        handleBackPress();
      }
    });

    return () => {
      listenerSubscription.current.onFinishTrimming?.remove();
      listenerSubscription.current.onCancel?.remove();
      listenerSubscription.current.onCancelTrimming?.remove();
      listenerSubscription.current.onHide?.remove();
      listenerSubscription.current.onShow?.remove();
      listenerSubscription.current.onError?.remove();
      listenerSubscription.current = {};
    };
  }, [
    applySelectedVideo,
    editableVideoUri,
    handleBackPress,
    isCropStep,
    originalVideoUri,
    requiresInitialTrim,
    resolveVideoUri,
    toast,
  ]);

  useMountEffect(() => {
    if (!route.params?.openCameraOnMount || hasAutoOpenedCameraRef.current) {
      return;
    }
    hasAutoOpenedCameraRef.current = true;
    setIsLiveCameraVisible(true);
    navigation.setParams({ openCameraOnMount: undefined });
  });

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

  if (hasVideo && requiresInitialTrim) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        {Platform.OS === 'android' ? (
          <StatusBar
            translucent={false}
            backgroundColor={palette.background}
            barStyle={dark ? 'light-content' : 'dark-content'}
          />
        ) : null}

        <View style={styles.trimGateContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

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

        {isCropStep ? (
          <TouchableOpacity
            style={[
              styles.doneButton,
              {
                backgroundColor: palette.primary,
                opacity: loading || isPreparingVideo || !hasVideo ? 0.7 : 1,
              },
            ]}
            onPress={handleCropDonePress}
            disabled={loading || isPreparingVideo || !hasVideo}
          >
            {loading ? (
              <ActivityIndicator color={palette.textPrimary} size="small" />
            ) : (
              <Text style={[styles.doneText, { color: palette.textPrimary }]}>Done</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRightSpacer} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.editorContent}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.previewContainer}>
          <GestureDetector gesture={cropGesture}>
            <View
              style={[styles.previewStage, { backgroundColor: palette.previewBackground }]}
              onLayout={handlePreviewLayout}
            >
              {hasVideo ? (
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
                        displayedFrame
                          ? {
                              left: displayedFrame.x - cropFrame.x,
                              top: displayedFrame.y - cropFrame.y,
                              width: displayedFrame.width,
                              height: displayedFrame.height,
                            }
                          : {
                              left: 0,
                              top: 0,
                              width: cropFrame.width,
                              height: cropFrame.height,
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
                        borderColor: palette.accent,
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

        <View style={[styles.toolsSection, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
          {requiresTrim ? (
            <View
              style={[
                styles.statusCard,
                { backgroundColor: palette.cardBackground, borderColor: palette.warning },
              ]}
            >
              <Text style={[styles.statusBody, { color: palette.warning }]}>
                {isCropStep
                  ? 'This clip is longer than 60 seconds. Trim it before continuing.'
                  : 'This clip is longer than 60 seconds. Trim it before posting.'}
              </Text>
              {isCropStep ? (
                <TouchableOpacity
                  style={[styles.trimActionButton, { backgroundColor: palette.warning }]}
                  onPress={handleTrimPress}
                  disabled={!hasVideo}
                >
                  <Text style={styles.trimActionButtonText}>Trim Video</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {isCropStep ? (
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
                      setShouldInferRatioOnLoad(false);
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
          ) : (
            <>
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

              <TouchableOpacity
                style={[
                  styles.confirmCropButton,
                  {
                    backgroundColor: palette.accent,
                    opacity: loading || isPreparingVideo || requiresTrim || !hasVideo ? 0.7 : 1,
                  },
                ]}
                onPress={handlePostPress}
                disabled={loading || isPreparingVideo || requiresTrim || !hasVideo}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.confirmCropText}>Post</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    editorContent: {
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
    headerRightSpacer: {
      width: 84,
    },
    trimGateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    trimActionButton: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    trimActionButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700',
    },
    ratioRow: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
      justifyContent: 'center',
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
      justifyContent: 'center',
      alignSelf: 'center',
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
