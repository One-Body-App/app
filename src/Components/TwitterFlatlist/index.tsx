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
import Button from '../Button';
import { OpenURLButton } from '@/src/Services/constants';
import { GeneralStyle } from '@/src/constants/GeneralStyle';

const TwitterFlatlist = ({
  currentUser,
  setScrollPosition,
}: SceneRendererProps & { currentUser: User; setScrollPosition: (position: number) => void }) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [page, setPage] = useState<number>(1);
  const [tweets, setTweets] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);

  const getTwitterData = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `user/get-social-twitter/${currentUser._id}/${pageNumber}?itemsPerPage=5`,
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
    getTwitterData(page);
  }, [page]);

  return (
    <FlatList
      data={tweets}
      contentContainerStyle={{ marginTop: getHeight(1) }}
      showsHorizontalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
      renderItem={({ item }) => <SocialItem item={item} />}
      keyExtractor={(item) => item.id}
      onScroll={(e) => {
        if (setScrollPosition) setScrollPosition(e.nativeEvent.contentOffset.y);
      }}
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
      ListFooterComponentStyle={{
        marginBottom: 20,
      }}
      ListFooterComponent={() => {
        return (
          <Button
            text="View more on Twitter"
            btnStyle={{
              ...GeneralStyle.btn,
              marginHorizontal: 20,
              // backgroundColor: colors.background,
            }}
            btnTextStyle={{
              marginHorizontal: 20,
              color: '#70747D',
              fontSize: 14,
            }}
            onPress={() => {
              OpenURLButton(
                `https://twitter.com/${currentUser.influencerProfile?.twitterHandler}`,
                true
              );
            }}
          />
        );
      }}
    />
  );
};
export default TwitterFlatlist;
