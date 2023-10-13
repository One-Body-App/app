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
import { AccountType, Badge, User } from '@/utils/types';
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
  profileData: User;
  currentUser: User;
  relatedUsers?: User[];
}

export const profileImagesize = 80;

const Profile = ({ profileData, currentUser, relatedUsers }: Props) => {
  const navigation = useNavigation<NavigationProp<MyProfileStackParamsList>>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [requestModel, setRequestModel] = useState<boolean>(false);
  const [index, setIndex] = React.useState(0);
  const [routes, setRoutes] = React.useState<Route[]>([]);

  const [selectedBadges, setSelectedBadges] = useState<Badge[]>(profileData?.badgesData ?? []);

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
            userId={profileData._id}
            {...route}
          />
        );
      case 'Blog':
        return (
          <BlogFlatlist
            setScrollPosition={updateScrollPosition}
            {...route}
            jumpTo={jumpTo}
            userId={profileData._id}
          />
        );
      case 'Twitter':
        return (
          <TwitterFlatlist
            setScrollPosition={updateScrollPosition}
            userId={profileData._id}
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
            if (profileData?.influencerProfile?.twitterId && route.key == 'Twitter') {
              return true;
            }

            if (profileData?.influencerProfile?.rssUrl && route.key == 'Blog') {
              return true;
            }

            if (profileData?.influencerProfile?.instagramId && route.key == 'Instagram') {
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
      dispatch(getProfile.Request({ token: token, accountType: profileData?.accountType }));
    } else if (authState?.setUserBadgesSuccess == false) {
      Toast.show('Unable to set badges at this time!', Toast.LONG);
    }
  }, [authState?.setUserBadgesSuccess]);

  useEffect(() => {
    if (profileData?.influencerProfile) {
      const routes = [];
      if (profileData?.influencerProfile?.twitterId) {
        routes.push({ key: 'Twitter', title: 'Twitter' });
      }

      if (profileData?.influencerProfile?.rssUrl) {
        routes.push({ key: 'Blog', title: 'Blog/News' });
      }

      if (profileData?.influencerProfile?.instagramId) {
        routes.push({ key: 'Instagram', title: 'Instagram' });
      }
      setRoutes(routes);
    }
  }, [profileData]);

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
            {profileData?.profileHeader ? (
              <FastImage
                style={{
                  height: 150,
                  width: '100%',
                }}
                source={{
                  uri: profileData?.profileHeader,
                }}
                resizeMode={'cover'}
              />
            ) : (
              <View
                style={{
                  backgroundColor: Colors.neutral[600],
                  height: 150,
                  width: '100%',
                }}
              />
            )}
            {profileData?.accountType == 'individual' &&
            ((profileData?.badgesData?.length > 0 && profileData?._id != currentUser._id) ||
              (profileData?.badgesData?.length < 3 && profileData?._id == currentUser._id)) ? (
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
                  {profileData?.badgesData?.length < 3 && profileData?._id == currentUser._id && (
                    <TouchableOpacity
                      style={{
                        borderColor: 'white',
                        borderWidth: borderWidth.thin,
                        borderRadius: borderRadius.max,
                        padding: spacing.x8,
                        marginRight: profileData?.badgesData.length > 0 ? spacing.x10 : 0,
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

                  {profileData?.badgesData.map((item, index) => (
                    <View key={index}>
                      {profileData?.badgesData?.length < 3 ? (
                        <FastImage
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: borderRadius.max,
                            marginRight:
                              index == profileData?.badgesData.length - 1 ? 0 : spacing.x10,
                          }}
                          source={{
                            uri: item.badge,
                          }}
                          resizeMode={FastImage.resizeMode.stretch}
                        />
                      ) : profileData?._id == currentUser._id ? (
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
                      ) : (
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
                  uri: profileData?.profileImage || 'https://cdn.onebodyapp.com/user/no-image.png',
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
              {profileData?._id == currentUser._id ? (
                <Button
                  onPress={() => {
                    navigation.navigate('EditProfile');
                  }}
                  text="Edit Profile"
                  btnStyle={[
                    button.primary,
                    {
                      paddingVertical: spacing.x10,
                      paddingHorizontal: spacing.x16,
                    },
                  ]}
                  btnTextStyle={{ color: '#FFF' }}
                />
              ) : (
                <>
                  {/* <Button
                    btnStyle={[
                      button.primary,
                      {
                        backgroundColor: Colors.neutral[700],
                        paddingVertical: spacing.x10,
                        paddingHorizontal: spacing.x16,
                        marginRight: spacing.x10,
                      },
                    ]}
                    btnTextStyle={{ color: Colors.neutral[200] }}
                    onPress={() => {
                      try {
                        Share.share({
                          title:
                            profileData?._id == currentUser._id
                              ? `Check my profile on One Body App`
                              : 'Check this profile on One Body App`',
                          // message: `Check my profile in One Body App`,
                          url: `https://app.onebodyapp.com/profile/${profileData?.username}`,
                        });
                      } catch (error: any) {}
                    }}
                    text="Share Profile"
                  /> */}
                  <Button
                    onPress={() => {}}
                    text={
                      currentUser?.following.includes(profileData?._id) ? 'Connect' : 'Connected'
                    }
                    btnStyle={[
                      button.primary,
                      {
                        paddingVertical: spacing.x10,
                        paddingHorizontal: spacing.x16,
                        backgroundColor: currentUser?.following.includes(profileData?._id)
                          ? Colors.primarySapphire.brand
                          : Colors.neutral[500],
                      },
                    ]}
                    btnTextStyle={{
                      color: currentUser?.following.includes(profileData?._id)
                        ? '#FFF'
                        : Colors.neutral[700],
                    }}
                  />
                </>
              )}
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
              {profileData?.accountType == 'organization' && profileData?.profile?.companyName
                ? profileData?.profile?.companyName
                : profileData?.name}
            </StyledText>
            {profileData?.influencerProfile?.influencerStatus == 'approved' ? (
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
              {profileData?.username ? `@${profileData?.username}` : ''}
            </StyledText>
            {profileData?.profile?.whatIDo || profileData?.profile?.typeOfOrganization ? (
              <StyledText style={{ color: Colors.neutral[300] }}>
                {profileData?.username ? ` • ` : ''}
              </StyledText>
            ) : null}
            {`${profileData?.profile?.whatIDo ? `${profileData?.profile?.whatIDo?.name}` : ''}`}
            {`${
              profileData?.profile?.typeOfOrganization
                ? `${profileData?.profile?.typeOfOrganization?.name}`
                : ''
            }`}
          </StyledText>
          {profileData?.influencerProfile?.influencerStatus == 'approved' && profileData?.bio ? (
            <StyledText
              numberOfLines={3}
              style={{ color: Colors.neutral[200], marginVertical: spacing.x24 }}
            >
              {profileData?.bio}
            </StyledText>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingBottom: spacing.x16,
              justifyContent: 'center',
            }}
          >
            {profileData?.profile?.location?.address ? (
              <View style={{ flexDirection: 'row', flex: 1 }}>
                <Location size={20} color={Colors.neutral.brand} />
                <StyledText
                  style={{ marginHorizontal: spacing.x10, ...Typography.fontWeight.light }}
                >
                  {profileData?.profile?.location.address}
                </StyledText>
              </View>
            ) : null}

            <View
              style={{
                flexDirection: 'row',
                paddingLeft: profileData?.profile?.location?.address ? spacing.x16 : 0,
                flex: 1,
              }}
            >
              <Calendar size={20} color={Colors.neutral.brand} />
              <StyledText style={{ marginHorizontal: spacing.x10, ...Typography.fontWeight.light }}>
                Joined{' '}
                <StyledText style={{ ...Typography.fontWeight.light }}>
                  {format(parseISO(profileData?.createdAt ?? ''), 'MMM yyyy')}
                </StyledText>
              </StyledText>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.x16 }}>
            <ShieldTick size={20} color={Colors.neutral.brand} />

            <StyledText style={[{ marginLeft: spacing.x10 }, Typography.body.x2M]}>
              Profile
            </StyledText>
            <StyledText style={{}}>{profileData?.username ? ` • ` : ''}</StyledText>
            <StyledText style={{ marginHorizontal: spacing.x10, textTransform: 'capitalize' }}>
              {profileData?.accountType}{' '}
              {profileData?.influencerProfile?.influencerStatus == 'approved' ? 'Influencer' : ''}
            </StyledText>
          </View>

          {profileData?._id == currentUser._id &&
          profileData.accountType == AccountType.individual ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'flex-start', paddingBottom: spacing.x16 }}
            >
              <HomeHashtag size={20} color={Colors.neutral.brand} />

              <StyledText style={[{ marginLeft: spacing.x10 }, Typography.body.x2M]}>
                Denomination
                <StyledText style={{ color: Colors.neutral[300] }}>{` • `}</StyledText>
                <StyledText>
                  {profileData?.profile.churchType}
                  {profileData?.profile.churchSubType ? (
                    <>
                      {` - `}

                      {profileData?.profile.churchSubType}
                    </>
                  ) : null}
                </StyledText>
              </StyledText>
            </View>
          ) : null}

          {/* {profileData?._id == currentUser._id &&
          profileData.accountType == AccountType.individual ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'flex-start', paddingBottom: spacing.x16 }}
            >
              <HomeHashtag size={20} color={Colors.neutral.brand} />

              <StyledText style={[{ marginLeft: spacing.x10 }, Typography.body.x2M]}>
                Denomination
                <StyledText style={{ color: Colors.neutral[300] }}>{` • `}</StyledText>
                <StyledText>
                  {profileData?.profile.churchType}
                  {profileData?.profile.churchSubType ? (
                    <>
                      {` - `}

                      {profileData?.profile.churchSubType}
                    </>
                  ) : null}
                </StyledText>
              </StyledText>
            </View>
          ) : null} */}

          {profileData?.website ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.x16 }}
            >
              <Link21 size={20} color={Colors.neutral.brand} />
              <TouchableOpacity
                onPress={() =>
                  OpenURLButton(
                    `${
                      profileData?.website.indexOf('https://') == -1
                        ? `https://${profileData?.website}`
                        : profileData?.website
                    }`
                  )
                }
                style={{ justifyContent: 'center', marginLeft: spacing.x10 }}
              >
                <StyledText style={{ color: Colors.primarySapphire.brand }}>
                  {profileData?.website}
                </StyledText>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StyledText style={[Typography.body.x3M]}>
              {profileData?.followerCount && profileData?.followerCount > 999
                ? `${(profileData.followerCount / 1000).toFixed(2)}k`
                : profileData?.followerCount && profileData?.followerCount > 999999
                ? `${(profileData.followerCount / 1000000).toFixed(2)}m`
                : profileData?.followerCount ?? 0}{' '}
              <StyledText style={{ color: Colors.neutral[300] }}>Connectors</StyledText>
            </StyledText>

            <StyledText
              style={[
                Typography.body.x3M,
                {
                  marginLeft: spacing.x24,
                },
              ]}
            >
              {profileData?.following.length > 999
                ? `${(profileData.following.length / 1000).toFixed(2)}k`
                : profileData?.following.length > 999999
                ? `${(profileData.following.length / 1000000).toFixed(2)}m`
                : profileData?.following.length ?? 0}{' '}
              <StyledText style={{ color: Colors.neutral[300] }}>Connected</StyledText>
            </StyledText>
          </View>
        </View>
      </View>
      <View style={{ flex: 3, paddingHorizontal: spacing.x24 }}>
        {profileData?.influencerProfile?.influencerStatus == 'approved' && routes.length > 0 ? (
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            renderTabBar={renderTabBar}
            onIndexChange={setIndex}
            // initialLayout={{ width: getWidth(100) }}
          />
        ) : profileData?._id != currentUser._id && relatedUsers ? (
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
                      if (profileData?.badges.includes(item?._id)) {
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
