import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { styles } from './styles';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Entypo from 'react-native-vector-icons/Entypo';
import { getHeight, getWidth, timeSince } from '@/utils/ResponsiveFun';
import SubscribeFlatlist from '../SubscribeFlatlist';

import { useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { ApiCall } from '@/services/api';
import { SetAllNews, SetLocalNews } from '@/redux/actions/SocialActions';
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
    console.log(state.social, 'state.social');
    return isArray(state.social.AllNews) ? state.social.AllNews : [];
  });
  // const LocalNews = useSelector((state: RootState) => state.social.LocalNews);

  const dispatch = useDispatch();

  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const getAllNews = async (pageNumber: number) => {
    dispatch(setLoader(true));
    console.log('newsssss');
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
        } else {
          news = [...allNews, ...(res?.response ?? [])];
        }
        console.log(news.length, news);
        dispatch(SetAllNews(news));
        // }
        dispatch(setLoader(false));
      } else {
        dispatch(setLoader(false));
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
    setPage(pageNumber);
  };
  // const getLocalNews = async (pageNumber: number) => {
  //   try {
  //     const res = await ApiCall({
  //       route: `blogs/get-feed/local-news/${pageNumber}`,
  //       verb: 'get',
  //       token: token,
  //     });
  //     if (res?.status == 200) {
  //       dispatch(SetLocalNews(res?.response));
  //     } else {
  //       console.log('error', res?.response);
  //       dispatch(setLoader(false));
  //     }
  //   } catch (e: any) {
  //     console.log('saga error -- ', e.toString());
  //   }
  //   setPage(pageNumber);
  // };

  useEffect(() => {
    const getData = async () => {
      await getAllNews(1);
      // await getLocalNews(1);
    };
    getData();
  }, []);

  const { colors } = useTheme();
  console.log(allNews, 'allNews');
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            enabled={true}
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await getAllNews(page + 1);
              setRefreshing(false);
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 75 }}
      >
        <Text style={{ ...styles.newstitle, color: colors.text }}>Today's News</Text>

        <View>
          {/* {allNews?.map((item, i) => (
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
              key={i}
            >
              {item?.image ? (
                <FastImage
                  style={styles.socialpostimage}
                  resizeMode={'stretch'}
                  source={{ uri: item?.image?.url }}
                />
              ) : null}
              <View style={{ flex: 1, width: '100%', padding: 15 }}>
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
                    {isObject(item?.title) ? item?.title?.a?.$text : item?.title}
                  </Text>
                  <Entypo name="dots-three-horizontal" color={'#70747d'} size={20} />
                </View>
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
          ))}
          <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
            <TouchableOpacity
              onPress={async () => {
                await getAllNews(page + 1);
              }}
            >
              <Text>View More</Text>
            </TouchableOpacity>
          </View> */}

          <FlatList
            nestedScrollEnabled
            data={allNews}
            contentContainerStyle={{ marginTop: 20 }}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
            keyExtractor={(item, index) => `${item.title}-${index}`}
            renderItem={({ item }: Record<string, any>) => {
              console.log(item, 'item');
              return (
                <TouchableOpacity
                  onPress={() => {
                    // navigation.navigate('BlogView', { url: item?.item?.id });
                    OpenURLButton(item?.link);
                    console.log(item);
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
                        {item?.title}
                      </Text>
                      <Entypo name="dots-three-horizontal" color={'#70747d'} size={20} />
                    </View>
                    <View style={styles.sourcename}>
                      <Text
                        style={{
                          color: '#70747D',
                          fontSize: 12,
                          fontWeight: '400',
                        }}
                      >
                        {item?.author}
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
          />
        </View>
        {/* {LocalNews.length > 0 ? (
          <>
            <Text style={{ ...styles.newstitle, color: colors.text }}>Local News</Text>
            <View>
              {LocalNews?.map((item, i) => (
                <ImageBackground
                  style={{
                    width: getWidth(90),
                    height: getHeight(14),
                    alignSelf: 'center',
                    // padding: 7,
                    margin: 7,
                  }}
                  imageStyle={{ borderRadius: 10, padding: 7 }}
                  source={{ uri: item?.image?.url }}
                  key={i}
                >
                  <View
                    style={{
                      backgroundColor: '#000000',
                      borderRadius: 10,
                      opacity: 0.65,
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={styles.textstyle}>{item?.title}</Text>
                  </View>
                </ImageBackground>
              ))}
              {/* <FlatList
            nestedScrollEnabled
            data={LocalNews}
            contentContainerStyle={{ marginTop: 20 }}
            showsHorizontalScrollIndicator={false}
            ListFooterComponent={() => (
              <View style={styles.socialpostfooter}>
                <Text style={{ color: '#888C93' }}>View more</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
            renderItem={({ item }) => (
              <ImageBackground
                style={{
                  width: getWidth(90),
                  height: getHeight(14),
                  alignSelf: 'center',
                }}
                imageStyle={{ borderRadius: 10 }}
                source={{ uri: item?.image?.url  }}
              >
                <View
                  style={{
                    backgroundColor: '#000000',
                    borderRadius: 10,
                    opacity: 0.65,
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={styles.textstyle}>{item?.title}</Text>
                </View>
              </ImageBackground>
            )}
          />
            </View>
          </>
        ) : null} */}
      </ScrollView>
    </View>
  );
};
export default HomeNewsComponent;
