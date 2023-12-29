import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Text,
  View,
  RefreshControl,
  Keyboard,
  ActivityIndicator,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Avatar, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Entypo from 'react-native-vector-icons/Entypo';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

import FastImage from 'react-native-fast-image';
import AnswerPrayers from '../AnswerPrayers';
import { getTestimonies } from '@/src/redux/actions/PrayerAction';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Love from '@/assets/svg/redlove.svg';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import PrayerItem from '../listItems/PrayerItem';
import { ApiCall } from '@/src/services/api';
import { PrayerPost, PrayerWallCategory } from '@/utils/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { PrayerWallStackParamsList } from '@/src/navigator/types';
import { setPrayers } from '@/src/redux/actions/GeneralActions';
import { StyledText } from '../styled/Text';
import { Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

const PrayerWallTestimoniesComponent = () => {
  const navigation = useNavigation<NavigationProp<PrayerWallStackParamsList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const [isKeyboardVisible, setKeyboardVisible] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [testimonies, setTestimonies] = useState<PrayerPost[]>();
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isEndOfList, setIsEndOfList] = useState(false);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshing(true);
      getPrayerPosts(1);
    });

    return unsubscribe;
  }, [navigation]);

  const getPrayerPosts = async (pageNumber: number) => {
    setIsLoading(true);

    try {
      const res = await ApiCall({
        route: `prayer?page=${pageNumber}&filter=${PrayerWallCategory.AnsweredPrayer}`,
        token,
        verb: 'get',
      });
      let posts = [];
      console.log(res);
      if (res?.status == 200) {
        setHasMore(res?.response.hasMore);
        if (pageNumber == 1) {
          posts = res?.response ?? [];
          setIsEndOfList(false);
        } else {
          posts = [...(testimonies ? testimonies : []), ...(res?.response ?? [])];
          if (res?.response?.content?.length < 1) {
            setIsEndOfList(true);
          }
        }
        setTestimonies(posts);
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
        data={testimonies}
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
export default PrayerWallTestimoniesComponent;
