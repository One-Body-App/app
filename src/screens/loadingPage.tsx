import React, { useEffect } from 'react';
import { Image, View, StatusBar } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SetSocial, SetTodayNews } from '@/redux/actions/SocialActions';
import { ApiCall } from '@/services/api';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../Navigation/types';
import { RootState } from '../Redux/reducers/rootReducer';

type Props = StackScreenProps<RootStackParamList, 'LoadingPage'>;

const LoadingPage = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.userProfile);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const dispatch = useDispatch();

  const twitterUsers = ['700214868'];

  const getTwiters = async (id: string) => {
    try {
      const res = await ApiCall({
        route: `https://api.twitter.com/2/users/${id}/tweets?tweet.fields=attachments,created_at&media.fields=preview_image_url`,
        token:
          'AAAAAAAAAAAAAAAAAAAAAFP6dQEAAAAAfEHDxiZeF%2Bpzfx00JP17XxmnY54%3DfKX6bIRiLBQLIenY311VU3Mv4pZunJzSNKOoXt3Kt136Zy9NZv',
        verb: 'get',

        external: true,
      });
      console.log(user, 'useruseruserres');
      if (res?.status == 200) {
        dispatch(SetSocial(res?.response.data));
      } else {
        console.log('error', res?.response.data);
      }
    } catch (e: any) {
      console.log(`saga get twitter timline ${id} error -- `, e.toString());
    }
  };

  const getMultipleRandom = (arr: string[], num: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, num);
  };
  const getAllTweets = () => {
    getMultipleRandom(twitterUsers, 2).map((item) => getTwiters(item));
  };
  const getTodayNews = async () => {
    try {
      console.log(token, 'tokentokentoken');
      const res = await ApiCall({
        route: 'blogs/get-feed/today-news',
        verb: 'get',
        token: token,
      });
      console.log(res);
      if (res?.status == 200) {
        if (res?.response && res?.response.length > 0) {
          dispatch(SetTodayNews(res?.response[0]));
        }

        navigation.navigate('Bottombar', { tabs: 'Home' });
        // user?.phoneNumber
        //   ? navigation.navigate('Bootombar', { tabs: 'Home' })
        //   : navigation.navigate('AddPhoneNumber');
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(e);
      console.log('saga error -- ', e.toString());

      navigation.navigate('Bottombar', { tabs: 'Home' });
    }
  };

  useEffect(() => {
    if (token) {
      getAllTweets();
      getTodayNews();
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
