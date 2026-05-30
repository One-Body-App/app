import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View, RefreshControl, Pressable } from 'react-native';
import Toast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ApiCall } from '@/src/services/api';
import { PostType, PrayerPost, PrayerWallCategory, SavedPost } from '@/utils/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { PrayerWallStackParamsList } from '@/src/navigator/types';
import StyledText from '../styled/Text';
import { Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import PrayerItem from '../listItems/PrayerItem';
import { getProfile } from '@/src/redux/actions/AuthActions';
import { flushFeedTelemetry, setFeedTelemetryAuthToken } from '@/services/feedTelemetry';
import { usePrayerListTelemetry } from '@/components/prayerWall/usePrayerListTelemetry';
import {
  deleteOwnedPost,
  emitOwnedPostDeleted,
  subscribeToFeedItemUnavailable,
  subscribeToOwnedPostDeleted,
} from '@/services/ownedPostDeletion';
import { dedupePrayerPosts, getPrayerPostIdentity } from '@/components/prayerWall/prayerPostList';

type PrayerWallSavedPrayersProps = {
  onOpenPost?: (postId: string) => void;
  onEditPost?: (postId: string) => void;
  onScrollOffsetChange?: (offsetY: number) => void;
  onUserScrollStart?: () => void;
  onUserScrollEnd?: () => void;
};

function PrayerWallSavedPrayersComponent({
  onOpenPost,
  onEditPost,
  onScrollOffsetChange,
  onUserScrollStart,
  onUserScrollEnd,
}: PrayerWallSavedPrayersProps) {
  const navigation = useNavigation<NavigationProp<PrayerWallStackParamsList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const isLoadingRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const isUserDragActiveRef = useRef(false);
  const isMomentumScrollingRef = useRef(false);

  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const [savedPosts, setSavedPosts] = useState<PrayerPost[]>([]);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const {
    finalizeAllVisible,
    onViewableItemsChanged,
    resetPrayerTelemetryRequest,
    trackPrayerTelemetry,
    viewabilityConfig,
  } = usePrayerListTelemetry({
    currentUserId: user?._id ? String(user._id) : undefined,
    entrypoint: 'prayer_wall_saved',
  });

  useEffect(() => {
    setFeedTelemetryAuthToken(token || undefined);
  }, [token]);

  useEffect(() => {
    if (token) {
      dispatch(
        getProfile.Request({
          token,
          pullSavedData: true,
        })
      );
    }
  }, [dispatch, token]);

  useEffect(() => {
    return () => {
      finalizeAllVisible('unmount');
      flushFeedTelemetry(tokenRef.current || undefined).catch(() => undefined);
    };
  }, [finalizeAllVisible]);

  useEffect(() => {
    setRefreshing(false);
  }, [authState.getProfileSuccess]);

  const getPrayerPosts = async (pageNumber: number) => {
    if (pageNumber === 1) {
      resetPrayerTelemetryRequest();
    }
    isLoadingRef.current = true;

    try {
      const res = await ApiCall({
        route: `user/saved?page=${pageNumber}&filter=prayers`,
        token,
        verb: 'get',
      });
      let posts = [];

      if (res?.status == 200) {
        // if (pageNumber == 1) {
        posts = res?.response ?? [];
        //   setIsEndOfList(false);
        // } else {
        //   posts = [...(savedPosts ? savedPosts : []), ...(res?.response ?? [])];

        //   if (res?.response?.length < 1) {
        //     setIsEndOfList(true);
        //   }
        // }

        setSavedPosts(dedupePrayerPosts(posts));
      } else {
        console.log('error', res?.response);
      }
      isLoadingRef.current = false;
      setRefreshing(false);
      // setShowRefreshIndicator(false);
    } catch (e: any) {
      console.log(e.toString());
    }
    isLoadingRef.current = false;
    setRefreshing(false);
    // setShowRefreshIndicator(false);
  };

  useEffect(() => {
    // getPrayers(currentPage);
    getPrayerPosts(1);
    // dispatch(
    //   getAllPrayer({
    //     page,
    //     token: token,
    //     Prayers: prayers,
    //     setIsLoading: setIsLoading,
    //   })
    // );
  }, []);

  useEffect(() => {
    const removePrayerLocally = ({ type, id }: { type: string; id: string }) => {
      if (type !== 'prayer') {
        return;
      }
      setSavedPosts((previous) =>
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
    setSavedPosts((previous) => {
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
        setSavedPosts((previous) => {
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
    getPrayerPosts(1);
  };

  const editPost = async (id: string) => {
    if (onEditPost) {
      onEditPost(id);
      return;
    }
    navigation.navigate('Prayer', { postId: id });
  };

  const renderPrayerItem = useCallback(
    ({ item, index }: { item: PrayerPost; index: number }) => {
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
        data={savedPosts}
        showsHorizontalScrollIndicator={false}
        // onEndReached={() => {
        //   if (!isLoading && !refreshing && !isEndOfList) setPage(page + 1);
        // }}
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
              getPrayerPosts(1);
              setRefreshing(true);
            }}
          />
        }
        ListEmptyComponent={() => (
          <StyledText style={[Typography.body.x2M, { padding: spacing.x16, textAlign: 'center' }]}>
            Nothing here
          </StyledText>
        )}
        // onEndReachedThreshold={0.8}
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
export default PrayerWallSavedPrayersComponent;
