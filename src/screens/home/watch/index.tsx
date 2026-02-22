import React, { useState, useRef, useEffect, useCallback } from 'react';

import {
  View,
  FlatList,
  RefreshControl,
  useWindowDimensions,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';

import { useSelector } from 'react-redux';

import { useTheme } from '@react-navigation/native';

import { RootState } from '@/src/redux/reducers/rootReducer';

import { ApiCall } from '@/services/api';
import { FeedTypes } from '@/screens/home';

import VideoItem from './VideoItem';
import { WatchPost } from '@/utils/types';
import { NO_PROFILE_IMAGE } from '@/src/services/constants';
import {
  flushFeedTelemetry,
  setFeedTelemetryAuthToken,
  trackFeedTelemetry,
} from '@/services/feedTelemetry';

const { width } = Dimensions.get('window');

function Watch({ navigation, route }: any) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const initialPostId = route?.params?.initialPostId
    ? String(route?.params?.initialPostId)
    : undefined;
  const initialPlaybackId = route?.params?.initialPlaybackId;
  const initialWatchPost = route?.params?.initialWatchPost as WatchPost | undefined;
  const [feedData, setFeedData] = useState<WatchPost[]>([]);
  const [page, setPage] = useState<number>(1);
  const [activeWatchReel, setActiveWatchReel] = useState<number>(0);
  const [viewHeight, setViewHeight] = useState<number>(1);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const { width } = useWindowDimensions();
  const activeWatchStartMsRef = useRef<number | null>(null);
  const activeWatchTelemetryKeyRef = useRef<string | null>(null);
  const seenWatchImpressionsRef = useRef<Set<string>>(new Set());
  const hasAppliedInitialSelectionRef = useRef(false);

  // Accede al estado del usuario
  const { dark } = useTheme();

  const getWatchPostId = useCallback((post?: WatchPost | null) => {
    if (!post) return null;
    const candidate = post.postId ?? post.id ?? post._id;
    return candidate ? String(candidate) : null;
  }, []);

  const trackWatchImpression = useCallback(
    (post: WatchPost | null, postIndex: number) => {
      const postId = getWatchPostId(post);
      if (!postId) {
        return;
      }
      const telemetryKey = `watch:${postId}`;
      if (seenWatchImpressionsRef.current.has(telemetryKey)) {
        return;
      }
      seenWatchImpressionsRef.current.add(telemetryKey);
      trackFeedTelemetry({
        eventType: 'impression',
        feedType: 'watch',
        postId,
        postType: 'watch',
        contentType: 'watch',
        position: postIndex,
        source: 'watch_feed',
      });
    },
    [getWatchPostId]
  );

  const finalizeWatchDwell = useCallback(
    (reason: 'index_change' | 'unmount' | 'refresh' = 'index_change') => {
      if (!activeWatchStartMsRef.current || !activeWatchTelemetryKeyRef.current) {
        return;
      }
      const dwellTimeMs = Date.now() - activeWatchStartMsRef.current;
      const [, postId] = activeWatchTelemetryKeyRef.current.split(':');
      activeWatchStartMsRef.current = null;
      activeWatchTelemetryKeyRef.current = null;

      if (!postId || dwellTimeMs < 1200) {
        return;
      }

      trackFeedTelemetry({
        eventType: 'dwell',
        feedType: 'watch',
        postId,
        postType: 'watch',
        contentType: 'watch',
        durationMs: dwellTimeMs,
        source: 'watch_feed',
        metadata: { reason },
      });
    },
    []
  );

  const getFeedData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ApiCall({
        route: `user/get-following-feed/${FeedTypes.Watch}/${page}`,
        token,
        verb: 'get',
      });

      if (res?.status === 200) {
        const feedPosts = res.response
          .filter((i: any) => !!i?.playBackId)
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created);
            const dateB = new Date(b.created);
            return dateB.getTime() - dateA.getTime(); // Newest first
          });

        if (page === 1) {
          let initialFeedData = feedPosts ?? [];
          if (initialWatchPost) {
            const initialWatchPostId =
              initialWatchPost.postId ?? initialWatchPost.id ?? initialWatchPost._id;
            const isInitialPostInFeed = initialFeedData.some((post) => {
              if (initialPlaybackId && post.playBackId === initialPlaybackId) {
                return true;
              }
              if (!initialPostId && !initialWatchPostId) {
                return false;
              }
              const currentPostId = post.postId ?? post.id ?? post._id;
              return String(currentPostId) === String(initialPostId ?? initialWatchPostId);
            });
            if (!isInitialPostInFeed) {
              initialFeedData = [initialWatchPost, ...initialFeedData];
            }
          }
          setFeedData(initialFeedData);
          setIsEndOfList(false);
        } else {
          setFeedData((previous) =>
            [...previous, ...(feedPosts ?? [])].sort((a: any, b: any) => {
              const dateA = new Date(a.created);
              const dateB = new Date(b.created);
              return dateB.getTime() - dateA.getTime(); // Newest first
            })
          );
          if (res?.response.length < 1) {
            setIsEndOfList(true);
          }
        }
      } else {
        // console.log('error', res?.response);
        setFeedData([]);
        setIsEndOfList(true);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    } catch (e: any) {
      setFeedData([]);
      // console.log(`saga get twitter timline  error -- `, e.toString());
    }
  }, [initialPlaybackId, initialPostId, initialWatchPost, page, token]);

  useEffect(() => {
    // getData(page);
    if (isRefreshing) {
      if (page === 1) {
        getFeedData();
      } else {
        setPage(1);
      }
      setIsEndOfList(false);
    }
  }, [getFeedData, isRefreshing, page]);

  useEffect(() => {
    setFeedTelemetryAuthToken(token || undefined);
  }, [token]);

  // const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
  //   console.log(viewableItems, 'viewableItems');
  //   if (viewableItems && viewableItems.length > 0) {
  //     const { index } = viewableItems[0];
  //     setActiveWatchReel(index);
  //   }
  // }).current;

  useEffect(() => {
    getFeedData();
  }, [getFeedData, page]);

  useEffect(() => {
    if (page === 1) {
      seenWatchImpressionsRef.current.clear();
    }
  }, [page]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsRefreshing(true);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
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

  useEffect(() => {
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
    setActiveWatchReel(nextIndex);
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: nextIndex * viewHeight, animated: false });
    });
    hasAppliedInitialSelectionRef.current = true;
  }, [feedData, initialPlaybackId, initialPostId, viewHeight]);

  useEffect(() => {
    const activePost = feedData[index];
    const postId = getWatchPostId(activePost);
    if (!postId) {
      return;
    }

    const telemetryKey = `watch:${postId}`;
    if (activeWatchTelemetryKeyRef.current === telemetryKey) {
      return;
    }

    finalizeWatchDwell('index_change');
    activeWatchTelemetryKeyRef.current = telemetryKey;
    activeWatchStartMsRef.current = Date.now();
    trackWatchImpression(activePost, index);
  }, [feedData, finalizeWatchDwell, getWatchPostId, index, trackWatchImpression]);

  useEffect(() => {
    return () => {
      finalizeWatchDwell('unmount');
      flushFeedTelemetry(token || undefined).catch(() => undefined);
    };
  }, [finalizeWatchDwell, token]);

  const resizeMode = 'contain';

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        setViewHeight(height);
      }}
    >
      {isLoading && page === 1 && !isRefreshing ? (
        <View style={{ marginTop: 10 }}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          pagingEnabled
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {feedData.map((i) => {
            return (
              <Image
                resizeMode={resizeMode}
                style={[styles.item, { height: viewHeight }]}
                source={{
                  uri: `https://image.mux.com/${i.playBackId}/thumbnail.webp?fit_mode=preserve&width=${Math.round(width)}&height=${Math.round(viewHeight)}`,
                }}
              />
            );
          })}

          {feedData[index] ? (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                { height: viewHeight, flex: 1, top: index * viewHeight },
              ]}
            >
              <VideoItem
                currentIndex={index}
                item={feedData[index]}
                viewHeight={viewHeight}
                width={width}
                fromSavedPosts={false}
                onTelemetryEvent={(eventType, metadata) => {
                  const post = feedData[index];
                  const postId = getWatchPostId(post);
                  if (!postId) {
                    return;
                  }
                  trackFeedTelemetry({
                    eventType,
                    feedType: 'watch',
                    postId,
                    postType: 'watch',
                    contentType: 'watch',
                    position: index,
                    source: 'watch_feed',
                    metadata,
                  });
                }}
                onShowDismissCard={(e?: boolean) => {
                  setIsScrollEnable(!e);
                }}
              />
            </Animated.View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: 'black',
  },
  item: {
    height: '100%',
    width,
    overflow: 'hidden',
  },
  video: { flex: 1 },
});

export default Watch;
