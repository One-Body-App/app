import React, { useEffect } from 'react';
import { Image, View, StatusBar } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SetSocial, SetTodayNews } from '@/redux/actions/SocialActions';
import { ApiCall } from '@/services/api';

const LoadingPage = ({ navigation }) => {
  const user = useSelector((state) => state.auth.userProfile);
  const token = useSelector((state) => state.auth.userToken);
  const dispatch = useDispatch();

  const twitterUsers = ['147895001', '1380592017936375815', '1481475468125745154'];

  const getTwiters = async (id) => {
    try {
      id = '1481475468125745154';
      const res = await ApiCall({
        route: `https://api.twitter.com/2/users/${id}/tweets?tweet.fields=attachments,created_at&media.fields=preview_image_url`,
        token:
          'AAAAAAAAAAAAAAAAAAAAAFP6dQEAAAAAfEHDxiZeF%2Bpzfx00JP17XxmnY54%3DfKX6bIRiLBQLIenY311VU3Mv4pZunJzSNKOoXt3Kt136Zy9NZv',
        verb: 'get',

        external: true,
      });
      console.log(res);
      if (res?.status == '200') {
        dispatch(SetSocial(res?.data));
      } else {
        console.log('error', res?.data);
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
  const getTodayNews = async () => {
    try {
      const res = await ApiCall({
        route: 'blogs/get-feed/today-news',
        verb: 'get',
        token: token,
      });
      console.log(res);
      if (res?.status == '200') {
        if (res?.data && res?.data.length > 0) {
          dispatch(SetTodayNews(res?.data[0]));
        }

        navigation.navigate('Bootombar', { tabs: 'Home' });
        // user?.phoneNumber
        //   ? navigation.navigate('Bootombar', { tabs: 'Home' })
        //   : navigation.navigate('AddPhoneNumber');
      } else {
        console.log('error', res?.data);
      }
    } catch (e) {
      console.log(e);
      console.log('saga error -- ', e.toString());
      user?.phoneNumber
        ? navigation.navigate('Bootombar', { tabs: 'Home' })
        : navigation.navigate('AddPhoneNumber');
    }
  };

  useEffect(() => {
    getAllTweets();
    getTodayNews();
  }, []);

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
