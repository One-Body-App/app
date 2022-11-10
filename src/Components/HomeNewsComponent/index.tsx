import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { styles } from './styles';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Entypo from 'react-native-vector-icons/Entypo';
import { getHeight, getWidth, timeSince } from '@/utils/ResponsiveFun';
import SubscribeFlatlist from '../SubscribeFlatlist';

import { useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { ApiCall } from '@/services/api';
import { SetAllNews, SetLocalNews } from '@/redux/actions/SocialActions';
import { useDispatch, useSelector } from 'react-redux';
import { setLoader } from '@/redux/actions/GeneralActions';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { OpenURLButton } from '@/src/Services/constants';
import { RootStackParamList } from '@/src/Navigation/types';
import { StackScreenProps } from '@react-navigation/stack';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

const HomeNewsComponent = ({ navigation }: Props) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const allNews = useSelector((state: RootState) => state.social.AllNews);
  const LocalNews = useSelector((state: RootState) => state.social.LocalNews);

  const dispatch = useDispatch();

  const [refreshing, setRefreshing] = useState(false);

  const getAllNews = async () => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/all-news`,
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        dispatch(SetAllNews(res?.response[0]));
        dispatch(setLoader(false));
      } else {
        console.log('error', res?.response);
        dispatch(setLoader(false));
      }
    } catch (e: any) {
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
      if (res?.status == 200) {
        dispatch(SetLocalNews(res?.response[0]));
      } else {
        console.log('error', res?.response);
        dispatch(setLoader(false));
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    getAllNews();
    getLocalNews();
  }, []);

  const { colors } = useTheme();
  console.log(allNews, 'allNews');
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            enabled={true}
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await getAllNews();
              setRefreshing(false);
            }}
          />
        }
      >
        <Text style={{ ...styles.newstitle, color: colors.text }}>Today's News</Text>

        <View>
          {allNews.map((item, i) => (
            <TouchableOpacity
              onPress={() => {
                // navigation.navigate('BlogView', { url: item?.item?.id });
                OpenURLButton(item?.link);
              }}
              style={{
                ...styles.socialpostview,
                backgroundColor: colors.card,

                margin: 7,
              }}
              key={i}
            >
              {item?.enclosures ? (
                <FastImage
                  style={styles.socialpostimage}
                  resizeMode={'stretch'}
                  source={{ uri: item?.enclosures[0]?.url }}
                />
              ) : null}
              <View style={{ flex: 1, width: '100%', padding: 15 }}>
                <View style={styles.afsd}>
                  <Text
                    numberOfLines={2}
                    style={{
                      color: colors.text,
                      fontSize: 14,
                      lineHeight: 17,
                      letterSpacing: 0.1,
                      width: '90%',
                      fontWeight: '500',
                    }}
                  >
                    {item?.title}
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
                    {item?.author}
                  </Text>
                  <Text
                    style={{
                      color: '#70747D',
                      fontSize: 12,
                      fontWeight: '400',
                    }}
                  >
                    {timeSince(item?.created)} ago
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {/* <FlatList
            nestedScrollEnabled
            data={allNews}
            contentContainerStyle={{ marginTop: 20 }}
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
            keyExtractor={(item, index) => `${item.title}-${index}`}
            renderItem={(item) => (
              <TouchableOpacity
                onPress={() => {
                  // navigation.navigate('BlogView', { url: item?.item?.id });
                  OpenURLButton(item?.item?.link);
                  console.log(item);
                }}
                style={{ ...styles.socialpostview, backgroundColor: colors.card }}
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
                        color: colors.text,
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
          /> */}
        </View>
        <Text style={{ ...styles.newstitle, color: colors.text }}>Local News</Text>
        <View>
          {LocalNews.map((item, i) => (
            <ImageBackground
              style={{
                width: getWidth(90),
                height: getHeight(14),
                alignSelf: 'center',
                // padding: 7,
                margin: 7,
              }}
              imageStyle={{ borderRadius: 10, padding: 7 }}
              source={{ uri: item?.enclosures[0]?.url }}
              key={i}
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
          ))}
          {/* <FlatList
            nestedScrollEnabled
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
          /> */}
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
    </View>
  );
};
export default HomeNewsComponent;
