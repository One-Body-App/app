import { useDispatch, useSelector } from 'react-redux';
import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import { Add, Location, Calendar, ShieldTick, HomeHashtag, Link21 } from 'iconsax-react-native';
import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-simple-toast';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO } from 'date-fns';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ProfileProps } from './Profile';
import { getBadges, setUserBadges } from '@/src/redux/actions/AuthActions';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { GeneralStyle } from '@/src/constants/GeneralStyle';
import {
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MyProfileStackParamsList,
} from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';

import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

import { styles } from '../loginComponent/styles';
import StyledText from '../styled/Text';
import { AccountType, Badge } from '@/utils/types';
import Selected from '@/assets/svg/Selected.svg';
import Button from '../Button';
import { button } from '@/src/styles/buttons';
import { OpenURLButton } from '@/services/constants';

interface HeaderProps extends ProfileProps {
  setActiveTab: Function;
  activeTab: string;
}

type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<MyProfileStackParamsList, 'MyProfile'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'MyProfileTab'>
  >
>;

function ProfileHeader({
  profileData,
  currentUser,
  relatedUsers,
  handleSubscribe,
  handleUnSubscribe,
  setActiveTab,
  activeTab,
  ...props
}: HeaderProps) {
  const dispatch = useDispatch();
  const [requestModal, setRequestModal] = useState<boolean>(false);
  const [height, setHeight] = useState<number>(0);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const navigation = useNavigation<ScreenNavigationProp>();
  const authState = useSelector((state: RootState) => state.auth);
  const { width } = useWindowDimensions();
  // const { top, height } = useHeaderMeasurements();

  // const scrollY = useCurrentTabScrollY();
  const [selectedBadges, setSelectedBadges] = useState<Badge[]>(profileData?.badgesData ?? []);
  const unselect = (id: string) => {
    const array = selectedBadges.filter((item) => item._id != id);

    setSelectedBadges(array);
  };
  const { colors } = useTheme();

  // const profileImageAnimation = useAnimatedStyle(() => {
  //   let valueTranslate = interpolate(
  //     scrollY.value,
  //     [0, -(height - HEADER_COLLAPSED_HEIGHT)],
  //     [0, 0 - 300]
  //   );

  //   const maxValue =
  //     height - HEADER_COLLAPSED_HEIGHT - HEADER_COLLAPSED_HEIGHT + profileImagesize - 30; // 10 = marginTop
  //   if (valueTranslate > maxValue) {
  //     valueTranslate = maxValue;
  //   }

  //   return {
  //     transform: [
  //       {
  //         translateY: valueTranslate,
  //       },
  //     ],
  //   };
  // });

  // const buttonsAnimation = useAnimatedStyle(() => {
  //   let valueTranslate = interpolate(
  //     scrollY.value,
  //     [0, 0 - (height - HEADER_COLLAPSED_HEIGHT)],
  //     [0, 0 - 300]
  //   );

  //   const maxValue = height - HEADER_COLLAPSED_HEIGHT - profileImagesize - 75;
  //   if (valueTranslate > maxValue) {
  //     valueTranslate = maxValue;
  //   }

  //   return {
  //     transform: [
  //       {
  //         translateY: valueTranslate,
  //       },
  //     ],
  //   };
  // });

  // const nameAnimation = useAnimatedStyle(() => {
  //   let valueTranslateY = interpolate(
  //     scrollY.value,
  //     [0, 0 - (height - HEADER_COLLAPSED_HEIGHT)],
  //     [0, 0 - 300]
  //   );

  //   let valueTranslateX = interpolate(
  //     scrollY.value,
  //     [0, 0 - (height - HEADER_COLLAPSED_HEIGHT)],
  //     [0, 0 - 90]
  //   );

  //   let paddingRight = -1 * interpolate(scrollY.value, [0, 0 - 300], [0, 65]);

  //   const maxValueY = height - HEADER_COLLAPSED_HEIGHT - 165;
  //   if (valueTranslateY > maxValueY) {
  //     valueTranslateY = maxValueY;
  //   }

  //   const maxValueX = width / 4;
  //   if (valueTranslateX > maxValueX) {
  //     valueTranslateX = maxValueX;
  //   }
  //   if (paddingRight > 95) {
  //     paddingRight = 95;
  //   }

  //   return {
  //     paddingRight,
  //     transform: [
  //       {
  //         translateY: valueTranslateY,
  //       },
  //       {
  //         translateX: valueTranslateX,
  //       },
  //     ],
  //   };
  // });

  // const contentAnimation = useAnimatedStyle(() => {
  //   const value = interpolate(
  //     scrollY.value,
  //     [0, 0 - (height - HEADER_COLLAPSED_HEIGHT)],
  //     [0, 0 - HEADER_COLLAPSED_HEIGHT]
  //   );
  //   const opacity = interpolate(scrollY.value, [0, 130], [1, 0]);
  //   return {
  //     opacity,
  //     transform: [
  //       {
  //         translateY: -1 * value,
  //       },
  //     ],
  //   };
  // });

  // const connectedConnectorsContent = useAnimatedStyle(() => {
  //   let valueTranslateY = interpolate(
  //     scrollY.value,
  //     [0, 0 - (height - HEADER_COLLAPSED_HEIGHT)],
  //     [0, 0 - 300]
  //   );
  //   let width = interpolate(scrollY.value, [0, 0 - 300], [0, 35]);

  //   const maxValue = height - HEADER_COLLAPSED_HEIGHT - (height - 125);

  //   if (valueTranslateY > -1 * maxValue) {
  //     valueTranslateY = maxValue;
  //   }
  //   if (100 + width < 70) {
  //     width = -38;
  //   }
  //   return {
  //     width: `${100 + width}%`,
  //     transform: [
  //       {
  //         translateY: -1 * valueTranslateY,
  //       },
  //     ],
  //   };
  // });

  return (
    <View
      pointerEvents="box-none"
      onLayout={({ nativeEvent }) => {
        const { height: divHeight } = nativeEvent.layout;
        setHeight(divHeight);
      }}
    >
      <View pointerEvents="box-none">
        <View style={[{ width: '100%', height: 180 }]} pointerEvents="box-none">
          {profileData?.profileHeader ? (
            <View pointerEvents="none">
              <Image
                {...props}
                style={[
                  {
                    height: 150,
                    width: '100%',
                  },
                ]}
                source={{
                  uri: profileData?.profileHeader,
                }}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View
              style={{
                backgroundColor: Colors.neutral[600],
                height: 150,
                width: '100%',
              }}
              pointerEvents="none"
            />
          )}
          {profileData?.accountType === 'individual' &&
          ((profileData?.badgesData?.length > 0 && profileData?._id !== currentUser._id) ||
            (profileData?.badgesData?.length <= 3 && profileData?._id === currentUser._id)) ? (
            <View
              style={{
                alignSelf: 'flex-end',
                backgroundColor: 'rgba(0,0,0,0.45)',
                borderRadius: borderRadius.button,
                padding: spacing.x10,
                marginRight: spacing.x24,
                position: 'absolute',
                bottom: 40, // size of the profile image + margin space
                right: 0,
              }}
              pointerEvents="box-none"
            >
              <View
                style={{
                  flexDirection: 'row',
                }}
              >
                {profileData?.badgesData?.length < 3 && profileData?._id === currentUser._id && (
                  <TouchableOpacity
                    style={{
                      borderColor: 'white',
                      borderWidth: borderWidth.thin,
                      borderRadius: borderRadius.max,
                      padding: spacing.x8,
                      marginRight: profileData?.badgesData.length > 0 ? spacing.x10 : 0,
                    }}
                    onPress={() => {
                      // getBadge();
                      dispatch(getBadges.Request({ token }));
                      setRequestModal(true);
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
                            index == (profileData?.badgesData.length ?? 0 - 1) ? 0 : spacing.x10,
                        }}
                        source={{
                          uri: item.badge,
                        }}
                        resizeMode={FastImage.resizeMode.stretch}
                        pointerEvents="none"
                      />
                    ) : profileData?._id == currentUser._id ? (
                      <TouchableOpacity
                        style={{ marginHorizontal: spacing.x10 }}
                        onPress={() => {
                          dispatch(getBadges.Request({ token }));
                          // getBadge();
                          setRequestModal(true);
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
                        pointerEvents="none"
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View
            style={[
              {
                position: 'absolute',
                bottom: 10,
                marginLeft: spacing.x24,

                // animatedStyles
                // profileImageAnimation
              },

              // animatedStyles,
            ]}
            pointerEvents="none"
          >
            <FastImage
              style={{
                width: 80,
                height: 80,
                borderRadius: borderRadius.max,
                borderWidth: borderWidth.base,
                borderColor: 'white',
              }}
              source={{
                uri: profileData?.profileImage || 'https://cdn.onebodyapp.com/user/no-image.png',
              }}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>

      <View style={[{ paddingHorizontal: spacing.x24 }]} pointerEvents="box-none">
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={[{ flex: 1, height: 70 }]}>
            <View
              style={{
                flexDirection: 'row',
                overflow: 'hidden',
                paddingRight: spacing.x5,
                alignItems: 'center',
                flex: 1,
              }}
            >
              <StyledText
                numberOfLines={2}
                style={[
                  Typography.header.h3,
                  {
                    flex: 1,
                    marginRight: spacing.x10,
                  },
                  // {
                  //   marginTop: direction == 'down' ? 10 : 0,
                  // },
                ]}
              >
                {profileData?.accountType == 'organization' && profileData?.profile?.companyName
                  ? profileData?.profile?.companyName
                  : `${profileData?.name}`}
              </StyledText>

              {profileData?.influencerProfile?.influencerStatus == 'approved' ? (
                <Icon name="check-decagram" size={20} color={Colors.primarySapphire.brand} />
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flex: 1, overflow: 'hidden', flexDirection: 'row' }}>
                <StyledText
                  style={{
                    color: Colors.neutral[300],
                    flex: 2,
                    overflow: 'hidden',
                  }}
                  numberOfLines={1}
                >
                  {profileData?.username ? `@${profileData?.username}` : ''}
                </StyledText>
                {profileData?.profile?.whatIDo?.name || profileData?.profile?.typeOfOrganization ? (
                  <StyledText style={{ color: Colors.neutral[300], flex: 0 }}>
                    {profileData?.username ? ` • ` : ''}
                  </StyledText>
                ) : null}
                <StyledText style={{ flex: 1 }}>
                  {`${
                    profileData?.profile?.whatIDo?.name
                      ? `${profileData?.profile?.whatIDo?.name}`
                      : ''
                  }`}
                  {`${
                    profileData?.profile?.typeOfOrganization
                      ? `${profileData?.profile?.typeOfOrganization?.name}`
                      : ''
                  }`}
                </StyledText>
              </View>
            </View>
          </View>

          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
              },
            ]}
            pointerEvents="box-none"
          >
            {profileData?._id === currentUser._id ? (
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
              <Button
                onPress={() => {
                  if (currentUser?.following.includes(profileData?._id)) {
                    if (handleUnSubscribe) handleUnSubscribe(profileData?._id);
                  } else if (handleSubscribe) handleSubscribe(profileData?._id);
                }}
                text={currentUser?.following.includes(profileData?._id) ? 'Connected' : 'Connect'}
                btnStyle={[
                  button.primary,
                  {
                    paddingVertical: spacing.x10,
                    paddingHorizontal: spacing.x16,
                    backgroundColor: currentUser?.following.includes(profileData?._id)
                      ? Colors.neutral[500]
                      : Colors.primarySapphire.brand,
                  },
                ]}
                btnTextStyle={{
                  color: currentUser?.following.includes(profileData?._id)
                    ? Colors.neutral[700]
                    : '#FFF',
                }}
              />
            )}
          </View>
        </View>

        <View pointerEvents="box-none">
          {profileData?.influencerProfile?.influencerStatus === 'approved' && profileData?.bio ? (
            <View style={{ marginBottom: spacing.x16 }} pointerEvents="box-none">
              <StyledText numberOfLines={3} style={{ color: Colors.neutral[200] }}>
                {profileData?.bio}
              </StyledText>
            </View>
          ) : null}
          <View
            pointerEvents="none"
            style={[
              {
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingBottom: spacing.x16,
                justifyContent: 'center',
              },
            ]}
          >
            {profileData?.profile?.location?.address && profileData.profile.isLocationPublic ? (
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
                paddingLeft:
                  profileData?.profile?.location?.address && profileData.profile.isLocationPublic
                    ? spacing.x16
                    : 0,
                flex: 1,
              }}
            >
              <Calendar size={20} color={Colors.neutral.brand} />
              <StyledText
                style={{
                  ...Typography.fontWeight.light,
                  marginLeft: spacing.x10,
                }}
              >
                Joined{' '}
                <StyledText style={{ ...Typography.fontWeight.light }}>
                  {format(parseISO(profileData?.createdAt ?? ''), 'MMM yyyy')}
                </StyledText>
              </StyledText>
            </View>
          </View>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.x16 }}
            pointerEvents="none"
          >
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

          {profileData.accountType === AccountType.individual &&
          profileData.profile?.isChurchTypePublic ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingBottom: spacing.x16,
              }}
              pointerEvents="none"
            >
              <HomeHashtag size={20} color={Colors.neutral.brand} />

              <StyledText style={[{ marginHorizontal: spacing.x10 }, Typography.body.x2M]}>
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

          {profileData?.website ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.x16 }}
              pointerEvents="box-none"
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
        </View>

        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              // marginBottom: spacing.x10,
              // width: '65%',
              overflow: 'hidden',
              height: 58,
              // paddingTop: spacing.x5,
              // backgroundColor: 'red',
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('Connections');
            }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          >
            <StyledText
              style={[Typography.body.x3M, { flex: 1, lineHeight: 18, textAlign: 'center' }]}
            >
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
                  flex: 1,
                  lineHeight: 18,
                  textAlign: 'center',
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
          </TouchableOpacity>
        </View>
      </View>
      {profileData?.influencerProfile?.influencerStatus === 'approved' &&
      profileData?.influencerProfile?.rssUrl ? (
        <View
          style={{
            // backgroundColor: Colors.neutral[800],
            borderColor: Colors.neutral[800],
            borderTopWidth: borderWidth.thin,
            borderBottomWidth: borderWidth.thin,
            flexGrow: 1,
            flexDirection: 'row',
            paddingHorizontal: spacing.x10,
          }}
        >
          <TouchableOpacity
            style={[
              style.tab,
              { borderColor: Colors.neutral[800], borderRightWidth: borderWidth.thin },
            ]}
            onPress={() => {
              setActiveTab('social');
            }}
          >
            <StyledText style={activeTab == 'social' ? style.selectedMenuItem : style.menuItem}>
              Social
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('blog');
            }}
            style={style.tab}
          >
            <StyledText style={activeTab == 'blog' ? style.selectedMenuItem : style.menuItem}>
              Blog/News
            </StyledText>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal
        backdropOpacity={0.3}
        isVisible={requestModal}
        onBackdropPress={() => setRequestModal(false)}
        onSwipeComplete={() => setRequestModal(false)}
        swipeDirection={['down']}
        style={styles.bottomView}
        propagateSwipe
      >
        <View style={[styles.content2, { backgroundColor: colors.background }]}>
          <SafeAreaView>
            <StyledText
              style={{
                marginLeft: 20,
                marginRight: 20,
                textAlign: 'center',
                letterSpacing: 0.25,
              }}
            >
              <StyledText style={{ fontWeight: 'bold' }}>Select up to 3 badges</StyledText> you
              would like to display on your profile
            </StyledText>
            <View style={{ flex: 1 }}>
              <View style={{ marginVertical: 15 }}>
                <ScrollView>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: spacing.x10,
                    }}
                  >
                    {authState?.getBadgesData && authState?.getBadgesData?.length > 0
                      ? authState?.getBadgesData?.map((item: any) => {
                          return (
                            <TouchableOpacity
                              onPress={() => {
                                if (profileData?.badges.includes(item?._id)) {
                                  unselect(item?._id);
                                } else {
                                  const badgeIndex = selectedBadges.findIndex((badgeToCheck) => {
                                    return badgeToCheck._id == item?._id;
                                  });

                                  if (badgeIndex > -1) {
                                    const newSelectedBadges = selectedBadges.filter(
                                      (selectedBadge) => {
                                        return selectedBadge._id != selectedBadges[badgeIndex]._id;
                                      }
                                    );
                                    setSelectedBadges(newSelectedBadges);
                                  } else if (selectedBadges.length < 3) {
                                    setSelectedBadges([...selectedBadges, item]);
                                  } else {
                                    Toast.show('You cannot select more then 3 badges!', Toast.LONG);
                                  }
                                }
                              }}
                              style={{
                                flex: 1,
                                alignItems: 'stretch',
                              }}
                            >
                              <View
                                style={{
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  alignContent: 'center',
                                  flex: 1,
                                }}
                              >
                                <FastImage
                                  style={{
                                    flexGrow: 1,
                                    width: '80%',
                                    borderRadius: borderRadius.max,
                                    aspectRatio: 1,
                                    // maxWidth: '80%',
                                  }}
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
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      : null}
                  </View>
                </ScrollView>
                {/* <FlatList
                  data={authState?.getBadgesData}
                  numColumns={3}
                  showsHorizontalScrollIndicator={false}
                  // ListFooterComponent={() => <View style={{ padding: 7 }} />}
                  // ItemSeparatorComponent={() => <View style={{ margin: 7 }} />}
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
                /> */}
              </View>
            </View>

            <View>
              <TouchableOpacity
                onPress={() => {
                  dispatch(setUserBadges.Request({ token, badges: selectedBadges }));
                  setRequestModal(false);
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
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

export default ProfileHeader;

const menuItem: TextStyle = {
  fontSize: 14,
  textAlign: 'center',
  fontWeight: '500',
  textTransform: 'capitalize',
};
const style = StyleSheet.create({
  tab: {
    width: '50%',
    padding: spacing.x10,
    alignItems: 'center',
  },
  menuItem,
  selectedMenuItem: {
    ...menuItem,
    fontWeight: 'bold',
    color: Colors.primarySapphire.brand,
  },
});
