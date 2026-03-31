import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  memo,
  useMemo,
  JSX,
} from 'react';
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
  useWindowDimensions,
  StyleProp,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewStyle,
} from 'react-native';
import { TabView } from 'react-native-tab-view';
import Toast from 'react-native-simple-toast';
import { useSelector } from 'react-redux';
import {
  CompositeScreenProps,
  useNavigation,
  useTheme,
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
import { serialize } from 'object-to-formdata';
import { useTabBarAnimation } from '@/navigator/TabBarAnimationContext';

import styles from './styles';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';

import StyledText from '@/components/styled/Text';
import ArticleItem from '@/components/listItems/ArticleItem';
import SocialItem from '@/components/listItems/SocialItem';
import PrayerItem from '@/components/listItems/PrayerItem';
import { ArticleType, PostType, PrayerPost, SocialPost, User } from '@/utils/types';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import {
  APP_HEADER_BACKGROUND_DARK,
  APP_HEADER_BACKGROUND_LIGHT,
  APP_HEADER_BORDER_DARK,
  APP_HEADER_BORDER_LIGHT,
} from '@/src/styles/headerLayout';
import useScrollIntentLock from '@/src/hooks/useScrollIntentLock';
import { getHeight } from '@/utils/ResponsiveFun';
import Logo from '@/assets/icons/logo.svg';
import LogoWhite from '@/assets/icons/logo_white.svg';
import ArrowUpIcon from '@/assets/icons/arrow-up.svg';
import ProfileFill from '@/assets/svg/ProfileFill.svg';
import WallComponent from '@/components/prayerWallComponent';
import PrayersComponent from '@/components/prayerWallMyPrayersComponent';
import TestimoniesComponent from '@/components/prayerWallTestimoniesComponent';
import PrayerWallSavedPrayersComponent from '@/components/prayerWallSavedPrayersComponent';
import GlassTabBar from '@/components/GlassTabBar';
import {
  flushFeedTelemetry,
  setFeedTelemetryAuthToken,
  trackFeedTelemetry,
} from '@/services/feedTelemetry';
import useSharedImageViewer from '@/components/imageViewer/useSharedImageViewer';

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
import type { RefreshTrigger } from './feedRefreshUtils';

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
  authorName?: string;
  authorAvatar?: string;
  source?: string | { name: string };
  user?: {
    name?: string;
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
  | FeedTypes.Watch;

const isTelemetryTrackedFeedType = (feedType: FeedTypes): feedType is TelemetryTrackedFeedType =>
  feedType === FeedTypes.Connected ||
  feedType === FeedTypes.ForYou ||
  feedType === FeedTypes.Read ||
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
  if (typeof entry.image === 'string') {
    return { ...entry, image: { url: entry.image } };
  }
  return entry;
};

const isPrayerPost = (entry: FeedPost | PrayerPost): entry is PrayerPost =>
  'category' in entry && 'commentNumber' in entry;

const isSocialPost = (entry: FeedPost): entry is SocialPost & { type?: 'social' } =>
  entry.type === 'social';

const isWatchPost = (
  entry: FeedPost
): entry is SocialPost & { type?: 'watch'; playBackId?: string } =>
  entry.type === 'watch' || (typeof entry.playBackId === 'string' && entry.playBackId.length > 0);

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
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'Wall', title: 'Wall' },
    { key: 'Testimonies', title: 'Testimonies' },
    { key: 'Saved', title: 'Saved' },
    { key: 'MyPrayers', title: 'My Prayers' },
  ]);
  const { dark, colors } = useTheme();
  const [areSubtabsVisible, setAreSubtabsVisible] = useState(true);
  const [localWallRefreshSignal, setLocalWallRefreshSignal] = useState(0);
  const previousWallRefreshSignalRef = useRef<number | undefined>(wallRefreshSignal);
  const lastPrayerScrollY = useRef(0);
  const lastPrayerSubtabToggleAt = useRef(0);
  const prayerScrollAccumulator = useRef(0);
  const areSubtabsVisibleRef = useRef(true);
  const prayerSubtabsVisibility = useRef(new Animated.Value(1)).current;
  const setSubtabsVisibility = useCallback(
    (visible: boolean) => {
      if (areSubtabsVisibleRef.current === visible) {
        return;
      }
      areSubtabsVisibleRef.current = visible;
      setAreSubtabsVisible(visible);
      Animated.timing(prayerSubtabsVisibility, {
        toValue: visible ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [prayerSubtabsVisibility]
  );
  const handlePrayerWallScroll = useCallback(
    (offsetY: number) => {
      const now = Date.now();
      const nextY = Math.max(0, offsetY);
      const delta = nextY - lastPrayerScrollY.current;
      const threshold = 6;
      const topZoneThreshold = 24;
      const toggleDistance = 18;
      const toggleCooldownMs = 180;

      if (nextY <= topZoneThreshold) {
        prayerScrollAccumulator.current = 0;
        setSubtabsVisibility(true);
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (Math.abs(delta) <= threshold) {
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (now - lastPrayerSubtabToggleAt.current < toggleCooldownMs) {
        lastPrayerScrollY.current = nextY;
        return;
      }

      if (Math.sign(prayerScrollAccumulator.current) !== Math.sign(delta)) {
        prayerScrollAccumulator.current = 0;
      }
      prayerScrollAccumulator.current += delta;

      if (prayerScrollAccumulator.current >= toggleDistance && areSubtabsVisibleRef.current) {
        setSubtabsVisibility(false);
        lastPrayerSubtabToggleAt.current = now;
        prayerScrollAccumulator.current = 0;
      } else if (
        prayerScrollAccumulator.current <= -toggleDistance &&
        !areSubtabsVisibleRef.current
      ) {
        setSubtabsVisibility(true);
        lastPrayerSubtabToggleAt.current = now;
        prayerScrollAccumulator.current = 0;
      }

      lastPrayerScrollY.current = nextY;
    },
    [setSubtabsVisibility]
  );
  const applyPrayerTabIndex = useCallback(
    (nextIndex: number) => {
      setIndex(nextIndex);
      lastPrayerScrollY.current = 0;
      prayerScrollAccumulator.current = 0;
      setSubtabsVisibility(true);
    },
    [setSubtabsVisibility]
  );
  const refreshWallFeed = useCallback(() => {
    setLocalWallRefreshSignal((previous) => previous + 1);
  }, []);

  useEffect(() => {
    if (previousWallRefreshSignalRef.current === wallRefreshSignal) {
      return;
    }
    previousWallRefreshSignalRef.current = wallRefreshSignal;
    if (index === 0) {
      refreshWallFeed();
    }
  }, [index, refreshWallFeed, wallRefreshSignal]);

  const prayerSubtabContainerHeight = prayerSubtabsVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
    extrapolate: 'clamp',
  });
  const prayerSubtabTranslateY = prayerSubtabsVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0],
    extrapolate: 'clamp',
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
      <TabView
        navigationState={{ index, routes }}
        swipeEnabled={false}
        renderScene={({ route }) => {
          switch (route.key) {
            case 'Wall':
              return (
                <WallComponent
                  refreshSignal={localWallRefreshSignal}
                  onOpenPost={onOpenPost}
                  onEditPost={onEditPost}
                  onScrollOffsetChange={handlePrayerWallScroll}
                />
              );
            case 'Testimonies':
              return (
                <TestimoniesComponent
                  onOpenPost={onOpenPost}
                  onEditPost={onEditPost}
                  onScrollOffsetChange={handlePrayerWallScroll}
                />
              );
            case 'Saved':
              return (
                <PrayerWallSavedPrayersComponent
                  onOpenPost={onOpenPost}
                  onEditPost={onEditPost}
                  onScrollOffsetChange={handlePrayerWallScroll}
                />
              );
            case 'MyPrayers':
              return (
                <PrayersComponent
                  onOpenPost={onOpenPost}
                  onEditPost={onEditPost}
                  onScrollOffsetChange={handlePrayerWallScroll}
                />
              );
            default:
              return null;
          }
        }}
        onIndexChange={applyPrayerTabIndex}
        initialLayout={{ width: layout.width }}
        sceneContainerStyle={{ paddingBottom: bottomInset / 2 }}
        renderTabBar={() => {
          return (
            <Animated.View
              pointerEvents={areSubtabsVisible ? 'auto' : 'none'}
              style={{
                height: prayerSubtabContainerHeight,
                opacity: prayerSubtabsVisibility,
                transform: [{ translateY: prayerSubtabTranslateY }],
                paddingHorizontal: 16,
                backgroundColor: colors.card,
              }}
            >
              <GlassTabBar
                tabs={routes.map((r) => r.title)}
                activeIndex={index}
                onTabChange={applyPrayerTabIndex}
                style={{ marginVertical: 2 }}
              />
            </Animated.View>
          );
        }}
      />
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
  const promptContainerColor = dark ? '#232b38' : BRAND.white;
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
                <Image
                  source={{
                    uri: user.profileImage || 'https://cdn.onebodyapp.com/user/no-image.png',
                  }}
                  style={styles.discoveryAvatar}
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

  const authorAvatar =
    item.authorAvatar ||
    item.user?.avatar ||
    item.user?.profile_image ||
    item.userData?.profileImage ||
    'https://via.placeholder.com/40';

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
          <Image source={{ uri: authorAvatar }} style={styles.avatarSmall} />
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
            <Image source={{ uri: mediaUrl }} resizeMode="contain" style={styles.mediaImage} />
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
  const layout = useWindowDimensions();
  const { imageViewer, openImages } = useSharedImageViewer();
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
  const socialItemContentWidth = Math.max(layout.width - spacing.x16 * 2 - 14, 0);
  const homeVisibleTabBarStyle = useMemo(
    () => ({
      height: getHeight(7) + insets.bottom,
      borderTopWidth: 0,
      borderTopColor: 'transparent',
      backgroundColor: 'transparent',
      elevation: 0,
      overflow: 'visible' as const,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingBottom: insets.bottom,
    }),
    [insets.bottom]
  );
  const defaultHeaderHeight = insets.top + headerRowHeight + spacing.x10 + spacing.x8 + 20;
  const glassOverlayColor = dark ? 'rgba(13,13,13,0.7)' : 'rgba(246,246,247,0.7)';
  const androidHeaderBackground = dark ? APP_HEADER_BACKGROUND_DARK : APP_HEADER_BACKGROUND_LIGHT;
  const androidHeaderBorderColor = dark ? APP_HEADER_BORDER_DARK : APP_HEADER_BORDER_LIGHT;
  const tabContainerGlassStyle = useMemo(
    () => ({
      backgroundColor: 'transparent',
      borderBottomColor: dark ? 'rgba(255,255,255,0.18)' : BRAND.gray100,
    }),
    [dark]
  );
  const androidTabContainerStyle = useMemo(
    () => ({
      backgroundColor: androidHeaderBackground,
      borderBottomWidth: 0,
      borderBottomColor: 'transparent',
    }),
    [androidHeaderBackground]
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
  const feedIntroHeaderOpacity = useRef(new Animated.Value(0)).current;
  const feedIntroHeaderTranslateY = useRef(new Animated.Value(-22)).current;
  const feedIntroHasStarted = useRef(false);
  const feedIntroCardsCanAnimate = useRef(false);
  const feedIntroCardsAnimated = useRef(false);
  const feedIntroDelayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedIntroCardValues = useRef<Record<string, Animated.Value>>({});
  const latestVisibleItems = useRef<ViewToken[]>([]);
  const suggestionsRequestSequenceRef = useRef(0);
  const suggestionsInitialFocusRef = useRef(true);
  const isPaginatingRef = useRef(false);
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
  const headerInsetRef = useRef(0);
  const renderEntryFallbackKeyMapRef = useRef(new WeakMap<object, string>());
  const renderEntryFallbackKeySequenceRef = useRef(0);
  const feedVisibleStartByKeyRef = useRef<Map<string, number>>(new Map());
  const feedImpressionsByKeyRef = useRef<Set<string>>(new Set());
  const [viewableSocialPostIds, setViewableSocialPostIds] = useState<Set<string>>(new Set());
  const scrollIntent = useScrollIntentLock();

  useEffect(() => {
    setFeedTelemetryAuthToken(token || undefined);
  }, [token]);

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
      const offset = Platform.OS === 'ios' ? -headerInsetRef.current : 0;
      listRef.current?.scrollToOffset({ offset, animated: false });
      pendingScrollToTopRef.current = false;
    });
  }, []);

  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    return (parent as any).addListener('tabPress', (e: any) => {
      if (navigation.isFocused() && !e.defaultPrevented) {
        const offset = Platform.OS === 'ios' ? -headerInsetRef.current : 0;
        listRef.current?.scrollToOffset({ offset, animated: true });
      }
    });
  }, [navigation]);

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
      if (targetType === FeedTypes.Pray) {
        feedRequestSequenceRef.current += 1;
        isPaginatingRef.current = false;
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
    [scrollFeedToTop]
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
      params: { screen: 'ExploreTab', params: { screen: 'Explore' } },
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
          route: `user/get-users-to-subscribe/1?itemsPerPage=${MAX_SUGGESTIONS_VISIBLE}${sortQuery}`,
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

  useEffect(() => {
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

      const followingSet = new Set(
        (userProfile?.following ?? []).map((id) => String(id)).filter(Boolean)
      );
      const excludeFollowed = (users: User[]) =>
        users.filter((u) => !followingSet.has(getSuggestionUserId(u)));

      setPeopleYouMayKnowUsers(excludeFollowed(peopleResult));
      setSuggestedForYouUsers(excludeFollowed(suggestedResult));
    };

    loadSuggestions();

    return () => {
      isCancelled = true;
    };
  }, [feedOptions.type, getSuggestedUsers]);

  useFocusEffect(
    useCallback(() => {
      if (suggestionsInitialFocusRef.current) {
        suggestionsInitialFocusRef.current = false;
        return;
      }

      setSelectedSuggestionIds([]);
      setPeopleYouMayKnowUsers([]);
      setSuggestedForYouUsers([]);

      if (feedOptions.type !== FeedTypes.Connected && feedOptions.type !== FeedTypes.ForYou) {
        return;
      }

      const requestSequence = ++suggestionsRequestSequenceRef.current;

      const reload = async () => {
        const [peopleResult, suggestedResult] = await Promise.all([
          getSuggestedUsers(),
          getSuggestedUsers('popular'),
        ]);

        if (requestSequence !== suggestionsRequestSequenceRef.current) {
          return;
        }

        const followingSet = new Set(
          (userProfile?.following ?? []).map((id) => String(id)).filter(Boolean)
        );
        const excludeFollowed = (users: User[]) =>
          users.filter((u) => !followingSet.has(getSuggestionUserId(u)));

        setPeopleYouMayKnowUsers(excludeFollowed(peopleResult));
        setSuggestedForYouUsers(excludeFollowed(suggestedResult));
      };

      reload();
    }, [feedOptions.type, getSuggestedUsers, userProfile?.following])
  );

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
        pendingFirstPageContextRef.current = null;
        const activeFirstPage = activeFirstPageRequestRef.current;
        if (activeFirstPage && activeFirstPage.feedType === type) {
          return;
        }
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
    [getFeedIdentitySequence, token]
  );

  useEffect(() => {
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

  const handleHeaderLogoPress = useCallback(() => {
    if (feedOptions.type === FeedTypes.Pray) {
      setPrayerWallRefreshSignal((previous) => previous + 1);
    }
  }, [feedOptions.type]);

  const handleOpenPostComposer = useCallback(() => {
    preserveFeedPositionOnNextFocus();
    navigation.navigate('Post');
  }, [navigation, preserveFeedPositionOnNextFocus]);

  const handleSubmitQuickPost = useCallback(async () => {
    const content = quickPostText.trim();
    if (!content || isQuickPosting) {
      return;
    }
    setIsQuickPosting(true);
    try {
      const result = await ApiCall({
        route: 'social/post',
        token,
        params: serialize(
          { content },
          {
            noAttributesWithArrayNotation: true,
            noFilesWithArrayNotation: true,
          }
        ),
        verb: 'post',
        isFormUrlEncode: true,
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
      }
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

  useEffect(() => {
    feedTypeRef.current = feedOptions.type;
  }, [feedOptions.type]);

  useEffect(() => {
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
                  style={[styles.tabLabelUnderline, isActive && styles.tabLabelUnderlineSelected]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <StyledText style={[styles.tabText, isActive && styles.tabTextSelected]}>
                      {feedLabel}
                    </StyledText>
                    {isActive && (
                      <ArrowDown2
                        size={14}
                        color={BRAND.primaryDark}
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
                style={[styles.tabLabelUnderline, isActive && styles.tabLabelUnderlineSelected]}
              >
                <StyledText style={[styles.tabText, isActive && styles.tabTextSelected]}>
                  {label}
                </StyledText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    ),
    [feedOptions.type, handleTabChange, toggleFeedSubType]
  );

  const renderHeader = useCallback(
    () => (
      <View onLayout={handleHeaderLayout} style={{ paddingTop: insets.top, overflow: 'hidden' }}>
        <BlurView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          blurType={dark ? 'dark' : 'light'}
          blurAmount={20}
          reducedTransparencyFallbackColor={colors.background}
        />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: glassOverlayColor }]}
        />
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
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: BRAND.gray200,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: '#126b87',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ProfileFill width={22} height={22} />
                </View>
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
          borderBottomWidth: 1,
          borderBottomColor: androidHeaderBorderColor,
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
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: BRAND.gray200,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: '#126b87',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ProfileFill width={22} height={22} />
                </View>
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
    androidHeaderBorderColor,
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

    if (!unwrapped || ('category' in unwrapped && 'commentNumber' in unwrapped)) {
      return null;
    }

    const normalized =
      typeof unwrapped.image === 'string'
        ? { ...unwrapped, image: { url: unwrapped.image } }
        : unwrapped;
    const postId = getFeedPostId(normalized);
    if (!postId) {
      return null;
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
        renderedItem = (
          <PrayerItem
            item={unwrapped}
            originFeedType={feedOptions.type}
            removePost={() => undefined}
            onCommentsPress={() => {
              const postId = unwrapped.postId ?? unwrapped.id;
              if (!postId) {
                return;
              }
              navigation.navigate('PrayerWall', {
                screen: 'Single',
                params: { postId },
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
          const watchBody = 'body' in normalizedWithImage ? normalizedWithImage.body : undefined;
          const watchItem = {
            ...normalizedWithImage,
            type: 'watch',
            mediaType: normalizedWithImage.mediaType ?? 'video',
            mediaUrl:
              normalizedWithImage.mediaUrl ||
              (normalizedWithImage.playBackId
                ? `https://stream.mux.com/${normalizedWithImage.playBackId}.m3u8`
                : undefined),
            content:
              normalizedWithImage.content ||
              watchBody ||
              getFeedTitleText(normalizedWithImage.title) ||
              '',
            reactions: normalizedWithImage.reactions ?? [],
          } as SocialPost & { type?: 'watch'; playBackId?: string };
          const watchItemId = watchItem.postId ?? watchItem.id ?? watchItem._id;
          renderedItem = (
            <SocialItem
              itemData={watchItem}
              postType={PostType.watch}
              originFeedType={feedOptions.type}
              contentWidth={socialItemContentWidth}
              onOpenImages={openImages}
              visible={
                (feedOptions.type === FeedTypes.Connected ||
                  feedOptions.type === FeedTypes.ForYou) &&
                watchItemId !== undefined &&
                watchItemId !== null &&
                viewableSocialPostIds.has(String(watchItemId))
              }
              removePost={() => undefined}
              parentRefreshContent={() => {
                getFeedData(feedOptions.type, 1);
              }}
              fromSavedPosts={false}
              onTelemetryEvent={(eventType, metadata) => {
                const postId = watchItem.postId ?? watchItem.id ?? watchItem._id;
                if (!postId || !isTelemetryTrackedFeedType(feedOptions.type)) {
                  return;
                }
                trackFeedTelemetry({
                  eventType,
                  feedType: feedOptions.type,
                  postId: String(postId),
                  postType: 'watch',
                  contentType: 'watch',
                  tags: normalizeTelemetryTags(getObjectField(watchItem, 'tags')),
                  position: index,
                  source: 'home_feed',
                  metadata,
                });
              }}
              onCommentsPress={() => {
                preserveFeedPositionOnNextFocus();
                const postId = watchItem.postId ?? watchItem.id ?? watchItem._id;
                const { playBackId } = watchItem;
                if (!postId || !playBackId) {
                  return;
                }
                navigation.push('WatchPortal', {
                  initialPostId: String(postId),
                  initialPlaybackId: playBackId,
                  initialWatchPost: {
                    ...watchItem,
                    playBackId,
                    postId: String(postId),
                  },
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
                if (!playBackId) {
                  return;
                }
                preserveFeedPositionOnNextFocus();
                if (postId && isTelemetryTrackedFeedType(feedOptions.type)) {
                  trackFeedTelemetry({
                    eventType: 'open_watch',
                    feedType: feedOptions.type,
                    postId: String(postId),
                    postType: 'watch',
                    contentType: 'watch',
                    position: index,
                    source: 'home_feed',
                  });
                }
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
          const socialBody = 'body' in normalizedWithImage ? normalizedWithImage.body : undefined;
          const socialItem = {
            ...normalizedWithImage,
            type: 'social',
            content:
              normalizedWithImage.content ||
              socialBody ||
              getFeedTitleText(normalizedWithImage.title) ||
              '',
            reactions: normalizedWithImage.reactions ?? [],
          } as SocialPost & { type?: 'social' };
          const socialItemId = socialItem.postId ?? socialItem.id ?? socialItem._id;
          renderedItem = (
            <SocialItem
              itemData={socialItem}
              originFeedType={feedOptions.type}
              contentWidth={socialItemContentWidth}
              onOpenImages={openImages}
              visible={
                (feedOptions.type === FeedTypes.Connected ||
                  feedOptions.type === FeedTypes.ForYou) &&
                socialItemId !== undefined &&
                socialItemId !== null &&
                viewableSocialPostIds.has(String(socialItemId))
              }
              removePost={() => undefined}
              parentRefreshContent={() => {
                getFeedData(feedOptions.type, 1);
              }}
              fromSavedPosts={false}
              onTelemetryEvent={(eventType, metadata) => {
                const postId = socialItem.postId ?? socialItem.id ?? socialItem._id;
                if (!postId || !isTelemetryTrackedFeedType(feedOptions.type)) {
                  return;
                }
                trackFeedTelemetry({
                  eventType,
                  feedType: feedOptions.type,
                  postId: String(postId),
                  postType: 'social',
                  contentType: socialItem.type ?? 'social',
                  tags: normalizeTelemetryTags(getObjectField(socialItem, 'tags')),
                  position: index,
                  source: 'home_feed',
                  metadata,
                });
              }}
              onCommentsPress={() => {
                preserveFeedPositionOnNextFocus();
                const postId = socialItem.postId ?? socialItem.id ?? socialItem._id;
                if (postId) {
                  if (isTelemetryTrackedFeedType(feedOptions.type)) {
                    trackFeedTelemetry({
                      eventType: 'open_post',
                      feedType: feedOptions.type,
                      postId: String(postId),
                      postType: 'social',
                      contentType: socialItem.type ?? 'social',
                      position: index,
                      source: 'home_feed',
                    });
                  }
                  navigation.navigate('SinglePost', { postId } as any);
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
                if (postId && isTelemetryTrackedFeedType(feedOptions.type)) {
                  trackFeedTelemetry({
                    eventType: 'open_watch',
                    feedType: feedOptions.type,
                    postId: String(postId),
                    postType: 'social',
                    contentType: socialItem.type ?? 'social',
                    position: index,
                    source: 'home_feed',
                  });
                }
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
          const rssItem: ArticleType = {
            ...normalizedWithImage,
            image:
              typeof normalizedWithImage.image === 'string'
                ? { url: normalizedWithImage.image }
                : normalizedWithImage.image,
            reactions: normalizedWithImage.reactions ?? [],
          };
          let rssContentType = 'posts';
          const rssTypeField = getObjectField(rssItem, 'type');
          const rssContentTypeField = getObjectField(rssItem, 'contentType');
          if (typeof rssTypeField === 'string') {
            rssContentType = rssTypeField;
          } else if (typeof rssContentTypeField === 'string') {
            rssContentType = rssContentTypeField;
          }
          renderedItem = (
            <ArticleItem
              item={rssItem}
              originFeedType={feedOptions.type}
              imageSizeType="contain"
              onTelemetryEvent={(eventType, metadata) => {
                if (!rssItem.id || !isTelemetryTrackedFeedType(feedOptions.type)) {
                  return;
                }
                trackFeedTelemetry({
                  eventType,
                  feedType: feedOptions.type,
                  postId: String(rssItem.id),
                  postType: 'rss',
                  contentType: rssContentType,
                  tags: normalizeTelemetryTags(getObjectField(rssItem, 'tags')),
                  position: index,
                  source: 'home_feed',
                  metadata,
                });
              }}
              onPress={() => {
                if (!rssItem.id || !isTelemetryTrackedFeedType(feedOptions.type)) {
                  return;
                }
                trackFeedTelemetry({
                  eventType: 'open_article',
                  feedType: feedOptions.type,
                  postId: String(rssItem.id),
                  postType: 'rss',
                  contentType: rssContentType,
                  position: index,
                  source: 'home_feed',
                });
              }}
              onCommentsPress={() => {
                preserveFeedPositionOnNextFocus();
                if (rssItem.id) {
                  if (isTelemetryTrackedFeedType(feedOptions.type)) {
                    trackFeedTelemetry({
                      eventType: 'open_comments',
                      feedType: feedOptions.type,
                      postId: String(rssItem.id),
                      postType: 'rss',
                      contentType: rssContentType,
                      position: index,
                      source: 'home_feed',
                    });
                  }
                  navigation.navigate('SingleRss', { postId: rssItem.id } as any);
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
                if (postId && isTelemetryTrackedFeedType(feedOptions.type)) {
                  trackFeedTelemetry({
                    eventType: 'open_post',
                    feedType: feedOptions.type,
                    postId,
                    postType: normalizedWithImage.type ?? 'post',
                    contentType:
                      typeof getObjectField(normalizedWithImage, 'contentType') === 'string'
                        ? (getObjectField(normalizedWithImage, 'contentType') as string)
                        : normalizedWithImage.type,
                    tags: normalizeTelemetryTags(getObjectField(normalizedWithImage, 'tags')),
                    position: index,
                    source: 'home_feed',
                  });
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
      handleConnectSuggestion,
      handleOpenExplore,
      handleOpenSuggestedProfile,
      introAnimatedCardKeySet,
      navigation,
      navigateToDetail,
      navigateToProfile,
      openImages,
      peopleYouMayKnowUsers,
      preserveFeedPositionOnNextFocus,
      selectedSuggestionIds,
      socialItemContentWidth,
      suggestedForYouUsers,
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
  const resolvedHeaderHeight = headerHeight || defaultHeaderHeight;
  const headerInset = resolvedHeaderHeight + spacing.x10;
  headerInsetRef.current = headerInset;
  const clampDistance = headerInset + footerHeight;
  const scrollClampSource = useMemo(
    () =>
      scrollY.interpolate({
        inputRange:
          Platform.OS === 'ios'
            ? [-headerInset - 100, -headerInset, clampDistance - headerInset]
            : [-100, 0, clampDistance],
        outputRange: [0, 0, clampDistance],
        extrapolate: 'clamp',
      }),
    [scrollY, clampDistance, headerInset]
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

  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const rawValue = event?.nativeEvent?.contentOffset?.y ?? 0;
          const adjustedValue =
            Platform.OS === 'ios' ? rawValue + headerInsetRef.current : rawValue;
          const nextValue = Math.max(0, adjustedValue);
          const diff = nextValue - lastScrollRef.current;
          const threshold = 1;
          if (nextValue > 8 && !hasUserInteractedRef.current) {
            hasUserInteractedRef.current = true;
            blockEndReachedUntilInteractionRef.current = false;
          }

          if (nextValue <= 0) {
            headerVisibility.setValue(1);
            footerVisibility.setValue(1);
          } else if (diff > threshold) {
            headerVisibility.setValue(0);
            footerVisibility.setValue(0);
          } else if (diff < -threshold) {
            headerVisibility.setValue(1);
            footerVisibility.setValue(1);
          }

          lastScrollRef.current = nextValue;
        },
      }),
    [footerVisibility, headerVisibility, scrollY]
  );

  const showBlockingLoader =
    isLoading &&
    feedOptions.page === 1 &&
    feedOptions.type !== FeedTypes.Pray &&
    feedData.length === 0;
  const feedListKey = feedOptions.type;

  const maybeStartFeedCardIntro = useCallback(
    (viewableItems: ViewToken[]) => {
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
    [feedOptions.type, getFeedEntryKey, showBlockingLoader]
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

        const telemetryKey = `${telemetryFeedType}:${telemetryPayload.postId}`;
        if (tokenItem.isViewable) {
          if (!feedVisibleStartByKeyRef.current.has(telemetryKey)) {
            feedVisibleStartByKeyRef.current.set(telemetryKey, Date.now());
          }
          if (!feedImpressionsByKeyRef.current.has(telemetryKey)) {
            feedImpressionsByKeyRef.current.add(telemetryKey);
            trackFeedTelemetry({
              eventType: 'impression',
              feedType: telemetryFeedType,
              postId: telemetryPayload.postId,
              postType: telemetryPayload.postType,
              contentType: telemetryPayload.contentType,
              tags: telemetryPayload.tags,
              position:
                typeof tokenItem.index === 'number' && tokenItem.index >= 0
                  ? tokenItem.index
                  : undefined,
              source: 'home_feed',
            });
          }
          return;
        }

        const startedAt = feedVisibleStartByKeyRef.current.get(telemetryKey);
        if (!startedAt) {
          return;
        }
        feedVisibleStartByKeyRef.current.delete(telemetryKey);
        const dwellTimeMs = Date.now() - startedAt;
        if (dwellTimeMs < 1200) {
          return;
        }
        trackFeedTelemetry({
          eventType: 'dwell',
          feedType: telemetryFeedType,
          postId: telemetryPayload.postId,
          postType: telemetryPayload.postType,
          contentType: telemetryPayload.contentType,
          tags: telemetryPayload.tags,
          durationMs: dwellTimeMs,
          position:
            typeof tokenItem.index === 'number' && tokenItem.index >= 0
              ? tokenItem.index
              : undefined,
          source: 'home_feed',
        });
      });
    },
    [feedOptions.type, getTelemetryFromRenderEntry, maybeStartFeedCardIntro]
  );

  const feedViewabilityConfig = useRef({
    minimumViewTime: 40,
    itemVisiblePercentThreshold: 55,
  }).current;

  useEffect(() => {
    const visibleStartByKey = feedVisibleStartByKeyRef.current;
    const impressionsByKey = feedImpressionsByKeyRef.current;

    return () => {
      if (!isTelemetryTrackedFeedType(feedOptions.type)) {
        return;
      }
      const telemetryFeedType = feedOptions.type;

      visibleStartByKey.forEach((startedAt, telemetryKey) => {
        if (!telemetryKey.startsWith(`${telemetryFeedType}:`)) {
          return;
        }

        const postId = telemetryKey.split(':')[1];
        const dwellTimeMs = Date.now() - startedAt;
        if (!postId || dwellTimeMs < 1200) {
          return;
        }

        trackFeedTelemetry({
          eventType: 'dwell',
          feedType: telemetryFeedType,
          postId,
          durationMs: dwellTimeMs,
          source: 'home_feed',
          metadata: { reason: 'feed_cleanup' },
        });
      });

      visibleStartByKey.clear();
      impressionsByKey.clear();
      flushFeedTelemetry(token || undefined).catch(() => undefined);
    };
  }, [feedOptions.type, token]);

  useEffect(() => {
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
  ]);

  useEffect(() => {
    return () => {
      if (feedIntroDelayTimeout.current) {
        clearTimeout(feedIntroDelayTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
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
      const parent = navigation.getParent?.();
      if (!parent) return undefined;

      lastScrollRef.current = 0;
      headerVisibility.setValue(1);
      footerVisibility.setValue(1);
      tabBarAnimationRef.current?.setTabBarTranslateY(0);

      if (feedOptions.type === FeedTypes.Pray) {
        tabBarAnimationRef.current?.resetTabBar();
        return () => {
          tabBarAnimationRef.current?.resetTabBar();
        };
      }

      const animationFrame = requestAnimationFrame(() => {
        tabBarAnimationRef.current?.setTabBarTranslateY(footerTranslateY);
      });

      return () => {
        cancelAnimationFrame(animationFrame);
        tabBarAnimationRef.current?.resetTabBar();
      };
    }, [feedOptions.type, footerVisibility, footerTranslateY, headerVisibility, navigation])
  );

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent?.();
      if (!parent) {
        return undefined;
      }

      if (feedOptions.type !== FeedTypes.Pray) {
        parent.setOptions({
          tabBarStyle: homeVisibleTabBarStyle,
        });
        return undefined;
      }

      parent.setOptions({
        tabBarStyle: {
          ...homeVisibleTabBarStyle,
          height: 0,
          opacity: 0,
          display: 'none',
          paddingBottom: 0,
        },
      });

      return () => {
        parent.setOptions({
          tabBarStyle: homeVisibleTabBarStyle,
        });
      };
    }, [feedOptions.type, homeVisibleTabBarStyle, navigation])
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

  useEffect(() => {
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
      paddingTop: Platform.OS === 'ios' ? 0 : headerInset,
      paddingBottom: footerHeight + spacing.x16,
    }),
    [footerHeight, headerInset]
  );

  const feedListHeaderComponent = useMemo(() => {
    if (feedOptions.type !== FeedTypes.Connected && feedOptions.type !== FeedTypes.ForYou) {
      return null;
    }

    return (
      <StatusInput
        dark={dark}
        textColor={colors.text}
        value={quickPostText}
        onChangeText={setQuickPostText}
        onActionPress={handleQuickComposerAction}
        hasText={hasQuickPostText}
        isSubmitting={isQuickPosting}
      />
    );
  }, [
    colors.text,
    dark,
    feedOptions.type,
    handleQuickComposerAction,
    hasQuickPostText,
    isQuickPosting,
    quickPostText,
  ]);

  const [refreshTintReady, setRefreshTintReady] = useState(Platform.OS !== 'ios');
  useEffect(() => {
    if (Platform.OS === 'ios' && !refreshTintReady) {
      requestAnimationFrame(() => setRefreshTintReady(true));
    }
  }, [refreshTintReady]);

  const feedRefreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={handleFeedRefresh}
        progressViewOffset={Platform.OS === 'android' ? headerInset : 0}
        tintColor={refreshTintReady ? '#126b87' : undefined}
        titleColor={refreshTintReady ? '#126b87' : undefined}
        colors={['#126b87']}
      />
    ),
    [handleFeedRefresh, headerInset, isRefreshing, refreshTintReady]
  );

  let mainFeedContent: React.ReactNode;

  if (showBlockingLoader) {
    mainFeedContent = (
      <View style={styles.loading}>
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
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={16}
        windowSize={8}
        contentContainerStyle={listContentContainerStyle}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        contentInset={Platform.OS === 'ios' ? { top: headerInset } : undefined}
        contentOffset={Platform.OS === 'ios' ? { x: 0, y: -headerInset } : undefined}
        scrollIndicatorInsets={Platform.OS === 'ios' ? { top: headerInset } : undefined}
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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          opacity: feedIntroHeaderOpacity,
          transform: [
            {
              translateY: Animated.add(headerTranslateY, feedIntroHeaderTranslateY),
            },
          ],
        }}
      >
        {renderOverlayHeader()}
      </Animated.View>

      {/* Main Feed */}
      {mainFeedContent}
      {imageViewer}
    </View>
  );
}

export default Home;
