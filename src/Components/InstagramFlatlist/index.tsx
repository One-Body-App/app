import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, View } from 'react-native';
import { styles } from './styles';
import Social from '@/assets/svg/Social.svg';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { SceneRendererProps } from 'react-native-tab-view';
import { ApiCall } from '@/src/Services/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { User } from '@/utils/types';
import SocialItem from '../ListItems/SocialItem';

const InstagramFlatlist = ({ currentUser }: SceneRendererProps & { currentUser: User }) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [page, setPage] = useState<number>(1);
  const [instagramPosts, setInstagramPosts] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);

  const getInstagramData = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `user/get-social-instagram/${currentUser._id}/${pageNumber}`,
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        let instagramData = [];

        if (pageNumber == 1) {
          instagramData = res?.response.content ?? [];
          setIsEndOfList(false);
        } else {
          instagramData = [...instagramPosts, ...(res?.response.content ?? [])];
          if (res?.response.hasMore < 1) {
            setIsEndOfList(true);
          }
        }

        setInstagramPosts(instagramData);
      } else {
        console.log('error', res?.response);
      }
      setLoadingMore(false);
      setRefreshing(false);
    } catch (e: any) {
      console.log(e);
      setLoadingMore(false);
      setRefreshing(false);
    }
    setPage(pageNumber);
  };

  useEffect(() => {
    getInstagramData(page);
  }, [page]);

  return (
    <FlatList
      data={instagramPosts}
      contentContainerStyle={{ marginTop: getHeight(1) }}
      showsHorizontalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
      renderItem={({ item }) => <SocialItem item={item} />}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          enabled={true}
          refreshing={refreshing}
          onRefresh={async () => {
            setIsEndOfList(false);
            setRefreshing(true);
            setPage(1);
          }}
        />
      }
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (!loadingMore && !refreshing && !isEndOfList) setPage(page + 1);
      }}
    />
  );
};
export default InstagramFlatlist;
