import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Animated,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScaledSize,
  StyleSheet,
  FlatList,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Button,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { Avatar, Text, Title } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { TabView, SceneMap, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { styles } from './styles';
import HomeAllComponent from '@/components/HomeAllComponent';
import HomeNewsComponent from '@/components/HomeNewsComponent';
import HomeSocialComponent from '@/components/HomeSocialComponent';
import HomeBlogComponent from '@/components/HomeBlogComponent';

import { setPrayersLive } from '@/redux//actions/GeneralActions';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import LogoHeader from '@/assets/svg/logo2.svg';
import { useDispatch, useSelector } from 'react-redux';

import { ApiCall } from '@/services/api';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { useTheme } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

import { Tag } from '@/src/Components/Tag';
import SocialItem from '@/src/Components/ListItems/SocialItem';
import ArticleItem from '@/src/Components/ListItems/ArticleItem';
import { ArticleType } from '@/utils/types';
interface Props {
  setRequestModel: (requestModel: boolean) => void;
  openDrawer: () => void;
  navigate: (screenName: string) => void;
}

enum FeedTypes {
  All = 'All',
  News = 'News',
  Social = 'Social',
  Blog = 'Blog',
}

type feedOptions = {
  type: FeedTypes;
  page: number;
};

const feedTypes: FeedTypes[] = [FeedTypes.All, FeedTypes.News, FeedTypes.Social, FeedTypes.Blog];

const Home = ({ openDrawer, navigate, setRequestModel }: Props) => {
  const [index, setIndex] = React.useState(0);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const dispatch = useDispatch();

  const [routes] = React.useState([
    { key: 'All', title: 'ALL' },
    { key: 'News', title: 'NEWS' },
    { key: 'Social', title: 'SOCIAL' },
    { key: 'Blog', title: 'BLOG' },
  ]);
  const renderScene = SceneMap({
    All: HomeAllComponent,
    News: HomeNewsComponent,
    Social: HomeSocialComponent,
    Blog: HomeBlogComponent,
  });

  const getAllLive = async () => {
    try {
      const res = await ApiCall({
        route: 'prayers/live-wall',
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        dispatch(setPrayersLive(res?.response?.data));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga get all live prayer error -- ', e.toString());
    }
  };

  const [feedOptions, setFeedOptions] = useState<feedOptions>({
    type: feedTypes[0],
    page: 1,
  });

  const [feedData, setFeedData] = useState<any>();
  const [show, setShow] = useState<boolean>();
  const [currentPopupItem, setCurrentPopupItem] = useState<ArticleType>();

  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showModal = (item: ArticleType) => {
    setCurrentPopupItem(item);
    setShow(true);
  };

  const getData = async (page: number) => {
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/all/${page}`,
        token,
        verb: 'get',
      });
      let posts = [];
      console.log(res);
      if (res?.status == 200) {
        posts = res?.response ?? [];

        setFeedData(posts);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(`saga get twitter timline  error -- `, e.toString());
    }
  };

  const getFeedData = async (type: FeedTypes, pageNumber: number) => {
    setIsLoading(true);
    try {
      const res = await ApiCall({
        route: `user/get-following-feed/${type}/${pageNumber}`,
        token,
        verb: 'get',
      });
      let newFeedData = [];

      if (res?.status == 200) {
        newFeedData = [];

        if (pageNumber == 1) {
          newFeedData = res?.response ?? [];
          setIsEndOfList(false);
        } else {
          newFeedData = [...feedData, ...(res?.response ?? [])];
          if (res?.response.length < 1) {
            setIsEndOfList(true);
          }
        }

        setFeedData(newFeedData);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(`saga get twitter timline  error -- `, e.toString());
    }
    setIsLoading(false);
  };

  const { colors } = useTheme();

  useEffect(() => {
    // getData(page);
    getFeedData(feedOptions.type, feedOptions.page);
  }, [feedOptions]);

  const listRef = useRef<FlatList>(null);

  const filterUpdate = (itemValue: FeedTypes) => {
    setIsRefreshing(false);
    setFeedOptions({
      type: itemValue,
      page: 1,
    });

    // listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <>
      <SafeAreaView style={{ flex: 0, backgroundColor: '#126B87' }} />

      <SafeAreaView style={styles.continer}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginBottom: 20 }}>
            {feedTypes.map((feedType) => {
              return (
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    onPress={() => filterUpdate(feedType)}
                    style={feedOptions.type == feedType ? styles.menuItemSelected : styles.menuItem}
                  >
                    <Text
                      style={
                        feedOptions.type == feedType
                          ? styles.menuItemTextSelected
                          : styles.menuItemText
                      }
                    >
                      {feedType}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {isLoading && feedOptions.page == 1 && false ? (
            <View style={{ marginTop: 10 }}>
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              data={feedData}
              ref={listRef}
              style={{ flex: 1 }}
              keyExtractor={(item, index) => {
                return `${item?.handler}-${item.id}-${index}`;
              }}
              renderItem={({ item }) => {
                if (item.type == 'social')
                  return <SocialItem key={`social_${item.id}`} item={item} />;

                if (item.type == 'tasteBreaker') {
                  return (
                    <>
                      <Title style={{ marginLeft: 20 }}>Taste Breakers</Title>
                      <FlatList
                        nestedScrollEnabled
                        data={item.items}
                        horizontal={true}
                        contentContainerStyle={{ marginTop: 20 }}
                        showsHorizontalScrollIndicator={false}
                        ListHeaderComponent={() => <View style={{ padding: 7 }} />}
                        ListFooterComponent={() => <View style={{ padding: 7 }} />}
                        ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
                        keyExtractor={(item, index) => `${item.created}_${index}`}
                        renderItem={({ item }) => (
                          <ArticleItem
                            key={`article_${item.id}`}
                            item={item}
                            imageSizeType="cover"
                            blogPostStyle={{
                              ...styles.socialpostview,
                              backgroundColor: colors.card,
                              padding: 0,
                              margin: 7,
                              flex: 1,
                              width: 300,
                            }}
                            blogPostImageStyle={styles.socialpostimage}
                            blogPostTitleStyle={{
                              // flexDirection: 'row',
                              // justifyContent: 'space-between',
                              marginTop: getHeight(1),
                            }}
                            showModal={showModal}
                          />
                        )}
                      />
                    </>
                  );
                }
                return (
                  <ArticleItem
                    key={`article_${item.id}`}
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
                      marginTop: getHeight(1),
                    }}
                    showModal={showModal}
                  />
                );
              }}
              refreshing={isLoading}
              refreshControl={
                <RefreshControl
                  enabled={true}
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                  }}
                />
              }
              onEndReachedThreshold={0.5}
              onEndReached={() => {
                if (!isLoading && !isRefreshing && !isEndOfList) {
                  setFeedOptions({
                    ...feedOptions,
                    page: feedOptions.page + 1,
                  });
                }
              }}
              ListFooterComponent={() => (
                <View>{isLoading ? <ActivityIndicator size="small" /> : null}</View>
              )}
            />
          )}
          {/* <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            renderTabBar={(props) => {
              return (
                <View style={styles.tabBar}>
                  {props.navigationState.routes.map((route, i) => {
                    return (
                      <TouchableOpacity key={i} style={styles.tabItem} onPress={() => setIndex(i)}>
                        <Animated.Text
                          style={
                            props?.navigationState?.index == i
                              ? {
                                  color: theme.dark ? theme.colors.text : '#032F3C',
                                  fontWeight: 'bold',
                                }
                              : {
                                  color: theme.dark ? '#B2BEB5' : '#126B87',
                                  fontWeight: 'bold',
                                }
                          }
                        >
                          {route.title}
                        </Animated.Text>
                        {props?.navigationState?.index == i ? (
                          <View style={styles.propview} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            }}
            onIndexChange={setIndex}
            initialLayout={{ width: getWidth(100) }}
          /> */}
          {/* <TouchableWithoutFeedback
            onPress={() => {
              setRequestModel(true);
              getAllLive();
            }}
          >
            <Avatar.Image
              style={styles.fab}
              size={getFontSize(10)}
              source={require('@/assets/images/fab.png')}
            />
          </TouchableWithoutFeedback> */}
        </View>
      </SafeAreaView>
    </>
  );
};

export default Home;
