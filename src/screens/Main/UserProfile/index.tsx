import React, { useEffect, useRef, useState } from 'react';
import { Text, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { TabView, SceneMap, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import Add_badges from '@/assets/svg/Add_badges.svg';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '@/components/Button';
import { styles } from './styles';
import FastImage from 'react-native-fast-image';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import TwitterFlatlist from '@/components/TwitterFlatlist';
import BlogFlatlist from '@/components/BlogFlatlist';
import InstagramFlatlist from '@/components/InstagramFlatlist';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageModal from 'react-native-image-modal';
import { setLoader } from '@/redux//actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { User } from '@/utils/types';
import { OpenURLButton } from '@/src/Services/constants';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import Animated from 'react-native-reanimated';
import SubscribeFlatlist from '@/src/Components/SubscribeFlatlist';

type Props = StackScreenProps<RootStackParamList, 'UserProfile'>;

const UserProfile = ({ navigation, route }: Props) => {
  const { id } = route.params;
  const dispatch = useDispatch();
  const [user, setUser] = useState<User>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const isLoading = useSelector((state: RootState) => state.general.loader);

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

  const renderScene = ({
    route,
    jumpTo,
  }: SceneRendererProps & {
    route: any;
  }) => {
    switch (route.key) {
      case 'Instagram':
        return (
          <InstagramFlatlist
            setScrollPosition={updateScrollPosition}
            jumpTo={jumpTo}
            currentUser={user}
            {...route}
          />
        );
      case 'Blog':
        return (
          <BlogFlatlist
            setScrollPosition={updateScrollPosition}
            {...route}
            jumpTo={jumpTo}
            currentUser={user}
          />
        );
      case 'Twitter':
        return (
          <TwitterFlatlist
            setScrollPosition={updateScrollPosition}
            currentUser={user}
            jumpTo={jumpTo}
            {...route}
          />
        );
    }
  };

  const renderTabBar = (
    props: SceneRendererProps & {
      navigationState: NavigationState<any>;
    }
  ) => {
    return (
      <View style={styles.tabBar}>
        {props.navigationState.routes
          .filter((route) => {
            if (user?.influencerProfile?.twitterId && route.key == 'Twitter') {
              return true;
            }

            if (user?.influencerProfile?.rssUrl && route.key == 'Blog') {
              return true;
            }

            if (user?.influencerProfile?.instagramId && route.key == 'Instagram') {
              return true;
            }

            return false;
          })
          .map((route, i) => {
            return (
              <TouchableOpacity style={styles.tabItem} onPress={() => setIndex(i)}>
                <Animated.Text
                  style={
                    props?.navigationState?.index == i
                      ? {
                          color: '#032F3C',
                          fontFamily: 'Rubik-Medium',
                        }
                      : {
                          color: '#032F3C',
                          fontFamily: 'Rubik-Regular',
                        }
                  }
                >
                  {route.title}
                </Animated.Text>
                {props?.navigationState?.index == i ? <View style={styles.propview} /> : null}
              </TouchableOpacity>
            );
          })}
      </View>
    );
  };

  useEffect(() => {
    dispatch(setLoader(true));
    getUser();
    getRelatedUser();
  }, [id]);

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
      <Button
        onPress={() => navigation.goBack()}
        text=""
        leftIcon={<Icon name="chevron-back" size={20} color={'#032f3c'} />}
        btnStyle={{ padding: 20 }}
      />

      <View
        style={{
          alignSelf: 'center',
          width: direction == 'down' ? 75 : 150,
          height: direction == 'down' ? 75 : 150,
          marginBottom: 10,
        }}
      >
        <ImageModal
          style={{
            width: direction == 'down' ? 75 : 150,
            height: direction == 'down' ? 75 : 150,
            alignSelf: 'center',

            borderRadius: 75,
            borderColor: user?.profileImage ? '#032F3C' : '#09aadb',
            borderWidth: 1,
          }}
          source={{
            uri: user?.profileImage ?? 'https://cdn.onebodyapp.com/user/no-image.png',
          }}
          resizeMode={'contain'}
        />
      </View>
      <Text
        style={{
          fontWeight: '500',
          color: '#032f3c',
          textAlign: 'center',
          fontSize: direction == 'down' ? 15 : 20,
        }}
      >
        {user?.accountType == 'organization' && user?.profile?.companyName
          ? user?.profile?.companyName
          : user?.name}
      </Text>

      {direction == 'down' ? null : (
        <Animated.Text
          style={[
            {
              textAlign: 'center',
              marginBottom: 10,
              color: '#5b7279',
              marginTop: 5,
            },
          ]}
        >
          {user?.username ? `@${user?.username}` : ''}
          {`${user?.whatIDo ? `• ${user?.whatIDo.name}` : ''}`}
        </Animated.Text>
      )}

      {/* {user.role != 'individual' ? (
          <Text style={{textAlign: 'center', color: '#5B7279'}}>
            @nickdreamsalot . Minister and Ideator
          </Text>
        ) : null} */}
      {direction == 'down' ? null : (
        <Animated.View style={styles.manyimageview}>
          <View
            style={{
              flex: 0,
              padding: 5,
            }}
          >
            <FlatList
              data={user?.badgesData}
              numColumns={3}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <FastImage
                  style={styles.firstimage}
                  source={{
                    uri: item.badge,
                  }}
                  resizeMode={FastImage.resizeMode.stretch}
                />
              )}
            />
          </View>
        </Animated.View>
      )}
      {user?.isInfluencer == true || user?.accountType == 'organization' ? (
        <>
          <Text numberOfLines={3} style={styles.bio}>
            {user?.bio}
          </Text>
          <TouchableOpacity onPress={() => OpenURLButton(user?.website)}>
            <Text style={styles.onebodytext}>{user?.website}</Text>
          </TouchableOpacity>
        </>
      ) : null}
      {direction == 'down' ? null : (
        <Animated.View>
          {user?.isInfluencer == true ? (
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  color: '#032f3c',
                  fontFamily: 'Rubik-Regular',
                  marginVertical: getHeight(1),
                }}
              >
                Reaching:{' '}
                {user.followers > 999 ? `${(user.followers / 1000).toFixed(2)}k` : user.followers}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      )}
      {direction == 'down' ? null : (
        <View style={styles.bottomView}>
          {/* {currentUser?.following.some((following) => following == currentUser._id) ? (
            <Button
              text={'Unfollow'}
              btnStyle={{
                ...styles.btn,
                backgroundColor: '#F6F6F6',
                borderWidth: 0,
              }}
              btnTextStyle={{
                ...GeneralStyle.btnText,
                color: '#595959',
                letterSpacing: 0,
              }}
              onPress={() => {}}
            />
          ) : (
            <Button
              text={'Follow'}
              btnStyle={{
                ...styles.btn,
                backgroundColor: '#F6F6F6',
                borderWidth: 0,
              }}
              btnTextStyle={{
                ...GeneralStyle.btnText,
                color: '#595959',
                letterSpacing: 0,
              }}
              onPress={() => {}}
            />
          )} */}

          {/* <Button
            text={'Message'}
            onPress={() => OpenConversation(user?._id)}
            btnStyle={styles.btn}
            btnTextStyle={{
              ...GeneralStyle.btnText,
              color: '#032f3c',
              letterSpacing: 0,
            }}
          /> */}
        </View>
      )}

      {user ? (
        <>
          {user?.isInfluencer == true && routes.length > 0 ? (
            <TabView
              navigationState={{ index, routes }}
              renderScene={renderScene}
              renderTabBar={renderTabBar}
              onIndexChange={setIndex}
              // initialLayout={{ width: getWidth(100) }}
            />
          ) : (
            <SubscribeFlatlist
              numColumns={3}
              setScrollPosition={updateScrollPosition}
              hideFollowButton={true}
              itemStyle={{ width: '33%' }}
              users={relatedUsers}
            />
          )}
        </>
      ) : null}

      {/* </ScrollView> */}
    </View>
  );
};
export default UserProfile;
