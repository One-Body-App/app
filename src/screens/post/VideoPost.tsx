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
import { useSelector } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';
import { useToast } from 'react-native-toast-notifications';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  Asset,
  ImageLibraryOptions,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import VideoTrim, { isValidFile, showEditor } from 'react-native-video-trim';

import CameraComponent from '@/src/components/VideoPost/Camera';
import CustomVideo from '@/src/components/CustomVideo';
import { MainStackParamList } from '@/src/navigator/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import { formatAspectRatioLabel, getVideoFitSize, isSuccessfulStatus } from './videoPostUtils';

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
  trimTrack: string;
  trimFrame: string;
  overlay: string;
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
  trimTrack: '#355963',
  trimFrame: '#68828a',
  overlay: 'rgba(0,0,0,0.35)',
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
  trimTrack: '#e6eaec',
  trimFrame: '#c6d2d6',
  overlay: 'rgba(0,0,0,0.25)',
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

const ensureFileUri = (value?: string | null) => {
  if (!value) {
    return '';
  }
  if (value.startsWith('file://') || value.startsWith('content://')) {
    return value;
  }
  return `file://${value}`;
};

export default function VideoPost({ navigation, route }: Props) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const toast = useToast();
  const { dark } = useTheme();

  const palette = dark ? DARK_PALETTE : LIGHT_PALETTE;
  const styles = useMemo(() => createStyles(), []);

  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [videoPath, setVideoPath] = useState('');
  const [uploadedMuxId, setUploadedMuxId] = useState('');
  const [uploadedVideoPath, setUploadedVideoPath] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [caption, setCaption] = useState('');
  const [previewAspectRatio, setPreviewAspectRatio] = useState(16 / 9);
  const [videoNaturalSize, setVideoNaturalSize] = useState<{ width?: number; height?: number }>({});
  const [previewContainerSize, setPreviewContainerSize] = useState({ width: 1, height: 1 });
  const [isPreparingVideo, setIsPreparingVideo] = useState(false);
  const [isLiveCameraVisible, setIsLiveCameraVisible] = useState(false);
  const listenerSubscription = useRef<Record<string, EventSubscription>>({});
  const hasAutoOpenedCameraRef = useRef(false);
  const latestUploadRequestRef = useRef(0);

  const formatTime = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const mins = Math.floor(safeSeconds / 60);
    const secs = Math.floor(safeSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const applySelectedVideo = useCallback((nextPath: string) => {
    setVideoPath(nextPath);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    setPreviewAspectRatio(16 / 9);
    setVideoNaturalSize({});
  }, []);

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

  const getTrimEditorPath = useCallback((rawPath: string) => {
    if (Platform.OS === 'android' && rawPath.startsWith('file://')) {
      return rawPath.replace('file://', '');
    }
    return rawPath;
  }, []);

  const uploadVideoToMux = useCallback(async (uploadUrl: string, sourcePath: string) => {
    if (Platform.OS === 'ios' || sourcePath.startsWith('content://')) {
      const response = await fetch(sourcePath, { method: 'GET' });
      const blob = await response.blob();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'content-type': blob.type || 'video/mp4' },
      });
      if (!isSuccessfulStatus(uploadResponse.status)) {
        throw new Error(`Video upload failed (${uploadResponse.status}).`);
      }
      return;
    }

    const sanitizedPath = sourcePath.replace('file://', '');
    const uploadResponse = await RNFetchBlob.fetch(
      'PUT',
      uploadUrl,
      undefined,
      RNFetchBlob.wrap(sanitizedPath)
    );
    const { status } = uploadResponse.info();
    if (!isSuccessfulStatus(status)) {
      throw new Error(`Video upload failed (${status}).`);
    }
  }, []);

  const uploadVideoAndCache = useCallback(
    async (sourcePath: string) => {
      const uploadLink = await ApiCall<{
        url?: string;
        id?: string;
        message?: string;
      }>({
        route: 'watch/authenticated-link/mux',
        verb: 'get',
        token,
      });

      if (uploadLink.status !== 200 || !uploadLink?.response?.url || !uploadLink?.response?.id) {
        const message =
          typeof uploadLink?.response?.message === 'string'
            ? uploadLink.response.message
            : 'Unable to initialize video upload. Please try again.';
        throw new Error(message);
      }

      await uploadVideoToMux(uploadLink.response.url, sourcePath);
      return uploadLink.response.id;
    },
    [token, uploadVideoToMux]
  );

  const prepareVideoForEditor = useCallback(
    async (nextPath: string, sourceName = 'video') => {
      setIsPreparingVideo(true);
      const requestId = ++latestUploadRequestRef.current;
      try {
        const uploadId = await uploadVideoAndCache(nextPath);
        if (latestUploadRequestRef.current !== requestId) {
          return;
        }
        setUploadedMuxId(uploadId);
        setUploadedVideoPath(nextPath);
        applySelectedVideo(nextPath);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : `Unable to upload selected ${sourceName}.`;
        toast.show(message, { type: 'danger' });
      } finally {
        if (latestUploadRequestRef.current === requestId) {
          setIsPreparingVideo(false);
        }
      }
    },
    [applySelectedVideo, toast, uploadVideoAndCache]
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
          setIsPreparingVideo(false);
          return;
        }
        await prepareVideoForEditor(nextPath, sourceName);
      } catch (error) {
        toast.show(`Unable to prepare selected ${sourceName}.`, { type: 'danger' });
        setIsPreparingVideo(false);
      }
    },
    [prepareVideoForEditor, resolveVideoUri, toast]
  );

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleTogglePlayback = () => {
    if (!videoPath) {
      return;
    }
    setIsPlaying((previous) => !previous);
  };

  const handleToggleMute = () => {
    setIsMuted((previous) => !previous);
  };

  const handleTrimPress = () => {
    if (!videoPath) {
      toast.show('Please select or record a video first.', { type: 'danger' });
      return;
    }

    const editorPath = getTrimEditorPath(videoPath);
    if (!editorPath) {
      toast.show('Unable to open trim editor.', { type: 'danger' });
      return;
    }

    try {
      isValidFile(editorPath || 'xxxx');
      showEditor(editorPath, {
        saveToPhoto: false,
        enableSaveDialog: false,
        alertOnFailToLoad: true,
        alertOnFailMessage: 'Failed to load video',
        alertOnFailTitle: 'Error',
        maxDuration: 60,
        cancelDialogMessage: 'Are you sure you want to delete this?',
        cancelDialogConfirmText: 'Delete',
      });
    } catch (error) {
      toast.show('Unable to open trim editor.', { type: 'danger' });
    }
  };

  const handleAddMusicPress = () => {
    toast.show('Add Music is not connected yet.', { type: 'normal' });
  };

  const handleAddTextPress = () => {
    toast.show('Add Text is not connected yet.', { type: 'normal' });
  };

  const handleVideoLoad = (data: any) => {
    const videoDuration = Number(data?.duration || 0);
    setDuration(videoDuration);

    if (videoDuration > 60) {
      toast.show('Videos must be 60 seconds or less.', { type: 'danger' });
    }

    const rawWidth = Number(data?.naturalSize?.width);
    const rawHeight = Number(data?.naturalSize?.height);
    if (Number.isFinite(rawWidth) && Number.isFinite(rawHeight) && rawWidth > 0 && rawHeight > 0) {
      setVideoNaturalSize({ width: rawWidth, height: rawHeight });
      setPreviewAspectRatio(rawWidth / rawHeight);
    }
  };

  const handlePreviewLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setPreviewContainerSize({ width, height });
    }
  };

  const handleSelectFromLibrary = async () => {
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
  };

  const handleRecordNewVideo = async () => {
    setIsLiveCameraVisible(true);
  };

  const handleVisionCameraVideoPath = useCallback(
    (nextValue: React.SetStateAction<string | undefined>) => {
      const resolvedPath =
        typeof nextValue === 'function'
          ? (nextValue as (previousState: string | undefined) => string | undefined)(
              videoPath || undefined
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
            setIsPreparingVideo(false);
            return;
          }
          await prepareVideoForEditor(preparedPath);
        } catch (error) {
          toast.show('Unable to prepare selected video.', { type: 'danger' });
          setIsPreparingVideo(false);
        }
      })();
    },
    [prepareVideoForEditor, resolveVideoUri, toast, videoPath]
  );

  const handleChooseVideoSource = () => {
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
  };

  const handleDonePress = async () => {
    if (!videoPath) {
      toast.show('Please select or record a video first.', { type: 'danger' });
      return;
    }

    setLoading(true);
    try {
      let finalUploadId = uploadedMuxId;
      if (!finalUploadId || uploadedVideoPath !== videoPath) {
        finalUploadId = await uploadVideoAndCache(videoPath);
        setUploadedMuxId(finalUploadId);
        setUploadedVideoPath(videoPath);
      }

      const result = await ApiCall<{ message?: string }>({
        route: 'watch/post',
        verb: 'post',
        params: {
          uploadId: finalUploadId,
          content: caption.trim(),
        },
        token,
      });

      if (result.status === 200) {
        toast.show('Your video is being processed. It will be public shortly!', {
          type: 'success',
          placement: 'bottom',
        });
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('MainRoot', {
            screen: 'Main',
            params: { screen: 'HomeTab' },
          });
        }
        return;
      }

      toast.show(result.response?.message || 'Upload failed. Please try again.', {
        type: 'danger',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      toast.show(message, { type: 'danger' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const incomingVideoPath = route.params?.videoPath;
    let isDisposed = false;

    if (!incomingVideoPath) {
      return () => {
        isDisposed = true;
      };
    }

    (async () => {
      setIsPreparingVideo(true);
      try {
        const resolvedPath = await resolveVideoUri(undefined, incomingVideoPath);
        if (!isDisposed && resolvedPath) {
          await prepareVideoForEditor(resolvedPath);
        }
      } catch (error) {
        if (!isDisposed) {
          toast.show('Unable to load selected video.', { type: 'danger' });
          setIsPreparingVideo(false);
        }
      } finally {
        if (!isDisposed) {
          navigation.setParams({ videoPath: undefined });
        }
      }
    })();

    return () => {
      isDisposed = true;
    };
  }, [navigation, prepareVideoForEditor, resolveVideoUri, route.params?.videoPath, toast]);

  useEffect(() => {
    listenerSubscription.current.onFinishTrimming = VideoTrim.onFinishTrimming(
      async ({ outputPath }) => {
        if (!outputPath) {
          return;
        }

        try {
          const resolvedPath = await resolveVideoUri(undefined, outputPath);
          if (resolvedPath) {
            await prepareVideoForEditor(resolvedPath, 'trimmed video');
          }
        } catch (error) {
          toast.show('Unable to load trimmed video.', { type: 'danger' });
        }
      }
    );

    listenerSubscription.current.onError = VideoTrim.onError(({ message, errorCode }) => {
      console.error('[VideoTrim] Error event:', { message, errorCode });
      toast.show(message || 'Video trim failed.', { type: 'danger' });
    });

    return () => {
      listenerSubscription.current.onFinishTrimming?.remove();
      listenerSubscription.current.onError?.remove();
      listenerSubscription.current = {};
    };
  }, [prepareVideoForEditor, resolveVideoUri, toast]);

  const selectedDuration = Math.min(duration || 0, 60);
  const fittedPreview = getVideoFitSize(
    previewContainerSize.width,
    previewContainerSize.height,
    previewAspectRatio
  );
  const ratioLabel = formatAspectRatioLabel(
    videoNaturalSize.width,
    videoNaturalSize.height,
    previewAspectRatio
  );

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
          style={[styles.doneButton, { backgroundColor: palette.primary }]}
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

      <View style={styles.previewContainer} onLayout={handlePreviewLayout}>
        <View
          style={[
            styles.videoWrapper,
            {
              backgroundColor: palette.previewBackground,
              width: fittedPreview.width,
              height: fittedPreview.height,
            },
          ]}
        >
          {videoPath ? (
            <>
              <CustomVideo
                source={{ uri: videoPath }}
                resizeMode="contain"
                paused={!isPlaying}
                muted={isMuted}
                onLoad={handleVideoLoad}
                onProgress={(data: any) => setCurrentTime(data.currentTime)}
                style={styles.fullSize}
                repeat
              />
              <TouchableOpacity
                style={[
                  styles.playOverlay,
                  { backgroundColor: isPlaying ? 'transparent' : palette.overlay },
                ]}
                activeOpacity={0.8}
                onPress={handleTogglePlayback}
              >
                {!isPlaying ? (
                  <View style={styles.playIconWrapper}>
                    <MaterialIcons name="play-arrow" size={40} color={palette.textPrimary} />
                  </View>
                ) : null}
              </TouchableOpacity>
              <View style={styles.timeBadge}>
                <Text style={[styles.timeText, { color: '#f6f6f7' }]}>
                  {formatTime(currentTime)} / {formatTime(duration)}
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

        <TouchableOpacity style={styles.trimmerBlock} onPress={handleTrimPress} activeOpacity={0.8}>
          <View style={styles.trimmerHeader}>
            <Text style={[styles.trimmerTitle, { color: palette.textMuted }]}>TRIM VIDEO</Text>
            <Text style={[styles.trimmerSelectedText, { color: palette.primary }]}>
              {formatTime(selectedDuration)} selected • {ratioLabel}
            </Text>
          </View>
          <Text style={[styles.trimmerHelperText, { color: palette.textSecondary }]}>
            Opens native trim editor. Max duration remains 60 seconds.
          </Text>
        </TouchableOpacity>

        <View style={styles.actionGrid}>
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
            icon={isMuted ? 'volume-off' : 'volume-up'}
            label={isMuted ? 'Unmute' : 'Mute'}
            onPress={handleToggleMute}
            styles={styles}
            palette={palette}
            disabled={!videoPath}
          />
          <ActionButton
            icon="music-note"
            label="Add Music"
            onPress={handleAddMusicPress}
            styles={styles}
            palette={palette}
            disabled={!videoPath}
          />
          <ActionButton
            icon="title"
            label="Add Text"
            onPress={handleAddTextPress}
            styles={styles}
            palette={palette}
            disabled={!videoPath}
          />
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
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 0,
      paddingVertical: 16,
    },
    videoWrapper: {
      width: '100%',
      borderRadius: 0,
      overflow: 'hidden',
    },
    fullSize: {
      width: '100%',
      height: '100%',
    },
    emptyVideoState: {
      minHeight: 220,
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
    timeBadge: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    timeText: {
      fontSize: 12,
      fontWeight: '500',
    },
    toolsSection: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    captionBlock: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 8,
      marginBottom: 16,
    },
    captionLabel: {
      fontSize: 11,
      letterSpacing: 0.6,
      fontWeight: '700',
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    captionInput: {
      minHeight: 76,
      maxHeight: 120,
      fontSize: 14,
      fontWeight: '500',
      padding: 0,
    },
    trimmerBlock: {
      marginBottom: 24,
    },
    trimmerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    trimmerTitle: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
    },
    trimmerSelectedText: {
      fontSize: 12,
      fontWeight: '700',
    },
    trimmerHelperText: {
      fontSize: 12,
      fontWeight: '500',
    },
    actionGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      flexWrap: 'wrap',
    },
    actionButton: {
      alignItems: 'center',
      minWidth: '18%',
      marginBottom: 8,
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
