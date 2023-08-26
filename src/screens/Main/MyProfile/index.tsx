import React, { useEffect, useState } from 'react';
import { Animated, Text, View, FlatList, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { TabView, SceneRendererProps } from 'react-native-tab-view';
import Add_badges from '@/assets/svg/Add_badges.svg';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '@/src/components/Button';
import { styles } from './styles';
import FastImage from 'react-native-fast-image';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import TwitterFlatlist from '@/src/components/TwitterFlatlist';
import BlogFlatlist from '@/src/components/BlogFlatlist';
import InstagramFlatlist from '@/src/components/InstagramFlatlist';
import Selected from '@/assets/svg/Selected.svg';
import { getProfile, getBadges, setUserBadges } from '@/redux//actions/AuthActions';
import ImageModal from 'react-native-image-modal';
import { CompositeScreenProps, useTheme } from '@react-navigation/native';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { RootStackParamList } from '@/src/Navigation/types';
import { StackScreenProps } from '@react-navigation/stack';
import { Badge } from '@/utils/types';
import { OpenURLButton } from '@/src/Services/constants';
import {
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MyProfileStackParamsList,
} from '@/src/navigator/types';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type Route = {
  key: string;
  title: string;
};
type Props = CompositeScreenProps<
  StackScreenProps<MyProfileStackParamsList, 'MyProfile'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
  >
>;

const MyProfile = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [requestModel, setRequestModel] = useState<boolean>(false);
  const [index, setIndex] = React.useState(0);
  const [routes, setRoutes] = React.useState<Route[]>([]);

  const [selectedBadges, setSelectedBadges] = useState<Badge[]>(user?.badgesData ?? []);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const [direction, setDirection] = React.useState('');

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
  const unselect = (id: string) => {
    const array = selectedBadges.filter((item) => item._id != id);

    setSelectedBadges(array);
  };

  useEffect(() => {
    dispatch(getBadges.Request({ token: token }));
  }, []);

  useEffect(() => {
    if (authState?.getBadgesSuccess == false) {
      Toast.show('Unable to get badges at this time!', Toast.LONG);
    }
  }, [authState?.getBadgesSuccess]);

  useEffect(() => {
    if (authState?.setUserBadgesSuccess == true) {
      dispatch(getProfile.Request({ token: token, accountType: user?.accountType }));
    } else if (authState?.setUserBadgesSuccess == false) {
      Toast.show('Unable to set badges at this time!', Toast.LONG);
    }
  }, [authState?.setUserBadgesSuccess]);

  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Modal
        backdropOpacity={0.3}
        isVisible={requestModel}
        onBackdropPress={() => setRequestModel(false)}
        onSwipeComplete={() => setRequestModel(false)}
        swipeDirection={['down']}
        style={styles.bottomView}
        propagateSwipe
      >
        <View style={styles.content2}>
          <Text
            style={{
              color: '#032F3C',
              marginLeft: 20,
              marginRight: 20,
              textAlign: 'center',
              letterSpacing: 0.25,
            }}
          >
            <Text style={{ fontWeight: 'bold' }}>Select up to 3 badage</Text> you would like to
            display on your profile
          </Text>
          <View style={styles.profileview}>
            <View style={{ marginVertical: 15 }}>
              <FlatList
                data={authState?.getBadgesData}
                numColumns={3}
                showsHorizontalScrollIndicator={false}
                // ListFooterComponent={() => <View style={{ padding: 7 }} />}
                ItemSeparatorComponent={() => <View style={{ margin: 7 }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      if (user?.badges.includes(item?._id)) {
                        unselect(item?._id);
                      } else {
                        const badgeIndex = selectedBadges.findIndex((badgeToCheck) => {
                          return badgeToCheck._id == item?._id;
                        });

                        if (badgeIndex > -1) {
                          const newSelectedBadges = selectedBadges.filter((selectedBadge) => {
                            return selectedBadge._id != selectedBadges[badgeIndex]._id;
                          });
                          setSelectedBadges(newSelectedBadges);
                        } else {
                          if (selectedBadges.length < 3) {
                            setSelectedBadges([...selectedBadges, item]);
                          } else {
                            Toast.show('You cannot select more then 3 badges!', Toast.LONG);
                          }
                        }
                      }
                    }}
                    style={styles.ideaterview}
                  >
                    <FastImage
                      style={{ width: '33%', height: 40, borderRadius: 50 }}
                      source={{
                        uri: item?.badge,
                      }}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                    {selectedBadges.filter((x) => x._id == item?._id).length > 0 ? (
                      <View
                        style={{
                          position: 'absolute',
                          alignSelf: 'center',
                          marginTop: 2,
                        }}
                      >
                        <Selected />
                      </View>
                    ) : null}
                    <Text
                      style={{
                        color: '#032F3C',
                        fontFamily: 'Rubik-Medium',
                        marginTop: getHeight(1),
                      }}
                    >
                      {item?.title}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>

          <View style={{ width: '100%' }}>
            <TouchableOpacity
              onPress={() => {
                dispatch(setUserBadges.Request({ token: token, badges: selectedBadges }));
                setRequestModel(false);
              }}
              style={{ ...GeneralStyle.btn, backgroundColor: '#e6eaec' }}
            >
              <Text
                style={{
                  color: '#032F3C',
                  fontWeight: 'bold',
                  letterSpacing: 1.25,
                }}
              >
                DONE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {direction == 'down' ? null : (
        <Animated.View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <View>
            <View style={{ alignSelf: 'center' }}>
              <ImageModal
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 45,

                  marginBottom: 10,
                  borderColor: user?.profileImage ? '#032F3C' : '#09aadb',
                }}
                source={{
                  uri: user?.profileImage || 'https://cdn.onebodyapp.com/user/no-image.png',
                }}
                resizeMode={'cover'}
              />
            </View>
          </View>
        </Animated.View>
      )}
      <Text
        style={{
          fontWeight: '500',
          color: '#032f3c',
          textAlign: 'center',
          fontSize: 20,
          marginTop: direction == 'down' ? 10 : 0,
        }}
      >
        {user?.accountType == 'organization' && user?.profile?.companyName
          ? user?.profile?.companyName
          : user?.name}
      </Text>
      <Text
        style={[
          {
            textAlign: 'center',
            marginBottom: 20,
            color: '#5b7279',
            marginTop: 5,
          },
        ]}
      >
        {user?.username ? `@${user?.username}` : ''}
        {`${user?.whatIDo ? `• ${user?.whatIDo.name}` : ''}`}
      </Text>
      {user?.accountType == 'individual' ? (
        <View style={styles.manyimageview}>
          <View>
            <FlatList
              data={user?.badgesData}
              numColumns={3}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <>
                  {user?.badgesData?.length < 3 ? (
                    <FastImage
                      style={styles.firstimage}
                      source={{
                        uri: item.badge,
                      }}
                      resizeMode={FastImage.resizeMode.stretch}
                    />
                  ) : (
                    <TouchableOpacity
                      style={{ marginHorizontal: getWidth(1) }}
                      onPress={() => {
                        dispatch(getBadges.Request({ token: token }));
                        //getBadge();
                        setRequestModel(true);
                      }}
                    >
                      <FastImage
                        style={styles.firstimage}
                        source={{
                          uri: item.badge,
                        }}
                        resizeMode={FastImage.resizeMode.stretch}
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            />
          </View>
          {user?.badgesData?.length < 3 && (
            <TouchableOpacity
              style={{ marginHorizontal: getWidth(1) }}
              onPress={() => {
                //getBadge();
                dispatch(getBadges.Request({ token: token }));
                setRequestModel(true);
              }}
            >
              <Add_badges />
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {user?.isInfluencer == true || user?.accountType == 'organization' ? (
        <Text numberOfLines={3} style={styles.bio}>
          {user?.bio}
        </Text>
      ) : null}
      {user?.website ? (
        <TouchableOpacity
          onPress={() =>
            OpenURLButton(
              `${
                user?.website.indexOf('https://') == -1 ? `https://${user?.website}` : user?.website
              }`
            )
          }
        >
          <Text style={styles.onebodytext}>{user?.website}</Text>
        </TouchableOpacity>
      ) : null}

      {direction == 'down' ? null : (
        <Animated.View>
          {user?.isInfluencer == true && user?.accountType == 'individual' ? (
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

      <View
        style={{
          alignItems: 'center',
          flex: 1,
        }}
      >
        <View style={{ width: '100%' }}>
          <Button
            text={'Edit Profile'}
            onPress={() => navigation.navigate('EditProfile')}
            mode="outlined"
            paper
          />
        </View>
      </View>
      <View style={{ flex: 3 }}>
        {user?.isInfluencer == true ? (
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            renderTabBar={(props) => {
              const inputRange = props.navigationState.routes.map((x, i) => i);

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
                        <TouchableOpacity
                          style={styles.tabItem}
                          onPress={() => setIndex(i)}
                          key={i}
                        >
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
                          {props?.navigationState?.index == i ? (
                            <View style={styles.propview} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                </View>
              );
            }}
            onIndexChange={setIndex}
            initialLayout={{ width: getWidth(100) }}
          />
        ) : null}
      </View>
    </View>
  );
};
export default MyProfile;
