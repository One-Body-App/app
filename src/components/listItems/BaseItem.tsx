import React, { ReactNode, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Share,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from '@react-native-vector-icons/material-design-icons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { Heart, Location } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { Reaction } from 'react-native-reactions';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import styles from './style';
import { NO_PROFILE_IMAGE, OpenURLButton } from '@/services/constants';
import Twitter from '@/assets/svg/Twitter.svg';
import Instagram from '@/assets/svg/Instagram.svg';
import PrayersIcon from '@/assets/svg/prayers.svg';
import PrayersOutlineIcon from '@/assets/svg/prayers-outline.svg';
import NounHands from '@/assets/svg/NounHands.svg';
import SendIcon from '@/assets/icons/send.svg';
import CornerUpRightIcon from '@/assets/icons/corner-up-right.svg';

import { borderRadius, borderWidth } from '@/src/styles/outlines';
import StyledText from '../styled/Text';
import { fontSize } from '@/src/styles/typography';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';

import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { getuserGet } from '@/src/redux/actions/UserAction';
import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  CommentPost,
  PostType,
  PrayerWallCategory,
  PostUserData,
  SocialPostReaction,
  SocialPostReactionType,
} from '@/utils/types';
import OptionsModal from './OptionsModal';

interface BaseItemProps {
  children: ReactNode;
  transparency?: boolean;
  style?: StyleProp<ViewStyle>;
  webClassName?: string;
  onPress: Function;
  created?: Date;
  updated?: Date;
  edited?: boolean;
  source?: string;
  fromSavedPosts?: boolean;
  postData: {
    id?: string;
    type?: PostType;
    postlink?: string;
    title?: string;
    image?: {
      url: string;
    };
    externalLink?: string;
    reactions?: SocialPostReaction[];
    myReaction?: SocialPostReaction;
    location?: {
      type?: string;
      coordinates?: number[];
    };
    locationName?: string;
    prayerCategory?: PrayerWallCategory;
    answered?: boolean;
    edited?: boolean;
    isPrivate?: boolean;
    comments?: CommentPost[];
    commentNumber?: number;
  };
  onCommentsPress?: Function;
  actionBarRightAccessory?: ReactNode;
  userData: PostUserData;

  isApprovedInfluencer?: boolean;

  onShowDismissCard?: (e?: boolean) => void;
  index?: number;
  parentRefreshContent?: Function;
  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  reelLayout?: boolean;
}

function BaseItem({
  transparency,
  style,
  webClassName,
  onPress,
  children,
  created,
  updated,
  edited,
  source,
  userData,
  isApprovedInfluencer,
  postData,
  parentRefreshContent,
  onShowDismissCard,
  index,
  removePost,
  editPost,
  fromSavedPosts,
  reelLayout = false,
  onCommentsPress,
  actionBarRightAccessory,
}: BaseItemProps) {
  const { colors, dark } = useTheme();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const cardBackground = dark ? Colors.neutral[900] : Colors.main.white;
  const brandColors = {
    primaryBase: '#41899f',
    primaryDark: '#126b87',
    accentBase: '#41dbe1',
    accentDark: '#12d2d9',
    scale100: '#e6eaec',
    black: '#032f3c',
  };
  const shareIconColor = dark ? Colors.neutral[400] : '#126b87';
  const repostIconColor = '#12d2d9';
  const ONEBODY_APP_BASE_URL = 'https://app.onebodyapp.com';
  const cardBorderColor = dark ? 'rgba(255,255,255,0.08)' : brandColors.scale100;
  const primaryTextColor = dark ? Colors.neutral.brand : brandColors.black;
  const secondaryTextColor = dark ? Colors.neutral[400] : brandColors.primaryDark;
  const isSocialPost = postData.type === PostType.social;
  const isPrayerPost = postData.type === PostType.prayer;
  const locationPillBackground = dark ? Colors.neutral[800] : Colors.neutral[900];
  const locationPillBorder = dark ? 'rgba(255,255,255,0.08)' : Colors.neutral[600];
  const [myReaction, setMyReaction] = useState<SocialPostReaction | undefined>(postData.myReaction);
  // const [reactions, setReactions] = useState<SocialPostReaction[]>(postData.reactions ?? []);

  const formatLocationLabel = (locationName?: string) => {
    if (!locationName) return '';
    const parts = locationName
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return '';
    const last = parts[parts.length - 1].toLowerCase();
    const isUs = ['united states', 'us', 'usa', 'u.s.', 'u.s.a.'].includes(last);
    if (isUs) {
      return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    }
    return parts[parts.length - 1];
  };

  const isLocationPublic = Boolean(
    userData?.profile?.isLocationPublic ??
      userData?.isLocationPublic ??
      (postData as { isLocationPublic?: boolean })?.isLocationPublic
  );
  const shouldShowLocation = Boolean(postData.locationName && isLocationPublic);
  const locationLabel =
    isSocialPost && shouldShowLocation ? formatLocationLabel(postData.locationName) : '';

  const [showOptions, setShowOptions] = useState(false);
  const [defaultReactionColor, activeReactionColor] = [
    transparency ? Colors.neutral[600] : 'white',
    Colors.errorFeedback[200],
  ];
  const reactionIconColor = myReaction ? activeReactionColor : defaultReactionColor;
  const reactionOutlineColor = brandColors.primaryDark;
  const mainReactionScale = useRef(new Animated.Value(1)).current;
  const reactionScales = useRef({
    [SocialPostReactionType.love]: new Animated.Value(1),
    [SocialPostReactionType.praying]: new Animated.Value(1),
    [SocialPostReactionType.happy]: new Animated.Value(1),
  }).current;

  const getShareLink = () => {
    const rawPostLink = postData.postlink?.trim();
    if (rawPostLink && rawPostLink.includes('onebodyapp.com')) {
      return rawPostLink;
    }

    if (postData.type && postData.id) {
      return `${ONEBODY_APP_BASE_URL}/post/${postData.type}/${postData.id}`;
    }

    return postData.postlink ?? postData.externalLink ?? '';
  };

  const sharePost = async () => {
    const linkToShare = getShareLink();
    if (!linkToShare) return;

    await Share.share({
      title: `${postData?.title ?? ''}`,
      url: Platform.OS === 'ios' ? linkToShare : '',
      message: Platform.OS === 'android' ? linkToShare : linkToShare,
    });
  };

  const animateReaction = (scaleValue: Animated.Value) => {
    scaleValue.setValue(1);
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.18,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerReactionFeedback = (type?: SocialPostReactionType) => {
    if (!type) return;
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    animateReaction(mainReactionScale);
    const scaleValue = reactionScales[type];
    if (scaleValue) {
      animateReaction(scaleValue);
    }
  };

  const getUserHandle = () => {
    if (source === 'twitter' && userData?.twitterHandler) {
      return userData.twitterHandler;
    }
    if (source === 'instagram' && userData?.instagramHandler) {
      return userData.instagramHandler;
    }
    if (userData?.username) {
      return userData.username;
    }
    return undefined;
  };

  const userHandle = getUserHandle();
  const formattedHandle = userHandle ? `@${userHandle}` : '';
  const hasHandle = Boolean(formattedHandle);
  const prayerDisplayEmoji = (() => {
    if (!isPrayerPost) {
      return '';
    }

    if (postData.answered || postData.prayerCategory === PrayerWallCategory.AnsweredPrayer) {
      return '🙌';
    }

    if (postData.prayerCategory === PrayerWallCategory.Exhortation) {
      return '🗣️';
    }

    if (postData.prayerCategory === PrayerWallCategory.Testimony) {
      return '🙌';
    }

    return '🙏';
  })();
  const webClassNameValue = Platform.OS === 'web' ? webClassName : undefined;
  const useWebCardClassStyles = Boolean(webClassNameValue);
  const WebView = View as any;

  const reactPost = async (type?: SocialPostReactionType) => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: `${postData.type}/react`,
        verb: 'patch',
        token,
        params: {
          postId: postData.id,
          type,
        },
      });

      if (res?.status === 200) {
        // dispatch(getuserGet({ token }));
        // setMyReaction()
        if (res.response?.reactions?.length > 0) {
          let foundReaction: SocialPostReaction | undefined;
          res.response?.reactions.forEach((reaction: SocialPostReaction) => {
            if (reaction.userId === user?._id) {
              foundReaction = reaction;
            }
          });

          // if (foundReaction) setReactions([...reactions, foundReaction]);
          // setShowActions(false);
          if (foundReaction) setMyReaction(foundReaction);
        } else {
          setMyReaction(undefined);
        }

        if (parentRefreshContent) parentRefreshContent();
      }

      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const removeReactPost = async (showLoading = true) => {
    if (showLoading) dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: `${PostType.social}/remove-reaction`,
        verb: 'patch',
        token,
        params: {
          postId: postData.id,
        },
      });

      if (res?.status === 200) {
        // dispatch(getuserGet({ token }));

        if (res.response?.reactions?.length > 0) {
          let foundReaction: SocialPostReaction | undefined;
          res.response?.reactions.forEach((reaction: any) => {
            if (reaction.userId === user?._id) {
              foundReaction = reaction;
            }
          });

          setMyReaction(foundReaction);
        } else {
          setMyReaction(undefined);
        }
        if (parentRefreshContent) parentRefreshContent();
      }
      if (showLoading) dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const savePost = async (
    postId?: string,
    type?: string,
    title?: string,
    createdAt?: Date,
    userId?: string,
    link?: string,
    image?: string
  ) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: `user/save-post`,
        verb: 'post',
        token,
        params: {
          postId,

          type,
          title,
          image,
          createdAt,
          userId,
          link,
        },
      });

      if (res?.status === 200) {
        dispatch(getuserGet({ token, pullSavedData: fromSavedPosts }));
      }
      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const removeSavedPost = async (type?: string, link?: string, id?: string) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: `user/remove-saved-post`,
        verb: 'delete',
        token,
        params: {
          id,
          link,
          type,
        },
      });

      if (res?.status === 200) {
        dispatch(getuserGet({ token, pullSavedData: fromSavedPosts }));
      }
      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  let isThisPostSaved = false;

  if (postData.type === PostType.prayer && user?.savedPrayers && user?.savedPrayers.length > 0) {
    user?.savedPrayers.forEach((savedPrayer) => {
      if (savedPrayer === postData?.id) {
        isThisPostSaved = true;
      }
    });
  } else if (postData.type !== PostType.prayer && user?.savedPost && user?.savedPost.length > 0) {
    user?.savedPost.forEach((savedPost) => {
      if (
        (savedPost.link !== undefined && savedPost.link === postData.postlink) ||
        (savedPost.postId !== undefined && savedPost.postId === postData?.id)
      ) {
        isThisPostSaved = true;
      }
    });
  }

  const reactionTypes = {
    love: 0,
    praying: 0,
    happy: 0,
  };

  if (postData.reactions) {
    postData.reactions.forEach((reaction) => {
      reactionTypes[reaction.type] += 1;
    });
  }
  const totalReactionCount = reactionTypes.love + reactionTypes.praying + reactionTypes.happy;

  const ReactionItems = [
    {
      id: 0,
      emoji: (
        <Animated.View
          style={{
            transform: [{ scale: reactionScales[SocialPostReactionType.love] }],
          }}
        >
          <View
            style={{
              padding: 4,
              backgroundColor: 'transparent',
              borderRadius: borderRadius.max,
            }}
          >
            <Heart size={25} color={reactionOutlineColor} />
          </View>
        </Animated.View>
      ),
      title: 'Love',
      type: SocialPostReactionType.love,
    },
    {
      id: 1,
      emoji: (
        <Animated.View
          style={{
            transform: [{ scale: reactionScales[SocialPostReactionType.praying] }],
          }}
        >
          <View
            style={{
              padding: 4,
              backgroundColor: 'transparent',
              borderRadius: borderRadius.max,
            }}
          >
            <PrayersOutlineIcon width={25} height={25} color={reactionOutlineColor} />
          </View>
        </Animated.View>
      ),
      title: 'Praying',
      type: SocialPostReactionType.praying,
    },
    {
      id: 2,
      emoji: (
        <Animated.View
          style={{
            transform: [{ scale: reactionScales[SocialPostReactionType.happy] }],
          }}
        >
          <View
            style={{
              padding: 4,
              backgroundColor: 'transparent',
              borderRadius: borderRadius.max,
            }}
          >
            <NounHands width={25} height={25} color={reactionOutlineColor} />
          </View>
        </Animated.View>
      ),
      title: 'Praise',
      type: SocialPostReactionType.happy,
    },
  ];

  if (reelLayout)
    return (
      <WebView
        className={webClassNameValue}
        style={[
          styles.postView,
          {
            backgroundColor: useWebCardClassStyles ? undefined : cardBackground,
            borderBottomColor: useWebCardClassStyles ? undefined : cardBackground,
          },
          style,
        ]}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            // alignItems: 'flex-start',
            gap: spacing.x10,
            // marginRight: spacing.x10,
            position: 'relative',
          }}
        >
          <View
            style={{
              // position: 'absolute',
              // top: -165,
              left: 0,
              zIndex: 2,
              flexDirection: 'column',
            }}
          >
            <TouchableOpacity
              onPress={() => {
                onPress();
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: spacing.x5,
                flex: 1,
                marginBottom: spacing.x20,
              }}
            >
              {userData.profileIcon && !userData.profileImage ? (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.max,
                    borderColor: userData.profileImage !== NO_PROFILE_IMAGE ? '#032F3C' : '#09aadb',
                    borderWidth: borderWidth.thin,
                    padding: spacing.x5,
                    marginBottom: spacing.x5,
                    marginLeft: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {userData.profileIcon}
                </View>
              ) : (
                <FastImage
                  source={{
                    uri: userData.profileImage !== '' ? userData.profileImage : NO_PROFILE_IMAGE,
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.max,
                    marginBottom: spacing.x5,
                    borderColor: userData.profileImage !== NO_PROFILE_IMAGE ? '#032F3C' : '#09aadb',
                    borderWidth: borderWidth.thin,
                    marginLeft: 0,
                  }}
                  resizeMode="contain"
                />
              )}
              <View style={{ flexGrow: 1, flex: 1 }}>
                {userData ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                      onPress={() => {
                        // navigation.navigate('UserProfile', {
                        //   id: userData?._id,
                        // });
                        onPress();
                      }}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        flexGrow: 1,
                        flex: 1,
                      }}
                    >
                      <View style={{ flexDirection: 'column' }}>
                        <View style={{ flexDirection: 'row' }}>
                          <StyledText
                            style={{
                              color: 'white',
                              alignItems: 'center',
                              ...fontSize.x1,
                              marginLeft: spacing.x5,
                              paddingLeft: spacing.x5,
                              paddingBottom: 0,
                              fontWeight: 'bold',
                              lineHeight: 8,
                            }}
                            numberOfLines={2}
                          >
                            r{userData?.name}
                          </StyledText>
                          {isApprovedInfluencer ? (
                            <Icon
                              name="check-decagram"
                              size={spacing.x13}
                              style={{ marginLeft: spacing.x8, marginTop: spacing.x5 }}
                              color="white"
                            />
                          ) : null}
                        </View>
                        <StyledText
                          numberOfLines={2}
                          style={{
                            color: 'white',
                            alignItems: 'center',
                            ...fontSize.x3,
                            marginLeft: spacing.x5,
                            marginTop: 0,
                          }}
                        >
                          {formattedHandle}

                          {created ? (
                            <>
                              {hasHandle ? ` • ` : ''}
                              <StyledText
                                style={[
                                  fontSize.x1,
                                  {
                                    color: 'white',
                                    alignItems: 'center',
                                  },
                                ]}
                              >
                                {timeSince(created)} ago
                              </StyledText>
                            </>
                          ) : null}
                          {edited && updated ? (
                            <>
                              {' '}
                              • {' Edited '}
                              <StyledText
                                style={[
                                  fontSize.x1,
                                  {
                                    color: 'white',
                                    alignItems: 'center',
                                  },
                                ]}
                              >
                                {timeSince(updated)} ago
                              </StyledText>
                            </>
                          ) : null}
                        </StyledText>

                        {shouldShowLocation && !isSocialPost ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Location size={15} color="white" style={{ marginRight: spacing.x5 }} />
                            <StyledText
                              style={[
                                fontSize.x1,
                                {
                                  color: 'white',
                                  marginTop: 0,
                                },
                              ]}
                            >
                              {postData.locationName}
                            </StyledText>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowOptions(true);
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faEllipsisVertical}
                        color="white"
                        style={{ marginTop: spacing.x10, marginRight: -1 * spacing.x5 }}
                      />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: spacing.x16,
                marginLeft: spacing.x8,
                marginTop: spacing.x5,
                alignContent: 'space-between',
              }}
            >
              <Reaction
                items={ReactionItems}
                type="modal"
                cardStyle={{
                  // padding: spacing.x10,
                  shadowOpacity: 0.2,
                  marginTop: spacing.x16,
                  width: 140,
                  height: 50,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: borderRadius.base,
                }}
                onTap={async (item) => {
                  if (item) {
                    if (myReaction?.type === item.type) {
                      await removeReactPost();
                    } else {
                      triggerReactionFeedback(item.type);
                      await reactPost(item.type);
                    }
                  }
                }}
                itemIndex={index}
                onShowDismissCard={onShowDismissCard}
                onPress={() => {
                  if (myReaction) {
                    removeReactPost();
                  } else {
                    triggerReactionFeedback(SocialPostReactionType.love);
                    reactPost(SocialPostReactionType.love);
                  }
                }}
              >
                <Animated.View style={{ transform: [{ scale: mainReactionScale }] }}>
                  <MaterialIcons
                    name={myReaction ? 'favorite' : 'favorite-border'}
                    size={22}
                    color={reactionIconColor}
                  />
                </Animated.View>
              </Reaction>

              <TouchableOpacity
                disabled={!onCommentsPress}
                onPress={() => {
                  if (onCommentsPress) {
                    onCommentsPress();
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons
                  name="chat-bubble-outline"
                  size={22}
                  color={transparency ? Colors.neutral[600] : 'white'}
                />
                <StyledText
                  style={{
                    marginLeft: spacing.x10,
                    // marginVertical: spacing.x5,
                    color: transparency ? Colors.neutral[600] : 'white',
                  }}
                >
                  {postData?.commentNumber ?? postData.comments?.length ?? '0'}
                </StyledText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (isThisPostSaved) {
                    if (postData.id) removeSavedPost(postData.type, undefined, postData.id);
                    else if (postData.postlink) removeSavedPost(postData.type, postData.postlink);
                  } else {
                    savePost(
                      postData?.id,
                      postData?.type,
                      postData.title,
                      created,
                      userData?._id,
                      postData?.postlink,
                      postData?.image?.url
                    );
                  }
                }}
              >
                <MaterialIcons
                  name={isThisPostSaved ? 'bookmark' : 'bookmark-border'}
                  size={22}
                  color={transparency ? Colors.neutral[600] : 'white'}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexGrow: 1, flex: 1 }}>
            {children && <View style={{ marginTop: spacing.x5 }}>{children}</View>}

            <View style={{ flexDirection: 'row' }}>
              {postData?.reactions && postData.reactions.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: spacing.x10,
                    alignItems: 'center',
                  }}
                >
                  {reactionTypes.love > 0 ? (
                    <>
                      <View
                        style={{
                          padding: spacing.x5,
                          backgroundColor: Colors.errorFeedback[200],
                          borderRadius: borderRadius.max,
                          borderWidth: borderWidth.thin,
                          borderColor: Colors.main.white,
                          marginRight: spacing.x5 / 2,
                        }}
                      >
                        <Heart size={15} color="white" />
                      </View>
                      <StyledText
                        style={[
                          fontSize.x2,
                          {
                            color: transparency ? Colors.neutral[600] : Colors.neutral[300],
                            marginRight: spacing.x5,
                          },
                        ]}
                      >
                        {reactionTypes.love}
                      </StyledText>
                    </>
                  ) : null}

                  {reactionTypes.happy > 0 ? (
                    <>
                      <View
                        style={{
                          padding: spacing.x5,
                          backgroundColor: Colors.infoFeedback[200],
                          borderRadius: borderRadius.max,
                          borderWidth: borderWidth.thin,
                          borderColor: Colors.main.white,
                          marginRight: spacing.x5 / 2,
                        }}
                      >
                        <NounHands width={15} height={15} color="white" />
                      </View>
                      <StyledText
                        style={[
                          fontSize.x2,
                          {
                            color: transparency ? Colors.neutral[600] : Colors.neutral[300],
                            marginRight: spacing.x5,
                          },
                        ]}
                      >
                        {reactionTypes.happy}
                      </StyledText>
                    </>
                  ) : null}

                  {reactionTypes.praying > 0 ? (
                    <>
                      <View
                        style={{
                          padding: spacing.x5,
                          backgroundColor: Colors.successFeedback[200],
                          borderRadius: borderRadius.max,
                          borderWidth: borderWidth.thin,
                          borderColor: Colors.main.white,
                          marginRight: spacing.x5 / 2,
                        }}
                      >
                        <PrayersOutlineIcon width={15} height={15} color="white" />
                      </View>
                      <StyledText
                        style={[
                          fontSize.x2,
                          {
                            color: transparency ? Colors.neutral[600] : Colors.neutral[300],
                            marginRight: spacing.x5,
                          },
                        ]}
                      >
                        {reactionTypes.praying}
                      </StyledText>
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: spacing.x10,
              }}
            >
              <View style={{ justifyContent: 'center' }}>
                {postData.externalLink ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (postData.externalLink) OpenURLButton(postData.externalLink);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', marginRight: spacing.x5 }}
                  >
                    <View style={{ borderRadius: borderRadius.max, padding: spacing.x5 }}>
                      {source === 'instagram' ? (
                        <Instagram height={getHeight(2.5)} fill="#00acee" />
                      ) : null}

                      {source === 'twitter' ? (
                        <Twitter height={getHeight(2.5)} fill="#00acee" />
                      ) : null}
                    </View>

                    <StyledText style={{ color: Colors.primarySapphire.brand }}>
                      View Post
                    </StyledText>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={{ alignItems: 'center' }}>
                {postData.type === PostType.rss ? (
                  <View
                    style={
                      {
                        // alignItems: 'flex-end',
                        // marginTop: spacing.x5,
                        // marginEnd: spacing.x10,
                        // marginLeft: 270,
                        // marginVertical: spacing.x5,
                      }
                    }
                  >
                    <TouchableOpacity
                      onPress={() => {
                        Share.share({
                          title: `${postData?.title}`,
                          url: Platform.OS === 'ios' && postData.postlink ? postData?.postlink : '',
                          message:
                            Platform.OS === 'android' && postData?.postlink
                              ? postData?.postlink
                              : '',
                        });
                      }}
                    >
                      <SendIcon width={22} height={22} color={shareIconColor} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>
        <OptionsModal
          show={showOptions ?? false}
          setShow={setShowOptions}
          currentPopupItem={{
            ...postData,
            type: postData.type ?? PostType.social,
            userData,
            created,
          }}
          removePost={removePost}
          editPost={editPost}
          isPrivate={postData.isPrivate}
        />
      </WebView>
    );
  return (
    <WebView
      className={webClassNameValue}
      style={[
        styles.postView,
        {
          backgroundColor: useWebCardClassStyles ? undefined : cardBackground,
          borderBottomColor: useWebCardClassStyles ? undefined : cardBackground,
          borderColor: useWebCardClassStyles ? undefined : cardBorderColor,
          borderWidth: useWebCardClassStyles ? undefined : borderWidth.hairline,
        },
        style,
      ]}
    >
      <View style={{ width: '100%' }}>
        {userData ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: isSocialPost ? 'flex-start' : 'center',
              marginBottom: spacing.x13,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                onPress();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                paddingRight: spacing.x10,
              }}
            >
              {userData.profileIcon && !userData.profileImage ? (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.max,
                    borderColor:
                      userData.profileImage !== NO_PROFILE_IMAGE
                        ? brandColors.black
                        : brandColors.primaryBase,
                    borderWidth: borderWidth.thin,
                    padding: spacing.x5,
                    marginRight: spacing.x10,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {userData.profileIcon}
                </View>
              ) : (
                <FastImage
                  source={{
                    uri: userData.profileImage !== '' ? userData.profileImage : NO_PROFILE_IMAGE,
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.max,
                    borderColor:
                      userData.profileImage !== NO_PROFILE_IMAGE
                        ? brandColors.black
                        : brandColors.primaryBase,
                    borderWidth: borderWidth.thin,
                    marginRight: spacing.x10,
                  }}
                  resizeMode="cover"
                />
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <StyledText
                    style={{
                      color: transparency ? Colors.neutral[500] : primaryTextColor,
                      fontSize: 17,
                      fontWeight: 'bold',
                      marginBottom: isSocialPost ? 0 : 0,
                      lineHeight: isSocialPost ? 20 : undefined,
                    }}
                    numberOfLines={2}
                  >
                    {userData?.name}
                    {prayerDisplayEmoji ? ` ~ ${prayerDisplayEmoji}` : ''}
                  </StyledText>
                  {isApprovedInfluencer ? (
                    <Icon
                      name="check-decagram"
                      size={spacing.x16}
                      style={{ marginLeft: spacing.x5 }}
                      color={brandColors.primaryDark}
                    />
                  ) : null}
                  {isSocialPost && locationLabel ? (
                    <View
                      style={{
                        marginLeft: spacing.x5,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: spacing.x5,
                        paddingVertical: 1,
                        borderRadius: borderRadius.max,
                        backgroundColor: locationPillBackground,
                        borderWidth: borderWidth.hairline,
                        borderColor: locationPillBorder,
                        minHeight: 14,
                      }}
                    >
                      <StyledText style={{ color: colors.text, fontSize: 7 }}>
                        {locationLabel}
                      </StyledText>
                    </View>
                  ) : null}
                </View>
                <StyledText
                  numberOfLines={2}
                  style={{
                    color: transparency ? Colors.neutral[600] : secondaryTextColor,
                    ...fontSize.x1,
                    marginTop: 0,
                  }}
                >
                  {formattedHandle}
                  {created ? (
                    <>
                      {hasHandle ? ` • ` : ''}
                      <StyledText
                        style={[
                          fontSize.x1,
                          {
                            color: transparency ? Colors.neutral[600] : secondaryTextColor,
                          },
                        ]}
                      >
                        {timeSince(created)} ago
                      </StyledText>
                    </>
                  ) : null}
                  {edited && updated ? (
                    <>
                      {' '}
                      • {' Edited '}
                      <StyledText
                        style={[
                          fontSize.x1,
                          {
                            color: transparency ? Colors.neutral[600] : secondaryTextColor,
                          },
                        ]}
                      >
                        {timeSince(updated)} ago
                      </StyledText>
                    </>
                  ) : null}
                </StyledText>
                {shouldShowLocation && !isSocialPost ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Location
                      size={13}
                      color={secondaryTextColor}
                      style={{ marginRight: spacing.x5 }}
                    />
                    <StyledText
                      style={[
                        fontSize.x1,
                        {
                          color: transparency ? Colors.neutral[600] : secondaryTextColor,
                        },
                      ]}
                    >
                      {postData.locationName}
                    </StyledText>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowOptions(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FontAwesomeIcon
                icon={faEllipsisVertical}
                color={transparency ? Colors.neutral[600] : secondaryTextColor}
              />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ width: '100%' }}>{children}</View>

        <View
          style={{
            borderTopWidth: borderWidth.hairline,
            borderTopColor: cardBorderColor,
            marginTop: spacing.x8,
            paddingTop: spacing.x5,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.x16 }}>
            <Reaction
              items={ReactionItems}
              type="modal"
              cardStyle={{
                shadowOpacity: 0.2,
                marginTop: spacing.x20,
                borderRadius: borderRadius.base,
                width: 140,
                height: 50,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onTap={async (item) => {
                if (item) {
                  if (myReaction?.type === item.type) {
                    await removeReactPost();
                  } else {
                    triggerReactionFeedback(item.type);
                    await reactPost(item.type);
                  }
                }
              }}
              itemIndex={index}
              onShowDismissCard={onShowDismissCard}
              onPress={() => {
                if (myReaction) {
                  removeReactPost();
                } else {
                  triggerReactionFeedback(SocialPostReactionType.love);
                  reactPost(SocialPostReactionType.love);
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Animated.View style={{ transform: [{ scale: mainReactionScale }] }}>
                  <MaterialIcons
                    name={myReaction ? 'favorite' : 'favorite-border'}
                    size={22}
                    color={myReaction ? Colors.errorFeedback[200] : secondaryTextColor}
                  />
                </Animated.View>
                <StyledText
                  style={{
                    marginLeft: spacing.x5,
                    color: transparency ? Colors.neutral[600] : secondaryTextColor,
                    ...fontSize.x1,
                  }}
                >
                  {totalReactionCount}
                </StyledText>
              </View>
            </Reaction>

            <TouchableOpacity
              disabled={!onCommentsPress}
              onPress={() => {
                if (onCommentsPress) {
                  onCommentsPress();
                }
              }}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <MaterialIcons name="chat-bubble-outline" size={22} color={secondaryTextColor} />
              <StyledText
                style={{
                  marginLeft: spacing.x5,
                  color: transparency ? Colors.neutral[600] : secondaryTextColor,
                  ...fontSize.x1,
                }}
              >
                {postData?.commentNumber ?? postData.comments?.length ?? '0'}
              </StyledText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {}}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <CornerUpRightIcon width={22} height={22} color={repostIconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={sharePost}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <SendIcon width={22} height={22} color={shareIconColor} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {actionBarRightAccessory ? (
              <View style={{ marginRight: spacing.x10 }}>{actionBarRightAccessory}</View>
            ) : null}
            <TouchableOpacity
              onPress={() => {
                if (isThisPostSaved) {
                  if (postData.id) removeSavedPost(postData.type, undefined, postData.id);
                  else if (postData.postlink) removeSavedPost(postData.type, postData.postlink);
                } else {
                  savePost(
                    postData?.id,
                    postData?.type,
                    postData.title,
                    created,
                    userData?._id,
                    postData?.postlink,
                    postData?.image?.url
                  );
                }
              }}
            >
              <MaterialIcons
                name={isThisPostSaved ? 'bookmark' : 'bookmark-border'}
                size={22}
                color={secondaryTextColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {postData.externalLink ? (
          <TouchableOpacity
            onPress={() => {
              if (postData.externalLink) OpenURLButton(postData.externalLink);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: spacing.x10,
            }}
          >
            <View style={{ borderRadius: borderRadius.max, padding: spacing.x5 }}>
              {source === 'instagram' ? (
                <Instagram height={getHeight(2.5)} fill={brandColors.primaryDark} />
              ) : null}

              {source === 'twitter' ? (
                <Twitter height={getHeight(2.5)} fill={brandColors.primaryDark} />
              ) : null}
            </View>

            <StyledText style={{ color: brandColors.primaryDark }}>View Post</StyledText>
          </TouchableOpacity>
        ) : null}
      </View>
      <OptionsModal
        show={showOptions ?? false}
        setShow={setShowOptions}
        currentPopupItem={{
          ...postData,
          type: postData.type ?? PostType.social,
          userData,
          created,
        }}
        removePost={removePost}
        editPost={editPost}
        isPrivate={postData.isPrivate}
      />
    </WebView>
  );
}

export default BaseItem;

// export default memo(BaseItem, (prevProps, nextProps) => {
//   return (
//     isEqual(prevProps?.isScrollEnable, nextProps?.isScrollEnable) &&
//     isEqual(prevProps?.postData, nextProps?.postData)
//   );
// });
