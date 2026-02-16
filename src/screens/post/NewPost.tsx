import { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { CloseCircle, Location as LocationIcon } from 'iconsax-react-native';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import ImagePicker from 'react-native-image-crop-picker';
import { Asset, CameraOptions, MediaType, launchCamera } from 'react-native-image-picker';
import { serialize } from 'object-to-formdata';
import FastImage from 'react-native-fast-image';
import {
  GiphyDialog,
  type GiphyMedia,
  GiphyDialogMediaSelectEventHandler,
  GiphyDialogEvent,
  GiphyMediaView,
  GiphyThemePreset,
} from '@giphy/react-native-sdk';
import EmojiPicker, { EmojiType } from 'rn-emoji-keyboard';
import { isArray } from 'lodash';
import { useToast } from 'react-native-toast-notifications';
import RNFS from 'react-native-fs';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import Button from '@/components/Button';
import MapBox, { MapSuggestion } from '@/components/MapBox';
import StyledText from '@/components/styled/Text';
import StyledTextInput from '@/components/styled/TextInput';
import { MainStackParamList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { fontSize, lineHeight } from '@/src/styles/typography';

import { requestExternalWritePermission } from '@/utils/ImageAndCamera';
import ErrorBoundary from '@/src/components/ErrorBoundry';
import {
  createUploadImageRequestId,
  waitForUploadImageResult,
} from '@/src/screens/post/uploadImageBridge';

type Props = StackScreenProps<MainStackParamList, 'Post'>;
type AttachmentMode = 'link' | 'document' | null;
type LinkAttachment = {
  id: string;
  url: string;
  type: 'link' | 'document';
};
type ProfileSummary = {
  _id?: string;
  id?: string;
  userId?: string;
  profileImage?: string;
  profile_image?: string;
  name?: string;
};

function NewPost({ navigation, route }: Props) {
  const MAX_CONTENT_LENGHT = 300;
  const FEED_IMAGE_WIDTH = 1080;
  const FEED_IMAGE_HEIGHT = 1350;
  const IMAGE_QUALITY = 0.6;
  const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mediaGif, setGif] = useState<GiphyMedia | null>(null);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector((state: RootState) => state.auth.getProfileData) as
    | ProfileSummary
    | undefined;

  const [location, setLocation] = useState<MapSuggestion | null>(null);
  const [locationSelector, setLocationSelector] = useState<boolean>(false);
  const [imagesToUpload, setImagesToUpload] = useState<Asset[]>([]);
  const { colors, dark } = useTheme();
  const [imagesObject, setImagesObject] = useState<string[]>([]);
  const [linkAttachments, setLinkAttachments] = useState<LinkAttachment[]>([]);
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>(null);
  const [attachmentInput, setAttachmentInput] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const toast = useToast();
  const [uploadImagesObject, setUploadImagesObject] =
    useState<{ uri: string; type: string; name?: string }[]>();
  const [isGiphyInitialized, setIsGiphyInitialized] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return undefined;
      }
      StatusBar.setBarStyle(dark ? 'light-content' : 'dark-content');
      StatusBar.setBackgroundColor(colors.background);
      StatusBar.setTranslucent(false);
      return undefined;
    }, [colors.background, dark])
  );

  const ensureGiphyInitialized = useCallback(() => {
    if (isGiphyInitialized) {
      return true;
    }
    try {
      GiphyDialog.configure({ theme: GiphyThemePreset.Automatic });
      setIsGiphyInitialized(true);
      return true;
    } catch (error) {
      console.warn('Giphy initialization failed', error);
      toast.show('GIF feature is temporarily unavailable.', {
        type: 'danger',
        placement: 'bottom',
      });
      return false;
    }
  }, [isGiphyInitialized, toast]);

  useEffect(() => {
    if (!isGiphyInitialized) {
      return undefined;
    }
    const handler: GiphyDialogMediaSelectEventHandler = (e) => {
      setGif(e.media);
      GiphyDialog.hide();
    };
    let listener: { remove: () => void } | null = null;
    try {
      listener = GiphyDialog.addListener(GiphyDialogEvent.MediaSelected, handler);
    } catch (error) {
      console.warn('GiphyDialog listener setup failed', error);
    }
    return () => {
      listener?.remove();
    };
  }, [isGiphyInitialized]);

  const openUploadImageEditor = useCallback(
    async (asset: { uri: string; fileName?: string; fileSize?: number; type?: string }) => {
      if (!asset.uri) {
        return;
      }

      if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_UPLOAD_BYTES) {
        toast.show('Image is larger than 50MB. Please choose a smaller image.', {
          type: 'danger',
          placement: 'bottom',
        });
        return;
      }

      const normalizedUri =
        asset.uri.startsWith('file://') ||
        asset.uri.startsWith('content://') ||
        asset.uri.startsWith('ph://')
          ? asset.uri
          : `file://${asset.uri}`;
      let editorUri = normalizedUri;
      if (Platform.OS === 'android' && normalizedUri.startsWith('content://')) {
        const cachedPath = `${RNFS.CachesDirectoryPath}/onebody_editor_source_${Date.now()}_${Math.round(
          Math.random() * 1000
        )}.jpg`;
        try {
          await RNFS.copyFile(normalizedUri, cachedPath);
          editorUri = `file://${cachedPath}`;
        } catch (error) {
          editorUri = normalizedUri;
        }
      }
      const requestId = createUploadImageRequestId();
      const resultPromise = waitForUploadImageResult(requestId);

      navigation.navigate('UploadImage', {
        requestId,
        imageUri: editorUri,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        type: asset.type ?? 'image/jpeg',
        usageContext: 'feed',
      });

      const result = await resultPromise;
      if (result.status !== 'saved' || !result.uri) {
        return;
      }

      setImagesToUpload((previous) => [
        ...previous,
        {
          uri: result.uri,
          fileName: result.fileName,
          type: result.type ?? 'image/jpeg',
          fileSize: result.fileSize,
        },
      ]);
      setUploadImagesObject((previous) => [
        ...(previous ?? []),
        {
          uri: result.uri,
          type: result.type ?? 'image/jpeg',
          name: result.fileName,
        },
      ]);
    },
    [MAX_UPLOAD_BYTES, navigation, toast]
  );

  // useEffect(() => {
  //   if (route.params?.postId) {
  //     getPostSocial();
  //   }
  // }, [route.params?.postId]);

  const editSocial = async () => {
    setIsLoading(true);
    const mergedContent = [content.trim(), ...linkAttachments.map((item) => item.url)]
      .filter((value) => value.length > 0)
      .join('\n\n');
    try {
      const result = await ApiCall({
        route: `social/post/${route.params?.postId}`,
        token,
        params: serialize(
          {
            content: mergedContent,
            images: uploadImagesObject?.length ? uploadImagesObject : imagesObject,
            gif: mediaGif,
            location: location
              ? {
                  coordinates: location?.geometry?.coordinates,
                  name: location?.place_name,
                }
              : undefined,
          },
          {
            noAttributesWithArrayNotation: true,
            noFilesWithArrayNotation: true,
          }
        ),
        verb: 'patch',
        isFormUrlEncode: true,
      });

      setIsLoading(false);

      if (result.status === 200) {
        setContent('');
        navigation.popToTop();
        navigation.navigate('MainRoot', {
          screen: 'Main',
          params: {
            screen: 'MyProfileTab',
          },
        });
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  };

  const postSocial = async () => {
    setIsLoading(true);
    const mergedContent = [content.trim(), ...linkAttachments.map((item) => item.url)]
      .filter((value) => value.length > 0)
      .join('\n\n');

    try {
      const result = await ApiCall({
        route: 'social/post',
        token,
        params: serialize(
          {
            content: mergedContent,
            images: uploadImagesObject?.length ? uploadImagesObject : imagesObject,
            gif: mediaGif,
            location: location
              ? {
                  coordinates: location?.geometry.coordinates,
                  name: location?.place_name,
                }
              : undefined,
          },
          {
            noAttributesWithArrayNotation: true,
            noFilesWithArrayNotation: true,
          }
        ),
        verb: 'post',
        isFormUrlEncode: true,
      });

      setIsLoading(false);

      console.log('postSocial result', result.status, result.response);
      if (result.status === 200) {
        setContent('');
        navigation.popToTop();
        navigation.navigate('MainRoot', {
          screen: 'Main',
          params: {
            screen: 'MyProfileTab',
          },
        });
      } else if (result.status === 413) {
        toast.show('Image too large. Please choose a smaller image.', {
          type: 'danger',
          placement: 'bottom',
        });
      } else {
        console.warn('postSocial non-200', result.status, result.response);
        if (result?.response?.moderationPassed === false) {
          throw result.response;
        }

        throw new Error(result.response);
      }
    } catch (e: any) {
      setIsLoading(false);
      console.warn('postSocial error', e?.response?.status, e?.response?.data || e?.message || e);

      let message = 'There was a problem on our end. Please try again later.';
      if (e?.moderationPassed === false) {
        if (e.moderationTypeFailure === 'image') {
          message = 'Photo violates terms of use ';
        }

        if (e.moderationTypeFailure === 'text') {
          message =
            'This post was screened because it violates our Terms of Use. Please be courteous and thoughtful about what you post. Abuse or profane content is prohibited in the One Body community.';
        }
      } else if (e?.response?.status === 413 || e?.status === 413) {
        message = 'Image too large. Please choose a smaller image.';
      } else if (e.message === 'Network Error') {
        message = 'Network Error. Please try again later.';
      }
      toast.show(message, {
        type: 'danger',
        placement: 'bottom',
      });
    }
  };

  // const getPostSocial = async () => {
  //   setIsLoading(true);
  //   try {
  //     const result = await ApiCall({
  //       route: `social/post/${route.params?.postId}`,
  //       token,

  //       verb: 'get',
  //     });

  //     setIsLoading(false);

  //     if (result.status == 200) {
  //       setContent(result.response.content);
  //       if (result.response?.images?.length > 0) {
  //         setImagesObject(result.response?.images);
  //       }

  //       if (result.response?.gif) {
  //         setGif(result.response.gif);
  //       }

  //       if (!isEmpty(result.response?.location)) {
  //         setLocation(result.response?.location);
  //       }

  //       if (!isEmpty(result.response?.locationName)) {
  //         setLocationName(result.response?.locationName);
  //       }
  //     }
  //   } catch (e) {
  //     setIsLoading(false);
  //   }
  // };

  const chooseImageGallery = async () => {
    const pickerSelection = await ImagePicker.openPicker({
      multiple: true,
      mediaType: 'photo',
      compressImageQuality: IMAGE_QUALITY,
      compressImageMaxWidth: FEED_IMAGE_WIDTH,
      compressImageMaxHeight: FEED_IMAGE_HEIGHT,
      forceJpg: true,
    }).catch(() => {
      return [];
    });

    const pickerResults = Array.isArray(pickerSelection) ? pickerSelection : [pickerSelection];
    const editorAssets = pickerResults
      .filter((item) => !!item?.path)
      .map((item, index) => {
        const imageName = item.filename ?? `image_${Date.now()}_${index}.jpg`;
        const normalizedName = imageName.toLowerCase().endsWith('.jpg')
          ? imageName
          : `${imageName.split('.').slice(0, -1).join('.') || imageName}.jpg`;
        const sourcePath = item.path ?? '';
        const normalizedUri =
          sourcePath.startsWith('file://') || sourcePath.startsWith('content://')
            ? sourcePath
            : `file://${sourcePath}`;
        return {
          uri: normalizedUri,
          fileName: normalizedName,
          fileSize: typeof item.size === 'number' ? item.size : undefined,
          type: 'image/jpeg',
        };
      });

    // eslint-disable-next-line no-restricted-syntax
    for (const editorAsset of editorAssets) {
      // eslint-disable-next-line no-await-in-loop
      await openUploadImageEditor(editorAsset);
    }
  };

  const captureImage = async (contentType: MediaType) => {
    const options: CameraOptions = {
      mediaType: contentType,
      quality: IMAGE_QUALITY,
      maxWidth: FEED_IMAGE_WIDTH,
      maxHeight: FEED_IMAGE_HEIGHT,
      // noData: true,
    };
    // let isCameraPermitted = await requestCameraPermission();
    const isStoragePermitted = await requestExternalWritePermission();
    if (isStoragePermitted) {
      const response = await launchCamera(options);

      if (response.didCancel) {
        console.log('User cancelled camera picker');

        return;
      }
      if (response.errorCode === 'camera_unavailable') {
        console.log('Camera not available on device');

        return;
      }
      if (response.errorCode === 'permission') {
        console.log('Permission not satisfied');

        return;
      }
      if (response.errorCode === 'others') {
        console.log(response.errorMessage);

        return;
      }
      // let uri = response?.assets?.at(0)?.uri ?? '';
      // let type = response?.assets?.at(0)?.type ?? '';
      // let name = response?.assets?.at(0)?.fileName ?? '';

      // setImageObject({ uri, type, name });
      // setImagesToUpload(uri);

      // cropimage(uri);

      if (response?.assets && response.assets.length > 0) {
        const editorAssets = response.assets
          .filter((asset) => !!asset.uri)
          .map((asset, index) => {
            const fileNameRaw = asset.fileName ?? `image_${Date.now()}_${index}.jpg`;
            const fileName = fileNameRaw.toLowerCase().endsWith('.jpg')
              ? fileNameRaw
              : `${fileNameRaw.split('.').slice(0, -1).join('.') || fileNameRaw}.jpg`;
            return {
              uri: asset.uri ?? '',
              fileName,
              type: asset.type ?? 'image/jpeg',
              fileSize: asset.fileSize,
            };
          });
        // eslint-disable-next-line no-restricted-syntax
        for (const editorAsset of editorAssets) {
          // eslint-disable-next-line no-await-in-loop
          await openUploadImageEditor(editorAsset);
        }
      }
    } else {
      // console.log('no ', isCameraPermitted);
    }
  };

  const appendEmoji = (emoji: EmojiType) => {
    setContent((previous) => `${previous}${emoji.emoji}`);
    setIsEmojiPickerOpen(false);
  };

  const normalizeUrl = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return '';
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const addAttachment = () => {
    const normalizedUrl = normalizeUrl(attachmentInput);
    if (!normalizedUrl) {
      return;
    }

    if (attachmentMode === 'document' && !/\.(pdf|txt)(\?.*)?$/i.test(normalizedUrl)) {
      toast.show('Document link must end with .pdf or .txt', {
        type: 'danger',
        placement: 'bottom',
      });
      return;
    }

    if (attachmentMode === 'link' && !/^https?:\/\//i.test(normalizedUrl)) {
      toast.show('Please provide a valid URL.', {
        type: 'danger',
        placement: 'bottom',
      });
      return;
    }

    setLinkAttachments((previous) => {
      if (previous.some((item) => item.url.toLowerCase() === normalizedUrl.toLowerCase())) {
        return previous;
      }
      return [
        ...previous,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: normalizedUrl,
          type: attachmentMode === 'document' ? 'document' : 'link',
        },
      ];
    });
    setAttachmentInput('');
    setAttachmentMode(null);
  };

  const removeAttachment = (id: string) => {
    setLinkAttachments((previous) => previous.filter((item) => item.id !== id));
  };

  const hasUploadData =
    !!location ||
    !!content ||
    linkAttachments.length > 0 ||
    !!uploadImagesObject?.length ||
    imagesObject.length > 0 ||
    !!mediaGif;

  return (
    <ErrorBoundary>
      <SafeAreaView
        style={{
          flex: 1,
          marginHorizontal: spacing.x20,
        }}
      >
        {Platform.OS === 'android' ? (
          <StatusBar
            barStyle={dark ? 'light-content' : 'dark-content'}
            backgroundColor={colors.background}
          />
        ) : null}
        <KeyboardAvoidingView
          style={{
            paddingTop: spacing.x24,
            paddingBottom: spacing.x24,
            flex: 1,
          }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.x20,
            }}
          >
            <TouchableOpacity
              style={{ padding: spacing.x5 }}
              onPress={() => {
                navigation.goBack();
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <StyledText
              style={{
                ...fontSize.x6,
                ...lineHeight.x6,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              Create Post
            </StyledText>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.x13,
                columnGap: spacing.x10,
              }}
            >
              <Image
                source={{
                  uri:
                    userProfile?.profileImage ||
                    userProfile?.profile_image ||
                    'https://cdn.onebodyapp.com/user/no-image.png',
                }}
                style={{
                  height: 40,
                  width: 40,
                  borderRadius: borderRadius.max,
                  backgroundColor: Colors.neutral[700],
                }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.neutral[700],
                  borderRadius: borderRadius.max,
                  paddingHorizontal: spacing.x13,
                  paddingVertical: spacing.x5,
                }}
              >
                <StyledText style={{ color: colors.text, ...fontSize.x3 }}>Public</StyledText>
                <MaterialCommunityIcons
                  name="chevron-down"
                  color={colors.text}
                  size={20}
                  style={{ marginLeft: spacing.x5 }}
                />
              </View>
            </View>

            <View>
              {location ? (
                <View
                  style={{
                    marginVertical: spacing.x16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <LocationIcon
                      color={Colors.primary.brand}
                      style={{ marginRight: spacing.x10 }}
                      size={24}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      flex: 1,
                    }}
                  >
                    <Button
                      text={location?.place_name}
                      onPress={() => setLocationSelector(true)}
                      wrapperViewBtnStyle={{ flex: 1 }}
                    />
                    <Button
                      text=""
                      wrapperBtnStyle={{
                        marginLeft: spacing.x16,
                      }}
                      onPress={() => setLocation(null)}
                      rightIcon={
                        <MaterialCommunityIcons name="window-close" size={20} color={colors.text} />
                      }
                    />
                  </View>
                </View>
              ) : null}

              <StyledTextInput
                inputStyle={{
                  textAlignVertical: 'top',
                  height: 220,
                  flexGrow: 1,
                  color: colors.text,
                  ...fontSize.x6,
                }}
                inputWrapperStyle={{
                  paddingVertical: spacing.x5,
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  borderRadius: borderRadius.base,
                }}
                value={content}
                maxLength={MAX_CONTENT_LENGHT}
                maxLengthErrorMessage="This message exceeds the character limit."
                numberOfLines={4}
                showCharCounter
                multiline
                returnKeyType="default"
                label=""
                autoCorrect
                placeholder="What's on your heart?"
                placeholderTextColor={Colors.neutral[300]}
                // onSubmitEditing={() => inputRefs.password?.current.focus()}
                onChangeText={(value) => {
                  setContent(value);
                }}
              />
              {attachmentMode ? (
                <View
                  style={{
                    marginTop: spacing.x13,
                    padding: spacing.x10,
                    backgroundColor: Colors.neutral[700],
                    borderRadius: borderRadius.base,
                    rowGap: spacing.x8,
                  }}
                >
                  <StyledText style={{ color: colors.text, fontWeight: '600' }}>
                    {attachmentMode === 'document'
                      ? 'Add document link (.pdf or .txt)'
                      : 'Add link'}
                  </StyledText>
                  <StyledTextInput
                    value={attachmentInput}
                    label=""
                    placeholder={
                      attachmentMode === 'document'
                        ? 'https://example.com/file.pdf'
                        : 'https://example.com'
                    }
                    autoCapitalize="none"
                    keyboardType="url"
                    inputWrapperStyle={{
                      backgroundColor: Colors.neutral[600],
                      borderRadius: borderRadius.base,
                    }}
                    onChangeText={setAttachmentInput}
                  />
                  <View style={{ flexDirection: 'row', columnGap: spacing.x8 }}>
                    <Button
                      text="Cancel"
                      wrapperViewBtnStyle={{ flex: 1 }}
                      btnStyle={{ backgroundColor: Colors.neutral[500] }}
                      onPress={() => {
                        setAttachmentMode(null);
                        setAttachmentInput('');
                      }}
                    />
                    <Button
                      text="Add"
                      wrapperViewBtnStyle={{ flex: 1 }}
                      btnStyle={{ backgroundColor: Colors.primarySapphire.brand }}
                      onPress={addAttachment}
                    />
                  </View>
                </View>
              ) : null}

              {imagesToUpload.length > 0 ||
              imagesObject.length > 0 ||
              mediaGif ||
              linkAttachments.length > 0 ? (
                <ScrollView
                  style={{ flexDirection: 'row', gap: spacing.x10, marginTop: spacing.x16 }}
                  horizontal
                  alwaysBounceHorizontal
                  bounces
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled
                >
                  {imagesToUpload &&
                    imagesToUpload.map((image, index) => {
                      const imageKey = `${image.uri}-${image.fileName ?? ''}-${image.fileSize ?? ''}`;
                      return (
                        <View key={imageKey} style={{ padding: 10 }}>
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
                              setImagesToUpload(
                                imagesToUpload.filter((item, filterIndex) => {
                                  return filterIndex !== index;
                                })
                              );
                              setUploadImagesObject(
                                (uploadImagesObject ?? []).filter((item, filterIndex) => {
                                  return filterIndex !== index;
                                })
                              );
                            }}
                          >
                            <CloseCircle size="30" color="#fff" />
                          </TouchableOpacity>
                          <FastImage
                            style={{
                              height: 80,
                              width: 80,
                              borderRadius: borderRadius.base,
                            }}
                            source={{
                              uri: image.uri,
                            }}
                            resizeMode="cover"
                          />
                        </View>
                      );
                    })}

                  {isArray(imagesObject) &&
                    imagesObject?.length > 0 &&
                    imagesObject?.map((image, index) => {
                      return (
                        <View key={image} style={{ padding: 10 }}>
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
                              setImagesObject(
                                imagesObject.filter((item, filterIndex) => {
                                  return filterIndex !== index;
                                })
                              );
                            }}
                          >
                            <CloseCircle size="30" color="#fff" />
                          </TouchableOpacity>
                          <FastImage
                            style={{
                              height: 80,
                              width: 80,
                              borderRadius: borderRadius.base,
                            }}
                            source={{
                              uri: image,
                            }}
                            resizeMode="cover"
                          />
                        </View>
                      );
                    })}

                  {mediaGif && (
                    <View
                      style={{
                        padding: 10,
                        height: 100,
                        width: 100,
                        borderRadius: borderRadius.base,
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
                        <CloseCircle size="30" color="#fff" />
                      </TouchableOpacity>
                      <GiphyMediaView
                        media={mediaGif}
                        resizeMode="cover"
                        style={{
                          aspectRatio: mediaGif.aspectRatio,
                          borderRadius: borderRadius.base,

                          overflow: 'hidden',
                        }}
                      />
                    </View>
                  )}

                  {linkAttachments.map((attachment) => (
                    <View
                      key={attachment.id}
                      style={{
                        padding: 10,
                        width: 150,
                        minHeight: 100,
                        borderRadius: borderRadius.base,
                        backgroundColor: Colors.neutral[700],
                        justifyContent: 'center',
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
                        onPress={() => removeAttachment(attachment.id)}
                      >
                        <CloseCircle size="30" color="#fff" />
                      </TouchableOpacity>
                      <MaterialCommunityIcons
                        name={
                          attachment.type === 'document' ? 'file-document-outline' : 'link-variant'
                        }
                        size={24}
                        color={Colors.primary.brand}
                      />
                      <StyledText
                        numberOfLines={3}
                        style={{ marginTop: spacing.x8, color: colors.text, ...fontSize.x2 }}
                      >
                        {attachment.url}
                      </StyledText>
                    </View>
                  ))}
                </ScrollView>
              ) : null}

              <MapBox
                location={location}
                modalVisible={locationSelector}
                setModalVisible={setLocationSelector}
                setLocation={setLocation}
                modalTitle={
                  <StyledText style={{ fontSize: 18, color: Colors.primary.brand }}>
                    In what{' '}
                    <StyledText
                      style={{ fontSize: 18, color: Colors.primary.brand, fontWeight: 'bold' }}
                    >
                      city
                    </StyledText>{' '}
                    are you located?
                  </StyledText>
                }
              />

              <View
                style={{
                  columnGap: spacing.x16,
                  flexDirection: 'row',
                  paddingVertical: spacing.x13,
                  borderTopWidth: 1,
                  borderTopColor: Colors.neutral[700],
                  marginTop: spacing.x16,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', columnGap: spacing.x16 }}
                >
                  <TouchableOpacity
                    onPress={() => {
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
                              captureImage('photo').catch(() => undefined);
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
                            captureImage('photo').catch(() => undefined);
                          },
                        },
                      ]);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="image-outline"
                      size={26}
                      color={Colors.primary.brand}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (!ensureGiphyInitialized()) {
                        return;
                      }
                      try {
                        GiphyDialog.show();
                      } catch (e) {
                        console.log(e);
                      }
                    }}
                  >
                    <MaterialCommunityIcons
                      name="file-gif-box"
                      size={26}
                      color={Colors.primary.brand}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      navigation.navigate('VideoPost');
                    }}
                  >
                    <MaterialCommunityIcons
                      name="video-outline"
                      size={26}
                      color={Colors.primary.brand}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsEmojiPickerOpen(true);
                      setAttachmentMode(null);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="emoticon-happy-outline"
                      size={26}
                      color={Colors.primary.brand}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setAttachmentMode((previous) =>
                        previous === 'document' ? null : 'document'
                      );
                      setIsEmojiPickerOpen(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={26}
                      color={Colors.primary.brand}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setAttachmentMode((previous) => (previous === 'link' ? null : 'link'));
                      setIsEmojiPickerOpen(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="link-variant"
                      size={26}
                      color={Colors.primary.brand}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setLocationSelector(true);
                  }}
                >
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={24}
                    color={location ? Colors.primary.brand : Colors.neutral[300]}
                  />
                </TouchableOpacity>
              </View>
              <Button
                disabled={
                  isLoading || !hasUploadData || (!!content && content.length > MAX_CONTENT_LENGHT)
                }
                onPress={() => {
                  if (route.params?.postId) {
                    editSocial();
                  } else {
                    postSocial();
                  }
                }}
                btnStyle={[
                  button.primary,
                  {
                    borderRadius: borderRadius.max,
                    minHeight: 52,
                    width: '100%',
                  },
                ]}
                disabledBtnStyle={[button.primary, { opacity: 0.5, minHeight: 52, width: '100%' }]}
                wrapperViewBtnStyle={{
                  width: '100%',
                  marginTop: spacing.x32,
                  marginBottom: spacing.x48,
                }}
                disabledBtnTextStyle={{}}
                content={
                  // eslint-disable-next-line react/jsx-no-useless-fragment
                  <>
                    {isLoading ? (
                      <ActivityIndicator />
                    ) : (
                      <StyledText style={{ color: 'white' }}>
                        {route.params?.postId ? 'Update Post' : 'Post'}
                      </StyledText>
                    )}
                  </>
                }
              />
            </View>
          </ScrollView>
          <EmojiPicker
            open={isEmojiPickerOpen}
            onClose={() => setIsEmojiPickerOpen(false)}
            onEmojiSelected={appendEmoji}
            enableRecentlyUsed
            enableSearchBar
            categoryPosition="bottom"
            theme={{
              backdrop: dark ? 'rgba(5,10,14,0.58)' : 'rgba(0,0,0,0.3)',
              container: colors.card,
              header: colors.text,
              knob: Colors.neutral[400],
              category: {
                icon: Colors.neutral[400],
                iconActive: Colors.primarySapphire.brand,
                container: colors.card,
                containerActive: Colors.neutral[700],
              },
              search: {
                background: Colors.neutral[700],
                text: colors.text,
                placeholder: Colors.neutral[400],
                icon: Colors.neutral[400],
              },
              customButton: {
                background: Colors.neutral[700],
                backgroundPressed: Colors.neutral[600],
                icon: Colors.primarySapphire.brand,
                iconPressed: Colors.primarySapphire.brand,
              },
              emoji: {
                selected: Colors.neutral[700],
              },
              skinTonesContainer: colors.card,
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

export default NewPost;
