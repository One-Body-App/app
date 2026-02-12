import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serialize } from 'object-to-formdata';
import {
  GiphyDialog,
  GiphyDialogEvent,
  GiphyDialogMediaSelectEventHandler,
  GiphyMedia,
} from '@giphy/react-native-sdk';
import { useToast } from 'react-native-toast-notifications';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import CommentItem from './CommentItem';
import CommentField from './Field';
import { CommentPost, PostType, SocialPostReaction } from '@/utils/types';

interface CommentThreadProps {
  postId: string;
  type: PostType;
  isPrivate?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  enablePagination?: boolean;
  hideComposer?: boolean;
  onPostRefresh?: () => void;
  onCommentPublished?: () => void;
  onUserPress?: (userId: string) => void;
  listStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollToEndOnPublish?: boolean;
}

const isLocalImageUri = (value: string) =>
  value.startsWith('file://') || value.startsWith('content://');

const toUploadImageFile = (uri: string, index: number) => {
  const normalizedUri =
    uri.startsWith('file://') || uri.startsWith('content://') ? uri : `file://${uri}`;
  const nameFromPath = normalizedUri.split('/').pop()?.split('?')[0] ?? `image_${index}.jpg`;
  const normalizedName = nameFromPath.toLowerCase().endsWith('.jpg')
    ? nameFromPath
    : `${nameFromPath.split('.').slice(0, -1).join('.') || nameFromPath}.jpg`;
  return {
    uri: normalizedUri,
    type: 'image/jpeg',
    name: normalizedName,
  };
};

function CommentThreadEmptyState({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <ActivityIndicator />;
  return (
    <View style={{ padding: spacing.x16 }}>
      <StyledText style={{ color: Colors.neutral[400] }}>No comments yet.</StyledText>
    </View>
  );
}

function CommentThread({
  postId,
  type,
  isPrivate,
  header,
  footer,
  enablePagination,
  hideComposer,
  onPostRefresh,
  onCommentPublished,
  onUserPress,
  listStyle,
  contentContainerStyle,
  scrollToEndOnPublish,
}: CommentThreadProps) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const listRef = useRef<FlatList<CommentPost>>(null);
  const activeRequest = useRef(0);
  const isMounted = useRef(true);
  const giphySelectListenerRef = useRef<{ remove: () => void } | null>(null);

  const [comments, setComments] = useState<CommentPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string>('');
  const [mediaGif, setGif] = useState<GiphyMedia | null>(null);
  const [mediaImages, setMediaImages] = useState<string[]>([]);
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
  const allowMedia = type === PostType.social || type === PostType.rss;

  const useBrandDarkForSocial = dark && type === PostType.social;
  let backgroundColor = '#f6f7f8';
  let surfaceColor = '#ffffff';
  let dividerColor = '#e7eaed';
  if (dark && useBrandDarkForSocial) {
    backgroundColor = colors.background;
    surfaceColor = colors.card;
    dividerColor = colors.border;
  } else if (dark) {
    backgroundColor = '#111d21';
    surfaceColor = '#1a2c32';
    dividerColor = '#22343a';
  }
  const keyboardOffset = insets.top + 44;
  const listHeader = useMemo(() => {
    if (!header) return null;
    return (
      <View
        style={{
          paddingHorizontal: spacing.x16,
          paddingTop: spacing.x16,
          paddingBottom: spacing.x12,
          backgroundColor,
          borderBottomWidth: 1,
          borderBottomColor: dividerColor,
        }}
      >
        {header}
      </View>
    );
  }, [backgroundColor, dividerColor, header]);

  const listFooter = useMemo(() => {
    if (!footer) return null;
    return <View style={{ marginTop: spacing.x13 }}>{footer}</View>;
  }, [footer]);

  const fetchComments = useCallback(
    async (pageToLoad: number, reset?: boolean) => {
      if (!postId) return;
      const requestId = ++activeRequest.current;
      setIsLoading(true);
      try {
        const result = await ApiCall({
          route: `comments/${type}/${postId}?page=${pageToLoad}`,
          token,
          verb: 'get',
        });

        if (!isMounted.current || requestId !== activeRequest.current) {
          return;
        }
        setIsLoading(false);
        setIsRefreshing(false);

        if (result.status === 200) {
          const nextComments = result?.response?.content ?? [];

          if (reset || pageToLoad === 1) {
            setComments(nextComments);
            setIsEndOfList(nextComments.length < 1);
          } else {
            setComments((prev) => [...prev, ...nextComments]);
            setIsEndOfList(nextComments.length < 1);
          }
        }
      } catch (e) {
        if (!isMounted.current || requestId !== activeRequest.current) {
          return;
        }
        setIsRefreshing(false);
        setIsLoading(false);
      }
    },
    [postId, token, type]
  );

  const refreshContent = () => {
    setIsEndOfList(false);
    setPage(1);
    setIsRefreshing(true);
    fetchComments(1, true);
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setComments([]);
    setPage(1);
    setIsEndOfList(false);
    if (postId) {
      fetchComments(1, true);
    }
  }, [fetchComments, postId, type]);

  useEffect(() => {
    if (!enablePagination) return;
    if (page > 1) {
      fetchComments(page);
    }
  }, [enablePagination, fetchComments, page]);

  useEffect(() => {
    return () => {
      giphySelectListenerRef.current?.remove();
      giphySelectListenerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isEditingComment) {
      setGif(null);
      setMediaImages([]);
    }
  }, [isEditingComment]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }
    const updateKeyboardHeight = (event: {
      endCoordinates?: {
        height?: number;
      };
    }) => {
      const keyboardHeight = event.endCoordinates?.height ?? 0;
      setAndroidKeyboardHeight(Math.max(0, keyboardHeight - insets.bottom));
    };

    const onShow = Keyboard.addListener('keyboardDidShow', updateKeyboardHeight);
    const onFrameChange = Keyboard.addListener('keyboardDidChangeFrame', updateKeyboardHeight);
    const onHide = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onFrameChange.remove();
      onHide.remove();
    };
  }, [insets.bottom]);

  useEffect(() => {
    setAndroidKeyboardHeight(0);
  }, [postId, type]);

  const publishComment = async (content?: string) => {
    if (!postId) return false;
    setIsLoading(true);
    try {
      const localImageUris = allowMedia ? mediaImages.filter(isLocalImageUri) : [];
      const localUploadImages = localImageUris.map((uri, index) => toUploadImageFile(uri, index));
      const shouldUploadImages = localUploadImages.length > 0;

      const result = await ApiCall({
        route: `comments/${type}/${postId}`,
        token,
        verb: 'post',
        params: shouldUploadImages
          ? serialize(
              {
                content,
                gif: allowMedia ? mediaGif : undefined,
                images: localUploadImages,
              },
              {
                noAttributesWithArrayNotation: true,
                noFilesWithArrayNotation: true,
              }
            )
          : {
              content,
              gif: allowMedia ? mediaGif : undefined,
            },
        isFormUrlEncode: shouldUploadImages,
      });

      if (result.status === 200) {
        setGif(null);
        setMediaImages([]);
        refreshContent();
        if (onPostRefresh) onPostRefresh();
        if (scrollToEndOnPublish) {
          requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated: true });
          });
        }
        if (onCommentPublished) onCommentPublished();
        return true;
      }

      toast.show(result?.response?.message ?? 'Unable to post comment. Please try again.', {
        id: 'commentPublishError',
        type: 'danger',
        placement: 'bottom',
      });
      return false;
    } catch (e) {
      toast.show('Unable to post comment. Please try again.', {
        id: 'commentPublishError',
        type: 'danger',
        placement: 'bottom',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const openGifPicker = useCallback(() => {
    if (!allowMedia) {
      return;
    }
    giphySelectListenerRef.current?.remove();
    const handler: GiphyDialogMediaSelectEventHandler = (e) => {
      setGif(e.media);
      try {
        GiphyDialog.hide();
      } catch (error) {
        console.warn('GiphyDialog hide failed in comments', error);
      } finally {
        giphySelectListenerRef.current?.remove();
        giphySelectListenerRef.current = null;
      }
    };

    try {
      giphySelectListenerRef.current = GiphyDialog.addListener(
        GiphyDialogEvent.MediaSelected,
        handler
      );
      GiphyDialog.show();
    } catch (error) {
      giphySelectListenerRef.current?.remove();
      giphySelectListenerRef.current = null;
      console.warn('GiphyDialog open failed in comments', error);
    }
  }, [allowMedia]);

  const editComment = async (commentId: string, content: string) => {
    if (!postId) return;
    try {
      const localImageUris = allowMedia ? mediaImages.filter(isLocalImageUri) : [];
      const remoteImageUris = allowMedia
        ? mediaImages.filter((imageUri) => imageUri.startsWith('http'))
        : [];
      const uploadImages = localImageUris.map((uri, index) => toUploadImageFile(uri, index));
      const shouldUploadImages = uploadImages.length > 0;

      const result = await ApiCall({
        route: `comments/${type}/${postId}/${commentId}`,
        verb: 'patch',
        token,
        params: shouldUploadImages
          ? serialize(
              {
                content,
                gif: allowMedia ? mediaGif : undefined,
                images: remoteImageUris.length > 0 ? remoteImageUris : undefined,
                uploadImages,
              },
              {
                noAttributesWithArrayNotation: true,
                noFilesWithArrayNotation: true,
              }
            )
          : {
              content,
              gif: allowMedia ? mediaGif : undefined,
              images: remoteImageUris.length > 0 ? remoteImageUris : undefined,
            },
        isFormUrlEncode: shouldUploadImages,
      });

      if (result?.status === 200) {
        refreshContent();
        toast.show('Comment modified successfully', {
          id: 'successMessage',
          type: 'success',
          placement: 'bottom',
        });
        if (onPostRefresh) onPostRefresh();
      }
    } catch (e) {
      console.log('comment edit error -- ', e);
    }
  };

  const removeComment = async (_type: string, commentId: string) => {
    if (!postId) return;
    try {
      const result = await ApiCall({
        route: `comments/${type}/${postId}/${commentId}`,
        verb: 'delete',
        token,
      });

      if (result?.status === 200) {
        refreshContent();
        if (onPostRefresh) onPostRefresh();
      }
    } catch (e) {
      console.log('comment delete error -- ', e);
    }
  };

  const Container = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const isAndroid = Platform.OS === 'android';
  let listBottomPadding = spacing.x16;
  if (!hideComposer && isAndroid) {
    listBottomPadding = spacing.x120;
  }
  let keyboardAvoidingProps: {
    behavior?: 'height' | 'padding' | 'position';
    keyboardVerticalOffset?: number;
  } = {};
  if (Platform.OS === 'ios') {
    keyboardAvoidingProps = {
      behavior: 'padding',
      keyboardVerticalOffset: keyboardOffset,
    };
  }

  return (
    <Container style={{ flex: 1, backgroundColor }} {...keyboardAvoidingProps}>
      <FlatList
        ref={listRef}
        data={comments}
        style={[{ backgroundColor }, listStyle]}
        contentContainerStyle={[
          {
            paddingBottom: listBottomPadding,
            paddingTop: header ? 0 : spacing.x16,
            backgroundColor,
          },
          contentContainerStyle,
        ]}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        keyExtractor={(item, index) => `${item.commentId ?? item._id ?? index}`}
        onEndReachedThreshold={0.8}
        onEndReached={() => {
          if (enablePagination && !isLoading && !isRefreshing && !isEndOfList) {
            setPage((prev) => prev + 1);
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              refreshContent();
            }}
          />
        }
        ListEmptyComponent={<CommentThreadEmptyState isLoading={isLoading} />}
        renderItem={({ item }) => {
          let myReaction: SocialPostReaction | undefined;

          item.reactions?.forEach((reaction: SocialPostReaction) => {
            if (reaction.userId === user?._id) {
              myReaction = reaction;
            }
          });

          return (
            <CommentItem
              removePost={removeComment}
              editCommentAction={editComment}
              onPress={() => {
                if (onUserPress && item.userData?._id) {
                  onUserPress(item.userData._id);
                }
              }}
              setEditingComment={(isEditing: boolean) => {
                if (isEditing) {
                  setGif(item.gif ?? null);
                  setMediaImages(item.images ?? []);
                }
                setIsEditingComment(isEditing);
                if (item.commentId) setEditingCommentId(item.commentId);
              }}
              postData={{
                id: item.commentId,
                objectId: item.objectId,
                objectType: item.objectType,
                content: item.content,
                reactions: item.reactions,
                myReaction,
                edited: item.edited,
                gif: isEditingComment && editingCommentId === item.commentId ? mediaGif : item.gif,
                images:
                  isEditingComment && editingCommentId === item.commentId
                    ? mediaImages
                    : (item.images ?? []),
              }}
              useBrandDarkTheme={useBrandDarkForSocial}
              isPrivate={type === PostType.prayer ? Boolean(isPrivate) : false}
              userData={item.userData}
              allowMedia={allowMedia}
              allowImageAttachments={allowMedia}
              setThreadImages={setMediaImages}
              onOpenGifPicker={openGifPicker}
            />
          );
        }}
      />

      {!hideComposer && !isEditingComment ? (
        <View
          style={{
            position: isAndroid ? 'absolute' : 'relative',
            left: isAndroid ? 0 : undefined,
            right: isAndroid ? 0 : undefined,
            bottom: isAndroid ? androidKeyboardHeight : undefined,
            borderTopWidth: 1,
            borderTopColor: dividerColor,
            backgroundColor: surfaceColor,
          }}
        >
          <CommentField
            mediaGif={mediaGif}
            setGif={setGif}
            mediaImages={mediaImages}
            setImages={setMediaImages}
            publishComment={publishComment}
            isEditingComment={false}
            useBrandDarkTheme={useBrandDarkForSocial}
            allowMedia={allowMedia}
            allowImageAttachments={allowMedia}
            onOpenGifPicker={openGifPicker}
          />
        </View>
      ) : null}
    </Container>
  );
}

export default CommentThread;
