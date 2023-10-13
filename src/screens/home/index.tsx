import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, SafeAreaView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';

import { getHeight } from '@/utils/ResponsiveFun';
import { styles } from './styles';

import { useSelector } from 'react-redux';

import { ApiCall } from '@/services/api';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { CompositeScreenProps, useTheme } from '@react-navigation/native';

import SocialItem from '@/src/components/ListItems/SocialItem';
import ArticleItem from '@/src/components/ListItems/ArticleItem';
import ActivityIndicatorContent from '@/src/components/ActivityIndicatorContent';
import { ArticleType } from '@/utils/types';
import OptionsModal from '@/src/components/ListItems/OptionsModal';
import { styles as globalStyle } from '@/src/components/ListItems/style';
import { useScrollToTop } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/_Navigation/types';
import { StackScreenProps } from '@react-navigation/stack';
import {
  HomeStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StyledText } from '@/src/components/styled/Text';

enum FeedTypes {
  All = 'all',
  News = 'news',
  Social = 'social',
  Blog = 'blog',
}

type feedOptions = {
  type: FeedTypes;
  page: number;
};

const feedTypes: FeedTypes[] = [FeedTypes.All, FeedTypes.News, FeedTypes.Social, FeedTypes.Blog];

type Props = CompositeScreenProps<
  StackScreenProps<HomeStackParamsList, 'Home'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
  >
>;

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
                  <StyledText
                    style={
                      feedOptions.type == feedType
                        ? styles.menuItemTextSelected
                        : styles.menuItemText
                    }
                  >
                    {feedType}
                  </StyledText>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {isLoading && feedOptions.page == 1 && !isRefreshing ? (
          <View style={{ marginTop: 10 }}>
            <ActivityIndicatorContent size="small" />
          </View>
        ) : (
          <View style={{ flex: 1, marginHorizontal: 20 }}>
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
                    <View style={{ paddingHorizontal: 10 }}>
                      <FlatList
                        nestedScrollEnabled
                        data={item.items}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
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
                    <View style={{ paddingHorizontal: 10 }}>
                      <ArticleItem
                        pillText="Suggested"
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

                      width: 'auto',
                      flexGrow: 1,

                      marginVertical: 7,
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
                  {isLoading && !isRefreshing ? <ActivityIndicatorContent size="small" /> : null}
                </View>
              )}
            />
          </View>
        )}
      </View>
    </>
  );
};

export default Home;
