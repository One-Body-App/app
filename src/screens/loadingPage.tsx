import React, { useEffect, useState } from 'react';
import { Image, View, StatusBar } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SetRecentBlog, SetSocial, SetTodayNews } from '@/redux/actions/SocialActions';
import { ApiCall } from '@/services/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigation/types';
import { RootState } from '../Redux/reducers/rootReducer';
import auth from '@react-native-firebase/auth';

type Props = StackScreenProps<RootStackParamList, 'LoadingPage'>;

const LoadingPage = ({ navigation }: Props) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  // const token = useSelector((state: RootState) => state.auth.userToken);
  const [isLoadedTodayNews, setIsloadedTodaysNews] = useState(false);
  const [isLoadedRecentBlog, setIsLoadedRecentBlog] = useState(false);
  const [isLoadedSocialPosts, setIsLoadedSocialPosts] = useState(false);
  // SocialPost;
  const dispatch = useDispatch();

  const getSocialPosts = async () => {
    try {
      console.log('1111111');
      const res = await ApiCall({
        route: `user/get-following-social`,
        token,
        verb: 'get',
      });
      console.log('1111111DONE', res);
      setIsLoadedSocialPosts(true);
      if (res?.status == 200) {
        dispatch(SetSocial(res?.response));
      } else {
        if (res?.status == 401) {
          auth().currentUser?.getIdToken(true);
        }
        console.log('error', res?.response);
      }
    } catch (e: any) {
      setIsLoadedSocialPosts(true);
      console.log(`saga get twitter timline error -- `, e.toString());
    }
  };

  const getTodayNews = async () => {
    try {
      console.log('2222222');
      const res = await ApiCall({
        route: 'blogs/get-feed/today-news',
        verb: 'get',
        token: token,
      });
      console.log('2222222DONE', res);
      setIsloadedTodaysNews(true);
      if (res?.status == 200) {
        if (res?.response && res?.response.length > 0) {
          dispatch(SetTodayNews(res?.response));
        }

        // navigation.navigate('Bottombar', { tabs: 'Home' });
      } else {
        if (res?.status == 401) {
          auth().currentUser?.getIdToken(true);
        }

        console.log('error', res?.response);
      }
    } catch (e: any) {
      setIsloadedTodaysNews(true);
      console.log(e);
      console.log('saga error -- ', e.toString());

      // navigation.navigate('Bottombar', { tabs: 'Home' });
    }
  };

  const getRecentBlog = async () => {
    console.log('3333333');
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/recent-blogs`,
        verb: 'get',
        token: token,
      });
      setIsLoadedRecentBlog(true);
      console.log('3333333DONE', res);
      if (res?.status == 200) {
        dispatch(SetRecentBlog(res?.response));
      } else {
        if (res?.status == 401) {
          auth().currentUser?.getIdToken(true);
        }
        console.log('error', res?.response);
      }
    } catch (e: any) {
      setIsLoadedRecentBlog(true);
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    console.log(isLoadedTodayNews, isLoadedRecentBlog, isLoadedSocialPosts);
    if (isLoadedTodayNews && isLoadedRecentBlog && isLoadedSocialPosts) {
      console.log('asdfasdfasd');
      navigation.replace('Bottombar', { tabs: 'Home' });
    }
  }, [isLoadedTodayNews, isLoadedRecentBlog, isLoadedSocialPosts]);

  useEffect(() => {
    if (token) {
      getSocialPosts();
      getTodayNews();
      getRecentBlog();
    }
  }, [token]);

  return (
    <View>
      <StatusBar barStyle="light-content" />
      <Image
        resizeMode="cover"
        style={{ width: '100%', height: '100%' }}
        source={require('@/assets/images/Loading.gif')}
      />
    </View>
  );
};
export default LoadingPage;
