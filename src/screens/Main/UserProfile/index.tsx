import React, { useEffect, useRef, useState } from 'react';
import { Text, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { TabView, SceneMap, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import Add_badges from '@/assets/svg/Add_badges.svg';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '@/src/components/Button';
import { styles } from './styles';
import FastImage from 'react-native-fast-image';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import TwitterFlatlist from '@/src/components/TwitterFlatlist';
import BlogFlatlist from '@/src/components/BlogFlatlist';
import InstagramFlatlist from '@/src/components/InstagramFlatlist';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageModal from 'react-native-image-modal';
import { setLoader } from '@/redux//actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { User } from '@/utils/types';
import { OpenURLButton } from '@/src/Services/constants';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/_Navigation/types';
import Animated from 'react-native-reanimated';
import SubscribeFlatlist from '@/src/components/SubscribeFlatlist';
import { getuserAll, getuserGet } from '../../../Redux/actions/UserAction';
import { CompositeScreenProps } from '@react-navigation/native';
import {
  ExploreStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ProfileComponent from '@/src/components/Profile';
import { Profile } from 'react-native-fbsdk-next';

type Props = CompositeScreenProps<
  StackScreenProps<ExploreStackParamsList, 'UserProfile'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
  >
>;

const UserProfile = ({ navigation, route }: Props) => {
  const { id } = route.params;
  const dispatch = useDispatch();
  const [user, setUser] = useState<User>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const isLoading = useSelector((state: RootState) => state.general.loader);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [index, setIndex] = React.useState(0);
  const [routes, setRoutes] = React.useState<{ key: string; title: string }[]>([]);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const [direction, setDirection] = React.useState('');
  const [relatedUsers, setRelatedUsers] = React.useState<User[] | undefined>();

  const updateScrollPosition = (position: number) => {
    if (
      (position > scrollPosition || position == scrollPosition) &&
      scrollPosition - position < 0 &&
      scrollPosition - position < -45
    ) {
      setDirection('down');
    } else if (
      position < scrollPosition &&
      scrollPosition - position > 0 &&
      scrollPosition - position > 55
    ) {
      setDirection('up');
    }

    setScrollPosition(position);
  };
  useEffect(() => {
    if (user?.influencerProfile) {
      const routes = [];
      if (user?.influencerProfile?.twitterId) {
        routes.push({ key: 'Twitter', title: 'Twitter' });
      }

      if (user?.influencerProfile?.rssUrl) {
        routes.push({ key: 'Blog', title: 'Blog/News' });
      }

      if (user?.influencerProfile?.instagramId) {
        routes.push({ key: 'Instagram', title: 'Instagram' });
      }
      setRoutes(routes);
    }
  }, [user]);

  useEffect(() => {
    dispatch(setLoader(true));
    getUser();
    getRelatedUser();
  }, [id]);

  useEffect(() => {
    if (user) {
      navigation.setOptions({
        title: user.name,
      });
    }
  }, [user]);

  const getUser = async () => {
    try {
      const res = await ApiCall({
        route: `user/${id}`,
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        dispatch(setLoader(false));
        setUser(res?.response);
      } else {
        dispatch(setLoader(false));
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const getRelatedUser = async () => {
    try {
      const res = await ApiCall({
        route: `user/get-related-users/${id}/1?itemsPerPage=12`,
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        dispatch(setLoader(false));
        setRelatedUsers(res?.response);
      } else {
        console.log('error', res?.response);
        dispatch(setLoader(false));
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const handleUnSubscribe = async (id: string) => {
    try {
      const res = await ApiCall({
        route: `user/unsubscribe/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res?.status == 200) {
        Toast.show('unfollowed successfully.', Toast.LONG);
        dispatch(getuserAll({ token: token }));
        dispatch(getuserGet({ token: token }));
      } else {
        Toast.show('Error unfollowing, please try again later.', Toast.LONG);
      }
    } catch (e) {
      Toast.show('Error unfollowing, please try again later.', Toast.LONG);
    }
  };

  const handleSubscribe = async (id: string) => {
    try {
      const res = await ApiCall({
        route: `user/subscribe/${id}`,
        token: token,
        verb: 'patch',
      });
      if (res?.status == 200) {
        dispatch(getuserAll({ token: token }));
        dispatch(getuserGet({ token: token }));
        Toast.show('Followed successfully.', Toast.LONG);
      } else {
        Toast.show('Error following, please try again later.', Toast.LONG);
      }
    } catch (e) {
      Toast.show('Error following, please try again later.', Toast.LONG);
      console.log('Error subscribing --- ', e);
    }
  };
  // const OpenConversation = async (id) => {
  //   // onCreateOrJoin(id);
  //   dispatch(setLoader(true));
  //   try {
  //     const res = await ApiCall({
  //       params: { receiver: id },
  //       token: token,
  //       route: 'chat/new-chat-room',
  //       verb: 'post',
  //     });

  //     if (res?.status == 200) {
  //       dispatch(setLoader(false));

  //       navigation.navigate(
  //         'conversation',
  //         res?.data?.receiver
  //           ? {
  //               reciver: res?.data?.receiver,
  //               reciverId: res?.data?._id,
  //             }
  //           : { reciver: res?.data?.sender, reciverId: res?.data?._id }
  //       );
  //       // navigation.navigate('conversation');
  //     } else {
  //       console.log('error', res?.data);
  //     }
  //   } catch (e) {
  //     console.log('chanel create err --- ', e);
  //   }
  // };

  if (isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      {user && currentUser ? (
        <ProfileComponent
          user={user}
          currentUserId={currentUser?._id}
          relatedUsers={relatedUsers}
        />
      ) : (
        <View />
      )}
    </View>
  );
};
export default UserProfile;
