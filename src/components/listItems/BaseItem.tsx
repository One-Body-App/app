import React, { ReactNode, useState } from 'react';
import { Platform, Share, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Heart, Location, Message2 } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';
import { ShareIos, ShareAndroid, Bookmark } from 'iconoir-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { Reaction } from 'react-native-reactions';
import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import { styles } from './style';
import { NO_PROFILE_IMAGE, OpenURLButton } from '@/services/constants';
import Twitter from '@/assets/svg/Twitter.svg';
import Instagram from '@/assets/svg/Instagram.svg';
import PrayerIcon from '@/assets/svg/Prayer.svg';
import NounHands from '@/assets/svg/NounHands.svg';

import { borderRadius, borderWidth } from '@/src/styles/outlines';
import StyledText from '../styled/Text';
import { fontSize } from '@/src/styles/typography';
import { spacing } from '@/src/styles/spacing';
import { Colors, Spacing } from '@/src/styles';

import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { getuserGet } from '@/src/redux/actions/UserAction';
import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  CommentPost,
  PostType,
  PostUserData,
  SocialPostReaction,
  SocialPostReactionType,
} from '@/utils/types';
import OptionsModal from './OptionsModal';

interface BaseItemProps {
  children: ReactNode;
  transparency?: boolean;
  style?: StyleProp<ViewStyle>;
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
    edited?: boolean;
    isPrivate?: boolean;
    comments?: CommentPost[];
    commentNumber?: number;
  };
  userData: PostUserData;

  isApprovedInfluencer?: boolean;

  onShowDismissCard?: (e?: boolean) => void;
  isScrollEnable?: boolean;
  index?: number;
  parentRefreshContent?: Function;
  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  reelLayout?: boolean;
}

function BaseItem({
  transparency,
  style,
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
  isScrollEnable,
  index,
  removePost,
  editPost,
  fromSavedPosts,
  reelLayout = false,
}: BaseItemProps) {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);

  const [myReaction, setMyReaction] = useState<SocialPostReaction | undefined>(postData.myReaction);
  // const [reactions, setReactions] = useState<SocialPostReaction[]>(postData.reactions ?? []);
  const [showActions, setShowActions] = useState(false);

  const [showOptions, setShowOptions] = useState(false);

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

      if (res?.status == 200) {
        // dispatch(getuserGet({ token }));
        // setMyReaction()
        if (res.response?.reactions?.length > 0) {
          let myReaction: SocialPostReaction | undefined;
          res.response?.reactions.forEach((reaction: SocialPostReaction) => {
            if (reaction.userId == user?._id) {
              myReaction = reaction;
            }
          });

          // if (myReaction) setReactions([...reactions, myReaction]);
          setShowActions(false);
          if (myReaction) setMyReaction(myReaction);
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

      if (res?.status == 200) {
        // dispatch(getuserGet({ token }));

        if (res.response?.reactions?.length > 0) {
          let myReaction;
          const indexToRemove = -1;
          res.response?.reactions.forEach((reaction: any) => {
            if (reaction.userId == user?._id) {
              myReaction = reaction;
            }
          });

          setMyReaction(myReaction);
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

      if (res?.status == 200) {
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

      if (res?.status == 200) {
        dispatch(getuserGet({ token, pullSavedData: fromSavedPosts }));
      }
      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  let isThisPostSaved = false;

  if (postData.type == PostType.prayer && user?.savedPrayers && user?.savedPrayers.length > 0) {
    user?.savedPrayers.forEach((savedPrayer) => {
      if (savedPrayer == postData?.id) {
        isThisPostSaved = true;
      }
    });
  } else if (postData.type != PostType.prayer && user?.savedPost && user?.savedPost.length > 0) {
    user?.savedPost.forEach((savedPost) => {
      if (
        (savedPost.link != undefined && savedPost.link == postData.postlink) ||
        (savedPost.postId != undefined && savedPost.postId == postData?.id)
      ) {
        isThisPostSaved = true;
      }
    });
  }
  // console.log('here', postData);

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

  const ReactionItems = [
    {
      id: 0,
      emoji: (
        <View
          style={{
            padding: 4,
            backgroundColor: Colors.errorFeedback[200],
            borderRadius: borderRadius.max,
            borderWidth: borderWidth.thin,
            borderColor: Colors.main.white,
          }}
        >
          <Heart size={25} color="white" />
        </View>
      ),
      title: 'Love',
      type: SocialPostReactionType.love,
    },
    {
      id: 1,
      emoji: (
        <View
          style={{
            padding: 4,
            backgroundColor: Colors.successFeedback[200],
            borderRadius: borderRadius.max,

            borderWidth: borderWidth.thin,
            borderColor: Colors.main.white,
          }}
        >
          <PrayerIcon width={25} height={25} color="white" />
        </View>
      ),
      title: 'Praying',
      type: SocialPostReactionType.praying,
    },
    {
      id: 2,
      emoji: (
        <View
          style={{
            padding: 4,
            backgroundColor: Colors.infoFeedback[200],
            borderRadius: borderRadius.max,

            borderWidth: borderWidth.thin,
            borderColor: Colors.main.white,
          }}
        >
          <NounHands width={25} height={25} color="white" />
        </View>
      ),
      title: 'Praise',
      type: SocialPostReactionType.happy,
    },
  ];

  return (
    <View style={[styles.postView, { borderBottomColor: Colors.primarySapphire[900] }, style]}>
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
            position: 'absolute',
            top: reelLayout ? -165 : 0,
            left: 0,
            zIndex: 2,
            maxWidth: 48,
            flexDirection: 'column',
          }}
        >
          <TouchableOpacity
            onPress={() => {
              onPress();
            }}
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              marginTop: spacing.x5,
            }}
          >
            {userData.profileIcon && !userData.profileImage ? (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.max,
                  borderColor: userData.profileImage != NO_PROFILE_IMAGE ? '#032F3C' : '#09aadb',
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
          </TouchableOpacity>
          {reelLayout && (
            <View
              style={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: spacing.x16,
                marginLeft: 7,
                marginTop: 5,
                alignContent: 'space-between',
              }}
            >
              <Reaction
                items={ReactionItems}
                type="modal"
                cardStyle={{
                  padding: spacing.x5,
                  shadowOpacity: 0.2,
                  marginTop: spacing.x16,
                  width: 40,
                  height: 40,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: borderRadius.base,
                }}
                onTap={async (item) => {
                  if (item) {
                    if (myReaction?.type === item.type) {
                      await removeReactPost();
                    } else {
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
                    reactPost(SocialPostReactionType.love);
                  }
                }}
              >
                <Heart
                  size={25}
                  color={
                    myReaction
                      ? Colors.errorFeedback[200]
                      : transparency
                        ? Colors.neutral[600]
                        : 'white'
                  }
                  variant={myReaction ? 'Bold' : 'Linear'}
                />
              </Reaction>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Message2 color={transparency ? Colors.neutral[600] : 'white'} />
                <StyledText
                  style={{
                    marginLeft: spacing.x10,
                    // marginVertical: spacing.x5,
                    color: transparency ? Colors.neutral[600] : 'white',
                  }}
                >
                  {postData?.commentNumber ?? postData.comments?.length ?? '0'}
                </StyledText>
              </View>

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
                <Bookmark
                  style={{ marginRight: 3 }}
                  width={25}
                  height={25}
                  color={transparency ? Colors.neutral[600] : 'white'}
                  fill={
                    isThisPostSaved
                      ? transparency
                        ? Colors.neutral[600]
                        : 'white'
                      : transparency
                        ? 'transparent'
                        : 'transparent'
                  }
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
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
                        color: reelLayout
                          ? 'white'
                          : transparency
                            ? Colors.neutral[500]
                            : Colors.neutral.brand,
                        alignItems: 'center',
                        ...fontSize.x1,
                        marginLeft: reelLayout ? spacing.x5 : spacing.x48,
                        marginTop: spacing.x5,
                      }}
                      numberOfLines={2}
                    >
                      {userData?.name}
                    </StyledText>
                    {isApprovedInfluencer ? (
                      <Icon
                        name="check-decagram"
                        size={spacing.x16}
                        style={{ marginLeft: spacing.x8, marginTop: spacing.x8 }}
                        color={reelLayout ? 'white' : Colors.primarySapphire.brand}
                      />
                    ) : null}
                  </View>
                  <StyledText
                    numberOfLines={2}
                    style={{
                      color: reelLayout
                        ? 'white'
                        : transparency
                          ? Colors.neutral[600]
                          : Colors.neutral[300],
                      alignItems: 'center',
                      ...fontSize.x1,
                      marginLeft: reelLayout ? spacing.x5 : spacing.x48,
                      marginTop: 0,
                    }}
                  >
                    {(source == 'twitter' && userData?.twitterHandler) ||
                    (source == 'instagram' && userData?.instagramHandler) ||
                    userData?.username
                      ? `@${
                          source === 'twitter'
                            ? userData?.twitterHandler
                            : source === 'instagram'
                              ? userData?.instagramHandler
                              : userData?.username
                        }`
                      : ''}

                    {created ? (
                      <>
                        {(source === 'twitter' && userData?.twitterHandler) ||
                        (source === 'instagram' && userData?.instagramHandler) ||
                        userData?.username
                          ? ` • `
                          : ''}
                        <StyledText
                          style={[
                            fontSize.x1,
                            {
                              color: reelLayout
                                ? 'white'
                                : transparency
                                  ? Colors.neutral[600]
                                  : Colors.neutral[300],
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
                              color: reelLayout
                                ? 'white'
                                : transparency
                                  ? Colors.neutral[600]
                                  : Colors.neutral[300],
                              alignItems: 'center',
                            },
                          ]}
                        >
                          {timeSince(updated)} ago
                        </StyledText>
                      </>
                    ) : null}
                  </StyledText>

                  {postData.locationName ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Location
                        size={15}
                        color={reelLayout ? 'white' : Colors.neutral[300]}
                        style={{ marginRight: spacing.x5, marginLeft: spacing.x48 }}
                      />
                      <StyledText
                        style={[
                          fontSize.x1,
                          {
                            color: reelLayout
                              ? 'white'
                              : transparency
                                ? Colors.neutral[600]
                                : Colors.neutral[300],
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
                  color={reelLayout ? 'white' : transparency ? Colors.neutral[600] : colors.text}
                  style={{ marginTop: spacing.x10, marginRight: -1 * spacing.x5 }}
                />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        <View style={{ flexGrow: 1, flex: 1 }}>
          {children && (
            <View style={{ marginTop: reelLayout ? spacing.x5 : spacing.x20 }}>{children}</View>
          )}

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
                      <PrayerIcon width={15} height={15} color="white" />
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
                    {source == 'instagram' ? (
                      <Instagram height={getHeight(2.5)} fill="#00acee" />
                    ) : null}

                    {source == 'twitter' ? (
                      <Twitter height={getHeight(2.5)} fill="#00acee" />
                    ) : null}
                  </View>

                  <StyledText style={{ color: Colors.primarySapphire.brand }}>View Post</StyledText>
                </TouchableOpacity>
              ) : null}
              {/* Action Items  */}
              {!reelLayout && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    // marginTop: spacing.x10,
                    // alignContent: 'space-between',
                  }}
                >
                  <Reaction
                    items={ReactionItems}
                    type="modal"
                    cardStyle={{
                      padding: spacing.x5,
                      shadowOpacity: 0.2,
                      marginTop: spacing.x16,
                      borderRadius: borderRadius.base,
                    }}
                    onTap={async (item) => {
                      if (item) {
                        if (myReaction?.type == item.type) {
                          await removeReactPost();
                        } else {
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
                        reactPost(SocialPostReactionType.love);
                      }
                    }}
                  >
                    <Heart
                      size={25}
                      color={
                        myReaction
                          ? Colors.errorFeedback[200]
                          : transparency
                            ? Colors.neutral[600]
                            : colors.text
                      }
                      variant={myReaction ? 'Bold' : 'Linear'}
                      style={{ marginVertical: spacing.x10 }}
                    />
                  </Reaction>

                  <View
                    style={{
                      flexDirection: 'row',
                      marginLeft: spacing.x10,
                      alignItems: 'center',
                    }}
                  >
                    <Message2 color={transparency ? Colors.neutral[600] : colors.text} />
                    <StyledText
                      style={{
                        marginLeft: spacing.x10,
                        // marginVertical: spacing.x5,
                        color: transparency ? Colors.neutral[600] : colors.text,
                      }}
                    >
                      {postData?.commentNumber ?? postData.comments?.length ?? '0'}
                    </StyledText>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (isThisPostSaved) {
                        if (postData.id) removeSavedPost(postData.type, undefined, postData.id);
                        else if (postData.postlink)
                          removeSavedPost(postData.type, postData.postlink);
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
                    style={{ marginEnd: spacing.x10, marginStart: spacing.x10 }}
                  >
                    <Bookmark
                      style={{ marginRight: 3 }}
                      width={25}
                      height={25}
                      color={transparency ? Colors.neutral[600] : colors.text}
                      fill={
                        isThisPostSaved
                          ? transparency
                            ? Colors.neutral[600]
                            : colors.text
                          : transparency
                            ? 'transparent'
                            : colors.background
                      }
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={{ alignItems: 'center' }}>
              {postData.type == PostType.rss ? (
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
                        url: Platform.OS == 'ios' && postData.postlink ? postData?.postlink : '',
                        message:
                          Platform.OS == 'android' && postData?.postlink ? postData?.postlink : '',
                      });
                    }}
                  >
                    {Platform.OS == 'android' ? (
                      <ShareAndroid
                        color={transparency ? Colors.neutral[600] : colors.text}
                        height={25}
                        width={25}
                      />
                    ) : (
                      <ShareIos
                        color={transparency ? Colors.neutral[600] : colors.text}
                        height={25}
                        width={25}
                      />
                    )}
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
        onProfilePress={onPress}
        removePost={removePost}
        editPost={editPost}
        isPrivate={postData.isPrivate}
      />
    </View>
  );
}

export default BaseItem;

// export default memo(BaseItem, (prevProps, nextProps) => {
//   return (
//     isEqual(prevProps?.isScrollEnable, nextProps?.isScrollEnable) &&
//     isEqual(prevProps?.postData, nextProps?.postData)
//   );
// });
