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
import { OpenURLButton } from '@/src/Services/constants';
import Button from '../Button';
import { GeneralStyle } from '@/src/constants/GeneralStyle';

const InstagramFlatlist = ({
  currentUser,
  setScrollPosition,
}: SceneRendererProps & { currentUser: User; setScrollPosition: (position: number) => void }) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [page, setPage] = useState<number>(1);
  const [instagramPosts, setInstagramPosts] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);

  const getInstagramData = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `user/get-social-instagram/${currentUser._id}/${pageNumber}?itemsPerPage=5`,
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

  if (instagramPosts.length) {
    return (
      <FlatList
        data={instagramPosts}
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
        ListFooterComponent={() => {
          return (
            <Button
              text="View more on Instagram"
              // btnStyle={{
              //   ...GeneralStyle.btn,
              //   marginHorizontal: 20,
              //   // backgroundColor: colors.background,
              // }}
              // btnTextStyle={{
              //   marginHorizontal: 20,
              //   color: '#70747D',
              //   fontSize: 14,
              // }}
              mode="text"
              paper
              textColor="#70747D"
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
  } else {
    return null;
  }
};
export default InstagramFlatlist;
