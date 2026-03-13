import React, { useState, useRef, useEffect, useCallback } from 'react';

import {
  View,
  useWindowDimensions,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSelector } from 'react-redux';

import { RootState } from '@/src/redux/reducers/rootReducer';

import { ApiCall } from '@/services/api';
import { FeedTypes } from '@/screens/home';

import VideoItem from './VideoItem';
import { WatchPost } from '@/utils/types';
import {
  flushFeedTelemetry,
  setFeedTelemetryAuthToken,
  trackFeedTelemetry,
} from '@/services/feedTelemetry';
import { spacing } from '@/src/styles/spacing';
import {
  BRAND_VIDEO_BACKGROUND,
  getWatchVideoLayout,
} from '@/src/components/video/universalVideoLayout';

function Watch({ navigation, route }: any) {
  const token = useSelector((state: RootState) => state.auth.userToken);
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
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const { width: screenWidth } = useWindowDimensions();
  const activeWatchStartMsRef = useRef<number | null>(null);
  const activeWatchTelemetryKeyRef = useRef<string | null>(null);
  const seenWatchImpressionsRef = useRef<Set<string>>(new Set());
  const hasAppliedInitialSelectionRef = useRef(false);
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryScale = useRef(new Animated.Value(0.985)).current;
  const insets = useSafeAreaInsets();

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
            [...previous, ...(feedPosts ?? [])].sort((a: any, b: any) => {
              const dateA = new Date(a.created);
              const dateB = new Date(b.created);
              return dateB.getTime() - dateA.getTime(); // Newest first
            })
          );
        }
      } else {
        // console.log('error', res?.response);
        setFeedData([]);
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

  useEffect(() => {
    return () => {
      finalizeWatchDwell('unmount');
      flushFeedTelemetry(token || undefined).catch(() => undefined);
    };
  }, [finalizeWatchDwell, token]);

  const shouldShowEmptyState = !isLoading && feedData.length < 1;
  const shouldShowInitialLoader = isLoading && page === 1 && !isRefreshing;
  const shouldShowWatchFeed = !shouldShowInitialLoader && feedData.length > 0;

  return (
    <View
      style={{ flex: 1, backgroundColor: '#0D0D0D' }}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        setViewHeight(height);
      }}
    >
      <TouchableOpacity
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
      </TouchableOpacity>
      {shouldShowEmptyState ? <View style={{ flex: 1, backgroundColor: '#0D0D0D' }} /> : null}
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
});

export default Watch;
