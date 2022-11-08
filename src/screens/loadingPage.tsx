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

  const getSocialPosts = async () => {
    try {
      const res = await ApiCall({
        route: `user/get-following-social`,
        token,
        verb: 'get',
      });
      console.log(res?.response, 'useruseruserres');
      if (res?.status == 200) {
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
      getSocialPosts();
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
