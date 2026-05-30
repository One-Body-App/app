import React, {
  ComponentType,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FlatList, RefreshControl, ListRenderItem, useWindowDimensions } from 'react-native';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Tabs } from 'react-native-collapsible-tab-view';

import { ApiCall } from '@/services/api';
import SocialItem from '@/components/listItems/SocialItem';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MainStackParamList } from '@/src/navigator/types';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
import { PostType, WatchPost } from '@/utils/types';
import useSharedImageViewer from '@/components/imageViewer/useSharedImageViewer';
import {
  getRecentCompletedWatchUploadsSnapshot,
  mergeRecentCompletedWatchUploads,
  subscribeRecentCompletedWatchUploads,
} from '@/src/services/recentCompletedWatchUploads';

type WatchFlatlistProps = {
  userId: string;
  headerItem?: ComponentType<any> | ReactElement | null | undefined;
  emptyText?: string;
  useTabsFlatList?: boolean;
};

function WatchFlatlist({
  userId,
  headerItem,
  emptyText,
  useTabsFlatList = false,
}: WatchFlatlistProps) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [posts, setPosts] = useState<WatchPost[]>([]);
  const pageRef = useRef(1);
  const isEndOfListRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleItemsIndex, setVisibleItemsIndex] = useState<number[]>([]);
  const { width } = useWindowDimensions();
  const { imageViewer, openImages } = useSharedImageViewer();
  const ListComponent = useTabsFlatList ? Tabs.FlatList : FlatList;
  const socialItemContentWidth = Math.max(width - spacing.x16 * 2 - 14, 0);
  const shouldMergeRecentCompletedUploads = currentUser?._id === userId;
  const mergeOptimisticWatchPosts = useCallback(
    (nextPosts: WatchPost[]) =>
      shouldMergeRecentCompletedUploads
        ? mergeRecentCompletedWatchUploads({
            posts: nextPosts,
            recentUploads: getRecentCompletedWatchUploadsSnapshot(),
            user: currentUser,
          })
        : nextPosts,
    [currentUser, shouldMergeRecentCompletedUploads]
  );
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (!viewableItems || viewableItems.length < 1) {
      setVisibleItemsIndex([]);
      return;
    }

    setVisibleItemsIndex(viewableItems.map((item: any) => item.index).filter(Number.isInteger));
  }, []);
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        minimumViewTime: 100,
        itemVisiblePercentThreshold: 75,
      },
      onViewableItemsChanged,
    },
  ]);
  const renderItem: ListRenderItem<WatchPost> = ({ item, index }) => (
    <SocialItem
      itemData={item as any}
      index={index}
      visible={visibleItemsIndex.includes(index)}
      contentWidth={socialItemContentWidth}
      onOpenImages={openImages}
      postType={PostType.watch}
      onOpenVideoPress={({ postId, playBackId, itemData, mediaUrl, aspectRatio }) => {
        navigation.navigate('WatchPortal', {
          initialPostId: postId,
          initialPlaybackId: playBackId,
          initialWatchPost: {
            ...(itemData as any),
            mediaUrl,
            aspectRatio,
          },
        });
      }}
    />
  );

  const getWatchPosts = useCallback(
    async (pageNumber: number) => {
      setIsLoading(true);

      try {
        const res = await ApiCall({
          route: `watch/user/${userId}?page=${pageNumber}&itemsPerPage=5${
            pageNumber === 1 ? `&refresh=${Date.now()}` : ''
          }`,
          verb: 'get',
          token,
        });

        if (res?.status === 200) {
          const nextPosts = Array.isArray(res.response) ? res.response : [];

          if (pageNumber === 1) {
            setPosts(mergeOptimisticWatchPosts(nextPosts));
            isEndOfListRef.current = false;
          } else if (nextPosts.length < 1) {
            isEndOfListRef.current = true;
          } else {
            setPosts((previous) => mergeOptimisticWatchPosts([...previous, ...nextPosts]));
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        pageRef.current = pageNumber;
      }
    },
    [mergeOptimisticWatchPosts, token, userId]
  );

  useFocusEffect(
    useCallback(() => {
      getWatchPosts(1).then(() => undefined);
    }, [getWatchPosts])
  );

  useEffect(() => {
    if (!shouldMergeRecentCompletedUploads) {
      return undefined;
    }

    return subscribeRecentCompletedWatchUploads(() => {
      setPosts((previous) => mergeOptimisticWatchPosts(previous));
    });
  }, [mergeOptimisticWatchPosts, shouldMergeRecentCompletedUploads]);

  return (
    <>
      <ListComponent
        data={posts}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        style={{ flex: 1 }}
        ListHeaderComponent={headerItem}
        keyExtractor={(item: WatchPost, index: number) =>
          `${item.postId ?? item.id ?? item._id}-${index}`
        }
        renderItem={renderItem}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!isLoading && !refreshing && !isEndOfListRef.current && posts.length > 0) {
            getWatchPosts(pageRef.current + 1).then(() => undefined);
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              isEndOfListRef.current = false;
              setRefreshing(true);
              getWatchPosts(1).then(() => undefined);
            }}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <StyledText style={{ textAlign: 'center', marginTop: spacing.x10 }}>
              {emptyText || 'No watch posts yet'}
            </StyledText>
          )
        }
        removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
        initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
        maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
        updateCellsBatchingPeriod={STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod}
        windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
      />
      {imageViewer}
    </>
  );
}

export default WatchFlatlist;
