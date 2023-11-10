import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  ScrollView,
  Text,
  View,
  RefreshControl,
  Image,
} from 'react-native';

import { TouchableOpacity } from 'react-native-gesture-handler';
import { styles } from './styles';
import Modal from 'react-native-modal';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AntDesign from 'react-native-vector-icons/AntDesign';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';

import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import SubscribeFlatlist from '../SubscribeFlatlist';
import Button from '../Button';
import { GeneralStyle } from '../../constants/GeneralStyle';

import SocialFlatlist from '../SocialFlatlist';
import { NavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import { SetRecentBlog } from '@/redux/actions/SocialActions';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/_Navigation/types';
import { OpenURLButton } from '@/src/Services/constants';
import { isObject } from 'lodash';
import Twitter from '@/assets/svg/Twitter.svg';
import { SceneRendererProps } from 'react-native-tab-view';
import OptionsModal from '../ListItems/OptionsModal';
import { ArticleType } from '@/utils/types';
import SocialItem from '../ListItems/SocialItem';
import { decode } from 'html-entities';
import ArticleItem from '../ListItems/ArticleItem';

type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

const HomeAllComponent = ({ jumpTo }: SceneRendererProps) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const todayNews = useSelector((state: RootState) => state.social.TodayNews);

  const recentBlog = useSelector((state: RootState) => state.social.RecentBlog);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const [show, setShow] = useState<boolean>();
  const [currentPopupItem, setCurrentPopupItem] = useState<ArticleType>();
  const [page, setPage] = useState<number>(1);
  const [socialPosts, setSocialPosts] = useState<any[]>();
  const navigation = useNavigation<ScreenNavigationProp>();

  const showModal = (item: ArticleType) => {
    setCurrentPopupItem(item);
    setShow(true);
  };

  const getRecentBlog = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/recent-blogs/${pageNumber}`,
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        dispatch(SetRecentBlog(res?.response));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
    setPage(pageNumber);
  };
  const { colors } = useTheme();

  const getSocialPosts = async () => {
    try {
      const res = await ApiCall({
        route: `user/get-following-social/1`,
        token,
        verb: 'get',
      });
      let posts = [];

      if (res?.status == 200) {
        posts = res?.response?.content ?? [];

        setSocialPosts(posts);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(`saga get twitter timline  error -- `, e.toString());
    }
  };

  const getData = async () => {
    try {
      const res = await ApiCall({
        route: `user/get-following-feed/1`,
        token,
        verb: 'get',
      });
      let posts = [];

      if (res?.status == 200) {
        posts = res?.response ?? [];

        setSocialPosts(posts);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(`saga get twitter timline  error -- `, e.toString());
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const [isScrollEnable, setIsScrollEnable] = useState(true);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 75 }}
        refreshControl={
          <RefreshControl
            enabled={true}
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await getRecentBlog(page + 1);
              setRefreshing(false);
            }}
          />
        }
      >
        {todayNews.length > 0 ? (
          <>
            <Text style={{ ...styles.newstitle, color: colors.text }}>Today's News</Text>
            <View>
              <FlatList
                nestedScrollEnabled
                data={todayNews}
                horizontal={true}
                contentContainerStyle={{ marginTop: 20 }}
                showsHorizontalScrollIndicator={false}
                ListHeaderComponent={() => <View style={{ padding: 7 }} />}
                ListFooterComponent={() => <View style={{ padding: 7 }} />}
                ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
                keyExtractor={(item, index) => `${item.created}_${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      OpenURLButton(item?.link);
                    }}
                  >
                    <ImageBackground
                      style={styles.newsimage}
                      imageStyle={{ borderRadius: 20 }}
                      source={{ uri: item?.image?.url }}
                    >
                      <View
                        style={{
                          backgroundColor: '#00171e',
                          borderRadius: 20,
                          opacity: 0.65,
                          flex: 1,
                        }}
                      ></View>
                      <View
                        style={{
                          height: '100%',
                          width: '100%',
                          position: 'absolute',
                          top: 0,
                          justifyContent: 'space-between',
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            showModal(item);
                          }}
                        >
                          <Entypo
                            name="dots-three-horizontal"
                            style={styles.newsicon}
                            size={25}
                            color={'white'}
                          />
                        </TouchableOpacity>
                        <Text style={styles.newstext}>{item?.title}</Text>
                        <View style={styles.newsview}>
                          <Text style={{ ...styles.messageText, color: '#B8BABE' }}>
                            {isObject(item?.author) ? item?.author?.a?.$text : item?.author}
                          </Text>
                          <Text style={styles.messageText}>{timeSince(item?.created)} ago</Text>
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                )}
              />
            </View>
          </>
        ) : null}

        <Text style={{ ...styles.socialposttext, color: colors.text }}>Latest Posts</Text>
        <View>
          <FlatList
            data={socialPosts}
            style={{ flex: 1 }}
            keyExtractor={(item, index) => {
              return `${item?.handler}-${item.id}-${index}`;
            }}
            scrollEnabled={isScrollEnable}
            renderItem={({ item, index }) => {
              if (item.type == 'social')
                return (
                  <SocialItem
                    item={item}
                    index={index}
                    onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
                  />
                );
              if (item.type == 'tasteBreaker') {
                return <Text>tasteBreaker</Text>;
              }

              return (
                <ArticleItem
                  item={item}
                  imageSizeType="cover"
                  blogPostStyle={{
                    ...styles.socialpostview,
                    backgroundColor: colors.card,
                    padding: 0,
                    margin: 7,
                    flex: 1,
                  }}
                  blogPostImageStyle={styles.socialpostimage}
                  blogPostTitleStyle={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                  showModal={showModal}
                />
              );
            }}
            ListFooterComponent={() => (
              <View style={{ alignSelf: 'center', alignContent: 'center' }}>
                <Button
                  text="View More"
                  btnTextStyle={{ color: '#032F3C', textAlign: 'center' }}
                  onPress={() => jumpTo('Social')}
                />
              </View>
            )}
          />
        </View>
        {recentBlog.length > 0 ? (
          <>
            <Text style={{ ...styles.blogposttext, color: colors.text }}>Recent Blog Post</Text>
            <View>
              <FlatList
                nestedScrollEnabled
                data={recentBlog}
                horizontal={true}
                contentContainerStyle={{ marginTop: 20 }}
                showsHorizontalScrollIndicator={false}
                ListHeaderComponent={() => <View style={{ padding: 7 }} />}
                ListFooterComponent={() => <View style={{ padding: 7 }} />}
                ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
                keyExtractor={(item, index) => `${item.created}_${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      OpenURLButton(item?.link);
                    }}
                    style={{ ...styles.blogpostview, backgroundColor: colors.card }}
                  >
                    <FastImage
                      style={styles.blogpostimage}
                      resizeMode={'stretch'}
                      source={{ uri: item?.image?.url }}
                    />
                    <Text numberOfLines={2} style={{ ...styles.blogpostpara, color: colors.text }}>
                      {isObject(item?.title) ? decode(item?.title?.a.$text) : decode(item?.title)}
                    </Text>
                    <Text style={styles.blogposthour}>{timeSince(item?.created)} ago</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </>
        ) : null}

        <View style={styles.explorview}>
          <Text style={{ ...styles.explortext, color: colors.text }}>
            Explore Influencers & Organizations
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Explore')} style={styles.viewtext}>
            <Text style={{ color: '#126B87' }}>View more</Text>
            <Fontisto name="angle-right" size={12} color="#126B87" />
          </TouchableOpacity>
        </View>
        <View style={{ paddingLeft: 5 }}>
          <SubscribeFlatlist horizontal={true} />
        </View>
      </ScrollView>
    </View>
  );
};
export default HomeAllComponent;
