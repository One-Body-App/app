import React, { ComponentType, ReactElement, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
  ListRenderItem,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect, useNavigation, useTheme } from '@react-navigation/native';
import { Tabs } from 'react-native-collapsible-tab-view';
import { getHeight } from '@/utils/ResponsiveFun';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import ArticleItem from '../listItems/ArticleItem';
import OptionsModal, { PopupItem } from '../listItems/OptionsModal';
import globalStyle from '@/components/listItems/style';
import { spacing } from '@/src/styles/spacing';
import { ArticleType } from '@/utils/types';
import { creatorBlogService } from '@/src/services/creatorBlogs';

function BlogFlatlist({
  userId,
  headerItem,
  emptyText,
  useTabsFlatList = false,
}: {
  userId: string;
  headerItem?: ComponentType<any> | ReactElement | null | undefined;
  emptyText?: string;
  useTabsFlatList?: boolean;
}) {
  // const offset = useRef(new Animated.Value(0)).current;
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const navigation = useNavigation<any>();
  const [page, setPage] = useState<number>(1);
  const [blogs, setBlogs] = useState<any>([]);
  const [show, setShow] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(true);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);
  const [currentPopupItem] = useState<PopupItem>();

  const getBlog = useCallback(
    async (pageNumber: number) => {
      setLoadingMore(true);

      try {
        const localBlogs =
          pageNumber === 1 && user && userId === user._id
            ? await creatorBlogService.listPublishedArticlesForAuthor(user as any)
            : [];
        const res = await ApiCall({
          route: `user/get-blog-feed/${userId}/${pageNumber}`,
          verb: 'post',
          token,
        });

        if (res?.status === 200) {
          const mergedItems = [...localBlogs, ...(res?.response ?? [])].filter(
            (item, index, allItems) =>
              index ===
              allItems.findIndex((candidate) => String(candidate?.id) === String(item?.id))
          );
          if (pageNumber === 1) {
            setIsEndOfList(false);
            setBlogs(mergedItems);
          } else if (res?.response.length < 1) {
            setIsEndOfList(true);
          } else {
            setBlogs((previousBlogs: ArticleType[]) => [
              ...previousBlogs,
              ...(res?.response ?? []),
            ]);
          }
        } else {
          console.log('error', res?.response);
        }
      } catch (e: any) {
        console.log(e.toString());
      } finally {
        setLoadingMore(false);
        setRefreshing(false);
        setPage(pageNumber);
      }
    },
    [token, user, userId]
  );

  useFocusEffect(
    useCallback(() => {
      if (user) {
        getBlog(1).then(() => undefined);
      }
    }, [getBlog, user])
  );
  const { colors } = useTheme();
  const ListComponent = useTabsFlatList ? Tabs.FlatList : FlatList;
  const renderItem: ListRenderItem<ArticleType> = ({ item }) => (
    <ArticleItem
      key={`article_${item.id}`}
      item={item}
      onPress={
        !item.link && item.id
          ? () => {
              navigation.navigate('SingleRss', { postId: String(item.id) });
            }
          : undefined
      }
      imageSizeType="contain"
      blogPostStyle={{
        marginBottom: spacing.x24,
        backgroundColor: colors.card,
      }}
      blogPostImageStyle={globalStyle.newspostimage}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      {loadingMore ? (
        <ActivityIndicator
          animating={loadingMore}
          size="large"
          color={colors.text}
          style={{ marginTop: 10 }}
        />
      ) : null}
      <OptionsModal
        show={show ?? false}
        setShow={setShow}
        currentPopupItem={currentPopupItem}
        height={getHeight(25)}
      />
      <ListComponent
        nestedScrollEnabled
        data={blogs}
        keyExtractor={(item: ArticleType, index: number) => String(item.id ?? index)}
        removeClippedSubviews
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
        scrollEventThrottle={16}
        ListHeaderComponent={headerItem}
        // onScroll={(e) => {
        //   setScrollPosition(e.nativeEvent.contentOffset.y);
        // }}
        // contentContainerStyle={{
        //   marginTop: getHeight(1),
        //   marginBottom: getHeight(10),
        // }}
        contentContainerStyle={{
          paddingBottom: 50,
        }}
        refreshControl={
          <RefreshControl
            enabled
            refreshing={refreshing}
            onRefresh={() => {
              setIsEndOfList(false);
              setRefreshing(true);
              getBlog(1).then(() => undefined);
            }}
          />
        }
        ListEmptyComponent={
          loadingMore ? null : (
            <View>
              <Text style={{ color: colors.text, textAlign: 'center' }}>
                {emptyText || 'No content at the moment'}
              </Text>
            </View>
          )
        }
        // onScroll={Animated.event(
        //   [{nativeEvent: {contentOffset: {y: offset}}}],
        //   {
        //     useNativeDriver: false,
        //   },
        // )}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loadingMore && !refreshing && !isEndOfList) {
            getBlog(page + 1).then(() => undefined);
          }
        }}
      />
    </View>
  );
}

export default BlogFlatlist;
