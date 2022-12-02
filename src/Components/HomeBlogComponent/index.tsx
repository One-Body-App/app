import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import { SetAllBlog } from '@/redux/actions/SocialActions';
import { ApiCall } from '@/services/api';
import { styles } from './styles';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { OpenURLButton } from '@/src/Services/constants';
import { isObject } from 'lodash';

const HomeBlogComponent = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const allBlog = useSelector((state: RootState) => state.social.AllBlog);
  const [page, setPage] = useState(1);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEndOfList, setIsEndOfList] = useState(false);

  const getAllBlog = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/all-blogs/${pageNumber}`,
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        let blog = [];

        if (pageNumber == 1) {
          blog = res?.response ?? [];
          setIsEndOfList(false);
        } else {
          blog = [...allBlog, ...(res?.response ?? [])];
          if (blog.length < 1) {
            setIsEndOfList(true);
          }
        }

        dispatch(SetAllBlog(blog));
      } else {
        console.log('error', res?.response);
      }
      setIsLoading(false);
      setIsRefreshing(false);
    } catch (e: any) {
      setIsLoading(false);
      setIsRefreshing(false);
      console.log('saga error -- ', e.toString());
    }
    setPage(pageNumber);
  };

  useEffect(() => {
    getAllBlog(page);
  }, [page]);

  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <FlatList
        data={allBlog}
        ListEmptyComponent={() => {
          return <Text>Please follow some Blogs to show content here</Text>;
        }}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        refreshControl={
          <RefreshControl
            enabled={true}
            refreshing={isLoading}
            onRefresh={() => {
              setIsRefreshing(true);
              setPage(page + 1);
            }}
          />
        }
        ListHeaderComponent={() => <View style={{ padding: 2 }} />}
        ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
        keyExtractor={(item, index) => `${item.created}_${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              // navigation.navigate('BlogView', { url: item?.link });
              OpenURLButton(item?.link);
            }}
            style={{ ...styles.blogpostview, marginHorizontal: 10, backgroundColor: colors.card }}
          >
            {item?.image ? (
              <FastImage
                style={styles.blogpostimage}
                resizeMode={'stretch'}
                source={{ uri: item?.image?.url }}
              />
            ) : null}
            <Text numberOfLines={2} style={styles.blogpostpara}>
              {isObject(item?.title) ? item?.title.a.$text : item?.title}
            </Text>

            <Text numberOfLines={2} style={styles.blogposthour}>
              {isObject(item?.author) ? item?.author?.a?.$text : item?.author}
            </Text>
          </TouchableOpacity>
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!isLoading && !isRefreshing) setPage(page + 1);
        }}
        ListFooterComponent={() => (
          <View>
            {isEndOfList ? (
              <Text style={{ textAlign: 'center' }}>Not more news at this time</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
};
export default HomeBlogComponent;
