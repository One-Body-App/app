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
import { Avatar } from 'react-native-paper';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Entypo from 'react-native-vector-icons/Entypo';
import { getFontSize, getHeight, getWidth, timeSince } from '@/utils/ResponsiveFun';
import SubscribeFlatlist from '../SubscribeFlatlist';
import * as rssParser from 'react-native-rss-parser';
import parse from 'rss-to-json';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { ApiCall } from '@/services/api';
import { SetAllNews, SetLocalNews } from '@/redux/actions/SocialActions';
import { useDispatch, useSelector } from 'react-redux';
import { setLoader } from '@/redux/actions/GernalActions';

const HomeNewsComponent = () => {
  const token = useSelector((state) => state.auth.userToken);
  const allNews = useSelector((state) => state.social.AllNews);
  const LocalNews = useSelector((state) => state.social.LocalNews);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const Data = [
    { id: 1, image: 'dfafds', Text: 'fsda' },
    { id: 2, image: 'dfafds', Text: 'fsda' },
    { id: 3, image: 'dfafds', Text: 'fsda' },
    { id: 4, image: 'dfafds', Text: 'fsda' },
    { id: 5, image: 'dfafds', Text: 'fsda' },
  ];
  const [refreshing, setRefreshing] = useState(false);

  const getAllNews = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/all-news`,
        verb: 'get',
        token: token,
      });
      if (res?.status == '200') {
        dispatch(SetAllNews(res?.response[0]));
        dispatch(setLoader(false));
      } else {
        console.log('error', res?.response);
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  const getLocalNews = async () => {
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/local-news`,
        verb: 'get',
        token: token,
      });
      if (res?.status == '200') {
        dispatch(SetLocalNews(res?.response[0]));
      } else {
        console.log('error', res?.response);
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    getAllNews();
    getLocalNews();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        refreshing={refreshing}
        refreshControl={
          <RefreshControl enabled={true} refreshing={refreshing} onRefresh={() => getAllNews()} />
        }
      >
        <Text style={styles.newstitle}>Today's News</Text>

        <View>
          <FlatList
            data={allNews}
            contentContainerStyle={{ marginTop: 20 }}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
            renderItem={(item) => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('BlogView', { url: item?.item?.id });
                }}
                style={styles.socialpostview}
              >
                {item?.item?.enclosures ? (
                  <FastImage
                    style={styles.socialpostimage}
                    resizeMode={'stretch'}
                    source={{ uri: item?.item?.enclosures[0]?.url }}
                  />
                ) : null}
                <View style={{ flex: 1, width: '100%', padding: 15 }}>
                  <View style={styles.afsd}>
                    <Text
                      numberOfLines={2}
                      style={{
                        color: '#032F3C',
                        fontSize: 14,
                        lineHeight: 17,
                        letterSpacing: 0.1,
                        width: '90%',
                        fontWeight: '500',
                      }}
                    >
                      {item?.item?.title}
                    </Text>
                    <Entypo name="dots-three-horizontal" color={'#70747d'} size={20} />
                  </View>
                  <View style={styles.sourcename}>
                    <Text
                      style={{
                        color: '#70747D',
                        fontSize: 12,
                        fontWeight: '400',
                      }}
                    >
                      {item?.item?.author}
                    </Text>
                    <Text
                      style={{
                        color: '#70747D',
                        fontSize: 12,
                        fontWeight: '400',
                      }}
                    >
                      {timeSince(item?.item?.created)} ago
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
        <Text style={styles.blogposttext}>Local News</Text>
        <View>
          <FlatList
            data={LocalNews}
            contentContainerStyle={{ marginTop: 20 }}
            showsHorizontalScrollIndicator={false}
            ListFooterComponent={() => (
              <View style={styles.socialpostfooter}>
                <Text style={{ color: '#888C93' }}>View more</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
            renderItem={({ item }) => (
              <ImageBackground
                style={{
                  width: getWidth(90),
                  height: getHeight(14),
                  alignSelf: 'center',
                }}
                imageStyle={{ borderRadius: 10 }}
                source={{ uri: item?.enclosures[0]?.url }}
              >
                <View
                  style={{
                    backgroundColor: '#000000',
                    borderRadius: 10,
                    opacity: 0.65,
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={styles.textstyle}>{item?.title}</Text>
                </View>
              </ImageBackground>
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
    </View>
  );
};
export default HomeNewsComponent;
