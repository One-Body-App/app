import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
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
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { timeSince } from '@/utils/ResponsiveFun';
import { CommentPost, PostType, SocialPostReactionType } from '@/utils/types';
import { COLORS, styles } from './commentstyles';

const watchStyles = styles as Record<string, object>;

type ReplyTarget = {
  id: string;
  name: string;
};

type WatchCommentsProps = {
  postId: string;
  initialCommentCount?: number;
  onClose: () => void;
  onCountChange?: (nextCount: number) => void;
  onTelemetryEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
  sheetOpenKey?: number;
};

type CommentTreeUpdateResult = {
  comments: CommentPost[];
  inserted: boolean;
};

type CommentDeleteResult = {
  comments: CommentPost[];
  removedCount: number;
};

type ReactionPickerItem = {
  id: string;
  iconUrl: string;
  type: SocialPostReactionType;
};

const QUICK_EMOJIS = ['🔥', '💪', '👏', '💯', '❤️'];

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';
const REACTION_PICKER_ITEMS: ReactionPickerItem[] = [
  { id: 'pray', iconUrl: `${TWEMOJI_BASE}/1f64f.png`, type: SocialPostReactionType.praying },
  { id: 'praise', iconUrl: `${TWEMOJI_BASE}/1f64c.png`, type: SocialPostReactionType.happy },
  { id: 'like', iconUrl: `${TWEMOJI_BASE}/1f44d.png`, type: SocialPostReactionType.love },
  { id: 'love', iconUrl: `${TWEMOJI_BASE}/2764.png`, type: SocialPostReactionType.love },
  { id: 'haha', iconUrl: `${TWEMOJI_BASE}/1f602.png`, type: SocialPostReactionType.happy },
  { id: 'wow', iconUrl: `${TWEMOJI_BASE}/1f632.png`, type: SocialPostReactionType.happy },
  { id: 'sad', iconUrl: `${TWEMOJI_BASE}/1f622.png`, type: SocialPostReactionType.praying },
  { id: 'angry', iconUrl: `${TWEMOJI_BASE}/1f621.png`, type: SocialPostReactionType.praying },
];

const getCommentId = (comment?: Partial<CommentPost> | null) => {
  const raw = comment?.commentId ?? comment?._id;
  return raw ? String(raw) : '';
};

const getCommentReplies = (comment?: Partial<CommentPost> | null): CommentPost[] => {
  if (!comment) {
    return [];
  }
  const rawReplies = (comment as any)?.response ?? (comment as any)?.replies;
  return Array.isArray(rawReplies) ? (rawReplies as CommentPost[]) : [];
};

const getParentCommentId = (comment?: Partial<CommentPost> | null) => {
  if (!comment) {
    return '';
  }
  const rawParentId =
    (comment as any)?.parentCommentId ??
    (comment as any)?.replyToCommentId ??
    (comment as any)?.parentId ??
    (comment as any)?.parent?._id ??
    (comment as any)?.parent?.commentId ??
    (typeof (comment as any)?.parent === 'string' ? (comment as any)?.parent : undefined);
  return rawParentId ? String(rawParentId) : '';
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
  const hasParentPointers = flattened.some((comment) => getParentCommentId(comment));
  if (!hasParentPointers) {
    return nodes;
  }

  const byId = new Map<string, CommentPost>();
  const ordered: CommentPost[] = [];
  const orphans: CommentPost[] = [];

  flattened.forEach((comment) => {
    const commentId = getCommentId(comment);
    const cloned: CommentPost = {
      ...comment,
      response: [],
    };

    if (!commentId) {
      orphans.push(cloned);
      return;
    }

    if (!byId.has(commentId)) {
      byId.set(commentId, cloned);
      ordered.push(cloned);
    }
  });

  const roots: CommentPost[] = [];
  ordered.forEach((comment) => {
    const commentId = getCommentId(comment);
    const parentId = getParentCommentId(comment);
    const parentComment = parentId ? byId.get(parentId) : undefined;

    if (parentComment && parentId !== commentId) {
      parentComment.response = [...(parentComment.response ?? []), comment];
      return;
    }

    roots.push(comment);
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
      const updated = updater(node);
      return {
        ...updated,
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
): CommentTreeUpdateResult => {
  let inserted = false;

  const comments = nodes.map((node) => {
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
      const nested = appendReplyToTree(currentReplies, targetId, reply);
      if (nested.inserted) {
        inserted = true;
        return {
          ...node,
          response: nested.comments,
        };
      }
    }

    return node;
  });

  return {
    comments,
    inserted,
  };
};

const removeCommentFromTree = (nodes: CommentPost[], targetId: string): CommentDeleteResult => {
  let removedCount = 0;

  const comments = nodes
    .map((node) => {
      const nodeId = getCommentId(node);
      if (nodeId === targetId) {
        removedCount += flattenCommentNodes([node]).length;
        return null;
      }

      const currentReplies = Array.isArray(node.response) ? node.response : [];
      if (currentReplies.length < 1) {
        return node;
      }

      const nested = removeCommentFromTree(currentReplies, targetId);
      if (nested.removedCount < 1) {
        return node;
      }

      removedCount += nested.removedCount;
      return {
        ...node,
        response: nested.comments,
      };
    })
    .filter(Boolean) as CommentPost[];

  return {
    comments,
    removedCount,
  };
};

const toDateFromSource = (firstValue: unknown, secondValue: unknown, fallback: Date) => {
  const firstDate = firstValue ? new Date(String(firstValue)) : null;
  if (firstDate && !Number.isNaN(firstDate.getTime())) {
    return firstDate;
  }
  const secondDate = secondValue ? new Date(String(secondValue)) : null;
  if (secondDate && !Number.isNaN(secondDate.getTime())) {
    return secondDate;
  }
  return fallback;
};

const getCommentTimestamp = (comment: CommentPost): Date => {
  const createdValue =
    (comment as any)?.created ??
    (comment as any)?.createdAt ??
    (comment as any)?.updated ??
    (comment as any)?.updatedAt ??
    comment.date;
  const parsed = createdValue ? new Date(createdValue) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
};

function WatchComments({
  postId,
  initialCommentCount,
  onClose,
  onCountChange,
  onTelemetryEvent,
  sheetOpenKey,
}: WatchCommentsProps) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [comments, setComments] = useState<CommentPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [page, setPage] = useState(1);

  const [composerText, setComposerText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const [editingCommentId, setEditingCommentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeReactionPickerId, setActiveReactionPickerId] = useState('');
  const [reactingCommentId, setReactingCommentId] = useState('');
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
            const loadedCount = flattenCommentNodes(nextComments).length;
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
    setReplyingTo(null);
    setEditingCommentId('');
    setActiveReactionPickerId('');
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
        response: payload?.response ?? [],
        edited: payload?.edited ?? false,
      };
    },
    [postId, user]
  );

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
          setReplyingTo(null);
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
          parentCommentId: replyingTo?.id,
          replyToCommentId: replyingTo?.id,
        },
      });

      if (result?.status === 200) {
        const nextComment = createLocalComment(result.response, value);

        if (replyingTo?.id) {
          const appendResult = appendReplyToTree(commentsRef.current, replyingTo.id, nextComment);
          if (appendResult.inserted) {
            setComments(appendResult.comments);
          } else {
            setComments((previous) => [nextComment, ...previous]);
          }
        } else {
          setComments((previous) => [nextComment, ...previous]);
        }

        bumpCount(1);
        setComposerText('');
        setReplyingTo(null);
        setEditingCommentId('');
        onTelemetryEvent?.('post_comment', {
          postType: PostType.watch,
          isReply: Boolean(replyingTo?.id),
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
    replyingTo,
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
      if (replyingTo?.id === commentId) {
        setReplyingTo(null);
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
    [bumpCount, editingCommentId, onTelemetryEvent, postId, replyingTo?.id, toast, token]
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
        setReplyingTo(null);
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

  const stopEditing = useCallback(() => {
    setEditingCommentId('');
    setComposerText('');
  }, []);

  const composerPlaceholder = useMemo(() => {
    if (editingCommentId) {
      return 'Edit comment...';
    }
    if (replyingTo) {
      return `Reply to ${replyingTo.name}...`;
    }
    return 'Add a comment...';
  }, [editingCommentId, replyingTo]);

  const renderCommentNode = useCallback(
    (comment: CommentPost, depth = 0, nodePath = 'root') => {
      const commentId = getCommentId(comment);
      const nodeKey = commentId || nodePath;
      const replies = Array.isArray(comment.response) ? comment.response : [];
      const isOwnComment = comment.userData?._id && comment.userData._id === user?._id;
      const myReaction = (comment.reactions ?? []).find(
        (reaction) => reaction.userId === user?._id
      );
      const isPickerVisible = activeReactionPickerId === commentId;
      const isEditingThisComment = editingCommentId === commentId;
      const commentTime = `${timeSince(getCommentTimestamp(comment))} ago`;
      const reactionCount = comment.reactions?.length ?? 0;
      const isReacting = reactingCommentId === commentId;
      const hasProfileImage = Boolean(
        comment.userData?.profileImage && comment.userData.profileImage !== ''
      );
      const profileImage = hasProfileImage ? comment.userData.profileImage : NO_PROFILE_IMAGE;

      return (
        <View key={`comment_${nodeKey}`} style={{ marginLeft: depth * 24 }}>
          <View style={watchStyles.commentRow}>
            <Image source={{ uri: profileImage }} style={watchStyles.avatar} />

            <View style={watchStyles.commentContent}>
              <View style={watchStyles.commentHeader}>
                <View style={watchStyles.commentRow}>
                  <Text style={watchStyles.commentName} numberOfLines={1}>
                    {comment.userData?.name ?? 'Unknown'}
                  </Text>
                  <Text style={watchStyles.commentTime}>{commentTime}</Text>
                  {comment.edited ? (
                    <Text style={{ marginLeft: 8, color: COLORS.slate500, fontSize: 11 }}>
                      Edited
                    </Text>
                  ) : null}
                </View>

                {isOwnComment ? (
                  <TouchableOpacity
                    onPress={() => {
                      openCommentActions(comment);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name="dots-horizontal"
                      size={18}
                      color={COLORS.slate500}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={watchStyles.commentText}>{comment.content}</Text>

              <View style={watchStyles.commentActions}>
                <TouchableOpacity
                  disabled={isReacting}
                  onLongPress={() => {
                    if (!commentId) {
                      return;
                    }
                    setActiveReactionPickerId(commentId);
                  }}
                  delayLongPress={180}
                  onPress={() => {
                    if (!commentId) {
                      return;
                    }
                    if (myReaction) {
                      reactToComment(commentId, undefined).catch(() => undefined);
                    } else {
                      reactToComment(commentId, SocialPostReactionType.love).catch(() => undefined);
                    }
                  }}
                  style={watchStyles.reactionAction}
                >
                  <MaterialCommunityIcons
                    name={myReaction ? 'heart' : 'heart-outline'}
                    size={18}
                    color={myReaction ? COLORS.primary : COLORS.slate400}
                  />
                  <Text
                    style={[
                      watchStyles.reactionCount,
                      myReaction ? watchStyles.reactionCountActive : undefined,
                    ]}
                  >
                    {reactionCount}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (!commentId) {
                      return;
                    }
                    if (isEditingThisComment) {
                      return;
                    }
                    setReplyingTo({
                      id: commentId,
                      name: comment.userData?.name ?? 'Unknown',
                    });
                    setEditingCommentId('');
                    onTelemetryEvent?.('reply_comment', {
                      postType: PostType.watch,
                      commentId,
                    });
                  }}
                >
                  <Text style={watchStyles.replyActionText}>Reply</Text>
                </TouchableOpacity>
              </View>

              {isPickerVisible ? (
                <View style={watchStyles.reactionPickerContainer}>
                  {REACTION_PICKER_ITEMS.map((reactionItem) => (
                    <TouchableOpacity
                      key={`${commentId}_${reactionItem.id}`}
                      onPress={() => {
                        if (!commentId) {
                          return;
                        }
                        reactToComment(commentId, reactionItem.type).catch(() => undefined);
                      }}
                      style={watchStyles.reactionPickerButton}
                    >
                      <Image
                        source={{ uri: reactionItem.iconUrl }}
                        style={watchStyles.reactionPickerIcon}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          {replies.length > 0 ? (
            <View style={watchStyles.replyStack}>
              {replies.map((reply, replyIndex) =>
                renderCommentNode(reply, depth + 1, `${nodeKey}_${replyIndex}`)
              )}
            </View>
          ) : null}
        </View>
      );
    },
    [
      activeReactionPickerId,
      editingCommentId,
      onTelemetryEvent,
      openCommentActions,
      reactToComment,
      reactingCommentId,
      user?._id,
    ]
  );

  const canPost = composerText.trim().length > 0 && !isSubmitting;

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
          <MaterialCommunityIcons name="close" size={30} color={COLORS.slate200} />
        </TouchableOpacity>
      </View>

      <BottomSheetFlatList
        data={comments}
        keyExtractor={(item, index) => `${getCommentId(item) || index}`}
        contentContainerStyle={watchStyles.listContent}
        refreshing={isRefreshing}
        onRefresh={refreshComments}
        onScrollBeginDrag={() => {
          setActiveReactionPickerId('');
        }}
        onEndReachedThreshold={0.8}
        onEndReached={() => {
          if (!isLoading && !isRefreshing && !isEndOfList) {
            setPage((previous) => previous + 1);
          }
        }}
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
          isLoading && comments.length > 0 ? (
            <View style={watchStyles.loadingMoreWrap}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : null
        }
        renderItem={({ item }) => renderCommentNode(item)}
      />

      <View style={[watchStyles.composerArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {replyingTo ? (
          <View style={watchStyles.replyingBanner}>
            <Text style={watchStyles.replyingText}>Replying to {replyingTo.name}</Text>
            <TouchableOpacity
              onPress={() => {
                setReplyingTo(null);
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
