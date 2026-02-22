import React, {
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Image,
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
import { useNavigation, useTheme } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-simple-toast';
import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import styles from './style';
import { NO_PROFILE_IMAGE, OpenURLButton } from '@/services/constants';
import Twitter from '@/assets/svg/Twitter.svg';
import Instagram from '@/assets/svg/Instagram.svg';
import PrayersIcon from '@/assets/svg/prayers.svg';
import PrayersOutlineIcon from '@/assets/svg/prayers-outline.svg';
import NounHands from '@/assets/svg/NounHands.svg';
import SendIcon from '@/assets/icons/send.svg';
import RepeatIcon from '@/assets/icons/repeat.svg';

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
import CustomModal from '../CustomModal';

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
  onTelemetryEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
  actionBarRightAccessory?: ReactNode;
  userData: PostUserData;

  isApprovedInfluencer?: boolean;

  onShowDismissCard?: (e?: boolean) => void;
  index?: number;
  parentRefreshContent?: Function;
  removePost?: (type: string, postId: string) => void;
  editPost?: (postId: string) => void;
  reelLayout?: boolean;
  repostPayload?: {
    sourceType: 'social' | 'prayer' | 'rss';
    sourceId: string;
    sourcePreview?: {
      title?: string;
      content?: string;
      link?: string;
      category?: string;
      isPrivate?: boolean;
    };
    originFeedType?: string;
  };
}

type AnimatedReaction = {
  id: string;
  iconUrl: string;
};

type ReactionBarRef = {
  showReactions: () => void;
  dismissReactions: () => void;
};

const REACTION_BAR_SCALE = 0.89;
const REACTION_BAR_MIN_WIDTH = 280;
const REACTION_BAR_OFFSET_X = 0;
const REACTION_BAR_OFFSET_Y = 44;
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';

const REACTION_ICON_URLS: Record<string, string> = {
  pray: `${TWEMOJI_BASE}/1f64f.png`,
  praise: `${TWEMOJI_BASE}/1f64c.png`,
  like: `${TWEMOJI_BASE}/1f44d.png`,
  love: `${TWEMOJI_BASE}/2764.png`,
  haha: `${TWEMOJI_BASE}/1f602.png`,
  wow: `${TWEMOJI_BASE}/1f632.png`,
  sad: `${TWEMOJI_BASE}/1f622.png`,
  angry: `${TWEMOJI_BASE}/1f621.png`,
};

const REACTION_BAR_ITEMS: AnimatedReaction[] = [
  { id: 'pray', iconUrl: REACTION_ICON_URLS.pray },
  { id: 'praise', iconUrl: REACTION_ICON_URLS.praise },
  { id: 'like', iconUrl: REACTION_ICON_URLS.like },
  { id: 'love', iconUrl: REACTION_ICON_URLS.love },
  { id: 'haha', iconUrl: REACTION_ICON_URLS.haha },
  { id: 'wow', iconUrl: REACTION_ICON_URLS.wow },
  { id: 'sad', iconUrl: REACTION_ICON_URLS.sad },
  { id: 'angry', iconUrl: REACTION_ICON_URLS.angry },
];

const mapReactionIdToType = (reactionId: string): SocialPostReactionType => {
  switch (reactionId) {
    case 'pray':
      return SocialPostReactionType.praying;
    case 'praise':
      return SocialPostReactionType.happy;
    case 'haha':
    case 'wow':
      return SocialPostReactionType.happy;
    case 'sad':
    case 'angry':
      return SocialPostReactionType.praying;
    case 'like':
    case 'love':
    default:
      return SocialPostReactionType.love;
  }
};

const getFallbackReactionIdFromType = (type?: SocialPostReactionType): string | undefined => {
  if (!type) {
    return undefined;
  }
  if (type === SocialPostReactionType.praying) {
    return 'pray';
  }
  if (type === SocialPostReactionType.happy) {
    return 'praise';
  }
  return 'love';
};

const InlineReactionBar = forwardRef<
  ReactionBarRef,
  { onDismiss: () => void; onReactionSelect: (reaction: AnimatedReaction) => void }
>(({ onDismiss, onReactionSelect }, ref) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  const showReactions = useCallback(() => {
    setVisible(true);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  const dismissReactions = useCallback(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss();
    });
  }, [onDismiss, opacity, scale]);

  useImperativeHandle(
    ref,
    () => ({
      showReactions,
      dismissReactions,
    }),
    [dismissReactions, showReactions]
  );

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        borderRadius: borderRadius.max,
        paddingVertical: spacing.x8,
        paddingHorizontal: spacing.x10,
        minWidth: REACTION_BAR_MIN_WIDTH,
        transform: [{ scale }],
        opacity,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      {REACTION_BAR_ITEMS.map((reaction) => (
        <TouchableOpacity
          key={reaction.id}
          onPress={() => {
            onReactionSelect(reaction);
            dismissReactions();
          }}
          activeOpacity={0.8}
          style={{ marginHorizontal: spacing.x5 }}
        >
          <Image source={{ uri: reaction.iconUrl }} style={{ width: 22, height: 22 }} />
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
});

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
  removePost,
  editPost,
  fromSavedPosts,
  reelLayout = false,
  onCommentsPress,
  onTelemetryEvent,
  actionBarRightAccessory,
  repostPayload,
}: BaseItemProps) {
  const { colors, dark } = useTheme();
  const navigation = useNavigation<any>();
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
  const [showRepostSheet, setShowRepostSheet] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [isReactionBarVisible, setIsReactionBarVisible] = useState(false);
  const [selectedReactionId, setSelectedReactionId] = useState<string | undefined>(undefined);
  const [defaultReactionColor, activeReactionColor] = [
    transparency ? Colors.neutral[600] : 'white',
    Colors.errorFeedback[200],
  ];
  const reactionIconColor = myReaction ? activeReactionColor : defaultReactionColor;
  const reactionBarRef = useRef<ReactionBarRef>(null);
  const mainReactionScale = useRef(new Animated.Value(1)).current;
  const effectiveRepostPayload =
    repostPayload && repostPayload.sourceId
      ? repostPayload
      : postData.id &&
          (postData.type === PostType.social ||
            postData.type === PostType.prayer ||
            postData.type === PostType.rss)
        ? {
            sourceType: postData.type,
            sourceId: postData.id,
            sourcePreview: {
              title: postData.title,
              link: postData.postlink,
              category: postData.prayerCategory,
              isPrivate: postData.isPrivate,
            },
          }
        : undefined;

  const canRepost =
    !reelLayout &&
    Boolean(
      effectiveRepostPayload?.sourceId &&
        (effectiveRepostPayload?.sourceType === PostType.social ||
          effectiveRepostPayload?.sourceType === PostType.prayer ||
          effectiveRepostPayload?.sourceType === PostType.rss)
    );

  const isPrayerRepostBlocked = Boolean(
    effectiveRepostPayload?.sourceType === PostType.prayer &&
      (effectiveRepostPayload?.sourcePreview?.isPrivate ||
        postData.answered ||
        !['request', 'exhortation', 'testimony'].includes(
          String(
            effectiveRepostPayload?.sourcePreview?.category ?? postData.prayerCategory ?? ''
          ).toLowerCase()
        ))
  );

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

    onTelemetryEvent?.('share', {
      postType: postData.type,
    });

    await Share.share({
      title: `${postData?.title ?? ''}`,
      url: Platform.OS === 'ios' ? linkToShare : '',
      message: Platform.OS === 'android' ? linkToShare : linkToShare,
    });
  };

  const openRepostSheet = () => {
    if (!canRepost || !effectiveRepostPayload?.sourceId) {
      return;
    }
    if (isPrayerRepostBlocked) {
      Toast.show(
        'Only public prayer requests, exhortations, or testimonies can be reposted.',
        Toast.LONG
      );
      return;
    }
    setShowRepostSheet(true);
  };

  const repostNow = async () => {
    if (!effectiveRepostPayload?.sourceId || isReposting) {
      return;
    }

    setIsReposting(true);
    try {
      const res = await ApiCall({
        route: 'social/repost',
        verb: 'post',
        token,
        params: {
          sourceType: effectiveRepostPayload.sourceType,
          sourceId: effectiveRepostPayload.sourceId,
        },
      });

      if (res?.status === 200) {
        const responseMessage =
          typeof (res.response as { message?: unknown })?.message === 'string'
            ? String((res.response as { message?: string }).message)
            : '';
        Toast.show(responseMessage || 'Post reposted to your feed', Toast.LONG);
        setShowRepostSheet(false);
        onTelemetryEvent?.('repost', {
          postType: postData.type,
          repostType: 'repost',
          sourceType: effectiveRepostPayload.sourceType,
        });
        if (parentRefreshContent) {
          parentRefreshContent();
        }
      } else {
        const responseMessage =
          typeof (res?.response as { message?: unknown })?.message === 'string'
            ? String((res.response as { message?: string }).message)
            : '';
        Toast.show(responseMessage || 'Unable to repost right now. Please try again.', Toast.LONG);
      }
    } catch (error) {
      Toast.show('Unable to repost right now. Please try again.', Toast.LONG);
    } finally {
      setIsReposting(false);
    }
  };

  const openQuoteComposer = () => {
    if (!effectiveRepostPayload?.sourceId) {
      return;
    }
    setShowRepostSheet(false);
    onTelemetryEvent?.('repost', {
      postType: postData.type,
      repostType: 'quote',
      sourceType: effectiveRepostPayload.sourceType,
    });
    (navigation as any).navigate('Post', {
      repostDraft: {
        sourceType: effectiveRepostPayload.sourceType,
        sourceId: effectiveRepostPayload.sourceId,
        sourcePreview: effectiveRepostPayload.sourcePreview,
        originFeedType: effectiveRepostPayload.originFeedType,
      },
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
  };

  const dismissReactionBar = () => {
    reactionBarRef.current?.dismissReactions();
  };

  const showReactionBar = () => {
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    setIsReactionBarVisible(true);
    requestAnimationFrame(() => {
      reactionBarRef.current?.showReactions();
    });
  };

  const handleAnimatedReactionSelect = async (reaction: AnimatedReaction) => {
    const selectedType = mapReactionIdToType(reaction.id);
    if (myReaction?.type === selectedType) {
      setSelectedReactionId(undefined);
      await removeReactPost();
      return;
    }
    setSelectedReactionId(reaction.id);
    triggerReactionFeedback(selectedType);
    await reactPost(selectedType);
  };

  useEffect(() => {
    const fallbackReactionId = getFallbackReactionIdFromType(myReaction?.type);
    setSelectedReactionId((currentReactionId) => {
      if (!fallbackReactionId) {
        return undefined;
      }
      if (currentReactionId && mapReactionIdToType(currentReactionId) === myReaction?.type) {
        return currentReactionId;
      }
      return fallbackReactionId;
    });
  }, [myReaction?.type]);

  const selectedReactionIconUrl =
    selectedReactionId &&
    Object.prototype.hasOwnProperty.call(REACTION_ICON_URLS, selectedReactionId)
      ? REACTION_ICON_URLS[selectedReactionId as keyof typeof REACTION_ICON_URLS]
      : undefined;

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

        onTelemetryEvent?.('reaction', {
          postType: postData.type,
          reactionType: type,
        });

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
        onTelemetryEvent?.('reaction_removed', {
          postType: postData.type,
        });
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
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  onLongPress={showReactionBar}
                  onPress={() => {
                    dismissReactionBar();
                    if (myReaction) {
                      setSelectedReactionId(undefined);
                      removeReactPost();
                      return;
                    }
                    setSelectedReactionId('love');
                    triggerReactionFeedback(SocialPostReactionType.love);
                    reactPost(SocialPostReactionType.love);
                  }}
                  delayLongPress={180}
                  activeOpacity={0.8}
                >
                  <Animated.View style={{ transform: [{ scale: mainReactionScale }] }}>
                    {selectedReactionIconUrl ? (
                      <Image
                        source={{ uri: selectedReactionIconUrl }}
                        style={{ width: 22, height: 22 }}
                      />
                    ) : (
                      <MaterialIcons
                        name={myReaction ? 'favorite' : 'favorite-border'}
                        size={22}
                        color={reactionIconColor}
                      />
                    )}
                  </Animated.View>
                </TouchableOpacity>
                {isReactionBarVisible ? (
                  <View
                    pointerEvents="box-none"
                    style={{
                      position: 'absolute',
                      left: REACTION_BAR_OFFSET_X,
                      bottom: REACTION_BAR_OFFSET_Y,
                      zIndex: 20,
                      elevation: 20,
                      transform: [{ scale: REACTION_BAR_SCALE }],
                    }}
                  >
                    <InlineReactionBar
                      ref={reactionBarRef}
                      onReactionSelect={handleAnimatedReactionSelect}
                      onDismiss={() => {
                        setIsReactionBarVisible(false);
                      }}
                    />
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                disabled={!onCommentsPress}
                onPress={() => {
                  if (onCommentsPress) {
                    onTelemetryEvent?.('open_comments', {
                      postType: postData.type,
                    });
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
                    onTelemetryEvent?.('unsave', {
                      postType: postData.type,
                    });
                    if (postData.id) removeSavedPost(postData.type, undefined, postData.id);
                    else if (postData.postlink) removeSavedPost(postData.type, postData.postlink);
                  } else {
                    onTelemetryEvent?.('save', {
                      postType: postData.type,
                    });
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
        <CustomModal
          modalVisible={showRepostSheet}
          onclose={() => {
            if (!isReposting) {
              setShowRepostSheet(false);
            }
          }}
          style={{
            backgroundColor: dark ? '#0f1f25' : '#ffffff',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            minHeight: 280,
          }}
        >
          <View style={{ paddingTop: spacing.x10, alignItems: 'center' }}>
            <View
              style={{
                width: 44,
                height: 4,
                borderRadius: borderRadius.max,
                backgroundColor: dark ? '#2d4b58' : '#d7dee3',
              }}
            />
          </View>
          <View style={{ paddingHorizontal: spacing.x20, paddingVertical: spacing.x16 }}>
            <TouchableOpacity
              disabled={isReposting}
              onPress={repostNow}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                opacity: isReposting ? 0.6 : 1,
                paddingVertical: spacing.x10,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: borderRadius.max,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: dark ? '#1c3640' : 'rgba(18, 107, 135, 0.12)',
                }}
              >
                <RepeatIcon width={22} height={22} color={brandColors.primaryDark} />
              </View>
              <View style={{ marginLeft: spacing.x13, flex: 1 }}>
                <StyledText style={{ color: primaryTextColor, fontWeight: '700', ...fontSize.x4 }}>
                  Repost
                </StyledText>
                <StyledText style={{ color: secondaryTextColor, ...fontSize.x2 }}>
                  Instantly share this post to your feed
                </StyledText>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isReposting}
              onPress={openQuoteComposer}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                opacity: isReposting ? 0.6 : 1,
                paddingVertical: spacing.x10,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: borderRadius.max,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: dark ? '#1c3640' : 'rgba(18, 107, 135, 0.12)',
                }}
              >
                <MaterialIcons name="format-quote" size={24} color={brandColors.primaryDark} />
              </View>
              <View style={{ marginLeft: spacing.x13, flex: 1 }}>
                <StyledText style={{ color: primaryTextColor, fontWeight: '700', ...fontSize.x4 }}>
                  Quote Post
                </StyledText>
                <StyledText style={{ color: secondaryTextColor, ...fontSize.x2 }}>
                  Add your own thoughts before sharing
                </StyledText>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isReposting}
              onPress={() => setShowRepostSheet(false)}
              style={{
                marginTop: spacing.x16,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.x10,
              }}
            >
              <StyledText
                style={{ color: brandColors.primaryDark, fontWeight: '700', ...fontSize.x4 }}
              >
                Cancel
              </StyledText>
            </TouchableOpacity>
          </View>
        </CustomModal>
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
                  resizeMode="contain"
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
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                onLongPress={showReactionBar}
                onPress={() => {
                  dismissReactionBar();
                  if (myReaction) {
                    setSelectedReactionId(undefined);
                    removeReactPost();
                    return;
                  }
                  setSelectedReactionId('love');
                  triggerReactionFeedback(SocialPostReactionType.love);
                  reactPost(SocialPostReactionType.love);
                }}
                delayLongPress={180}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Animated.View style={{ transform: [{ scale: mainReactionScale }] }}>
                    {selectedReactionIconUrl ? (
                      <Image
                        source={{ uri: selectedReactionIconUrl }}
                        style={{ width: 22, height: 22 }}
                      />
                    ) : (
                      <MaterialIcons
                        name={myReaction ? 'favorite' : 'favorite-border'}
                        size={22}
                        color={myReaction ? Colors.errorFeedback[200] : secondaryTextColor}
                      />
                    )}
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
              </TouchableOpacity>
              {isReactionBarVisible ? (
                <View
                  pointerEvents="box-none"
                  style={{
                    position: 'absolute',
                    left: REACTION_BAR_OFFSET_X,
                    bottom: REACTION_BAR_OFFSET_Y,
                    zIndex: 20,
                    elevation: 20,
                    transform: [{ scale: REACTION_BAR_SCALE }],
                  }}
                >
                  <InlineReactionBar
                    ref={reactionBarRef}
                    onReactionSelect={handleAnimatedReactionSelect}
                    onDismiss={() => {
                      setIsReactionBarVisible(false);
                    }}
                  />
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              disabled={!onCommentsPress}
              onPress={() => {
                if (onCommentsPress) {
                  onTelemetryEvent?.('open_comments', {
                    postType: postData.type,
                  });
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

            {canRepost ? (
              <TouchableOpacity
                disabled={isReposting}
                onPress={openRepostSheet}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: isReposting ? 0.6 : 1,
                }}
              >
                <RepeatIcon width={22} height={22} color={repostIconColor} />
              </TouchableOpacity>
            ) : null}

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
                  onTelemetryEvent?.('unsave', {
                    postType: postData.type,
                  });
                  if (postData.id) removeSavedPost(postData.type, undefined, postData.id);
                  else if (postData.postlink) removeSavedPost(postData.type, postData.postlink);
                } else {
                  onTelemetryEvent?.('save', {
                    postType: postData.type,
                  });
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
      <CustomModal
        modalVisible={showRepostSheet}
        onclose={() => {
          if (!isReposting) {
            setShowRepostSheet(false);
          }
        }}
        style={{
          backgroundColor: dark ? '#0f1f25' : '#ffffff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          minHeight: 280,
        }}
      >
        <View style={{ paddingTop: spacing.x10, alignItems: 'center' }}>
          <View
            style={{
              width: 44,
              height: 4,
              borderRadius: borderRadius.max,
              backgroundColor: dark ? '#2d4b58' : '#d7dee3',
            }}
          />
        </View>
        <View style={{ paddingHorizontal: spacing.x20, paddingVertical: spacing.x16 }}>
          <TouchableOpacity
            disabled={isReposting}
            onPress={repostNow}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              opacity: isReposting ? 0.6 : 1,
              paddingVertical: spacing.x10,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: borderRadius.max,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: dark ? '#1c3640' : 'rgba(18, 107, 135, 0.12)',
              }}
            >
              <RepeatIcon width={22} height={22} color={brandColors.primaryDark} />
            </View>
            <View style={{ marginLeft: spacing.x13, flex: 1 }}>
              <StyledText style={{ color: primaryTextColor, fontWeight: '700', ...fontSize.x4 }}>
                Repost
              </StyledText>
              <StyledText style={{ color: secondaryTextColor, ...fontSize.x2 }}>
                Instantly share this post to your feed
              </StyledText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isReposting}
            onPress={openQuoteComposer}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              opacity: isReposting ? 0.6 : 1,
              paddingVertical: spacing.x10,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: borderRadius.max,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: dark ? '#1c3640' : 'rgba(18, 107, 135, 0.12)',
              }}
            >
              <MaterialIcons name="format-quote" size={24} color={brandColors.primaryDark} />
            </View>
            <View style={{ marginLeft: spacing.x13, flex: 1 }}>
              <StyledText style={{ color: primaryTextColor, fontWeight: '700', ...fontSize.x4 }}>
                Quote Post
              </StyledText>
              <StyledText style={{ color: secondaryTextColor, ...fontSize.x2 }}>
                Add your own thoughts before sharing
              </StyledText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isReposting}
            onPress={() => setShowRepostSheet(false)}
            style={{
              marginTop: spacing.x16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.x10,
            }}
          >
            <StyledText
              style={{ color: brandColors.primaryDark, fontWeight: '700', ...fontSize.x4 }}
            >
              Cancel
            </StyledText>
          </TouchableOpacity>
        </View>
      </CustomModal>
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
