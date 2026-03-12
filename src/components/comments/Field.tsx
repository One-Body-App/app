import {
  ActionSheetIOS,
  Alert,
  TextInput as RNTextInput,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { CloseCircle, TickCircle } from 'iconsax-react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FastImage from 'react-native-fast-image';
import { GiphyDialog, GiphyMedia, GiphyMediaView } from '@giphy/react-native-sdk';
import { useEffect, useRef, useState } from 'react';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { MainStackParamList } from '@/src/navigator/types';
import GifIcon from '@/components/GifIcon';
import { sanitizeComposerText } from '@/components/composer/composerText';
import {
  createUploadImageRequestId,
  waitForUploadImageResult,
} from '@/src/screens/post/uploadImageBridge';
import StyledText from '../styled/Text';

const extractGifPreviewUrl = (media?: GiphyMedia | null): string | undefined => {
  if (!media || typeof media !== 'object') {
    return undefined;
  }

  const mediaRecord = media as unknown as Record<string, unknown>;
  const directUrl = mediaRecord.url;
  if (typeof directUrl === 'string' && directUrl.startsWith('http')) {
    return directUrl;
  }

  const images = mediaRecord.images as Record<string, unknown> | undefined;
  if (!images || typeof images !== 'object') {
    return undefined;
  }

  const renditionKeys = [
    'original',
    'fixed_width',
    'fixed_height',
    'downsized',
    'preview_gif',
    'fixed_width_small',
  ];
  // eslint-disable-next-line no-restricted-syntax
  for (const renditionKey of renditionKeys) {
    const rendition = images[renditionKey] as Record<string, unknown> | undefined;
    if (!rendition || typeof rendition !== 'object') {
      // eslint-disable-next-line no-continue
      continue;
    }
    const renditionUrl = rendition.url;
    if (typeof renditionUrl === 'string' && renditionUrl.startsWith('http')) {
      return renditionUrl;
    }
  }

  return undefined;
};

const FEED_IMAGE_WIDTH = 1080;
const FEED_IMAGE_HEIGHT = 1350;
const IMAGE_QUALITY = 0.6;
const MEDIA_RADIUS = 12;

interface Props {
  mediaGif: GiphyMedia | null;
  setGif: React.Dispatch<React.SetStateAction<GiphyMedia | null>>;
  publishComment: Function;
  text?: string;
  placeholderText?: string;
  isEditingComment?: boolean;
  setEditingComment?: (status: boolean) => void;
  isFromBottomField?: boolean;
  useBrandDarkTheme?: boolean;
  allowMedia?: boolean;
  allowImageAttachments?: boolean;
  mediaImages?: string[];
  setImages?: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenGifPicker?: () => void;
  replyingToLabel?: string;
  onCancelReply?: () => void;
  focusRequestKey?: number;
}

function CommentField({
  mediaGif,
  setGif,
  publishComment,
  text,
  placeholderText,
  isEditingComment,
  setEditingComment,
  isFromBottomField,
  useBrandDarkTheme,
  allowMedia,
  allowImageAttachments,
  mediaImages,
  setImages,
  onOpenGifPicker,
  replyingToLabel,
  onCancelReply,
  focusRequestKey,
}: Props) {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { dark, colors } = useTheme();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [content, setContent] = useState(text ?? '');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const inputRef = useRef<RNTextInput | null>(null);
  const InputComponent = isFromBottomField ? BottomSheetTextInput : TextInput;
  const gifAspectRatioRaw = mediaGif?.aspectRatio;
  const gifAspectRatio = Number(gifAspectRatioRaw);
  const safeGifAspectRatio =
    Number.isFinite(gifAspectRatio) && gifAspectRatio > 0 ? gifAspectRatio : 1;
  const images = mediaImages ?? [];
  const hasGif = Boolean(mediaGif?.id || mediaGif?.url);
  const gifPreviewUrl = extractGifPreviewUrl(mediaGif);
  const canUseGiphy = allowMedia ?? Platform.OS !== 'android';
  const canUseImages = allowImageAttachments ?? false;
  let composerBackground = '#ffffff';
  let inputBackground = '#f1f3f4';
  let dividerColor = '#e7eaed';
  if (dark && useBrandDarkTheme) {
    composerBackground = colors.card;
    inputBackground = colors.background;
    dividerColor = colors.border;
  } else if (dark) {
    composerBackground = '#1a2c32';
    inputBackground = '#111d21';
    dividerColor = '#22343a';
  }
  const textSecondary = '#4f8596';
  const primary = '#116a88';
  const profileImageUri =
    user?.profileImage && user.profileImage !== '' ? user.profileImage : NO_PROFILE_IMAGE;
  const safeProfileImageUri = profileImageUri || 'https://via.placeholder.com/72';
  const isActionBlocked = isImageUploading || isSubmitting;

  useEffect(() => {
    if (!focusRequestKey || isEditingComment) {
      return () => undefined;
    }

    const timeoutId = setTimeout(() => {
      const input = inputRef.current as unknown as { focus?: () => void } | null;
      input?.focus?.();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [focusRequestKey, isEditingComment]);

  // const onKeyboardWillShow = (e: KeyboardEvent) => {
  //   setKeyboardHeight(e.endCoordinates.height);
  // };

  // const onKeyboardWillHide = () => {
  //   setKeyboardHeight(0);
  // };

  // useEffect(() => {
  //   if (!isEditingComment) {
  //     if (Platform.OS === 'ios') {
  //       // These listeners on ios are a little more snappy but not available on Android
  //       // If you want to use this on Android use keyboardDidShow/Hide
  //       keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', onKeyboardWillShow);
  //       onKeyboardWillHideListener = Keyboard.addListener('keyboardWillHide', onKeyboardWillHide);
  //     }

  //     return () => {
  //       if (Platform.OS === 'ios') {
  //         onKeyboardWillHideListener.remove();
  //         onKeyboardWillHideListener.remove();
  //         // Keyboard.removeAllListeners('keyboardWillShow');

  //         // Keyboard.removeAllListeners('keyboardWillHide');
  //       }
  //     };
  //   }
  // }, []);

  const submitComment = async (value?: string) => {
    if (isSubmittingRef.current || isActionBlocked) {
      return;
    }
    if (value || mediaGif || images.length > 0) {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
        const publishResult = await publishComment(value ?? '');
        if (publishResult) {
          setContent('');
          setGif(null);
          if (setImages) {
            setImages([]);
          }
        }
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  };

  const processSelectedImage = async (selectedItem: any) => {
    if (!selectedItem?.path) {
      return;
    }

    const filePathRaw = selectedItem.path ?? '';
    const fileUriRaw =
      filePathRaw.startsWith('file://') || filePathRaw.startsWith('content://')
        ? filePathRaw
        : `file://${filePathRaw}`;
    const fileNameRaw = selectedItem.filename ?? `image_${Date.now()}.jpg`;
    const fileName = fileNameRaw.toLowerCase().endsWith('.jpg')
      ? fileNameRaw
      : `${fileNameRaw.split('.').slice(0, -1).join('.') || fileNameRaw}.jpg`;
    const requestId = createUploadImageRequestId();
    const resultPromise = waitForUploadImageResult(requestId);

    navigation.navigate('UploadImage', {
      requestId,
      imageUri: fileUriRaw,
      fileName,
      fileSize: typeof selectedItem.size === 'number' ? selectedItem.size : undefined,
      type: 'image/jpeg',
      usageContext: 'comment',
    });

    const result = await resultPromise;
    if (result.status !== 'saved' || !result.uri || !setImages) {
      return;
    }

    setImages((previous) => [...previous, result.uri]);
  };

  const chooseImageGallery = async () => {
    if (!token || !canUseImages || !setImages || isImageUploading || isSubmittingRef.current) {
      return;
    }
    setIsImageUploading(true);
    try {
      const pickerSelection = await ImagePicker.openPicker({
        multiple: false,
        mediaType: 'photo',
        compressImageQuality: IMAGE_QUALITY,
        compressImageMaxWidth: FEED_IMAGE_WIDTH,
        compressImageMaxHeight: FEED_IMAGE_HEIGHT,
        forceJpg: true,
      }).catch(() => null);

      const selectedItem = Array.isArray(pickerSelection) ? pickerSelection[0] : pickerSelection;
      await processSelectedImage(selectedItem);
    } finally {
      setIsImageUploading(false);
    }
  };

  const captureImage = async () => {
    if (!token || !canUseImages || !setImages || isImageUploading || isSubmittingRef.current) {
      return;
    }
    setIsImageUploading(true);
    try {
      const selectedItem = await ImagePicker.openCamera({
        mediaType: 'photo',
        compressImageQuality: IMAGE_QUALITY,
        compressImageMaxWidth: FEED_IMAGE_WIDTH,
        compressImageMaxHeight: FEED_IMAGE_HEIGHT,
        forceJpg: true,
      }).catch(() => null);

      await processSelectedImage(selectedItem);
    } finally {
      setIsImageUploading(false);
    }
  };

  const chooseImageSource = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose From Gallery', 'Open Camera'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            chooseImageGallery().catch(() => undefined);
          }
          if (buttonIndex === 2) {
            captureImage().catch(() => undefined);
          }
        }
      );
      return;
    }
    Alert.alert('Add photo', 'Select image source', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Choose From Gallery',
        onPress: () => {
          chooseImageGallery().catch(() => undefined);
        },
      },
      {
        text: 'Open Camera',
        onPress: () => {
          captureImage().catch(() => undefined);
        },
      },
    ]);
  };

  // const { shouldHandleKeyboardEvents } = useBottomSheetInternal();

  // useEffect(() => {
  //   return () => {
  //     // Reset the flag on unmount
  //     shouldHandleKeyboardEvents.value = false;
  //   };
  // }, [shouldHandleKeyboardEvents]);

  // // #region callbacks
  // const handleOnFocus = useCallback(() => {
  //   shouldHandleKeyboardEvents.value = true;
  // }, [shouldHandleKeyboardEvents]);
  // const handleOnBlur = useCallback(() => {
  //   console.log(shouldHandleKeyboardEvents);
  //   shouldHandleKeyboardEvents.value = false;
  // }, [shouldHandleKeyboardEvents]);
  // // #endregion

  return (
    <>
      <View
        style={{
          backgroundColor: composerBackground,
          borderTopWidth: 1,
          borderTopColor: dividerColor,
          paddingHorizontal: spacing.x16,
          paddingTop: spacing.x16,
          paddingBottom: spacing.x20,
        }}
      >
        {replyingToLabel && !isEditingComment ? (
          <View
            style={{
              marginBottom: spacing.x10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <StyledText style={{ color: textSecondary, fontSize: 12, fontWeight: '700' }}>
              {replyingToLabel}
            </StyledText>
            {onCancelReply ? (
              <TouchableOpacity onPress={onCancelReply}>
                <CloseCircle color={primary} size={18} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.x10 }}>
          <FastImage
            source={{ uri: safeProfileImageUri }}
            style={{ width: 36, height: 36, borderRadius: borderRadius.max }}
          />
          <View style={{ flex: 1, position: 'relative' }}>
            <InputComponent
              ref={inputRef as any}
              placeholder={
                isEditingComment ? 'Edit comment...' : (placeholderText ?? 'Add a comment...')
              }
              multiline
              value={content}
              onChangeText={(value: string) => {
                setContent(sanitizeComposerText(value, 2000));
              }}
              placeholderTextColor={textSecondary}
              selectionColor={primary}
              cursorColor={primary}
              onSubmitEditing={() => {
                submitComment(content).catch(() => undefined);
              }}
              style={{
                width: '100%',
                minHeight: 50,
                maxHeight: 120,
                color: dark ? '#ffffff' : '#0e181b',
                backgroundColor: inputBackground,
                borderRadius: borderRadius.max,
                paddingVertical: spacing.x16,
                paddingHorizontal: spacing.x16,
                paddingRight: spacing.x32,
                textAlignVertical: 'center',
                fontSize: 13,
              }}
            />
            <View
              style={{
                position: 'absolute',
                right: spacing.x10,
                top: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.x10,
              }}
            >
              {canUseImages ? (
                <TouchableOpacity
                  onPress={chooseImageSource}
                  disabled={isActionBlocked}
                  style={{ opacity: isActionBlocked ? 0.5 : 1 }}
                >
                  <MaterialCommunityIcons name="image-outline" size={20} color={textSecondary} />
                </TouchableOpacity>
              ) : null}
              {canUseGiphy ? (
                <TouchableOpacity
                  onPress={() => {
                    if (isActionBlocked) {
                      return;
                    }
                    if (onOpenGifPicker) {
                      onOpenGifPicker();
                      return;
                    }
                    try {
                      GiphyDialog.show();
                    } catch (e) {
                      console.log(e);
                    }
                  }}
                >
                  <GifIcon size={20} color={textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {isEditingComment ? (
            <View style={{ flexDirection: 'row', gap: spacing.x8 }}>
              <TouchableOpacity
                disabled={isActionBlocked}
                onPress={() => {
                  submitComment(content).catch(() => undefined);
                }}
                style={{ opacity: isActionBlocked ? 0.5 : 1 }}
              >
                <TickCircle color={primary} size={22} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (setEditingComment) setEditingComment(false);
                }}
              >
                <CloseCircle color={primary} size={22} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              disabled={isActionBlocked}
              onPress={() => {
                submitComment(content).catch(() => undefined);
              }}
              style={{ opacity: isActionBlocked ? 0.5 : 1 }}
            >
              <StyledText style={{ color: primary, fontWeight: '700', fontSize: 14 }}>
                Post
              </StyledText>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {canUseImages && images.length > 0 ? (
        <ScrollView
          horizontal
          style={{
            height: 100,
            backgroundColor: isEditingComment ? undefined : Colors.neutral[800],
          }}
        >
          {images.map((imageUrl, index) => (
            <View
              key={imageUrl}
              style={{
                padding: 10,
                width: 120,
                borderRadius: MEDIA_RADIUS,
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.primarySapphire.brand,
                  borderRadius: borderRadius.max,
                  position: 'absolute',
                  width: 28,
                  height: 28,
                  top: 4,
                  right: 4,
                  zIndex: 10,
                }}
                onPress={() => {
                  if (setImages) {
                    setImages(images.filter((_, imageIndex) => imageIndex !== index));
                  }
                }}
              >
                <CloseCircle size={28} color="#fff" />
              </TouchableOpacity>
              <View
                style={{
                  width: 100,
                  height: 80,
                  borderRadius: MEDIA_RADIUS,
                  overflow: 'hidden',
                }}
              >
                <FastImage
                  source={{ uri: imageUrl }}
                  resizeMode="contain"
                  style={{
                    width: 100,
                    height: 80,
                    borderRadius: MEDIA_RADIUS,
                  }}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
      {mediaGif && hasGif && canUseGiphy ? (
        <ScrollView
          style={{
            height: 100,
            backgroundColor: isEditingComment ? undefined : Colors.neutral[800],
          }}
        >
          <View
            style={{
              padding: 10,
              width: 100,
              borderRadius: MEDIA_RADIUS,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: Colors.primarySapphire.brand,
                borderRadius: borderRadius.max,
                position: 'absolute',
                width: 30,
                height: 30,
                top: 0,
                right: 0,
                zIndex: 10,
              }}
              onPress={() => {
                setGif(null);
              }}
            >
              <CloseCircle size={30} color="#fff" />
            </TouchableOpacity>
            {Platform.OS === 'android' && gifPreviewUrl ? (
              <FastImage
                source={{ uri: gifPreviewUrl }}
                resizeMode="contain"
                style={{
                  width: 100,
                  aspectRatio: safeGifAspectRatio,
                  borderRadius: MEDIA_RADIUS,
                }}
              />
            ) : (
              <GiphyMediaView
                media={mediaGif}
                resizeMode="contain"
                style={{
                  aspectRatio: safeGifAspectRatio,
                  borderRadius: MEDIA_RADIUS,

                  overflow: 'hidden',
                }}
              />
            )}
          </View>
        </ScrollView>
      ) : null}
    </>
  );
}

export default CommentField;
