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
import { useNavigation } from '@react-navigation/native';

const HomeSocialComponent = () => {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const socialPost = useSelector((state) => state.social.SocialPost);
  const token = useSelector((state) => state.auth.userToken);
  const recentBlog = useSelector((state) => state.social.RecentBlog);

  const [data, setData] = useState([]);
  const navigation = useNavigation();
  const Data = [
    { id: 1, image: 'dfafds', Text: 'fsda' },
    { id: 2, image: 'dfafds', Text: 'fsda' },
    { id: 3, image: 'dfafds', Text: 'fsda' },
    { id: 4, image: 'dfafds', Text: 'fsda' },
    { id: 5, image: 'dfafds', Text: 'fsda' },
  ];
  const twitterUsers = ['147895001', '1380592017936375815', '1481475468125745154'];

  const getTwiters = async (id) => {
    try {
      const res = await ApiCall({
        route: `https://api.twitter.com/2/users/${id}/tweets?tweet.fields=attachments,created_at&media.fields=preview_image_url`,
        token:
          'AAAAAAAAAAAAAAAAAAAAAFP6dQEAAAAAkF1k78i42go%2BLLsmlJcE58hCcCw%3DCHdg4ofpqUzHzmx7tdNw2Op8UMCApSSZ5rOceOobMF1kIuXvcT',
        verb: 'get',
        baseurl: false,
      });
      if (res?.status == '200') {
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
      if (res?.status == '200') {
        dispatch(SetRecentBlog(res?.response[0]));
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    getRecentBlog();
  }, []);
  return (
    <ScrollView
      refreshControl={
        <RefreshControl enabled={true} refreshing={refreshing} onRefresh={() => getAllTweets()} />
      }
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <SocialFlatlist />

      <Text style={styles.blogposttext}>Recent Blog Post</Text>
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
                navigation.navigate('BlogView', { url: item?.link });
              }}
              style={styles.blogpostview}
            >
              <FastImage
                style={styles.blogpostimage}
                resizeMode={'stretch'}
                source={{ uri: item?.enclosures[0]?.url }}
              />
              <Text numberOfLines={2} style={styles.blogpostpara}>
                {item?.title}
              </Text>
              <Text style={styles.blogposthour}>{timeSince(item?.created)} ago</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={styles.explorview}>
        <Text style={styles.explortext}>Explore Influencers & Organizations</Text>
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
