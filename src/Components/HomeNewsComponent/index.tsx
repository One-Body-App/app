import React, { useEffect, useState } from 'react';
import { FlatList, Text, View, TouchableOpacity, RefreshControl } from 'react-native';
import { styles } from './styles';
import Entypo from 'react-native-vector-icons/Entypo';
import { timeSince } from '@/utils/ResponsiveFun';

import { useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { ApiCall } from '@/services/api';
import { SetAllNews } from '@/redux/actions/SocialActions';
import { useDispatch, useSelector } from 'react-redux';
import { setLoader } from '@/redux/actions/GeneralActions';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { OpenURLButton } from '@/src/Services/constants';
import { RootStackParamList } from '@/src/Navigation/types';
import { StackScreenProps } from '@react-navigation/stack';
import { isArray, isObject } from 'lodash';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

const HomeNewsComponent = ({ navigation }: Props) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const allNews = useSelector((state: RootState) => {
    return isArray(state.social.AllNews) ? state.social.AllNews : [];
  });

  const dispatch = useDispatch();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isEndOfList, setIsEndOfList] = useState(false);

  const [page, setPage] = useState(1);

  const getAllNews = async (pageNumber: number) => {
    dispatch(setLoader(true));
    setLoadingMore(true);
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/all-news/${pageNumber}`,
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        // if (pageNumber > 1 && res?.response) {

        let news = [];

        if (pageNumber == 1) {
          news = res?.response ?? [];
          setIsEndOfList(false);
        } else {
          news = [...allNews, ...(res?.response ?? [])];
          if (news.length < 1) {
            setIsEndOfList(true);
          }
        }

        dispatch(SetAllNews(news));

        setLoadingMore(false);
        setRefreshing(false);
        dispatch(setLoader(false));
      } else {
        setLoadingMore(false);
        setRefreshing(false);
        dispatch(setLoader(false));
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
    setPage(pageNumber);
  };

  useEffect(() => {
    const getData = async () => {
      await getAllNews(page);
    };
    getData();
  }, [page]);

  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ ...styles.newstitle, color: colors.text }}>Today's News</Text>

      <FlatList
        refreshControl={
          <RefreshControl
            enabled={true}
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              setPage(1);
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 75, marginTop: 20 }}
        data={allNews}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        renderItem={({ item }: Record<string, any>) => {
          let title = item?.title?.a?.$text ? item?.title?.a?.$text : item?.title;
          if (typeof title != 'string') {
            title = '';
          }
          return (
            <TouchableOpacity
              onPress={() => {
                // navigation.navigate('BlogView', { url: item?.item?.id });
                OpenURLButton(item?.link);
              }}
              style={{
                ...styles.socialpostview,
                backgroundColor: colors.card,

                margin: 7,
              }}
            >
              {item?.image ? (
                <FastImage
                  style={styles.socialpostimage}
                  resizeMode={'stretch'}
                  source={{ uri: item?.image?.url }}
                />
              ) : null}
              <View style={{ flex: 1, width: '100%', padding: 15 }}>
                {title ? (
                  <View style={styles.afsd}>
                    <Text
                      numberOfLines={2}
                      style={{
                        color: colors.text,
                        fontSize: 14,
                        lineHeight: 17,
                        letterSpacing: 0.1,
                        width: '90%',
                        fontWeight: '500',
                      }}
                    >
                      {title}
                    </Text>
                    <Entypo name="dots-three-horizontal" color={'#70747d'} size={20} />
                  </View>
                ) : null}

                <View style={styles.sourcename}>
                  <Text
                    style={{
                      color: '#70747D',
                      fontSize: 12,
                      fontWeight: '400',
                    }}
                  >
                    {isObject(item?.author) ? item?.author?.a?.$text : item?.author}
                  </Text>
                  <Text
                    style={{
                      color: '#70747D',
                      fontSize: 12,
                      fontWeight: '400',
                    }}
                  >
                    {timeSince(item?.created)} ago
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loadingMore && !refreshing) setPage(page + 1);
        }}
        ListFooterComponent={() => (
          <View>
            {isEndOfList ? (
              <Text style={{ textAlign: 'center' }}>Not more news at this time</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
};
export default HomeNewsComponent;
