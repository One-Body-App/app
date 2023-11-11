import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import React, { ReactNode, useState } from 'react';
import { Platform, Share, StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import { styles } from './style';
import { NO_PROFILE_IMAGE, OpenURLButton } from '@/src/Services/constants';
import FastImage from 'react-native-fast-image';
import Twitter from '@/assets/svg/Twitter.svg';
import Instagram from '@/assets/svg/Instagram.svg';
import PrayerIcon from '@/assets/svg/Prayer.svg';
import NounHands from '@/assets/svg/NounHands.svg';

import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { StyledText } from '../styled/Text';
import { fontSize } from '@/src/styles/typography';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Heart, Location } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';

import { ShareIos, ShareAndroid, Bookmark } from 'iconoir-react-native';
import { setLoader } from '@/src/Redux/actions/GeneralActions';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/src/Services/api';
import { getuserGet } from '@/src/Redux/actions/UserAction';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { AccountType, PostType, SocialPostReaction, SocialPostReactionType } from '@/utils/types';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import OptionsModal from './OptionsModal';
import { Reaction } from 'react-native-reactions';

interface BaseItemProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress: Function;
  profileImage: string;
  createdDate?: Date;
  source?: string;
  postData: {
    id?: string;
    type?: PostType;
    postlink?: string;
    title: string;
    created: Date;
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
  };
  userData: {
    twitterHandler?: string;
    instagramHandler?: string;
    name: string;
    username: string;
    _id: string;
    accountType: AccountType;
    profileImage: string;
  };

  isApprovedInfluencer?: boolean;

  onShowDismissCard?: (e?: boolean) => void;
  isScrollEnable?: boolean;
  index?: number;
  parentRefreshContent?: Function;
}

const BaseItem = ({
  style,
  onPress,
  profileImage,
  children,
  createdDate,
  source,
  userData,
  isApprovedInfluencer,
  postData,
  parentRefreshContent,
  onShowDismissCard,
  isScrollEnable,
  index,
}: BaseItemProps) => {
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
        route: `social/react`,
        verb: 'patch',
        token: token,
        params: {
          postId: postData.id,
          type,
        },
      });

      if (res?.status == 200) {
        // dispatch(getuserGet({ token }));
        // setMyReaction()
        if (res.response?.reactions?.length > 0) {
          let myReaction: SocialPostReaction | undefined = undefined;
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
        route: `social/remove-reaction`,
        verb: 'patch',
        token: token,
        params: {
          postId: postData.id,
        },
      });

      if (res?.status == 200) {
        // dispatch(getuserGet({ token }));

        if (res.response?.reactions?.length > 0) {
          let myReaction = undefined;
          let indexToRemove = -1;
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
        token: token,
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
        dispatch(getuserGet({ token }));
      }
      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const removePost = async (link?: string, id?: string) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: `user/remove-post`,
        verb: 'delete',
        token: token,
        params: {
          id,
          link,
        },
      });

      if (res?.status == 200) {
        dispatch(getuserGet({ token }));
      }
      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  let isThisPostSaved = false;
  if (user?.savedPost && user?.savedPost.length > 0) {
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
    love: false,
    praying: false,
    happy: false,
  };

  if (postData.reactions) {
    postData.reactions.forEach((reaction) => {
      reactionTypes[reaction.type] = true;
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
          <Heart size={20} color="white" />
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
          <PrayerIcon width={20} height={20} color="white" />
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
          <NounHands width={20} height={20} color="white" />
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
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.x10,
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
          }}
        >
          <FastImage
            source={{
              uri: profileImage,
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.max,
              // marginBottom: 5,
              borderColor: profileImage != NO_PROFILE_IMAGE ? '#032F3C' : '#09aadb',
              borderWidth: borderWidth.thin,
            }}
            resizeMode={'contain'}
          />
        </TouchableOpacity>
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
                }}
              >
                <View style={{ flexDirection: 'column' }}>
                  <View style={{ flexDirection: 'row' }}>
                    <StyledText
                      style={{
                        color: Colors.neutral.brand,
                        alignItems: 'center',
                        ...fontSize.x1,
                      }}
                      numberOfLines={2}
                    >
                      {userData?.name}
                    </StyledText>
                    {isApprovedInfluencer ? (
                      <Icon
                        name="check-decagram"
                        size={20}
                        style={{ marginLeft: spacing.x8 }}
                        color={Colors.primarySapphire.brand}
                      />
                    ) : null}
                  </View>
                  <StyledText
                    numberOfLines={2}
                    style={{
                      color: Colors.neutral[300],
                      alignItems: 'center',
                      ...fontSize.x1,
                    }}
                  >
                    @
                    {source == 'twitter'
                      ? userData?.twitterHandler
                      : source == 'instagram'
                      ? userData?.instagramHandler
                      : userData?.username}
                    {createdDate ? (
                      <>
                        {' '}
                        •{' '}
                        <StyledText
                          style={[
                            fontSize.x1,
                            { color: Colors.neutral[300], alignItems: 'center' },
                          ]}
                        >
                          {timeSince(createdDate)} ago
                        </StyledText>
                      </>
                    ) : null}
                  </StyledText>
                  {postData.locationName ? (
                    <StyledText
                      style={[fontSize.x1, { color: Colors.neutral[300], alignItems: 'center' }]}
                    >
                      <Location
                        size={15}
                        color={Colors.neutral[300]}
                        style={{ marginRight: spacing.x5 }}
                      />
                      {postData.locationName}
                    </StyledText>
                  ) : null}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowOptions(true);
                }}
              >
                <FontAwesomeIcon icon={faEllipsisVertical} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ marginTop: spacing.x16 }}>{children}</View>
          {postData.type == PostType.social && !postData.externalLink ? (
            <View style={{ flexDirection: 'row' }}>
              {postData?.reactions && postData.reactions.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: spacing.x10,
                    alignItems: 'center',
                  }}
                >
                  {reactionTypes.love ? (
                    <View
                      style={{
                        padding: 4,
                        backgroundColor: Colors.errorFeedback[200],
                        borderRadius: borderRadius.max,
                        zIndex: 10,
                        borderWidth: borderWidth.thin,
                        borderColor: Colors.main.white,
                      }}
                    >
                      <Heart size={15} color="white" />
                    </View>
                  ) : null}

                  {reactionTypes.happy ? (
                    <View
                      style={{
                        padding: 4,
                        backgroundColor: Colors.infoFeedback[200],
                        borderRadius: borderRadius.max,
                        marginLeft: reactionTypes.love ? -1 * spacing.x8 : 0,
                        borderWidth: borderWidth.thin,
                        borderColor: Colors.main.white,
                      }}
                    >
                      <NounHands width={15} height={15} color="white" />
                    </View>
                  ) : null}

                  {reactionTypes.praying ? (
                    <View
                      style={{
                        padding: 4,
                        backgroundColor: Colors.successFeedback[200],
                        borderRadius: borderRadius.max,
                        marginLeft: reactionTypes.love || reactionTypes.happy ? -1 * spacing.x8 : 0,
                        zIndex: 8,
                        borderWidth: borderWidth.thin,
                        borderColor: Colors.main.white,
                      }}
                    >
                      <PrayerIcon width={15} height={15} color="white" />
                    </View>
                  ) : null}

                  <StyledText
                    style={[
                      fontSize.x2,
                      {
                        color: Colors.neutral[300],
                        marginLeft: spacing.x5,
                      },
                    ]}
                  >
                    {postData?.reactions.length}
                  </StyledText>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

                  {source == 'twitter' ? <Twitter height={getHeight(2.5)} fill="#00acee" /> : null}
                </View>

                <StyledText style={{ color: Colors.primarySapphire.brand }}>View Post</StyledText>
              </TouchableOpacity>
            ) : null}

            <View
              style={{
                flexDirection: 'row',
                flex: 3,
                alignItems: 'center',
                marginTop: spacing.x10,
              }}
            >
              {postData.type == PostType.social ? (
                <>
                  {!postData.externalLink ? (
                    <>
                      <Reaction
                        items={ReactionItems}
                        type="modal"
                        onTap={async (item) => {
                          if (item) {
                            if (myReaction?.type == item['type']) {
                              await removeReactPost();
                            } else {
                              await reactPost(item['type']);
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
                          color={myReaction ? Colors.errorFeedback[200] : colors.text}
                          variant={myReaction ? 'Bold' : 'Linear'}
                        />
                      </Reaction>

                      {/* <TouchableOpacity
                        onLongPress={() => {
                          if (!myReaction) {
                            setShowActions(!showActions);
                          }
                        }}
                        onPress={() => {
                          if (showActions) {
                            setShowActions(!showActions);
                          } else {
                            if (myReaction) {
                              removeReactPost();
                            } else {
                              reactPost(SocialPostReactionType.love);
                            }
                          }
                          // setShowActions(!showActions);
                        }}
                        ref={refs.setReference}
                      >
                        <Heart
                          size={25}
                          color={myReaction ? Colors.errorFeedback[200] : colors.text}
                          variant={myReaction ? 'Bold' : 'Linear'}
                        />
                      </TouchableOpacity> */}
                    </>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => {
                      if (isThisPostSaved) {
                        if (postData.id) removePost(undefined, postData.id);
                        else if (postData.postlink) removePost(postData.postlink);
                      } else {
                        savePost(
                          postData?.id,
                          postData?.type,
                          postData.title,
                          postData?.created,
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
                      color={colors.text}
                      fill={isThisPostSaved ? colors.text : colors.background}
                    />
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
            {postData.type == PostType.rss ? (
              <View style={{ flex: 1, alignItems: 'flex-end', marginTop: spacing.x10 }}>
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
                    <ShareAndroid color={colors.text} height={25} width={25} />
                  ) : (
                    <ShareIos color={colors.text} height={25} width={25} />
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <OptionsModal
        show={showOptions ?? false}
        setShow={setShowOptions}
        currentPopupItem={{ ...postData, userData }}
        hideChannelSection={user?._id == userData._id}
        onProfilePress={onPress}
      />
    </View>
  );
};

export default BaseItem;

// export default memo(BaseItem, (prevProps, nextProps) => {
//   return (
//     isEqual(prevProps?.isScrollEnable, nextProps?.isScrollEnable) &&
//     isEqual(prevProps?.postData, nextProps?.postData)
//   );
// });
