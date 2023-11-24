import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
  TouchableHighlight,
} from 'react-native';

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
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';
import { ArrowDown, ArrowDown2, Notification } from 'iconsax-react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { fontSize, poppins } from '@/src/styles/typography';
import { borderWidth } from '@/src/styles/outlines';
import { GiphyDialog } from '@giphy/react-native-sdk';

enum FeedTypes {
  Connected = 'connected',
  ForYou = 'foryou',
  Read = 'read',
  Pray = 'pray',
  Watch = 'watch',
}

type feedOptions = {
  type: FeedTypes;
  page: number;
};

const feedTypes: FeedTypes[] = [FeedTypes.Read];

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
    type: FeedTypes.Connected,
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
      onViewableItemsChanged: onViewableItemsChanged,
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

  const addHeaderButtons = () => {
    navigation
      .getParent()
      ?.getParent()
      ?.setOptions({
        headerRight: () => (
          <View style={{ flexDirection: 'row', paddingRight: spacing.x24 }}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('Notifications');
              }}
              // style={{ paddingRight: spacing.x24 }}
            >
              <Notification
                style={{ height: 24, width: 24 }}
                color={Colors.primary.brand}
                strokeWidth={0.2}
              />
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={() => {}}>
                            <Message
                              style={{ height: 24, width: 24 }}
                              stroke={Colors.primary.brand}
                              strokeWidth={0.2}
                            />
                          </TouchableOpacity> */}
          </View>
        ),
      });

    return () => {
      navigation
        .getParent()
        ?.getParent()
        ?.setOptions({
          headerRight: () => <View />,
        });
    };
  };

  const removeHeaderButtons = () => {
    navigation
      .getParent()
      ?.getParent()
      ?.setOptions({
        headerRight: () => <View />,
      });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      addHeaderButtons();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      removeHeaderButtons();
    });

    return unsubscribe;
  }, [navigation]);
  const [isScrollEnable, setIsScrollEnable] = useState(true);

  const _renderModal = useCallback(() => {
    if (selectVisible) {
      return (
        <Modal
          transparent
          statusBarTranslucent
          visible={selectVisible}
          supportedOrientations={['landscape', 'portrait']}
          onRequestClose={() => {
            setSelectVisible(false);
          }}
        >
          <TouchableWithoutFeedback onPress={() => setSelectVisible(false)}>
            <View style={StyleSheet.flatten([{ flex: 1 }])}>
              <View
                style={StyleSheet.flatten([
                  { flex: 1 },
                  { paddingTop: 135, paddingLeft: 10 },
                  { width: 180 },
                ])}
              >
                <View
                  style={StyleSheet.flatten([
                    {
                      flexShrink: 1,
                      borderWidth: borderWidth.hairline,
                      borderColor: Colors.neutral[400],

                      shadowColor: Colors.main.black,
                      shadowOffset: {
                        width: 0,
                        height: 1,
                      },
                      shadowOpacity: 0.2,
                      shadowRadius: 1.41,
                      elevation: 2,
                    },
                    // isFull ? styleHorizontal : styleVertical,
                    // containerStyle,
                  ])}
                >
                  <TouchableHighlight
                    underlayColor={Colors.neutral[700]}
                    style={{
                      backgroundColor: colors.background,
                      height: 42,
                      padding: spacing.x10,
                    }}
                    onPress={() => {
                      setSelectVisible(false);
                      setFeedSubType(
                        feedOptions.type == FeedTypes.Connected
                          ? FeedTypes.ForYou
                          : FeedTypes.Connected
                      );
                      filterUpdate(
                        feedOptions.type == FeedTypes.Connected
                          ? FeedTypes.ForYou
                          : FeedTypes.Connected
                      );
                    }}
                  >
                    <StyledText>
                      {feedOptions.type == FeedTypes.Connected ? 'For You' : 'Connected'}
                    </StyledText>
                  </TouchableHighlight>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
    }
    return null;
  }, [selectVisible, setSelectVisible, position, feedOptions, filterUpdate]);

  return (
    <>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',

            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1 }} key={'main'}>
            <TouchableOpacity
              onPress={() => {
                if (
                  feedOptions.type == FeedTypes.Connected ||
                  feedOptions.type == FeedTypes.ForYou
                ) {
                  setSelectVisible(true);
                } else {
                  // setFeedSubType(
                  //   feedSubType == FeedTypes.Connected ? FeedTypes.Connected : FeedTypes.ForYou
                  // );
                  filterUpdate(
                    feedSubType == FeedTypes.Connected ? FeedTypes.Connected : FeedTypes.ForYou
                  );
                }
              }}
              style={
                feedOptions.type == FeedTypes.Connected || feedOptions.type == FeedTypes.ForYou
                  ? [styles.menuItemSelected, { borderBottomColor: Colors.neutral.brand }]
                  : [styles.menuItem]
              }
            >
              <>
                <View style={{ flexDirection: 'row' }}>
                  <StyledText
                    style={
                      feedOptions.type == FeedTypes.Connected ||
                      feedOptions.type == FeedTypes.ForYou
                        ? [styles.menuItemText, { color: Colors.neutral.brand }]
                        : [styles.menuItemText, { color: Colors.neutral[400] }]
                    }
                  >
                    {feedSubType == FeedTypes.Connected ? 'Connected' : 'For You'}
                  </StyledText>
                  <ArrowDown2
                    size={20}
                    color={
                      feedOptions.type == FeedTypes.Connected ||
                      feedOptions.type == FeedTypes.ForYou
                        ? Colors.neutral.brand
                        : Colors.neutral[400]
                    }
                    style={{ marginLeft: spacing.x10 }}
                  />
                </View>
                {_renderModal()}
              </>
            </TouchableOpacity>
          </View>

          {feedTypes.map((feedType) => {
            return (
              <View style={{ flex: 1 }} key={feedType}>
                <TouchableOpacity
                  onPress={() => {
                    if (
                      (feedOptions.type == FeedTypes.Connected ||
                        feedOptions.type == FeedTypes.ForYou) &&
                      (feedType == FeedTypes.Connected || feedType == FeedTypes.ForYou)
                    ) {
                      setSelectVisible(true);
                    } else if (feedOptions.type != feedType) {
                      filterUpdate(feedType);
                    }
                  }}
                  style={
                    feedOptions.type == feedType ||
                    (feedType == FeedTypes.Connected && feedOptions.type == FeedTypes.ForYou)
                      ? [styles.menuItemSelected, { borderBottomColor: Colors.neutral.brand }]
                      : [styles.menuItem]
                  }
                >
                  <StyledText
                    style={
                      feedOptions.type == feedType
                        ? [styles.menuItemText, { color: Colors.neutral.brand }]
                        : [styles.menuItemText, { color: Colors.neutral[400] }]
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
                    <SocialItem
                      index={index}
                      key={`social_${item.id}_${index}`}
                      onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
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
                    blogPostImageStyle={globalStyle.newspostimage}
                    blogPostTitleStyle={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
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
