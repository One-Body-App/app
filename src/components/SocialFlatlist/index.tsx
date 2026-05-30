import React, {
  ComponentType,
  ReactElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { FlatList, RefreshControl, View, ListRenderItem, useWindowDimensions } from 'react-native';
import Toast from 'react-native-simple-toast';
import { useSelector } from 'react-redux';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Tabs } from 'react-native-collapsible-tab-view';

import { ApiCall } from '@/src/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';
import SocialItem from '../listItems/SocialItem';
import { RefreshListRef, SocialPost } from '@/utils/types';
import StyledText from '../styled/Text';
import { spacing } from '@/src/styles/spacing';
import { MainStackParamList } from '@/src/navigator/types';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
import useSharedImageViewer from '@/components/imageViewer/useSharedImageViewer';
import {
  deleteOwnedPost,
  emitOwnedPostDeleted,
  subscribeToFeedItemUnavailable,
  subscribeToOwnedPostDeleted,
} from '@/services/ownedPostDeletion';

type SocialListFooterProps = {
  isEndOfList: boolean;
};

function SocialListFooter({ isEndOfList }: SocialListFooterProps) {
  if (!isEndOfList) return null;
  return null;
}

type SocialListEmptyProps = {
  isLoading: boolean;
  emptyText?: string;
};

function SocialListEmpty({ isLoading, emptyText }: SocialListEmptyProps) {
  if (isLoading) {
    return null;
  }

  return (
    <StyledText style={{ textAlign: 'center', marginTop: spacing.x10 }}>
      {emptyText || 'No social posts to display'}
    </StyledText>
  );
}

type SocialFlatlistProps = {
  userIdToPullData?: string;
  headerItem?: ComponentType<any> | ReactElement | null | undefined;
  emptyText?: string;
  socialType?: 'all' | 'instagram' | 'onebody';
  useTabsFlatList?: boolean;
  ref?: React.Ref<RefreshListRef>;
};

function SocialFlatlist({
  userIdToPullData,
  headerItem,
  emptyText,
  socialType = 'all',
  useTabsFlatList = false,
  ref,
}: SocialFlatlistProps) {
  // const socialPost = useSelector((state: RootState) => state.social.SocialPost);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

  const token = useSelector((state: RootState) => state.auth.userToken);

  const pageRef = useRef(1);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const [visibleItemsIndex, setVisibleItemsIndex] = useState<number[]>([]);
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { width } = useWindowDimensions();
  const { imageViewer, openImages } = useSharedImageViewer();
  const ListComponent = useTabsFlatList ? Tabs.FlatList : FlatList;
  const socialItemContentWidth = Math.max(width - spacing.x16 * 2 - 14, 0);
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
  const getSocialPosts = useCallback(
    async (pageNumber: number) => {
      setIsLoading(true);

      try {
        const res = await ApiCall({
          route: userIdToPullData
            ? `user/get-social/${socialType}/${userIdToPullData}/${pageNumber}?itemsPerPage=5`
            : `user/get-following-social/${pageNumber}`,
          token,
          verb: 'get',
        });
        if (res?.status === 200) {
          const nextPosts = res?.response?.content ?? [];
          if (pageNumber === 1) {
            setIsEndOfList(false);
            setSocialPosts(nextPosts);
          } else if (nextPosts.length < 1) {
            setIsEndOfList(true);
          } else {
            setSocialPosts((prev) => [...prev, ...nextPosts]);
          }
        } else {
          console.log('error', res?.response);
        }
        setIsLoading(false);
        setIsRefreshing(false);
        setShowRefreshIndicator(false);
      } catch (e: any) {
        console.log(e.toString());
      }
      setIsLoading(false);
      setIsRefreshing(false);
      setShowRefreshIndicator(false);

      pageRef.current = pageNumber;
    },
    [socialType, token, userIdToPullData]
  );

  const refreshContent = (shouldShowRefreshIndicator = false) => {
    setIsEndOfList(false);
    setIsRefreshing(true);

    if (shouldShowRefreshIndicator) {
      setShowRefreshIndicator(true);
    }

    getSocialPosts(1).then(() => undefined);
  };

  useImperativeHandle(ref, () => ({
    setRefreshing() {
      refreshContent();
    },
  }));

  useFocusEffect(
    useCallback(() => {
      getSocialPosts(1).then(() => undefined);
    }, [getSocialPosts])
  );

  useEffect(() => {
    const removePostLocally = ({ type, id }: { type: string; id: string }) => {
      if (type !== 'social') {
        return;
      }
      setSocialPosts((previous) =>
        previous.filter((post) => String(post.postId ?? post.id ?? post._id ?? '') !== id)
      );
    };

    const unsubscribeOwned = subscribeToOwnedPostDeleted(removePostLocally);
    const unsubscribeUnavailable = subscribeToFeedItemUnavailable(removePostLocally);

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

    let removedPost: SocialPost | undefined;
    let removedIndex = -1;
    setSocialPosts((previous) => {
      removedIndex = previous.findIndex(
        (post) => String(post.postId ?? post.id ?? post._id ?? '') === normalizedId
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
        setSocialPosts((previous) => {
          const restored = [...previous];
          restored.splice(Math.min(removedIndex, restored.length), 0, removedPost as SocialPost);
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
    getSocialPosts(1).then(() => undefined);
  };

  const editPost = async (id: string) => {
    navigation.navigate('Post', { postId: id });
    // try {
    //   const res = await ApiCall({
    //     route: `social/edit-post/${id}`,
    //     verb: 'patch',
    //     token: token,
    //   });
    //   if (res?.status == 200) {
    //     getFeedData(feedOptions.type, feedOptions.page);
    //   }
    // } catch (e: any) {
    //   console.log('saga error -- ', e.toString());
    // }
  };

  const renderItem: ListRenderItem<SocialPost> = ({ item, index }) => (
    <SocialItem
      itemData={item}
      visible={visibleItemsIndex.includes(index)}
      contentWidth={socialItemContentWidth}
      onOpenImages={openImages}
      onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
      index={index}
      parentRefreshContent={refreshContent}
      removePost={socialType === 'onebody' ? removePost : undefined}
      editPost={socialType === 'onebody' ? editPost : undefined}
      onCommentsPress={() => {
        const postId = item.postId ?? item.id ?? item._id;
        if (postId) {
          navigation.navigate('SinglePost', { postId });
        }
      }}
    />
  );

  return (
    <>
      <ListComponent
        data={socialPosts}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        style={{ flex: 1 }}
        keyExtractor={(item: SocialPost, index: number) => {
          return `${item?.userData?.username}-${item.id ?? item.postId}-${index}`;
        }}
        extraData={isRefreshing}
        scrollEnabled={isScrollEnable}
        ListHeaderComponent={headerItem}
        renderItem={renderItem}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!isLoading && !isRefreshing && !isEndOfList && socialPosts.length > 0)
            getSocialPosts(pageRef.current + 1).then(() => undefined);
        }}
        ListFooterComponent={<SocialListFooter isEndOfList={isEndOfList} />}
        refreshControl={
          <RefreshControl
            enabled
            refreshing={isRefreshing && showRefreshIndicator}
            onRefresh={() => {
              refreshContent();
            }}
          />
        }
        ListEmptyComponent={<SocialListEmpty isLoading={isLoading} emptyText={emptyText} />}
        removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
        initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
        maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
        updateCellsBatchingPeriod={STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod}
        windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
      />
      {imageViewer}
    </>
    // <>
    //   {socialPost?.map((item, i) => (
    //     <View key={i} style={{ ...styles.socialpostview, backgroundColor: colors.card, margin: 7 }}>
    //       {item?.attachments ? (
    //         <Image
    //           style={styles.socialpostimage}
    //           resizeMode={'stretch'}
    //           source={require('@/assets/images/Photo.png')}
    //         />
    //       ) : null}
    //       <Text
    //         style={{
    //           padding: 5,
    //           fontFamily: 'Rubik',
    //           lineHeight: 18,
    //           color: colors.text,
    //           marginTop: getHeight(1),
    //           textAlign: 'center',
    //         }}
    //       >
    //         {item?.content}
    //       </Text>
    //       <View style={{ flexDirection: 'row', padding: 5 }}>
    //         <Text
    //           style={{
    //             marginLeft: 5,
    //             fontFamily: 'Rubik',
    //             color: '#68828A',
    //             alignItems: 'center',
    //           }}
    //         >
    //           @{item?.handler}
    //         </Text>
    //       </View>
    //     </View>
    //   ))}
    //   {hasMore ? (
    //     <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
    //       <Pressable
    //         onPress={async () => {
    //           await getSocialPosts(page + 1);
    //         }}
    //       >
    //         <Text>View More</Text>
    //       </Pressable>
    //     </View>
    //   ) : null}
    // </>
  );
}
export default SocialFlatlist;
