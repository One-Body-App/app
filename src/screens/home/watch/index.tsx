import { Image } from 'expo-image';
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Animated,
  TextInput,
  Linking,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { WebView } from 'react-native-webview';

import { useSelector } from 'react-redux';

import { RootState } from '@/src/redux/reducers/rootReducer';

import { ApiCall } from '@/services/api';
import { FeedTypes } from '@/screens/home';

import VideoItem from './VideoItem';
import { WatchPost } from '@/utils/types';
import { flushFeedTelemetry, setFeedTelemetryAuthToken } from '@/services/feedTelemetry';
import {
  createPostTelemetryRequestId,
  maybeTrackQualifiedPostView,
  trackPostTelemetry,
  type CanonicalPostTelemetryEventName,
  type PostTelemetryEventInput,
} from '@/services/postTelemetry';
import { spacing } from '@/src/styles/spacing';
import {
  BRAND_VIDEO_BACKGROUND,
  getWatchVideoLayout,
} from '@/src/components/video/universalVideoLayout';
import useMountEffect from '@/src/hooks/useMountEffect';
import useObservedEffect from '@/src/hooks/useObservedEffect';
import {
  getRecentCompletedWatchUploadsSnapshot,
  mergeRecentCompletedWatchUploads,
  subscribeRecentCompletedWatchUploads,
} from '@/src/services/recentCompletedWatchUploads';
import {
  deleteOwnedPost,
  emitOwnedPostDeleted,
  subscribeToFeedItemUnavailable,
  subscribeToOwnedPostDeleted,
} from '@/services/ownedPostDeletion';

type WatchPortalTab = 'watch' | 'sermons';

type SermonVideo = {
  id: string;
  provider: 'youtube' | 'vimeo';
  providerVideoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  channelId?: string;
  channelName?: string;
  channelUrl?: string;
  publishedAt?: string;
  durationSeconds?: number;
  embedUrl: string;
  sourceUrl: string;
  speaker?: string;
  denomination?: string;
  topics?: string[];
  reactionsCount?: number;
  reactionSummary?: Record<string, number>;
  commentNumber?: number;
  commentsCount?: number;
  hasReacted?: boolean;
  userReaction?: string;
};

type SermonEngagement = {
  id: string;
  hasReacted: boolean;
  userReaction?: string;
  reactionsCount?: number;
  reactionSummary?: Record<string, number>;
  commentNumber?: number;
  commentsCount?: number;
};

type SermonComment = {
  id?: string;
  commentId?: string;
  content: string;
  createdAt?: string;
  created?: string;
  date?: string;
  userData?: {
    _id?: string;
    name?: string;
    username?: string;
    profileImage?: string;
  };
};

type SermonFilters = {
  search: string;
  provider: '' | 'youtube' | 'vimeo';
  channelId: string;
  speaker: string;
  denomination: string;
  topic: string;
  duration: '' | 'short' | 'medium' | 'long';
  publishedRange: '' | 'week' | 'month' | 'year';
  sort: 'recent' | 'oldest' | 'title' | 'confidence';
};

const DEFAULT_SERMON_FILTERS: SermonFilters = {
  search: '',
  provider: '',
  channelId: '',
  speaker: '',
  denomination: '',
  topic: '',
  duration: '',
  publishedRange: '',
  sort: 'recent',
};

const SERMON_PROVIDER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Vimeo', value: 'vimeo' },
] as const;

const SERMON_DURATION_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '< 30m', value: 'short' },
  { label: '30-60m', value: 'medium' },
  { label: '60m+', value: 'long' },
] as const;

const SERMON_RANGE_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'This year', value: 'year' },
] as const;

const SERMON_SORT_OPTIONS = [
  { label: 'Recent', value: 'recent' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Title', value: 'title' },
  { label: 'Confidence', value: 'confidence' },
] as const;

const SERMON_TEXT_FILTERS: {
  key: 'speaker' | 'denomination' | 'topic' | 'channelId';
  label: string;
}[] = [
  { key: 'speaker', label: 'Speaker' },
  { key: 'denomination', label: 'Denomination' },
  { key: 'topic', label: 'Topic' },
  { key: 'channelId', label: 'Channel ID' },
];

const formatSermonDuration = (seconds?: number) => {
  const total = Number(seconds ?? 0);
  if (!Number.isFinite(total) || total <= 0) {
    return '';
  }
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const formatCompactCount = (value?: number) => {
  const count = Number(value ?? 0);
  if (!Number.isFinite(count) || count <= 0) {
    return '0';
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  }
  return String(count);
};

const formatSermonDate = (value?: string) => {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const buildSermonQuery = (filters: SermonFilters, page = 1) => {
  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', '20');
  Object.entries(filters).forEach(([key, value]) => {
    const normalized = String(value ?? '').trim();
    if (normalized) {
      query.set(key, normalized);
    }
  });
  return query.toString();
};

function SermonOptionGroup<T extends string>({
  title,
  options,
  currentValue,
  onChange,
}: {
  title: string;
  options: readonly { label: string; value: T }[];
  currentValue: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.sermonSheetSection}>
      <Text style={styles.sermonSheetTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sermonChipRow}
      >
        {options.map((option) => {
          const selected = currentValue === option.value;
          return (
            <Pressable
              key={`${title}-${option.value || 'all'}`}
              onPress={() => onChange(option.value)}
              style={[styles.sermonChip, selected ? styles.sermonChipActive : null]}
            >
              <Text style={[styles.sermonChipText, selected ? styles.sermonChipTextActive : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const isAllowedSermonPlayerUrl = (rawUrl: string) => {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, '').toLowerCase();
    return (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com' ||
      host === 'player.vimeo.com' ||
      host === 'vimeo.com'
    );
  } catch {
    return false;
  }
};

function Watch({ navigation, route }: any) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const initialPostId = route?.params?.initialPostId
    ? String(route?.params?.initialPostId)
    : undefined;
  const initialPlaybackId = route?.params?.initialPlaybackId;
  const initialWatchPost = route?.params?.initialWatchPost as WatchPost | undefined;
  const [feedData, setFeedData] = useState<WatchPost[]>([]);
  const [page, setPage] = useState<number>(1);
  const [viewHeight, setViewHeight] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasFetchError, setHasFetchError] = useState<boolean>(false);
  const [activePortalTab, setActivePortalTab] = useState<WatchPortalTab>('watch');
  const [sermonItems, setSermonItems] = useState<SermonVideo[]>([]);
  const [sermonFilters, setSermonFilters] = useState<SermonFilters>(DEFAULT_SERMON_FILTERS);
  const [draftSermonFilters, setDraftSermonFilters] =
    useState<SermonFilters>(DEFAULT_SERMON_FILTERS);
  const [sermonPage, setSermonPage] = useState(1);
  const [sermonsHasMore, setSermonsHasMore] = useState(false);
  const [sermonsLoading, setSermonsLoading] = useState(false);
  const [sermonsLoadingMore, setSermonsLoadingMore] = useState(false);
  const [sermonsError, setSermonsError] = useState(false);
  const [activeSermon, setActiveSermon] = useState<SermonVideo | null>(null);
  const [likedSermonIds, setLikedSermonIds] = useState<Set<string>>(() => new Set());
  const [sermonComments, setSermonComments] = useState<SermonComment[]>([]);
  const [sermonCommentsLoading, setSermonCommentsLoading] = useState(false);
  const [sermonCommentText, setSermonCommentText] = useState('');
  const [sermonCommentError, setSermonCommentError] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const sermonFilterSheetRef = useRef<BottomSheetModal>(null);
  const sermonCommentsSheetRef = useRef<BottomSheetModal>(null);
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const { width: screenWidth } = useWindowDimensions();
  const activeWatchTelemetryRef = useRef<{
    postId: string;
    postIndex: number;
    requestId: string;
    startedAt: number;
  } | null>(null);
  const feedDataRef = useRef<WatchPost[]>([]);
  const seenWatchImpressionsRef = useRef<Set<string>>(new Set());
  const telemetryRequestIdRef = useRef(createPostTelemetryRequestId());
  const hasAppliedInitialSelectionRef = useRef(false);
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryScale = useRef(new Animated.Value(0.985)).current;
  const insets = useSafeAreaInsets();
  const sermonSheetSnapPoints = useMemo(() => ['68%', '92%'], []);
  const sermonCommentsSnapPoints = useMemo(() => ['56%', '88%'], []);
  const mergeOptimisticWatchPosts = useCallback(
    (nextPosts: WatchPost[]) =>
      mergeRecentCompletedWatchUploads({
        posts: nextPosts,
        recentUploads: getRecentCompletedWatchUploadsSnapshot(),
        user: currentUser,
      }),
    [currentUser]
  );

  const mergeSermonEngagement = useCallback(
    async (items: SermonVideo[]) => {
      if (!token || items.length < 1) {
        return items;
      }
      const ids = items.flatMap((item) => (item.id ? [item.id] : [])).join(',');
      if (!ids) {
        return items;
      }
      const response = await ApiCall<{ items?: SermonEngagement[] }>({
        route: `watch/sermons/engagement?ids=${encodeURIComponent(ids)}`,
        token,
        verb: 'get',
        suppressErrorLog: true,
      });
      if (response.status !== 200 || !Array.isArray(response.response?.items)) {
        return items;
      }
      const engagementById = new Map(
        response.response.items.map((engagement) => [engagement.id, engagement])
      );
      setLikedSermonIds((previous) => {
        const next = new Set(previous);
        items.forEach((item) => next.delete(item.id));
        response.response.items?.forEach((engagement) => {
          if (engagement.hasReacted) {
            next.add(engagement.id);
          }
        });
        return next;
      });
      return items.map((item) => ({
        ...item,
        ...(engagementById.get(item.id) ?? {}),
      }));
    },
    [token]
  );

  const loadSermons = useCallback(
    async (filters: SermonFilters = sermonFilters, nextPage = 1, append = false) => {
      if (append) {
        setSermonsLoadingMore(true);
      } else {
        setSermonsLoading(true);
      }
      setSermonsError(false);
      try {
        const response = await ApiCall<{
          items?: SermonVideo[];
          data?: SermonVideo[];
          page?: number;
          hasMore?: boolean;
        }>({
          route: `watch/sermons?${buildSermonQuery(filters, nextPage)}`,
          verb: 'get',
        });
        if (response.status === 200) {
          const payload = response.response;
          let items: SermonVideo[] = [];
          if (Array.isArray(payload?.items)) {
            items = payload.items;
          } else if (Array.isArray(payload?.data)) {
            items = payload.data;
          }
          const eligibleItems = items.filter((item) => item?.embedUrl && item?.sourceUrl);
          const engagedItems = await mergeSermonEngagement(eligibleItems);
          setSermonItems((previous) => {
            if (!append) {
              return engagedItems;
            }
            const seen = new Set(previous.map((item) => item.id));
            return [...previous, ...engagedItems.filter((item) => !seen.has(item.id))];
          });
          setSermonPage(Number(payload?.page ?? nextPage));
          setSermonsHasMore(Boolean(payload?.hasMore));
        } else {
          setSermonsError(true);
        }
      } catch {
        setSermonsError(true);
      } finally {
        if (append) {
          setSermonsLoadingMore(false);
        } else {
          setSermonsLoading(false);
        }
      }
    },
    [mergeSermonEngagement, sermonFilters]
  );

  const patchSermonEngagement = useCallback(
    (
      sermonId: string,
      updates: Partial<Pick<SermonVideo, 'reactionsCount' | 'commentsCount' | 'commentNumber'>>
    ) => {
      setSermonItems((previous) =>
        previous.map((sermon) => (sermon.id === sermonId ? { ...sermon, ...updates } : sermon))
      );
      setActiveSermon((previous) =>
        previous?.id === sermonId ? { ...previous, ...updates } : previous
      );
    },
    []
  );

  const loadSermonComments = useCallback(async (sermonId: string) => {
    setSermonCommentsLoading(true);
    setSermonCommentError(false);
    try {
      const response = await ApiCall<{ content?: SermonComment[] }>({
        route: `watch/sermons/${sermonId}/comments?limit=100`,
        verb: 'get',
      });
      if (response.status === 200) {
        setSermonComments(
          Array.isArray(response.response?.content) ? response.response.content : []
        );
      } else {
        setSermonCommentError(true);
      }
    } catch {
      setSermonCommentError(true);
    } finally {
      setSermonCommentsLoading(false);
    }
  }, []);

  const openSermonComments = useCallback(() => {
    if (!activeSermon?.id) {
      return;
    }
    loadSermonComments(activeSermon.id);
    sermonCommentsSheetRef.current?.present();
  }, [activeSermon?.id, loadSermonComments]);

  const toggleSermonReaction = useCallback(async () => {
    if (!activeSermon?.id) {
      return;
    }
    if (!token) {
      Toast.show('Sign in to react to sermons.', Toast.SHORT);
      return;
    }
    const sermonId = activeSermon.id;
    const wasLiked = likedSermonIds.has(sermonId);
    const previousCount = Number(activeSermon.reactionsCount ?? 0);
    const nextCount = Math.max(0, previousCount + (wasLiked ? -1 : 1));

    setLikedSermonIds((previous) => {
      const next = new Set(previous);
      if (wasLiked) {
        next.delete(sermonId);
      } else {
        next.add(sermonId);
      }
      return next;
    });
    patchSermonEngagement(sermonId, { reactionsCount: nextCount });

    const response = await ApiCall<SermonVideo>({
      route: `watch/sermons/${sermonId}/reaction`,
      token,
      verb: wasLiked ? 'delete' : 'patch',
      params: wasLiked ? undefined : { type: 'love' },
      suppressErrorLog: true,
    });

    if (response.status === 200) {
      patchSermonEngagement(sermonId, {
        reactionsCount: Number(response.response?.reactionsCount ?? nextCount),
      });
      return;
    }

    setLikedSermonIds((previous) => {
      const next = new Set(previous);
      if (wasLiked) {
        next.add(sermonId);
      } else {
        next.delete(sermonId);
      }
      return next;
    });
    patchSermonEngagement(sermonId, { reactionsCount: previousCount });
    Toast.show('Unable to update reaction right now.', Toast.SHORT);
  }, [activeSermon, likedSermonIds, patchSermonEngagement, token]);

  const submitSermonComment = useCallback(async () => {
    if (!activeSermon?.id) {
      return;
    }
    if (!token) {
      Toast.show('Sign in to comment on sermons.', Toast.SHORT);
      return;
    }
    const content = sermonCommentText.trim();
    if (!content) {
      return;
    }
    setSermonCommentText('');
    const response = await ApiCall<
      SermonComment & { commentsCount?: number; commentNumber?: number }
    >({
      route: `watch/sermons/${activeSermon.id}/comments`,
      token,
      verb: 'post',
      params: { content },
      suppressErrorLog: true,
    });

    if (response.status !== 200) {
      setSermonCommentText(content);
      Toast.show('Unable to post comment right now.', Toast.SHORT);
      return;
    }

    setSermonComments((previous) => [...previous, response.response]);
    const nextCount = Number(
      response.response?.commentsCount ??
        response.response?.commentNumber ??
        (activeSermon.commentsCount ?? activeSermon.commentNumber ?? 0) + 1
    );
    patchSermonEngagement(activeSermon.id, {
      commentsCount: nextCount,
      commentNumber: nextCount,
    });
  }, [activeSermon, patchSermonEngagement, sermonCommentText, token]);

  const updateDraftSermonFilter = useCallback(
    <K extends keyof SermonFilters>(key: K, value: SermonFilters[K]) => {
      setDraftSermonFilters((previous) => ({ ...previous, [key]: value }));
    },
    []
  );

  const applySermonFilters = useCallback(() => {
    setSermonFilters(draftSermonFilters);
    sermonFilterSheetRef.current?.dismiss();
    loadSermons(draftSermonFilters);
  }, [draftSermonFilters, loadSermons]);

  const resetSermonFilters = useCallback(() => {
    setDraftSermonFilters(DEFAULT_SERMON_FILTERS);
    setSermonFilters(DEFAULT_SERMON_FILTERS);
    loadSermons(DEFAULT_SERMON_FILTERS);
  }, [loadSermons]);

  const loadMoreSermons = useCallback(() => {
    if (sermonsLoading || sermonsLoadingMore || !sermonsHasMore) {
      return;
    }
    loadSermons(sermonFilters, sermonPage + 1, true);
  }, [loadSermons, sermonFilters, sermonPage, sermonsHasMore, sermonsLoading, sermonsLoadingMore]);

  const openSermonFilters = useCallback(() => {
    setDraftSermonFilters(sermonFilters);
    sermonFilterSheetRef.current?.present();
  }, [sermonFilters]);

  const renderSermonBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.68}
        pressBehavior="close"
      />
    ),
    []
  );

  const getWatchPostId = useCallback((post?: WatchPost | null) => {
    if (!post) return null;
    const candidate = post.postId ?? post.id ?? post._id;
    return candidate ? String(candidate) : null;
  }, []);

  const removeWatchPostLocally = useCallback(
    (postId: string) => {
      let removedPost: WatchPost | undefined;
      let removedIndex = -1;

      setFeedData((previous) => {
        removedIndex = previous.findIndex((post) => getWatchPostId(post) === postId);
        if (removedIndex < 0) {
          return previous;
        }

        removedPost = previous[removedIndex];
        const nextPosts = previous.filter((_, currentIndex) => currentIndex !== removedIndex);
        setIndex((currentIndex) => {
          if (nextPosts.length < 1) {
            return 0;
          }
          if (currentIndex > removedIndex) {
            return currentIndex - 1;
          }
          return Math.min(currentIndex, nextPosts.length - 1);
        });
        return nextPosts;
      });

      return { removedPost, removedIndex };
    },
    [getWatchPostId]
  );

  const restoreWatchPostLocally = useCallback((post: WatchPost, atIndex: number) => {
    setFeedData((previous) => {
      const restored = [...previous];
      restored.splice(Math.min(atIndex, restored.length), 0, post);
      return restored;
    });
    setIndex((currentIndex) => (atIndex <= currentIndex ? currentIndex + 1 : currentIndex));
  }, []);

  const latestMergeOptimisticWatchPostsRef = useRef(mergeOptimisticWatchPosts);
  const latestRemoveWatchPostLocallyRef = useRef(removeWatchPostLocally);

  const normalizeTelemetryTags = useCallback((value: unknown): string[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object') {
          const candidate = item as { name?: string; _id?: string | number; id?: string | number };
          return (
            candidate.name ??
            (candidate._id !== undefined ? String(candidate._id) : undefined) ??
            (candidate.id !== undefined ? String(candidate.id) : undefined)
          );
        }
        return undefined;
      })
      .filter((item): item is string => Boolean(item))
      .slice(0, 32);
  }, []);

  const buildWatchTelemetryContext = useCallback(
    (post: WatchPost | null | undefined, postIndex: number) => {
      const postId = getWatchPostId(post);
      if (!postId) {
        return null;
      }

      return {
        postId,
        postType: 'watch',
        contentType: 'watch',
        authorId: post?.userData?._id,
        tags: normalizeTelemetryTags((post as { tags?: unknown } | undefined)?.tags),
        userId: currentUser?._id ? String(currentUser._id) : undefined,
        surface: 'watch' as const,
        surfaceTab: 'watch',
        entrypoint: initialPlaybackId || initialPostId ? 'watch_feed_deeplink' : 'watch_feed',
        requestId: telemetryRequestIdRef.current,
        rankPosition: postIndex,
        isOwnPost:
          Boolean(currentUser?._id) && Boolean(post?.userData?._id)
            ? String(post?.userData?._id) === String(currentUser?._id)
            : undefined,
        isRepost: Boolean((post as { repost?: unknown } | undefined)?.repost),
        privacyState: (post as { private?: boolean } | undefined)?.private ? 'private' : 'public',
      };
    },
    [currentUser?._id, getWatchPostId, initialPlaybackId, initialPostId, normalizeTelemetryTags]
  );

  const trackWatchTelemetryEvent = useCallback(
    (
      post: WatchPost | null | undefined,
      postIndex: number,
      eventName: CanonicalPostTelemetryEventName,
      metadata?: Record<string, unknown>,
      overrides?: Partial<PostTelemetryEventInput>
    ) => {
      const context = buildWatchTelemetryContext(post, postIndex);
      if (!context) {
        return;
      }

      trackPostTelemetry({
        ...context,
        ...overrides,
        eventName,
        metadata: {
          source: 'watch_feed',
          ...(metadata ?? {}),
          ...(overrides?.metadata ?? {}),
        },
      });
    },
    [buildWatchTelemetryContext]
  );

  const trackWatchImpression = useCallback(
    (post: WatchPost | null, postIndex: number) => {
      const context = buildWatchTelemetryContext(post, postIndex);
      if (!context) {
        return;
      }
      const telemetryKey = `${context.requestId}:${context.postId}`;
      if (seenWatchImpressionsRef.current.has(telemetryKey)) {
        return;
      }
      seenWatchImpressionsRef.current.add(telemetryKey);
      trackWatchTelemetryEvent(post, postIndex, 'post_impression');
    },
    [buildWatchTelemetryContext, trackWatchTelemetryEvent]
  );

  const finalizeWatchDwell = useCallback(
    (reason: 'index_change' | 'unmount' | 'refresh' = 'index_change') => {
      const activeTelemetry = activeWatchTelemetryRef.current;
      if (!activeTelemetry) {
        return;
      }
      activeWatchTelemetryRef.current = null;
      const activePost = feedDataRef.current[activeTelemetry.postIndex] ?? null;
      const dwellTimeMs = Date.now() - activeTelemetry.startedAt;
      if (!activeTelemetry.postId || dwellTimeMs < 1200) {
        return;
      }

      trackWatchTelemetryEvent(
        activePost,
        activeTelemetry.postIndex,
        'post_dwell',
        { reason },
        {
          requestId: activeTelemetry.requestId,
          dwellMs: dwellTimeMs,
        }
      );
      maybeTrackQualifiedPostView(
        {
          ...(buildWatchTelemetryContext(activePost, activeTelemetry.postIndex) ?? {
            postId: activeTelemetry.postId,
            postType: 'watch',
            surface: 'watch' as const,
          }),
          requestId: activeTelemetry.requestId,
        },
        dwellTimeMs,
        { reason, source: 'watch_feed' }
      );
    },
    [buildWatchTelemetryContext, trackWatchTelemetryEvent]
  );

  const getFeedData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (page === 1) {
        finalizeWatchDwell('refresh');
        telemetryRequestIdRef.current = createPostTelemetryRequestId();
        seenWatchImpressionsRef.current.clear();
      }
      const res = await ApiCall({
        route: `user/get-following-feed/${FeedTypes.Watch}/${page}${
          page === 1 ? `?refresh=${Date.now()}` : ''
        }`,
        token,
        verb: 'get',
      });

      if (res?.status === 200) {
        setHasFetchError(false);
        const feedPosts = res.response
          .filter((i: any) => !!i?.playBackId)
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created);
            const dateB = new Date(b.created);
            return dateB.getTime() - dateA.getTime(); // Newest first
          });
        const mergedFeedPosts = mergeOptimisticWatchPosts(feedPosts);

        if (page === 1) {
          let initialFeedData = mergedFeedPosts ?? [];
          if (initialWatchPost?.playBackId) {
            const initialWatchPostId =
              initialWatchPost.postId ?? initialWatchPost.id ?? initialWatchPost._id;
            const isInitialPostInFeed = initialFeedData.some(
              (post: { playBackId: any; postId: any; id: any; _id: any }) => {
                if (initialPlaybackId && post.playBackId === initialPlaybackId) {
                  return true;
                }
                if (!initialPostId && !initialWatchPostId) {
                  return false;
                }
                const currentPostId = post.postId ?? post.id ?? post._id;
                return String(currentPostId) === String(initialPostId ?? initialWatchPostId);
              }
            );
            if (!isInitialPostInFeed) {
              initialFeedData = [initialWatchPost, ...initialFeedData];
            }
          }
          setFeedData(initialFeedData);
        } else {
          setFeedData((previous) =>
            mergeOptimisticWatchPosts(
              [...previous, ...(feedPosts ?? [])].sort((a: any, b: any) => {
                const dateA = new Date(a.created);
                const dateB = new Date(b.created);
                return dateB.getTime() - dateA.getTime(); // Newest first
              })
            )
          );
        }
      } else {
        // console.log('error', res?.response);
        setFeedData([]);
        setHasFetchError(true);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    } catch (e: any) {
      setFeedData([]);
      setHasFetchError(true);
      setIsLoading(false);
      setIsRefreshing(false);
      // console.log('watch feed error -- ', e.toString());
    }
  }, [
    finalizeWatchDwell,
    initialPlaybackId,
    initialPostId,
    initialWatchPost,
    mergeOptimisticWatchPosts,
    page,
    token,
  ]);

  useObservedEffect(() => {
    feedDataRef.current = feedData;
  }, [feedData]);

  useObservedEffect(() => {
    // getData(page);
    if (isRefreshing) {
      if (page === 1) {
        getFeedData();
      } else {
        setPage(1);
      }
    }
  }, [getFeedData, isRefreshing, page]);

  useObservedEffect(() => {
    setFeedTelemetryAuthToken(token || undefined);
  }, [token]);

  // const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
  //   console.log(viewableItems, 'viewableItems');
  //   if (viewableItems && viewableItems.length > 0) {
  //     const { index } = viewableItems[0];
  //     setActiveWatchReel(index);
  //   }
  // }).current;

  useObservedEffect(() => {
    if (isRefreshing) {
      return;
    }

    getFeedData();
  }, [getFeedData, isRefreshing, page]);

  useFocusEffect(
    useCallback(() => {
      setIsRefreshing(true);
    }, [])
  );

  useMountEffect(() => {
    loadSermons(DEFAULT_SERMON_FILTERS);
  });

  useObservedEffect(() => {
    if (!token) {
      setLikedSermonIds(new Set());
      return;
    }
    if (sermonItems.length < 1) {
      return;
    }
    mergeSermonEngagement(sermonItems)
      .then(setSermonItems)
      .catch(() => undefined);
  }, [token]);

  useObservedEffect(() => {
    latestMergeOptimisticWatchPostsRef.current = mergeOptimisticWatchPosts;
  }, [mergeOptimisticWatchPosts]);

  useObservedEffect(() => {
    latestRemoveWatchPostLocallyRef.current = removeWatchPostLocally;
  }, [removeWatchPostLocally]);

  useMountEffect(() => {
    return subscribeRecentCompletedWatchUploads(() => {
      setFeedData((previous) => latestMergeOptimisticWatchPostsRef.current(previous));
    });
  });

  useMountEffect(() => {
    const removeWatchLocally = ({ type, id }: { type: string; id: string }) => {
      if (type !== 'watch') {
        return;
      }
      latestRemoveWatchPostLocallyRef.current(id);
    };

    const unsubscribeOwned = subscribeToOwnedPostDeleted(removeWatchLocally);
    const unsubscribeUnavailable = subscribeToFeedItemUnavailable(removeWatchLocally);

    return () => {
      unsubscribeOwned();
      unsubscribeUnavailable();
    };
  });

  useObservedEffect(() => {
    hasAppliedInitialSelectionRef.current = false;
  }, [initialPlaybackId, initialPostId]);

  const [index, setIndex] = React.useState(0);
  const opacity = React.useRef(new Animated.Value(1)).current;
  const onMomentumScrollEnd = ({ nativeEvent }: any) => {
    const newIndex = Math.round(nativeEvent.contentOffset.y / viewHeight);

    if (newIndex !== index && newIndex < feedData.length && newIndex >= 0) {
      finalizeWatchDwell('index_change');
      opacity.setValue(0);
      setIndex(newIndex);
    }
  };

  useObservedEffect(() => {
    if (hasAppliedInitialSelectionRef.current) {
      return;
    }
    if (!feedData.length || viewHeight <= 1) {
      return;
    }

    if (!initialPlaybackId && !initialPostId) {
      hasAppliedInitialSelectionRef.current = true;
      return;
    }

    const targetIndex = feedData.findIndex((post) => {
      if (initialPlaybackId && post.playBackId === initialPlaybackId) {
        return true;
      }
      if (!initialPostId) {
        return false;
      }
      const postId = post.postId ?? post.id ?? post._id;
      return String(postId) === initialPostId;
    });
    const nextIndex = targetIndex >= 0 ? targetIndex : 0;
    setIndex(nextIndex);
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: nextIndex * viewHeight, animated: false });
    });
    hasAppliedInitialSelectionRef.current = true;
  }, [feedData, initialPlaybackId, initialPostId, viewHeight]);

  useObservedEffect(() => {
    const activePost = feedData[index];
    const context = buildWatchTelemetryContext(activePost, index);
    if (!context) {
      finalizeWatchDwell('refresh');
      return;
    }

    const activeTelemetry = activeWatchTelemetryRef.current;
    if (
      activeTelemetry?.postId === context.postId &&
      activeTelemetry.requestId === context.requestId &&
      activeTelemetry.postIndex === index
    ) {
      return;
    }

    finalizeWatchDwell('index_change');
    activeWatchTelemetryRef.current = {
      postId: context.postId,
      postIndex: index,
      requestId: context.requestId ?? telemetryRequestIdRef.current,
      startedAt: Date.now(),
    };
    trackWatchImpression(activePost, index);
  }, [buildWatchTelemetryContext, feedData, finalizeWatchDwell, index, trackWatchImpression]);

  useObservedEffect(() => {
    entryOpacity.setValue(0);
    entryScale.setValue(0.985);
    Animated.parallel([
      Animated.timing(entryOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(entryScale, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entryOpacity, entryScale, index]);

  useMountEffect(() => {
    return () => {
      finalizeWatchDwell('unmount');
      flushFeedTelemetry(token || undefined).catch(() => undefined);
    };
  });

  const handleRemoveWatchPost = useCallback(
    async (type: string, id: string) => {
      const normalizedId = String(id ?? '').trim();
      if (normalizedId.length < 1) {
        Toast.show('Unable to delete this post right now.', Toast.SHORT);
        return;
      }

      const { removedPost, removedIndex } = removeWatchPostLocally(normalizedId);
      const result = await deleteOwnedPost({
        type,
        id: normalizedId,
        token: token ?? undefined,
      });

      if (!result.ok) {
        if (removedPost && removedIndex >= 0) {
          restoreWatchPostLocally(removedPost, removedIndex);
        }
        Toast.show(result.message || 'Unable to delete this post right now.', Toast.SHORT);
        return;
      }

      emitOwnedPostDeleted({
        type: result.type,
        id: normalizedId,
      });
      setIsRefreshing(true);
    },
    [removeWatchPostLocally, restoreWatchPostLocally, token]
  );

  const shouldShowInitialLoader = isLoading && page === 1 && !isRefreshing;
  const shouldShowWatchFeed = !shouldShowInitialLoader && feedData.length > 0;
  const shouldShowEmptyState = !isLoading && !hasFetchError && feedData.length < 1;
  const shouldShowErrorState = !isLoading && hasFetchError && feedData.length < 1;

  return (
    <View
      style={{ flex: 1, backgroundColor: '#0D0D0D' }}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        setViewHeight(height);
      }}
    >
      <Pressable
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
            return;
          }
          navigation.navigate('MainRoot', { screen: 'Main', params: { screen: 'HomeTab' } });
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{
          position: 'absolute',
          top: insets.top + spacing.x10,
          left: spacing.x16,
          zIndex: 40,
        }}
      >
        <MaterialIcons name="chevron-left" size={40} color="#FFFFFF" />
      </Pressable>
      <View style={[styles.portalTabs, { top: insets.top + spacing.x10 }]}>
        {[
          { label: 'Watch', value: 'watch' as const },
          { label: 'Sermons', value: 'sermons' as const },
        ].map((tab) => {
          const selected = activePortalTab === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => setActivePortalTab(tab.value)}
              style={[styles.portalTab, selected ? styles.portalTabActive : null]}
            >
              <Text style={[styles.portalTabText, selected ? styles.portalTabTextActive : null]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activePortalTab === 'sermons' ? (
        <View style={[styles.sermonScreen, { paddingTop: insets.top + 70 }]}>
          <View style={styles.sermonHeader}>
            <View>
              <Text style={styles.sermonHeaderTitle}>Sermons</Text>
              <Text style={styles.sermonHeaderSubtitle}>
                Public messages from approved YouTube and Vimeo sources.
              </Text>
            </View>
            <Pressable onPress={openSermonFilters} style={styles.sermonFilterButton}>
              <MaterialIcons name="tune" size={20} color="#FFFFFF" />
              <Text style={styles.sermonFilterText}>Filter</Text>
            </Pressable>
          </View>

          {sermonsLoading ? (
            <View style={styles.feedStateContainer}>
              <ActivityIndicator size="large" color="#12d2d9" />
              <Text style={styles.feedStateTitle}>Loading sermons</Text>
            </View>
          ) : sermonsError ? (
            <View style={styles.feedStateContainer}>
              <MaterialIcons name="wifi-off" size={56} color="rgba(255,255,255,0.25)" />
              <Text style={styles.feedStateTitle}>Could not load sermons</Text>
              <Text style={styles.feedStateBody}>Check your connection and try again.</Text>
              <Pressable
                onPress={() => loadSermons(sermonFilters)}
                style={styles.feedStateRetryButton}
              >
                <Text style={styles.feedStateRetryLabel}>Try again</Text>
              </Pressable>
            </View>
          ) : sermonItems.length < 1 ? (
            <View style={styles.feedStateContainer}>
              <MaterialIcons name="ondemand-video" size={56} color="rgba(255,255,255,0.25)" />
              <Text style={styles.feedStateTitle}>No sermons yet</Text>
              <Text style={styles.feedStateBody}>
                Approved sermons from public video sources will show up here.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.sermonList}
              contentContainerStyle={styles.sermonListContent}
              showsVerticalScrollIndicator={false}
            >
              {sermonItems.map((sermon) => {
                const duration = formatSermonDuration(sermon.durationSeconds);
                const date = formatSermonDate(sermon.publishedAt);
                const reactions = Number(sermon.reactionsCount ?? 0);
                const comments = Number(sermon.commentsCount ?? sermon.commentNumber ?? 0);
                return (
                  <Pressable
                    key={sermon.id}
                    onPress={() => setActiveSermon(sermon)}
                    style={styles.sermonCard}
                  >
                    <View style={styles.sermonThumb}>
                      {sermon.thumbnailUrl ? (
                        <Image
                          source={{ uri: sermon.thumbnailUrl }}
                          style={StyleSheet.absoluteFillObject}
                          contentFit="cover"
                        />
                      ) : (
                        <MaterialIcons
                          name="ondemand-video"
                          size={30}
                          color="rgba(255,255,255,0.55)"
                        />
                      )}
                      {duration ? <Text style={styles.sermonDuration}>{duration}</Text> : null}
                    </View>
                    <View style={styles.sermonCardBody}>
                      <View style={styles.sermonProviderRow}>
                        <Text style={styles.sermonProviderPill}>{sermon.provider}</Text>
                        {sermon.denomination ? (
                          <Text style={styles.sermonTopicPill}>{sermon.denomination}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.sermonTitle} numberOfLines={2}>
                        {sermon.title || 'Untitled sermon'}
                      </Text>
                      <Text style={styles.sermonMeta} numberOfLines={1}>
                        {sermon.speaker || sermon.channelName || 'Unknown speaker'}
                        {date ? ` · ${date}` : ''}
                      </Text>
                      {Array.isArray(sermon.topics) && sermon.topics.length > 0 ? (
                        <Text style={styles.sermonTopics} numberOfLines={1}>
                          {sermon.topics.slice(0, 4).join(' · ')}
                        </Text>
                      ) : null}
                      <View style={styles.sermonEngagementRow}>
                        <View style={styles.sermonEngagementStat}>
                          <MaterialIcons name="favorite" size={14} color="rgba(255,255,255,0.62)" />
                          <Text style={styles.sermonEngagementText}>
                            {formatCompactCount(reactions)}
                          </Text>
                        </View>
                        <View style={styles.sermonEngagementStat}>
                          <MaterialIcons
                            name="chat-bubble-outline"
                            size={14}
                            color="rgba(255,255,255,0.62)"
                          />
                          <Text style={styles.sermonEngagementText}>
                            {formatCompactCount(comments)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
              {sermonsHasMore ? (
                <Pressable
                  onPress={loadMoreSermons}
                  disabled={sermonsLoadingMore}
                  style={styles.sermonLoadMoreButton}
                >
                  {sermonsLoadingMore ? (
                    <ActivityIndicator color="#032f3c" />
                  ) : (
                    <Text style={styles.sermonLoadMoreText}>Load more</Text>
                  )}
                </Pressable>
              ) : null}
            </ScrollView>
          )}
        </View>
      ) : null}

      {activePortalTab === 'watch' && shouldShowEmptyState ? (
        <View style={styles.feedStateContainer}>
          <MaterialIcons name="videocam-off" size={56} color="rgba(255,255,255,0.25)" />
          <Text style={styles.feedStateTitle}>Nothing to watch yet</Text>
          <Text style={styles.feedStateBody}>Follow others to see their Watch posts here.</Text>
        </View>
      ) : null}
      {activePortalTab === 'watch' && shouldShowErrorState ? (
        <View style={styles.feedStateContainer}>
          <MaterialIcons name="wifi-off" size={56} color="rgba(255,255,255,0.25)" />
          <Text style={styles.feedStateTitle}>Could not load videos</Text>
          <Text style={styles.feedStateBody}>Check your connection and try again.</Text>
          <Pressable onPress={() => setIsRefreshing(true)} style={styles.feedStateRetryButton}>
            <Text style={styles.feedStateRetryLabel}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
      {activePortalTab === 'watch' && shouldShowInitialLoader ? (
        <View style={{ marginTop: 10 }}>
          <ActivityIndicator size="small" />
        </View>
      ) : null}
      {activePortalTab === 'watch' && shouldShowWatchFeed ? (
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          pagingEnabled
          scrollEnabled={isScrollEnable}
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {feedData.map((i) => {
            const layout = getWatchVideoLayout(screenWidth, viewHeight, i);
            return (
              <View
                key={`watch-placeholder-${i.postId ?? i.id ?? i._id ?? i.playBackId}`}
                style={[styles.item, { height: viewHeight }]}
              >
                <View
                  style={{
                    width: screenWidth,
                    height: viewHeight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: layout.backgroundColor,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    resizeMode={layout.resizeMode}
                    style={{ width: layout.frameWidth, height: layout.frameHeight }}
                    source={{
                      uri: `https://image.mux.com/${i.playBackId}/thumbnail.webp?width=${Math.round(layout.frameWidth)}&height=${Math.round(layout.frameHeight)}`,
                    }}
                  />
                </View>
              </View>
            );
          })}

          {feedData[index] ? (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  height: viewHeight,
                  flex: 1,
                  top: index * viewHeight,
                  opacity: entryOpacity,
                  transform: [{ scale: entryScale }],
                },
              ]}
            >
              <VideoItem
                currentIndex={index}
                item={feedData[index]}
                viewHeight={viewHeight}
                frameWidth={screenWidth}
                fromSavedPosts={false}
                removePost={handleRemoveWatchPost}
                onTelemetryEvent={(eventType, metadata) => {
                  const post = feedData[index];
                  trackWatchTelemetryEvent(
                    post,
                    index,
                    eventType as CanonicalPostTelemetryEventName,
                    metadata
                  );
                }}
                onShowDismissCard={(e?: boolean) => {
                  setIsScrollEnable(!e);
                }}
              />
            </Animated.View>
          ) : null}
        </ScrollView>
      ) : null}

      <BottomSheetModal
        ref={sermonFilterSheetRef}
        snapPoints={sermonSheetSnapPoints}
        backdropComponent={renderSermonBackdrop}
        backgroundStyle={styles.sermonSheetBackground}
        handleIndicatorStyle={styles.sermonSheetHandle}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sermonSheetContent}>
          <Text style={styles.sermonSheetHeading}>Sermon filters</Text>
          <View style={styles.sermonInputWrap}>
            <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.55)" />
            <TextInput
              value={draftSermonFilters.search}
              onChangeText={(value) => updateDraftSermonFilter('search', value)}
              placeholder="Search sermons"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.sermonSheetInput}
            />
          </View>
          <SermonOptionGroup
            title="Provider"
            options={SERMON_PROVIDER_OPTIONS}
            currentValue={draftSermonFilters.provider}
            onChange={(value) => updateDraftSermonFilter('provider', value)}
          />
          <SermonOptionGroup
            title="Duration"
            options={SERMON_DURATION_OPTIONS}
            currentValue={draftSermonFilters.duration}
            onChange={(value) => updateDraftSermonFilter('duration', value)}
          />
          <SermonOptionGroup
            title="Published"
            options={SERMON_RANGE_OPTIONS}
            currentValue={draftSermonFilters.publishedRange}
            onChange={(value) => updateDraftSermonFilter('publishedRange', value)}
          />
          <SermonOptionGroup
            title="Sort"
            options={SERMON_SORT_OPTIONS}
            currentValue={draftSermonFilters.sort}
            onChange={(value) => updateDraftSermonFilter('sort', value)}
          />
          <View style={styles.sermonSheetGrid}>
            {SERMON_TEXT_FILTERS.map(({ key, label }) => (
              <View key={key} style={styles.sermonInputWrap}>
                <TextInput
                  value={draftSermonFilters[key]}
                  onChangeText={(value) => updateDraftSermonFilter(key, value)}
                  placeholder={label}
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  style={styles.sermonSheetInput}
                />
              </View>
            ))}
          </View>
          <View style={styles.sermonSheetActions}>
            <Pressable onPress={resetSermonFilters} style={styles.sermonResetButton}>
              <Text style={styles.sermonResetText}>Reset</Text>
            </Pressable>
            <Pressable onPress={applySermonFilters} style={styles.sermonApplyButton}>
              <Text style={styles.sermonApplyText}>Apply filters</Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={sermonCommentsSheetRef}
        snapPoints={sermonCommentsSnapPoints}
        backdropComponent={renderSermonBackdrop}
        backgroundStyle={styles.sermonSheetBackground}
        handleIndicatorStyle={styles.sermonSheetHandle}
      >
        <View style={styles.sermonCommentsSheet}>
          <View style={styles.sermonCommentsHeader}>
            <Text style={styles.sermonSheetHeading}>Comments</Text>
            <Pressable onPress={() => sermonCommentsSheetRef.current?.dismiss()}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          {sermonCommentsLoading ? (
            <View style={styles.sermonCommentsState}>
              <ActivityIndicator color="#12d2d9" />
            </View>
          ) : sermonCommentError ? (
            <View style={styles.sermonCommentsState}>
              <Text style={styles.sermonCommentsEmpty}>Could not load comments.</Text>
              <Pressable
                onPress={() => activeSermon?.id && loadSermonComments(activeSermon.id)}
                style={styles.sermonCommentsRetry}
              >
                <Text style={styles.sermonApplyText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <BottomSheetScrollView
              contentContainerStyle={styles.sermonCommentsList}
              showsVerticalScrollIndicator={false}
            >
              {sermonComments.length > 0 ? (
                sermonComments.map((comment) => {
                  const author =
                    comment.userData?.name || comment.userData?.username || 'One Body member';
                  const created = formatSermonDate(
                    comment.createdAt ?? comment.created ?? comment.date
                  );
                  return (
                    <View
                      key={comment.commentId ?? comment.id ?? `${author}-${created}`}
                      style={styles.sermonCommentRow}
                    >
                      {comment.userData?.profileImage ? (
                        <Image
                          source={{ uri: comment.userData.profileImage }}
                          style={styles.sermonCommentAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.sermonCommentAvatarFallback}>
                          <MaterialIcons name="person" size={18} color="rgba(255,255,255,0.7)" />
                        </View>
                      )}
                      <View style={styles.sermonCommentBody}>
                        <View style={styles.sermonCommentMetaRow}>
                          <Text style={styles.sermonCommentAuthor} numberOfLines={1}>
                            {author}
                          </Text>
                          {created ? <Text style={styles.sermonCommentDate}>{created}</Text> : null}
                        </View>
                        <Text style={styles.sermonCommentText}>{comment.content}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.sermonCommentsEmpty}>No comments yet.</Text>
              )}
            </BottomSheetScrollView>
          )}
          <View style={styles.sermonCommentComposer}>
            <TextInput
              value={sermonCommentText}
              onChangeText={setSermonCommentText}
              placeholder="Add a comment"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.sermonCommentInput}
              maxLength={2000}
              multiline
            />
            <Pressable onPress={submitSermonComment} style={styles.sermonCommentSendButton}>
              <MaterialIcons name="send" size={20} color="#032f3c" />
            </Pressable>
          </View>
        </View>
      </BottomSheetModal>

      {activeSermon ? (
        <View style={styles.sermonPlayerOverlay}>
          <View style={[styles.sermonPlayerHeader, { paddingTop: insets.top + spacing.x8 }]}>
            <Pressable onPress={() => setActiveSermon(null)} style={styles.sermonPlayerIconButton}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={styles.sermonPlayerTitleWrap}>
              <Text style={styles.sermonPlayerTitle} numberOfLines={1}>
                {activeSermon.title}
              </Text>
              <Text style={styles.sermonPlayerSubtitle} numberOfLines={1}>
                Source: {activeSermon.provider} · {activeSermon.channelName || 'Original platform'}
              </Text>
            </View>
            <Pressable
              onPress={() => Linking.openURL(activeSermon.sourceUrl).catch(() => undefined)}
              style={styles.sermonPlayerIconButton}
            >
              <MaterialIcons name="open-in-new" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
          <WebView
            source={{ uri: activeSermon.embedUrl }}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['https://*']}
            mixedContentMode="never"
            onShouldStartLoadWithRequest={(request) =>
              isAllowedSermonPlayerUrl(request.url) || request.url === 'about:blank'
            }
            style={styles.sermonWebView}
          />
          <View style={styles.sermonPlayerActions}>
            <Pressable
              onPress={toggleSermonReaction}
              style={[
                styles.sermonPlayerActionButton,
                likedSermonIds.has(activeSermon.id) ? styles.sermonPlayerActionButtonActive : null,
              ]}
            >
              <MaterialIcons
                name={likedSermonIds.has(activeSermon.id) ? 'favorite' : 'favorite-border'}
                size={20}
                color={likedSermonIds.has(activeSermon.id) ? '#032f3c' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.sermonPlayerActionText,
                  likedSermonIds.has(activeSermon.id) ? styles.sermonPlayerActionTextActive : null,
                ]}
              >
                {formatCompactCount(activeSermon.reactionsCount)}
              </Text>
            </Pressable>
            <Pressable onPress={openSermonComments} style={styles.sermonPlayerActionButton}>
              <MaterialIcons name="chat-bubble-outline" size={20} color="#FFFFFF" />
              <Text style={styles.sermonPlayerActionText}>
                {formatCompactCount(activeSermon.commentsCount ?? activeSermon.commentNumber)}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_VIDEO_BACKGROUND,
  },
  item: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  video: { flex: 1 },
  portalTabs: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 45,
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(3,47,60,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  portalTab: {
    minWidth: 86,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x14,
  },
  portalTabActive: {
    backgroundColor: '#12d2d9',
  },
  portalTabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
  portalTabTextActive: {
    color: '#032f3c',
  },
  sermonScreen: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  sermonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.x18,
    paddingBottom: spacing.x14,
  },
  sermonHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  sermonHeaderSubtitle: {
    marginTop: 3,
    maxWidth: 250,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 17,
  },
  sermonFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: spacing.x14,
    paddingVertical: spacing.x10,
    backgroundColor: 'rgba(18,210,217,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(18,210,217,0.46)',
  },
  sermonFilterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sermonList: {
    flex: 1,
  },
  sermonListContent: {
    paddingHorizontal: spacing.x16,
    paddingBottom: spacing.x32,
    gap: spacing.x14,
  },
  sermonCard: {
    flexDirection: 'row',
    gap: spacing.x12,
    padding: spacing.x12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sermonThumb: {
    width: 132,
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sermonDuration: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.72)',
    fontSize: 11,
    fontWeight: '700',
  },
  sermonCardBody: {
    flex: 1,
    minWidth: 0,
  },
  sermonProviderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sermonProviderPill: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: '#032f3c',
    backgroundColor: '#12d2d9',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sermonTopicPill: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: 'rgba(255,255,255,0.78)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    fontSize: 10,
    fontWeight: '700',
  },
  sermonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  sermonMeta: {
    marginTop: 5,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
  },
  sermonTopics: {
    marginTop: 7,
    color: 'rgba(18,210,217,0.92)',
    fontSize: 11,
    fontWeight: '700',
  },
  sermonEngagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x12,
    marginTop: spacing.x10,
  },
  sermonEngagementStat: {
    minWidth: 42,
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sermonEngagementText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '800',
  },
  sermonLoadMoreButton: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#12d2d9',
    marginTop: spacing.x4,
  },
  sermonLoadMoreText: {
    color: '#032f3c',
    fontSize: 14,
    fontWeight: '900',
  },
  sermonSheetBackground: {
    backgroundColor: '#032f3c',
  },
  sermonSheetHandle: {
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  sermonSheetContent: {
    paddingHorizontal: spacing.x20,
    paddingBottom: spacing.x32,
  },
  sermonSheetHeading: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.x16,
  },
  sermonSheetSection: {
    marginTop: spacing.x16,
  },
  sermonSheetTitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: spacing.x8,
  },
  sermonChipRow: {
    gap: spacing.x8,
    paddingRight: spacing.x20,
  },
  sermonChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.x14,
    paddingVertical: spacing.x9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sermonChipActive: {
    backgroundColor: '#12d2d9',
    borderColor: '#12d2d9',
  },
  sermonChipText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '700',
  },
  sermonChipTextActive: {
    color: '#032f3c',
  },
  sermonInputWrap: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: spacing.x12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sermonSheetInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  sermonSheetGrid: {
    gap: spacing.x10,
    marginTop: spacing.x16,
  },
  sermonSheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x10,
    marginTop: spacing.x22,
  },
  sermonResetButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  sermonResetText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    fontWeight: '800',
  },
  sermonApplyButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#12d2d9',
  },
  sermonApplyText: {
    color: '#032f3c',
    fontSize: 14,
    fontWeight: '900',
  },
  sermonPlayerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: '#000000',
  },
  sermonPlayerHeader: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x10,
    paddingHorizontal: spacing.x12,
    paddingBottom: spacing.x10,
    backgroundColor: '#032f3c',
  },
  sermonPlayerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sermonPlayerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  sermonPlayerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sermonPlayerSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
  },
  sermonWebView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  sermonPlayerActions: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x10,
    paddingHorizontal: spacing.x14,
    paddingVertical: spacing.x10,
    backgroundColor: '#032f3c',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sermonPlayerActionButton: {
    minWidth: 86,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: spacing.x14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  sermonPlayerActionButtonActive: {
    backgroundColor: '#12d2d9',
    borderColor: '#12d2d9',
  },
  sermonPlayerActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  sermonPlayerActionTextActive: {
    color: '#032f3c',
  },
  sermonCommentsSheet: {
    flex: 1,
    paddingHorizontal: spacing.x18,
    paddingBottom: spacing.x16,
  },
  sermonCommentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.x8,
  },
  sermonCommentsState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.x12,
  },
  sermonCommentsRetry: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: spacing.x18,
    backgroundColor: '#12d2d9',
  },
  sermonCommentsList: {
    paddingTop: spacing.x8,
    paddingBottom: spacing.x16,
    gap: spacing.x14,
  },
  sermonCommentsEmpty: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.x24,
  },
  sermonCommentRow: {
    flexDirection: 'row',
    gap: spacing.x10,
  },
  sermonCommentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sermonCommentAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sermonCommentBody: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    paddingHorizontal: spacing.x12,
    paddingVertical: spacing.x10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sermonCommentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x8,
  },
  sermonCommentAuthor: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sermonCommentDate: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },
  sermonCommentText: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 19,
  },
  sermonCommentComposer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.x8,
    paddingTop: spacing.x10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sermonCommentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 104,
    borderRadius: 18,
    paddingHorizontal: spacing.x14,
    paddingVertical: spacing.x10,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    fontSize: 14,
  },
  sermonCommentSendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12d2d9',
  },
  feedStateContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x32,
  },
  feedStateTitle: {
    marginTop: spacing.x20,
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  feedStateBody: {
    marginTop: spacing.x10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  feedStateRetryButton: {
    marginTop: spacing.x24,
    paddingVertical: spacing.x13,
    paddingHorizontal: spacing.x32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  feedStateRetryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },
});

export default Watch;
