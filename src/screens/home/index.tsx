import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';

import { useSelector } from 'react-redux';
import { CompositeScreenProps, useTheme, useScrollToTop } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { ArrowDown2, Notification } from 'iconsax-react-native';
import { styles } from './styles';

import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';

import SocialItem from '@/components/listItems/SocialItem';
import ArticleItem from '@/components/listItems/ArticleItem';

import { ArticleType } from '@/utils/types';
import { styles as globalStyle } from '@/components/listItems/style';

import {
  HomeStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MainStackParamList,
} from '@/src/navigator/types';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';
import WatchComponent from '@/screens/home/watch';
import { getHeight } from '@/utils/ResponsiveFun';

export enum FeedTypes {
  Connected = 'connected',
  ForYou = 'foryou',
  Read = 'read',
  Pray = 'pray',
  Watch = 'watch',
}

type FeedOptions = {
  type: FeedTypes;
  page: number;
};

const feedTypes: FeedTypes[] = [FeedTypes.Read, FeedTypes.Pray, FeedTypes.Watch];

type Props = CompositeScreenProps<
  StackScreenProps<HomeStackParamsList, 'Home'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    CompositeScreenProps<
      DrawerScreenProps<MainBottomStackParamsList, 'HomeTab'>,
      StackScreenProps<MainStackParamList, 'MainRoot'>
    >
  >
>;

function Home({ navigation, route }: Props) {
  const token = useSelector((state: RootState) => state.auth.userToken);

  const [feedOptions, setFeedOptions] = useState<FeedOptions>({
    type: route.params?.selectedTab ?? FeedTypes.Connected,
    page: 1,
  });

  const [feedSubType, setFeedSubType] = useState<FeedTypes>(FeedTypes.Connected);

  const [visibleItemsIndex, setVisibleItemsIndex] = useState<number[]>([]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 100,
    // waitForInteraction: true,
    minimumViewTime: 10,
  };

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

  const [feedData, setFeedData] = useState<any>();
  const [show, setShow] = useState<boolean>();
  const [currentPopupItem, setCurrentPopupItem] = useState<ArticleType>();

  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectVisible, setSelectVisible] = useState(false);
  const [position, setPosition] = useState<any>();

  const showModal = (item: ArticleType) => {
    setCurrentPopupItem(item);
    setShow(true);
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

      if (res?.status === 200) {
        newFeedData = [];

        if (pageNumber === 1) {
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
        setFeedData([]);
        setIsEndOfList(true);
      }
    } catch (e: any) {
      setFeedData([]);
      console.log(`saga get twitter timline  error -- `, e.toString());
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  const { colors, dark } = useTheme();

  useEffect(() => {
    // getData(page);
    getFeedData(feedOptions.type, feedOptions.page);
  }, [feedOptions]);

  useEffect(() => {
    if (route.params?.selectedTab) {
      setFeedOptions({
        type: route.params?.selectedTab,
        page: 1,
      });
    }
  }, [route.params]);

  useEffect(() => {
    // getData(page);
    if (isRefreshing) {
      getFeedData(feedOptions.type, feedOptions.page);
      setIsEndOfList(false);
    }
  }, [isRefreshing]);

  const listRef = useRef<FlatList>(null);
  useScrollToTop(listRef);

  const filterUpdate = (itemValue: FeedTypes) => {
    setIsRefreshing(false);

    listRef.current?.scrollToOffset({
      animated: true,
      offset: 0,
    });

    setFeedOptions({
      type: itemValue,
      page: 1,
    });

    // listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const cardSecondaryColor = dark ? '#353535' : '#DDD';

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsRefreshing(true);
    });

    return unsubscribe;
  }, [navigation]);

  const [isScrollEnable, setIsScrollEnable] = useState(true);

  const removePost = async (type: string, id: string) => {
    try {
      const res = await ApiCall({
        route: `social/remove-post/${id}`,
        verb: 'delete',
        token,
      });

      if (res?.status == 200) {
        getFeedData(feedOptions.type, feedOptions.page);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const editPost = async (id: string) => {
    navigation.navigate('Post');
    // try {
    //   const res = await ApiCall({
    //     route: `social/edit-post/${id}`,
    //     verb: 'patch',
    //     token: token,
    //   });

    //   if (res?.status == 200) {
    //     getFeedData(feedOptions.type, feedOptions.page);
    //   }
    // } catch (e: any) {
    //   console.log('saga error -- ', e.toString());
    // }
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flex: 0,
          flexDirection: 'row',
          marginHorizontal: spacing.x5,
          // marginBottom: 20,

          height: getHeight(5.8),
        }}
      >
        <View style={{ flex: 1.4 }} key="main">
          <TouchableOpacity
            onPress={() => {
              if (
                feedOptions.type === FeedTypes.Connected ||
                feedOptions.type === FeedTypes.ForYou
              ) {
                setFeedSubType(
                  feedOptions.type === FeedTypes.Connected ? FeedTypes.ForYou : FeedTypes.Connected
                );
                filterUpdate(
                  feedOptions.type === FeedTypes.Connected ? FeedTypes.ForYou : FeedTypes.Connected
                );
              } else {
                filterUpdate(
                  feedSubType === FeedTypes.Connected ? FeedTypes.Connected : FeedTypes.ForYou
                );
              }
            }}
            style={
              feedOptions.type === FeedTypes.Connected || feedOptions.type === FeedTypes.ForYou
                ? [styles.menuItemSelected]
                : [styles.menuItem]
            }
          >
            <View style={{ flexDirection: 'row' }}>
              <StyledText
                style={
                  feedOptions.type === FeedTypes.Connected || feedOptions.type === FeedTypes.ForYou
                    ? [
                        styles.menuItemText,
                        { fontWeight: 'bold', color: Colors.primarySapphire.brand },
                      ]
                    : [styles.menuItemText, { color: Colors.neutral[400] }]
                }
              >
                {feedOptions.type === FeedTypes.Read
                  ? 'Feed'
                  : feedSubType === FeedTypes.Connected
                    ? 'Connected'
                    : 'For You'}
              </StyledText>
              {feedOptions.type === FeedTypes.Read ? null : (
                <ArrowDown2
                  size={20}
                  color={
                    feedOptions.type === FeedTypes.Connected ||
                    feedOptions.type === FeedTypes.ForYou
                      ? Colors.primarySapphire.brand
                      : Colors.neutral[400]
                  }
                  style={{ marginLeft: spacing.x5 }}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {feedTypes.map((feedType, index) => (
          <View style={{ flex: index === 2 ? 1.3 : 0.8 }} key={feedType}>
            <TouchableOpacity
              onPress={() => {
                if (
                  (feedOptions.type === FeedTypes.Connected ||
                    feedOptions.type === FeedTypes.ForYou) &&
                  (feedType === FeedTypes.Connected || feedType === FeedTypes.ForYou)
                ) {
                  setSelectVisible(true);
                } else if (feedType === FeedTypes.Pray) {
                  navigation.navigate('MainRoot', {
                    screen: 'PrayerWall',
                  });
                } else if (feedOptions.type !== feedType) {
                  filterUpdate(feedType);
                }
              }}
              style={
                feedOptions.type === feedType ||
                (feedType === FeedTypes.Connected && feedOptions.type === FeedTypes.ForYou)
                  ? [styles.menuItemSelected, { borderBottomColor: Colors.neutral.brand }]
                  : [
                      styles.menuItem,
                      {
                        marginLeft: 0,
                      },
                    ]
              }
            >
              <StyledText
                style={
                  feedOptions.type === feedType
                    ? [
                        styles.menuItemText,
                        {
                          fontWeight: 'bold',
                          color: Colors.primarySapphire.brand,
                          textAlign: 'left',
                        },
                      ]
                    : [
                        styles.menuItemText,
                        {
                          color: Colors.neutral[400],
                          textAlign: 'left',
                        },
                      ]
                }
              >
                {feedType}
              </StyledText>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {isLoading && feedOptions.page == 1 && !isRefreshing ? (
        <View style={{ marginTop: 10 }}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        feedOptions.type !== 'watch' && (
          <View style={{ flex: 1 }}>
            <FlatList
              viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
              data={feedData}
              ref={listRef}
              keyExtractor={(item, index) => {
                return `${item.id}-${index}`;
              }}
              contentContainerStyle={{
                flexGrow: 1,
              }}
              scrollEnabled={isScrollEnable}
              renderItem={({ item, index }) => {
                if (item.type == 'social') {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        if (item.postId) {
                          navigation.navigate('SinglePost', {
                            postId: item.postId,
                          });
                        }
                      }}
                    >
                      <SocialItem
                        index={index}
                        key={`social_${item.id}_${index}`}
                        onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
                        itemData={item}
                        visible={
                          visibleItemsIndex && visibleItemsIndex.length > 0
                            ? visibleItemsIndex?.indexOf(index) > -1
                            : false
                        }
                        socialPostviewStyle={{ backgroundColor: colors.card }}
                        removePost={removePost}
                        editPost={editPost}
                      />
                    </TouchableOpacity>
                  );
                }

                if (item.type == 'tasteBreaker') {
                  return (
                    <View style={{ paddingHorizontal: 10 }}>
                      {/* <FlatList
                        nestedScrollEnabled
                        data={item.items}
                        horizontal={true}
                        showsHorizontalScrollIndicator={true}
                        keyExtractor={(item, index) => `${item.created}_${index}`}
                        renderItem={({ item }) => (
                          <ArticleItem
                            pillText="Taste Breakers"
                            key={`article_${item.id}`}
                            item={item}
                            imageSizeType="cover"
                            blogPostStyle={{
                              ...globalStyle.blogpostview,
                              backgroundColor: cardSecondaryColor,
                              height: 400,
                              width: Dimensions.get('screen').width - 30,
                              // width: 350,
                            }}
                            blogPostImageStyle={[globalStyle.newspostimage]}
                            blogPostTitleStyle={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                            }}
                            showModal={showModal}
                          />
                        )}
                      /> */}

                      <TouchableOpacity
                        onPress={() => {
                          if (item.id) {
                            navigation.navigate('SingleRss', {
                              postId: item.id,
                            });
                          }
                        }}
                      >
                        <ArticleItem
                          pillText="Taste Breakers"
                          key={`article_${item.id}`}
                          item={item.items[0]}
                          imageSizeType="cover"
                          // blogPostStyle={{
                          //   ...globalStyle.blogpostview,
                          //   backgroundColor: cardSecondaryColor,
                          // }}
                          // blogPostImageStyle={globalStyle.newspostimage}
                          // blogPostTitleStyle={{
                          //   flexWrap: 'wrap',
                          // }}
                          blogPostStyle={{
                            ...globalStyle.blogpostview,
                            backgroundColor: cardSecondaryColor,
                          }}
                          blogPostImageStyle={globalStyle.newspostimage}
                          blogPostTitleStyle={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}
                          showModal={showModal}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }

                if (item.type == 'relatedContent') {
                  return (
                    <View style={{ paddingHorizontal: 10 }}>
                      <TouchableOpacity
                        onPress={() => {
                          if (item.id) {
                            navigation.navigate('SingleRss', {
                              postId: item.id,
                            });
                          }
                        }}
                      >
                        <ArticleItem
                          pillText="Suggested"
                          key={`relatedContent_${item.id}`}
                          item={item.item}
                          imageSizeType="cover"
                          blogPostStyle={globalStyle.blogpostview}
                          blogPostImageStyle={globalStyle.newspostimage}
                          blogPostTitleStyle={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                          }}
                          showModal={showModal}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (item.id) {
                        navigation.navigate('SingleRss', {
                          postId: item.id,
                        });
                      }
                    }}
                  >
                    <ArticleItem
                      key={`article_${item.id}`}
                      item={item}
                      imageSizeType="cover"
                      blogPostImageStyle={globalStyle.newspostimage}
                      blogPostTitleStyle={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}
                      showModal={showModal}
                    />
                  </TouchableOpacity>
                );
              }}
              refreshing={isLoading}
              refreshControl={
                <RefreshControl
                  enabled
                  refreshing={isRefreshing}
                  colors={
                    dark
                      ? ['rgba(18, 210, 217, 1)', 'rgba(18, 210, 217, 1)']
                      : ['rgba(3, 47, 60, 1)', 'rgba(18, 107, 135, 1)']
                  }
                  tintColor={dark ? 'rgba(18, 210, 217, 1)' : 'rgba(18, 107, 135, 1)'}
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
                <View>
                  {isLoading && !isRefreshing ? <ActivityIndicator size="small" /> : null}
                </View>
              )}
            />
          </View>
        )
      )}

      {feedOptions.type === 'watch' && (
        <View style={{ flex: 1, marginBottom: 0 }}>
          <WatchComponent />
        </View>
      )}
    </View>
  );
}

export default Home;
