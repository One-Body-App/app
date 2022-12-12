import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, View } from 'react-native';
import { styles } from './styles';
import Twitter from '@/assets/svg/Twitter.svg';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import SocialItem from '../ListItems/SocialItem';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { SceneRendererProps } from 'react-native-tab-view';
import { User } from '@/utils/types';

const TwitterFlatlist = ({ currentUser }: SceneRendererProps & { currentUser: User }) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [page, setPage] = useState<number>(1);
  const [tweets, setTweets] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);

  const getTwitterData = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `user/get-social-twitter/${currentUser._id}/${pageNumber}`,
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        let tweetsData = [];

        if (pageNumber == 1) {
          tweetsData = res?.response.content ?? [];
          setIsEndOfList(false);
        } else {
          tweetsData = [...tweets, ...(res?.response.content ?? [])];
          if (res?.response.hasMore < 1) {
            setIsEndOfList(true);
          }
        }

        setTweets(tweetsData);
      } else {
        console.log('error', res?.response);
      }
      setLoadingMore(false);
      setRefreshing(false);
    } catch (e: any) {
      setLoadingMore(false);
      setRefreshing(false);
    }
    setPage(pageNumber);
  };

  useEffect(() => {
    getTwitterData(1);
  }, []);
  console.log(tweets);
  return (
    <FlatList
      data={tweets}
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
export default TwitterFlatlist;
