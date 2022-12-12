import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, Text, View, RefreshControl } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { styles } from './styles';
import Fontisto from 'react-native-vector-icons/Fontisto';
import { getHeight, getWidth, timeSince } from '@/utils/ResponsiveFun';
import SubscribeFlatlist from '../SubscribeFlatlist';
import SocialFlatlist from '../SocialFlatlist';
import { ApiCall } from '@/services/api';
import { SetRecentBlog, SetSocial } from '@/redux/actions/SocialActions';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { useNavigation, useTheme } from '@react-navigation/native';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { OpenURLButton } from '@/src/Services/constants';
import ArticleItem from '../ListItems/ArticleItem';

const HomeSocialComponent = () => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const recentBlog = useSelector((state: RootState) => state.social.RecentBlog);

  const getRecentBlog = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/recent-blogs/${pageNumber}`,
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        dispatch(SetRecentBlog(res?.response));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
    setPage(pageNumber);
  };

  useEffect(() => {
    getRecentBlog(page);
  }, []);

  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 6 }}>
        <SocialFlatlist />
      </View>

      {/* <FlatList
        refreshControl={
          <RefreshControl enabled={true} refreshing={refreshing} onRefresh={() => getAllTweets()} />
        }
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 75 }}
      /> */}
      {recentBlog.length > 0 ? (
        <View style={{ flex: 4, paddingHorizontal: 20 }}>
          <Text style={{ ...styles.newstitle, color: colors.text }}>Recent Blog Post</Text>

          <FlatList
            data={recentBlog}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.created}_${index}`}
            renderItem={({ item }) => (
              <ArticleItem
                imageSizeType="cover"
                item={item}
                blogPostStyle={{ height: '100%', width: getWidth(42), borderRadius: 16 }}
                blogPostImageStyle={{
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  height: getHeight(12),
                }}
              />
            )}
          />
        </View>
      ) : null}
    </View>
  );
};
export default HomeSocialComponent;
