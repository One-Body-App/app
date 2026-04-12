import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View, RefreshControl, TouchableOpacity } from 'react-native';
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

type PrayerWallSavedPrayersProps = {
  onOpenPost?: (postId: string) => void;
  onEditPost?: (postId: string) => void;
  onScrollOffsetChange?: (offsetY: number) => void;
};

function PrayerWallSavedPrayersComponent({
  onOpenPost,
  onEditPost,
  onScrollOffsetChange,
}: PrayerWallSavedPrayersProps) {
  const navigation = useNavigation<NavigationProp<PrayerWallStackParamsList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const [isEndOfList, setIsEndOfList] = useState(false);

  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const [savedPosts, setSavedPosts] = useState<PrayerPost[]>([]);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (token) {
      dispatch(
        getProfile.Request({
          token,
          pullSavedData: true,
        })
      );
    }
  }, [token, refreshing]);

  useEffect(() => {
    setRefreshing(false);
  }, [authState.getProfileSuccess]);

  const getPrayerPosts = async (pageNumber: number) => {
    setIsLoading(true);

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

        setSavedPosts(posts);
      } else {
        console.log('error', res?.response);
      }
      setIsLoading(false);
      setRefreshing(false);
      // setShowRefreshIndicator(false);
    } catch (e: any) {
      console.log(e.toString());
    }
    setIsLoading(false);
    setRefreshing(false);
    // setShowRefreshIndicator(false);
  };

  useEffect(() => {
    // getPrayers(currentPage);
    getPrayerPosts(page);
    // dispatch(
    //   getAllPrayer({
    //     page,
    //     token: token,
    //     Prayers: prayers,
    //     setIsLoading: setIsLoading,
    //   })
    // );
  }, [page]);

  const getData = async () => {
    await getPrayerPosts(page);
  };

  const removePost = async (type: string, id: string) => {
    try {
      const res = await ApiCall({
        route: `prayer/${id}`,
        verb: 'delete',
        token,
      });

      if (res?.status == 200) {
        getData();
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
        data={savedPosts}
        showsHorizontalScrollIndicator={false}
        // onEndReached={() => {
        //   if (!isLoading && !refreshing && !isEndOfList) setPage(page + 1);
        // }}
        style={{
          flexGrow: 1,
        }}
        keyExtractor={(item, index) => {
          const postKey = item.postId ?? item.id ?? `row-${index}`;
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
        scrollEnabled={isScrollEnable}
        onScroll={(event) => {
          onScrollOffsetChange?.(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const postId = item.postId ?? item.id;
          const openPost = () => {
            if (!postId) return;
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
export default PrayerWallSavedPrayersComponent;
