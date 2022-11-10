import React, { useEffect, useState } from 'react';
import { Image, View, StatusBar } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SetRecentBlog, SetSocial, SetTodayNews } from '@/redux/actions/SocialActions';
import { ApiCall } from '@/services/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigation/types';
import { RootState } from '../Redux/reducers/rootReducer';

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
      const res = await ApiCall({
        route: `user/get-following-social`,
        token,
        verb: 'get',
      });

      if (res?.status == 200) {
        setIsLoadedSocialPosts(true);
        dispatch(SetSocial(res?.response));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(`saga get twitter timline error -- `, e.toString());
    }
  };

  const getTodayNews = async () => {
    try {
      const res = await ApiCall({
        route: 'blogs/get-feed/today-news',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        if (res?.response && res?.response.length > 0) {
          dispatch(SetTodayNews(res?.response[0]));
          setIsloadedTodaysNews(true);
        }

        // navigation.navigate('Bottombar', { tabs: 'Home' });
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(e);
      console.log('saga error -- ', e.toString());

      // navigation.navigate('Bottombar', { tabs: 'Home' });
    }
  };

  const getRecentBlog = async () => {
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/recent-blogs`,
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        dispatch(SetRecentBlog(res?.response[0]));
        setIsLoadedRecentBlog(true);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    if (isLoadedTodayNews && isLoadedRecentBlog && isLoadedSocialPosts) {
      navigation.navigate('Bottombar', { tabs: 'Home' });
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
