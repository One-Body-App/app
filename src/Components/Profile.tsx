import { format, parseISO } from 'date-fns';
import { Add, Location, Calendar, ShieldTick, HomeHashtag, Link21 } from 'iconsax-react-native';
import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Share, Animated, FlatList } from 'react-native';
import FastImage from 'react-native-fast-image';

import { getBadges, getProfile, setUserBadges } from '../Redux/actions/AuthActions';
import { OpenURLButton } from '../Services/constants';
import { GeneralStyle } from '../constants/GeneralStyle';
import { Colors, Typography } from '../styles';
import { button } from '../styles/buttons';
import { borderRadius, borderWidth } from '../styles/outlines';
import { spacing } from '../styles/spacing';
import { styles } from './loginComponent/styles';
import { StyledText } from './styled/Text';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../Redux/reducers/rootReducer';
import { NavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import { Badge, User } from '@/utils/types';
import Button from './Button';
import Modal from 'react-native-modal';
import Selected from '@/assets/svg/Selected.svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MyProfileStackParamsList } from '../navigator/types';
import SubscribeFlatlist from './SubscribeFlatlist';
import { NavigationState, SceneRendererProps, TabView } from 'react-native-tab-view';
import InstagramFlatlist from './InstagramFlatlist';
import BlogFlatlist from './BlogFlatlist';
import TwitterFlatlist from './TwitterFlatlist';

type Route = {
  key: string;
  title: string;
};

interface Props {
  user: User;
  currentUserId: string;
  relatedUsers?: User[];
}

export const profileImagesize = 80;

const Profile = ({ user, currentUserId, relatedUsers }: Props) => {
  const navigation = useNavigation<NavigationProp<MyProfileStackParamsList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [requestModel, setRequestModel] = useState<boolean>(false);
  const [index, setIndex] = React.useState(0);
  const [routes, setRoutes] = React.useState<Route[]>([]);

  const [selectedBadges, setSelectedBadges] = useState<Badge[]>(user?.badgesData ?? []);

  const updateScrollPosition = (position: number) => {
    // if (
    //   (position > scrollPosition || position == scrollPosition) &&
    //   scrollPosition - position < 0 &&
    //   scrollPosition - position < -45
    // ) {
    //   setDirection('down');
    // } else if (
    //   position < scrollPosition &&
    //   scrollPosition - position > 0 &&
    //   scrollPosition - position > 55
    // ) {
    //   setDirection('up');
    // }
    // setScrollPosition(position);
  };

  const unselect = (id: string) => {
    const array = selectedBadges.filter((item) => item._id != id);

    setSelectedBadges(array);
  };

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
            userId={user._id}
            {...route}
          />
        );
      case 'Blog':
        return (
          <BlogFlatlist
            setScrollPosition={updateScrollPosition}
            {...route}
            jumpTo={jumpTo}
            userId={user._id}
          />
        );
      case 'Twitter':
        return (
          <TwitterFlatlist
            setScrollPosition={updateScrollPosition}
            userId={user._id}
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
      <View style={{ flexDirection: 'row' }}>
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
                style={{
                  flex: 1,
                  alignItems: 'center',
                  padding: spacing.x16,
                }}
                onPress={() => setIndex(i)}
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
                {props?.navigationState?.index == i ? <View style={{}} /> : null}
              </TouchableOpacity>
            );
          })}
      </View>
    );
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

  return (
    <View style={{ flex: 1 }}>
      {/* <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
        }}
      > */}
      <View>
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
              <View
                style={{
                  backgroundColor: Colors.primarySapphire.brand,
                  height: 150,
                  width: '100%',
                }}
              />
            )}
            {user?.accountType == 'individual' &&
            ((user?.badgesData?.length > 0 && user?._id != currentUserId) ||
              (user?.badgesData?.length < 3 && user?._id == currentUserId)) ? (
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
                  {user?.badgesData?.length < 3 && user?._id == currentUserId && (
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
              style={{
                position: 'absolute',
                bottom: profileImagesize / 2,
                marginLeft: spacing.x24,
              }}
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
              {user?._id == currentUserId ? (
                <Button
                  onPress={() => {
                    navigation.navigate('EditProfile');
                  }}
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
              ) : null}
              <Button
                onPress={() => {
                  try {
                    Share.share({
                      title:
                        user?._id == currentUserId
                          ? `Check my profile on One Body App`
                          : 'Check this profile on One Body App`',
                      // message: `Check my profile in One Body App`,
                      url: `https://app.onebodyapp.com/profile/${user?.username}`,
                    });
                  } catch (error: any) {}
                }}
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

        <View style={{ paddingHorizontal: spacing.x24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StyledText
              style={[
                Typography.header.h3,
                // {
                //   marginTop: direction == 'down' ? 10 : 0,
                // },
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
            {user?.profile.whatIDo || user.profile.typeOfOrganization ? (
              <StyledText style={{ color: Colors.neutral[300] }}>
                {user?.username ? ` • ` : ''}
              </StyledText>
            ) : null}
            {`${user?.profile?.whatIDo ? `${user?.profile?.whatIDo.name}` : ''}`}
            {`${
              user?.profile?.typeOfOrganization ? `${user?.profile?.typeOfOrganization?.name}` : ''
            }`}
          </StyledText>
          {(user?.influencerProfile?.influencerStatus == 'approved' ||
            user?.accountType == 'organization') &&
          user?.bio ? (
            <StyledText
              numberOfLines={3}
              style={{ color: Colors.neutral[200], marginVertical: spacing.x24 }}
            >
              {user?.bio}
            </StyledText>
          ) : null}

          {user?._id == currentUserId ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingBottom: spacing.x16,
                justifyContent: 'center',
              }}
            >
              {user?.profile.location?.address ? (
                <View style={{ flexDirection: 'row', flex: 1 }}>
                  <Location size={20} color={Colors.neutral.brand} />
                  <StyledText
                    style={{ marginHorizontal: spacing.x10, ...Typography.fontWeight.light }}
                  >
                    {user?.profile.location.address}
                  </StyledText>
                </View>
              ) : null}

              <View
                style={{
                  flexDirection: 'row',
                  paddingLeft: user?.profile.location?.address ? spacing.x16 : 0,
                  flex: 1,
                }}
              >
                <Calendar size={20} color={Colors.neutral.brand} />
                <StyledText
                  style={{ marginHorizontal: spacing.x10, ...Typography.fontWeight.light }}
                >
                  Joined{' '}
                  <StyledText style={{ ...Typography.fontWeight.light }}>
                    {format(parseISO(user?.createdAt ?? ''), 'MMM yyyy')}
                  </StyledText>
                </StyledText>
              </View>
            </View>
          ) : null}

          {user?.influencerProfile?.influencerStatus == 'approved' && user?._id == currentUserId ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.x16 }}
            >
              <ShieldTick size={20} color={Colors.neutral.brand} />

              <StyledText style={[{ marginLeft: spacing.x10 }, Typography.body.x2M]}>
                Profile
              </StyledText>
              <StyledText style={{}}>{user?.username ? ` • ` : ''}</StyledText>
              <StyledText style={{ marginHorizontal: spacing.x10 }}>{user?.accountType}</StyledText>
            </View>
          ) : null}

          {user?._id == currentUserId ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'flex-start', paddingBottom: spacing.x16 }}
            >
              <HomeHashtag size={20} color={Colors.neutral.brand} />

              <StyledText style={[{ marginLeft: spacing.x10 }, Typography.body.x2M]}>
                Denomination
                <StyledText style={{ color: Colors.neutral[300] }}>{` • `}</StyledText>
                <StyledText>
                  {user?.profile.churchType}
                  {user?.profile.churchSubType ? (
                    <>
                      {` - `}

                      {user?.profile.churchSubType}
                    </>
                  ) : null}
                </StyledText>
              </StyledText>
            </View>
          ) : null}

          {user?.website ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.x16 }}
            >
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

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {user?.influencerProfile?.influencerStatus == 'approved' ? (
              <StyledText style={[Typography.body.x3M]}>
                {user?.followerCount && user?.followerCount > 999
                  ? `${(user.followerCount / 1000).toFixed(2)}k`
                  : user?.followerCount && user?.followerCount > 999999
                  ? `${(user.followerCount / 1000000).toFixed(2)}m`
                  : user?.followerCount}{' '}
                <StyledText style={{ color: Colors.neutral[300] }}>Connectors</StyledText>
              </StyledText>
            ) : null}
            {user?.following ? (
              <StyledText
                style={[
                  Typography.body.x3M,
                  {
                    marginLeft:
                      user?.influencerProfile?.influencerStatus == 'approved' ? spacing.x24 : 0,
                  },
                ]}
              >
                {user?.following.length > 999
                  ? `${(user.following.length / 1000).toFixed(2)}k`
                  : user?.following.length > 999999
                  ? `${(user.following.length / 1000000).toFixed(2)}m`
                  : user?.following.length}{' '}
                <StyledText style={{ color: Colors.neutral[300] }}>Connected</StyledText>
              </StyledText>
            ) : null}
          </View>
        </View>
      </View>
      <View style={{ flex: 3, paddingHorizontal: spacing.x24 }}>
        {user?.influencerProfile?.influencerStatus == 'approved' && routes.length > 0 ? (
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            renderTabBar={renderTabBar}
            onIndexChange={setIndex}
            // initialLayout={{ width: getWidth(100) }}
          />
        ) : user?._id != currentUserId && relatedUsers ? (
          <SubscribeFlatlist
            numColumns={3}
            setScrollPosition={updateScrollPosition}
            hideFollowButton={true}
            itemStyle={{ width: '33%' }}
            users={relatedUsers}
          />
        ) : null}
      </View>
      {/* </ScrollView> */}

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
          <View style={{ flex: 1 }}>
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
                    style={{ width: 30, alignItems: 'center', height: 70 }}
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
                        color: Colors.primary.brand,

                        marginTop: spacing.x10,
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
    </View>
  );
};

export default Profile;
