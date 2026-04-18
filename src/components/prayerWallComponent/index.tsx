import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View, RefreshControl, TouchableOpacity, Platform } from 'react-native';
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
  refreshSignal?: number;
};

function PrayerWallComponent({
  onOpenPost,
  onEditPost,
  onScrollOffsetChange,
  refreshSignal,
}: PrayerWallComponentProps) {
  const navigation = useNavigation<NavigationProp<PrayerWallStackParamsList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [prayers, setPrayers] = useState<PrayerPost[]>([]);
  const [isScrollEnable, setIsScrollEnable] = useState(true);

  const [isEndOfList, setIsEndOfList] = useState(false);
  const requestSequenceRef = useRef(0);
  const hasSeenRefreshSignalRef = useRef(false);
  const loadMoreLockRef = useRef(false);
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
      setIsLoading(true);
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
            setIsEndOfList(false);
            setPrayers(nextPosts);
          } else if (nextPosts.length < 1) {
            setIsEndOfList(true);
          } else {
            setPrayers((prev) => [...(prev ?? []), ...nextPosts]);
          }
        } else {
          console.log('error', res?.response);
        }
      } catch (e: any) {
        console.log(e.toString());
      } finally {
        loadMoreLockRef.current = false;
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
    loadMoreLockRef.current = false;
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
    pageRef.current = page;
    getPrayerPosts(page);
  }, [getPrayerPosts, page]);

  useEffect(() => {
    if (!hasSeenRefreshSignalRef.current) {
      hasSeenRefreshSignalRef.current = true;
      return;
    }
    refreshPrayerPosts();
  }, [refreshPrayerPosts, refreshSignal]);

  const removePost = async (type: string, id: string) => {
    try {
      const res = await ApiCall({
        route: `prayer/${id}`,
        verb: 'delete',
        token,
      });

      if (res?.status === 200) {
        setPage(1);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
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
          if (!isLoading && !refreshing && !isEndOfList && !loadMoreLockRef.current) {
            loadMoreLockRef.current = true;
            setPage((prev) => prev + 1);
          }
        }}
        style={{
          flexGrow: 1,
        }}
        keyExtractor={(item, index) => {
          const postKey = item.postId ?? item.id ?? `row-${index}`;
          return `${postKey}`;
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
export default PrayerWallComponent;
