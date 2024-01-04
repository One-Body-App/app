import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast';

import { setLoader } from '@/redux//actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { User } from '@/utils/types';
import { StackScreenProps } from '@react-navigation/stack';

import { CompositeScreenProps } from '@react-navigation/native';
import {
  ExploreStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
  PrayerWallStackParamsList,
} from '@/src/navigator/types';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ProfileComponent from '@/src/components/profile/Profile';
import { getProfile } from '@/src/redux/actions/AuthActions';

type Props = CompositeScreenProps<
  StackScreenProps<ExploreStackParamsList, 'UserProfile'>,
  CompositeScreenProps<
    StackScreenProps<PrayerWallStackParamsList, 'UserProfile'>,
    CompositeScreenProps<
      DrawerScreenProps<MainDrawerParamsList, 'Main'>,
      BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
    >
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
        dispatch(getProfile.Request({ token: token }));
        // Toast.show('unfollowed successfully.', Toast.LONG);
        // dispatch(getuserAll({ token: token }));
        // dispatch(getuserGet({ token: token }));
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
        // dispatch(getuserAll({ token: token }));
        // dispatch(getuserGet({ token: token }));
        dispatch(getProfile.Request({ token: token }));
        // Toast.show('Followed successfully.', Toast.LONG);
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
          profileData={user}
          currentUser={currentUser}
          relatedUsers={relatedUsers}
          handleSubscribe={handleSubscribe}
          handleUnSubscribe={handleUnSubscribe}
        />
      ) : (
        <View />
      )}
    </View>
  );
};
export default UserProfile;
