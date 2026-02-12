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
import { TabView, SceneRendererProps, NavigationState } from 'react-native-tab-view';

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
import { Menu } from 'iconoir-react-native';
import { useTabBarAnimation } from '@/navigator/TabBarAnimationContext';

import styles from './styles';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';

import StyledText from '@/components/styled/Text';
import ArticleItem from '@/components/listItems/ArticleItem';
import SocialItem from '@/components/listItems/SocialItem';
import PrayerItem from '@/components/listItems/PrayerItem';
import { ArticleType, PrayerPost, SocialPost, User } from '@/utils/types';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import useScrollIntentLock from '@/src/hooks/useScrollIntentLock';
import { getHeight } from '@/utils/ResponsiveFun';
import Logo from '@/assets/icons/logo.svg';
import LogoWhite from '@/assets/icons/logo_white.svg';
import WallComponent from '@/components/prayerWallComponent';
import PrayersComponent from '@/components/prayerWallMyPrayersComponent';
import TestimoniesComponent from '@/components/prayerWallTestimoniesComponent';
import PrayerWallSavedPrayersComponent from '@/components/prayerWallSavedPrayersComponent';
import prayerTabStyles from '@/src/screens/main/prayer/styles';

import {
  HomeStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MainStackParamList,
} from '@/src/navigator/types';

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
  type?: 'social' | 'posts';
  body?: string;
  content?: string;
  postId?: string;
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

const isSuggestionsModuleItem = (entry: RenderFeedEntry): entry is SuggestionsModuleItem =>
  'type' in entry && entry.type === 'suggestionsModule';

const isRssEntry = (entry: FeedEntry) => {
  if (!entry) return false;
  if ('type' in entry && entry.type === 'posts') return true;
  if ('type' in entry && entry.type === 'relatedContent') {
    return entry.item?.type === 'posts';
  }
  if ('type' in entry && entry.type === 'tasteBreaker') {
    return entry.items?.[0]?.type === 'posts';
  }
  return false;
};

const filterOutRssEntries = (entries: FeedEntry[]) => entries.filter((entry) => !isRssEntry(entry));

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
  const seen = new Set<string>();
  const merged: FeedEntry[] = [];

  [...previous, ...incoming].forEach((entry, index) => {
    const identity = getFeedEntryIdentity(entry) ?? `fallback:${index}`;
    if (seen.has(identity)) {
      return;
    }
    seen.add(identity);
    merged.push(entry);
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

type PrayerWallRoute = {
  key: string;
  title: string;
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
  const { colors, dark } = useTheme();
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
    outputRange: [0, 56],
    extrapolate: 'clamp',
  });
  const prayerSubtabTranslateY = prayerSubtabsVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
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
        renderTabBar={(
          props: SceneRendererProps & {
            navigationState: NavigationState<PrayerWallRoute>;
          }
        ) => {
          return (
            <Animated.View
              pointerEvents={areSubtabsVisible ? 'auto' : 'none'}
              style={{
                height: prayerSubtabContainerHeight,
                opacity: prayerSubtabsVisibility,
                transform: [{ translateY: prayerSubtabTranslateY }],
                overflow: 'hidden',
              }}
            >
              <View style={prayerTabStyles.tabBar}>
                {props.navigationState.routes.map((route, i) => {
                  const isActive = props.navigationState.index === i;
                  return (
                    <TouchableOpacity
                      key={route.key}
                      style={prayerTabStyles.tabItem}
                      onPress={() => {
                        if (isActive) {
                          if (route.key === 'Wall') {
                            refreshWallFeed();
                          }
                          return;
                        }
                        applyPrayerTabIndex(i);
                      }}
                    >
                      <StyledText
                        style={
                          isActive
                            ? { color: colors.text, fontWeight: 'bold' }
                            : { color: colors.text }
                        }
                      >
                        {route.title}
                      </StyledText>
                      {isActive ? <View style={prayerTabStyles.viewun} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
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
  userAvatar,
  dark,
  textColor,
}: {
  userAvatar?: string;
  dark: boolean;
  textColor: string;
}) {
  return (
    <View
      style={[styles.promptContainer, { backgroundColor: dark ? BRAND.cardDark : BRAND.white }]}
    >
      <Image
        source={{ uri: userAvatar || 'https://via.placeholder.com/40' }}
        style={styles.avatarSmall}
      />
      <TextInput
        placeholder="What's on your mind?"
        placeholderTextColor={BRAND.gray400}
        style={[styles.promptInput, { color: textColor }]}
      />
      <TouchableOpacity
        style={[
          styles.promptIcon,
          { backgroundColor: dark ? 'rgba(18, 107, 135, 0.2)' : 'rgba(18, 107, 135, 0.1)' },
        ]}
      >
        <Gallery size={20} color={BRAND.primaryDark} variant="Bold" />
      </TouchableOpacity>
    </View>
  );
}

const getSuggestionUserId = (user: User) => user.id || user._id || user.userId || '';

type SuggestionsRailProps = {
  title: string;
  users: User[];
  dark: boolean;
  connectingUserIds: string[];
  onConnect: (userId: string) => void;
  onOpenProfile: (userId: string) => void;
  onSeeAll: () => void;
};

function SuggestionsRail({
  title,
  users,
  dark,
  connectingUserIds,
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
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.discoveryScrollContent}
      >
        {visibleUsers.map((user, index) => {
          const suggestionId = getSuggestionUserId(user);
          const isConnecting = connectingUserIds.includes(suggestionId);
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
                disabled={!suggestionId || isConnecting}
                onPress={() => onConnect(suggestionId)}
                style={[styles.discoveryConnectButton, isConnecting && { opacity: 0.6 }]}
              >
                <StyledText style={styles.discoveryConnectButtonText}>
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </StyledText>
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
  const token = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector(
    (state: RootState) => state.auth.getProfileData
  ) as UserProfile | null;
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeightRef = useRef(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRowHeight = getHeight(5.8);
  const headerSideWidth = headerRowHeight;
  const footerHeight = getHeight(7) + insets.bottom;
  const defaultHeaderHeight = insets.top + headerRowHeight + spacing.x10 + spacing.x8 + 20;
  const glassOverlayColor = dark ? 'rgba(13,13,13,0.7)' : 'rgba(246,246,247,0.7)';
  const androidHeaderBackground = dark ? 'rgba(13,13,13,0.92)' : 'rgba(246,246,247,0.92)';
  const androidHeaderBorderColor = dark ? 'rgba(255,255,255,0.08)' : BRAND.gray100;
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
  const pendingScrollToTopRef = useRef(false);
  const preserveFeedPositionOnNextFocusRef = useRef(false);
  const hasHandledInitialFocusRef = useRef(false);
  const feedTypeRef = useRef<FeedTypes>(feedOptions.type);
  const feedIntroHeaderOpacity = useRef(new Animated.Value(0)).current;
  const feedIntroHeaderTranslateY = useRef(new Animated.Value(-22)).current;
  const feedIntroHasStarted = useRef(false);
  const feedIntroCardsCanAnimate = useRef(false);
  const feedIntroCardsAnimated = useRef(false);
  const feedIntroDelayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedIntroCardValues = useRef<Record<string, Animated.Value>>({});
  const latestVisibleItems = useRef<ViewToken[]>([]);
  const suggestionsRequestSequenceRef = useRef(0);
  const isPaginatingRef = useRef(false);
  const [peopleYouMayKnowUsers, setPeopleYouMayKnowUsers] = useState<User[]>([]);
  const [suggestedForYouUsers, setSuggestedForYouUsers] = useState<User[]>([]);
  const [connectingSuggestionIds, setConnectingSuggestionIds] = useState<string[]>([]);
  const [introAnimatedCardKeys, setIntroAnimatedCardKeys] = useState<string[]>([]);
  const introAnimatedCardKeySet = useMemo(
    () => new Set(introAnimatedCardKeys),
    [introAnimatedCardKeys]
  );
  const listRef = useRef<FlatList<RenderFeedEntry>>(null);
  const renderEntryFallbackKeyMapRef = useRef(new WeakMap<object, string>());
  const renderEntryFallbackKeySequenceRef = useRef(0);
  useScrollToTop(listRef as any);
  const scrollIntent = useScrollIntentLock();

  const handleNewPrayerPress = useCallback(() => {
    navigation.navigate('PrayerWall', { screen: 'Prayer' } as any);
  }, [navigation]);

  const handleOpenPrayerPost = useCallback(
    (postId: string) => {
      navigation.navigate('PrayerWall', { screen: 'Single', params: { postId } } as any);
    },
    [navigation]
  );

  const handleEditPrayerPost = useCallback(
    (postId: string) => {
      navigation.navigate('PrayerWall', { screen: 'Prayer', params: { postId } } as any);
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

  const reloadFeed = useCallback(
    (nextType: FeedTypes) => {
      feedRequestSequenceRef.current += 1;
      isPaginatingRef.current = false;
      setIsRefreshing(false);
      setIsLoadingMore(false);
      setFeedData([]);
      setIsEndOfList(false);
      setFeedOptions({ type: nextType, page: 1 });
      if (nextType !== FeedTypes.Pray) {
        setFeedRefreshToken((previous) => previous + 1);
        scrollFeedToTop();
      } else {
        pendingScrollToTopRef.current = false;
      }
    },
    [scrollFeedToTop]
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
      if (!id || connectingSuggestionIds.includes(id)) {
        return;
      }
      setConnectingSuggestionIds((previous) => [...previous, id]);
      try {
        const res = await ApiCall({
          route: `user/subscribe/${id}`,
          token,
          verb: 'patch',
        });
        if (res?.status === 200) {
          setPeopleYouMayKnowUsers((previous) =>
            previous.filter((candidate) => getSuggestionUserId(candidate) !== id)
          );
          setSuggestedForYouUsers((previous) =>
            previous.filter((candidate) => getSuggestionUserId(candidate) !== id)
          );
        }
      } catch (error) {
        // no-op: UI state already protects against duplicate taps
      } finally {
        setConnectingSuggestionIds((previous) =>
          previous.filter((candidateId) => candidateId !== id)
        );
      }
    },
    [connectingSuggestionIds, token]
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

      setPeopleYouMayKnowUsers(peopleResult);
      setSuggestedForYouUsers(suggestedResult);
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
      if (isFirstPageLoad) {
        isPaginatingRef.current = false;
        setIsLoading(true);
        setIsLoadingMore(false);
      } else {
        setIsLoadingMore(true);
      }
      const requestSequence = ++feedRequestSequenceRef.current;
      try {
        const isPrayerFeed = type === FeedTypes.Pray;
        const refreshQuery = !isPrayerFeed && pageNumber === 1 ? `?refresh=${Date.now()}` : '';
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
          const sanitizedResponse =
            type === FeedTypes.Connected ? filterOutRssEntries(response as FeedEntry[]) : response;
          if (pageNumber === 1) {
            setIsEndOfList(sanitizedResponse.length < 1);
            setFeedData(mergeUniqueFeedEntries([], sanitizedResponse));
          } else if (sanitizedResponse.length < 1) {
            setIsEndOfList(true);
          } else {
            setFeedData((previous) => mergeUniqueFeedEntries(previous, sanitizedResponse));
          }
        } else {
          if (requestSequence !== feedRequestSequenceRef.current) {
            return;
          }
          if (pageNumber === 1) {
            setFeedData([]);
          }
          setIsEndOfList(true);
        }
      } catch (e: any) {
        if (requestSequence !== feedRequestSequenceRef.current) {
          return;
        }
        if (pageNumber === 1) {
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
    },
    [token]
  );

  useEffect(() => {
    if (feedOptions.type === FeedTypes.Pray) {
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
        navigation.navigate('MainRoot', {
          screen: 'Main',
          params: { screen: 'HomeTab', params: { screen: 'WatchPortal' } },
        });
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

  useEffect(() => {
    feedTypeRef.current = feedOptions.type;
  }, [feedOptions.type]);

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
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={value}
              style={[styles.tabItem, isActive && styles.tabItemSelected]}
              onPress={() => handleTabChange(value)}
            >
              <StyledText style={[styles.tabText, isActive && styles.tabTextSelected]}>
                {label}
              </StyledText>
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
              <Menu color={dark ? BRAND.gray100 : BRAND.primaryDark} height={24} width={24} />
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
      headerRowHeight,
      headerSideWidth,
      insets.top,
      renderTabs,
      tabContainerGlassStyle,
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
              <Menu color={dark ? BRAND.gray100 : BRAND.primaryDark} height={24} width={24} />
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
    headerRowHeight,
    headerSideWidth,
    insets.top,
    renderHeader,
    renderTabs,
  ]);

  useLayoutEffect(() => {
    stackNavigation.setOptions({ headerShown: false });
  }, [stackNavigation]);

  // --- NAVIGATION HANDLERS ---
  const navigateToDetail = (item: FeedPost) => {
    preserveFeedPositionOnNextFocus();
    // Logic from your old code to determine destination
    if (item.type === 'social' || item.postId) {
      navigation.navigate('SinglePost', {
        postId: item.postId || item.id,
      } as any);
    } else {
      navigation.navigate('SingleRss', {
        postId: item.id,
      } as any);
    }
  };

  const navigateToProfile = () => {};

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

  const isLikelySocialPost = (entry: FeedPost) => {
    const entryId = entry.postId || ('_id' in entry ? entry._id : undefined);
    return Boolean(
      (entry.content ||
        entry.body ||
        (typeof entry.title === 'string' ? entry.title : entry.title?.a?.$text)) &&
        entryId &&
        entry.userData
    );
  };

  const isRssPost = (entry: FeedPost): entry is ArticleType & { type?: 'posts' } =>
    entry.type === 'posts';

  // --- RENDER ITEM LOGIC (Fixes "Data not generating") ---
  const renderFeedItem: ListRenderItem<RenderFeedEntry> = ({ item, index }) => {
    if (isSuggestionsModuleItem(item)) {
      const isPeopleModule = item.moduleType === 'peopleYouMayKnow';
      return (
        <SuggestionsRail
          title={isPeopleModule ? 'People You May Know' : 'Suggested For You'}
          users={isPeopleModule ? peopleYouMayKnowUsers : suggestedForYouUsers}
          dark={dark}
          connectingUserIds={connectingSuggestionIds}
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

      if (isSocialPost(normalizedWithImage) || isLikelySocialPost(normalizedWithImage)) {
        const socialBody = 'body' in normalizedWithImage ? normalizedWithImage.body : undefined;
        const socialItem = {
          ...normalizedWithImage,
          type: 'social',
          content:
            normalizedWithImage.content ||
            socialBody ||
            (typeof normalizedWithImage.title === 'string'
              ? normalizedWithImage.title
              : normalizedWithImage.title?.a?.$text) ||
            '',
          reactions: normalizedWithImage.reactions ?? [],
        } as SocialPost & { type?: 'social' };
        renderedItem = (
          <SocialItem
            itemData={socialItem}
            scrollIntent={scrollIntent}
            removePost={() => undefined}
            parentRefreshContent={() => {
              getFeedData(feedOptions.type, 1);
            }}
            fromSavedPosts={false}
            onCommentsPress={() => {
              preserveFeedPositionOnNextFocus();
              const postId = socialItem.postId ?? socialItem.id ?? socialItem._id;
              if (postId) {
                navigation.navigate('SinglePost', { postId } as any);
              }
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
        renderedItem = (
          <ArticleItem
            item={rssItem}
            imageSizeType="cover"
            showModal={() => undefined}
            onCommentsPress={() => {
              preserveFeedPositionOnNextFocus();
              if (rssItem.id) {
                navigation.navigate('SingleRss', { postId: rssItem.id } as any);
              }
            }}
          />
        );
      } else {
        renderedItem = (
          <ModernFeedCard
            item={normalizedWithImage}
            onPress={() => navigateToDetail(normalizedWithImage)}
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
  };

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
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerVisibility = useRef(new Animated.Value(1)).current;
  const footerVisibility = useRef(new Animated.Value(1)).current;
  const lastScrollRef = useRef(0);
  const resolvedHeaderHeight = headerHeight || defaultHeaderHeight;
  const headerInset = resolvedHeaderHeight + spacing.x10;
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

  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const rawValue = event?.nativeEvent?.contentOffset?.y ?? 0;
          const nextValue = Math.max(0, rawValue);
          const diff = nextValue - lastScrollRef.current;
          const threshold = 1;

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
  const feedListKey = `${feedOptions.type}-${feedRefreshToken}`;

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
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      latestVisibleItems.current = viewableItems;
      maybeStartFeedCardIntro(viewableItems);
    },
    [maybeStartFeedCardIntro]
  );

  const feedViewabilityConfig = useRef({
    minimumViewTime: 40,
    itemVisiblePercentThreshold: 55,
  }).current;

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

      reloadFeed(feedTypeRef.current);

      return undefined;
    }, [reloadFeed])
  );

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent?.();
      if (!parent) return undefined;

      tabBarAnimation?.setTabBarTranslateY(footerTranslateY);

      const shouldShowTabBar = feedOptions.type !== FeedTypes.Pray;
      const baseTabStyle = {
        height: footerHeight,
        paddingBottom: insets.bottom,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: Platform.OS === 'android' ? colors.background : 'transparent',
        zIndex: 20,
        elevation: 20,
      };

      parent.setOptions({
        tabBarStyle: shouldShowTabBar
          ? baseTabStyle
          : {
              height: 0,
              opacity: 0,
              display: 'none',
            },
      });

      return () => {
        tabBarAnimation?.resetTabBar();
        parent.setOptions({
          tabBarStyle: undefined,
        });
      };
    }, [
      colors.background,
      colors.border,
      footerHeight,
      footerTranslateY,
      feedOptions.type,
      insets.bottom,
      navigation,
      tabBarAnimation,
    ])
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
        topInset={headerInset}
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
        removeClippedSubviews={false}
        contentContainerStyle={{
          paddingTop: headerInset,
          paddingBottom: footerHeight + spacing.x16,
        }}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        ListHeaderComponent={
          feedOptions.type === FeedTypes.Connected || feedOptions.type === FeedTypes.ForYou ? (
            <StatusInput
              userAvatar={
                userProfile?.avatar ?? userProfile?.profile_image ?? userProfile?.profileImage
              }
              dark={dark}
              textColor={colors.text}
            />
          ) : null
        }
        ListEmptyComponent={emptyFeedState}
        ListFooterComponent={endOfFeedFooter}
        renderItem={renderFeedItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              getFeedData(feedOptions.type, 1);
            }}
            progressViewOffset={headerInset}
            tintColor={BRAND.primaryDark}
            colors={[BRAND.primaryDark]}
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (
            feedOptions.type !== FeedTypes.Pray &&
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
        }}
        onScroll={handleScroll}
        onScrollBeginDrag={scrollIntent.onScrollBeginDrag}
        onScrollEndDrag={scrollIntent.onScrollEndDrag}
        onMomentumScrollBegin={scrollIntent.onMomentumScrollBegin}
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
    </View>
  );
}

export default Home;
