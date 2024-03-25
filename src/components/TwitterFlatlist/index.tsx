import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { SceneRendererProps } from 'react-native-tab-view';
import { useTheme } from '@react-navigation/native';
import { styles } from './styles';
import Twitter from '@/assets/svg/Twitter.svg';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { ApiCall } from '@/src/services/api';
import SocialItem from '../listItems/SocialItem';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { User } from '@/utils/types';
import Button from '../Button';
import { OpenURLButton } from '@/services/constants';
import { GeneralStyle } from '@/src/constants/GeneralStyle';

function TwitterFlatlist({
  currentUser,
  setScrollPosition,
}: SceneRendererProps & { currentUser: User; setScrollPosition: (position: number) => void }) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [page, setPage] = useState<number>(1);
  const [tweets, setTweets] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);

  const getTwitterData = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `user/get-social/twitter/${currentUser._id}/${pageNumber}?itemsPerPage=5`,
        verb: 'get',
        token,
      });

      if (res?.status == 200) {
        let tweetsData = [];

        if (pageNumber == 1) {
          tweetsData = res?.response ?? [];
          setIsEndOfList(false);
        } else {
          tweetsData = [...tweets, ...(res?.response ?? [])];
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

  const { colors } = useTheme();
  const [isScrollEnable, setIsScrollEnable] = useState(true);

  return (
    <FlatList
      data={tweets}
      contentContainerStyle={{ marginTop: getHeight(1) }}
      showsHorizontalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
      scrollEnabled={isScrollEnable}
      renderItem={({ item, index }) => (
        <SocialItem
          key={item.id}
          index={index}
          itemData={item}
          socialPostviewStyle={{ backgroundColor: colors.card }}
          onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
        />
      )}
      keyExtractor={(item) => item.id}
      onScroll={(e) => {
        if (setScrollPosition) setScrollPosition(e.nativeEvent.contentOffset.y);
      }}
      refreshControl={
        <RefreshControl
          enabled
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
          <View style={{ flex: 1, alignItems: 'center' }}>
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
          </View>
        );
      }}
    />
  );
}
export default TwitterFlatlist;
