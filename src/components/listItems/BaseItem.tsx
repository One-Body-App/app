import { Image } from 'expo-image';
import React, {
  ReactNode,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Platform, Share, StyleProp, Pressable, View, ViewStyle } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { Location } from 'iconsax-react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsis, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-simple-toast';
import { getHeight, timeSince } from '@/utils/ResponsiveFun';
import styles from './style';
import { OpenURLButton } from '@/services/constants';
import Instagram from '@/assets/svg/Instagram.svg';
import SendIcon from '@/assets/icons/send.svg';
import RepeatIcon from '@/assets/icons/repeat.svg';

import { borderRadius, borderWidth } from '@/src/styles/outlines';
import StyledText from '../styled/Text';
import { fontSize } from '@/src/styles/typography';
import { spacing } from '@/src/styles/spacing';
import { Colors } from '@/src/styles';
import FeedAvatar from '@/components/avatar/FeedAvatar';
import {
  isFeedAvatarPlaceholderUri,
  resolveProfileAvatarUri,
} from '@/components/avatar/feedAvatarUtils';

import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { getuserGet } from '@/src/redux/actions/UserAction';
import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  CommentPost,
  PostType,
  PrayerWallCategory,
  PostUserData,
  ReactionDetailsTab,
  SocialPostReaction,
  SocialPostReactionType,
} from '@/utils/types';
import OptionsModal from './OptionsModal';
import CustomModal from '../CustomModal';
import PostReactionsModal from '@/components/reactions/PostReactionsModal';

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
    repostCount?: number;
  };
  onCommentsPress?: Function;
  onTelemetryEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
  actionBarRightAccessory?: ReactNode;
  userData: PostUserData;

  isApprovedInfluencer?: boolean;

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
const REACTION_BAR_SCALE_FACTOR = 4 / 3;
const REACTION_BAR_WIDTH = Math.round(REACTION_BAR_MIN_WIDTH * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_ICON_SIZE = Math.round(22 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_HORIZONTAL_MARGIN = Math.round(spacing.x5 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_VERTICAL_PADDING = Math.round(spacing.x8 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_HORIZONTAL_PADDING = Math.round(spacing.x10 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_OFFSET_X = 0;
const REACTION_BAR_OFFSET_Y = 44;
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@14.0.2/assets/72x72';

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
      return SocialPostReactionType.praise;
    case 'haha':
      return SocialPostReactionType.haha;
    case 'wow':
      return SocialPostReactionType.wow;
    case 'sad':
      return SocialPostReactionType.sad;
    case 'angry':
      return SocialPostReactionType.angry;
    case 'like':
      return SocialPostReactionType.like;
    case 'love':
    default:
      return SocialPostReactionType.love;
  }
};

const getFallbackReactionIdFromType = (type?: SocialPostReactionType): string | undefined => {
  if (!type) {
    return undefined;
  }
  if (type === SocialPostReactionType.like) {
    return 'like';
  }
  if (type === SocialPostReactionType.love) {
    return 'love';
  }
  if (type === SocialPostReactionType.praying) {
    return 'pray';
  }
  if (type === SocialPostReactionType.praise || type === SocialPostReactionType.happy) {
    return 'praise';
  }
  if (type === SocialPostReactionType.haha) {
    return 'haha';
  }
  if (type === SocialPostReactionType.wow) {
    return 'wow';
  }
  if (type === SocialPostReactionType.sad) {
    return 'sad';
  }
  if (type === SocialPostReactionType.angry) {
    return 'angry';
  }
  return undefined;
};

const isShareDialogDismissed = (result: unknown) => {
  if (!result || typeof result !== 'object') {
    return false;
  }
  const { action } = result as { action?: unknown };
  return typeof action === 'string' && action.toLowerCase().includes('dismiss');
};

const normalizeReactionType = (type?: SocialPostReactionType) => {
  if (type === SocialPostReactionType.happy) {
    return SocialPostReactionType.praise;
  }
  return type;
};

type InlineReactionBarProps = {
  onDismiss: () => void;
  onReactionSelect: (reaction: AnimatedReaction) => void;
  ref?: React.Ref<ReactionBarRef>;
};

function InlineReactionBar({ onDismiss, onReactionSelect, ref }: InlineReactionBarProps) {
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
        paddingVertical: REACTION_BAR_VERTICAL_PADDING,
        paddingHorizontal: REACTION_BAR_HORIZONTAL_PADDING,
        minWidth: REACTION_BAR_WIDTH,
        transform: [{ scale }],
        opacity,
        boxShadow: '0 3px 4px rgba(0, 0, 0, 0.2)',
      }}
    >
      {REACTION_BAR_ITEMS.map((reaction) => (
        <Pressable
          key={reaction.id}
          onPress={() => {
            onReactionSelect(reaction);
            dismissReactions();
          }}
          style={{ marginHorizontal: REACTION_BAR_HORIZONTAL_MARGIN }}
        >
          <Image
            source={{ uri: reaction.iconUrl }}
            style={{ width: REACTION_BAR_ICON_SIZE, height: REACTION_BAR_ICON_SIZE }}
          />
        </Pressable>
      ))}
    </Animated.View>
  );
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
  const repostIconColor = dark ? Colors.neutral[400] : '#126b87';
  const ONEBODY_APP_BASE_URL = 'https://app.onebodyapp.com';
  const cardBorderColor = dark ? 'rgba(255,255,255,0.08)' : brandColors.scale100;
  const primaryTextColor = dark ? Colors.neutral.brand : brandColors.black;
  const secondaryTextColor = dark ? Colors.neutral[400] : brandColors.primaryDark;
  const isSocialPost = postData.type === PostType.social;
  const profileImageUri = resolveProfileAvatarUri(userData);
  const hasResolvedAvatarImage =
    Boolean(profileImageUri) && !isFeedAvatarPlaceholderUri(profileImageUri);
  const locationPillBackground = dark ? Colors.neutral[800] : Colors.neutral[900];
  const locationPillBorder = dark ? 'rgba(255,255,255,0.08)' : Colors.neutral[600];
  const [myReaction, setMyReaction] = useState<SocialPostReaction | undefined>(postData.myReaction);
  const [displayReactions, setDisplayReactions] = useState<SocialPostReaction[]>(
    postData.reactions ?? []
  );
  const toSafeCount = (value: unknown) => {
    const numericCount = Number(value);
    if (!Number.isFinite(numericCount) || numericCount < 0) {
      return 0;
    }
    return Math.floor(numericCount);
  };
  const [displayRepostCount, setDisplayRepostCount] = useState<number>(() =>
    toSafeCount(postData.repostCount)
  );
  // const [reactions, setReactions] = useState<SocialPostReaction[]>(postData.reactions ?? []);

  const formatLocationLabel = (locationName?: string) => {
    if (!locationName) return '';
    const parts = locationName.split(',').flatMap((part) => {
      const trimmedPart = part.trim();
      return trimmedPart ? [trimmedPart] : [];
    });
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
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [reactionModalInitialTab, setReactionModalInitialTab] = useState<ReactionDetailsTab>('all');
  const [isReposting, setIsReposting] = useState(false);
  const [isReactionBarVisible, setIsReactionBarVisible] = useState(false);
  const [selectedReactionId, setSelectedReactionId] = useState<string | undefined>(undefined);
  const [defaultReactionColor, activeReactionColor] = [
    transparency ? Colors.neutral[600] : 'white',
    Colors.errorFeedback[200],
  ];
  const reactionIconColor = myReaction ? activeReactionColor : defaultReactionColor;
  const reactionBarRef = useRef<ReactionBarRef>(null);
  const isReactionUpdatingRef = useRef(false);
  const mainReactionScale = useRef(new Animated.Value(1)).current;
  const derivedRepostPayload =
    postData.id &&
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
          originFeedType: undefined,
        }
      : undefined;
  const effectiveRepostPayload =
    repostPayload && repostPayload.sourceId ? repostPayload : derivedRepostPayload;

  const canRepost = Boolean(
    effectiveRepostPayload?.sourceId &&
      (effectiveRepostPayload?.sourceType === PostType.social ||
        effectiveRepostPayload?.sourceType === PostType.prayer ||
        effectiveRepostPayload?.sourceType === PostType.rss)
  );

  const canViewReactions = Boolean(
    postData?.id &&
      (postData.type === PostType.social ||
        postData.type === PostType.prayer ||
        postData.type === PostType.rss ||
        postData.type === PostType.watch)
  );

  const openReactionsModal = (initialTab: ReactionDetailsTab = 'all') => {
    if (!canViewReactions) {
      return;
    }
    setReactionModalInitialTab(initialTab);
    setShowReactionsModal(true);
  };

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

    onTelemetryEvent?.('post_share_initiated', {
      postType: postData.type,
    });
    try {
      const result = await Share.share({
        title: `${postData?.title ?? ''}`,
        url: Platform.OS === 'ios' ? linkToShare : '',
        message: Platform.OS === 'android' ? linkToShare : linkToShare,
      });
      onTelemetryEvent?.('post_share_completed', {
        postType: postData.type,
        result: isShareDialogDismissed(result) ? 'cancel' : 'success',
      });
    } catch (_error) {
      onTelemetryEvent?.('post_share_completed', {
        postType: postData.type,
        result: 'fail',
      });
    }
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
        setDisplayRepostCount((previous) => previous + 1);
        setShowRepostSheet(false);
        onTelemetryEvent?.('post_repost', {
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
    onTelemetryEvent?.('post_quote_create', {
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
    if (isReactionUpdatingRef.current) {
      return;
    }
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
    if (isReactionUpdatingRef.current) {
      return;
    }
    const selectedType = mapReactionIdToType(reaction.id);
    if (normalizeReactionType(myReaction?.type) === selectedType) {
      setSelectedReactionId(undefined);
      await removeReactPost();
      return;
    }
    setSelectedReactionId(reaction.id);
    triggerReactionFeedback(selectedType);
    await reactPost(selectedType);
  };

  useLayoutEffect(() => {
    setDisplayReactions(postData.reactions ?? []);
  }, [postData.id, postData.reactions]);

  useLayoutEffect(() => {
    setMyReaction(postData.myReaction);
  }, [postData.id, postData.myReaction]);

  useLayoutEffect(() => {
    const fallbackReactionId = getFallbackReactionIdFromType(
      normalizeReactionType(myReaction?.type)
    );
    setSelectedReactionId((currentReactionId) => {
      if (!fallbackReactionId) {
        return undefined;
      }
      if (
        currentReactionId &&
        mapReactionIdToType(currentReactionId) === normalizeReactionType(myReaction?.type)
      ) {
        return currentReactionId;
      }
      return fallbackReactionId;
    });
  }, [myReaction?.type]);

  useLayoutEffect(() => {
    setDisplayRepostCount(toSafeCount(postData.repostCount));
  }, [postData.id, postData.repostCount, postData.type]);

  const selectedReactionIconUrl =
    selectedReactionId &&
    Object.prototype.hasOwnProperty.call(REACTION_ICON_URLS, selectedReactionId)
      ? REACTION_ICON_URLS[selectedReactionId as keyof typeof REACTION_ICON_URLS]
      : undefined;

  const getUserHandle = () => {
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
    if (postData.type !== PostType.prayer) {
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
    if (isReactionUpdatingRef.current) {
      return;
    }
    isReactionUpdatingRef.current = true;
    try {
      const normalizedType = normalizeReactionType(type) ?? SocialPostReactionType.love;
      const res = await ApiCall({
        route: `${postData.type}/react`,
        verb: 'patch',
        token,
        params: {
          postId: postData.id,
          type: normalizedType,
        },
      });

      if (res?.status === 200) {
        const nextReactions = Array.isArray(res.response?.reactions)
          ? (res.response.reactions as SocialPostReaction[])
          : [];
        const foundReaction = nextReactions.find((reaction) => reaction.userId === user?._id);
        setDisplayReactions(nextReactions);
        setMyReaction(foundReaction);

        onTelemetryEvent?.('post_reaction_add', {
          postType: postData.type,
          reactionType: normalizedType,
        });
      } else {
        const fallbackReactionId = getFallbackReactionIdFromType(
          normalizeReactionType(myReaction?.type)
        );
        setSelectedReactionId(fallbackReactionId);
        Toast.show('Unable to update reaction right now.', Toast.LONG);
      }
    } catch (e: any) {
      const fallbackReactionId = getFallbackReactionIdFromType(
        normalizeReactionType(myReaction?.type)
      );
      setSelectedReactionId(fallbackReactionId);
      Toast.show('Unable to update reaction right now.', Toast.LONG);
      console.log('saga error -- ', e.toString());
    } finally {
      isReactionUpdatingRef.current = false;
    }
  };

  const removeReactPost = async () => {
    if (isReactionUpdatingRef.current) {
      return;
    }
    isReactionUpdatingRef.current = true;
    try {
      const removeReactionRoute =
        postData.type === PostType.watch
          ? 'watch/react/remove'
          : `${postData.type}/remove-reaction`;
      const res = await ApiCall({
        route: removeReactionRoute,
        verb: 'patch',
        token,
        params: {
          postId: postData.id,
        },
      });

      if (res?.status === 200) {
        const nextReactions = Array.isArray(res.response?.reactions)
          ? (res.response.reactions as SocialPostReaction[])
          : [];
        const foundReaction = nextReactions.find((reaction) => reaction.userId === user?._id);
        setDisplayReactions(nextReactions);
        setMyReaction(foundReaction);
        onTelemetryEvent?.('post_reaction_remove', {
          postType: postData.type,
        });
      } else {
        const fallbackReactionId = getFallbackReactionIdFromType(
          normalizeReactionType(myReaction?.type)
        );
        setSelectedReactionId(fallbackReactionId);
        Toast.show('Unable to update reaction right now.', Toast.LONG);
      }
    } catch (e: any) {
      const fallbackReactionId = getFallbackReactionIdFromType(
        normalizeReactionType(myReaction?.type)
      );
      setSelectedReactionId(fallbackReactionId);
      Toast.show('Unable to update reaction right now.', Toast.LONG);
      console.log('saga error -- ', e.toString());
    } finally {
      isReactionUpdatingRef.current = false;
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
  ): Promise<boolean> => {
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
        dispatch(getuserGet({ token, pullSavedData: true }));
        Toast.show('Post saved!', Toast.SHORT);
        return true;
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    } finally {
      dispatch(setLoader(false));
    }
    Toast.show('Failed to save. Please try again.', Toast.LONG);
    return false;
  };

  const removeSavedPost = async (type?: string, link?: string, id?: string): Promise<boolean> => {
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
        dispatch(getuserGet({ token, pullSavedData: true }));
        Toast.show('Post removed from saved.', Toast.SHORT);
        return true;
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    } finally {
      dispatch(setLoader(false));
    }
    Toast.show('Failed to remove. Please try again.', Toast.LONG);
    return false;
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
    like: 0,
    love: 0,
    praying: 0,
    praise: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  };

  displayReactions.forEach((reaction) => {
    const normalizedType = normalizeReactionType(reaction.type);
    if (!normalizedType) {
      return;
    }
    if (normalizedType in reactionTypes) {
      reactionTypes[normalizedType as keyof typeof reactionTypes] += 1;
    }
  });

  const totalReactionCount =
    reactionTypes.like +
    reactionTypes.love +
    reactionTypes.praying +
    reactionTypes.praise +
    reactionTypes.haha +
    reactionTypes.wow +
    reactionTypes.sad +
    reactionTypes.angry;
  const displayCommentCount = toSafeCount(postData?.commentNumber ?? postData.comments?.length);

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
        <View style={{ flex: 1, justifyContent: 'flex-end', position: 'relative' }}>
          <View
            style={{
              position: 'absolute',
              right: spacing.x16,
              bottom: spacing.x60,
              zIndex: 8,
              alignItems: 'center',
              gap: spacing.x13,
            }}
          >
            <Pressable
              onPress={() => {
                onPress();
              }}
            >
              {userData.profileIcon && !hasResolvedAvatarImage ? (
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: borderRadius.max,
                    borderColor: '#f6f6f7',
                    borderWidth: 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(3, 47, 60, 0.35)',
                  }}
                >
                  {userData.profileIcon}
                </View>
              ) : (
                <FeedAvatar
                  uri={profileImageUri}
                  size={52}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: borderRadius.max,
                    borderColor: '#f6f6f7',
                    borderWidth: 2,
                    backgroundColor: 'rgba(3, 47, 60, 0.35)',
                  }}
                  resizeMode="cover"
                  fallbackBackgroundColor="#f6f6f7"
                  fallbackBorderColor="#f6f6f7"
                  fallbackIconColor="#126b87"
                />
              )}
            </Pressable>

            <View style={{ position: 'relative', alignItems: 'center' }}>
              <Pressable
                onLongPress={showReactionBar}
                onPress={() => {
                  if (isReactionUpdatingRef.current) {
                    return;
                  }
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
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: borderRadius.max,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(3, 47, 60, 0.42)',
                }}
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
              </Pressable>
              {isReactionBarVisible ? (
                <View
                  pointerEvents="box-none"
                  style={{
                    position: 'absolute',
                    right: spacing.x48,
                    bottom: 0,
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
              {totalReactionCount > 0 ? (
                <Pressable
                  disabled={!canViewReactions}
                  onPress={() => openReactionsModal('all')}
                  style={{ marginTop: spacing.x5 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <StyledText style={{ color: '#f6f6f7', ...fontSize.x1, fontWeight: '700' }}>
                    {totalReactionCount}
                  </StyledText>
                </Pressable>
              ) : null}
            </View>

            <Pressable
              disabled={!onCommentsPress}
              onPress={() => {
                if (onCommentsPress) {
                  onTelemetryEvent?.('post_comment_open', {
                    postType: postData.type,
                  });
                  onCommentsPress();
                }
              }}
              style={{ alignItems: 'center' }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: borderRadius.max,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(3, 47, 60, 0.42)',
                }}
              >
                <MaterialIcons name="chat-bubble-outline" size={22} color="#f6f6f7" />
              </View>
              {displayCommentCount > 0 ? (
                <StyledText
                  style={{
                    marginTop: spacing.x5,
                    color: '#f6f6f7',
                    ...fontSize.x1,
                    fontWeight: '700',
                  }}
                >
                  {displayCommentCount}
                </StyledText>
              ) : null}
            </Pressable>

            <Pressable
              disabled={!canRepost || isReposting}
              onPress={openRepostSheet}
              style={{ alignItems: 'center', opacity: !canRepost || isReposting ? 0.6 : 1 }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: borderRadius.max,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(3, 47, 60, 0.42)',
                }}
              >
                <RepeatIcon width={22} height={22} color="#f6f6f7" />
              </View>
              {displayRepostCount > 0 ? (
                <StyledText style={{ color: '#f6f6f7', ...fontSize.x1, fontWeight: '700' }}>
                  {displayRepostCount}
                </StyledText>
              ) : null}
            </Pressable>

            <Pressable
              onPress={() => {
                if (isThisPostSaved) {
                  const removePromise = postData.id
                    ? removeSavedPost(postData.type, undefined, postData.id)
                    : removeSavedPost(postData.type, postData.postlink);
                  removePromise.then((didRemove) => {
                    if (didRemove) {
                      onTelemetryEvent?.('post_save_remove', {
                        postType: postData.type,
                      });
                    }
                  });
                  return;
                }

                savePost(
                  postData?.id,
                  postData?.type,
                  postData.title,
                  created,
                  userData?._id,
                  postData?.postlink,
                  postData?.image?.url
                ).then((didSave) => {
                  if (didSave) {
                    onTelemetryEvent?.('post_save_add', {
                      postType: postData.type,
                    });
                  }
                });
              }}
              style={{ alignItems: 'center' }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: borderRadius.max,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(3, 47, 60, 0.42)',
                }}
              >
                <MaterialIcons
                  name={isThisPostSaved ? 'bookmark' : 'bookmark-border'}
                  size={22}
                  color="#f6f6f7"
                />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowOptions(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: borderRadius.max,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(3, 47, 60, 0.42)',
                }}
              >
                <FontAwesomeIcon icon={faEllipsis} color="#f6f6f7" />
              </View>
            </Pressable>
          </View>

          <View
            style={{
              paddingHorizontal: spacing.x16,
              paddingRight: spacing.x88,
              paddingBottom: spacing.x24,
            }}
          >
            <Pressable
              onPress={() => {
                onPress();
              }}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <StyledText
                style={{ flexShrink: 1, color: '#f6f6f7', fontWeight: '700', fontSize: 16 }}
                numberOfLines={1}
              >
                {formattedHandle || userData?.name || '@onebody'}
              </StyledText>
              {isApprovedInfluencer ? (
                <Icon
                  name="check-decagram"
                  size={spacing.x16}
                  style={{ marginLeft: spacing.x5 }}
                  color="#12d2d9"
                />
              ) : null}
              {created ? (
                <StyledText style={{ color: '#f6f6f7', ...fontSize.x1, marginLeft: spacing.x5 }}>
                  • {timeSince(created)} ago
                </StyledText>
              ) : null}
            </Pressable>
            {children ? <View style={{ marginTop: spacing.x8 }}>{children}</View> : null}
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
            <Pressable
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
            </Pressable>
            <Pressable
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
            </Pressable>
            <Pressable
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
            </Pressable>
          </View>
        </CustomModal>
        <PostReactionsModal
          visible={showReactionsModal}
          postType={postData.type}
          postId={postData.id}
          fallbackReactions={displayReactions}
          initialTab={reactionModalInitialTab}
          onClose={() => setShowReactionsModal(false)}
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
            <Pressable
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
              {userData.profileIcon && !hasResolvedAvatarImage ? (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.max,
                    borderColor: hasResolvedAvatarImage
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
                <FeedAvatar
                  uri={profileImageUri}
                  size={40}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.max,
                    borderColor: hasResolvedAvatarImage
                      ? brandColors.black
                      : brandColors.primaryBase,
                    borderWidth: borderWidth.thin,
                    marginRight: spacing.x10,
                  }}
                  resizeMode="contain"
                  fallbackBackgroundColor="#f6f6f7"
                  fallbackBorderColor={brandColors.primaryBase}
                  fallbackIconColor={brandColors.primaryDark}
                />
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <StyledText
                    style={{
                      flexShrink: 1,
                      color: transparency ? Colors.neutral[500] : primaryTextColor,
                      fontSize: 17,
                      fontWeight: 'bold',
                      marginBottom: isSocialPost ? 0 : 0,
                      lineHeight: isSocialPost ? 20 : undefined,
                    }}
                    numberOfLines={1}
                  >
                    {userData?.name}
                    {prayerDisplayEmoji ? ` ~ ${prayerDisplayEmoji}` : ''}
                  </StyledText>
                  {isApprovedInfluencer ? (
                    <Icon
                      name="check-decagram"
                      size={spacing.x16}
                      style={{ flexShrink: 0, marginLeft: spacing.x5 }}
                      color={brandColors.primaryDark}
                    />
                  ) : null}
                  {isSocialPost && locationLabel ? (
                    <View
                      style={{
                        flexShrink: 0,
                        marginLeft: spacing.x5,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: spacing.x5,
                        paddingVertical: 1,
                        borderRadius: borderRadius.max,
                        backgroundColor: locationPillBackground,
                        borderWidth: borderWidth.hairline,
                        borderColor: locationPillBorder,
                        minHeight: 18,
                      }}
                    >
                      <StyledText style={{ color: colors.text, fontSize: 12, lineHeight: 14 }}>
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
            </Pressable>
            <Pressable
              onPress={() => {
                setShowOptions(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FontAwesomeIcon
                icon={faEllipsisVertical}
                color={transparency ? Colors.neutral[600] : secondaryTextColor}
              />
            </Pressable>
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
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
            }}
          >
            <View style={{ position: 'relative' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                  onLongPress={showReactionBar}
                  onPress={() => {
                    if (isReactionUpdatingRef.current) {
                      return;
                    }
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
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
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
                        color={myReaction ? Colors.errorFeedback[200] : secondaryTextColor}
                      />
                    )}
                  </Animated.View>
                </Pressable>
                {totalReactionCount > 0 ? (
                  <Pressable
                    disabled={!canViewReactions}
                    onPress={() => openReactionsModal('all')}
                    style={{ marginLeft: spacing.x5, paddingHorizontal: spacing.x2 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <StyledText
                      style={{
                        color: transparency ? Colors.neutral[600] : secondaryTextColor,
                        ...fontSize.x1,
                      }}
                    >
                      {totalReactionCount}
                    </StyledText>
                  </Pressable>
                ) : null}
              </View>
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

            <Pressable
              disabled={!onCommentsPress}
              onPress={() => {
                if (onCommentsPress) {
                  onTelemetryEvent?.('post_comment_open', {
                    postType: postData.type,
                  });
                  onCommentsPress();
                }
              }}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <MaterialIcons name="chat-bubble-outline" size={22} color={secondaryTextColor} />
              {displayCommentCount > 0 ? (
                <StyledText
                  style={{
                    marginLeft: spacing.x5,
                    color: transparency ? Colors.neutral[600] : secondaryTextColor,
                    ...fontSize.x1,
                  }}
                >
                  {displayCommentCount}
                </StyledText>
              ) : null}
            </Pressable>

            {canRepost ? (
              <Pressable
                disabled={isReposting}
                onPress={openRepostSheet}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: isReposting ? 0.6 : 1,
                }}
              >
                <RepeatIcon width={22} height={22} color={repostIconColor} />
                {displayRepostCount > 0 ? (
                  <StyledText
                    style={{
                      marginLeft: spacing.x5,
                      color: transparency ? Colors.neutral[600] : secondaryTextColor,
                      ...fontSize.x1,
                    }}
                  >
                    {displayRepostCount}
                  </StyledText>
                ) : null}
              </Pressable>
            ) : null}

            <Pressable onPress={sharePost} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <SendIcon width={22} height={22} color={shareIconColor} />
            </Pressable>

            {actionBarRightAccessory ?? null}

            <Pressable
              onPress={() => {
                if (isThisPostSaved) {
                  const removePromise = postData.id
                    ? removeSavedPost(postData.type, undefined, postData.id)
                    : removeSavedPost(postData.type, postData.postlink);
                  removePromise.then((didRemove) => {
                    if (didRemove) {
                      onTelemetryEvent?.('post_save_remove', {
                        postType: postData.type,
                      });
                    }
                  });
                  return;
                }

                savePost(
                  postData?.id,
                  postData?.type,
                  postData.title,
                  created,
                  userData?._id,
                  postData?.postlink,
                  postData?.image?.url
                ).then((didSave) => {
                  if (didSave) {
                    onTelemetryEvent?.('post_save_add', {
                      postType: postData.type,
                    });
                  }
                });
              }}
            >
              <MaterialIcons
                name={isThisPostSaved ? 'bookmark' : 'bookmark-border'}
                size={22}
                color={secondaryTextColor}
              />
            </Pressable>
          </View>
        </View>

        {postData.externalLink ? (
          <Pressable
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
            </View>

            <StyledText style={{ color: brandColors.primaryDark }}>View Post</StyledText>
          </Pressable>
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
          <Pressable
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
          </Pressable>
          <Pressable
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
          </Pressable>
          <Pressable
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
          </Pressable>
        </View>
      </CustomModal>
      <PostReactionsModal
        visible={showReactionsModal}
        postType={postData.type}
        postId={postData.id}
        fallbackReactions={displayReactions}
        initialTab={reactionModalInitialTab}
        onClose={() => setShowReactionsModal(false)}
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
