import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './styles';
import Social from '@/assets/svg/Social.svg';
import { getFontSize, getHeight, timeSince } from '@/utils/ResponsiveFun';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { ApiCall } from '@/src/Services/api';
import { SceneRendererProps } from 'react-native-tab-view';
import { ArticleType, PostType, User } from '@/utils/types';
import { isObject } from 'lodash';
import { OpenURLButton } from '@/src/Services/constants';
import ArticleItem from '../ListItems/ArticleItem';
import { useTheme } from '@react-navigation/native';
import OptionsModal, { PopupItem } from '../ListItems/OptionsModal';
import { styles as globalStyle } from '@/src/Components/ListItems/style';
import { spacing } from '@/src/styles/spacing';
import { Tabs } from 'react-native-collapsible-tab-view';

const BlogFlatlist = ({ userId }: { userId: string }) => {
  // const offset = useRef(new Animated.Value(0)).current;
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [page, setPage] = useState<number>(1);
  const [blogs, setBlogs] = useState<any>([]);
  const [show, setShow] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(true);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);
  const [currentPopupItem, setCurrentPopupItem] = useState<PopupItem>();

  const getBlog = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `user/get-blog-feed/${userId}/${pageNumber}`,
        verb: 'post',
        token: token,
      });

      if (res?.status == 200) {
        let blogData = [];

        if (pageNumber == 1) {
          blogData = res?.response ?? [];
          setIsEndOfList(false);
        } else {
          blogData = [...blogs, ...(res?.response ?? [])];
          if (res?.response.length < 1) {
            setIsEndOfList(true);
          }
        }

        setBlogs(blogData);
      } else {
        console.log('error', res?.response);
      }
      setLoadingMore(false);

      setRefreshing(false);
    } catch (e: any) {
      setLoadingMore(false);
      setRefreshing(false);
    }
    setPage(pageNumber);
  };

  useEffect(() => {
    if (user) {
      const getData = async () => {
        await getBlog(page);
      };
      setLoadingMore(true);
      getData();
    }
  }, [page, user]);
  const { colors } = useTheme();

  const showModal = (item: ArticleType) => {
    if (user) {
      setCurrentPopupItem({
        id: item.id,
        postlink: item.link,
        title: isObject(item?.title) ? item?.title?.a.$text : item?.title,
        created: item.created,
        image: item.image,
        externalLink: item.link,
        type: PostType.rss,

        userData: {
          twitterHandler: user?.influencerProfile?.twitterHandler,
          instagramHandler: user?.influencerProfile?.instagramHandler,
          name: user?.name,
          username: user?.username,
          _id: user?._id,
          accountType: user?.accountType,
          profileImage: user?.profileImage,
        },
      });
    }
    setShow(true);
  };

  return (
    <View>
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
      <Tabs.FlatList
        nestedScrollEnabled={true}
        data={blogs}
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
            enabled={true}
            refreshing={refreshing}
            onRefresh={async () => {
              setIsEndOfList(false);
              setRefreshing(true);
              setPage(1);
            }}
          />
        }
        ListEmptyComponent={() => {
          if (loadingMore) {
            return null;
          }
          return (
            <View>
              <Text style={{ color: colors.text, textAlign: 'center' }}>
                No content at the moment
              </Text>
            </View>
          );
        }}
        // onScroll={Animated.event(
        //   [{nativeEvent: {contentOffset: {y: offset}}}],
        //   {
        //     useNativeDriver: false,
        //   },
        // )}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: any) => (
          // <TouchableOpacity
          //   onPress={() => {
          //     OpenURLButton(item?.link);
          //   }}
          // >
          //   <View style={styles.blogpostview}>
          //     <Image
          //       style={styles.blogpostimage}
          //       resizeMode="cover"
          //       source={{ uri: item?.image?.url }}
          //     />
          //     <Text numberOfLines={2} style={styles.blogpostpara}>
          //       {isObject(item?.title) ? item?.title?.a.$text : item?.title}
          //     </Text>

          //     <Text style={styles.blogposthour}>{timeSince(item?.created)} ago</Text>
          //   </View>
          // </TouchableOpacity>

          <ArticleItem
            key={`article_${item.id}`}
            item={item}
            imageSizeType="cover"
            blogPostStyle={{
              marginBottom: spacing.x24,
              backgroundColor: colors.card,
            }}
            blogPostImageStyle={globalStyle.newspostimage}
            // blogPostTitleStyle={{
            //   flexDirection: 'row',
            //   justifyContent: 'space-between',
            //   // marginTop: getHeight(1),
            // }}
            showModal={showModal}
          />
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loadingMore && !refreshing && !isEndOfList) setPage(page + 1);
        }}
      />
    </View>
  );
};

export default BlogFlatlist;
