import React, { ComponentType, ReactElement, useCallback, useState } from 'react';
import { FlatList, RefreshControl, ListRenderItem } from 'react-native';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Tabs } from 'react-native-collapsible-tab-view';

import { ApiCall } from '@/services/api';
import SocialItem from '@/components/listItems/SocialItem';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MainStackParamList } from '@/src/navigator/types';
import { PostType, WatchPost } from '@/utils/types';

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
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [posts, setPosts] = useState<WatchPost[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const ListComponent = useTabsFlatList ? Tabs.FlatList : FlatList;
  const renderItem: ListRenderItem<WatchPost> = ({ item, index }) => (
    <SocialItem
      itemData={item as any}
      index={index}
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
          route: `watch/user/${userId}?page=${pageNumber}&itemsPerPage=5`,
          verb: 'get',
          token,
        });

        if (res?.status === 200) {
          const nextPosts = Array.isArray(res.response) ? res.response : [];

          if (pageNumber === 1) {
            setPosts(nextPosts);
            setIsEndOfList(false);
          } else if (nextPosts.length < 1) {
            setIsEndOfList(true);
          } else {
            setPosts((previous) => [...previous, ...nextPosts]);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        setPage(pageNumber);
      }
    },
    [token, userId]
  );

  useFocusEffect(
    useCallback(() => {
      getWatchPosts(1).then(() => undefined);
    }, [getWatchPosts])
  );

  return (
    <ListComponent
      data={posts}
      style={{ flex: 1 }}
      ListHeaderComponent={headerItem}
      keyExtractor={(item: WatchPost, index: number) =>
        `${item.postId ?? item.id ?? item._id}-${index}`
      }
      renderItem={renderItem}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (!isLoading && !refreshing && !isEndOfList && posts.length > 0) {
          getWatchPosts(page + 1).then(() => undefined);
        }
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setIsEndOfList(false);
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
    />
  );
}

export default WatchFlatlist;
