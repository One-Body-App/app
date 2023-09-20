import React, { useEffect, useState } from 'react';
import { Animated, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
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

import { CompositeScreenProps, useTheme } from '@react-navigation/native';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { RootStackParamList } from '@/src/_Navigation/types';
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
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Spacing, Typography } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import {
  Add,
  Calendar,
  HomeHashtag,
  Link2,
  Link21,
  Location,
  ShieldTick,
} from 'iconsax-react-native';
import { button } from '@/src/styles/buttons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { parse, format, parseISO } from 'date-fns';

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
  const profileImagesize = 80;

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
          <StyledText
            style={{
              color: '#032F3C',
              marginLeft: 20,
              marginRight: 20,
              textAlign: 'center',
              letterSpacing: 0.25,
            }}
          >
            <StyledText style={{ fontWeight: 'bold' }}>Select up to 3 badage</StyledText> you would
            like to display on your profile
          </StyledText>
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
                      style={{ width: '33%', height: 40, borderRadius: borderRadius.max }}
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
                    <StyledText
                      style={{
                        color: '#032F3C',
                        fontFamily: 'Rubik-Medium',
                        marginTop: getHeight(1),
                      }}
                    >
                      {item?.title}
                    </StyledText>
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
              <StyledText
                style={{
                  color: '#032F3C',
                  fontWeight: 'bold',
                  letterSpacing: 1.25,
                }}
              >
                DONE
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View>
        <View style={{ width: '100%', height: 230 }}>
          {user?.profileHeader ? (
            <FastImage
              style={{
                height: 150,
                width: '100%',
              }}
              source={{
                uri: user?.profileHeader,
              }}
              resizeMode={'cover'}
            />
          ) : (
            <View style={{ backgroundColor: Colors.neutral[800], height: 150, width: '100%' }} />
          )}
          {user?.accountType == 'individual' ? (
            <View
              style={{
                alignSelf: 'flex-end',
                backgroundColor: 'rgba(0,0,0,0.45)',
                borderRadius: borderRadius.button,
                padding: spacing.x10,
                marginRight: spacing.x24,
                position: 'absolute',
                bottom: spacing.x16 + profileImagesize, // size of the profile image + margin space
                right: 0,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                }}
              >
                {user?.badgesData?.length < 3 && (
                  <TouchableOpacity
                    style={{
                      borderColor: 'white',
                      borderWidth: borderWidth.thin,
                      borderRadius: borderRadius.max,
                      padding: spacing.x8,
                      marginRight: user?.badgesData.length > 0 ? spacing.x10 : 0,
                    }}
                    onPress={() => {
                      //getBadge();
                      dispatch(getBadges.Request({ token: token }));
                      setRequestModel(true);
                    }}
                  >
                    <Add color="white" size={20} />
                  </TouchableOpacity>
                )}

                {user?.badgesData.map((item, index) => (
                  <View key={index}>
                    {user?.badgesData?.length < 3 ? (
                      <FastImage
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: borderRadius.max,
                          marginRight: index == user?.badgesData.length - 1 ? 0 : spacing.x10,
                        }}
                        source={{
                          uri: item.badge,
                        }}
                        resizeMode={FastImage.resizeMode.stretch}
                      />
                    ) : (
                      <TouchableOpacity
                        style={{ marginHorizontal: spacing.x10 }}
                        onPress={() => {
                          dispatch(getBadges.Request({ token: token }));
                          //getBadge();
                          setRequestModel(true);
                        }}
                      >
                        <FastImage
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: borderRadius.max,
                          }}
                          source={{
                            uri: item.badge,
                          }}
                          resizeMode={FastImage.resizeMode.stretch}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View
            style={{ position: 'absolute', bottom: profileImagesize / 2, marginLeft: spacing.x24 }}
          >
            <FastImage
              style={{
                width: profileImagesize,
                height: profileImagesize,
                borderRadius: borderRadius.max,
                borderWidth: borderWidth.base,
                borderColor: 'white',
              }}
              source={{
                uri: user?.profileImage || 'https://cdn.onebodyapp.com/user/no-image.png',
              }}
              resizeMode={'cover'}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginTop: spacing.x16,
              paddingHorizontal: spacing.x24,
            }}
          >
            <Button
              onPress={() => {}}
              btnStyle={[
                button.primary,
                {
                  backgroundColor: Colors.neutral[700],
                  paddingVertical: spacing.x10,
                  paddingHorizontal: spacing.x16,
                  marginRight: spacing.x10,
                },
              ]}
              text="Edit Profile"
              btnTextStyle={{ color: Colors.neutral[200] }}
            />
            <Button
              onPress={() => {}}
              text="Share Profile"
              btnStyle={[
                button.primary,
                {
                  paddingVertical: spacing.x10,
                  paddingHorizontal: spacing.x16,
                },
              ]}
              btnTextStyle={{ color: '#FFF' }}
            />
          </View>
        </View>
      </View>

      {direction == 'down' || true ? null : (
        <Animated.View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <View>
            <View style={{ alignSelf: 'center' }}>
              <FastImage
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
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.x24,
          flexGrow: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <StyledText
            style={[
              Typography.header.h3,
              {
                marginTop: direction == 'down' ? 10 : 0,
              },
            ]}
          >
            {user?.accountType == 'organization' && user?.profile?.companyName
              ? user?.profile?.companyName
              : user?.name}
          </StyledText>
          {user?.influencerProfile?.influencerStatus == 'approved' ? (
            <Icon
              name="check-decagram"
              size={20}
              style={{ marginLeft: spacing.x8 }}
              color={Colors.primarySapphire.brand}
            />
          ) : null}
        </View>
        <StyledText
          style={[
            {
              // textAlign: 'center',
              // marginBottom: 20,
              // color: '#5b7279',
              // marginTop: 5,
              paddingBottom: spacing.x24,
            },
          ]}
        >
          <StyledText style={{ color: Colors.neutral[300] }}>
            {user?.username ? `@${user?.username}` : ''}
          </StyledText>
          {user?.whatIDo ? (
            <StyledText style={{ color: Colors.neutral[300] }}>
              {user?.username ? ` • ` : ''}
            </StyledText>
          ) : null}
          {`${user?.whatIDo ? `${user?.whatIDo.name}` : ''}`}
        </StyledText>
        {user?.influencerProfile?.influencerStatus == 'approved' ||
        user?.accountType == 'organization' ? (
          <StyledText
            numberOfLines={3}
            style={{ color: Colors.neutral[200], marginVertical: spacing.x24 }}
          >
            {user?.bio}
          </StyledText>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.x16 }}>
          <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
            <Location size={20} color={Colors.neutral.brand} />
            <StyledText style={{ color: Colors.neutral[300], marginHorizontal: spacing.x10 }}>
              {user?.profile.location.address}
            </StyledText>
          </View>
          <View
            style={{
              justifyContent: 'space-between',
              flexDirection: 'row',
              marginLeft: spacing.x10,
            }}
          >
            <Calendar size={20} color={Colors.neutral.brand} />
            <StyledText style={{ marginHorizontal: spacing.x10 }}>
              Joined{' '}
              <StyledText style={{ color: Colors.neutral[300] }}>
                {format(parseISO(user?.createdAt ?? ''), 'MMM yyyy')}
              </StyledText>
            </StyledText>
          </View>
        </View>

        {user?.influencerProfile?.influencerStatus == 'approved' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.x16 }}>
            <ShieldTick size={20} color={Colors.neutral.brand} />

            <StyledText style={{ marginHorizontal: spacing.x10 }}>Profile</StyledText>
            <StyledText style={{ color: Colors.neutral[300] }}>
              {user?.username ? ` • ` : ''}
            </StyledText>
            <StyledText style={{ marginHorizontal: spacing.x10 }}>{user?.accountType}</StyledText>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.x16 }}>
          <HomeHashtag size={20} color={Colors.neutral.brand} />

          <StyledText style={{ marginLeft: spacing.x10 }}>Denomination</StyledText>
          <StyledText style={{ color: Colors.neutral[300] }}>{` • `}</StyledText>
          <StyledText>{user?.profile.churchType}</StyledText>
          {user?.profile.churchSubType ? (
            <>
              <StyledText style={{ color: Colors.neutral[300] }}>{` • `}</StyledText>
              <StyledText style={{ marginHorizontal: spacing.x10 }}>
                {user?.profile.churchSubType}
              </StyledText>
            </>
          ) : null}
        </View>

        {user?.website ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.x16 }}>
            <Link21 size={20} color={Colors.neutral.brand} />
            <TouchableOpacity
              onPress={() =>
                OpenURLButton(
                  `${
                    user?.website.indexOf('https://') == -1
                      ? `https://${user?.website}`
                      : user?.website
                  }`
                )
              }
              style={{ justifyContent: 'center', marginLeft: spacing.x10 }}
            >
              <StyledText style={{ color: Colors.primarySapphire.brand }}>
                {user?.website}
              </StyledText>
            </TouchableOpacity>
          </View>
        ) : null}
        {direction == 'down' ? null : (
          <Animated.View>
            {user?.isInfluencer == true && user?.accountType == 'individual' ? (
              <View style={{ alignItems: 'center' }}>
                <StyledText
                  style={{
                    color: '#032f3c',
                    fontFamily: 'Rubik-Regular',
                    marginVertical: getHeight(1),
                  }}
                >
                  Reaching:{' '}
                  {user.followerCount && user.followerCount > 999
                    ? `${(user.followerCount / 1000).toFixed(2)}k`
                    : user.followerCount}
                </StyledText>
              </View>
            ) : null}
          </Animated.View>
        )}
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
      </ScrollView>
    </View>
  );
};
export default MyProfile;
