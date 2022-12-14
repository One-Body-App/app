import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  ScrollView,
  Text,
  View,
  RefreshControl,
  Image,
} from 'react-native';

import { TouchableOpacity } from 'react-native-gesture-handler';
import { styles } from './styles';
import Modal from 'react-native-modal';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AntDesign from 'react-native-vector-icons/AntDesign';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';

import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import SubscribeFlatlist from '../SubscribeFlatlist';
import Button from '../Button';
import { GeneralStyle } from '../../constants/GeneralStyle';

import SocialFlatlist from '../SocialFlatlist';
import { NavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import { SetRecentBlog } from '@/redux/actions/SocialActions';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import { OpenURLButton } from '@/src/Services/constants';
import { isObject } from 'lodash';
import Twitter from '@/assets/svg/Twitter.svg';
import { SceneRendererProps } from 'react-native-tab-view';

type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

const HomeAllComponent = ({ jumpTo }: SceneRendererProps) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const todayNews = useSelector((state: RootState) => state.social.TodayNews);
  const recentBlog = useSelector((state: RootState) => state.social.RecentBlog);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const [show, setShow] = useState<boolean>();
  const [page, setPage] = useState<number>(1);
  const [socialPosts, setSocialPosts] = useState<any[]>();
  const navigation = useNavigation<ScreenNavigationProp>();

  const toggleModal = () => {
    setShow(!show);
  };

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
  const { colors } = useTheme();

  const getSocialPosts = async () => {
    try {
      const res = await ApiCall({
        route: `user/get-following-social/1`,
        token,
        verb: 'get',
      });
      let posts = [];

      if (res?.status == 200) {
        posts = res?.response?.content ?? [];

        setSocialPosts(posts);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(`saga get twitter timline  error -- `, e.toString());
    }
  };

  useEffect(() => {
    getSocialPosts();
  }, []);

  return (
    <View style={{ flex: 1 }}>
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

            <Button
              btnStyle={{
                ...GeneralStyle.btn,
                backgroundColor: '#f6f6f6',
                flexDirection: 'row',
              }}
              text="Unsubscribe"
              btnTextStyle={{ color: '#032F3C' }}
              onPress={() => console.log('press')}
            />

            <Button
              text={'CLOSE'}
              btnStyle={{
                ...GeneralStyle.btn,
                // backgroundColor: 'red',
                backgroundColor: '#e6eaec',
                flexDirection: 'row',
              }}
              btnTextStyle={{ ...GeneralStyle.btnText, color: '#032f3c' }}
              onPress={() => {}}
            />
          </View>
        </View>
      </Modal>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 75 }}
        refreshControl={
          <RefreshControl
            enabled={true}
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await getRecentBlog(page + 1);
              setRefreshing(false);
            }}
          />
        }
      >
        <Text style={{ ...styles.newstitle, color: colors.text }}>Today's News</Text>
        <View>
          <FlatList
            nestedScrollEnabled
            data={todayNews}
            horizontal={true}
            contentContainerStyle={{ marginTop: 20 }}
            showsHorizontalScrollIndicator={false}
            ListHeaderComponent={() => <View style={{ padding: 7 }} />}
            ListFooterComponent={() => <View style={{ padding: 7 }} />}
            ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
            keyExtractor={(item, index) => `${item.created}_${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  OpenURLButton(item?.link);
                }}
              >
                <ImageBackground
                  style={styles.newsimage}
                  imageStyle={{ borderRadius: 20 }}
                  source={{ uri: item?.image?.url }}
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
                      <Text style={{ ...styles.messageText, color: '#B8BABE' }}>
                        {isObject(item?.author) ? item?.author?.a?.$text : item?.author}
                      </Text>
                      <Text style={styles.messageText}>{timeSince(item?.created)} ago</Text>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}
          />
        </View>
        <Text style={{ ...styles.socialposttext, color: colors.text }}>Latest Post</Text>
        <View>
          <FlatList
            data={socialPosts}
            style={{ flex: 1 }}
            keyExtractor={(item, index) => {
              return `${item?.handler}-${item.id}-${index}`;
            }}
            renderItem={({ item, index }) => (
              <View
                key={`${item?.handler}-${index}`}
                style={{ ...styles.socialpostview, backgroundColor: colors.card, margin: 7 }}
              >
                {item?.attachments ? (
                  <Image
                    style={styles.socialpostimage}
                    resizeMode={'stretch'}
                    source={require('@/assets/images/Photo.png')}
                  />
                ) : null}
                <Text
                  style={{
                    padding: 5,
                    fontFamily: 'Rubik',
                    lineHeight: 18,
                    color: colors.text,
                    marginTop: getHeight(1),
                    textAlign: 'center',
                  }}
                >
                  {item?.content}
                </Text>
                <View style={{ flexDirection: 'row', padding: 5 }}>
                  {item?.source == 'twitter' ? <Twitter fill="#00acee" /> : null}
                  <Text
                    style={{
                      marginLeft: 5,
                      fontFamily: 'Rubik',
                      color: '#68828A',
                      alignItems: 'center',
                    }}
                  >
                    @{item?.handler}
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={() => (
              <View style={{ alignSelf: 'center', alignContent: 'center' }}>
                <Button
                  text="View More"
                  btnTextStyle={{ color: '#032F3C', textAlign: 'center' }}
                  onPress={() => jumpTo('Social')}
                />
              </View>
            )}
          />
        </View>
        {recentBlog.length > 0 ? (
          <>
            <Text style={{ ...styles.blogposttext, color: colors.text }}>Recent Blog Post</Text>
            <View>
              <FlatList
                nestedScrollEnabled
                data={recentBlog}
                horizontal={true}
                contentContainerStyle={{ marginTop: 20 }}
                showsHorizontalScrollIndicator={false}
                ListHeaderComponent={() => <View style={{ padding: 7 }} />}
                ListFooterComponent={() => <View style={{ padding: 7 }} />}
                ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
                keyExtractor={(item, index) => `${item.created}_${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      OpenURLButton(item?.link);
                    }}
                    style={{ ...styles.blogpostview, backgroundColor: colors.card }}
                  >
                    <FastImage
                      style={styles.blogpostimage}
                      resizeMode={'stretch'}
                      source={{ uri: item?.image?.url }}
                    />
                    <Text numberOfLines={2} style={{ ...styles.blogpostpara, color: colors.text }}>
                      {isObject(item?.title) ? item?.title?.a.$text : item?.title}
                    </Text>
                    <Text style={styles.blogposthour}>{timeSince(item?.created)} ago</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </>
        ) : null}

        <View style={styles.explorview}>
          <Text style={{ ...styles.explortext, color: colors.text }}>
            Explore Influencers & Organizations
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Explore')} style={styles.viewtext}>
            <Text style={{ color: '#126B87' }}>View more</Text>
            <Fontisto name="angle-right" size={12} color="#126B87" />
          </TouchableOpacity>
        </View>
        <View style={{ paddingLeft: 5 }}>
          <SubscribeFlatlist horizontal={true} />
        </View>
      </ScrollView>
    </View>
  );
};
export default HomeAllComponent;
