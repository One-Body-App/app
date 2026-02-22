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
  GiphyThemePreset,
} from '@giphy/react-native-sdk';
import { useToast } from 'react-native-toast-notifications';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import CommentItem from './CommentItem';
import CommentField from './Field';
import { CommentPost, PostType, SocialPostReaction, SocialPostReactionType } from '@/utils/types';

interface CommentThreadProps {
  postId: string;
  type: PostType;
  isPrivate?: boolean;
  header?: React.ReactNode;
  headerContainerStyle?: StyleProp<ViewStyle>;
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

const getCommentId = (comment?: Partial<CommentPost> | null) => {
  const raw = comment?.commentId ?? comment?._id;
  if (!raw) return '';
  return String(raw);
};

const getCommentReplies = (comment?: Partial<CommentPost> | null): CommentPost[] => {
  if (!comment) return [];
  const rawReplies = (comment as any)?.response ?? (comment as any)?.replies;
  return Array.isArray(rawReplies) ? (rawReplies as CommentPost[]) : [];
};

const getParentCommentId = (comment?: Partial<CommentPost> | null) => {
  if (!comment) return '';
  const rawParentId =
    (comment as any)?.parentCommentId ??
    (comment as any)?.replyToCommentId ??
    (comment as any)?.parentId ??
    (comment as any)?.parent?._id ??
    (comment as any)?.parent?.commentId ??
    (typeof (comment as any)?.parent === 'string' ? (comment as any)?.parent : undefined);
  if (!rawParentId) return '';
  return String(rawParentId);
};

const flattenCommentNodes = (nodes: CommentPost[]): CommentPost[] => {
  const flattened: CommentPost[] = [];
  const walk = (items: CommentPost[]) => {
    items.forEach((item) => {
      flattened.push(item);
      const replies = getCommentReplies(item);
      if (replies.length > 0) {
        walk(replies);
      }
    });
  };
  walk(nodes);
  return flattened;
};

const normalizeCommentTreeFallback = (nodes: CommentPost[]): CommentPost[] => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  const flattened = flattenCommentNodes(nodes);
  const hasParentPointers = flattened.some((item) => getParentCommentId(item));
  if (!hasParentPointers) {
    return nodes;
  }

  const byId = new Map<string, CommentPost>();
  const ordered: CommentPost[] = [];
  const orphans: CommentPost[] = [];

  flattened.forEach((item) => {
    const itemId = getCommentId(item);
    const clonedItem: CommentPost = {
      ...item,
      response: [],
    };

    if (!itemId) {
      orphans.push(clonedItem);
      return;
    }

    if (!byId.has(itemId)) {
      byId.set(itemId, clonedItem);
      ordered.push(clonedItem);
    }
  });

  const roots: CommentPost[] = [];
  ordered.forEach((item) => {
    const itemId = getCommentId(item);
    const parentId = getParentCommentId(item);
    const parent = parentId ? byId.get(parentId) : undefined;

    if (parent && parentId !== itemId) {
      parent.response = [...(parent.response ?? []), item];
      return;
    }

    roots.push(item);
  });

  return [...roots, ...orphans];
};

const updateCommentInTree = (
  nodes: CommentPost[],
  targetId: string,
  updater: (comment: CommentPost) => CommentPost
): CommentPost[] =>
  nodes.map((node) => {
    const nodeId = getCommentId(node);
    const hasReplies = Array.isArray(node.response);
    const nextReplies = hasReplies
      ? updateCommentInTree(node.response ?? [], targetId, updater)
      : undefined;
    if (nodeId === targetId) {
      const updatedNode = updater(node);
      return {
        ...updatedNode,
        response: nextReplies ?? [],
      };
    }
    if (hasReplies && nextReplies !== node.response) {
      return {
        ...node,
        response: nextReplies,
      };
    }
    return node;
  });

const appendReplyToTree = (
  nodes: CommentPost[],
  targetId: string,
  reply: CommentPost
): { comments: CommentPost[]; inserted: boolean } => {
  let inserted = false;

  const nextComments = nodes.map((node) => {
    const nodeId = getCommentId(node);
    const currentReplies = Array.isArray(node.response) ? node.response : [];

    if (nodeId === targetId) {
      inserted = true;
      return {
        ...node,
        response: [...currentReplies, reply],
      };
    }

    if (currentReplies.length > 0) {
      const nestedResult = appendReplyToTree(currentReplies, targetId, reply);
      if (nestedResult.inserted) {
        inserted = true;
        return {
          ...node,
          response: nestedResult.comments,
        };
      }
    }

    return node;
  });

  return {
    comments: nextComments,
    inserted,
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
  headerContainerStyle,
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
  const isGiphyInitializedRef = useRef(false);

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
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [reactingCommentId, setReactingCommentId] = useState('');
  const allowMedia = type === PostType.social || type === PostType.rss;
  const commentsRef = useRef<CommentPost[]>([]);

  const useBrandDarkForSocial = dark;
  let backgroundColor = '#f6f7f8';
  let surfaceColor = '#ffffff';
  let dividerColor = '#e7eaed';
  if (dark && useBrandDarkForSocial) {
    backgroundColor = colors.background;
    surfaceColor = colors.card;
    dividerColor = colors.border;
  }
  const keyboardOffset = insets.top + 44;
  const listHeader = useMemo(() => {
    if (!header) return null;
    return (
      <View
        style={[
          {
            paddingHorizontal: spacing.x16,
            paddingTop: spacing.x16,
            paddingBottom: spacing.x13,
            backgroundColor,
            borderBottomWidth: 1,
            borderBottomColor: dividerColor,
          },
          headerContainerStyle,
        ]}
      >
        {header}
      </View>
    );
  }, [backgroundColor, dividerColor, header, headerContainerStyle]);

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
          const nextComments = normalizeCommentTreeFallback(result?.response?.content ?? []);

          if (reset || pageToLoad === 1) {
            setComments(nextComments);
            setIsEndOfList(nextComments.length < 1);
          } else {
            setComments((prev) => normalizeCommentTreeFallback([...prev, ...nextComments]));
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

  const refreshContent = useCallback(() => {
    setIsEndOfList(false);
    setPage(1);
    setIsRefreshing(true);
    fetchComments(1, true);
  }, [fetchComments]);

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
    commentsRef.current = comments;
  }, [comments]);

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

  useEffect(() => {
    setReplyingTo(null);
  }, [postId, type]);

  const publishComment = async (content?: string) => {
    if (!postId) return false;
    setIsLoading(true);
    try {
      const localImageUris = allowMedia ? mediaImages.filter(isLocalImageUri) : [];
      const localUploadImages = localImageUris.map((uri, index) => toUploadImageFile(uri, index));
      const shouldUploadImages = localUploadImages.length > 0;
      const replyTargetId = replyingTo?.id;

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
                parentCommentId: replyTargetId,
                replyToCommentId: replyTargetId,
              },
              {
                noAttributesWithArrayNotation: true,
                noFilesWithArrayNotation: true,
              }
            )
          : {
              content,
              gif: allowMedia ? mediaGif : undefined,
              parentCommentId: replyTargetId,
              replyToCommentId: replyTargetId,
            },
        isFormUrlEncode: shouldUploadImages,
      });

      if (result.status === 200) {
        const now = new Date();
        const createdAtValue =
          (result.response as any)?.created ??
          (result.response as any)?.createdAt ??
          (result.response as any)?.date ??
          now;
        const updatedAtValue =
          (result.response as any)?.updated ??
          (result.response as any)?.updatedAt ??
          (result.response as any)?.date ??
          now;
        const createdDate = new Date(createdAtValue);
        const updatedDate = new Date(updatedAtValue);
        const replyId =
          getCommentId((result.response as CommentPost) ?? null) ||
          `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const optimisticReply: CommentPost = {
          _id: (result.response as any)?._id ?? replyId,
          commentId: (result.response as any)?.commentId ?? replyId,
          dateSeconds: Math.ceil(createdDate.getTime() / 1000),
          date: createdDate.toISOString(),
          objectId: postId,
          objectType: type,
          content: (result.response as any)?.content ?? content ?? '',
          userData: (result.response as any)?.userData ?? {
            _id: user?._id,
            name: user?.name ?? user?.username ?? 'You',
            username: user?.username,
            accountType: user?.accountType,
            profileImage: user?.profileImage,
          },
          images:
            ((result.response as any)?.images as string[] | undefined) ??
            (allowMedia ? mediaImages : []),
          gif: ((result.response as any)?.gif as GiphyMedia | undefined) ?? mediaGif ?? undefined,
          videos: [],
          created: createdDate,
          updated: updatedDate,
          reactions:
            ((result.response as any)?.reactions as SocialPostReaction[] | undefined) ?? [],
          response: [],
          edited: false,
        };

        setGif(null);
        setMediaImages([]);
        if (replyTargetId) {
          const appendResult = appendReplyToTree(
            commentsRef.current,
            replyTargetId,
            optimisticReply
          );
          if (appendResult.inserted) {
            setComments(appendResult.comments);
          } else {
            setComments((prev) => [...prev, optimisticReply]);
          }
          setReplyingTo(null);
        } else {
          refreshContent();
        }
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
    if (!isGiphyInitializedRef.current) {
      try {
        GiphyDialog.configure({ theme: GiphyThemePreset.Automatic });
        isGiphyInitializedRef.current = true;
      } catch (error) {
        console.warn('Giphy initialization failed in comments', error);
        toast.show('GIF feature is temporarily unavailable.', {
          type: 'danger',
          placement: 'bottom',
        });
        return;
      }
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
  }, [allowMedia, toast]);

  const editComment = useCallback(
    async (commentId: string, content: string) => {
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
    },
    [allowMedia, mediaGif, mediaImages, onPostRefresh, postId, refreshContent, toast, token, type]
  );

  const removeComment = useCallback(
    async (_type: string, commentId: string) => {
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
    },
    [onPostRefresh, postId, refreshContent, token, type]
  );

  const reactToComment = useCallback(
    async (commentId: string, reactionType?: SocialPostReactionType) => {
      if (!postId || !commentId || !user?._id) {
        return;
      }

      const previousComments = commentsRef.current;
      const optimisticComments = updateCommentInTree(previousComments, commentId, (comment) => {
        const filtered = (comment.reactions ?? []).filter(
          (reaction) => reaction.userId !== user._id
        );
        const nextReactions = reactionType
          ? [
              ...filtered,
              {
                type: reactionType,
                userId: user._id,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]
          : filtered;

        return {
          ...comment,
          reactions: nextReactions,
        };
      });

      setComments(optimisticComments);
      setReactingCommentId(commentId);
      try {
        const result = await ApiCall({
          route: `comments/${type}/${postId}/${commentId}/reaction`,
          verb: reactionType ? 'patch' : 'delete',
          token,
          params: reactionType ? { type: reactionType } : undefined,
        });

        if (result.status !== 200) {
          setComments(previousComments);
          toast.show(result?.response?.message ?? 'Unable to update reaction right now.', {
            id: 'commentReactionError',
            type: 'danger',
            placement: 'bottom',
          });
        }
      } catch (error) {
        setComments(previousComments);
        toast.show('Unable to update reaction right now.', {
          id: 'commentReactionError',
          type: 'danger',
          placement: 'bottom',
        });
      } finally {
        setReactingCommentId('');
      }
    },
    [postId, token, toast, type, user?._id]
  );

  const renderCommentNode = useCallback(
    (
      item: CommentPost,
      nodeKeyPrefix = 'comment',
      hasNextSibling = false,
      depth = 0,
      hasPreviousSibling = false
    ) => {
      const itemId = getCommentId(item);
      let myReaction: SocialPostReaction | undefined;

      item.reactions?.forEach((reaction: SocialPostReaction) => {
        if (reaction.userId === user?._id) {
          myReaction = reaction;
        }
      });

      const threadedStyle: ViewStyle = {
        paddingHorizontal: spacing.x16,
      };
      const threadLineColor = '#12d2d9';
      const avatarCenterX = spacing.x16 + 18;
      const branchIndent = avatarCenterX;
      const avatarCenterY = spacing.x8 + 18;
      const elbowRadius = spacing.x8;
      const replies = item.response ?? [];

      return (
        <View key={`${nodeKeyPrefix}_${itemId || 'comment'}`} style={{ position: 'relative' }}>
          {depth === 0 && hasPreviousSibling ? (
            <View
              style={{
                position: 'absolute',
                left: branchIndent,
                top: 0,
                height: avatarCenterY,
                width: 1,
                backgroundColor: threadLineColor,
              }}
            />
          ) : null}
          {hasNextSibling ? (
            <View
              style={{
                position: 'absolute',
                left: branchIndent,
                top: avatarCenterY,
                bottom: 0,
                width: 1,
                backgroundColor: threadLineColor,
              }}
            />
          ) : null}
          <View style={{ position: 'relative' }}>
            {replies.length > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  left: branchIndent,
                  top: avatarCenterY,
                  bottom: 0,
                  width: 1,
                  backgroundColor: threadLineColor,
                }}
              />
            ) : null}
            <CommentItem
              style={threadedStyle}
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
                  setReplyingTo(null);
                }
                setIsEditingComment(isEditing);
                if (itemId) setEditingCommentId(itemId);
              }}
              onReactPress={(selectedReactionType?: SocialPostReactionType) => {
                if (itemId) {
                  reactToComment(itemId, selectedReactionType);
                }
              }}
              isReacting={reactingCommentId === itemId}
              onReplyPress={() => {
                if (!itemId || isEditingComment) {
                  return;
                }
                setReplyingTo({
                  id: itemId,
                  name: item.userData?.name ?? 'Unknown',
                });
                requestAnimationFrame(() => {
                  listRef.current?.scrollToEnd({ animated: true });
                });
              }}
              postData={{
                id: itemId,
                objectId: item.objectId,
                objectType: item.objectType,
                content: item.content,
                reactions: item.reactions,
                myReaction,
                edited: item.edited,
                gif: isEditingComment && editingCommentId === itemId ? mediaGif : item.gif,
                images:
                  isEditingComment && editingCommentId === itemId
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
          </View>
          {replies.length > 0 ? (
            <View
              style={{
                marginLeft: branchIndent,
                position: 'relative',
              }}
            >
              {replies.map((reply, replyIndex) => (
                <View
                  key={`${nodeKeyPrefix}_${itemId}_${getCommentId(reply) || `reply_${replyIndex}`}`}
                  style={{ position: 'relative' }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: branchIndent,
                      height: avatarCenterY,
                      borderLeftWidth: 1,
                      borderBottomWidth: 1,
                      borderColor: threadLineColor,
                      borderBottomLeftRadius: elbowRadius,
                    }}
                  />
                  {renderCommentNode(
                    reply,
                    `${nodeKeyPrefix}_${itemId}_${getCommentId(reply) || `reply_${replyIndex}`}`,
                    replyIndex < replies.length - 1,
                    depth + 1,
                    replyIndex > 0
                  )}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      );
    },
    [
      allowMedia,
      editComment,
      editingCommentId,
      isEditingComment,
      isPrivate,
      mediaGif,
      mediaImages,
      onUserPress,
      openGifPicker,
      reactToComment,
      reactingCommentId,
      removeComment,
      type,
      useBrandDarkForSocial,
      user?._id,
    ]
  );

  const Container = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  const isAndroid = Platform.OS === 'android';
  let listBottomPadding = spacing.x16;
  if (!hideComposer && isAndroid) {
    listBottomPadding = spacing.x104;
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
        renderItem={({ item, index }) =>
          renderCommentNode(item, `root_${index}`, index < comments.length - 1, 0, index > 0)
        }
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
            placeholderText={replyingTo ? `Reply to ${replyingTo.name}...` : 'Add a comment...'}
            replyingToLabel={replyingTo ? `Replying to ${replyingTo.name}` : undefined}
            onCancelReply={
              replyingTo
                ? () => {
                    setReplyingTo(null);
                  }
                : undefined
            }
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
