import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Image,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const scrollViewRef = useRef<ScrollView>(null);
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
  const mergeOptimisticWatchPosts = useCallback(
    (nextPosts: WatchPost[]) =>
      mergeRecentCompletedWatchUploads({
        posts: nextPosts,
        recentUploads: getRecentCompletedWatchUploadsSnapshot(),
        user: currentUser,
      }),
    [currentUser]
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

  useEffect(() => {
    return subscribeRecentCompletedWatchUploads(() => {
      setFeedData((previous) => mergeOptimisticWatchPosts(previous));
    });
  }, [mergeOptimisticWatchPosts]);

  useEffect(() => {
    const removeWatchLocally = ({ type, id }: { type: string; id: string }) => {
      if (type !== 'watch') {
        return;
      }
      removeWatchPostLocally(id);
    };

    const unsubscribeOwned = subscribeToOwnedPostDeleted(removeWatchLocally);
    const unsubscribeUnavailable = subscribeToFeedItemUnavailable(removeWatchLocally);

    return () => {
      unsubscribeOwned();
      unsubscribeUnavailable();
    };
  }, [removeWatchPostLocally]);

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
      {shouldShowEmptyState ? (
        <View style={styles.feedStateContainer}>
          <MaterialIcons name="videocam-off" size={56} color="rgba(255,255,255,0.25)" />
          <Text style={styles.feedStateTitle}>Nothing to watch yet</Text>
          <Text style={styles.feedStateBody}>Follow others to see their Watch posts here.</Text>
        </View>
      ) : null}
      {shouldShowErrorState ? (
        <View style={styles.feedStateContainer}>
          <MaterialIcons name="wifi-off" size={56} color="rgba(255,255,255,0.25)" />
          <Text style={styles.feedStateTitle}>Could not load videos</Text>
          <Text style={styles.feedStateBody}>Check your connection and try again.</Text>
          <Pressable onPress={() => setIsRefreshing(true)} style={styles.feedStateRetryButton}>
            <Text style={styles.feedStateRetryLabel}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
      {shouldShowInitialLoader ? (
        <View style={{ marginTop: 10 }}>
          <ActivityIndicator size="small" />
        </View>
      ) : null}
      {shouldShowWatchFeed ? (
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
