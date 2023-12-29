import React, { useEffect, useState } from 'react';
import { Image, View, StatusBar, Text, ImageBackground, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SetRecentBlog, SetSocial, SetTodayNews } from '@/src/redux/actions/SocialActions';
import { ApiCall } from '@/src/services/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigation/types';
import { RootState } from '../Redux/reducers/rootReducer';
import auth from '@react-native-firebase/auth';
import GeneralStatusBar from '../Components/GeneralStatusBar';

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

      setIsLoadedSocialPosts(true);
      if (res?.status == 200) {
        dispatch(SetSocial(res?.response.content));
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
      const res = await ApiCall({
        route: 'blogs/get-feed/today-news/1',
        verb: 'get',
        token: token,
      });

      setIsloadedTodaysNews(true);
      if (res?.status == 200) {
        // if (res?.response && res?.response.length > 0) {
        dispatch(SetTodayNews(res?.response));
        // }

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
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/recent-blogs/1`,
        verb: 'get',
        token: token,
      });
      setIsLoadedRecentBlog(true);

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
    if (isLoadedRecentBlog) {
      navigation.replace('Bottombar', { tabs: 'Home' });
    }
  }, [isLoadedRecentBlog]);

  useEffect(() => {
    if (token) {
      // getSocialPosts();
      // getTodayNews();
      // getRecentBlog();
      navigation.replace('Bottombar', { tabs: 'Home' });
    }
  }, [token]);

  return (
    <View>
      <StatusBar
        translucent={Platform.OS == 'android'}
        backgroundColor="#126B87"
        barStyle={Platform.OS == 'android' ? 'light-content' : undefined}
      />

      <ImageBackground
        resizeMode="cover"
        style={{
          width: '100%',
          height: '100%',

          justifyContent: 'center',
          alignItems: 'center',
        }}
        source={require('@/assets/images/Loading.gif')}
      >
        <Text
          style={{
            fontSize: 24,
            color: '#FFF',
            marginBottom: 180,
            fontFamily: 'Rubik-Regular',
            fontWeight: '500',
            textAlign: 'center',
            marginHorizontal: 40,
          }}
        >
          Please wait as we customize your feed
        </Text>
      </ImageBackground>
    </View>
  );
};
export default LoadingPage;
