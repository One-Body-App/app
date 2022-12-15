import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
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
import { User } from '@/utils/types';
import { isObject } from 'lodash';
import { OpenURLButton } from '@/src/Services/constants';
import ArticleItem from '../ListItems/ArticleItem';
import { useTheme } from '@react-navigation/native';
import { color } from 'react-native-reanimated';

const BlogFlatlist = ({
  currentUser,
  setScrollPosition,
}: SceneRendererProps & { currentUser: User; setScrollPosition: (position: number) => void }) => {
  // const offset = useRef(new Animated.Value(0)).current;
  const user = useSelector((state: RootState) => state.auth.userProfile);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [page, setPage] = useState<number>(1);
  const [blogs, setBlogs] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(true);
  const [isEndOfList, setIsEndOfList] = useState<boolean>(false);

  const getBlog = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `blogs/get-blog-feed/${currentUser._id}/${pageNumber}`,
        verb: 'get',
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
      console.log(1, 'donedone');
      setRefreshing(false);
    } catch (e: any) {
      console.log('err', 'donedone');
      setLoadingMore(false);
      setRefreshing(false);
    }
    setPage(pageNumber);
  };

  useEffect(() => {
    const getData = async () => {
      await getBlog(page);
    };
    setLoadingMore(true);
    getData();
  }, [page, user]);
  const { colors } = useTheme();

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
      <FlatList
        nestedScrollEnabled={true}
        data={blogs}
        numColumns={2}
        onScroll={(e) => {
          setScrollPosition(e.nativeEvent.contentOffset.y);
        }}
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
              setPage(page + 1);
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
        renderItem={({ item }) => (
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
            item={item}
            imageSizeType="cover"
            blogPostStyle={{ ...styles.blogpostview, backgroundColor: colors.card }}
            blogPostImageStyle={styles.blogpostimage}
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
