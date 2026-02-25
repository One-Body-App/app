import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  ListRenderItemInfo,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import {
  applyOptimisticReaction,
  CommentListFilter,
  FlatCommentItem,
  countCommentsInTree,
  flattenCommentsForList,
  getCommentId,
  normalizeCommentTreeFallback,
  removeCommentFromTree,
  sortFlatComments,
  toSerializableCommentSnapshot,
  toDateFromSource,
  updateCommentInTree,
} from '@/components/comments/commentListUtils';
import { CommentPost, PostType, SocialPostReactionType } from '@/utils/types';
import CommentFilterTabs from '@/components/comments/CommentFilterTabs';
import FlatCommentRow from '@/components/comments/FlatCommentRow';
import { COLORS, styles as watchStyles } from './commentstyles';
import { MainStackParamList } from '@/src/navigator/types';

type WatchCommentsProps = {
  postId: string;
  initialCommentCount?: number;
  onClose: () => void;
  onCountChange?: (nextCount: number) => void;
  onTelemetryEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
  sheetOpenKey?: number;
};

const QUICK_EMOJIS = ['🔥', '💪', '👏', '💯', '❤️'];

function WatchComments({
  postId,
  initialCommentCount,
  onClose,
  onCountChange,
  onTelemetryEvent,
  sheetOpenKey,
}: WatchCommentsProps) {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [comments, setComments] = useState<CommentPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedFilter, setSelectedFilter] = useState<CommentListFilter>('relevant');
  const [composerText, setComposerText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeReactionPickerId, setActiveReactionPickerId] = useState('');
  const [reactingCommentId, setReactingCommentId] = useState('');
  const [repostingCommentId, setRepostingCommentId] = useState('');
  const [bookmarkingCommentId, setBookmarkingCommentId] = useState('');
  const [commentCount, setCommentCount] = useState(Math.max(0, initialCommentCount ?? 0));

  const commentsRef = useRef<CommentPost[]>([]);
  const commentCountRef = useRef(commentCount);
  const activeRequestRef = useRef(0);
  const isMountedRef = useRef(true);

  const currentUserImage =
    user?.profileImage && user.profileImage !== '' ? user.profileImage : NO_PROFILE_IMAGE;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  useEffect(() => {
    commentCountRef.current = commentCount;
  }, [commentCount]);

  useEffect(() => {
    setCommentCount(Math.max(0, initialCommentCount ?? 0));
  }, [initialCommentCount, postId]);

  const setCount = useCallback(
    (nextCount: number) => {
      const safeCount = Math.max(0, nextCount);
      setCommentCount(safeCount);
      onCountChange?.(safeCount);
    },
    [onCountChange]
  );

  const bumpCount = useCallback(
    (delta: number) => {
      setCommentCount((previous) => {
        const safeCount = Math.max(0, previous + delta);
        onCountChange?.(safeCount);
        return safeCount;
      });
    },
    [onCountChange]
  );

  const flatComments = useMemo(
    () => sortFlatComments(flattenCommentsForList(comments), selectedFilter),
    [comments, selectedFilter]
  );

  const fetchComments = useCallback(
    async (pageToLoad: number, reset?: boolean) => {
      if (!postId) {
        return;
      }

      const requestId = ++activeRequestRef.current;
      setIsLoading(true);
      try {
        const result = await ApiCall({
          route: `comments/watch/${postId}?page=${pageToLoad}`,
          token,
          verb: 'get',
        });

        if (!isMountedRef.current || requestId !== activeRequestRef.current) {
          return;
        }

        setIsLoading(false);
        setIsRefreshing(false);

        if (result?.status === 200) {
          const nextComments = normalizeCommentTreeFallback(result?.response?.content ?? []);
          if (reset || pageToLoad === 1) {
            setComments(nextComments);
            setIsEndOfList(nextComments.length < 1);
            const loadedCount = countCommentsInTree(nextComments);
            if (loadedCount > commentCountRef.current) {
              setCount(loadedCount);
            }
            return;
          }

          setComments((previous) => normalizeCommentTreeFallback([...previous, ...nextComments]));
          setIsEndOfList(nextComments.length < 1);
          return;
        }

        if (reset || pageToLoad === 1) {
          setComments([]);
          setIsEndOfList(true);
        }
      } catch (_error) {
        if (!isMountedRef.current || requestId !== activeRequestRef.current) {
          return;
        }
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [postId, setCount, token]
  );

  useEffect(() => {
    if (!postId) {
      return;
    }

    setPage(1);
    setIsEndOfList(false);
    setComposerText('');
    setEditingCommentId('');
    setActiveReactionPickerId('');
    setSelectedFilter('relevant');
    fetchComments(1, true);
  }, [fetchComments, postId, sheetOpenKey]);

  useEffect(() => {
    if (page > 1) {
      fetchComments(page);
    }
  }, [fetchComments, page]);

  const refreshComments = useCallback(() => {
    setIsRefreshing(true);
    setIsEndOfList(false);
    setPage(1);
    fetchComments(1, true);
  }, [fetchComments]);

  const createLocalComment = useCallback(
    (payload: any, content: string): CommentPost => {
      const now = new Date();
      const createdDate = toDateFromSource(payload?.created, payload?.createdAt, now);
      const updatedDate = toDateFromSource(payload?.updated, payload?.updatedAt, createdDate);
      const fallbackId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const responseCommentId = getCommentId(payload);
      const id = responseCommentId || fallbackId;

      return {
        _id: payload?._id ?? id,
        commentId: payload?.commentId ?? id,
        dateSeconds: Math.ceil(createdDate.getTime() / 1000),
        date: createdDate.toISOString(),
        objectId: postId,
        objectType: PostType.watch,
        content: payload?.content ?? content,
        userData: payload?.userData ?? {
          _id: user?._id,
          name: user?.name ?? user?.username ?? 'You',
          username: user?.username,
          accountType: user?.accountType,
          profileImage: user?.profileImage,
        },
        images: payload?.images,
        gif: payload?.gif,
        videos: [],
        created: createdDate,
        updated: updatedDate,
        reactions: payload?.reactions ?? [],
        repostCount: Number(payload?.repostCount ?? 0),
        bookmarkCount: Number(payload?.bookmarkCount ?? 0),
        bookmarkedByMe: Boolean(payload?.bookmarkedByMe),
        response: payload?.response ?? [],
        edited: payload?.edited ?? false,
      };
    },
    [postId, user]
  );

  const stopEditing = useCallback(() => {
    setEditingCommentId('');
    setComposerText('');
  }, []);

  const submitComment = useCallback(async () => {
    const value = composerText.trim();
    if (!value || isSubmitting || !postId) {
      return;
    }

    if (editingCommentId) {
      setIsSubmitting(true);
      try {
        const result = await ApiCall({
          route: `comments/watch/${postId}/${editingCommentId}`,
          token,
          verb: 'patch',
          params: {
            content: value,
          },
        });

        if (result?.status === 200) {
          setComments((previous) =>
            updateCommentInTree(previous, editingCommentId, (comment) => ({
              ...comment,
              content: value,
              edited: true,
              updated: new Date(),
            }))
          );
          setComposerText('');
          setEditingCommentId('');
          onTelemetryEvent?.('edit_comment', {
            postType: PostType.watch,
          });
          return;
        }

        toast.show(result?.response?.message ?? 'Unable to update comment right now.', {
          id: 'watchCommentEditError',
          type: 'danger',
          placement: 'bottom',
        });
      } catch (_error) {
        toast.show('Unable to update comment right now.', {
          id: 'watchCommentEditError',
          type: 'danger',
          placement: 'bottom',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await ApiCall({
        route: `comments/watch/${postId}`,
        token,
        verb: 'post',
        params: {
          content: value,
        },
      });

      if (result?.status === 200) {
        const nextComment = createLocalComment(result.response, value);
        setComments((previous) => [nextComment, ...previous]);

        bumpCount(1);
        setComposerText('');
        setEditingCommentId('');
        onTelemetryEvent?.('post_comment', {
          postType: PostType.watch,
        });
        return;
      }

      toast.show(result?.response?.message ?? 'Unable to post comment right now.', {
        id: 'watchCommentPostError',
        type: 'danger',
        placement: 'bottom',
      });
    } catch (_error) {
      toast.show('Unable to post comment right now.', {
        id: 'watchCommentPostError',
        type: 'danger',
        placement: 'bottom',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    bumpCount,
    composerText,
    createLocalComment,
    editingCommentId,
    isSubmitting,
    onTelemetryEvent,
    postId,
    toast,
    token,
  ]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      const previousComments = commentsRef.current;
      const removedResult = removeCommentFromTree(previousComments, commentId);
      if (removedResult.removedCount < 1) {
        return;
      }

      setComments(removedResult.comments);
      bumpCount(-removedResult.removedCount);

      if (editingCommentId === commentId) {
        setEditingCommentId('');
        setComposerText('');
      }

      try {
        const result = await ApiCall({
          route: `comments/watch/${postId}/${commentId}`,
          verb: 'delete',
          token,
        });

        if (result?.status === 200) {
          onTelemetryEvent?.('delete_comment', {
            postType: PostType.watch,
          });
          return;
        }

        setComments(previousComments);
        bumpCount(removedResult.removedCount);
        toast.show(result?.response?.message ?? 'Unable to delete comment right now.', {
          id: 'watchCommentDeleteError',
          type: 'danger',
          placement: 'bottom',
        });
      } catch (_error) {
        setComments(previousComments);
        bumpCount(removedResult.removedCount);
        toast.show('Unable to delete comment right now.', {
          id: 'watchCommentDeleteError',
          type: 'danger',
          placement: 'bottom',
        });
      }
    },
    [bumpCount, editingCommentId, onTelemetryEvent, postId, toast, token]
  );

  const showDeleteConfirmation = useCallback(
    (commentId: string) => {
      Alert.alert('Delete comment', 'This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            handleDeleteComment(commentId).catch(() => undefined);
          },
        },
      ]);
    },
    [handleDeleteComment]
  );

  const openCommentActions = useCallback(
    (comment: CommentPost) => {
      const commentId = getCommentId(comment);
      if (!commentId) {
        return;
      }

      const openEdit = () => {
        setEditingCommentId(commentId);
        setComposerText(comment.content ?? '');
      };
      const openDelete = () => {
        showDeleteConfirmation(commentId);
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Edit', 'Delete'],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 2,
          },
          (index) => {
            if (index === 1) {
              openEdit();
            } else if (index === 2) {
              openDelete();
            }
          }
        );
        return;
      }

      Alert.alert('Comment actions', 'Select an action', [
        {
          text: 'Edit',
          onPress: openEdit,
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: openDelete,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    },
    [showDeleteConfirmation]
  );

  const reactToComment = useCallback(
    async (commentId: string, reactionType?: SocialPostReactionType) => {
      if (!commentId || !user?._id) {
        return;
      }

      const previousComments = commentsRef.current;
      const optimisticComments = applyOptimisticReaction(
        previousComments,
        commentId,
        user._id,
        reactionType
      );

      setComments(optimisticComments);
      setReactingCommentId(commentId);
      setActiveReactionPickerId('');

      try {
        const result = await ApiCall({
          route: `comments/watch/${postId}/${commentId}/reaction`,
          verb: reactionType ? 'patch' : 'delete',
          token,
          params: reactionType ? { type: reactionType } : undefined,
        });

        if (result?.status !== 200) {
          setComments(previousComments);
          toast.show(result?.response?.message ?? 'Unable to update reaction right now.', {
            id: 'watchCommentReactionError',
            type: 'danger',
            placement: 'bottom',
          });
        } else {
          onTelemetryEvent?.('comment_reaction', {
            postType: PostType.watch,
            reactionType,
            commentId,
          });
        }
      } catch (_error) {
        setComments(previousComments);
        toast.show('Unable to update reaction right now.', {
          id: 'watchCommentReactionError',
          type: 'danger',
          placement: 'bottom',
        });
      } finally {
        setReactingCommentId('');
      }
    },
    [onTelemetryEvent, postId, toast, token, user?._id]
  );

  const handleToggleReaction = useCallback(
    (commentId: string, hasReaction: boolean) => {
      reactToComment(commentId, hasReaction ? undefined : SocialPostReactionType.love).catch(
        () => undefined
      );
    },
    [reactToComment]
  );

  const handleSelectReaction = useCallback(
    (commentId: string, reactionType: SocialPostReactionType) => {
      reactToComment(commentId, reactionType).catch(() => undefined);
    },
    [reactToComment]
  );

  const handleToggleBookmark = useCallback(
    async (commentId: string, isBookmarked: boolean) => {
      if (!commentId || !user?._id) {
        return;
      }

      const previousComments = commentsRef.current;
      setComments((previous) =>
        updateCommentInTree(previous, commentId, (comment) => ({
          ...comment,
          bookmarkedByMe: !isBookmarked,
          bookmarkCount: Math.max(0, Number(comment.bookmarkCount ?? 0) + (isBookmarked ? -1 : 1)),
          updated: new Date(),
        }))
      );
      setBookmarkingCommentId(commentId);

      try {
        const result = await ApiCall({
          route: `comments/watch/${postId}/${commentId}/bookmark`,
          verb: isBookmarked ? 'delete' : 'patch',
          token,
        });

        if (result?.status !== 200) {
          setComments(previousComments);
          toast.show(result?.response?.message ?? 'Unable to update bookmark right now.', {
            id: 'watchCommentBookmarkError',
            type: 'danger',
            placement: 'bottom',
          });
        }
      } catch (_error) {
        setComments(previousComments);
        toast.show('Unable to update bookmark right now.', {
          id: 'watchCommentBookmarkError',
          type: 'danger',
          placement: 'bottom',
        });
      } finally {
        setBookmarkingCommentId('');
      }
    },
    [postId, toast, token, user?._id]
  );

  const handleSubmitCommentRepost = useCallback(
    async (comment: CommentPost, withQuote?: boolean) => {
      const commentId = getCommentId(comment);
      if (!commentId) {
        return;
      }

      if (withQuote) {
        onClose();
        setTimeout(() => {
          navigation.navigate('Post', {
            repostDraft: {
              sourceType: 'comment',
              sourceId: commentId,
              sourcePreview: {
                content: comment.content,
              },
            },
          });
        }, 220);
        return;
      }

      setRepostingCommentId(commentId);
      try {
        const result = await ApiCall({
          route: 'social/repost',
          token,
          verb: 'post',
          params: {
            sourceType: 'comment',
            sourceId: commentId,
          },
        });

        if (result?.status === 200) {
          setComments((previous) =>
            updateCommentInTree(previous, commentId, (currentComment) => ({
              ...currentComment,
              repostCount: Number(currentComment.repostCount ?? 0) + 1,
            }))
          );
          return;
        }

        toast.show(result?.response?.message ?? 'Unable to repost right now.', {
          id: 'watchCommentRepostError',
          type: 'danger',
          placement: 'bottom',
        });
      } catch (_error) {
        toast.show('Unable to repost right now.', {
          id: 'watchCommentRepostError',
          type: 'danger',
          placement: 'bottom',
        });
      } finally {
        setRepostingCommentId('');
      }
    },
    [navigation, onClose, toast, token]
  );

  const handleOpenRepostActions = useCallback(
    (comment: CommentPost) => {
      const commentId = getCommentId(comment);
      if (!commentId) {
        return;
      }

      const repostNow = () => {
        handleSubmitCommentRepost(comment, false).catch(() => undefined);
      };
      const quotePost = () => {
        handleSubmitCommentRepost(comment, true).catch(() => undefined);
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Repost', 'Quote'],
            cancelButtonIndex: 0,
          },
          (index) => {
            if (index === 1) {
              repostNow();
            }
            if (index === 2) {
              quotePost();
            }
          }
        );
        return;
      }

      Alert.alert('Repost comment', 'Choose an action', [
        {
          text: 'Repost',
          onPress: repostNow,
        },
        {
          text: 'Quote',
          onPress: quotePost,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    },
    [handleSubmitCommentRepost]
  );

  const handleShowReactionPicker = useCallback((commentId: string) => {
    setActiveReactionPickerId(commentId);
  }, []);

  const handleOpenCommentThread = useCallback(
    (comment: CommentPost) => {
      const commentId = getCommentId(comment);
      if (!commentId || !postId) {
        return;
      }

      setActiveReactionPickerId('');
      onTelemetryEvent?.('open_comment_thread', {
        postType: PostType.watch,
        commentId,
      });
      onClose();

      setTimeout(() => {
        navigation.push('SingleRss', {
          postId,
          postType: PostType.watch,
          threadRootCommentId: commentId,
          threadRootCommentSnapshot: toSerializableCommentSnapshot(comment),
        });
      }, 220);
    },
    [navigation, onClose, onTelemetryEvent, postId]
  );

  const handleScrollBeginDrag = useCallback(() => {
    setActiveReactionPickerId('');
  }, []);

  const handleEndReached = useCallback(() => {
    if (!isLoading && !isRefreshing && !isEndOfList) {
      setPage((previous) => previous + 1);
    }
  }, [isEndOfList, isLoading, isRefreshing]);

  const renderCommentItem = useCallback(
    (info: ListRenderItemInfo<FlatCommentItem>) => {
      const rowItem = info.item;
      return (
        <FlatCommentRow
          item={rowItem}
          currentUserId={user?._id}
          isReacting={reactingCommentId === rowItem.id}
          isReactionPickerVisible={activeReactionPickerId === rowItem.id}
          allowMedia
          backgroundColor={COLORS.bgDark}
          borderColor={COLORS.white10}
          primaryTextColor={COLORS.slate100}
          secondaryTextColor={COLORS.slate400}
          accentColor={COLORS.primary}
          mutedColor={COLORS.slate400}
          onToggleReaction={handleToggleReaction}
          onPressRepost={handleOpenRepostActions}
          onToggleBookmark={(commentId, isBookmarked) => {
            handleToggleBookmark(commentId, isBookmarked).catch(() => undefined);
          }}
          onShowReactionPicker={handleShowReactionPicker}
          onSelectReaction={handleSelectReaction}
          isReposting={repostingCommentId === rowItem.id}
          isBookmarking={bookmarkingCommentId === rowItem.id}
          onActionsPress={openCommentActions}
          onOpenThread={handleOpenCommentThread}
        />
      );
    },
    [
      user?._id,
      reactingCommentId,
      activeReactionPickerId,
      repostingCommentId,
      bookmarkingCommentId,
      handleToggleReaction,
      handleOpenRepostActions,
      handleToggleBookmark,
      handleShowReactionPicker,
      handleSelectReaction,
      openCommentActions,
      handleOpenCommentThread,
    ]
  );

  const canPost = composerText.trim().length > 0 && !isSubmitting;
  let composerPlaceholder = 'Add a comment...';
  if (editingCommentId) {
    composerPlaceholder = 'Edit comment...';
  }

  return (
    <View style={watchStyles.container}>
      <View style={watchStyles.header}>
        <View style={watchStyles.titleRow}>
          <Text style={watchStyles.headerTitle}>Comments</Text>
          <Text style={watchStyles.headerCount}>{commentCount}</Text>
        </View>

        <TouchableOpacity
          style={watchStyles.closeButton}
          onPress={() => {
            setActiveReactionPickerId('');
            onClose();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="close" size={28} color={COLORS.slate100} />
        </TouchableOpacity>
      </View>

      <CommentFilterTabs
        value={selectedFilter}
        onChange={setSelectedFilter}
        backgroundColor={COLORS.bgDark}
        borderColor={COLORS.white10}
        activeColor={COLORS.slate100}
        inactiveColor={COLORS.slate400}
      />

      <BottomSheetFlatList
        data={flatComments}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === 'android'}
        keyExtractor={(item) => item.id}
        contentContainerStyle={watchStyles.listContent}
        refreshing={isRefreshing}
        onRefresh={refreshComments}
        onScrollBeginDrag={handleScrollBeginDrag}
        onEndReachedThreshold={0.8}
        onEndReached={handleEndReached}
        ListEmptyComponent={
          isLoading ? (
            <View style={watchStyles.emptyStateWrap}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (
            <View style={watchStyles.emptyStateWrap}>
              <Text style={watchStyles.emptyStateText}>No comments yet.</Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoading && countCommentsInTree(comments) > 0 ? (
            <View style={watchStyles.loadingMoreWrap}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : null
        }
        renderItem={renderCommentItem}
      />

      <View style={[watchStyles.composerArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {editingCommentId ? (
          <View style={watchStyles.replyingBanner}>
            <Text style={watchStyles.replyingText}>Editing comment</Text>
            <TouchableOpacity
              onPress={() => {
                stopEditing();
              }}
            >
              <MaterialCommunityIcons
                name="close-circle-outline"
                size={16}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={watchStyles.composerRow}>
          <View style={watchStyles.inputAvatarWrap}>
            <Image source={{ uri: currentUserImage }} style={watchStyles.inputAvatar} />
          </View>

          <BottomSheetTextInput
            value={composerText}
            onChangeText={setComposerText}
            style={watchStyles.input}
            placeholder={composerPlaceholder}
            placeholderTextColor={COLORS.slate500}
            multiline
          />

          <TouchableOpacity
            disabled={!canPost}
            onPress={() => {
              submitComment().catch(() => undefined);
            }}
            style={[watchStyles.postButton, !canPost ? watchStyles.postButtonDisabled : undefined]}
          >
            <Text style={watchStyles.postButtonText}>{editingCommentId ? 'Save' : 'Post'}</Text>
          </TouchableOpacity>
        </View>

        <View style={watchStyles.emojiRow}>
          {QUICK_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => {
                setComposerText((previous) => `${previous}${emoji}`);
              }}
            >
              <Text style={watchStyles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

export default WatchComments;
