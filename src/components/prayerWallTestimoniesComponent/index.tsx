import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import Toast from 'react-native-simple-toast';
import { useSelector } from 'react-redux';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import PrayerItem from '../listItems/PrayerItem';
import { ApiCall } from '@/services/api';
import { PrayerPost, PrayerWallCategory } from '@/utils/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
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

type PrayerWallTestimoniesProps = {
  onOpenPost?: (postId: string) => void;
  onEditPost?: (postId: string) => void;
  onScrollOffsetChange?: (offsetY: number) => void;
  onUserScrollStart?: () => void;
  onUserScrollEnd?: () => void;
};

function PrayerWallTestimoniesEmpty() {
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
      Nothing here
    </StyledText>
  );
}

function PrayerWallTestimoniesComponent({
  onOpenPost,
  onEditPost,
  onScrollOffsetChange,
  onUserScrollStart,
  onUserScrollEnd,
}: PrayerWallTestimoniesProps) {
  const navigation = useNavigation<NavigationProp<PrayerWallStackParamsList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [testimonies, setTestimonies] = useState<PrayerPost[]>([]);
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const requestSequenceRef = useRef(0);
  const isUserDragActiveRef = useRef(false);
  const isMomentumScrollingRef = useRef(false);
  const pageRef = useRef(page);
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
    entrypoint: 'prayer_wall_testimonies',
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
      setIsLoading(true);

      try {
        const res = await ApiCall({
          route: `prayer?page=${pageNumber}&filter=${PrayerWallCategory.AnsweredPrayer}`,
          token,
          verb: 'get',
        });

        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        if (res?.status === 200) {
          const nextPosts = extractPrayerEntries(res?.response);
          if (pageNumber === 1) {
            setIsEndOfList(false);
            setTestimonies(dedupePrayerPosts(nextPosts));
          } else if (nextPosts.length < 1) {
            setIsEndOfList(true);
          } else {
            setTestimonies((previous) => appendUniquePrayerPosts(previous, nextPosts));
          }
        } else {
          console.log('error', res?.response);
        }
      } catch (e: any) {
        console.log(e.toString());
      } finally {
        if (requestSequence === requestSequenceRef.current) {
          setIsLoading(false);
          setRefreshing(false);
        }
      }
    },
    [resetPrayerTelemetryRequest, token]
  );

  const refreshPrayerPosts = useCallback(() => {
    setRefreshing(true);
    setIsEndOfList(false);
    if (pageRef.current === 1) {
      getPrayerPosts(1);
      return;
    }
    setPage(1);
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
    // getPrayers(currentPage);
    pageRef.current = page;
    getPrayerPosts(page);
    // dispatch(
    //   getAllPrayer({
    //     page,
    //     token: token,
    //     Prayers: prayers,
    //     setIsLoading: setIsLoading,
    //   })
    // );
  }, [getPrayerPosts, page]);

  useEffect(() => {
    const removePrayerLocally = ({ type, id }: { type: string; id: string }) => {
      if (type !== 'prayer') {
        return;
      }
      setTestimonies((previous) =>
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
    setTestimonies((previous) => {
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
        setTestimonies((previous) => {
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

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        inverted
        data={testimonies}
        showsHorizontalScrollIndicator={false}
        onEndReached={() => {
          if (testimonies.length < 1) {
            return;
          }
          if (!isLoading && !refreshing && !isEndOfList) {
            setPage((prev) => prev + 1);
          }
        }}
        style={{
          flexGrow: 1,
        }}
        keyExtractor={(item, index) => {
          const postKey = getPrayerPostIdentity(item) ?? `row-${index}`;
          return `${postKey}-${index}`;
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
        ListEmptyComponent={PrayerWallTestimoniesEmpty}
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
        renderItem={({ item, index }) => {
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
            <TouchableOpacity onPress={openPost}>
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
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
export default PrayerWallTestimoniesComponent;
