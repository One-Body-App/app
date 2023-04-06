import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Avatar, Caption, Text, Title } from 'react-native-paper';
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
import OptionsModal from '@/src/Components/ListItems/OptionsModal';
import { styles as globalStyle } from '@/src/Components/ListItems/style';
import { useScrollToTop } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/Navigation/types';

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
type Props = NativeStackScreenProps<RootStackParamList, 'IndividualSteps'>;

const Home = ({ navigation }: Props) => {
  const token = useSelector((state: RootState) => state.auth.userToken);

  const [feedOptions, setFeedOptions] = useState<feedOptions>({
    type: feedTypes[0],
    page: 1,
  });

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
      onViewableItemsChanged: onViewableItemsChanged,
    },
  ]);

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

  return (
    <>
      <SafeAreaView style={{ flex: 0, backgroundColor: '#126B87' }} />

      <SafeAreaView style={styles.continer}>
        <OptionsModal show={show ?? false} setShow={setShow} currentPopupItem={currentPopupItem} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginBottom: 20 }}>
            {feedTypes.map((feedType) => {
              return (
                <View style={{ flex: 1 }} key={feedType}>
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
              viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
              data={feedData}
              ref={listRef}
              keyExtractor={(item, index) => {
                return `${item.id}-${index}`;
              }}
              renderItem={({ item, index }) => {
                if (item.type == 'social') {
                  return (
                    <SocialItem
                      key={`social_${item.id}_${index}`}
                      item={item}
                      visible={
                        visibleItemsIndex && visibleItemsIndex.length > 0
                          ? visibleItemsIndex?.indexOf(index) > -1
                          : false
                      }
                      socialPostviewStyle={{ backgroundColor: colors.card }}
                    />
                  );
                }

                if (item.type == 'tasteBreaker') {
                  return (
                    <View style={{ paddingHorizontal: 10, paddingVertical: 20, marginBottom: 10 }}>
                      <Caption style={{ marginLeft: 10, marginBottom: 10 }}>Taste Breakers</Caption>
                      <FlatList
                        nestedScrollEnabled
                        data={item.items}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
                        keyExtractor={(item, index) => `${item.created}_${index}`}
                        renderItem={({ item }) => (
                          <ArticleItem
                            key={`article_${item.id}`}
                            item={item}
                            imageSizeType="cover"
                            blogPostStyle={{
                              ...globalStyle.blogpostview,
                              backgroundColor: cardSecondaryColor,
                              width: 300,
                            }}
                            blogPostImageStyle={globalStyle.newspostimage}
                            blogPostTitleStyle={{
                              flexWrap: 'wrap',
                              marginTop: getHeight(1),
                            }}
                            showModal={showModal}
                          />
                        )}
                      />
                    </View>
                  );
                }

                if (item.type == 'relatedContent') {
                  return (
                    <View style={{ paddingHorizontal: 10, paddingVertical: 20, marginBottom: 10 }}>
                      <Caption style={{ marginLeft: 10 }}>Suggested</Caption>
                      <ArticleItem
                        key={`relatedContent_${item.id}`}
                        item={item.item}
                        imageSizeType="cover"
                        blogPostStyle={{
                          ...globalStyle.blogpostview,
                          backgroundColor: cardSecondaryColor,
                        }}
                        blogPostImageStyle={globalStyle.newspostimage}
                        blogPostTitleStyle={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginTop: getHeight(1),
                        }}
                        showModal={showModal}
                      />
                    </View>
                  );
                }
                return (
                  <ArticleItem
                    key={`article_${item.id}`}
                    item={item}
                    imageSizeType="cover"
                    blogPostStyle={{
                      ...globalStyle.blogpostview,
                      backgroundColor: colors.card,
                    }}
                    blogPostImageStyle={globalStyle.newspostimage}
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
        </View>
      </SafeAreaView>
    </>
  );
};

export default Home;
