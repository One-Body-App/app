import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Share,
  StyleProp,
  Pressable,
  View,
  ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import { useNavigation, useTheme } from '@react-navigation/native';
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
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import ParsedText from '@/components/mentions/ParsedText';
import CommentField from './Field';
import CommentFilterTabs from './CommentFilterTabs';
import FlatCommentRow from './FlatCommentRow';
import {
  appendReplyToTree,
  applyOptimisticReaction,
  CommentListFilter,
  FlatCommentItem,
  countCommentsInTree,
  findCommentById,
  fromSerializableCommentSnapshot,
  flattenCommentsForList,
  getCommentId,
  getCommentReplies,
  getCommentTimestampMs,
  normalizeCommentTreeFallback,
  removeCommentFromTree,
  sortFlatComments,
  toDateFromSource,
  updateCommentInTree,
} from './commentListUtils';
import {
  CommentPost,
  PostType,
  SerializableCommentSnapshot,
  SocialPostReactionType,
} from '@/utils/types';
import { formatLocalDate } from '@/src/utils/time';
import {
  queueTaggedNotificationDemo,
  resolveNewTaggedUserIds,
} from '@/src/services/notification/taggedNotificationDispatch';
import type { TaggedMention } from '@/utils/types';

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
  threadRootCommentId?: string;
  threadRootCommentSnapshot?: SerializableCommentSnapshot;
  onOpenCommentThread?: (comment: CommentPost) => void;
  onTelemetryEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
}

type ReplyTarget = {
  id: string;
  name: string;
};

const ONEBODY_APP_BASE_URL = 'https://app.onebodyapp.com';

const isShareDialogDismissed = (result: unknown) => {
  if (!result || typeof result !== 'object') {
    return false;
  }
  const { action } = result as { action?: unknown };
  return typeof action === 'string' && action.toLowerCase().includes('dismiss');
};

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
  if (isLoading) {
    return <ActivityIndicator color={Colors.primary.brand} />;
  }

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
  threadRootCommentId,
  threadRootCommentSnapshot,
  onOpenCommentThread,
  onTelemetryEvent,
}: CommentThreadProps) {
  const navigation = useNavigation<any>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const listRef = useRef<FlatList<any>>(null);
  const activeRequest = useRef(0);
  const isMounted = useRef(true);
  const giphySelectListenerRef = useRef<{ remove: () => void } | null>(null);
  const isGiphyInitializedRef = useRef(false);

  const [comments, setComments] = useState<CommentPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageRef = useRef(1);
  const isEndOfListRef = useRef(false);

  const [editingCommentId, setEditingCommentId] = useState('');
  const [editingSeedText, setEditingSeedText] = useState('');
  const [editingSeedMentions, setEditingSeedMentions] = useState<TaggedMention[]>([]);
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const [mediaGif, setGif] = useState<GiphyMedia | null>(null);
  const [mediaImages, setMediaImages] = useState<string[]>([]);
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);

  const [selectedFilter, setSelectedFilter] = useState<CommentListFilter>('relevant');
  const [activeReactionPickerId, setActiveReactionPickerId] = useState('');
  const [reactingCommentId, setReactingCommentId] = useState('');
  const [repostingCommentId, setRepostingCommentId] = useState('');
  const [bookmarkingCommentId, setBookmarkingCommentId] = useState('');
  const [replyFocusRequestKey] = useState(0);
  const rootToggleReactionRef = useRef<(commentId: string, hasReaction: boolean) => void>(
    () => undefined
  );
  const rootOpenRepostRef = useRef<(comment: CommentPost) => void>(() => undefined);
  const rootToggleBookmarkRef = useRef<(commentId: string, isBookmarked: boolean) => void>(
    () => undefined
  );

  const allowMedia = type === PostType.social || type === PostType.rss;
  const commentsRef = useRef<CommentPost[]>([]);

  const useBrandDarkForSocial = dark;
  let backgroundColor = '#f6f7f8';
  let surfaceColor = '#ffffff';
  let dividerColor = '#e7eaed';
  let primaryTextColor = '#0f1419';
  let secondaryTextColor = '#536471';
  let accentColor = '#12d2d9';
  if (dark && useBrandDarkForSocial) {
    backgroundColor = colors.background;
    surfaceColor = colors.card;
    dividerColor = colors.border;
    primaryTextColor = '#f7f9f9';
    secondaryTextColor = '#71767b';
    accentColor = '#12d2d9';
  } else if (dark) {
    backgroundColor = '#0f1419';
    surfaceColor = '#16181c';
    dividerColor = '#2f3336';
    primaryTextColor = '#f7f9f9';
    secondaryTextColor = '#71767b';
  }

  const keyboardOffset = insets.top + 44;
  const normalizedThreadRootCommentId = threadRootCommentId ? String(threadRootCommentId) : '';
  const isThreadDrillMode = normalizedThreadRootCommentId.length > 0;
  const snapshotRootComment = useMemo(
    () => fromSerializableCommentSnapshot(threadRootCommentSnapshot),
    [threadRootCommentSnapshot]
  );
  const [threadRootShadow, setThreadRootShadow] = useState<CommentPost | undefined>(
    snapshotRootComment
  );
  const [rootHeaderComment, setRootHeaderComment] = useState<CommentPost | undefined>(
    snapshotRootComment
  );
  const hydrateRootHeaderComment = useCallback(
    (rawComment: any, fallback?: CommentPost): CommentPost | undefined => {
      if (!rawComment || typeof rawComment !== 'object') {
        return fallback;
      }

      const rawId = getCommentId(rawComment);
      const fallbackId = getCommentId(fallback);
      const resolvedId = rawId || fallbackId;
      if (!resolvedId) {
        return fallback;
      }

      const createdDate = toDateFromSource(
        rawComment.created,
        rawComment.date,
        fallback?.created ?? new Date()
      );
      const updatedDate = toDateFromSource(
        rawComment.updated,
        rawComment.created,
        fallback?.updated ?? createdDate
      );

      return {
        ...(fallback ?? ({} as CommentPost)),
        ...rawComment,
        _id: rawComment._id ?? resolvedId,
        commentId: resolvedId,
        dateSeconds: Number.isFinite(rawComment.dateSeconds)
          ? Number(rawComment.dateSeconds)
          : Math.ceil(createdDate.getTime() / 1000),
        date: rawComment.date ?? createdDate.toISOString(),
        objectId: rawComment.objectId ?? fallback?.objectId ?? postId,
        objectType: rawComment.objectType ?? fallback?.objectType ?? type,
        content: rawComment.content ?? fallback?.content ?? '',
        mentionedUserIds: Array.isArray(rawComment.mentionedUserIds)
          ? rawComment.mentionedUserIds
          : (fallback?.mentionedUserIds ?? []),
        mentions: Array.isArray(rawComment.mentions) ? rawComment.mentions : fallback?.mentions,
        userData: rawComment.userData ?? fallback?.userData,
        images: Array.isArray(rawComment.images) ? rawComment.images : fallback?.images,
        videos: Array.isArray(rawComment.videos) ? rawComment.videos : fallback?.videos,
        gif: rawComment.gif ?? fallback?.gif,
        created: createdDate,
        updated: updatedDate,
        reactions: Array.isArray(rawComment.reactions)
          ? rawComment.reactions
          : (fallback?.reactions ?? []),
        repostCount:
          typeof rawComment.repostCount === 'number'
            ? rawComment.repostCount
            : Number(fallback?.repostCount ?? 0),
        bookmarkCount:
          typeof rawComment.bookmarkCount === 'number'
            ? rawComment.bookmarkCount
            : Number(fallback?.bookmarkCount ?? 0),
        bookmarkedByMe:
          typeof rawComment.bookmarkedByMe === 'boolean'
            ? rawComment.bookmarkedByMe
            : Boolean(fallback?.bookmarkedByMe),
        response: Array.isArray(rawComment.response)
          ? rawComment.response
          : (fallback?.response ?? []),
        edited:
          typeof rawComment.edited === 'boolean' ? rawComment.edited : Boolean(fallback?.edited),
      };
    },
    [postId, type]
  );
  const rootCommentFromComments = useMemo(
    () =>
      isThreadDrillMode ? findCommentById(comments, normalizedThreadRootCommentId) : undefined,
    [comments, isThreadDrillMode, normalizedThreadRootCommentId]
  );
  const resolvedThreadRootComment =
    rootCommentFromComments ?? threadRootShadow ?? snapshotRootComment;
  const isThreadRootUnavailable = isThreadDrillMode && !resolvedThreadRootComment && !isLoading;
  const drillModeDefaultReplyTarget = useMemo<ReplyTarget | null>(() => {
    if (!isThreadDrillMode || !resolvedThreadRootComment) {
      return null;
    }

    const rootCommentId = getCommentId(resolvedThreadRootComment);
    if (!rootCommentId) {
      return null;
    }

    return {
      id: rootCommentId,
      name: resolvedThreadRootComment.userData?.name ?? 'Unknown',
    };
  }, [isThreadDrillMode, resolvedThreadRootComment]);
  const sourceComments = useMemo(() => {
    if (!isThreadDrillMode) {
      return comments;
    }
    if (!resolvedThreadRootComment) {
      return [];
    }
    return normalizeCommentTreeFallback(getCommentReplies(resolvedThreadRootComment));
  }, [comments, isThreadDrillMode, resolvedThreadRootComment]);

  const flatComments = useMemo(
    () => sortFlatComments(flattenCommentsForList(sourceComments), selectedFilter),
    [selectedFilter, sourceComments]
  );

  const listHeader = useMemo(() => {
    const shouldRenderMainHeader = !isThreadDrillMode && Boolean(header);
    const rootCommentDateLabel = resolvedThreadRootComment
      ? formatLocalDate(new Date(getCommentTimestampMs(resolvedThreadRootComment)))
      : '';
    let drillHeaderContent: React.ReactNode = <ActivityIndicator color={accentColor} />;

    if (resolvedThreadRootComment) {
      const rootCommentId = getCommentId(resolvedThreadRootComment);
      const headerActionComment =
        rootHeaderComment && getCommentId(rootHeaderComment) === rootCommentId
          ? rootHeaderComment
          : resolvedThreadRootComment;
      const rootMyReaction = (headerActionComment.reactions ?? []).find(
        (reaction) => reaction.userId === user?._id
      );
      const rootReactionCount = headerActionComment.reactions?.length ?? 0;
      const rootReplyCount = sourceComments.length;
      const rootRepostCount = Number(headerActionComment.repostCount ?? 0);
      const rootBookmarkedByMe = Boolean(headerActionComment.bookmarkedByMe);
      const rootProfileImage =
        resolvedThreadRootComment.userData?.profileImage &&
        resolvedThreadRootComment.userData.profileImage !== ''
          ? resolvedThreadRootComment.userData.profileImage
          : NO_PROFILE_IMAGE;
      const rootHandle = resolvedThreadRootComment.userData?.username
        ? `@${resolvedThreadRootComment.userData.username}`
        : `@${(resolvedThreadRootComment.userData?.name ?? 'unknown')
            .replace(/\s+/g, '')
            .toLowerCase()}`;
      let rootMeta: React.ReactNode = null;
      rootMeta = (
        <StyledText style={{ marginTop: 2, color: secondaryTextColor, fontSize: 13 }}>
          {rootHandle}
          {rootCommentDateLabel ? ` · ${rootCommentDateLabel}` : ''}
        </StyledText>
      );

      drillHeaderContent = (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <FastImage
            source={{ uri: rootProfileImage }}
            resizeMode="cover"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              marginRight: spacing.x10,
            }}
          />
          <View style={{ flex: 1 }}>
            <StyledText style={{ color: primaryTextColor, fontSize: 18, fontWeight: '700' }}>
              {resolvedThreadRootComment.userData?.name ?? 'Unknown'}
            </StyledText>
            {rootMeta}
            <ParsedText
              style={{
                marginTop: spacing.x8,
                color: primaryTextColor,
                fontSize: 16,
                lineHeight: 22,
              }}
              mentions={resolvedThreadRootComment.mentions}
              text={resolvedThreadRootComment.content ?? ''}
            />
            {resolvedThreadRootComment.edited ? (
              <StyledText
                style={{ marginTop: spacing.x5, color: secondaryTextColor, fontSize: 12 }}
              >
                Edited
              </StyledText>
            ) : null}
            <View
              style={{
                marginTop: spacing.x10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.x16,
              }}
            >
              <Pressable
                disabled={reactingCommentId === rootCommentId || !rootCommentId}
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  if (!rootCommentId) {
                    return;
                  }
                  rootToggleReactionRef.current(rootCommentId, Boolean(rootMyReaction));
                }}
              >
                <MaterialCommunityIcons
                  name={rootMyReaction ? 'heart' : 'heart-outline'}
                  size={22}
                  color={rootMyReaction ? accentColor : secondaryTextColor}
                />
                {rootReactionCount > 0 ? (
                  <StyledText
                    style={{ marginLeft: spacing.x5, color: secondaryTextColor, fontSize: 13 }}
                  >
                    {rootReactionCount}
                  </StyledText>
                ) : null}
              </Pressable>
              <Pressable
                disabled
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => undefined}
              >
                <MaterialCommunityIcons
                  name="comment-outline"
                  size={22}
                  color={secondaryTextColor}
                />
                {rootReplyCount > 0 ? (
                  <StyledText
                    style={{ marginLeft: spacing.x5, color: secondaryTextColor, fontSize: 13 }}
                  >
                    {rootReplyCount}
                  </StyledText>
                ) : null}
              </Pressable>
              <Pressable
                disabled={repostingCommentId === rootCommentId || !rootCommentId}
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  if (!rootCommentId) {
                    return;
                  }
                  rootOpenRepostRef.current(headerActionComment);
                }}
              >
                <MaterialCommunityIcons name="repeat" size={22} color={secondaryTextColor} />
                {rootRepostCount > 0 ? (
                  <StyledText
                    style={{ marginLeft: spacing.x5, color: secondaryTextColor, fontSize: 13 }}
                  >
                    {rootRepostCount}
                  </StyledText>
                ) : null}
              </Pressable>
              <Pressable
                disabled={bookmarkingCommentId === rootCommentId || !rootCommentId}
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  if (!rootCommentId) {
                    return;
                  }
                  rootToggleBookmarkRef.current(rootCommentId, rootBookmarkedByMe);
                }}
              >
                <MaterialCommunityIcons
                  name={rootBookmarkedByMe ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={rootBookmarkedByMe ? accentColor : secondaryTextColor}
                />
              </Pressable>
            </View>
          </View>
        </View>
      );
    } else if (isThreadRootUnavailable) {
      drillHeaderContent = (
        <StyledText style={{ color: secondaryTextColor, fontSize: 14 }}>
          This comment is unavailable.
        </StyledText>
      );
    }

    return (
      <View>
        {shouldRenderMainHeader ? (
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
        ) : null}
        {isThreadDrillMode ? (
          <View
            style={{
              paddingHorizontal: spacing.x16,
              paddingTop: spacing.x16,
              paddingBottom: spacing.x13,
              backgroundColor,
              borderBottomWidth: 1,
              borderBottomColor: dividerColor,
            }}
          >
            {drillHeaderContent}
          </View>
        ) : null}

        <CommentFilterTabs
          value={selectedFilter}
          onChange={setSelectedFilter}
          backgroundColor={backgroundColor}
          borderColor={dividerColor}
          activeColor={primaryTextColor}
          inactiveColor={secondaryTextColor}
        />
      </View>
    );
  }, [
    backgroundColor,
    dividerColor,
    header,
    headerContainerStyle,
    isThreadRootUnavailable,
    isThreadDrillMode,
    primaryTextColor,
    resolvedThreadRootComment,
    reactingCommentId,
    repostingCommentId,
    bookmarkingCommentId,
    user?._id,
    accentColor,
    secondaryTextColor,
    selectedFilter,
    sourceComments.length,
    rootHeaderComment,
  ]);

  const listFooter = useMemo(() => {
    if (isThreadDrillMode || !footer) {
      return null;
    }
    return <View style={{ marginTop: spacing.x13 }}>{footer}</View>;
  }, [footer, isThreadDrillMode]);

  const fetchComments = useCallback(
    async (pageToLoad: number, reset?: boolean) => {
      if (!postId) {
        return;
      }

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
            isEndOfListRef.current = nextComments.length < 1;
            return;
          }

          setComments((previous) => normalizeCommentTreeFallback([...previous, ...nextComments]));
          isEndOfListRef.current = nextComments.length < 1;
          return;
        }

        if (reset || pageToLoad === 1) {
          setComments([]);
          isEndOfListRef.current = true;
        }
      } catch (_error) {
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
    isEndOfListRef.current = false;
    pageRef.current = 1;
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
    pageRef.current = 1;
    isEndOfListRef.current = false;
    setSelectedFilter('relevant');
    setReplyingTo(null);
    setEditingCommentId('');
    setEditingSeedText('');
    setGif(null);
    setMediaImages([]);
    setActiveReactionPickerId('');
    setRepostingCommentId('');
    setBookmarkingCommentId('');
    setThreadRootShadow(snapshotRootComment);
    setRootHeaderComment(snapshotRootComment);
    if (postId) {
      fetchComments(1, true);
    }
  }, [fetchComments, postId, snapshotRootComment, type]);

  useEffect(() => {
    if (!rootCommentFromComments) {
      return;
    }
    setThreadRootShadow(rootCommentFromComments);
  }, [rootCommentFromComments]);

  useEffect(() => {
    if (!isThreadDrillMode || !normalizedThreadRootCommentId) {
      setRootHeaderComment(undefined);
      return;
    }

    const fallbackRootComment = rootCommentFromComments ?? threadRootShadow ?? snapshotRootComment;
    setRootHeaderComment((previous) => {
      const previousId = getCommentId(previous);
      if (previousId && previousId === normalizedThreadRootCommentId) {
        return previous;
      }
      return fallbackRootComment;
    });
  }, [
    isThreadDrillMode,
    normalizedThreadRootCommentId,
    rootCommentFromComments,
    snapshotRootComment,
    threadRootShadow,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (isThreadDrillMode && postId && normalizedThreadRootCommentId) {
      const loadRootHeaderComment = async () => {
        try {
          const result = await ApiCall({
            route: `comments/${type}/${postId}/${normalizedThreadRootCommentId}`,
            token,
            verb: 'get',
          });

          if (cancelled || !isMounted.current) {
            return;
          }
          if (result?.status !== 200 || !result?.response) {
            return;
          }

          const fetchedId = getCommentId(result.response);
          if (fetchedId && fetchedId !== normalizedThreadRootCommentId) {
            return;
          }

          setRootHeaderComment((previous) =>
            hydrateRootHeaderComment(result.response, previous ?? snapshotRootComment)
          );
        } catch (_error) {
          // Keep fallback root header comment state when canonical fetch fails.
        }
      };

      loadRootHeaderComment();
    }
    return () => {
      cancelled = true;
    };
  }, [
    hydrateRootHeaderComment,
    isThreadDrillMode,
    normalizedThreadRootCommentId,
    postId,
    snapshotRootComment,
    token,
    type,
  ]);

  useEffect(() => {
    if (!isThreadDrillMode || !drillModeDefaultReplyTarget) {
      return;
    }

    setReplyingTo((previous) => previous ?? drillModeDefaultReplyTarget);
  }, [drillModeDefaultReplyTarget, isThreadDrillMode]);

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

  const resetReplyTarget = useCallback(() => {
    if (isThreadDrillMode && drillModeDefaultReplyTarget) {
      setReplyingTo(drillModeDefaultReplyTarget);
      return;
    }
    setReplyingTo(null);
  }, [drillModeDefaultReplyTarget, isThreadDrillMode]);

  const clearEditingState = useCallback(() => {
    setEditingCommentId('');
    setEditingSeedText('');
    setEditingSeedMentions([]);
    setGif(null);
    setMediaImages([]);
  }, []);

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
    const handler: GiphyDialogMediaSelectEventHandler = (event) => {
      setGif(event.media);
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

  const createLocalComment = useCallback(
    (payload: any, content: string, mentions: TaggedMention[] = []): CommentPost => {
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
        objectType: type,
        content: payload?.content ?? content,
        mentionedUserIds: payload?.mentionedUserIds ?? [],
        mentions: Array.isArray(payload?.mentions) ? payload.mentions : mentions,
        userData: payload?.userData ?? {
          _id: user?._id,
          name: user?.name ?? user?.username ?? 'You',
          username: user?.username,
          accountType: user?.accountType,
          profileImage: user?.profileImage,
        },
        images: payload?.images ?? (allowMedia ? mediaImages : []),
        gif: payload?.gif ?? (allowMedia ? mediaGif : undefined),
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
    [allowMedia, mediaGif, mediaImages, postId, type, user]
  );

  const publishComment = useCallback(
    async ({
      text,
      mentionedUserIds,
      mentions,
    }: {
      text: string;
      mentionedUserIds: string[];
      mentions: TaggedMention[];
    }) => {
      if (!postId) {
        return false;
      }

      const value = text.trim();
      if (!value && !mediaGif && mediaImages.length < 1) {
        return false;
      }
      const previousMentionedUserIds = editingCommentId
        ? (findCommentById(commentsRef.current, editingCommentId)?.mentionedUserIds ?? [])
        : [];

      if (editingCommentId) {
        const localImageUris = allowMedia ? mediaImages.filter(isLocalImageUri) : [];
        const remoteImageUris = allowMedia
          ? mediaImages.filter((imageUri) => imageUri.startsWith('http'))
          : [];
        const uploadImages = localImageUris.map((uri, index) => toUploadImageFile(uri, index));
        const shouldUploadImages = uploadImages.length > 0;

        try {
          const result = await ApiCall({
            route: `comments/${type}/${postId}/${editingCommentId}`,
            verb: 'patch',
            token,
            params: shouldUploadImages
              ? serialize(
                  {
                    content: value,
                    mentionedUserIds,
                    mentions,
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
                  content: value,
                  mentionedUserIds,
                  mentions,
                  gif: allowMedia ? mediaGif : undefined,
                  images: remoteImageUris.length > 0 ? remoteImageUris : undefined,
                },
            isFormUrlEncode: shouldUploadImages,
          });

          if (result?.status === 200) {
            setComments((previous) =>
              updateCommentInTree(previous, editingCommentId, (comment) => ({
                ...comment,
                content: value,
                mentionedUserIds: result?.response?.mentionedUserIds ?? mentionedUserIds,
                mentions: Array.isArray(result?.response?.mentions)
                  ? result.response.mentions
                  : mentions,
                images: allowMedia ? mediaImages : undefined,
                gif: allowMedia ? (mediaGif ?? undefined) : undefined,
                edited: true,
                updated: new Date(),
              }))
            );
            queueTaggedNotificationDemo({
              notificationType: 'tagged',
              actorId: String(user?._id ?? user?.id ?? user?.userId ?? '').trim(),
              postId,
              postType: 'comment',
              taggedUserIds: resolveNewTaggedUserIds(
                previousMentionedUserIds,
                result?.response?.mentionedUserIds ?? mentionedUserIds
              ),
              commentId: editingCommentId,
            }).catch(() => undefined);
            clearEditingState();
            resetReplyTarget();
            if (onPostRefresh) {
              onPostRefresh();
            }
            onTelemetryEvent?.('post_comment_edit', {
              postType: type,
              commentId: editingCommentId,
            });
            return true;
          }

          toast.show(result?.response?.message ?? 'Unable to update comment right now.', {
            id: 'commentEditError',
            type: 'danger',
            placement: 'bottom',
          });
          return false;
        } catch (_error) {
          toast.show('Unable to update comment right now.', {
            id: 'commentEditError',
            type: 'danger',
            placement: 'bottom',
          });
          return false;
        }
      }

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
                  content: value,
                  mentionedUserIds,
                  mentions,
                  gif: allowMedia ? mediaGif : undefined,
                  images: localUploadImages,
                  parentCommentId: replyingTo?.id,
                  replyToCommentId: replyingTo?.id,
                },
                {
                  noAttributesWithArrayNotation: true,
                  noFilesWithArrayNotation: true,
                }
              )
            : {
                content: value,
                mentionedUserIds,
                mentions,
                gif: allowMedia ? mediaGif : undefined,
                parentCommentId: replyingTo?.id,
                replyToCommentId: replyingTo?.id,
              },
          isFormUrlEncode: shouldUploadImages,
        });

        if (result.status === 200) {
          const optimisticComment = createLocalComment(result.response, value, mentions);

          if (replyingTo?.id) {
            const appendResult = appendReplyToTree(
              commentsRef.current,
              replyingTo.id,
              optimisticComment
            );
            if (appendResult.inserted) {
              setComments(appendResult.comments);
            } else {
              setComments((previous) => [optimisticComment, ...previous]);
            }
          } else {
            setComments((previous) => [optimisticComment, ...previous]);
          }

          setGif(null);
          setMediaImages([]);
          resetReplyTarget();
          if (onPostRefresh) {
            onPostRefresh();
          }
          if (onCommentPublished) {
            onCommentPublished();
          }
          queueTaggedNotificationDemo({
            notificationType: 'tagged',
            actorId: String(user?._id ?? user?.id ?? user?.userId ?? '').trim(),
            postId,
            postType: 'comment',
            taggedUserIds: result?.response?.mentionedUserIds ?? mentionedUserIds,
            commentId:
              String(
                result?.response?.commentId ?? result?.response?._id ?? result?.response?.id ?? ''
              ).trim() || undefined,
          }).catch(() => undefined);
          if (scrollToEndOnPublish) {
            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({ animated: true, offset: 0 });
            });
          }
          onTelemetryEvent?.('post_comment_add', {
            postType: type,
            commentId: getCommentId(optimisticComment),
            parentCommentId: replyingTo?.id,
          });
          return true;
        }

        toast.show(result?.response?.message ?? 'Unable to post comment. Please try again.', {
          id: 'commentPublishError',
          type: 'danger',
          placement: 'bottom',
        });
        return false;
      } catch (_error) {
        toast.show('Unable to post comment. Please try again.', {
          id: 'commentPublishError',
          type: 'danger',
          placement: 'bottom',
        });
        return false;
      }
    },
    [
      allowMedia,
      clearEditingState,
      createLocalComment,
      editingCommentId,
      mediaGif,
      mediaImages,
      onCommentPublished,
      onTelemetryEvent,
      onPostRefresh,
      postId,
      resetReplyTarget,
      replyingTo,
      scrollToEndOnPublish,
      toast,
      token,
      type,
      user,
    ]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      const previousComments = commentsRef.current;
      const removedResult = removeCommentFromTree(previousComments, commentId);
      if (removedResult.removedCount < 1) {
        return;
      }

      setComments(removedResult.comments);

      if (editingCommentId === commentId) {
        clearEditingState();
      }
      if (replyingTo?.id === commentId) {
        resetReplyTarget();
      }

      try {
        const result = await ApiCall({
          route: `comments/${type}/${postId}/${commentId}`,
          verb: 'delete',
          token,
        });

        if (result?.status === 200) {
          if (onPostRefresh) {
            onPostRefresh();
          }
          onTelemetryEvent?.('post_comment_delete', {
            postType: type,
            commentId,
          });
          return;
        }

        setComments(previousComments);
        toast.show(result?.response?.message ?? 'Unable to delete comment right now.', {
          id: 'commentDeleteError',
          type: 'danger',
          placement: 'bottom',
        });
      } catch (_error) {
        setComments(previousComments);
        toast.show('Unable to delete comment right now.', {
          id: 'commentDeleteError',
          type: 'danger',
          placement: 'bottom',
        });
      }
    },
    [
      clearEditingState,
      editingCommentId,
      onTelemetryEvent,
      onPostRefresh,
      postId,
      replyingTo?.id,
      resetReplyTarget,
      toast,
      token,
      type,
    ]
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
        setEditingSeedText(comment.content ?? '');
        setEditingSeedMentions(comment.mentions ?? []);
        setReplyingTo(null);
        setGif(comment.gif ?? null);
        setMediaImages(comment.images ?? []);
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
            }
            if (index === 2) {
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
      if (!postId || !commentId || !user?._id) {
        return;
      }

      const previousComments = commentsRef.current;
      const previousRootShadow = threadRootShadow;
      const previousRootHeaderComment = rootHeaderComment;
      const optimisticComments = applyOptimisticReaction(
        previousComments,
        commentId,
        user._id,
        reactionType
      );

      setComments(optimisticComments);
      setThreadRootShadow((previous) => {
        if (!previous || getCommentId(previous) !== commentId) {
          return previous;
        }
        const filtered = (previous.reactions ?? []).filter(
          (reaction) => reaction.userId !== user._id
        );
        return {
          ...previous,
          reactions: reactionType
            ? [
                ...filtered,
                {
                  type: reactionType,
                  userId: user._id,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ]
            : filtered,
          updated: new Date(),
        };
      });
      setRootHeaderComment((previous) => {
        if (!previous || getCommentId(previous) !== commentId) {
          return previous;
        }
        const filtered = (previous.reactions ?? []).filter(
          (reaction) => reaction.userId !== user._id
        );
        return {
          ...previous,
          reactions: reactionType
            ? [
                ...filtered,
                {
                  type: reactionType,
                  userId: user._id,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ]
            : filtered,
          updated: new Date(),
        };
      });
      setReactingCommentId(commentId);
      setActiveReactionPickerId('');
      try {
        const result = await ApiCall({
          route: `comments/${type}/${postId}/${commentId}/reaction`,
          verb: reactionType ? 'patch' : 'delete',
          token,
          params: reactionType ? { type: reactionType } : undefined,
        });

        if (result.status !== 200) {
          setComments(previousComments);
          setThreadRootShadow(previousRootShadow);
          setRootHeaderComment(previousRootHeaderComment);
          toast.show(result?.response?.message ?? 'Unable to update reaction right now.', {
            id: 'commentReactionError',
            type: 'danger',
            placement: 'bottom',
          });
        } else {
          onTelemetryEvent?.(
            reactionType ? 'post_comment_reaction_add' : 'post_comment_reaction_remove',
            {
              postType: type,
              reactionType,
              commentId,
            }
          );
        }
      } catch (_error) {
        setComments(previousComments);
        setThreadRootShadow(previousRootShadow);
        setRootHeaderComment(previousRootHeaderComment);
        toast.show('Unable to update reaction right now.', {
          id: 'commentReactionError',
          type: 'danger',
          placement: 'bottom',
        });
      } finally {
        setReactingCommentId('');
      }
    },
    [onTelemetryEvent, postId, threadRootShadow, rootHeaderComment, token, toast, type, user?._id]
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
      if (!commentId || !user?._id || !postId) {
        return;
      }

      const previousComments = commentsRef.current;
      const previousRootShadow = threadRootShadow;
      const previousRootHeaderComment = rootHeaderComment;
      setComments((previous) =>
        updateCommentInTree(previous, commentId, (comment) => ({
          ...comment,
          bookmarkedByMe: !isBookmarked,
          bookmarkCount: Math.max(0, Number(comment.bookmarkCount ?? 0) + (isBookmarked ? -1 : 1)),
          updated: new Date(),
        }))
      );
      setThreadRootShadow((previous) => {
        if (!previous || getCommentId(previous) !== commentId) {
          return previous;
        }
        return {
          ...previous,
          bookmarkedByMe: !isBookmarked,
          bookmarkCount: Math.max(0, Number(previous.bookmarkCount ?? 0) + (isBookmarked ? -1 : 1)),
          updated: new Date(),
        };
      });
      setRootHeaderComment((previous) => {
        if (!previous || getCommentId(previous) !== commentId) {
          return previous;
        }
        return {
          ...previous,
          bookmarkedByMe: !isBookmarked,
          bookmarkCount: Math.max(0, Number(previous.bookmarkCount ?? 0) + (isBookmarked ? -1 : 1)),
          updated: new Date(),
        };
      });
      setBookmarkingCommentId(commentId);

      try {
        const result = await ApiCall({
          route: `comments/${type}/${postId}/${commentId}/bookmark`,
          verb: isBookmarked ? 'delete' : 'patch',
          token,
        });

        if (result?.status !== 200) {
          setComments(previousComments);
          setThreadRootShadow(previousRootShadow);
          setRootHeaderComment(previousRootHeaderComment);
          toast.show(result?.response?.message ?? 'Unable to update bookmark right now.', {
            id: 'commentBookmarkError',
            type: 'danger',
            placement: 'bottom',
          });
        }
      } catch (_error) {
        setComments(previousComments);
        setThreadRootShadow(previousRootShadow);
        setRootHeaderComment(previousRootHeaderComment);
        toast.show('Unable to update bookmark right now.', {
          id: 'commentBookmarkError',
          type: 'danger',
          placement: 'bottom',
        });
      } finally {
        setBookmarkingCommentId('');
      }
    },
    [postId, threadRootShadow, rootHeaderComment, toast, token, type, user?._id]
  );

  const handleSubmitCommentRepost = useCallback(
    async (comment: CommentPost, withQuote?: boolean) => {
      const commentId = getCommentId(comment);
      if (!commentId) {
        return;
      }

      if (withQuote) {
        onTelemetryEvent?.('post_quote_create', {
          postType: type,
          commentId,
          sourceType: 'comment',
        });
        navigation.navigate('Post', {
          repostDraft: {
            sourceType: 'comment',
            sourceId: commentId,
            sourcePreview: {
              content: comment.content,
            },
          },
        });
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
          setThreadRootShadow((previous) => {
            if (!previous || getCommentId(previous) !== commentId) {
              return previous;
            }
            return {
              ...previous,
              repostCount: Number(previous.repostCount ?? 0) + 1,
            };
          });
          setRootHeaderComment((previous) => {
            if (!previous || getCommentId(previous) !== commentId) {
              return previous;
            }
            return {
              ...previous,
              repostCount: Number(previous.repostCount ?? 0) + 1,
            };
          });
          onTelemetryEvent?.('post_repost', {
            postType: type,
            commentId,
            sourceType: 'comment',
          });
          return;
        }

        toast.show(result?.response?.message ?? 'Unable to repost right now.', {
          id: 'commentRepostError',
          type: 'danger',
          placement: 'bottom',
        });
      } catch (_error) {
        toast.show('Unable to repost right now.', {
          id: 'commentRepostError',
          type: 'danger',
          placement: 'bottom',
        });
      } finally {
        setRepostingCommentId('');
      }
    },
    [navigation, onTelemetryEvent, toast, token, type]
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

  const handleShareComment = useCallback(
    async (comment: CommentPost) => {
      const commentId = getCommentId(comment);
      if (!commentId || !postId) {
        return;
      }

      const postType = type === PostType.prayer ? PostType.prayer : PostType.social;
      const shareUrl = `${ONEBODY_APP_BASE_URL}/post/${postType}/${postId}?commentId=${encodeURIComponent(commentId)}`;
      onTelemetryEvent?.('post_share_initiated', {
        postType: type,
        commentId,
      });
      try {
        const result = await Share.share({
          title: comment.content ?? '',
          url: Platform.OS === 'ios' ? shareUrl : '',
          message: Platform.OS === 'android' ? shareUrl : shareUrl,
        });
        onTelemetryEvent?.('post_share_completed', {
          postType: type,
          commentId,
          result: isShareDialogDismissed(result) ? 'cancel' : 'success',
        });
      } catch (_error) {
        onTelemetryEvent?.('post_share_completed', {
          postType: type,
          commentId,
          result: 'fail',
        });
      }
    },
    [onTelemetryEvent, postId, type]
  );

  rootToggleReactionRef.current = handleToggleReaction;
  rootOpenRepostRef.current = handleOpenRepostActions;
  rootToggleBookmarkRef.current = (commentId: string, isBookmarked: boolean) => {
    handleToggleBookmark(commentId, isBookmarked).catch(() => undefined);
  };

  const handleShowReactionPicker = useCallback((commentId: string) => {
    setActiveReactionPickerId(commentId);
  }, []);

  const handleRowUserPress = useCallback(
    (userId: string) => {
      if (type === PostType.prayer && Boolean(isPrivate)) {
        return;
      }
      onUserPress?.(userId);
    },
    [isPrivate, onUserPress, type]
  );

  const handleOpenCommentThread = useCallback(
    (comment: CommentPost) => {
      if (!onOpenCommentThread || editingCommentId) {
        return;
      }
      onTelemetryEvent?.('post_comment_open', {
        postType: type,
        commentId: getCommentId(comment),
        origin: 'thread',
      });
      onOpenCommentThread(comment);
    },
    [editingCommentId, onOpenCommentThread, onTelemetryEvent, type]
  );

  const handleScrollBeginDrag = useCallback(() => {
    setActiveReactionPickerId('');
  }, []);

  const handleEndReached = useCallback(() => {
    if (enablePagination && !isLoading && !isRefreshing && !isEndOfListRef.current) {
      const nextPage = pageRef.current + 1;
      pageRef.current = nextPage;
      fetchComments(nextPage);
    }
  }, [enablePagination, fetchComments, isLoading, isRefreshing]);

  const renderCommentItem = useCallback(
    (info: ListRenderItemInfo<FlatCommentItem>) => {
      const rowItem = info.item;
      return (
        <FlatCommentRow
          item={rowItem}
          currentUserId={user?._id}
          isReacting={reactingCommentId === rowItem.id}
          isReactionPickerVisible={activeReactionPickerId === rowItem.id}
          allowMedia={allowMedia}
          backgroundColor={backgroundColor}
          borderColor={dividerColor}
          primaryTextColor={primaryTextColor}
          secondaryTextColor={secondaryTextColor}
          accentColor={accentColor}
          mutedColor={secondaryTextColor}
          onToggleReaction={handleToggleReaction}
          onPressRepost={handleOpenRepostActions}
          onSharePress={!isPrivate ? handleShareComment : undefined}
          onToggleBookmark={(commentId, isBookmarked) => {
            handleToggleBookmark(commentId, isBookmarked).catch(() => undefined);
          }}
          onShowReactionPicker={handleShowReactionPicker}
          onSelectReaction={handleSelectReaction}
          isReposting={repostingCommentId === rowItem.id}
          isBookmarking={bookmarkingCommentId === rowItem.id}
          onActionsPress={openCommentActions}
          onUserPress={handleRowUserPress}
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
      allowMedia,
      backgroundColor,
      dividerColor,
      primaryTextColor,
      secondaryTextColor,
      accentColor,
      handleToggleReaction,
      handleOpenRepostActions,
      handleShareComment,
      handleToggleBookmark,
      handleShowReactionPicker,
      handleSelectReaction,
      openCommentActions,
      handleRowUserPress,
      handleOpenCommentThread,
    ]
  );

  const isAndroid = Platform.OS === 'android';
  const shouldHideComposer = Boolean(
    hideComposer || isThreadRootUnavailable || (isThreadDrillMode && !drillModeDefaultReplyTarget)
  );
  let listBottomPadding = spacing.x16;
  if (!shouldHideComposer && isAndroid) {
    listBottomPadding = spacing.x104;
  }

  const composerKey = `${postId}_${type}_${normalizedThreadRootCommentId || 'root'}_${
    editingCommentId || 'new'
  }_${replyingTo?.id || 'none'}`;

  const content = (
    <>
      <FlatList
        ref={listRef}
        data={flatComments}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === 'android'}
        style={[{ backgroundColor }, listStyle]}
        contentContainerStyle={[
          {
            paddingBottom: listBottomPadding,
            backgroundColor,
          },
          contentContainerStyle,
        ]}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        keyExtractor={(item) => item.id}
        onEndReachedThreshold={0.8}
        onEndReached={handleEndReached}
        onScrollBeginDrag={handleScrollBeginDrag}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              refreshContent();
            }}
          />
        }
        ListEmptyComponent={<CommentThreadEmptyState isLoading={isLoading} />}
        renderItem={renderCommentItem}
      />

      {!shouldHideComposer ? (
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
            key={composerKey}
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
                    resetReplyTarget();
                  }
                : undefined
            }
            focusRequestKey={replyFocusRequestKey}
            text={editingSeedText}
            mentions={editingSeedMentions}
            isEditingComment={Boolean(editingCommentId)}
            setEditingComment={(isEditing) => {
              if (!isEditing) {
                clearEditingState();
                resetReplyTarget();
              }
            }}
            useBrandDarkTheme={useBrandDarkForSocial}
            allowMedia={allowMedia}
            allowImageAttachments={allowMedia}
            onOpenGifPicker={openGifPicker}
            isFromBottomField={false}
          />
        </View>
      ) : null}

      {isLoading && countCommentsInTree(sourceComments) > 0 ? (
        <View style={{ paddingVertical: spacing.x10, alignItems: 'center' }}>
          <ActivityIndicator color={accentColor} />
        </View>
      ) : null}
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor }}
        behavior="padding"
        keyboardVerticalOffset={keyboardOffset}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return <View style={{ flex: 1, backgroundColor }}>{content}</View>;
}

export default CommentThread;
