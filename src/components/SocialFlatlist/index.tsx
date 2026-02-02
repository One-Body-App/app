import React, {
  ComponentType,
  ReactElement,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { FlatList, RefreshControl, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { ApiCall } from '@/src/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';
import SocialItem from '../listItems/SocialItem';
import { RefreshListRef, SocialPost } from '@/utils/types';
import StyledText from '../styled/Text';
import { spacing } from '@/src/styles/spacing';
import { MainStackParamList } from '@/src/navigator/types';

type SocialListFooterProps = {
  isEndOfList: boolean;
};

function SocialListFooter({ isEndOfList }: SocialListFooterProps) {
  return (
    <View>
      {isEndOfList ? (
        <StyledText style={{ textAlign: 'center' }}>Not more social posts at this time</StyledText>
      ) : null}
    </View>
  );
}

type SocialListEmptyProps = {
  isLoading: boolean;
};

function SocialListEmpty({ isLoading }: SocialListEmptyProps) {
  if (isLoading) {
    return null;
  }

  return (
    <StyledText style={{ textAlign: 'center', marginTop: spacing.x10 }}>Nothing here</StyledText>
  );
}

const SocialFlatlist = forwardRef<
  RefreshListRef,
  {
    userIdToPullData?: string;
    headerItem?: ComponentType<any> | ReactElement | null | undefined;
  }
>(({ userIdToPullData, headerItem }, ref) => {
  // const socialPost = useSelector((state: RootState) => state.social.SocialPost);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

  const token = useSelector((state: RootState) => state.auth.userToken);

  const [page, setPage] = useState(1);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();

  const refreshContent = (shouldShowRefreshIndicator = false) => {
    setIsEndOfList(false);
    setPage(1);
    setIsRefreshing(true);

    if (shouldShowRefreshIndicator) {
      setShowRefreshIndicator(true);
    }
  };

  useImperativeHandle(ref, () => ({
    setRefreshing() {
      refreshContent();
    },
  }));

  const getSocialPosts = useCallback(
    async (pageNumber: number) => {
      setIsLoading(true);

      try {
        const res = await ApiCall({
          route: userIdToPullData
            ? `user/get-social/all/${userIdToPullData}/${pageNumber}?itemsPerPage=5`
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

      setPage(pageNumber);
    },
    [token, userIdToPullData]
  );

  useEffect(() => {
    getSocialPosts(page);
  }, [getSocialPosts, page]);

  // useEffect(() => {
  //   SetSocial([]);
  // }, []);

  useEffect(() => {
    if (isRefreshing) {
      getSocialPosts(1);
    }
  }, [getSocialPosts, isRefreshing]);
  const [isScrollEnable, setIsScrollEnable] = useState(true);

  const removePost = async (type: string, id: string) => {
    try {
      const res = await ApiCall({
        route: `social/remove-post/${id}`,
        verb: 'delete',
        token,
      });

      if (res?.status === 200) {
        getSocialPosts(1);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
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

  return (
    <FlatList
      data={socialPosts}
      style={{ flex: 1 }}
      keyExtractor={(item, index) => {
        return `${item?.userData?.username}-${item.id ?? item.postId}-${index}`;
      }}
      extraData={isRefreshing}
      scrollEnabled={isScrollEnable}
      ListHeaderComponent={headerItem}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          onPress={() => {
            if (item.postId) {
              navigation.navigate('SinglePost', {
                postId: item.postId,
              });
            }
          }}
        >
          <SocialItem
            itemData={item}
            onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
            index={index}
            parentRefreshContent={refreshContent}
            removePost={removePost}
            editPost={editPost}
          />
        </TouchableOpacity>
      )}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (!isLoading && !isRefreshing && !isEndOfList && socialPosts.length > 0)
          setPage(page + 1);
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
      ListEmptyComponent={<SocialListEmpty isLoading={isLoading} />}
    />
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
    //         {item?.source == 'twitter' ? <Twitter fill="#00acee" /> : null}
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
    //       <TouchableOpacity
    //         onPress={async () => {
    //           await getSocialPosts(page + 1);
    //         }}
    //       >
    //         <Text>View More</Text>
    //       </TouchableOpacity>
    //     </View>
    //   ) : null}
    // </>
  );
});
export default SocialFlatlist;
