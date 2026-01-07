import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, View } from 'react-native';
import { SceneRendererProps } from 'react-native-tab-view';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { styles } from './styles';
import Social from '@/assets/svg/Social.svg';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { User } from '@/utils/types';
import SocialItem from '../listItems/SocialItem';
import { OpenURLButton } from '@/services/constants';
import Button from '../Button';
import GeneralStyle from '@/src/constants/GeneralStyle';

function InstagramFlatlist({
  currentUser,
  setScrollPosition,
}: SceneRendererProps & { currentUser: User; setScrollPosition: (position: number) => void }) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [page, setPage] = useState<number>(1);
  const [instagramPosts, setInstagramPosts] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);

  const getInstagramData = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `user/get-social/instagram/${currentUser._id}/${pageNumber}?itemsPerPage=5`,
        verb: 'get',
        token,
      });

      if (res?.status == 200) {
        let instagramData = [];

        if (pageNumber == 1) {
          instagramData = res?.response ?? [];
          setIsEndOfList(false);
        } else {
          instagramData = [...instagramPosts, ...(res?.response ?? [])];
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
      setLoadingMore(false);
      setRefreshing(false);
    }
    setPage(pageNumber);
  };

  useEffect(() => {
    if (currentUser) {
      getInstagramData(page);
    }
  }, [page, currentUser]);
  const [visibleItemsIndex, setVisibleItemsIndex] = useState<number[]>([]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setVisibleItemsIndex(viewableItems.map((item: any) => item.index));
    }
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
  const { colors } = useTheme();
  const [isScrollEnable, setIsScrollEnable] = useState(true);

  if (instagramPosts.length) {
    return (
      <FlatList
        data={instagramPosts}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        contentContainerStyle={{ marginTop: getHeight(1) }}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
        scrollEnabled={isScrollEnable}
        renderItem={({ item, index }) => (
          <SocialItem
            index={index}
            onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
            visible={
              visibleItemsIndex && visibleItemsIndex.length > 0
                ? visibleItemsIndex?.indexOf(index) > -1
                : false
            }
            itemData={item}
            socialPostviewStyle={{ backgroundColor: colors.card }}
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
        ListFooterComponent={() => {
          return (
            <Button
              text="View more on Instagram"
              // btnStyle={{
              //   ...GeneralStyle.btn,
              //   marginHorizontal: 20,
              //   // backgroundColor: colors.background,
              // }}
              btnTextStyle={{
                marginHorizontal: 20,
                color: '#70747D',
                fontSize: 14,
              }}
              onPress={() => {
                OpenURLButton(
                  `https://instagram.com/${currentUser.influencerProfile?.instagramHandler}`,
                  true
                );
              }}
            />
          );
        }}
      />
    );
  }
  return null;
}
export default InstagramFlatlist;
