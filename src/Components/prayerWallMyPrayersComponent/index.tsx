import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View, RefreshControl, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import { PrayerPost, PrayerWallCategory } from '@/utils/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { PrayerWallStackParamsList } from '@/src/navigator/types';
import { StyledText } from '../styled/Text';
import { Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import PrayerItem from '../listItems/PrayerItem';
import { ApiCall } from '@/services/api';

const PrayerWallMyPrayersComponent = () => {
  const navigation = useNavigation<NavigationProp<PrayerWallStackParamsList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [myPrayers, setMyPrayers] = useState<PrayerPost[]>();
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const [isEndOfList, setIsEndOfList] = useState(false);

  const getPrayerPosts = async (pageNumber: number) => {
    setIsLoading(true);

    try {
      const res = await ApiCall({
        route: `prayer?page=${pageNumber}&filter=${PrayerWallCategory.MyPrayers}`,
        token,
        verb: 'get',
      });
      let posts = [];

      if (res?.status == 200) {
        if (pageNumber == 1) {
          posts = res?.response ?? [];
          setIsEndOfList(false);
        } else {
          posts = [...(myPrayers ? myPrayers : []), ...(res?.response ?? [])];

          if (res?.response?.content?.length < 1) {
            setIsEndOfList(true);
          }
        }
        setMyPrayers(posts);
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

  const removePost = async (id: string) => {
    try {
      const res = await ApiCall({
        route: `prayer/${id}`,
        verb: 'delete',
        token: token,
      });

      if (res?.status == 200) {
        getData();
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const editPost = async (id: string) => {
    navigation.navigate('Prayer', { postId: id });
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={myPrayers}
        showsHorizontalScrollIndicator={false}
        onEndReached={() => {
          if (!isLoading && !refreshing && !isEndOfList) setPage(page + 1);
        }}
        style={{
          flexGrow: 1,
        }}
        keyExtractor={(item, index) => item.postId ?? item.id ?? index}
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
        onEndReachedThreshold={0.8}
        scrollEnabled={isScrollEnable}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => {
              if (item.postId) {
                navigation.navigate('Single', {
                  postId: item.postId,
                });
              }
            }}
          >
            <PrayerItem
              editPost={editPost}
              removePost={removePost}
              item={item}
              index={index}
              onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
export default PrayerWallMyPrayersComponent;
