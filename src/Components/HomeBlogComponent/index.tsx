import { useNavigation, useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import parse from 'rss-to-json';
import { SetAllBlog } from '@/redux/actions/SocialActions';
import { ApiCall } from '@/services/api';
import { styles } from './styles';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { OpenURLButton } from '@/src/Services/constants';
import { isObject } from 'lodash';

const HomeBlogComponent = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const allBlog = useSelector((state: RootState) => state.social.AllBlog);
  const [page, setPage] = useState(1);

  const [refreshing, setRefreshing] = useState(false);

  const getAllBlog = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/all-blogs/${pageNumber}`,
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        dispatch(SetAllBlog(res?.response));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
    setPage(pageNumber);
  };

  useEffect(() => {
    getAllBlog(1);
  }, []);

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
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        refreshControl={
          <RefreshControl
            enabled={true}
            refreshing={refreshing}
            onRefresh={() => getAllBlog(page + 1)}
          />
        }
        ListHeaderComponent={() => <View style={{ padding: 2 }} />}
        ListFooterComponent={() => <View style={{ padding: 7 }} />}
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
      />
    </View>
  );
};
export default HomeBlogComponent;
