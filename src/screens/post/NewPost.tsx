import { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useRef, useState } from 'react';
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
import { CommonActions, useFocusEffect, useTheme } from '@react-navigation/native';
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
import useMountEffect from '@/src/hooks/useMountEffect';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import Button from '@/components/Button';
import GifIcon from '@/components/GifIcon';
import MapBox, { MapSuggestion } from '@/components/MapBox';
import { sanitizeComposerText } from '@/components/composer/composerText';
import { MentionInput, useMentionComposer, useMentionSuggestions } from '@/components/mentions';
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
import {
  CLIENT_IMAGE_MAX_HEIGHT,
  CLIENT_IMAGE_MAX_WIDTH,
  CLIENT_IMAGE_PICKER_QUALITY,
} from '@/src/screens/post/uploadImageConfig';
import { extractExifOrientation } from '@/src/screens/post/uploadImageOrientation';
import {
  buildImageDataUri,
  buildPendingModerationReviewPayload,
  callBackendFallbackModeration,
  moderateClientImages,
  moderateClientText,
} from '@/src/services/moderation/clientModeration';
import { queueTaggedNotificationDemo } from '@/src/services/notification/taggedNotificationDispatch';
import type { ModerationReviewCheckPayload } from '@/src/services/moderation/types';
import { buildCreateSocialPostRequest } from './createSocialPostRequest';

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

const TEXT_MODERATION_BLOCK_MESSAGE =
  'This post was screened because it violates our Terms of Use. Please be courteous and thoughtful about what you post. Abuse or profane content is prohibited in the One Body community.';
const IMAGE_MODERATION_BLOCK_MESSAGE = 'Photo violates terms of use ';
const FALLBACK_FLAGGED_MESSAGE = 'Your post was submitted for review.';

function NewPost({ navigation, route }: Props) {
  const MAX_CONTENT_LENGHT = 300;
  const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
  const ACTION_BAR_ICON_SIZE = 36;
  const MEDIA_RADIUS = 12;
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
  const giphyListenerRef = useRef<{ remove: () => void } | null>(null);
  const postInputRef = useRef<any>(null);
  const repostDraft = route.params?.repostDraft;
  const isQuoteMode = Boolean(repostDraft && !route.params?.postId);
  const quoteSourceTitle =
    repostDraft?.sourcePreview?.title ||
    repostDraft?.sourcePreview?.content ||
    repostDraft?.sourcePreview?.link ||
    '';
  const mentionComposer = useMentionComposer({
    initialText: '',
    sanitizeText: (value) => sanitizeComposerText(value, MAX_CONTENT_LENGHT),
  });
  const {
    suggestions,
    isLoading: isMentionLoading,
    isError: isMentionError,
  } = useMentionSuggestions({
    query: mentionComposer.activeMention?.query ?? '',
    token,
    limit: 8,
    excludedUserIds: mentionComposer.mentionedUserIds,
    enabled: Boolean(mentionComposer.activeMention?.query),
  });
  const content = mentionComposer.text;
  const setContent = mentionComposer.setText;
  const currentActorId = String(
    userProfile?._id ?? userProfile?.id ?? userProfile?.userId ?? ''
  ).trim();

  const dispatchTaggedNotification = useCallback(
    (payload: { postId: string; postType: 'social' | 'comment'; commentId?: string }) => {
      if (!currentActorId || mentionComposer.mentionedUserIds.length < 1 || !payload.postId) {
        return;
      }

      queueTaggedNotificationDemo({
        notificationType: 'tagged',
        actorId: currentActorId,
        postId: payload.postId,
        postType: payload.postType,
        taggedUserIds: mentionComposer.mentionedUserIds,
        commentId: payload.commentId,
      }).catch(() => undefined);
    },
    [currentActorId, mentionComposer.mentionedUserIds]
  );

  const runTextModeration = useCallback(
    async (value: string) => {
      const normalizedValue = value.trim();
      if (!normalizedValue) {
        return { blocked: false } as const;
      }

      const result = await moderateClientText(normalizedValue);
      if (result.action === 'block') {
        toast.show(TEXT_MODERATION_BLOCK_MESSAGE, {
          type: 'danger',
          placement: 'bottom',
        });
        return { blocked: true } as const;
      }

      if (result.action === 'fallback') {
        try {
          const fallbackResponse = await callBackendFallbackModeration({
            type: 'text',
            content: normalizedValue,
            clientMetadata: {
              source: result.source,
              scores: result.scores,
              reason: result.reason,
              model: result.model,
            },
          });

          if (fallbackResponse.finalAction === 'flag_for_admin_review') {
            return {
              blocked: false,
              pendingReviewCheck: {
                type: 'text',
                clientSource: result.source,
                clientScores: result.scores,
                clientReason: result.reason,
                clientModel: result.model,
                fallbackAction: fallbackResponse.finalAction,
                fallbackProvider: fallbackResponse.provider,
                fallbackFlagged: fallbackResponse.flagged,
                fallbackModel: fallbackResponse.model,
                fallbackResults: fallbackResponse.results,
              } satisfies ModerationReviewCheckPayload,
            } as const;
          }
        } catch (error) {
          toast.show('Unable to complete moderation right now. Please try again.', {
            type: 'danger',
            placement: 'bottom',
          });
          return { blocked: true } as const;
        }
      }

      return { blocked: false } as const;
    },
    [toast]
  );

  const runImageModeration = useCallback(
    async (uris: string[]) => {
      const normalizedUris = uris.map((uri) => String(uri ?? '').trim()).filter(Boolean);
      if (normalizedUris.length === 0) {
        return { blocked: false } as const;
      }

      const result = await moderateClientImages(normalizedUris);
      if (result.action === 'block') {
        toast.show(IMAGE_MODERATION_BLOCK_MESSAGE, {
          type: 'danger',
          placement: 'bottom',
        });
        return { blocked: true } as const;
      }

      if (result.action === 'fallback') {
        try {
          const imagePayload = await Promise.all(
            normalizedUris.map((uri) => buildImageDataUri(uri))
          );
          const fallbackResponse = await callBackendFallbackModeration({
            type: 'image',
            content: imagePayload,
            clientMetadata: {
              source: result.source,
              scores: result.scores,
              reason: result.reason,
              model: result.model,
            },
          });

          if (fallbackResponse.finalAction === 'flag_for_admin_review') {
            return {
              blocked: false,
              pendingReviewCheck: {
                type: 'image',
                clientSource: result.source,
                clientScores: result.scores,
                clientReason: result.reason,
                clientModel: result.model,
                fallbackAction: fallbackResponse.finalAction,
                fallbackProvider: fallbackResponse.provider,
                fallbackFlagged: fallbackResponse.flagged,
                fallbackModel: fallbackResponse.model,
                fallbackResults: fallbackResponse.results,
              } satisfies ModerationReviewCheckPayload,
            } as const;
          }
        } catch (error) {
          toast.show('Unable to complete moderation right now. Please try again.', {
            type: 'danger',
            placement: 'bottom',
          });
          return { blocked: true } as const;
        }
      }

      return { blocked: false } as const;
    },
    [toast]
  );

  const navigateToHomeFallback = useCallback(
    (reason: string) => {
      if (__DEV__) {
        const currentRoute = navigation.getState().routes[navigation.getState().index]?.name;
        console.log('[NewPost] fallback navigation', {
          reason,
          canGoBack: navigation.canGoBack(),
          currentRoute,
          destination: 'MainRoot > Main > HomeTab > Home',
        });
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'MainRoot',
              params: {
                screen: 'Main',
                params: {
                  screen: 'HomeTab',
                  params: {
                    screen: 'Home',
                  },
                },
              },
            },
          ],
        })
      );
    },
    [navigation]
  );

  const navigateAfterSocialPostSuccess = useCallback(
    (reason: 'create' | 'edit') => {
      const canGoBack = navigation.canGoBack();
      const currentRoute = navigation.getState().routes[navigation.getState().index]?.name;
      if (__DEV__) {
        console.log('[NewPost] social post success navigation', {
          reason,
          canGoBack,
          currentRoute,
          destination: canGoBack ? 'previous-screen' : 'MainRoot > Main > HomeTab > Home',
        });
      }

      if (canGoBack) {
        navigation.goBack();
        return;
      }

      navigateToHomeFallback(`${reason}-no-back`);
    },
    [navigateToHomeFallback, navigation]
  );

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

  useMountEffect(() => {
    if (!isQuoteMode) {
      return;
    }
    setLocation(null);
    setLinkAttachments([]);
    setImagesToUpload([]);
    setUploadImagesObject([]);
    setImagesObject([]);
    setGif(null);
  });

  const ensureGiphyInitialized = useCallback(() => {
    if (isGiphyInitialized) {
      return true;
    }
    try {
      GiphyDialog.configure({ theme: GiphyThemePreset.Automatic });

      const handler: GiphyDialogMediaSelectEventHandler = (e) => {
        setGif(e.media);
        GiphyDialog.hide();
      };
      try {
        giphyListenerRef.current = GiphyDialog.addListener(GiphyDialogEvent.MediaSelected, handler);
      } catch (error) {
        console.warn('GiphyDialog listener setup failed', error);
      }

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

  useMountEffect(() => {
    return () => {
      giphyListenerRef.current?.remove();
    };
  });

  const openUploadImageEditor = useCallback(
    async (asset: {
      uri: string;
      fileName?: string;
      fileSize?: number;
      type?: string;
      orientation?: number;
    }) => {
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
        orientation: asset.orientation,
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
      const textModeration = await runTextModeration(mergedContent);
      if (textModeration.blocked) {
        setIsLoading(false);
        return;
      }

      const result = await ApiCall({
        route: `social/post/${route.params?.postId}`,
        token,
        params: serialize(
          {
            content: mergedContent,
            mentionedUserIds: mentionComposer.mentionedUserIds,
            mentions: mentionComposer.mentions,
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
        dispatchTaggedNotification({
          postId: String(
            route.params?.postId ??
              result.response?.postId ??
              result.response?._id ??
              result.response?.id ??
              ''
          ).trim(),
          postType: 'social',
        });
        mentionComposer.reset();
        navigateAfterSocialPostSuccess('edit');
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
      const textModeration = await runTextModeration(mergedContent);
      if (textModeration.blocked) {
        setIsLoading(false);
        return;
      }

      const imageModeration = await runImageModeration(
        imagesToUpload.map((image) => String(image?.uri ?? ''))
      );
      if (imageModeration.blocked) {
        setIsLoading(false);
        return;
      }

      const moderationReview = buildPendingModerationReviewPayload(
        [textModeration.pendingReviewCheck, imageModeration.pendingReviewCheck].filter(
          Boolean
        ) as ModerationReviewCheckPayload[]
      );
      const createRequest = buildCreateSocialPostRequest({
        content: mergedContent,
        mentionedUserIds: mentionComposer.mentionedUserIds,
        mentions: mentionComposer.mentions,
        uploadedImages: uploadImagesObject,
        gif: mediaGif,
        moderationReview,
        location: location
          ? {
              coordinates: location.geometry.coordinates,
              name: location.place_name,
            }
          : undefined,
      });

      const result = await ApiCall({
        route: 'social/post',
        token,
        params: createRequest.params,
        verb: 'post',
        isFormUrlEncode: createRequest.isFormUrlEncode,
      });

      setIsLoading(false);

      console.log('postSocial result', result.status, result.response);
      if (result.status === 200) {
        const responseMessage =
          typeof (result.response as { message?: unknown })?.message === 'string'
            ? String((result.response as { message?: string }).message)
            : '';
        const pendingReview = Boolean(
          (result.response as { pendingReview?: unknown })?.pendingReview
        );
        if (pendingReview || responseMessage) {
          toast.show(responseMessage || FALLBACK_FLAGGED_MESSAGE, {
            type: 'success',
            placement: 'bottom',
          });
        }
        dispatchTaggedNotification({
          postId: String(
            result.response?.postId ?? result.response?._id ?? result.response?.id ?? ''
          ).trim(),
          postType: 'social',
        });
        mentionComposer.reset();
        navigateAfterSocialPostSuccess('create');
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

  const postQuoteRepost = async () => {
    if (!repostDraft?.sourceId || !repostDraft?.sourceType) {
      toast.show('Unable to quote this post right now.', {
        type: 'danger',
        placement: 'bottom',
      });
      return;
    }

    const quoteContent = content.trim();
    if (!quoteContent) {
      toast.show('Please add your thoughts before sharing.', {
        type: 'danger',
        placement: 'bottom',
      });
      return;
    }

    setIsLoading(true);
    try {
      const textModeration = await runTextModeration(quoteContent);
      if (textModeration.blocked) {
        setIsLoading(false);
        return;
      }

      const result = await ApiCall({
        route: 'social/repost',
        token,
        params: {
          sourceType: repostDraft.sourceType,
          sourceId: repostDraft.sourceId,
          quoteContent,
          mentionedUserIds: mentionComposer.mentionedUserIds,
          mentions: mentionComposer.mentions,
          moderationReview: buildPendingModerationReviewPayload(
            [textModeration.pendingReviewCheck].filter(Boolean) as ModerationReviewCheckPayload[]
          ),
        },
        verb: 'post',
      });

      if (result.status === 200) {
        dispatchTaggedNotification({
          postId: String(
            result.response?.postId ?? result.response?._id ?? result.response?.id ?? ''
          ).trim(),
          postType: 'social',
        });
        mentionComposer.reset();
        const responseMessage =
          typeof (result.response as { message?: unknown })?.message === 'string'
            ? String((result.response as { message?: string }).message)
            : '';
        toast.show(responseMessage || 'Quote posted to your feed', {
          type: 'success',
          placement: 'bottom',
        });
        navigation.navigate('MainRoot', {
          screen: 'Main',
          params: {
            screen: 'HomeTab',
            params: {
              screen: 'Home',
              params: {
                selectedTab: repostDraft.originFeedType,
                refreshToken: Date.now(),
              },
            },
          },
        } as any);
      } else {
        const responseMessage =
          typeof (result?.response as { message?: unknown })?.message === 'string'
            ? String((result.response as { message?: string }).message)
            : '';
        toast.show(responseMessage || 'Unable to quote this post right now.', {
          type: 'danger',
          placement: 'bottom',
        });
      }
    } catch (error: any) {
      const apiMessage =
        (typeof error?.response?.data?.message === 'string' && error.response.data.message) ||
        (typeof error?.response?.message === 'string' && error.response.message) ||
        (typeof error?.message === 'string' && error.message) ||
        '';
      toast.show(apiMessage || 'Unable to quote this post right now.', {
        type: 'danger',
        placement: 'bottom',
      });
    } finally {
      setIsLoading(false);
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
      compressImageQuality: CLIENT_IMAGE_PICKER_QUALITY,
      compressImageMaxWidth: CLIENT_IMAGE_MAX_WIDTH,
      compressImageMaxHeight: CLIENT_IMAGE_MAX_HEIGHT,
      forceJpg: true,
      includeExif: true,
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
          orientation: extractExifOrientation(item),
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
      quality: CLIENT_IMAGE_PICKER_QUALITY,
      maxWidth: CLIENT_IMAGE_MAX_WIDTH,
      maxHeight: CLIENT_IMAGE_MAX_HEIGHT,
      includeExtra: true,
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
              orientation: extractExifOrientation(asset),
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
    setContent((previous) => sanitizeComposerText(`${previous}${emoji.emoji}`, MAX_CONTENT_LENGHT));
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

  const hasUploadData = isQuoteMode
    ? content.trim().length > 0
    : !!location ||
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
                if (navigation.canGoBack()) {
                  navigation.goBack();
                  return;
                }
                navigateToHomeFallback('close-no-back');
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
              {isQuoteMode ? 'Quote Post' : 'Create Post'}
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
              {isQuoteMode ? (
                <View
                  style={{
                    marginBottom: spacing.x16,
                    borderRadius: borderRadius.base,
                    borderWidth: 1,
                    borderColor: Colors.neutral[700],
                    backgroundColor: Colors.neutral[700],
                    paddingHorizontal: spacing.x13,
                    paddingVertical: spacing.x10,
                  }}
                >
                  <StyledText style={{ color: Colors.primary.brand, fontWeight: '700' }}>
                    Quoting
                  </StyledText>
                  <StyledText
                    numberOfLines={3}
                    style={{ marginTop: spacing.x5, color: colors.text }}
                  >
                    {quoteSourceTitle || 'Original post'}
                  </StyledText>
                </View>
              ) : null}
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

              <MentionInput
                inputRef={postInputRef}
                activeMention={mentionComposer.activeMention}
                autoCorrect
                containerStyle={{ flexGrow: 1 }}
                inputStyle={{
                  textAlignVertical: 'top',
                  height: 220,
                  flexGrow: 1,
                  color: colors.text,
                  paddingVertical: spacing.x5,
                  fontSize: 15,
                }}
                inputWrapperStyle={{
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  borderRadius: borderRadius.base,
                }}
                isError={isMentionError}
                isLoading={isMentionLoading}
                maxLength={MAX_CONTENT_LENGHT}
                maxLengthErrorMessage="This message exceeds the character limit."
                mentions={mentionComposer.mentions}
                multiline
                numberOfLines={4}
                onChangeText={setContent}
                onHandleBackspace={mentionComposer.deleteMentionBeforeCursor}
                onSelectSuggestion={mentionComposer.selectMention}
                onSelectionChange={mentionComposer.setSelection}
                placeholder={isQuoteMode ? 'Add your thoughts...' : "What's on your heart?"}
                placeholderTextColor={Colors.neutral[300]}
                returnKeyType="default"
                selection={mentionComposer.selection}
                showCharCounter
                suggestions={suggestions}
                suggestionsContainerStyle={{
                  backgroundColor: colors.card,
                  borderColor: Colors.neutral[600],
                }}
                textAlignVertical="top"
                value={content}
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
                          <View
                            style={{
                              height: 80,
                              width: 80,
                              borderRadius: MEDIA_RADIUS,
                              overflow: 'hidden',
                            }}
                          >
                            <FastImage
                              style={{
                                height: 80,
                                width: 80,
                                borderRadius: MEDIA_RADIUS,
                              }}
                              source={{
                                uri: image.uri,
                              }}
                              resizeMode="contain"
                            />
                          </View>
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
                          <View
                            style={{
                              height: 80,
                              width: 80,
                              borderRadius: MEDIA_RADIUS,
                              overflow: 'hidden',
                            }}
                          >
                            <FastImage
                              style={{
                                height: 80,
                                width: 80,
                                borderRadius: MEDIA_RADIUS,
                              }}
                              source={{
                                uri: image,
                              }}
                              resizeMode="contain"
                            />
                          </View>
                        </View>
                      );
                    })}

                  {mediaGif && (
                    <View
                      style={{
                        padding: 10,
                        height: 100,
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
                        <CloseCircle size="30" color="#fff" />
                      </TouchableOpacity>
                      <GiphyMediaView
                        media={mediaGif}
                        resizeMode="contain"
                        style={{
                          aspectRatio: mediaGif.aspectRatio,
                          borderRadius: MEDIA_RADIUS,

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
                  flexDirection: 'row',
                  paddingVertical: spacing.x13,
                  paddingHorizontal: spacing.x8,
                  borderTopWidth: 1,
                  borderTopColor: Colors.neutral[700],
                  marginTop: spacing.x16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  columnGap: 'spacing.x12',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    columnGap: spacing.x32,
                  }}
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
                      size={ACTION_BAR_ICON_SIZE}
                      color={Colors.primary.brand}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      navigation.navigate('VideoPost', { openCameraOnMount: true });
                    }}
                  >
                    <MaterialCommunityIcons
                      name="video-outline"
                      size={ACTION_BAR_ICON_SIZE}
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
                    <GifIcon size={ACTION_BAR_ICON_SIZE} color={Colors.primary.brand} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setLocationSelector(true);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={ACTION_BAR_ICON_SIZE}
                      color={location ? Colors.primary.brand : Colors.neutral[300]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <Button
                disabled={
                  isLoading || !hasUploadData || (!!content && content.length > MAX_CONTENT_LENGHT)
                }
                onPress={() => {
                  if (route.params?.postId) {
                    editSocial();
                  } else if (isQuoteMode) {
                    postQuoteRepost();
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
                        {route.params?.postId ? 'Update Post' : isQuoteMode ? 'Quote Post' : 'Post'}
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
