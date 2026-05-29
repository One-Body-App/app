import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View, RefreshControl, Pressable, Platform, ListRenderItem } from 'react-native';
import Toast from 'react-native-simple-toast';
import { useSelector } from 'react-redux';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ApiCall } from '@/src/services/api';

import { RootState } from '@/src/redux/reducers/rootReducer';

import { PrayerPost } from '@/utils/types';
import PrayerItem from '../listItems/PrayerItem';
import { PrayerWallStackParamsList } from '@/src/navigator/types';
import StyledText from '../styled/Text';
import { Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { flushFeedTelemetry, setFeedTelemetryAuthToken } from '@/services/feedTelemetry';
import { usePrayerListTelemetry } from '@/components/prayerWall/usePrayerListTelemetry';
import {
  deleteOwnedPost,
  emitOwnedPostDeleted,
  subscribeToFeedItemUnavailable,
  subscribeToOwnedPostDeleted,
} from '@/services/ownedPostDeletion';
import {
  appendUniquePrayerPosts,
  dedupePrayerPosts,
  getPrayerPostIdentity,
} from '@/components/prayerWall/prayerPostList';

function PrayerWallEmpty() {
  return (
    <StyledText
      style={[
        Typography.body.x2M,
        {
          padding: spacing.x16,
          textAlign: 'center',
          transform:
            Platform.OS === 'ios' ? [{ rotate: '180deg' }, { scaleX: -1 }] : [{ rotate: '180deg' }],
        },
      ]}
    >
      No new prayers to see
    </StyledText>
  );
}

type PrayerWallComponentProps = {
  onOpenPost?: (postId: string) => void;
  onEditPost?: (postId: string) => void;
  onScrollOffsetChange?: (offsetY: number) => void;
  onUserScrollStart?: () => void;
  onUserScrollEnd?: () => void;
  refreshSignal?: number;
};

function PrayerWallComponent({
  onOpenPost,
  onEditPost,
  onScrollOffsetChange,
  onUserScrollStart,
  onUserScrollEnd,
  refreshSignal,
}: PrayerWallComponentProps) {
  const navigation = useNavigation<NavigationProp<PrayerWallStackParamsList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [refreshing, setRefreshing] = useState(false);
  const [prayers, setPrayers] = useState<PrayerPost[]>([]);
  const [isScrollEnable, setIsScrollEnable] = useState(true);

  const isLoadingRef = useRef(false);
  const isEndOfListRef = useRef(false);
  const requestSequenceRef = useRef(0);
  const hasSeenRefreshSignalRef = useRef(false);
  const loadMoreLockRef = useRef(false);
  const isUserDragActiveRef = useRef(false);
  const isMomentumScrollingRef = useRef(false);
  const pageRef = useRef(1);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const {
    finalizeAllVisible,
    onViewableItemsChanged,
    resetPrayerTelemetryRequest,
    trackPrayerTelemetry,
    viewabilityConfig,
  } = usePrayerListTelemetry({
    currentUserId: currentUser?._id ? String(currentUser._id) : undefined,
    entrypoint: 'prayer_wall',
  });

  const extractPrayerEntries = (payload: unknown): PrayerPost[] => {
    if (Array.isArray(payload)) return payload as PrayerPost[];
    if (Array.isArray((payload as { content?: unknown })?.content)) {
      return (payload as { content: PrayerPost[] }).content;
    }
    if (Array.isArray((payload as { data?: unknown })?.data)) {
      return (payload as { data: PrayerPost[] }).data;
    }
    return [];
  };

  const getPrayerPosts = useCallback(
    async (pageNumber: number) => {
      const requestSequence = ++requestSequenceRef.current;
      if (pageNumber === 1) {
        resetPrayerTelemetryRequest();
      }
      pageRef.current = pageNumber;
      isLoadingRef.current = true;
      try {
        const res = await ApiCall({
          route: `prayer?page=${pageNumber}`,
          token,
          verb: 'get',
        });

        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        if (res?.status === 200) {
          const nextPosts = extractPrayerEntries(res?.response);
          if (pageNumber === 1) {
            isEndOfListRef.current = false;
            setPrayers(dedupePrayerPosts(nextPosts));
          } else if (nextPosts.length < 1) {
            isEndOfListRef.current = true;
          } else {
            setPrayers((prev) => appendUniquePrayerPosts(prev ?? [], nextPosts));
          }
        } else {
          console.log('error', res?.response);
        }
      } catch (e: any) {
        console.log(e.toString());
      } finally {
        loadMoreLockRef.current = false;
        if (requestSequence === requestSequenceRef.current) {
          isLoadingRef.current = false;
          setRefreshing(false);
        }
      }
    },
    [resetPrayerTelemetryRequest, token]
  );

  const refreshPrayerPosts = useCallback(() => {
    setRefreshing(true);
    isEndOfListRef.current = false;
    loadMoreLockRef.current = false;
    getPrayerPosts(1);
  }, [getPrayerPosts]);

  useEffect(() => {
    setFeedTelemetryAuthToken(token || undefined);
  }, [token]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshPrayerPosts();
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, refreshPrayerPosts]);

  useEffect(() => {
    return () => {
      finalizeAllVisible('unmount');
      flushFeedTelemetry(tokenRef.current || undefined).catch(() => undefined);
    };
  }, [finalizeAllVisible]);

  useEffect(() => {
    getPrayerPosts(1);
  }, [getPrayerPosts]);

  useEffect(() => {
    if (!hasSeenRefreshSignalRef.current) {
      hasSeenRefreshSignalRef.current = true;
      return;
    }
    refreshPrayerPosts();
  }, [refreshPrayerPosts, refreshSignal]);

  useEffect(() => {
    const removePrayerLocally = ({ type, id }: { type: string; id: string }) => {
      if (type !== 'prayer') {
        return;
      }
      setPrayers((previous) =>
        previous.filter((post) => String(post.postId ?? post.id ?? '') !== id)
      );
    };

    const unsubscribeOwned = subscribeToOwnedPostDeleted(removePrayerLocally);
    const unsubscribeUnavailable = subscribeToFeedItemUnavailable(removePrayerLocally);

    return () => {
      unsubscribeOwned();
      unsubscribeUnavailable();
    };
  }, []);

  const removePost = async (type: string, id: string) => {
    const normalizedId = String(id ?? '').trim();
    if (normalizedId.length < 1) {
      Toast.show('Unable to delete this post right now.', Toast.SHORT);
      return;
    }

    let removedPost: PrayerPost | undefined;
    let removedIndex = -1;
    setPrayers((previous) => {
      removedIndex = previous.findIndex(
        (post) => String(post.postId ?? post.id ?? '') === normalizedId
      );
      if (removedIndex < 0) {
        return previous;
      }
      removedPost = previous[removedIndex];
      return previous.filter((_, index) => index !== removedIndex);
    });

    const result = await deleteOwnedPost({
      type,
      id: normalizedId,
      token: token ?? undefined,
    });

    if (!result.ok) {
      if (removedPost && removedIndex >= 0) {
        setPrayers((previous) => {
          const restored = [...previous];
          restored.splice(Math.min(removedIndex, restored.length), 0, removedPost as PrayerPost);
          return restored;
        });
      }
      Toast.show(result.message || 'Unable to delete this post right now.', Toast.SHORT);
      return;
    }

    emitOwnedPostDeleted({
      type: result.type,
      id: normalizedId,
    });
    refreshPrayerPosts();
  };

  const editPost = async (id: string) => {
    if (onEditPost) {
      onEditPost(id);
      return;
    }
    navigation.navigate('Prayer', { postId: id });
  };

  const renderPrayerItem: ListRenderItem<PrayerPost> = useCallback(
    ({ item, index }) => {
      const postId = item.postId ?? item.id;
      const openPost = () => {
        if (!postId) return;
        trackPrayerTelemetry(item, index, 'post_open', {
          origin: 'prayer_card',
        });
        if (onOpenPost) {
          onOpenPost(postId);
          return;
        }
        navigation.navigate('Single', {
          postId,
        });
      };

      return (
        <Pressable onPress={openPost}>
          <PrayerItem
            editPost={editPost}
            removePost={removePost}
            item={item}
            onTelemetryEvent={(eventType, metadata) => {
              trackPrayerTelemetry(item, index, eventType as any, metadata);
            }}
            onCommentsPress={openPost}
            limitContentLines
          />
        </Pressable>
      );
    },
    [editPost, navigation, onOpenPost, removePost, trackPrayerTelemetry]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        inverted
        data={prayers}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={10}
        showsHorizontalScrollIndicator={false}
        onEndReached={() => {
          if (prayers.length < 1) {
            return;
          }
          if (
            !isLoadingRef.current &&
            !refreshing &&
            !isEndOfListRef.current &&
            !loadMoreLockRef.current
          ) {
            loadMoreLockRef.current = true;
            getPrayerPosts(pageRef.current + 1);
          }
        }}
        style={{
          flexGrow: 1,
        }}
        keyExtractor={(item, index) => {
          return getPrayerPostIdentity(item) ?? `row-${index}`;
        }}
        refreshing={refreshing}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refreshPrayerPosts();
            }}
          />
        }
        ListEmptyComponent={PrayerWallEmpty}
        onEndReachedThreshold={0.8}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEnabled={isScrollEnable}
        onScrollBeginDrag={() => {
          isUserDragActiveRef.current = true;
          isMomentumScrollingRef.current = false;
          onUserScrollStart?.();
        }}
        onScrollEndDrag={() => {
          if (isUserDragActiveRef.current && !isMomentumScrollingRef.current) {
            isUserDragActiveRef.current = false;
            onUserScrollEnd?.();
          }
        }}
        onMomentumScrollBegin={() => {
          if (!isUserDragActiveRef.current) {
            return;
          }
          isMomentumScrollingRef.current = true;
        }}
        onMomentumScrollEnd={() => {
          if (!isUserDragActiveRef.current) {
            isMomentumScrollingRef.current = false;
            return;
          }
          isUserDragActiveRef.current = false;
          isMomentumScrollingRef.current = false;
          onUserScrollEnd?.();
        }}
        onScroll={(event) => {
          onScrollOffsetChange?.(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
        renderItem={renderPrayerItem}
      />
    </View>
  );
}
export default PrayerWallComponent;
