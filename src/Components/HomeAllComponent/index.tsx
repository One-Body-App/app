import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { styles } from './styles';
import Modal from 'react-native-modal';
import { Avatar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import Social from '@/assets/svg/Social.svg';
import parse from 'rss-to-json';
import { getHeight, getWidth, timeSince } from '@/utils/ResponsiveFun';
import SubscribeFlatlist from '../SubscribeFlatlist';
import Button from '../Button';
import { GeneralStyle } from '../../constants/GeneralStyle';
import { color } from 'react-native-reanimated';
import SocialFlatlist from '../SocialFlatlist';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import { SetRecentBlog } from '@/redux/actions/SocialActions';

const HomeAllComponent = () => {
  const token = useSelector((state) => state.auth.userToken);
  const todayNews = useSelector((state) => state.social.TodayNews);
  const recentBlog = useSelector((state) => state.social.RecentBlog);
  const dispatch = useDispatch();
  const [show, setShow] = useState<boolean>();
  const navigation = useNavigation();
  const toggleModal = () => {
    setShow(!show);
  };

  const getRecentBlog = async () => {
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/recent-blogs`,
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
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Modal
        backdropOpacity={0.3}
        isVisible={show}
        onBackdropPress={() => setShow(false)}
        onSwipeComplete={() => setShow(false)}
        swipeDirection={['down']}
        style={styles.bottomView}
      >
        <View style={styles.content2}>
          <View style={styles.headLine} />
          <View style={styles.contview}>
            <View style={styles.saveview}>
              <Button
                btnStyle={styles.savetuch}
                text="Save"
                leftIcon={
                  <Feather style={{ marginRight: 3 }} name="bookmark" size={17} color="#032F3C" />
                }
                btnTextStyle={{ color: '#032F3C' }}
                onPress={() => console.log('press')}
              />
              {/* <TouchableOpacity style={styles.savetuch}>
                <Text style={{color: '#032F3C'}}>Save</Text>
              </TouchableOpacity> */}
              <Button
                btnStyle={styles.sharetouch}
                text="Share"
                leftIcon={
                  <MaterialCommunityIcons
                    style={{ marginRight: 3 }}
                    name="share-outline"
                    size={18}
                    color="#032F3C"
                  />
                }
                btnTextStyle={{ color: '#032F3C' }}
                onPress={() => console.log('press')}
              />
              {/* <TouchableOpacity style={styles.sharetouch}>
                <MaterialCommunityIcons name="rocket" size={20} color="#900" />
                <Text style={{color: '#032F3C'}}>Share</Text>
              </TouchableOpacity> */}
            </View>
            <Button
              btnStyle={styles.reporttouch}
              text="Report"
              leftIcon={
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="infocirlceo"
                  size={14}
                  color="#E90202"
                />
              }
              btnTextStyle={{ color: '#E90202' }}
              onPress={() => console.log('press')}
            />
            {/* <TouchableOpacity style={styles.reporttouch}>
              <Text style={{color: '#E90202'}}>Report</Text>
            </TouchableOpacity> */}
            {/* <TouchableOpacity style={styles.linktouch}>
              <Text style={{color: '#032F3C'}}>Link</Text>
            </TouchableOpacity> */}
            <Button
              btnStyle={{
                ...GeneralStyle.btn,
                backgroundColor: '#f6f6f6',
                flexDirection: 'row',
              }}
              text="Link"
              leftIcon={<Entypo style={{ marginRight: 3 }} name="link" size={18} color="#032F3C" />}
              btnTextStyle={{ color: '#032F3C' }}
              onPress={() => console.log('press')}
            />
            <TouchableOpacity style={{ ...GeneralStyle.btn, backgroundColor: '#f6f6f6' }}>
              <Text style={{ color: '#032F3C' }}>Unsubscribe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ ...GeneralStyle.btn, backgroundColor: '#e6eaec' }}>
              <Text style={{ ...GeneralStyle.btnText, color: '#032f3c' }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScrollView>
        <Text style={styles.newstitle}>Today's News</Text>
        <View>
          <FlatList
            data={todayNews}
            horizontal={true}
            contentContainerStyle={{ marginTop: 20 }}
            showsHorizontalScrollIndicator={false}
            ListHeaderComponent={() => <View style={{ padding: 7 }} />}
            ListFooterComponent={() => <View style={{ padding: 7 }} />}
            ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
            renderItem={({ item }) => (
              <ImageBackground
                style={styles.newsimage}
                imageStyle={{ borderRadius: 20 }}
                source={{ uri: item?.enclosures[0]?.url }}
              >
                <View
                  style={{
                    backgroundColor: '#00171e',
                    borderRadius: 20,
                    opacity: 0.65,
                    flex: 1,
                  }}
                ></View>
                <View
                  style={{
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    top: 0,
                    justifyContent: 'space-between',
                  }}
                >
                  <TouchableOpacity onPress={toggleModal}>
                    <Entypo
                      name="dots-three-horizontal"
                      style={styles.newsicon}
                      size={25}
                      color={'white'}
                    />
                  </TouchableOpacity>
                  <Text style={styles.newstext}>{item?.title}</Text>
                  <View style={styles.newsview}>
                    <Text style={{ ...styles.messageText, color: '#B8BABE' }}>{item?.author}</Text>
                    <Text style={styles.messageText}>{timeSince(item?.created)} ago</Text>
                  </View>
                </View>
              </ImageBackground>
            )}
          />
        </View>
        <Text style={styles.socialposttext}>Latest News & Social Post</Text>
        <View>
          <SocialFlatlist />
        </View>
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
        <View style={{ paddingLeft: 5 }}>
          <SubscribeFlatlist />
        </View>
      </ScrollView>
    </View>
  );
};
export default HomeAllComponent;
