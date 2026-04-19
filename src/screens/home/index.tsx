import React, { useCallback, useLayoutEffect, useRef, useState, memo, useMemo, JSX } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  ViewToken,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
  ListRenderItem,
  Platform,
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewStyle,
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { useSelector } from 'react-redux';
import {
  CompositeScreenProps,
  useNavigation,
  useTheme,
  useScrollToTop,
  DrawerActions,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from '@react-native-community/blur';
import { StackScreenProps } from '@react-navigation/stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  Message,
  Send2,
  ArchiveMinus,
  More,
  Gallery,
  ArrowDown2,
  Notification,
} from 'iconsax-react-native';
import { useTabBarAnimation } from '@/navigator/TabBarAnimationContext';
import {
  getTabRootSpringboardPreset,
  HOME_FEED_LIST_BATCH_CONFIG,
  SHOULD_RUN_HOME_FEED_INTRO,
} from '@/src/navigator/motionPolicy';
import { useRootTabSwitchReplayToken } from '@/src/navigator/RootTabTransitionContext';
import useSpringboardEntry from '@/src/hooks/useSpringboardEntry';
import useMountEffect from '@/src/hooks/useMountEffect';
import useObservedEffect from '@/src/hooks/useObservedEffect';

import styles from './styles';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';

import StyledText from '@/components/styled/Text';
import ArticleItem from '@/components/listItems/ArticleItem';
import SocialItem from '@/components/listItems/SocialItem';
import PrayerItem from '@/components/listItems/PrayerItem';
import FeedAvatar from '@/components/avatar/FeedAvatar';
import { resolveFeedAvatarUri, resolveProfileAvatarUri } from '@/components/avatar/feedAvatarUtils';
import { AccountType, ArticleType, PostType, PrayerPost, SocialPost, User } from '@/utils/types';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import useScrollIntentLock from '@/src/hooks/useScrollIntentLock';
import { getHeight } from '@/utils/ResponsiveFun';
import Logo from '@/assets/icons/logo.svg';
import LogoWhite from '@/assets/icons/logo_white.svg';
import ArrowUpIcon from '@/assets/icons/arrow-up.svg';
import ProfileFill from '@/assets/svg/ProfileFill.svg';
import WallComponent from '@/components/prayerWallComponent';
import HeaderGradientOverlay from '@/components/HeaderGradientOverlay';
import useSharedImageViewer from '@/components/imageViewer/useSharedImageViewer';
import { flushFeedTelemetry, setFeedTelemetryAuthToken } from '@/services/feedTelemetry';
import {
  deleteOwnedPost,
  emitOwnedPostDeleted,
  normalizeOwnedPostType,
  subscribeToFeedItemUnavailable,
  subscribeToOwnedPostDeleted,
} from '@/services/ownedPostDeletion';
import {
  createPostTelemetryRequestId,
  maybeTrackQualifiedPostView,
  trackPostTelemetry,
  type CanonicalPostTelemetryEventName,
  type PostTelemetryEventInput,
  type PostTelemetrySurface,
} from '@/services/postTelemetry';

import {
  HomeStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MainStackParamList,
} from '@/src/navigator/types';
import {
  DEFAULT_REFRESH_DEBOUNCE_MS,
  isSameIdentitySequence,
  reorderFeedEntriesForRefresh,
  shouldSkipRefreshTrigger,
} from './feedRefreshUtils';
import {
  buildQuickPostContent,
  getQuickPostErrorMessage,
  moderateQuickPostText,
  QUICK_POST_PENDING_REVIEW_MESSAGE,
} from './quickPost';
import type { RefreshTrigger } from './feedRefreshUtils';
import { resolveVideoMetadata } from '@/src/components/video/universalVideoLayout';

// --- BRAND HEX CODES ---
const BRAND = {
  gray100: '#e6eaec',
  gray200: '#cdd5d8',
  gray400: '#9aacb1',
  gray800: '#355963',
  black: '#032f3c',
  cardDark: '#3c4b64',
  white: '#FFFFFF',
  primary: '#41899f',
  primaryDark: '#126b87',
  accentBase: '#41dbe1',
  accentDark: '#12d2d9',
  primaryBase: '#41899f',
};
// --- TYPES ---
type FeedPost = (ArticleType | SocialPost) & {
  type?: 'social' | 'posts' | 'watch';
  body?: string;
  content?: string;
  postId?: string;
  playBackId?: string;
  mediaType?: string;
  aspectRatio?: number;
  aspect_ratio?: string;
  videoWidth?: number;
  videoHeight?: number;
  authorName?: string;
  authorAvatar?: string;
  source?: string | { name: string };
  user?: {
    name?: string;
    profileImage?: string;
    avatar?: string;
    profile_image?: string;
  };
  media?: { url: string; type?: string }[];
  image?: ArticleType['image'] | string;
  imageUrl?: string;
  mediaUrl?: string;
  images?: string[];
  likesCount?: number;
  commentsCount?: number;
  timestamp?: string;
};

type TasteBreakerItem = {
  type: 'tasteBreaker';
  items: FeedPost[];
  id?: string | number;
};

type RelatedContentItem = {
  type: 'relatedContent';
  item: FeedPost;
};

type FeedEntry = FeedPost | TasteBreakerItem | RelatedContentItem | PrayerPost;
type SuggestionsModuleType = 'peopleYouMayKnow' | 'suggestedForYou';
type SuggestionsModuleItem = {
  type: 'suggestionsModule';
  moduleType: SuggestionsModuleType;
  id: string;
};
type RenderFeedEntry = FeedEntry | SuggestionsModuleItem;

type HomeTelemetryPayload = {
  postId: string;
  postType?: string;
  contentType?: string;
  tags?: string[];
  authorId?: string;
  isRepost?: boolean;
  privacyState?: string;
};

type FeedVisibleTelemetryRecord = {
  feedType: FeedTypes;
  payload: HomeTelemetryPayload;
  rankPosition: number;
  requestId: string;
  startedAt: number;
};

type UserProfile = User & { avatar?: string; profile_image?: string };

export enum FeedTypes {
  Connected = 'connected',
  ForYou = 'foryou',
  Read = 'read',
  Pray = 'pray',
  Watch = 'watch',
}

type TelemetryTrackedFeedType =
  | FeedTypes.Connected
  | FeedTypes.ForYou
  | FeedTypes.Read
  | FeedTypes.Pray
  | FeedTypes.Watch;

const isTelemetryTrackedFeedType = (feedType: FeedTypes): feedType is TelemetryTrackedFeedType =>
  feedType === FeedTypes.Connected ||
  feedType === FeedTypes.ForYou ||
  feedType === FeedTypes.Read ||
  feedType === FeedTypes.Pray ||
  feedType === FeedTypes.Watch;

const isPrimarySocialFeedType = (feedType: FeedTypes) =>
  feedType === FeedTypes.Connected || feedType === FeedTypes.ForYou;

const normalizeTelemetryTags = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (item && typeof item === 'object') {
        const candidate = item as { name?: string; _id?: string | number; id?: string | number };
        return (
          candidate.name ??
          (candidate._id !== undefined ? String(candidate._id) : undefined) ??
          (candidate.id !== undefined ? String(candidate.id) : undefined)
        );
      }
      return undefined;
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 32);
};

const getObjectField = (value: unknown, key: string): unknown => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return (value as Record<string, unknown>)[key];
};

const getFeedTitleText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  const nestedAnchor = getObjectField(value, 'a');
  const nestedText = getObjectField(nestedAnchor, '$text');
  return typeof nestedText === 'string' ? nestedText : '';
};

const getFeedPostId = (item: FeedPost) => {
  if (item.postId) return item.postId;
  if (item.id) return String(item.id);
  const fallbackId = '_id' in item ? item._id : undefined;
  return fallbackId ? String(fallbackId) : undefined;
};

const normalizedFeedImageCache = new WeakMap<FeedPost, FeedPost>();
const normalizedWatchFeedItemCache = new WeakMap<
  FeedPost,
  SocialPost & { type?: 'watch'; playBackId?: string }
>();
const normalizedSocialFeedItemCache = new WeakMap<FeedPost, SocialPost & { type?: 'social' }>();
const normalizedRssFeedItemCache = new WeakMap<FeedPost, ArticleType>();

const unwrapFeedItem = (entry: FeedEntry): FeedPost | PrayerPost | null => {
  if ('type' in entry && entry.type === 'tasteBreaker') {
    return entry.items?.[0] ?? null;
  }
  if ('type' in entry && entry.type === 'relatedContent') {
    return entry.item ?? null;
  }
  return entry;
};

const normalizeFeedImage = (entry: FeedPost): FeedPost => {
  if (typeof entry.image !== 'string') {
    return entry;
  }

  const cachedEntry = normalizedFeedImageCache.get(entry);
  if (cachedEntry) {
    return cachedEntry;
  }

  const normalizedEntry = { ...entry, image: { url: entry.image } };
  normalizedFeedImageCache.set(entry, normalizedEntry);
  return normalizedEntry;
};

const buildWatchFeedItem = (entry: FeedPost) => {
  const cachedEntry = normalizedWatchFeedItemCache.get(entry);
  if (cachedEntry) {
    return cachedEntry;
  }

  const watchBody = 'body' in entry ? entry.body : undefined;
  const normalizedEntry = {
    ...entry,
    type: 'watch' as const,
    mediaType: entry.mediaType ?? 'video',
    mediaUrl:
      entry.mediaUrl ||
      (entry.playBackId ? `https://stream.mux.com/${entry.playBackId}.m3u8` : undefined),
    content: entry.content || watchBody || getFeedTitleText(entry.title) || '',
    reactions: entry.reactions ?? [],
  } as SocialPost & { type?: 'watch'; playBackId?: string };

  normalizedWatchFeedItemCache.set(entry, normalizedEntry);
  return normalizedEntry;
};

const buildSocialFeedItem = (entry: FeedPost) => {
  const cachedEntry = normalizedSocialFeedItemCache.get(entry);
  if (cachedEntry) {
    return cachedEntry;
  }

  const socialBody = 'body' in entry ? entry.body : undefined;
  const normalizedEntry = {
    ...entry,
    type: 'social' as const,
    content: entry.content || socialBody || getFeedTitleText(entry.title) || '',
    reactions: entry.reactions ?? [],
  } as SocialPost & { type?: 'social' };

  normalizedSocialFeedItemCache.set(entry, normalizedEntry);
  return normalizedEntry;
};

const buildRssFeedItem = (entry: FeedPost) => {
  const cachedEntry = normalizedRssFeedItemCache.get(entry);
  if (cachedEntry) {
    return cachedEntry;
  }

  const normalizedEntry = {
    ...entry,
    image: typeof entry.image === 'string' ? { url: entry.image } : entry.image,
    reactions: entry.reactions ?? [],
  } as ArticleType;

  normalizedRssFeedItemCache.set(entry, normalizedEntry);
  return normalizedEntry;
};

const isPrayerPost = (entry: FeedPost | PrayerPost): entry is PrayerPost =>
  'category' in entry && 'commentNumber' in entry;

const isSocialPost = (entry: FeedPost): entry is SocialPost & { type?: 'social' } =>
  entry.type === 'social';

const isWatchPost = (
  entry: FeedPost
): entry is SocialPost & { type?: 'watch'; playBackId?: string } =>
  entry.type === 'watch' || (typeof entry.playBackId === 'string' && entry.playBackId.length > 0);

const isHomeWatchPortalEligible = (entry: FeedPost) =>
  resolveVideoMetadata({
    aspect_ratio: entry.aspect_ratio,
    aspectRatio: entry.aspectRatio,
    videoWidth: entry.videoWidth,
    videoHeight: entry.videoHeight,
  }).isNineBySixteen;

const isLikelySocialPost = (entry: FeedPost) => {
  if (isWatchPost(entry)) {
    return false;
  }
  const entryId = entry.postId || ('_id' in entry ? entry._id : undefined);
  return Boolean(
    (entry.content || entry.body || getFeedTitleText(entry.title)) && entryId && entry.userData
  );
};

const isRssPost = (entry: FeedPost): entry is ArticleType & { type?: 'posts' } =>
  entry.type === 'posts';

type FeedOptions = {
  type: FeedTypes;
  page: number;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<RenderFeedEntry>);

const mainTabs = [
  { label: 'Feed', value: FeedTypes.Connected },
  { label: 'Read', value: FeedTypes.Read },
  { label: 'Pray', value: FeedTypes.Pray },
  { label: 'Watch', value: FeedTypes.Watch },
];

const FEED_INTRO_HEADER_DURATION_MS = 260;
const FEED_INTRO_CARDS_DELAY_MS = 140;
const FEED_INTRO_CARD_DURATION_MS = 240;
const FEED_INTRO_CARD_STAGGER_MS = 75;
const FEED_INTRO_MAX_VISIBLE_CARDS = 5;
const SUGGESTION_INTERVAL = 15;
const MAX_SUGGESTIONS_VISIBLE = 7;
const SUGGESTIONS_FETCH_SIZE = 24;
const FEED_STALE_MS = 60 * 1000;
const FEED_REFRESH_DEBOUNCE_MS = DEFAULT_REFRESH_DEBOUNCE_MS;

type FeedRefreshReason =
  | 'manual_pull'
  | 'focus_stale'
  | 'route_refresh'
  | 'tab_switch'
  | 'initial_load'
  | 'pagination';

type FeedRefreshRequestContext = {
  reason: FeedRefreshReason;
  forceNetwork: boolean;
  allowReorder: boolean;
  refreshSeed: number;
  preserveExistingOnError: boolean;
};

const isSuggestionsModuleItem = (entry: RenderFeedEntry): entry is SuggestionsModuleItem =>
  'type' in entry && entry.type === 'suggestionsModule';

const extractPrayerEntries = (payload: unknown): PrayerPost[] => {
  if (Array.isArray(payload)) return payload as PrayerPost[];
  if (Array.isArray((payload as { content?: unknown })?.content)) {
    return (payload as { content: PrayerPost[] }).content;
  }
  if (Array.isArray((payload as { data?: unknown })?.data)) {
    return (payload as { data: PrayerPost[] }).data;
  }
  return [];
};

const readEntryId = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const candidate = value as {
    postId?: string | number;
    id?: string | number;
    _id?: string | number;
  };
  const rawId = candidate.postId ?? candidate.id ?? candidate._id;
  if (rawId === undefined || rawId === null) {
    return undefined;
  }
  return String(rawId);
};

const getFeedEntryIdentity = (entry: FeedEntry): string | null => {
  if (!entry) {
    return null;
  }

  if ('type' in entry && entry.type === 'tasteBreaker') {
    const first = entry.items?.[0];
    const firstId = readEntryId(first);
    return firstId ? `tasteBreaker:${String(firstId)}` : null;
  }

  if ('type' in entry && entry.type === 'relatedContent') {
    const relatedId = readEntryId(entry.item);
    return relatedId ? `related:${String(relatedId)}` : null;
  }

  if ('type' in entry) {
    const postId = readEntryId(entry);
    if (postId) {
      return `${entry.type ?? 'entry'}:${String(postId)}`;
    }
  }

  const prayerId = readEntryId(entry);
  return prayerId ? `prayer:${String(prayerId)}` : null;
};

const getRenderEntryIdentity = (entry: RenderFeedEntry): string | null => {
  if (isSuggestionsModuleItem(entry)) {
    return `suggestion:${entry.moduleType}:${entry.id}`;
  }
  return getFeedEntryIdentity(entry as FeedEntry);
};

const mergeUniqueFeedEntries = (previous: FeedEntry[], incoming: FeedEntry[]) => {
  const merged = [...previous];
  const positions = new Map<string, number>();

  merged.forEach((entry, index) => {
    positions.set(getFeedEntryIdentity(entry) ?? `fallback:prev:${index}`, index);
  });

  incoming.forEach((entry, index) => {
    const identity = getFeedEntryIdentity(entry) ?? `fallback:next:${index}`;
    const existingIndex = positions.get(identity);
    if (existingIndex === undefined) {
      positions.set(identity, merged.length);
      merged.push(entry);
      return;
    }
    // Prefer fresh incoming payload over stale existing copy.
    merged[existingIndex] = entry;
  });

  return merged;
};

type PrayerWallTabsProps = {
  topInset: number;
  bottomInset: number;
  onNewPrayerPress: () => void;
  onOpenPost: (postId: string) => void;
  onEditPost: (postId: string) => void;
  wallRefreshSignal: number;
};

function PrayerWallTabs({
  topInset,
  bottomInset,
  onNewPrayerPress,
  onOpenPost,
  onEditPost,
  wallRefreshSignal,
}: PrayerWallTabsProps) {
  const isIOS = Platform.OS === 'ios';
  const { dark } = useTheme();
  const [localWallRefreshSignal, setLocalWallRefreshSignal] = useState(0);
  const previousWallRefreshSignalRef = useRef<number | undefined>(wallRefreshSignal);
  const refreshWallFeed = useCallback(() => {
    setLocalWallRefreshSignal((previous) => previous + 1);
  }, []);

  useObservedEffect(() => {
    if (previousWallRefreshSignalRef.current === wallRefreshSignal) {
      return;
    }
    previousWallRefreshSignalRef.current = wallRefreshSignal;
    refreshWallFeed();
  });
  const shareButtonStyle = isIOS
    ? {
        position: 'absolute' as const,
        bottom: spacing.x30,
        alignSelf: 'center' as const,
        alignItems: 'center' as const,
        paddingVertical: 0,
        backgroundColor: 'transparent',
      }
    : {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center' as const,
        paddingVertical: spacing.x10,
        backgroundColor: dark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)',
      };

  return (
    <View style={{ flex: 1, paddingTop: topInset }}>
      <View style={{ flex: 1, paddingBottom: bottomInset / 2 }}>
        <WallComponent
          refreshSignal={localWallRefreshSignal}
          onOpenPost={onOpenPost}
          onEditPost={onEditPost}
        />
      </View>
      <TouchableOpacity onPress={onNewPrayerPress} style={shareButtonStyle}>
        <StyledText
          style={{
            color: Colors.primarySapphire.brand,
            textDecorationLine: 'underline',
          }}
        >
          Share a Prayer 🙏
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}

// --- COMPONENT 1: Status Input ---
function StatusInput({
  dark,
  textColor,
  value,
  onChangeText,
  onActionPress,
  hasText,
  isSubmitting,
}: {
  dark: boolean;
  textColor: string;
  value: string;
  onChangeText: (value: string) => void;
  onActionPress: () => void;
  hasText: boolean;
  isSubmitting: boolean;
}) {
  const promptContainerColor = dark ? Colors.neutral[700] : BRAND.white;
  const promptActionBackground = dark ? 'rgba(65, 219, 225, 0.16)' : 'rgba(18, 107, 135, 0.1)';
  const promptActionColor = dark ? '#7ee7f2' : BRAND.primaryDark;

  let promptActionIcon = <Gallery size={20} color={promptActionColor} variant="Bold" />;
  if (hasText) {
    promptActionIcon = <ArrowUpIcon width={20} height={20} color={promptActionColor} />;
  }
  if (isSubmitting) {
    promptActionIcon = <ActivityIndicator size="small" color={promptActionColor} />;
  }

  return (
    <View style={[styles.promptContainer, { backgroundColor: promptContainerColor }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="What's on your heart?"
        placeholderTextColor={BRAND.gray400}
        style={[styles.promptInput, { color: textColor }]}
        returnKeyType={hasText ? 'send' : 'default'}
        editable={!isSubmitting}
        onSubmitEditing={() => {
          if (hasText && !isSubmitting) {
            onActionPress();
          }
        }}
      />
      <TouchableOpacity
        onPress={onActionPress}
        disabled={isSubmitting}
        style={[styles.promptIcon, { backgroundColor: promptActionBackground }]}
      >
        {promptActionIcon}
      </TouchableOpacity>
    </View>
  );
}

const getSuggestionUserId = (user: User) => user._id || user.id || user.userId || '';

function filterSuggestedUsers(users: User[]): User[] {
  return users.filter((u) => u.accountType !== AccountType.organization);
}

type SuggestionsRailProps = {
  title: string;
  users: User[];
  dark: boolean;
  connectingUserIds: string[];
  selectedUserIds: string[];
  onConnect: (userId: string) => void;
  onOpenProfile: (userId: string) => void;
  onSeeAll: () => void;
};

function SuggestionsRail({
  title,
  users,
  dark,
  connectingUserIds,
  selectedUserIds,
  onConnect,
  onOpenProfile,
  onSeeAll,
}: SuggestionsRailProps) {
  const visibleUsers = users.slice(0, MAX_SUGGESTIONS_VISIBLE);

  return (
    <View style={styles.discoveryContainer}>
      <View style={styles.discoveryHeader}>
        <StyledText
          style={{ fontWeight: '700', fontSize: 16, color: dark ? BRAND.white : BRAND.black }}
        >
          {title}
        </StyledText>
      </View>

      <ScrollView
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.discoveryScrollContent}
      >
        {visibleUsers.map((user, index) => {
          const suggestionId = getSuggestionUserId(user);
          const isConnecting = connectingUserIds.includes(suggestionId);
          const isSelected = selectedUserIds.includes(suggestionId);
          let connectLabel = 'Connect';
          if (isConnecting) {
            connectLabel = 'Connecting...';
          } else if (isSelected) {
            connectLabel = 'Connected';
          }
          return (
            <View
              key={`${title}-${suggestionId || user.username || index}`}
              style={[
                styles.discoveryCard,
                {
                  backgroundColor: dark ? BRAND.cardDark : BRAND.white,
                  borderColor: dark ? BRAND.gray800 : BRAND.gray100,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => onOpenProfile(suggestionId)}
                activeOpacity={0.9}
                style={styles.discoveryProfileTouch}
              >
                <FeedAvatar
                  uri={resolveProfileAvatarUri(user)}
                  size={56}
                  style={styles.discoveryAvatar}
                  fallbackBackgroundColor={dark ? BRAND.cardDark : BRAND.white}
                  fallbackBorderColor={BRAND.primaryDark}
                  fallbackIconColor={BRAND.primaryDark}
                  fallbackIconSize={24}
                />
                <StyledText
                  numberOfLines={1}
                  style={{
                    fontWeight: 'bold',
                    marginTop: 4,
                    color: dark ? BRAND.white : BRAND.black,
                  }}
                >
                  {user.name || user.username || 'OneBody User'}
                </StyledText>
                <StyledText numberOfLines={1} style={styles.discoveryMeta}>
                  @{user.username || 'creator'}
                </StyledText>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!suggestionId || isConnecting || isSelected}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => onConnect(suggestionId)}
                style={[
                  styles.discoveryConnectButton,
                  (isConnecting || isSelected) && { opacity: 0.6 },
                ]}
              >
                <StyledText style={styles.discoveryConnectButtonText}>{connectLabel}</StyledText>
              </TouchableOpacity>
            </View>
          );
        })}
        <TouchableOpacity
          onPress={onSeeAll}
          activeOpacity={0.85}
          style={[
            styles.discoverySeeAllCard,
            {
              backgroundColor: dark ? 'rgba(18, 210, 217, 0.12)' : 'rgba(18, 210, 217, 0.08)',
              borderColor: dark ? BRAND.gray800 : BRAND.gray100,
            },
          ]}
        >
          <StyledText style={styles.discoverySeeAllText}>{'See\nAll'}</StyledText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// --- COMPONENT 3: Modern Feed Card (Smart) ---
// Accepts navigation handlers and data
interface ModernCardProps {
  item: FeedPost;
  onPress: () => void;
  onPressProfile?: () => void;
  dark: boolean;
}

const ModernFeedCard = memo(({ item, onPress, onPressProfile, dark }: ModernCardProps) => {
  // Normalize Data fields
  const authorName =
    item.authorName ||
    (typeof item.source === 'object' ? item.source.name : item.source) ||
    item.user?.name ||
    item.userData?.name ||
    'One Body User';

  const authorAvatar = resolveFeedAvatarUri(item);

  const contentText =
    item.content ||
    item.body ||
    (typeof item.title === 'object' ? item.title?.a?.$text : item.title) ||
    '';

  const mediaUrl =
    item.media?.[0]?.url ||
    (typeof item.image === 'string' ? item.image : item.image?.url) ||
    item.imageUrl ||
    item.mediaUrl ||
    item.images?.[0];

  const likes = item.likesCount || 0;
  const comments = item.commentsCount || 0;

  return (
    <View style={[styles.cardContainer, { backgroundColor: dark ? BRAND.cardDark : BRAND.white }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <TouchableOpacity style={styles.userInfo} onPress={onPressProfile}>
          <FeedAvatar
            uri={authorAvatar}
            size={40}
            style={styles.avatarSmall}
            fallbackBackgroundColor={dark ? BRAND.cardDark : BRAND.white}
            fallbackBorderColor={BRAND.primaryDark}
            fallbackIconColor={BRAND.primaryDark}
            fallbackIconSize={18}
          />
          <View>
            <StyledText style={[styles.userName, { color: dark ? BRAND.white : BRAND.black }]}>
              {authorName}
            </StyledText>
            <StyledText style={[styles.timeAgo, { color: BRAND.gray400 }]}>2 hours ago</StyledText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <More size={20} color={BRAND.gray400} />
        </TouchableOpacity>
      </View>

      {/* Main Clickable Content Area */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {/* Caption */}
        {contentText ? (
          <StyledText
            numberOfLines={4}
            style={[styles.caption, { color: dark ? BRAND.gray200 : BRAND.black }]}
          >
            {contentText}
          </StyledText>
        ) : null}

        {/* Media */}
        {mediaUrl && (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: mediaUrl }} resizeMode="cover" style={styles.mediaImage} />
          </View>
        )}
      </TouchableOpacity>

      {/* Actions Bar */}
      <View style={[styles.actionsBar, { borderTopColor: dark ? BRAND.gray800 : BRAND.gray100 }]}>
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart size={24} color={BRAND.gray400} />
            <StyledText style={[styles.actionText, { color: BRAND.gray400 }]}>
              {likes > 0 ? likes : 'Like'}
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Message size={24} color={BRAND.gray400} />
            <StyledText style={[styles.actionText, { color: BRAND.gray400 }]}>
              {comments > 0 ? comments : 'Reply'}
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Send2 size={24} color={BRAND.gray400} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity>
          <ArchiveMinus size={24} color={BRAND.gray400} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// --- MAIN HOME COMPONENT ---
type Props = CompositeScreenProps<
  StackScreenProps<HomeStackParamsList, 'Home'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    CompositeScreenProps<
      DrawerScreenProps<MainBottomStackParamsList, 'HomeTab'>,
      StackScreenProps<MainStackParamList, 'MainRoot'>
    >
  >
>;

function Home({ navigation, route }: Props) {
  const stackNavigation = useNavigation<NativeStackNavigationProp<HomeStackParamsList, 'Home'>>();
  const { imageViewer, openImages } = useSharedImageViewer();
  const rootTabReplayToken = useRootTabSwitchReplayToken('HomeTab');
  const springboardPreset = getTabRootSpringboardPreset('home');
  const shouldRunHomeFeedIntro = SHOULD_RUN_HOME_FEED_INTRO;
  const token = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector(
    (state: RootState) => state.auth.getProfileData
  ) as UserProfile | null;
  const userAvatar =
    userProfile?.avatar ?? userProfile?.profile_image ?? userProfile?.profileImage ?? '';
  const hasUserAvatar = Boolean(userAvatar);
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeightRef = useRef(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRowHeight = getHeight(5.8);
  const headerSideWidth = headerRowHeight;
  const footerHeight = getHeight(7) + insets.bottom;
  const defaultHeaderHeight = insets.top + headerRowHeight + spacing.x10 + spacing.x8 + 20;
  const glassOverlayColor = dark ? 'rgba(13,13,13,0.7)' : 'rgba(246,246,247,0.7)';
  const androidHeaderBackground = dark ? 'rgba(13,13,13,1.0)' : 'rgba(246,246,247,1.0)';
  const { getSpringboardStyle } = useSpringboardEntry(rootTabReplayToken, 3, {
    preset: springboardPreset,
  });
  const tabContainerGlassStyle = useMemo(
    () => ({
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
      borderBottomColor: 'transparent',
    }),
    []
  );
  const androidTabContainerStyle = useMemo(
    () => ({
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
      borderBottomColor: 'transparent',
    }),
    []
  );

  const [feedOptions, setFeedOptions] = useState<FeedOptions>({
    type: route.params?.selectedTab ?? FeedTypes.ForYou,
    page: 1,
  });
  const [feedData, setFeedData] = useState<FeedEntry[]>([]);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedRefreshToken, setFeedRefreshToken] = useState(0);
  const [prayerWallRefreshSignal, setPrayerWallRefreshSignal] = useState(0);
  const feedRequestSequenceRef = useRef(0);
  const activeFirstPageRequestRef = useRef<{ feedType: FeedTypes; requestId: number } | null>(null);
  const pendingFirstPageContextRef = useRef<FeedRefreshRequestContext | null>(null);
  const lastRefreshTriggerRef = useRef<RefreshTrigger | null>(null);
  const skipNextFocusRefreshRef = useRef(false);
  const lastSuccessfulLoadAtRef = useRef<number>(0);
  const manualRefreshSeedRef = useRef<number>(Date.now());
  const hasUserInteractedRef = useRef(false);
  const blockEndReachedUntilInteractionRef = useRef(true);
  const pendingScrollToTopRef = useRef(false);
  const preserveFeedPositionOnNextFocusRef = useRef(false);
  const hasHandledInitialFocusRef = useRef(false);
  const feedTypeRef = useRef<FeedTypes>(feedOptions.type);
  const handledRouteSelectedTabRef = useRef<FeedTypes | undefined>(route.params?.selectedTab);
  const handledRouteRefreshTokenRef = useRef<number | undefined>(route.params?.refreshToken);
  const feedIntroHeaderOpacity = useRef(new Animated.Value(shouldRunHomeFeedIntro ? 0 : 1)).current;
  const feedIntroHeaderTranslateY = useRef(
    new Animated.Value(shouldRunHomeFeedIntro ? -22 : 0)
  ).current;
  const feedIntroHasStarted = useRef(false);
  const feedIntroCardsCanAnimate = useRef(false);
  const feedIntroCardsAnimated = useRef(false);
  const feedIntroDelayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedIntroCardValues = useRef<Record<string, Animated.Value>>({});
  const latestVisibleItems = useRef<ViewToken[]>([]);
  const suggestionsRequestSequenceRef = useRef(0);
  const isPaginatingRef = useRef(false);
  const suggestionsDirtyRef = useRef(false);
  const [peopleYouMayKnowUsers, setPeopleYouMayKnowUsers] = useState<User[]>([]);
  const [suggestedForYouUsers, setSuggestedForYouUsers] = useState<User[]>([]);
  const [connectingSuggestionIds, setConnectingSuggestionIds] = useState<string[]>([]);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);
  const [introAnimatedCardKeys, setIntroAnimatedCardKeys] = useState<string[]>([]);
  const [quickPostText, setQuickPostText] = useState('');
  const [isQuickPosting, setIsQuickPosting] = useState(false);
  const introAnimatedCardKeySet = useMemo(
    () => new Set(introAnimatedCardKeys),
    [introAnimatedCardKeys]
  );
  const listRef = useRef<FlatList<RenderFeedEntry>>(null);
  const renderEntryFallbackKeyMapRef = useRef(new WeakMap<object, string>());
  const renderEntryFallbackKeySequenceRef = useRef(0);
  const feedVisibleStartByKeyRef = useRef<Map<string, FeedVisibleTelemetryRecord>>(new Map());
  const feedImpressionsByKeyRef = useRef<Set<string>>(new Set());
  const [viewableSocialPostIds, setViewableSocialPostIds] = useState<Set<string>>(new Set());
  feedTypeRef.current = feedOptions.type;
  useScrollToTop(listRef as any);
  const scrollIntent = useScrollIntentLock();

  useObservedEffect(() => {
    if (route.params?.selectedTab === feedOptions.type) {
      return;
    }

    navigation.setParams({
      selectedTab: feedOptions.type,
    });
  }, [feedOptions.type, navigation, route.params?.selectedTab]);

  useObservedEffect(() => {
    setFeedTelemetryAuthToken(token || undefined);
  }, [token]);

  const feedTelemetryRequestIdRef = useRef<Record<FeedTypes, string>>({
    [FeedTypes.Connected]: createPostTelemetryRequestId(),
    [FeedTypes.ForYou]: createPostTelemetryRequestId(),
    [FeedTypes.Read]: createPostTelemetryRequestId(),
    [FeedTypes.Pray]: createPostTelemetryRequestId(),
    [FeedTypes.Watch]: createPostTelemetryRequestId(),
  });

  const getFeedTelemetryRequestId = useCallback((feedType: FeedTypes) => {
    const existing = feedTelemetryRequestIdRef.current[feedType];
    if (existing) {
      return existing;
    }
    const nextRequestId = createPostTelemetryRequestId();
    feedTelemetryRequestIdRef.current[feedType] = nextRequestId;
    return nextRequestId;
  }, []);

  const resetFeedTelemetryRequestId = useCallback((feedType: FeedTypes) => {
    const nextRequestId = createPostTelemetryRequestId();
    feedTelemetryRequestIdRef.current[feedType] = nextRequestId;
    return nextRequestId;
  }, []);

  const getTelemetrySurfaceForFeedType = useCallback(
    (feedType: FeedTypes): PostTelemetrySurface =>
      feedType === FeedTypes.Pray ? 'prayer_portal' : 'social_feed',
    []
  );

  const getTelemetryEntrypointForFeedType = useCallback((feedType: FeedTypes) => {
    if (feedType === FeedTypes.Pray) {
      return 'home_prayer_feed';
    }
    if (feedType === FeedTypes.Read) {
      return 'home_read_feed';
    }
    if (feedType === FeedTypes.Connected) {
      return 'home_connected_feed';
    }
    if (feedType === FeedTypes.ForYou) {
      return 'home_for_you_feed';
    }
    return 'home_feed';
  }, []);

  const getTelemetryAlgorithmForFeedType = useCallback((feedType: FeedTypes) => {
    if (feedType === FeedTypes.ForYou) {
      return 'for_you';
    }
    if (feedType === FeedTypes.Read) {
      return 'read';
    }
    if (feedType === FeedTypes.Pray) {
      return 'prayer_wall';
    }
    if (feedType === FeedTypes.Watch) {
      return 'watch';
    }
    return 'connected';
  }, []);

  const trackHomeTelemetryWithPayload = useCallback(
    (
      payload: HomeTelemetryPayload,
      postIndex: number,
      eventName: CanonicalPostTelemetryEventName,
      metadata?: Record<string, unknown>,
      overrides?: Partial<PostTelemetryEventInput>,
      feedTypeOverride?: FeedTypes
    ) => {
      const resolvedFeedType = feedTypeOverride ?? feedOptions.type;
      if (!payload.postId || !isTelemetryTrackedFeedType(resolvedFeedType)) {
        return;
      }

      trackPostTelemetry({
        postId: payload.postId,
        postType: payload.postType,
        contentType: payload.contentType,
        tags: payload.tags,
        authorId: payload.authorId,
        userId: userProfile?._id ? String(userProfile._id) : undefined,
        surface: getTelemetrySurfaceForFeedType(resolvedFeedType),
        surfaceTab: resolvedFeedType,
        entrypoint: getTelemetryEntrypointForFeedType(resolvedFeedType),
        requestId: getFeedTelemetryRequestId(resolvedFeedType),
        rankPosition: postIndex,
        feedAlgorithm: getTelemetryAlgorithmForFeedType(resolvedFeedType),
        isOwnPost:
          Boolean(userProfile?._id) && Boolean(payload.authorId)
            ? String(payload.authorId) === String(userProfile?._id)
            : undefined,
        isRepost: payload.isRepost,
        privacyState: payload.privacyState,
        ...overrides,
        eventName,
        metadata: {
          source: 'home_feed',
          ...(metadata ?? {}),
          ...(overrides?.metadata ?? {}),
        },
      });
    },
    [
      feedOptions.type,
      getFeedTelemetryRequestId,
      getTelemetryAlgorithmForFeedType,
      getTelemetryEntrypointForFeedType,
      getTelemetrySurfaceForFeedType,
      userProfile?._id,
    ]
  );

  const finalizeFeedTelemetryRecord = useCallback(
    (telemetryKey: string, reason: string) => {
      const record = feedVisibleStartByKeyRef.current.get(telemetryKey);
      if (!record) {
        return;
      }

      feedVisibleStartByKeyRef.current.delete(telemetryKey);
      const dwellTimeMs = Date.now() - record.startedAt;
      if (dwellTimeMs < 1200) {
        return;
      }

      trackHomeTelemetryWithPayload(
        record.payload,
        record.rankPosition,
        'post_dwell',
        { reason },
        { requestId: record.requestId, dwellMs: dwellTimeMs },
        record.feedType
      );

      maybeTrackQualifiedPostView(
        {
          postId: record.payload.postId,
          postType: record.payload.postType,
          contentType: record.payload.contentType,
          tags: record.payload.tags,
          authorId: record.payload.authorId,
          userId: userProfile?._id ? String(userProfile._id) : undefined,
          surface: getTelemetrySurfaceForFeedType(record.feedType),
          surfaceTab: record.feedType,
          entrypoint: getTelemetryEntrypointForFeedType(record.feedType),
          requestId: record.requestId,
          rankPosition: record.rankPosition,
          feedAlgorithm: getTelemetryAlgorithmForFeedType(record.feedType),
          isOwnPost:
            Boolean(userProfile?._id) && Boolean(record.payload.authorId)
              ? String(record.payload.authorId) === String(userProfile?._id)
              : undefined,
          isRepost: record.payload.isRepost,
          privacyState: record.payload.privacyState,
        },
        dwellTimeMs,
        { source: 'home_feed', reason }
      );
    },
    [
      getTelemetryAlgorithmForFeedType,
      getTelemetryEntrypointForFeedType,
      getTelemetrySurfaceForFeedType,
      trackHomeTelemetryWithPayload,
      userProfile?._id,
    ]
  );

  const finalizeVisibleFeedTelemetry = useCallback(
    (feedType: FeedTypes, reason: string) => {
      Array.from(feedVisibleStartByKeyRef.current.entries()).forEach(([telemetryKey, record]) => {
        if (record.feedType !== feedType) {
          return;
        }
        finalizeFeedTelemetryRecord(telemetryKey, reason);
      });
    },
    [finalizeFeedTelemetryRecord]
  );

  const clearFeedTelemetryStateForType = useCallback((feedType: FeedTypes) => {
    Array.from(feedVisibleStartByKeyRef.current.entries()).forEach(([telemetryKey, record]) => {
      if (record.feedType === feedType) {
        feedVisibleStartByKeyRef.current.delete(telemetryKey);
      }
    });
    Array.from(feedImpressionsByKeyRef.current).forEach((telemetryKey) => {
      if (telemetryKey.startsWith(`${feedType}:`)) {
        feedImpressionsByKeyRef.current.delete(telemetryKey);
      }
    });
  }, []);

  useObservedEffect(() => {
    const followingIds = (userProfile?.following ?? [])
      .map((id) => String(id))
      .filter((id) => id.length > 0);
    if (followingIds.length < 1) {
      return;
    }
    setSelectedSuggestionIds((previous) => Array.from(new Set([...previous, ...followingIds])));
  }, [userProfile?.following]);

  const handleNewPrayerPress = useCallback(() => {
    navigation.navigate('PrayerWall', {
      screen: 'Prayer',
      params: { returnTo: 'home_pray' },
    } as any);
  }, [navigation]);

  const handleOpenPrayerPost = useCallback(
    (postId: string) => {
      navigation.navigate('PrayerWall', {
        screen: 'Single',
        params: { postId, returnTo: 'home_pray' },
      } as any);
    },
    [navigation]
  );

  const handleEditPrayerPost = useCallback(
    (postId: string) => {
      navigation.navigate('PrayerWall', {
        screen: 'Prayer',
        params: { postId, returnTo: 'home_pray' },
      } as any);
    },
    [navigation]
  );

  const preserveFeedPositionOnNextFocus = useCallback(() => {
    preserveFeedPositionOnNextFocusRef.current = true;
  }, []);

  const scrollFeedToTop = useCallback(() => {
    pendingScrollToTopRef.current = true;
    requestAnimationFrame(() => {
      if (!pendingScrollToTopRef.current) {
        return;
      }
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      pendingScrollToTopRef.current = false;
    });
  }, []);

  const requestFeedRefresh = useCallback(
    ({
      reason,
      targetType = feedTypeRef.current,
      scrollToTop = false,
      forceNetwork = false,
      allowReorder = false,
      hardReset = false,
      showRefreshSpinner = false,
      refreshSeed,
    }: {
      reason: FeedRefreshReason;
      targetType?: FeedTypes;
      scrollToTop?: boolean;
      forceNetwork?: boolean;
      allowReorder?: boolean;
      hardReset?: boolean;
      showRefreshSpinner?: boolean;
      refreshSeed?: number;
    }) => {
      const currentFeedType = feedTypeRef.current;

      if (targetType === FeedTypes.Pray) {
        feedRequestSequenceRef.current += 1;
        isPaginatingRef.current = false;
        finalizeVisibleFeedTelemetry(currentFeedType, 'refresh_reset');
        clearFeedTelemetryStateForType(currentFeedType);
        resetFeedTelemetryRequestId(targetType);
        clearFeedTelemetryStateForType(targetType);
        setIsRefreshing(false);
        setIsLoadingMore(false);
        if (hardReset) {
          setFeedData([]);
          setIsEndOfList(false);
        }
        setFeedOptions({ type: targetType, page: 1 });
        return false;
      }

      const now = Date.now();
      const inFlightFeedType = activeFirstPageRequestRef.current?.feedType ?? null;
      if (
        shouldSkipRefreshTrigger({
          now,
          reason,
          feedType: targetType,
          lastTrigger: lastRefreshTriggerRef.current,
          inFlightFeedType,
          debounceMs: FEED_REFRESH_DEBOUNCE_MS,
        })
      ) {
        return false;
      }

      lastRefreshTriggerRef.current = { reason, feedType: targetType, at: now };
      feedRequestSequenceRef.current += 1;
      activeFirstPageRequestRef.current = null;
      isPaginatingRef.current = false;
      finalizeVisibleFeedTelemetry(currentFeedType, reason);
      clearFeedTelemetryStateForType(currentFeedType);
      resetFeedTelemetryRequestId(targetType);
      clearFeedTelemetryStateForType(targetType);
      blockEndReachedUntilInteractionRef.current = true;
      hasUserInteractedRef.current = false;
      setIsLoadingMore(false);
      setIsEndOfList(false);
      if (hardReset) {
        setFeedData([]);
      }

      const resolvedSeed =
        typeof refreshSeed === 'number' && Number.isFinite(refreshSeed) ? refreshSeed : now;
      if (reason === 'manual_pull') {
        manualRefreshSeedRef.current = resolvedSeed;
      }

      pendingFirstPageContextRef.current = {
        reason,
        forceNetwork,
        allowReorder,
        refreshSeed: resolvedSeed,
        preserveExistingOnError: !hardReset,
      };

      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else {
        setIsRefreshing(false);
      }

      setFeedOptions((previous) =>
        previous.type === targetType && previous.page === 1
          ? previous
          : { type: targetType, page: 1 }
      );
      setFeedRefreshToken((previous) => previous + 1);

      if (scrollToTop) {
        scrollFeedToTop();
      } else {
        pendingScrollToTopRef.current = false;
      }

      return true;
    },
    [
      clearFeedTelemetryStateForType,
      finalizeVisibleFeedTelemetry,
      resetFeedTelemetryRequestId,
      scrollFeedToTop,
    ]
  );

  const reloadFeed = useCallback(
    (nextType: FeedTypes) => {
      requestFeedRefresh({
        reason: 'tab_switch',
        targetType: nextType,
        scrollToTop: nextType !== FeedTypes.Pray,
        forceNetwork: true,
        allowReorder: false,
        hardReset: true,
      });
    },
    [requestFeedRefresh]
  );

  const handleOpenExplore = useCallback(() => {
    navigation.navigate('MainRoot', {
      screen: 'Main',
      params: {
        screen: 'ExploreTab',
        params: { screen: 'Explore', params: { openProfileSearch: true } },
      },
    });
  }, [navigation]);

  const handleOpenSuggestedProfile = useCallback(
    (id: string) => {
      if (!id) {
        return;
      }
      navigation.navigate('MainRoot', {
        screen: 'Main',
        params: {
          screen: 'ExploreTab',
          params: {
            screen: 'UserProfile',
            params: { id },
          },
        },
      });
    },
    [navigation]
  );

  const getSuggestedUsers = useCallback(
    async (sort?: 'popular'): Promise<User[]> => {
      const sortQuery = sort ? `&sort=${sort}` : '';
      try {
        const res = await ApiCall({
          route: `user/get-users-to-subscribe/1?itemsPerPage=${SUGGESTIONS_FETCH_SIZE}&accountType=individual${sortQuery}`,
          token,
          verb: 'get',
        });
        if (res?.status !== 200) {
          return [];
        }
        if (Array.isArray(res?.response?.data)) {
          return res.response.data as User[];
        }
        if (Array.isArray(res?.response)) {
          return res.response as User[];
        }
        return [];
      } catch (error) {
        return [];
      }
    },
    [token]
  );

  const handleConnectSuggestion = useCallback(
    async (id: string) => {
      if (!id) {
        return;
      }

      let didStartRequest = false;
      setConnectingSuggestionIds((previous) => {
        if (previous.includes(id) || selectedSuggestionIds.includes(id)) {
          return previous;
        }
        didStartRequest = true;
        return [...previous, id];
      });

      if (!didStartRequest) {
        return;
      }

      setSelectedSuggestionIds((previous) =>
        previous.includes(id) ? previous : [...previous, id]
      );
      try {
        const res = await ApiCall({
          route: `user/subscribe/${id}`,
          token,
          verb: 'patch',
        });

        if (res?.status !== 200) {
          setSelectedSuggestionIds((previous) =>
            previous.filter((candidateId) => candidateId !== id)
          );
          const message =
            typeof (res?.response as { message?: unknown })?.message === 'string'
              ? ((res?.response as { message: string }).message ?? '').trim()
              : '';
          Toast.show(message || 'Error following, please try again later.', Toast.LONG);
        } else {
          suggestionsDirtyRef.current = true;
        }
      } catch (error) {
        setSelectedSuggestionIds((previous) =>
          previous.filter((candidateId) => candidateId !== id)
        );
        Toast.show('Error following, please try again later.', Toast.LONG);
      } finally {
        setConnectingSuggestionIds((previous) =>
          previous.filter((candidateId) => candidateId !== id)
        );
      }
    },
    [selectedSuggestionIds, token]
  );

  const handleFeedScroll = useCallback(() => {
    if (!suggestionsDirtyRef.current) return;
    suggestionsDirtyRef.current = false;
    setSelectedSuggestionIds([]);
    Promise.all([getSuggestedUsers(), getSuggestedUsers('popular')])
      .then(([peopleResult, suggestedResult]) => {
        setPeopleYouMayKnowUsers(filterSuggestedUsers(peopleResult));
        setSuggestedForYouUsers(filterSuggestedUsers(suggestedResult));
      })
      .catch(() => {});
  }, [getSuggestedUsers]);

  const getFeedEntryKey = useCallback((item: RenderFeedEntry, index: number) => {
    const identity = getRenderEntryIdentity(item);
    if (identity) {
      return identity;
    }
    if (item && typeof item === 'object') {
      const existing = renderEntryFallbackKeyMapRef.current.get(item);
      if (existing) {
        return existing;
      }
      const nextKey = `row-fallback-${renderEntryFallbackKeySequenceRef.current}`;
      renderEntryFallbackKeySequenceRef.current += 1;
      renderEntryFallbackKeyMapRef.current.set(item, nextKey);
      return nextKey;
    }
    return `row-${index}`;
  }, []);

  const getFeedIdentitySequence = useCallback((entries: FeedEntry[]) => {
    return entries.map((entry, index) => getFeedEntryIdentity(entry) ?? `fallback:${index}`);
  }, []);

  const matchesOwnedFeedEntry = useCallback((entry: FeedEntry, type: string, id: string) => {
    const normalizedType = normalizeOwnedPostType(type);
    const normalizedId = String(id ?? '').trim();
    if (!normalizedType || normalizedId.length < 1) {
      return false;
    }

    const unwrappedEntry = unwrapFeedItem(entry);
    if (!unwrappedEntry || readEntryId(unwrappedEntry) !== normalizedId) {
      return false;
    }

    if (isPrayerPost(unwrappedEntry)) {
      return normalizedType === PostType.prayer;
    }

    const normalizedFeedEntry = normalizeFeedImage(unwrappedEntry as FeedPost);
    if (normalizedType === PostType.watch) {
      return isWatchPost(normalizedFeedEntry);
    }

    return (
      normalizedType === PostType.social &&
      (isSocialPost(normalizedFeedEntry) || isLikelySocialPost(normalizedFeedEntry))
    );
  }, []);

  const handleRemoveOwnedFeedPost = useCallback(
    async (type: string, id: string) => {
      const normalizedType = normalizeOwnedPostType(type);
      const normalizedId = String(id ?? '').trim();

      if (!normalizedType || normalizedId.length < 1) {
        Toast.show('Unable to delete this post right now.', Toast.SHORT);
        return;
      }

      const removedEntries: Array<{ entry: FeedEntry; index: number }> = [];
      setFeedData((previous) => {
        const nextEntries: FeedEntry[] = [];
        previous.forEach((entry, index) => {
          if (matchesOwnedFeedEntry(entry, normalizedType, normalizedId)) {
            removedEntries.push({ entry, index });
            return;
          }
          nextEntries.push(entry);
        });

        return removedEntries.length > 0 ? nextEntries : previous;
      });

      const result = await deleteOwnedPost({
        type: normalizedType,
        id: normalizedId,
        token: token ?? undefined,
      });

      if (!result.ok) {
        if (removedEntries.length > 0) {
          setFeedData((previous) => {
            const restoredEntries = [...previous];
            removedEntries
              .slice()
              .sort((left, right) => left.index - right.index)
              .forEach(({ entry, index }, offset) => {
                restoredEntries.splice(Math.min(index + offset, restoredEntries.length), 0, entry);
              });
            return restoredEntries;
          });
        }

        Toast.show(result.message || 'Unable to delete this post right now.', Toast.SHORT);
        return;
      }

      emitOwnedPostDeleted({
        type: normalizedType,
        id: normalizedId,
      });

      requestFeedRefresh({
        reason: 'route_refresh',
        targetType: feedTypeRef.current,
        forceNetwork: true,
        allowReorder: isPrimarySocialFeedType(feedTypeRef.current),
        hardReset: false,
      });
    },
    [matchesOwnedFeedEntry, requestFeedRefresh, token]
  );

  useMountEffect(() => {
    const removeEntry = ({ type, id }: { type: string; id: string }) => {
      setFeedData((previous) =>
        previous.filter((entry) => !matchesOwnedFeedEntry(entry, type, id))
      );
    };

    const unsubscribeOwned = subscribeToOwnedPostDeleted(removeEntry);
    const unsubscribeUnavailable = subscribeToFeedItemUnavailable(({ type, id }) => {
      removeEntry({ type, id });
      requestFeedRefresh({
        reason: 'route_refresh',
        targetType: feedTypeRef.current,
        forceNetwork: true,
        allowReorder: isPrimarySocialFeedType(feedTypeRef.current),
        hardReset: false,
      });
    });

    return () => {
      unsubscribeOwned();
      unsubscribeUnavailable();
    };
  });

  useObservedEffect(() => {
    if (feedOptions.type !== FeedTypes.Connected && feedOptions.type !== FeedTypes.ForYou) {
      return undefined;
    }

    let isCancelled = false;
    const requestSequence = ++suggestionsRequestSequenceRef.current;

    const loadSuggestions = async () => {
      const [peopleResult, suggestedResult] = await Promise.all([
        getSuggestedUsers(),
        getSuggestedUsers('popular'),
      ]);

      if (isCancelled || requestSequence !== suggestionsRequestSequenceRef.current) {
        return;
      }

      setPeopleYouMayKnowUsers(filterSuggestedUsers(peopleResult));
      setSuggestedForYouUsers(filterSuggestedUsers(suggestedResult));
    };

    loadSuggestions();

    return () => {
      isCancelled = true;
    };
  }, [feedOptions.type, getSuggestedUsers]);

  const feedDataWithSuggestions = useMemo<RenderFeedEntry[]>(() => {
    const isPrimaryFeed =
      feedOptions.type === FeedTypes.Connected || feedOptions.type === FeedTypes.ForYou;
    if (!isPrimaryFeed) {
      return feedData;
    }

    const moduleType: SuggestionsModuleType =
      feedOptions.type === FeedTypes.ForYou ? 'peopleYouMayKnow' : 'suggestedForYou';
    const withSuggestions: RenderFeedEntry[] = [];

    feedData.forEach((entry, index) => {
      withSuggestions.push(entry);
      if ((index + 1) % SUGGESTION_INTERVAL === 0) {
        withSuggestions.push({
          type: 'suggestionsModule',
          moduleType,
          id: `${moduleType}-${Math.floor((index + 1) / SUGGESTION_INTERVAL)}`,
        });
      }
    });

    if (isEndOfList && (feedData.length === 0 || feedData.length % SUGGESTION_INTERVAL !== 0)) {
      withSuggestions.push({
        type: 'suggestionsModule',
        moduleType,
        id: `${moduleType}-end`,
      });
    }

    return withSuggestions;
  }, [feedData, feedOptions.type, isEndOfList]);

  const getFeedData = useCallback(
    async (type: FeedTypes, pageNumber: number) => {
      const isFirstPageLoad = pageNumber <= 1;
      const pageOneContext: FeedRefreshRequestContext | null = isFirstPageLoad
        ? (pendingFirstPageContextRef.current ?? {
            reason: 'initial_load',
            forceNetwork: false,
            allowReorder: false,
            refreshSeed: Date.now(),
            preserveExistingOnError: false,
          })
        : null;

      if (isFirstPageLoad) {
        const activeFirstPage = activeFirstPageRequestRef.current;
        if (activeFirstPage && activeFirstPage.feedType === type) {
          return;
        }
        pendingFirstPageContextRef.current = null;
        finalizeVisibleFeedTelemetry(type, pageOneContext?.reason ?? 'refresh_reset');
        resetFeedTelemetryRequestId(type);
        clearFeedTelemetryStateForType(type);
        isPaginatingRef.current = false;
        setIsLoading(true);
        setIsLoadingMore(false);
      } else {
        setIsLoadingMore(true);
      }

      const requestSequence = ++feedRequestSequenceRef.current;
      if (isFirstPageLoad) {
        activeFirstPageRequestRef.current = {
          feedType: type,
          requestId: requestSequence,
        };
      }

      try {
        const isPrayerFeed = type === FeedTypes.Pray;
        let refreshQuery = '';
        if (!isPrayerFeed && isFirstPageLoad) {
          const refreshQueryParams = new URLSearchParams();
          refreshQueryParams.set('refresh', String(Date.now()));
          if (pageOneContext?.forceNetwork || pageOneContext?.reason === 'manual_pull') {
            refreshQueryParams.set(
              'refreshSeed',
              String(pageOneContext?.refreshSeed ?? Date.now())
            );
          }
          refreshQuery = `?${refreshQueryParams.toString()}`;
        }

        const res = await ApiCall({
          route: isPrayerFeed
            ? `prayer?page=${pageNumber}`
            : `user/get-following-feed/${type}/${pageNumber}${refreshQuery}`,
          token,
          verb: 'get',
        });

        if (res?.status === 200) {
          let response: FeedEntry[] = [];
          if (isPrayerFeed) {
            response = extractPrayerEntries(res?.response);
          } else if (Array.isArray(res?.response)) {
            response = res.response as FeedEntry[];
          }

          if (requestSequence !== feedRequestSequenceRef.current) {
            return;
          }

          const sanitizedResponse = response;
          if (pageNumber === 1) {
            setIsEndOfList(sanitizedResponse.length < 1);
            const latestFeedEntries = mergeUniqueFeedEntries([], sanitizedResponse);
            const shouldReorderOnRefresh =
              Boolean(pageOneContext?.allowReorder) && isPrimarySocialFeedType(type);
            if (shouldReorderOnRefresh) {
              setFeedData((previous) => {
                const previousIdentitySequence = getFeedIdentitySequence(previous);
                const incomingIdentitySequence = getFeedIdentitySequence(latestFeedEntries);
                if (!isSameIdentitySequence(previousIdentitySequence, incomingIdentitySequence)) {
                  return latestFeedEntries;
                }
                return reorderFeedEntriesForRefresh(
                  latestFeedEntries,
                  pageOneContext?.refreshSeed ?? Date.now()
                );
              });
            } else {
              setFeedData(latestFeedEntries);
            }
            lastSuccessfulLoadAtRef.current = Date.now();
          } else if (sanitizedResponse.length < 1) {
            setIsEndOfList(true);
          } else {
            setFeedData((previous) => mergeUniqueFeedEntries(previous, sanitizedResponse));
          }
        } else {
          if (requestSequence !== feedRequestSequenceRef.current) {
            return;
          }
          if (pageNumber === 1 && !pageOneContext?.preserveExistingOnError) {
            setFeedData([]);
          }
          setIsEndOfList(true);
        }
      } catch (e: any) {
        if (requestSequence !== feedRequestSequenceRef.current) {
          return;
        }
        if (pageNumber === 1 && !pageOneContext?.preserveExistingOnError) {
          setFeedData([]);
        }
      }

      if (requestSequence === feedRequestSequenceRef.current) {
        isPaginatingRef.current = false;
        if (isFirstPageLoad) {
          setIsLoading(false);
        } else {
          setIsLoadingMore(false);
        }
        setIsRefreshing(false);
      }

      if (
        isFirstPageLoad &&
        activeFirstPageRequestRef.current?.requestId === requestSequence &&
        activeFirstPageRequestRef.current?.feedType === type
      ) {
        activeFirstPageRequestRef.current = null;
      }
    },
    [
      clearFeedTelemetryStateForType,
      finalizeVisibleFeedTelemetry,
      getFeedIdentitySequence,
      resetFeedTelemetryRequestId,
      token,
    ]
  );

  useObservedEffect(() => {
    if (feedOptions.type === FeedTypes.Pray) {
      activeFirstPageRequestRef.current = null;
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
      return;
    }
    getFeedData(feedOptions.type, feedOptions.page);
  }, [feedOptions, getFeedData, feedRefreshToken]);

  const handleTabChange = useCallback(
    (tabValue: FeedTypes) => {
      if (tabValue === FeedTypes.Watch) {
        navigation.push('WatchPortal');
        return;
      }
      reloadFeed(tabValue);
    },
    [navigation, reloadFeed]
  );

  const toggleFeedSubType = useCallback(() => {
    const nextType =
      feedTypeRef.current === FeedTypes.Connected ? FeedTypes.ForYou : FeedTypes.Connected;
    reloadFeed(nextType);
  }, [reloadFeed]);

  const handleHeaderLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const nextHeight = Math.round(event.nativeEvent.layout.height);
      if (nextHeight > 0 && nextHeight !== headerHeightRef.current) {
        headerHeightRef.current = nextHeight;
        setHeaderHeight(nextHeight);
      }
    },
    []
  );

  const handleOpenDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  }, [navigation]);

  const handleNotifications = useCallback(() => {
    navigation.navigate('MainRoot', {
      screen: 'Main',
      params: { screen: 'HomeTab', params: { screen: 'Notifications' } },
    });
  }, [navigation]);

  const feedRefreshRef = useRef<(() => void) | null>(null);

  const handleHeaderLogoPress = useCallback(() => {
    if (feedOptions.type === FeedTypes.Pray) {
      setPrayerWallRefreshSignal((previous) => previous + 1);
    } else {
      feedRefreshRef.current?.();
    }
  }, [feedOptions.type]);

  const handleOpenPostComposer = useCallback(() => {
    preserveFeedPositionOnNextFocus();
    navigation.navigate('Post');
  }, [navigation, preserveFeedPositionOnNextFocus]);

  const handleSubmitQuickPost = useCallback(async () => {
    const content = buildQuickPostContent(quickPostText);
    if (!content || isQuickPosting) {
      return;
    }
    setIsQuickPosting(true);
    try {
      const textModeration = await moderateQuickPostText(content, (message) =>
        Toast.show(message, Toast.SHORT)
      );
      if (textModeration.blocked) {
        return;
      }

      const result = await ApiCall({
        route: 'social/post',
        token,
        params: {
          content,
          moderationReview: textModeration.moderationReview,
        },
        verb: 'post',
      });
      if (result?.status === 200) {
        setQuickPostText('');
        requestFeedRefresh({
          reason: 'route_refresh',
          targetType: feedTypeRef.current,
          scrollToTop: true,
          forceNetwork: true,
          allowReorder: false,
          hardReset: false,
        });
        const responseMessage =
          typeof (result.response as { message?: unknown })?.message === 'string'
            ? String((result.response as { message?: string }).message)
            : '';
        const pendingReview = Boolean(
          (result.response as { pendingReview?: unknown })?.pendingReview
        );
        if (pendingReview || responseMessage) {
          Toast.show(responseMessage || QUICK_POST_PENDING_REVIEW_MESSAGE, Toast.SHORT);
        }
        return;
      }
      Toast.show(getQuickPostErrorMessage(result?.response, result?.status), Toast.SHORT);
    } catch (error: any) {
      Toast.show(
        getQuickPostErrorMessage(error?.response?.data ?? error?.response, error?.status),
        Toast.SHORT
      );
    } finally {
      setIsQuickPosting(false);
    }
  }, [isQuickPosting, quickPostText, requestFeedRefresh, token]);

  const hasQuickPostText = quickPostText.trim().length > 0;
  const handleQuickComposerAction = useCallback(() => {
    if (hasQuickPostText) {
      handleSubmitQuickPost();
      return;
    }
    handleOpenPostComposer();
  }, [handleOpenPostComposer, handleSubmitQuickPost, hasQuickPostText]);

  useObservedEffect(() => {
    const routeSelectedTab = route.params?.selectedTab;
    const routeRefreshToken = route.params?.refreshToken;

    const shouldHandleSelectedTab =
      routeSelectedTab !== undefined && routeSelectedTab !== handledRouteSelectedTabRef.current;
    const shouldHandleRefresh =
      typeof routeRefreshToken === 'number' &&
      routeRefreshToken !== handledRouteRefreshTokenRef.current;

    if (!shouldHandleSelectedTab && !shouldHandleRefresh) {
      return;
    }

    if (shouldHandleSelectedTab) {
      handledRouteSelectedTabRef.current = routeSelectedTab;
    }

    if (shouldHandleRefresh) {
      handledRouteRefreshTokenRef.current = routeRefreshToken;
    }

    const targetFeedType = routeSelectedTab ?? feedTypeRef.current;
    if (shouldHandleSelectedTab && targetFeedType !== feedTypeRef.current) {
      reloadFeed(targetFeedType);
      return;
    }

    if (shouldHandleRefresh) {
      skipNextFocusRefreshRef.current = true;
      requestFeedRefresh({
        reason: 'route_refresh',
        targetType: targetFeedType,
        scrollToTop: targetFeedType !== FeedTypes.Pray,
        forceNetwork: true,
        allowReorder: false,
        hardReset: false,
        refreshSeed: routeRefreshToken,
      });
    }
  }, [reloadFeed, requestFeedRefresh, route.params?.refreshToken, route.params?.selectedTab]);

  useLayoutEffect(() => {
    if (!shouldRunHomeFeedIntro || !rootTabReplayToken) {
      return;
    }

    feedIntroHasStarted.current = false;
    feedIntroCardsCanAnimate.current = false;
    feedIntroCardsAnimated.current = false;
    setIntroAnimatedCardKeys([]);
    feedIntroHeaderOpacity.setValue(0);
    feedIntroHeaderTranslateY.setValue(-22);
    Object.values(feedIntroCardValues.current).forEach((value) => value.setValue(0));
  }, [
    feedIntroHeaderOpacity,
    feedIntroHeaderTranslateY,
    rootTabReplayToken,
    shouldRunHomeFeedIntro,
  ]);

  const tabInactiveColor = dark ? 'rgba(230,234,236,0.65)' : BRAND.gray800;
  const tabActiveColor = dark ? '#126b87' : BRAND.primaryDark;
  const tabUnderlineColor = dark ? '#126b87' : BRAND.primaryDark;

  const renderTabs = useCallback(
    (containerStyle?: StyleProp<ViewStyle>) => (
      <View style={[styles.tabContainer, containerStyle]}>
        {mainTabs.map((tab) => {
          const { label, value } = tab;
          const isFeedTab = value === FeedTypes.Connected;
          const isActive = isFeedTab
            ? feedOptions.type === FeedTypes.Connected || feedOptions.type === FeedTypes.ForYou
            : feedOptions.type === value;

          if (isFeedTab) {
            let feedLabel = 'Feed';
            if (isActive) {
              feedLabel = feedOptions.type === FeedTypes.Connected ? 'Connected' : 'For You';
            }

            return (
              <TouchableOpacity
                key={value}
                style={[styles.tabItem, isActive && styles.tabItemSelected]}
                onPress={() => {
                  if (isActive) toggleFeedSubType();
                  else handleTabChange(value);
                }}
              >
                <View
                  style={[
                    styles.tabLabelUnderline,
                    isActive && styles.tabLabelUnderlineSelected,
                    isActive && { borderBottomColor: tabUnderlineColor },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <StyledText
                      style={[
                        styles.tabText,
                        { color: isActive ? tabActiveColor : tabInactiveColor },
                        isActive && styles.tabTextSelected,
                      ]}
                    >
                      {feedLabel}
                    </StyledText>
                    {isActive && (
                      <ArrowDown2
                        size={14}
                        color={tabUnderlineColor}
                        style={{ marginLeft: 4 }}
                        variant="Bold"
                      />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={value}
              style={[styles.tabItem, isActive && styles.tabItemSelected]}
              onPress={() => handleTabChange(value)}
            >
              <View
                style={[
                  styles.tabLabelUnderline,
                  isActive && styles.tabLabelUnderlineSelected,
                  isActive && { borderBottomColor: tabUnderlineColor },
                ]}
              >
                <StyledText
                  style={[
                    styles.tabText,
                    { color: isActive ? tabActiveColor : tabInactiveColor },
                    isActive && styles.tabTextSelected,
                  ]}
                >
                  {label}
                </StyledText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    ),
    [
      feedOptions.type,
      handleTabChange,
      tabActiveColor,
      tabInactiveColor,
      tabUnderlineColor,
      toggleFeedSubType,
    ]
  );

  const renderHeader = useCallback(
    () => (
      <View onLayout={handleHeaderLayout} style={{ paddingTop: insets.top }}>
        <BlurView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          blurType={dark ? 'dark' : 'light'}
          blurAmount={20}
          reducedTransparencyFallbackColor={colors.background}
        />
        <HeaderGradientOverlay color={glassOverlayColor} />
        <View
          style={{
            height: headerRowHeight,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.x16,
          }}
        >
          <View
            style={{
              width: headerSideWidth,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleOpenDrawer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {hasUserAvatar ? (
                <Image
                  source={{ uri: userAvatar }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: dark ? '#f6f6f7' : BRAND.gray200,
                  }}
                />
              ) : (
                <ProfileFill width={32} height={32} color={dark ? '#f6f6f7' : '#126b87'} />
              )}
            </TouchableOpacity>
          </View>
          <View
            style={{
              width: headerSideWidth,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleNotifications}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Notification
                size={24}
                color={dark ? BRAND.gray100 : BRAND.primaryDark}
                strokeWidth={0.2}
              />
            </TouchableOpacity>
          </View>
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleHeaderLogoPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                height: 44,
                width: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ height: 28, width: 28 }}>
                {dark ? (
                  <LogoWhite style={{ height: 28, width: 28 }} />
                ) : (
                  <Logo style={{ height: 28, width: 28 }} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {renderTabs(tabContainerGlassStyle)}
      </View>
    ),
    [
      colors.background,
      dark,
      glassOverlayColor,
      handleHeaderLayout,
      handleHeaderLogoPress,
      handleNotifications,
      handleOpenDrawer,
      hasUserAvatar,
      headerRowHeight,
      headerSideWidth,
      insets.top,
      renderTabs,
      tabContainerGlassStyle,
      userAvatar,
    ]
  );

  const renderOverlayHeader = useCallback(() => {
    if (Platform.OS === 'ios') {
      return renderHeader();
    }

    return (
      <View
        onLayout={handleHeaderLayout}
        style={{
          paddingTop: insets.top,
          backgroundColor: androidHeaderBackground,
        }}
      >
        <View
          style={{
            height: headerRowHeight,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.x16,
          }}
        >
          <View
            style={{
              width: headerSideWidth,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleOpenDrawer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {hasUserAvatar ? (
                <Image
                  source={{ uri: userAvatar }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: dark ? '#f6f6f7' : BRAND.gray200,
                  }}
                />
              ) : (
                <ProfileFill width={32} height={32} color={dark ? '#f6f6f7' : '#126b87'} />
              )}
            </TouchableOpacity>
          </View>
          <View
            style={{
              width: headerSideWidth,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleNotifications}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Notification
                size={24}
                color={dark ? BRAND.gray100 : BRAND.primaryDark}
                strokeWidth={0.2}
              />
            </TouchableOpacity>
          </View>
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleHeaderLogoPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                height: 44,
                width: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ height: 28, width: 28 }}>
                {dark ? (
                  <LogoWhite style={{ height: 28, width: 28 }} />
                ) : (
                  <Logo style={{ height: 28, width: 28 }} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {renderTabs(androidTabContainerStyle)}
      </View>
    );
  }, [
    androidHeaderBackground,
    androidTabContainerStyle,
    dark,
    handleHeaderLayout,
    handleHeaderLogoPress,
    handleNotifications,
    handleOpenDrawer,
    hasUserAvatar,
    headerRowHeight,
    headerSideWidth,
    insets.top,
    renderHeader,
    renderTabs,
    userAvatar,
  ]);

  useLayoutEffect(() => {
    stackNavigation.setOptions({ headerShown: false });
  }, [stackNavigation]);

  // --- NAVIGATION HANDLERS ---
  const navigateToDetail = useCallback(
    (item: FeedPost) => {
      preserveFeedPositionOnNextFocus();
      const postId = getFeedPostId(item);
      const isSocialLike = Boolean(
        postId &&
          (item.type === 'social' ||
            ('userData' in item && item.userData) ||
            item.mediaUrl ||
            (Array.isArray(item.images) && item.images.length > 0))
      );

      if (isSocialLike && postId) {
        navigation.navigate('SinglePost', {
          postId,
        } as any);
        return;
      }

      if (item.id) {
        navigation.navigate('SingleRss', {
          postId: item.id,
        } as any);
      }
    },
    [navigation, preserveFeedPositionOnNextFocus]
  );

  const navigateToProfile = useCallback(() => {}, []);

  const getTelemetryFromRenderEntry = useCallback((entry: RenderFeedEntry) => {
    if (isSuggestionsModuleItem(entry)) {
      return null;
    }

    let unwrapped: FeedPost | PrayerPost | null;
    if ('type' in entry && entry.type === 'tasteBreaker') {
      unwrapped = entry.items?.[0] ?? null;
    } else if ('type' in entry && entry.type === 'relatedContent') {
      unwrapped = entry.item ?? null;
    } else {
      unwrapped = entry;
    }

    if (!unwrapped) {
      return null;
    }

    const normalized =
      typeof unwrapped.images === 'string'
        ? { ...unwrapped, image: { url: unwrapped.images } }
        : unwrapped;
    const postId =
      'category' in normalized && 'commentNumber' in normalized
        ? String(normalized.postId ?? normalized.id ?? '')
        : getFeedPostId(normalized);
    if (!postId) {
      return null;
    }

    if ('category' in normalized && 'commentNumber' in normalized) {
      return {
        postId,
        postType: 'prayer',
        contentType: normalized.category || 'prayer',
        tags: normalizeTelemetryTags(getObjectField(normalized, 'tags')),
        authorId: normalized.userData?._id,
        isRepost: false,
        privacyState: normalized.private ? 'private' : 'public',
      };
    }

    const normalizedContentTypeField = getObjectField(normalized, 'contentType');
    const normalizedId = normalized.postId || ('_id' in normalized ? normalized._id : undefined);
    const looksSocial = Boolean(
      (normalized.content ||
        normalized.body ||
        (typeof normalized.title === 'string' ? normalized.title : normalized.title?.a?.$text)) &&
        normalizedId &&
        (normalized.mediaUrl ||
          (Array.isArray(normalized.images) && normalized.images.length > 0) ||
          ('userData' in normalized && normalized.userData))
    );

    const postType =
      normalized.type ??
      (looksSocial ? 'social' : undefined) ??
      (typeof normalizedContentTypeField === 'string' ? normalizedContentTypeField : undefined) ??
      'post';

    let contentType: string | undefined;
    if (typeof normalized.type === 'string') {
      contentType = normalized.type;
    } else if (typeof normalizedContentTypeField === 'string') {
      contentType = normalizedContentTypeField;
    }

    return {
      postId,
      postType,
      contentType,
      tags: normalizeTelemetryTags(getObjectField(normalized, 'tags')),
      authorId:
        'userData' in normalized && normalized.userData?._id
          ? String(normalized.userData._id)
          : undefined,
      isRepost: Boolean(getObjectField(normalized, 'repost')),
      privacyState:
        getObjectField(normalized, 'private') === true || getObjectField(normalized, 'isPrivate')
          ? 'private'
          : 'public',
    };
  }, []);

  // --- RENDER ITEM LOGIC (Fixes "Data not generating") ---
  const renderFeedItem = useCallback<ListRenderItem<RenderFeedEntry>>(
    ({ item, index }) => {
      if (isSuggestionsModuleItem(item)) {
        const isPeopleModule = item.moduleType === 'peopleYouMayKnow';
        return (
          <SuggestionsRail
            title={isPeopleModule ? 'People You May Know' : 'Suggested For You'}
            users={isPeopleModule ? peopleYouMayKnowUsers : suggestedForYouUsers}
            dark={dark}
            connectingUserIds={connectingSuggestionIds}
            selectedUserIds={selectedSuggestionIds}
            onConnect={handleConnectSuggestion}
            onOpenProfile={handleOpenSuggestedProfile}
            onSeeAll={handleOpenExplore}
          />
        );
      }

      const unwrapped = unwrapFeedItem(item);
      if (!unwrapped) return null;
      let renderedItem: JSX.Element | null = null;

      if (isPrayerPost(unwrapped)) {
        if (feedOptions.type !== FeedTypes.Pray) {
          return null;
        }
        const prayerPostId = String(unwrapped.postId ?? unwrapped.id ?? '');
        const prayerTelemetryPayload =
          prayerPostId.length > 0
            ? {
                postId: prayerPostId,
                postType: 'prayer',
                contentType: unwrapped.category || 'prayer',
                tags: normalizeTelemetryTags(getObjectField(unwrapped, 'tags')),
                authorId: unwrapped.userData?._id,
                isRepost: false,
                privacyState: unwrapped.private ? 'private' : 'public',
              }
            : null;
        renderedItem = (
          <PrayerItem
            item={unwrapped}
            originFeedType={feedOptions.type}
            removePost={handleRemoveOwnedFeedPost}
            onTelemetryEvent={(eventType, metadata) => {
              if (!prayerTelemetryPayload) {
                return;
              }
              trackHomeTelemetryWithPayload(
                prayerTelemetryPayload,
                index,
                eventType as CanonicalPostTelemetryEventName,
                metadata
              );
            }}
            onCommentsPress={() => {
              if (!prayerTelemetryPayload) {
                return;
              }
              trackHomeTelemetryWithPayload(prayerTelemetryPayload, index, 'post_open', {
                origin: 'prayer_card',
              });
              navigation.navigate('PrayerWall', {
                screen: 'Single',
                params: { postId: prayerTelemetryPayload.postId },
              } as any);
            }}
            parentRefreshContent={() => {
              getFeedData(feedOptions.type, 1);
            }}
            fromSavedPosts={false}
          />
        );
      } else {
        const normalizedWithImage = normalizeFeedImage(unwrapped);

        if (isWatchPost(normalizedWithImage)) {
          const watchItem = buildWatchFeedItem(normalizedWithImage);
          const watchItemId = watchItem.postId ?? watchItem.id ?? watchItem._id;
          const watchTelemetryPayload =
            watchItemId !== undefined && watchItemId !== null
              ? {
                  postId: String(watchItemId),
                  postType: 'watch',
                  contentType: 'watch',
                  tags: normalizeTelemetryTags(getObjectField(watchItem, 'tags')),
                  authorId: watchItem.userData?._id,
                  isRepost: Boolean(getObjectField(watchItem, 'repost')),
                  privacyState:
                    getObjectField(watchItem, 'private') === true ? 'private' : 'public',
                }
              : null;
          renderedItem = (
            <SocialItem
              itemData={watchItem}
              postType={PostType.watch}
              originFeedType={feedOptions.type}
              onOpenImages={openImages}
              visible={
                (feedOptions.type === FeedTypes.Connected ||
                  feedOptions.type === FeedTypes.ForYou) &&
                watchItemId !== undefined &&
                watchItemId !== null &&
                viewableSocialPostIds.has(String(watchItemId))
              }
              removePost={handleRemoveOwnedFeedPost}
              parentRefreshContent={() => {
                getFeedData(feedOptions.type, 1);
              }}
              fromSavedPosts={false}
              onTelemetryEvent={(eventType, metadata) => {
                if (!watchTelemetryPayload) {
                  return;
                }
                trackHomeTelemetryWithPayload(
                  watchTelemetryPayload,
                  index,
                  eventType as CanonicalPostTelemetryEventName,
                  metadata
                );
              }}
              onCommentsPress={() => {
                preserveFeedPositionOnNextFocus();
                const { playBackId } = watchItem;
                if (!watchTelemetryPayload) {
                  return;
                }
                if (playBackId && isHomeWatchPortalEligible(watchItem)) {
                  navigation.push('WatchPortal', {
                    initialPostId: watchTelemetryPayload.postId,
                    initialPlaybackId: playBackId,
                    initialWatchPost: {
                      ...watchItem,
                      playBackId,
                      postId: watchTelemetryPayload.postId,
                    },
                  } as any);
                  return;
                }

                navigation.navigate('SingleRss', {
                  postId: watchTelemetryPayload.postId,
                  postType: PostType.watch,
                } as any);
              }}
              onOpenVideoPress={({
                postId,
                playBackId,
                itemData,
                aspectRatio,
                videoWidth,
                videoHeight,
              }) => {
                const { isNineBySixteen } = resolveVideoMetadata({
                  aspect_ratio: itemData.aspect_ratio,
                  aspectRatio: aspectRatio ?? itemData.aspectRatio,
                  videoWidth: videoWidth ?? itemData.videoWidth,
                  videoHeight: videoHeight ?? itemData.videoHeight,
                });

                if (!playBackId || !isNineBySixteen) {
                  return;
                }
                preserveFeedPositionOnNextFocus();
                navigation.push('WatchPortal', {
                  initialPostId: postId ? String(postId) : undefined,
                  initialPlaybackId: playBackId,
                  initialWatchPost: {
                    ...itemData,
                    playBackId,
                    postId: postId ? String(postId) : itemData.postId,
                    aspectRatio: aspectRatio ?? itemData.aspectRatio,
                    videoWidth: videoWidth ?? itemData.videoWidth,
                    videoHeight: videoHeight ?? itemData.videoHeight,
                  },
                } as any);
              }}
            />
          );
        } else if (isSocialPost(normalizedWithImage) || isLikelySocialPost(normalizedWithImage)) {
          const socialItem = buildSocialFeedItem(normalizedWithImage);
          const socialItemId = socialItem.postId ?? socialItem.id ?? socialItem._id;
          const socialTelemetryPayload =
            socialItemId !== undefined && socialItemId !== null
              ? {
                  postId: String(socialItemId),
                  postType: 'social',
                  contentType: socialItem.type ?? 'social',
                  tags: normalizeTelemetryTags(getObjectField(socialItem, 'tags')),
                  authorId: socialItem.userData?._id,
                  isRepost: Boolean(getObjectField(socialItem, 'repost')),
                  privacyState:
                    getObjectField(socialItem, 'private') === true ? 'private' : 'public',
                }
              : null;
          renderedItem = (
            <SocialItem
              itemData={socialItem}
              originFeedType={feedOptions.type}
              onOpenImages={openImages}
              visible={
                (feedOptions.type === FeedTypes.Connected ||
                  feedOptions.type === FeedTypes.ForYou) &&
                socialItemId !== undefined &&
                socialItemId !== null &&
                viewableSocialPostIds.has(String(socialItemId))
              }
              removePost={handleRemoveOwnedFeedPost}
              parentRefreshContent={() => {
                getFeedData(feedOptions.type, 1);
              }}
              fromSavedPosts={false}
              onTelemetryEvent={(eventType, metadata) => {
                if (!socialTelemetryPayload) {
                  return;
                }
                trackHomeTelemetryWithPayload(
                  socialTelemetryPayload,
                  index,
                  eventType as CanonicalPostTelemetryEventName,
                  metadata
                );
              }}
              onCommentsPress={() => {
                preserveFeedPositionOnNextFocus();
                if (socialTelemetryPayload) {
                  navigation.navigate('SinglePost', {
                    postId: socialTelemetryPayload.postId,
                  } as any);
                }
              }}
              onOpenVideoPress={({
                postId,
                playBackId,
                itemData,
                aspectRatio,
                videoWidth,
                videoHeight,
              }) => {
                if (!playBackId) {
                  return;
                }
                preserveFeedPositionOnNextFocus();
                navigation.push('WatchPortal', {
                  initialPostId: postId ? String(postId) : undefined,
                  initialPlaybackId: playBackId,
                  initialWatchPost: {
                    ...itemData,
                    playBackId,
                    postId: postId ? String(postId) : itemData.postId,
                    aspectRatio: aspectRatio ?? itemData.aspectRatio,
                    videoWidth: videoWidth ?? itemData.videoWidth,
                    videoHeight: videoHeight ?? itemData.videoHeight,
                  },
                } as any);
              }}
            />
          );
        } else if (isRssPost(normalizedWithImage)) {
          const rssItem = buildRssFeedItem(normalizedWithImage);
          let rssContentType = 'posts';
          const rssTypeField = getObjectField(rssItem, 'type');
          const rssContentTypeField = getObjectField(rssItem, 'contentType');
          if (typeof rssTypeField === 'string') {
            rssContentType = rssTypeField;
          } else if (typeof rssContentTypeField === 'string') {
            rssContentType = rssContentTypeField;
          }
          const rssTelemetryPayload =
            rssItem.id !== undefined && rssItem.id !== null
              ? {
                  postId: String(rssItem.id),
                  postType: 'rss',
                  contentType: rssContentType,
                  tags: normalizeTelemetryTags(getObjectField(rssItem, 'tags')),
                  authorId: rssItem.userData?._id,
                  isRepost: Boolean(getObjectField(rssItem, 'repost')),
                  privacyState: getObjectField(rssItem, 'private') === true ? 'private' : 'public',
                }
              : null;
          renderedItem = (
            <ArticleItem
              item={rssItem}
              originFeedType={feedOptions.type}
              imageSizeType="contain"
              onTelemetryEvent={(eventType, metadata) => {
                if (!rssTelemetryPayload) {
                  return;
                }
                trackHomeTelemetryWithPayload(
                  rssTelemetryPayload,
                  index,
                  eventType as CanonicalPostTelemetryEventName,
                  metadata
                );
              }}
              onPress={() => undefined}
              onCommentsPress={() => {
                preserveFeedPositionOnNextFocus();
                if (rssTelemetryPayload) {
                  navigation.navigate('SingleRss', { postId: rssTelemetryPayload.postId } as any);
                }
              }}
            />
          );
        } else {
          renderedItem = (
            <ModernFeedCard
              item={normalizedWithImage}
              onPress={() => {
                const postId = getFeedPostId(normalizedWithImage);
                if (postId) {
                  trackHomeTelemetryWithPayload(
                    {
                      postId,
                      postType: normalizedWithImage.type ?? 'post',
                      contentType:
                        typeof getObjectField(normalizedWithImage, 'contentType') === 'string'
                          ? (getObjectField(normalizedWithImage, 'contentType') as string)
                          : normalizedWithImage.type,
                      tags: normalizeTelemetryTags(getObjectField(normalizedWithImage, 'tags')),
                      authorId:
                        'userData' in normalizedWithImage && normalizedWithImage.userData?._id
                          ? String(normalizedWithImage.userData._id)
                          : undefined,
                      isRepost: Boolean(getObjectField(normalizedWithImage, 'repost')),
                      privacyState:
                        getObjectField(normalizedWithImage, 'private') === true
                          ? 'private'
                          : 'public',
                    },
                    index,
                    'post_open'
                  );
                }
                navigateToDetail(normalizedWithImage);
              }}
              onPressProfile={navigateToProfile}
              dark={dark}
            />
          );
        }
      }

      if (!renderedItem) {
        return null;
      }

      const itemKey = getFeedEntryKey(item, index);
      if (!introAnimatedCardKeySet.has(itemKey)) {
        return renderedItem;
      }

      const animatedValue = feedIntroCardValues.current[itemKey];
      if (!animatedValue) {
        return renderedItem;
      }

      return (
        <Animated.View
          style={{
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          }}
        >
          {renderedItem}
        </Animated.View>
      );
    },
    [
      connectingSuggestionIds,
      dark,
      feedOptions.type,
      getFeedData,
      getFeedEntryKey,
      handleRemoveOwnedFeedPost,
      handleConnectSuggestion,
      handleOpenExplore,
      handleOpenSuggestedProfile,
      introAnimatedCardKeySet,
      navigation,
      navigateToDetail,
      navigateToProfile,
      peopleYouMayKnowUsers,
      preserveFeedPositionOnNextFocus,
      selectedSuggestionIds,
      suggestedForYouUsers,
      trackHomeTelemetryWithPayload,
      viewableSocialPostIds,
    ]
  );

  const emptyFeedState = useMemo(() => {
    if (isLoading) return null;
    if (feedOptions.type !== FeedTypes.Pray) return null;
    return (
      <StyledText
        style={{
          textAlign: 'center',
          padding: spacing.x16,
          color: dark ? BRAND.gray200 : BRAND.gray400,
        }}
      >
        No prayer requests yet.
      </StyledText>
    );
  }, [dark, feedOptions.type, isLoading]);

  const endOfFeedFooter = useMemo(() => {
    const isPrimaryFeedType =
      feedOptions.type === FeedTypes.Connected || feedOptions.type === FeedTypes.ForYou;
    if (!isPrimaryFeedType) {
      return null;
    }
    if (isLoadingMore) {
      return (
        <View style={styles.endOfFeedContainer}>
          <ActivityIndicator size="small" color={BRAND.primaryDark} />
        </View>
      );
    }
    if (isLoading || !isEndOfList || feedDataWithSuggestions.length < 1) {
      return null;
    }
    return (
      <View style={styles.endOfFeedContainer}>
        <StyledText style={styles.endOfFeedText}>You are all caught up.</StyledText>
      </View>
    );
  }, [feedDataWithSuggestions.length, feedOptions.type, isEndOfList, isLoading, isLoadingMore]);

  const tabBarAnimation = useTabBarAnimation();
  const tabBarAnimationRef = useRef(tabBarAnimation);
  tabBarAnimationRef.current = tabBarAnimation;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerVisibility = useRef(new Animated.Value(1)).current;
  const footerVisibility = useRef(new Animated.Value(1)).current;
  const lastScrollRef = useRef(0);
  const barsVisibleRef = useRef(true);
  const resolvedHeaderHeight = headerHeight || defaultHeaderHeight;
  const headerInset = resolvedHeaderHeight + spacing.x10;
  const iosRefreshOffset = resolvedHeaderHeight + spacing.x13;
  const hideFloatingHeaderForIOSRefresh = Platform.OS === 'ios' && isRefreshing;
  const clampDistance = headerInset + footerHeight;
  const scrollClampSource = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-100, 0, clampDistance],
        outputRange: [0, 0, clampDistance],
        extrapolate: 'clamp',
      }),
    [scrollY, clampDistance]
  );
  const clampedScroll = useMemo(
    () => Animated.diffClamp(scrollClampSource, 0, clampDistance),
    [scrollClampSource, clampDistance]
  );
  const visibilityFactor = useMemo(
    () => Animated.subtract(1, headerVisibility),
    [headerVisibility]
  );
  const headerTranslateY = useMemo(
    () =>
      Animated.multiply(
        clampedScroll.interpolate({
          inputRange: [0, headerInset],
          outputRange: [0, -headerInset],
          extrapolate: 'clamp',
        }),
        visibilityFactor
      ),
    [clampedScroll, headerInset, visibilityFactor]
  );
  const footerTranslateYBase = useMemo(
    () =>
      clampedScroll.interpolate({
        inputRange: [0, footerHeight],
        outputRange: [0, footerHeight],
        extrapolate: 'clamp',
      }),
    [clampedScroll, footerHeight]
  );
  const footerTranslateY = useMemo(
    () => Animated.multiply(footerTranslateYBase, Animated.subtract(1, footerVisibility)),
    [footerTranslateYBase, footerVisibility]
  );

  const VISIBILITY_DURATION = 180;
  const VISIBILITY_EASING = Easing.out(Easing.sin);

  const showBars = useCallback(() => {
    if (barsVisibleRef.current) {
      return;
    }
    barsVisibleRef.current = true;
    headerVisibility.stopAnimation();
    footerVisibility.stopAnimation();
    Animated.timing(headerVisibility, {
      toValue: 1,
      duration: VISIBILITY_DURATION,
      easing: VISIBILITY_EASING,
      useNativeDriver: true,
    }).start();
    Animated.timing(footerVisibility, {
      toValue: 1,
      duration: VISIBILITY_DURATION,
      easing: VISIBILITY_EASING,
      useNativeDriver: true,
    }).start();
  }, [headerVisibility, VISIBILITY_EASING, footerVisibility]);

  const hideBars = useCallback(() => {
    if (!barsVisibleRef.current) {
      return;
    }
    barsVisibleRef.current = false;
    headerVisibility.stopAnimation();
    footerVisibility.stopAnimation();
    Animated.timing(headerVisibility, {
      toValue: 0,
      duration: VISIBILITY_DURATION,
      easing: VISIBILITY_EASING,
      useNativeDriver: true,
    }).start();
    Animated.timing(footerVisibility, {
      toValue: 0,
      duration: VISIBILITY_DURATION,
      easing: VISIBILITY_EASING,
      useNativeDriver: true,
    }).start();
  }, [headerVisibility, VISIBILITY_EASING, footerVisibility]);

  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const rawValue = event?.nativeEvent?.contentOffset?.y ?? 0;
          const nextValue = Math.max(0, rawValue);
          const diff = nextValue - lastScrollRef.current;
          const hideThreshold = 4;
          const showThreshold = -4;
          const minScrollToHide = 24;
          if (nextValue > 8 && !hasUserInteractedRef.current) {
            hasUserInteractedRef.current = true;
            blockEndReachedUntilInteractionRef.current = false;
          }

          if (nextValue <= 0) {
            showBars();
          } else if (diff > hideThreshold && nextValue > minScrollToHide) {
            hideBars();
          } else if (diff < showThreshold) {
            showBars();
          }

          lastScrollRef.current = nextValue;
          handleFeedScroll();
        },
      }),
    [scrollY, showBars, hideBars, handleFeedScroll]
  );

  const showBlockingLoader =
    isLoading &&
    feedOptions.page === 1 &&
    feedOptions.type !== FeedTypes.Pray &&
    feedData.length === 0;
  const feedListKey = feedOptions.type;

  const maybeStartFeedCardIntro = useCallback(
    (viewableItems: ViewToken[]) => {
      if (!shouldRunHomeFeedIntro) {
        return;
      }
      if (feedOptions.type === FeedTypes.Pray) {
        return;
      }
      if (
        showBlockingLoader ||
        !feedIntroCardsCanAnimate.current ||
        feedIntroCardsAnimated.current
      ) {
        return;
      }

      const visibleKeys = viewableItems
        .filter((viewToken) => viewToken.isViewable && typeof viewToken.index === 'number')
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .map((viewToken) =>
          getFeedEntryKey(viewToken.item as RenderFeedEntry, viewToken.index as number)
        );
      const introKeys = Array.from(new Set(visibleKeys)).slice(0, FEED_INTRO_MAX_VISIBLE_CARDS);

      if (introKeys.length < 1) {
        return;
      }

      feedIntroCardsAnimated.current = true;
      feedIntroCardsCanAnimate.current = false;
      setIntroAnimatedCardKeys(introKeys);

      const animations = introKeys.map((key, index) => {
        const value = feedIntroCardValues.current[key] ?? new Animated.Value(0);
        feedIntroCardValues.current[key] = value;
        value.setValue(0);
        return Animated.timing(value, {
          toValue: 1,
          duration: FEED_INTRO_CARD_DURATION_MS,
          delay: index * FEED_INTRO_CARD_STAGGER_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
      });

      Animated.parallel(animations).start();
    },
    [feedOptions.type, getFeedEntryKey, showBlockingLoader, shouldRunHomeFeedIntro]
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems, changed }: { viewableItems: ViewToken[]; changed?: ViewToken[] }) => {
      latestVisibleItems.current = viewableItems;
      maybeStartFeedCardIntro(viewableItems);

      const shouldTrackVisibleSocial =
        feedOptions.type === FeedTypes.Connected || feedOptions.type === FeedTypes.ForYou;

      if (shouldTrackVisibleSocial) {
        const nextVisibleSocialIds = new Set<string>();
        viewableItems.forEach((tokenItem) => {
          if (!tokenItem.isViewable) {
            return;
          }

          const renderEntry = tokenItem.item as RenderFeedEntry;
          if (isSuggestionsModuleItem(renderEntry)) {
            return;
          }

          const unwrappedItem = unwrapFeedItem(renderEntry as FeedEntry);
          if (!unwrappedItem || isPrayerPost(unwrappedItem)) {
            return;
          }

          const normalizedItem = normalizeFeedImage(unwrappedItem);
          if (
            !isWatchPost(normalizedItem) &&
            !isSocialPost(normalizedItem) &&
            !isLikelySocialPost(normalizedItem)
          ) {
            return;
          }

          const socialId = getFeedPostId(normalizedItem);
          if (socialId !== undefined && socialId !== null) {
            nextVisibleSocialIds.add(String(socialId));
          }
        });

        setViewableSocialPostIds((previous) => {
          if (previous.size === nextVisibleSocialIds.size) {
            let isUnchanged = true;
            previous.forEach((id) => {
              if (!nextVisibleSocialIds.has(id)) {
                isUnchanged = false;
              }
            });
            if (isUnchanged) {
              return previous;
            }
          }
          return nextVisibleSocialIds;
        });
      } else {
        setViewableSocialPostIds((previous) => (previous.size > 0 ? new Set<string>() : previous));
      }

      if (!isTelemetryTrackedFeedType(feedOptions.type)) {
        return;
      }
      const telemetryFeedType = feedOptions.type;

      const relevantTokens = changed ?? viewableItems;
      if (!Array.isArray(relevantTokens) || relevantTokens.length < 1) {
        return;
      }

      relevantTokens.forEach((tokenItem) => {
        const telemetryPayload = getTelemetryFromRenderEntry(tokenItem.item as RenderFeedEntry);
        if (!telemetryPayload) {
          return;
        }

        const requestId = getFeedTelemetryRequestId(telemetryFeedType);
        const telemetryKey = `${telemetryFeedType}:${requestId}:${telemetryPayload.postId}`;
        const rankPosition =
          typeof tokenItem.index === 'number' && tokenItem.index >= 0 ? tokenItem.index : 0;
        if (tokenItem.isViewable) {
          if (!feedVisibleStartByKeyRef.current.has(telemetryKey)) {
            feedVisibleStartByKeyRef.current.set(telemetryKey, {
              feedType: telemetryFeedType,
              payload: telemetryPayload,
              rankPosition,
              requestId,
              startedAt: Date.now(),
            });
          }
          if (!feedImpressionsByKeyRef.current.has(telemetryKey)) {
            feedImpressionsByKeyRef.current.add(telemetryKey);
            trackHomeTelemetryWithPayload(
              telemetryPayload,
              rankPosition,
              'post_impression',
              undefined,
              { requestId },
              telemetryFeedType
            );
          }
          return;
        }

        if (!feedVisibleStartByKeyRef.current.has(telemetryKey)) {
          return;
        }
        finalizeFeedTelemetryRecord(telemetryKey, 'view_end');
      });
    },
    [
      feedOptions.type,
      finalizeFeedTelemetryRecord,
      getFeedTelemetryRequestId,
      getTelemetryFromRenderEntry,
      maybeStartFeedCardIntro,
      trackHomeTelemetryWithPayload,
    ]
  );

  const feedViewabilityConfig = useRef({
    minimumViewTime: 40,
    itemVisiblePercentThreshold: 55,
  }).current;

  useObservedEffect(() => {
    return () => {
      if (!isTelemetryTrackedFeedType(feedOptions.type)) {
        return;
      }
      finalizeVisibleFeedTelemetry(feedOptions.type, 'feed_cleanup');
      clearFeedTelemetryStateForType(feedOptions.type);
      flushFeedTelemetry(token || undefined).catch(() => undefined);
    };
  }, [clearFeedTelemetryStateForType, feedOptions.type, finalizeVisibleFeedTelemetry, token]);

  useObservedEffect(() => {
    if (!shouldRunHomeFeedIntro) {
      feedIntroHeaderOpacity.setValue(1);
      feedIntroHeaderTranslateY.setValue(0);
      return;
    }

    if (feedOptions.type === FeedTypes.Pray) {
      feedIntroHeaderOpacity.setValue(1);
      feedIntroHeaderTranslateY.setValue(0);
      return;
    }

    if (feedIntroHasStarted.current) {
      return;
    }

    feedIntroHasStarted.current = true;
    feedIntroHeaderOpacity.setValue(0);
    feedIntroHeaderTranslateY.setValue(-22);

    Animated.parallel([
      Animated.timing(feedIntroHeaderOpacity, {
        toValue: 1,
        duration: FEED_INTRO_HEADER_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(feedIntroHeaderTranslateY, {
        toValue: 0,
        duration: FEED_INTRO_HEADER_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (feedIntroDelayTimeout.current) {
        clearTimeout(feedIntroDelayTimeout.current);
      }
      feedIntroDelayTimeout.current = setTimeout(() => {
        if (feedIntroCardsAnimated.current) {
          return;
        }
        feedIntroCardsCanAnimate.current = true;
        maybeStartFeedCardIntro(latestVisibleItems.current);
      }, FEED_INTRO_CARDS_DELAY_MS);
    });
  }, [
    feedOptions.type,
    feedIntroHeaderOpacity,
    feedIntroHeaderTranslateY,
    maybeStartFeedCardIntro,
    rootTabReplayToken,
    shouldRunHomeFeedIntro,
  ]);

  useMountEffect(() => {
    return () => {
      if (feedIntroDelayTimeout.current) {
        clearTimeout(feedIntroDelayTimeout.current);
      }
    };
  });

  useObservedEffect(() => {
    if (!showBlockingLoader) {
      maybeStartFeedCardIntro(latestVisibleItems.current);
    }
  }, [maybeStartFeedCardIntro, showBlockingLoader]);

  useFocusEffect(
    useCallback(() => {
      if (!hasHandledInitialFocusRef.current) {
        hasHandledInitialFocusRef.current = true;
        return undefined;
      }

      if (feedTypeRef.current === FeedTypes.Pray) {
        return undefined;
      }

      if (preserveFeedPositionOnNextFocusRef.current) {
        preserveFeedPositionOnNextFocusRef.current = false;
        return undefined;
      }

      if (skipNextFocusRefreshRef.current) {
        skipNextFocusRefreshRef.current = false;
        return undefined;
      }

      const now = Date.now();
      const isFeedStale =
        !lastSuccessfulLoadAtRef.current || now - lastSuccessfulLoadAtRef.current >= FEED_STALE_MS;
      if (!isFeedStale) {
        return undefined;
      }

      requestFeedRefresh({
        reason: 'focus_stale',
        targetType: feedTypeRef.current,
        scrollToTop: false,
        forceNetwork: false,
        allowReorder: false,
        hardReset: false,
        showRefreshSpinner: false,
      });

      return undefined;
    }, [requestFeedRefresh])
  );

  useFocusEffect(
    useCallback(() => {
      lastScrollRef.current = 0;
      barsVisibleRef.current = true;
      headerVisibility.stopAnimation();
      footerVisibility.stopAnimation();
      scrollY.stopAnimation();
      headerVisibility.setValue(1);
      footerVisibility.setValue(1);
      scrollY.setValue(0);
      tabBarAnimationRef.current?.setTabBarTranslateY(0);

      const frameId = requestAnimationFrame(() => {
        tabBarAnimationRef.current?.setTabBarTranslateY(footerTranslateY);
      });

      return () => {
        cancelAnimationFrame(frameId);
        tabBarAnimationRef.current?.resetTabBar();
      };
    }, [footerTranslateY, footerVisibility, headerVisibility, scrollY])
  );

  const handleFeedRefresh = useCallback(() => {
    if (feedOptions.type === FeedTypes.Pray || isRefreshing) {
      if (__DEV__ && Platform.OS === 'ios') {
        console.log('[Home Refresh] Ignored pull refresh trigger', {
          feedType: feedOptions.type,
          isRefreshing,
        });
      }
      return;
    }

    if (__DEV__ && Platform.OS === 'ios') {
      console.log('[Home Refresh] Pull refresh requested', {
        feedType: feedTypeRef.current,
      });
    }

    requestFeedRefresh({
      reason: 'manual_pull',
      targetType: feedTypeRef.current,
      scrollToTop: false,
      forceNetwork: true,
      allowReorder: isPrimarySocialFeedType(feedTypeRef.current),
      hardReset: false,
      showRefreshSpinner: true,
      refreshSeed: Date.now(),
    });
  }, [feedOptions.type, isRefreshing, requestFeedRefresh]);
  feedRefreshRef.current = handleFeedRefresh;

  useObservedEffect(() => {
    if (__DEV__ && Platform.OS === 'ios') {
      console.log('[Home Refresh] Spinner state changed', {
        isRefreshing,
        feedType: feedOptions.type,
      });
    }
  }, [feedOptions.type, isRefreshing]);

  const handleFeedEndReached = useCallback(() => {
    if (
      feedOptions.type !== FeedTypes.Pray &&
      hasUserInteractedRef.current &&
      !blockEndReachedUntilInteractionRef.current &&
      !isLoading &&
      !isLoadingMore &&
      !isRefreshing &&
      !isEndOfList &&
      feedData.length > 0 &&
      !isPaginatingRef.current
    ) {
      isPaginatingRef.current = true;
      setIsLoadingMore(true);
      setFeedOptions((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  }, [feedData.length, feedOptions.type, isEndOfList, isLoading, isLoadingMore, isRefreshing]);

  const listContentContainerStyle = useMemo(
    () => ({
      paddingTop: Platform.OS === 'ios' ? spacing.x10 : headerInset,
      paddingBottom: footerHeight + spacing.x8,
    }),
    [footerHeight, headerInset]
  );

  const feedListHeaderComponent = useMemo(() => {
    if (feedOptions.type !== FeedTypes.Connected && feedOptions.type !== FeedTypes.ForYou) {
      return null;
    }

    return (
      <Animated.View style={getSpringboardStyle(2)}>
        <StatusInput
          dark={dark}
          textColor={colors.text}
          value={quickPostText}
          onChangeText={setQuickPostText}
          onActionPress={handleQuickComposerAction}
          hasText={hasQuickPostText}
          isSubmitting={isQuickPosting}
        />
      </Animated.View>
    );
  }, [
    colors.text,
    dark,
    feedOptions.type,
    getSpringboardStyle,
    handleQuickComposerAction,
    hasQuickPostText,
    isQuickPosting,
    quickPostText,
  ]);

  const feedRefreshControl = useMemo(() => {
    const iosSpinnerColor = dark ? BRAND.gray100 : BRAND.primaryDark;
    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={handleFeedRefresh}
        progressViewOffset={Platform.OS === 'ios' ? iosRefreshOffset : headerInset}
        tintColor={iosSpinnerColor}
        titleColor={iosSpinnerColor}
        colors={[BRAND.primaryDark]}
      />
    );
  }, [dark, handleFeedRefresh, headerInset, iosRefreshOffset, isRefreshing]);

  let mainFeedContent: React.ReactNode;

  if (showBlockingLoader) {
    mainFeedContent = (
      <View style={[styles.loading, { paddingTop: resolvedHeaderHeight }]}>
        <ActivityIndicator size="large" color={BRAND.primaryDark} />
      </View>
    );
  } else if (feedOptions.type === FeedTypes.Pray) {
    mainFeedContent = (
      <PrayerWallTabs
        topInset={resolvedHeaderHeight + spacing.x5}
        bottomInset={footerHeight + spacing.x16}
        wallRefreshSignal={prayerWallRefreshSignal}
        onNewPrayerPress={handleNewPrayerPress}
        onOpenPost={handleOpenPrayerPost}
        onEditPost={handleEditPrayerPost}
      />
    );
  } else {
    mainFeedContent = (
      <AnimatedFlatList
        key={`feed-${feedListKey}`}
        ref={listRef}
        data={feedDataWithSuggestions}
        keyExtractor={getFeedEntryKey}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={HOME_FEED_LIST_BATCH_CONFIG.initialNumToRender}
        maxToRenderPerBatch={HOME_FEED_LIST_BATCH_CONFIG.maxToRenderPerBatch}
        updateCellsBatchingPeriod={16}
        windowSize={HOME_FEED_LIST_BATCH_CONFIG.windowSize}
        contentContainerStyle={listContentContainerStyle}
        contentInset={Platform.OS === 'ios' ? { top: resolvedHeaderHeight } : undefined}
        scrollIndicatorInsets={Platform.OS === 'ios' ? { top: resolvedHeaderHeight } : undefined}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        alwaysBounceVertical={Platform.OS === 'ios'}
        ListHeaderComponent={feedListHeaderComponent}
        ListEmptyComponent={emptyFeedState}
        ListFooterComponent={endOfFeedFooter}
        renderItem={renderFeedItem}
        refreshControl={feedRefreshControl}
        onEndReachedThreshold={0.5}
        onEndReached={handleFeedEndReached}
        onScroll={handleScroll}
        onScrollBeginDrag={() => {
          hasUserInteractedRef.current = true;
          blockEndReachedUntilInteractionRef.current = false;
          scrollIntent.onScrollBeginDrag();
        }}
        onScrollEndDrag={scrollIntent.onScrollEndDrag}
        onMomentumScrollBegin={() => {
          hasUserInteractedRef.current = true;
          blockEndReachedUntilInteractionRef.current = false;
          scrollIntent.onMomentumScrollBegin();
        }}
        onMomentumScrollEnd={scrollIntent.onMomentumScrollEnd}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={feedViewabilityConfig}
        scrollEventThrottle={16}
      />
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: dark ? Colors.neutral[900] : BRAND.gray100 }]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          },
          getSpringboardStyle(0),
        ]}
      >
        <Animated.View
          style={{
            opacity: hideFloatingHeaderForIOSRefresh ? 0 : feedIntroHeaderOpacity,
            transform: [
              {
                translateY: Animated.add(headerTranslateY, feedIntroHeaderTranslateY),
              },
            ],
          }}
        >
          {renderOverlayHeader()}
        </Animated.View>
      </Animated.View>

      {/* Main Feed */}
      <Animated.View style={[{ flex: 1 }, getSpringboardStyle(1)]}>{mainFeedContent}</Animated.View>
      {imageViewer}
    </View>
  );
}

export default Home;
