import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { styles } from './styles';
import Fontisto from 'react-native-vector-icons/Fontisto';
import { timeSince } from '@/utils/ResponsiveFun';
import SubscribeFlatlist from '../SubscribeFlatlist';
import SocialFlatlist from '../SocialFlatlist';
import { ApiCall } from '@/services/api';
import { SetRecentBlog, SetSocial } from '@/redux/actions/SocialActions';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { useNavigation, useTheme } from '@react-navigation/native';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { OpenURLButton } from '@/src/Services/constants';

const HomeSocialComponent = () => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const socialPost = useSelector((state: RootState) => state.social.SocialPost);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const recentBlog = useSelector((state: RootState) => state.social.RecentBlog);

  const navigation = useNavigation();

  const twitterUsers = ['147895001', '1380592017936375815', '1481475468125745154'];

  const getTwiters = async (id: string) => {
    try {
      const res = await ApiCall({
        route: `https://api.twitter.com/2/users/${id}/tweets?tweet.fields=attachments,created_at&media.fields=preview_image_url`,
        token:
          'AAAAAAAAAAAAAAAAAAAAAFP6dQEAAAAAkF1k78i42go%2BLLsmlJcE58hCcCw%3DCHdg4ofpqUzHzmx7tdNw2Op8UMCApSSZ5rOceOobMF1kIuXvcT',
        verb: 'get',

        external: true,
      });
      if (res?.status == 200) {
        // console.log('res', res.data);
        dispatch(SetSocial([...res?.response, ...socialPost]));
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log(`saga get twitter timline ${id} error -- `, e.toString());
    }
  };

  const getMultipleRandom = (arr, num) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, num);
  };
  const getAllTweets = () => {
    getMultipleRandom(twitterUsers, 2).map((item) => getTwiters(item));
  };

  const getRecentBlog = async () => {
    try {
      const res = await ApiCall({
        route: 'blogs/get-feed/recent-blogs',
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        dispatch(SetRecentBlog(res?.response[0]));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    getRecentBlog();
  }, []);

  const { colors } = useTheme();
  return (
    <ScrollView
      refreshControl={
        <RefreshControl enabled={true} refreshing={refreshing} onRefresh={() => getAllTweets()} />
      }
      style={{ flex: 1 }}
    >
      <SocialFlatlist />

      <Text style={{ ...styles.newstitle, color: colors.text }}>Recent Blog Post</Text>
      <View>
        <FlatList
          data={recentBlog}
          horizontal={true}
          contentContainerStyle={{ marginTop: 20 }}
          showsHorizontalScrollIndicator={false}
          ListHeaderComponent={() => <View style={{ padding: 7 }} />}
          ListFooterComponent={() => <View style={{ padding: 7 }} />}
          ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                // navigation.navigate('BlogView', { url: item?.link });
                OpenURLButton(item?.link);
              }}
              style={{ ...styles.blogpostview, backgroundColor: colors.card }}
            >
              <FastImage
                style={styles.blogpostimage}
                resizeMode={'stretch'}
                source={{ uri: item?.enclosures[0]?.url }}
              />
              <Text numberOfLines={2} style={{ ...styles.blogpostpara, color: colors.text }}>
                {item?.title}
              </Text>
              <Text style={styles.blogposthour}>{timeSince(item?.created)} ago</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={styles.explorview}>
        <Text style={{ ...styles.explortext, color: colors.text }}>
          Explore Influencers & Organizations
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home', { tabs: 'Explore' })}
          style={styles.viewtext}
        >
          <Text style={{ color: '#126B87' }}>View more</Text>
          <Fontisto name="angle-right" size={12} color="#126B87" />
        </TouchableOpacity>
      </View>
      <View>
        <SubscribeFlatlist />
      </View>
    </ScrollView>
  );
};
export default HomeSocialComponent;
