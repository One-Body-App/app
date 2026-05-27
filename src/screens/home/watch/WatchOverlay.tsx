import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Share, Platform, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-simple-toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import StyledText from '@/src/components/styled/Text';
import ParsedText from '@/components/mentions/ParsedText';
import OptionsModal from '@/src/components/listItems/OptionsModal';
import PostReactionsModal from '@/components/reactions/PostReactionsModal';
import CustomModal from '@/src/components/CustomModal';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { getuserGet } from '@/src/redux/actions/UserAction';
import { ApiCall } from '@/services/api';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { borderRadius } from '@/src/styles/outlines';
import { body, fontSize } from '@/src/styles/typography';
import { spacing } from '@/src/styles/spacing';
import {
  PostType,
  ReactionDetailsTab,
  SocialPostReaction,
  SocialPostReactionType,
  WatchPost,
} from '@/utils/types';
import RepeatIcon from '@/assets/icons/repeat.svg';

type WatchOverlayProps = {
  item: WatchPost;
  commentCount: number;
  fromSavedPosts: boolean;
  parentRefreshContent?: Function;
  removePost?: (type: string, postId: string) => void;
  onCommentsPress: () => void;
  onProfilePress: () => void;
  onTelemetryEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
  progress: number;
};

type AnimatedReaction = {
  id: string;
  iconUrl: string;
};

type ReactionBarRef = {
  showReactions: () => void;
  dismissReactions: () => void;
};

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@14.0.2/assets/72x72';
const ONEBODY_APP_BASE_URL = 'https://app.onebodyapp.com';
const BRAND_ACCENT = '#12d2d9';
const BUTTON_BG = 'rgba(3, 47, 60, 0.72)';
const BUTTON_BG_ACTIVE = 'rgba(3, 47, 60, 0.9)';
const REACTION_BAR_MIN_WIDTH = 280;
const REACTION_BAR_SCALE_FACTOR = 4 / 3;
const REACTION_BAR_WIDTH = Math.round(REACTION_BAR_MIN_WIDTH * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_ICON_SIZE = Math.round(22 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_HORIZONTAL_MARGIN = Math.round(spacing.x5 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_VERTICAL_PADDING = Math.round(spacing.x8 * REACTION_BAR_SCALE_FACTOR);
const REACTION_BAR_HORIZONTAL_PADDING = Math.round(spacing.x10 * REACTION_BAR_SCALE_FACTOR);
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

const isShareDialogDismissed = (result: unknown) => {
  if (!result || typeof result !== 'object') {
    return false;
  }
  const { action } = result as { action?: unknown };
  return typeof action === 'string' && action.toLowerCase().includes('dismiss');
};

const InlineReactionBar = React.forwardRef<
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

  React.useImperativeHandle(
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
      style={[
        styles.reactionBar,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
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
});

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

const normalizeReactionType = (type?: SocialPostReactionType) => {
  if (type === SocialPostReactionType.happy) {
    return SocialPostReactionType.praise;
  }
  return type;
};

const getFallbackReactionIdFromType = (type?: SocialPostReactionType): string | undefined => {
  if (!type) return undefined;
  if (type === SocialPostReactionType.like) return 'like';
  if (type === SocialPostReactionType.love) return 'love';
  if (type === SocialPostReactionType.praying) return 'pray';
  if (type === SocialPostReactionType.praise || type === SocialPostReactionType.happy)
    return 'praise';
  if (type === SocialPostReactionType.haha) return 'haha';
  if (type === SocialPostReactionType.wow) return 'wow';
  if (type === SocialPostReactionType.sad) return 'sad';
  if (type === SocialPostReactionType.angry) return 'angry';
  return undefined;
};

const formatCompactCount = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }
  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1);
    return `${formatted.replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    const formatted = (value / 1_000).toFixed(value >= 10_000 ? 0 : 1);
    return `${formatted.replace(/\.0$/, '')}K`;
  }
  return String(Math.floor(value));
};

function WatchOverlay({
  item,
  commentCount,
  fromSavedPosts,
  parentRefreshContent,
  removePost,
  onCommentsPress,
  onProfilePress,
  onTelemetryEvent,
  progress,
}: WatchOverlayProps) {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);

  const [myReaction, setMyReaction] = useState<SocialPostReaction | undefined>();
  const [displayReactions, setDisplayReactions] = useState<SocialPostReaction[]>(
    item.reactions ?? []
  );
  const [displayRepostCount, setDisplayRepostCount] = useState<number>(
    Number.isFinite(Number((item as any)?.repostCount))
      ? Math.max(0, Math.floor(Number((item as any)?.repostCount)))
      : 0
  );
  const [showOptions, setShowOptions] = useState(false);
  const [showRepostSheet, setShowRepostSheet] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [reactionModalInitialTab, setReactionModalInitialTab] = useState<ReactionDetailsTab>('all');
  const [selectedReactionId, setSelectedReactionId] = useState<string | undefined>(undefined);
  const [isReposting, setIsReposting] = useState(false);
  const [isReactionBarVisible, setIsReactionBarVisible] = useState(false);
  const reactionBarRef = useRef<ReactionBarRef>(null);
  const mainReactionScale = useRef(new Animated.Value(1)).current;
  const isReactionUpdatingRef = useRef(false);
  const incomingRepostCount = Number.isFinite(Number((item as any)?.repostCount))
    ? Math.max(0, Math.floor(Number((item as any)?.repostCount)))
    : 0;

  useEffect(() => {
    setDisplayReactions(item.reactions ?? []);
  }, [item.id, item.postId, item._id, item.reactions]);

  useEffect(() => {
    setDisplayRepostCount(incomingRepostCount);
  }, [incomingRepostCount, item.id, item.postId, item._id]);

  useEffect(() => {
    let nextReaction: SocialPostReaction | undefined;
    (item.reactions ?? []).forEach((reaction) => {
      if (reaction.userId === user?._id) {
        nextReaction = reaction;
      }
    });
    setMyReaction(nextReaction);
  }, [item.reactions, user?._id]);

  useEffect(() => {
    setSelectedReactionId(getFallbackReactionIdFromType(normalizeReactionType(myReaction?.type)));
  }, [myReaction?.type]);

  const totalReactionCount = useMemo(() => {
    return (displayReactions ?? []).reduce((count, reaction) => {
      return normalizeReactionType(reaction.type) ? count + 1 : count;
    }, 0);
  }, [displayReactions]);

  const isSaved = useMemo(() => {
    if (item.id && user?.savedPost?.some((savedPost) => savedPost.postId === item.id)) {
      return true;
    }
    const postId = item.postId ?? item.id ?? item._id;
    return Boolean(postId && user?.savedPost?.some((savedPost) => savedPost.postId === postId));
  }, [item.id, item.postId, item._id, user?.savedPost]);

  const isOwnPost = item.userData?._id === user?._id;
  const isFollowingCreator = Boolean(
    item.userData?._id && user?.following?.includes(item.userData._id)
  );
  const shouldShowFollowBadge = !isOwnPost && !isFollowingCreator;
  const profileImage =
    item.userData?.profileImage && item.userData.profileImage !== ''
      ? item.userData.profileImage
      : NO_PROFILE_IMAGE;
  const shouldShowCaption = Boolean(item.content?.trim());
  const handle = item.userData?.username
    ? `@${item.userData.username}`
    : (item.userData?.name ?? '@onebody');
  const audioLabel = item.title?.trim() || item.link?.trim() || '';

  const dismissReactionBar = useCallback(() => {
    reactionBarRef.current?.dismissReactions();
  }, []);

  const animateReaction = useCallback(() => {
    mainReactionScale.setValue(1);
    Animated.sequence([
      Animated.timing(mainReactionScale, {
        toValue: 1.18,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(mainReactionScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mainReactionScale]);

  const triggerReactionFeedback = useCallback(
    (type?: SocialPostReactionType) => {
      if (!type) return;
      ReactNativeHapticFeedback.trigger('impactMedium', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      animateReaction();
    },
    [animateReaction]
  );

  const reactPost = useCallback(
    async (type?: SocialPostReactionType) => {
      if (isReactionUpdatingRef.current) return;
      isReactionUpdatingRef.current = true;
      try {
        const normalizedType = normalizeReactionType(type) ?? SocialPostReactionType.love;
        const res = await ApiCall({
          route: 'watch/react',
          verb: 'patch',
          token,
          params: {
            postId: item.id ?? item.postId ?? item._id,
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
            postType: PostType.watch,
            reactionType: normalizedType,
          });
          return;
        }

        setSelectedReactionId(
          getFallbackReactionIdFromType(normalizeReactionType(myReaction?.type))
        );
        Toast.show('Unable to update reaction right now.', Toast.LONG);
      } catch (_error) {
        setSelectedReactionId(
          getFallbackReactionIdFromType(normalizeReactionType(myReaction?.type))
        );
        Toast.show('Unable to update reaction right now.', Toast.LONG);
      } finally {
        isReactionUpdatingRef.current = false;
      }
    },
    [item.id, item.postId, item._id, myReaction?.type, onTelemetryEvent, token, user?._id]
  );

  const removeReactPost = useCallback(async () => {
    if (isReactionUpdatingRef.current) return;
    isReactionUpdatingRef.current = true;
    try {
      const res = await ApiCall({
        route: 'watch/react/remove',
        verb: 'patch',
        token,
        params: {
          postId: item.id ?? item.postId ?? item._id,
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
          postType: PostType.watch,
        });
        return;
      }

      setSelectedReactionId(getFallbackReactionIdFromType(normalizeReactionType(myReaction?.type)));
      Toast.show('Unable to update reaction right now.', Toast.LONG);
    } catch (_error) {
      setSelectedReactionId(getFallbackReactionIdFromType(normalizeReactionType(myReaction?.type)));
      Toast.show('Unable to update reaction right now.', Toast.LONG);
    } finally {
      isReactionUpdatingRef.current = false;
    }
  }, [item.id, item.postId, item._id, myReaction?.type, onTelemetryEvent, token, user?._id]);

  const handleAnimatedReactionSelect = useCallback(
    async (reaction: AnimatedReaction) => {
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
    },
    [myReaction?.type, reactPost, removeReactPost, triggerReactionFeedback]
  );

  const showReactionBar = useCallback(() => {
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
  }, []);

  const toggleSave = useCallback(async () => {
    dispatch(setLoader(true));
    try {
      const params = {
        postId: item.id ?? item.postId ?? item._id,
        type: PostType.watch,
        title: item.title,
        image: undefined,
        createdAt: item.created,
        userId: item.userData?._id,
        link: item.link,
      };

      if (isSaved) {
        const result = await ApiCall({
          route: 'user/remove-saved-post',
          verb: 'delete',
          token,
          params: {
            id: item.id ?? item.postId ?? item._id,
            type: PostType.watch,
            link: item.link,
          },
        });
        if (result?.status === 200) {
          onTelemetryEvent?.('post_save_remove', { postType: PostType.watch });
        } else {
          throw new Error('save-remove-failed');
        }
      } else {
        const result = await ApiCall({
          route: 'user/save-post',
          verb: 'post',
          token,
          params,
        });
        if (result?.status === 200) {
          onTelemetryEvent?.('post_save_add', { postType: PostType.watch });
        } else {
          throw new Error('save-add-failed');
        }
      }
      dispatch(getuserGet({ token, pullSavedData: true }));
    } catch (_error) {
      Toast.show('Unable to update saved posts right now.', Toast.LONG);
    } finally {
      dispatch(setLoader(false));
    }
  }, [
    dispatch,
    fromSavedPosts,
    isSaved,
    item.created,
    item.id,
    item.link,
    item.postId,
    item.title,
    item.userData?._id,
    item._id,
    onTelemetryEvent,
    token,
  ]);

  const openReactionsModal = useCallback((initialTab: ReactionDetailsTab = 'all') => {
    setReactionModalInitialTab(initialTab);
    setShowReactionsModal(true);
  }, []);

  const openRepostSheet = useCallback(() => {
    setShowRepostSheet(true);
  }, []);

  const repostNow = useCallback(async () => {
    if (isReposting) {
      return;
    }

    setIsReposting(true);
    try {
      const res = await ApiCall({
        route: 'social/repost',
        verb: 'post',
        token,
        params: {
          sourceType: PostType.social,
          sourceId: item.id ?? item.postId ?? item._id,
        },
      });

      if (res?.status === 200) {
        setDisplayRepostCount((previous) => previous + 1);
        setShowRepostSheet(false);
        onTelemetryEvent?.('post_repost', {
          postType: PostType.watch,
          repostType: 'repost',
          sourceType: PostType.social,
        });
        parentRefreshContent?.();
        Toast.show('Post reposted to your feed', Toast.LONG);
        return;
      }

      Toast.show('Unable to repost right now. Please try again.', Toast.LONG);
    } catch (_error) {
      Toast.show('Unable to repost right now. Please try again.', Toast.LONG);
    } finally {
      setIsReposting(false);
    }
  }, [isReposting, item.id, item.postId, item._id, onTelemetryEvent, parentRefreshContent, token]);

  const openQuoteComposer = useCallback(() => {
    setShowRepostSheet(false);
    onTelemetryEvent?.('post_quote_create', {
      postType: PostType.watch,
      repostType: 'quote',
      sourceType: PostType.social,
    });
    navigation.navigate('Post', {
      repostDraft: {
        sourceType: 'social',
        sourceId: String(item.id ?? item.postId ?? item._id ?? ''),
        sourcePreview: {
          title: item.title,
          content: item.content,
          link: item.link,
        },
      },
    });
  }, [
    item.content,
    item.id,
    item.link,
    item.postId,
    item.title,
    item._id,
    navigation,
    onTelemetryEvent,
  ]);

  const sharePost = useCallback(async () => {
    const postId = item.id ?? item.postId ?? item._id;
    const linkToShare = postId
      ? `${ONEBODY_APP_BASE_URL}/post/${PostType.watch}/${postId}`
      : (item.link ?? '');
    if (!linkToShare) {
      return;
    }
    onTelemetryEvent?.('post_share_initiated', {
      postType: PostType.watch,
    });
    try {
      const result = await Share.share({
        title: item.title ?? '',
        url: Platform.OS === 'ios' ? linkToShare : '',
        message: Platform.OS === 'android' ? linkToShare : linkToShare,
      });
      onTelemetryEvent?.('post_share_completed', {
        postType: PostType.watch,
        result: isShareDialogDismissed(result) ? 'cancel' : 'success',
      });
    } catch (_error) {
      onTelemetryEvent?.('post_share_completed', {
        postType: PostType.watch,
        result: 'fail',
      });
    }
  }, [item.id, item.link, item.postId, item.title, item._id, onTelemetryEvent]);

  const selectedReactionIconUrl =
    selectedReactionId &&
    Object.prototype.hasOwnProperty.call(REACTION_ICON_URLS, selectedReactionId)
      ? REACTION_ICON_URLS[selectedReactionId]
      : undefined;

  const actionRailBottom = insets.bottom + 96;
  const captionBottom = insets.bottom + 24;
  const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(progress, 1)) : 0;

  return (
    <>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', 'rgba(0,0,0,0.16)', 'rgba(0,0,0,0.88)']}
          style={[
            styles.bottomGradient,
            {
              bottom: 0,
            },
          ]}
        />

        <View
          pointerEvents="box-none"
          style={[
            styles.actionRail,
            {
              bottom: actionRailBottom,
            },
          ]}
        >
          <Pressable onPress={onProfilePress} style={styles.avatarWrap}>
            <FastImage source={{ uri: profileImage }} style={styles.avatar} resizeMode="cover" />
            {shouldShowFollowBadge ? (
              <View style={styles.followBadge}>
                <MaterialIcons name="add" size={16} color="#032f3c" />
              </View>
            ) : null}
          </Pressable>

          <View style={styles.reactionRailSlot}>
            <Pressable
              onLongPress={showReactionBar}
              delayLongPress={180}
              onPress={async () => {
                if (isReactionUpdatingRef.current) {
                  return;
                }
                dismissReactionBar();
                if (myReaction) {
                  setSelectedReactionId(undefined);
                  await removeReactPost();
                  return;
                }
                setSelectedReactionId('love');
                triggerReactionFeedback(SocialPostReactionType.love);
                await reactPost(SocialPostReactionType.love);
              }}
              style={styles.actionPill}
            >
              <Animated.View style={{ transform: [{ scale: mainReactionScale }] }}>
                {selectedReactionIconUrl ? (
                  <Image source={{ uri: selectedReactionIconUrl }} style={styles.reactionEmoji} />
                ) : (
                  <MaterialIcons
                    name={myReaction ? 'favorite' : 'favorite-border'}
                    size={34}
                    color={myReaction ? '#ffffff' : '#ffffff'}
                  />
                )}
              </Animated.View>
            </Pressable>
            {totalReactionCount > 0 ? (
              <Pressable onPress={() => openReactionsModal('all')}>
                <StyledText style={styles.actionCount}>
                  {formatCompactCount(totalReactionCount)}
                </StyledText>
              </Pressable>
            ) : null}
            {isReactionBarVisible ? (
              <View pointerEvents="box-none" style={styles.reactionBarSlot}>
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

          <Pressable onPress={onCommentsPress} style={styles.actionRailItem}>
            <View style={styles.actionPill}>
              <MaterialIcons name="chat-bubble-outline" size={32} color="#ffffff" />
            </View>
            {commentCount > 0 ? (
              <StyledText style={styles.actionCount}>{formatCompactCount(commentCount)}</StyledText>
            ) : null}
          </Pressable>

          <Pressable onPress={openRepostSheet} style={styles.actionRailItem}>
            <View style={styles.actionPill}>
              <RepeatIcon width={30} height={30} color="#ffffff" />
            </View>
            {displayRepostCount > 0 ? (
              <StyledText style={styles.actionCount}>
                {formatCompactCount(displayRepostCount)}
              </StyledText>
            ) : null}
          </Pressable>

          <Pressable onPress={toggleSave} style={styles.actionRailItem}>
            <View style={styles.actionPill}>
              <MaterialIcons
                name={isSaved ? 'bookmark' : 'bookmark-border'}
                size={32}
                color="#ffffff"
              />
            </View>
          </Pressable>

          <Pressable onPress={() => setShowOptions(true)} style={styles.actionRailItem}>
            <View style={[styles.actionPill, styles.morePill]}>
              <FontAwesomeIcon icon={faEllipsis} color="#ffffff" size={22} />
            </View>
          </Pressable>
        </View>

        {shouldShowCaption ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.captionWrap,
              {
                bottom: captionBottom,
              },
            ]}
          >
            <Pressable onPress={onProfilePress} style={styles.handleRow}>
              <StyledText style={styles.handleText}>{handle}</StyledText>
              {item.userData?.isApprovedInfluencer ? (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={18}
                  color={BRAND_ACCENT}
                  style={{ marginLeft: spacing.x8 }}
                />
              ) : null}
            </Pressable>

            <ParsedText
              text={item.content.trim()}
              mentions={item.mentions}
              textStyle={styles.captionText}
              numberOfLines={4}
            />

            {audioLabel ? (
              <View style={styles.audioRow}>
                <MaterialCommunityIcons name="music-note" size={18} color="#ffffff" />
                <StyledText numberOfLines={1} style={styles.audioText}>
                  {audioLabel}
                </StyledText>
              </View>
            ) : null}
          </View>
        ) : null}

        <View pointerEvents="none" style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${safeProgress * 100}%` }]} />
        </View>
      </View>

      <OptionsModal
        show={showOptions}
        setShow={setShowOptions}
        currentPopupItem={{
          id: item.id ?? item.postId ?? item._id,
          type: PostType.watch,
          postlink: item.link,
          title: item.title,
          created: item.created,
          externalLink: item.link,
          reactions: displayReactions,
          myReaction,
          userData: item.userData,
        }}
        hideSavePost={false}
        removePost={removePost}
      />

      <CustomModal
        modalVisible={showRepostSheet}
        onclose={() => {
          if (!isReposting) {
            setShowRepostSheet(false);
          }
        }}
        style={styles.repostSheet}
      >
        <View style={{ paddingTop: spacing.x10, alignItems: 'center' }}>
          <View style={styles.sheetGrabber} />
        </View>
        <View style={styles.sheetContent}>
          <Pressable
            disabled={isReposting}
            onPress={repostNow}
            style={[styles.sheetRow, isReposting ? { opacity: 0.6 } : null]}
          >
            <View style={styles.sheetIcon}>
              <RepeatIcon width={22} height={22} color="#126b87" />
            </View>
            <View style={{ marginLeft: spacing.x13, flex: 1 }}>
              <StyledText style={styles.sheetTitle}>Repost</StyledText>
              <StyledText style={styles.sheetSubtitle}>
                Instantly share this post to your feed
              </StyledText>
            </View>
          </Pressable>
          <Pressable
            disabled={isReposting}
            onPress={openQuoteComposer}
            style={[styles.sheetRow, isReposting ? { opacity: 0.6 } : null]}
          >
            <View style={styles.sheetIcon}>
              <MaterialIcons name="format-quote" size={24} color="#126b87" />
            </View>
            <View style={{ marginLeft: spacing.x13, flex: 1 }}>
              <StyledText style={styles.sheetTitle}>Quote Post</StyledText>
              <StyledText style={styles.sheetSubtitle}>
                Add your own thoughts before sharing
              </StyledText>
            </View>
          </Pressable>
          <Pressable onPress={sharePost} style={styles.sheetRow}>
            <View style={styles.sheetIcon}>
              <MaterialCommunityIcons name="share-variant-outline" size={24} color="#126b87" />
            </View>
            <View style={{ marginLeft: spacing.x13, flex: 1 }}>
              <StyledText style={styles.sheetTitle}>Share Link</StyledText>
              <StyledText style={styles.sheetSubtitle}>
                Send this watch post outside the app
              </StyledText>
            </View>
          </Pressable>
          <Pressable
            disabled={isReposting}
            onPress={() => setShowRepostSheet(false)}
            style={styles.cancelButton}
          >
            <StyledText style={styles.cancelButtonText}>Cancel</StyledText>
          </Pressable>
        </View>
      </CustomModal>

      <PostReactionsModal
        visible={showReactionsModal}
        postType={PostType.watch}
        postId={item.id ?? item.postId ?? item._id}
        fallbackReactions={displayReactions}
        initialTab={reactionModalInitialTab}
        onClose={() => setShowReactionsModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOpacity: 0.85,
    shadowRadius: 80,
    shadowOffset: { width: 0, height: 48 },
  },
  actionRail: {
    position: 'absolute',
    right: spacing.x16,
    alignItems: 'center',
    zIndex: 30,
  },
  avatarWrap: {
    marginBottom: spacing.x16,
    alignItems: 'center',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: BUTTON_BG,
  },
  followBadge: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  actionRailItem: {
    alignItems: 'center',
    marginBottom: spacing.x16,
  },
  reactionRailSlot: {
    alignItems: 'center',
    marginBottom: spacing.x16,
  },
  actionPill: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BUTTON_BG,
  },
  morePill: {
    backgroundColor: BUTTON_BG_ACTIVE,
  },
  actionCount: {
    ...body.x3M,
    color: '#f6f6f7',
    marginTop: spacing.x8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  reactionBarSlot: {
    position: 'absolute',
    right: 70,
    top: 8,
    zIndex: 40,
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.max,
    paddingVertical: REACTION_BAR_VERTICAL_PADDING,
    paddingHorizontal: REACTION_BAR_HORIZONTAL_PADDING,
    minWidth: REACTION_BAR_WIDTH,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  reactionEmoji: {
    width: 24,
    height: 24,
  },
  captionWrap: {
    position: 'absolute',
    left: spacing.x16,
    right: 108,
    zIndex: 25,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.x8,
  },
  handleText: {
    ...body.x4M,
    color: '#f6f6f7',
    fontWeight: '700',
  },
  captionText: {
    ...body.x4,
    color: '#f6f6f7',
    lineHeight: 34,
  },
  audioRow: {
    marginTop: spacing.x16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioText: {
    ...body.x3M,
    color: '#f6f6f7',
    marginLeft: spacing.x8,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: 35,
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_ACCENT,
  },
  repostSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: 280,
  },
  sheetGrabber: {
    width: 44,
    height: 4,
    borderRadius: borderRadius.max,
    backgroundColor: '#d7dee3',
  },
  sheetContent: {
    paddingHorizontal: spacing.x20,
    paddingVertical: spacing.x16,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.x10,
  },
  sheetIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 107, 135, 0.12)',
  },
  sheetTitle: {
    ...fontSize.x4,
    color: '#032f3c',
    fontWeight: '700',
  },
  sheetSubtitle: {
    ...body.x2,
    color: '#4f8596',
  },
  cancelButton: {
    marginTop: spacing.x16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.x10,
  },
  cancelButtonText: {
    ...fontSize.x4,
    color: '#126b87',
    fontWeight: '700',
  },
});

export default React.memo(WatchOverlay);
