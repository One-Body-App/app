import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type ViewToken,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { BlurView } from '@react-native-community/blur';
import { useDispatch, useSelector } from 'react-redux';
import {
  CompositeScreenProps,
  DrawerActions,
  useFocusEffect,
  useTheme,
} from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { differenceInHours, format, parseISO } from 'date-fns';
import Video from 'react-native-video';
import { getHeight } from '@/utils/ResponsiveFun';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { getUserProfile } from '@/src/redux/actions/UserAction';
import { ApiCall } from '@/src/services/api';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import SearchIcon from '@/assets/icons/search.svg';
import ProfileFill from '@/assets/svg/ProfileFill.svg';
import StyledText from '@/components/styled/Text';
import SocialItem from '@/components/listItems/SocialItem';
import PrayerItem from '@/components/listItems/PrayerItem';
import ArticleItem from '@/components/listItems/ArticleItem';
import UserItem from '@/components/listItems/UserItem';
import {
  ExploreStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import {
  CONNECT_PORTAL_LIST_DATA,
  type ConnectPortalListItem,
  type ConnectTab,
} from '@/src/screens/connectportal/data';
import {
  AccountType,
  ArticleType,
  PrayerPost,
  PrayerWallCategory,
  SocialPost,
  User,
  WatchPost,
} from '@/utils/types';
import getDeviceLocation from '@/src/services/deviceLocation';
import {
  getConnectPortalPublishedGoEvents,
  listConnectServePublicJobs,
} from '@/src/services/connectPortal';
import type {
  ConnectPortalPublishedEvent,
  ConnectServeJobPublished,
} from '@/src/services/connectPortal/types';
import useMountEffect from '@/src/hooks/useMountEffect';
import useSpringboardEntry from '@/src/hooks/useSpringboardEntry';
import { getTabRootSpringboardPreset } from '@/src/navigator/motionPolicy';
import { useRootTabSwitchReplayToken } from '@/src/navigator/RootTabTransitionContext';
import TrendingTopicsBubbles, {
  mapTrendingTopicResponse,
  TRENDING_TOPICS_MOCK_DATA,
  type TrendingTopicBubbleItem,
} from './TrendingTopicsBubbles';

type Props = CompositeScreenProps<
  StackScreenProps<ExploreStackParamsList, 'Explore'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'ExploreTab'>
  >
>;

enum SearchFeedFilter {
  top = 'top',
  latest = 'latest',
  profiles = 'profiles',
  watch = 'watch',
  connect = 'connect',
}

type SearchPostSubtype = 'social' | 'rss' | 'prayer' | 'watch';

type BaseSearchHit = {
  id?: string;
  _id?: string;
  postId?: string;
  type?: string;
  postSubtype?: SearchPostSubtype;
  sourceIndex?: string;
  title?: string | { a?: { $text?: string } };
  description?: string;
  content?: string;
  body?: string;
  link?: string;
  permalink?: string;
  image?: { url?: string } | string;
  images?: string[];
  mediaUrl?: string;
  mediaType?: string;
  comments?: any[];
  commentNumber?: number;
  reactions?: any[];
  repostCount?: number;
  category?: string;
  private?: boolean;
  answered?: boolean;
  userData?: {
    _id?: string;
    name?: string;
    username?: string;
    profileImage?: string;
    accountType?: AccountType;
    isApprovedInfluencer?: boolean;
  };
  playBackId?: string;
  created?: string | Date;
  updated?: string | Date;
};

type SearchUserResult = {
  kind: 'user';
  id: string;
  item: User;
};

type SearchSocialResult = {
  kind: 'social';
  id: string;
  item: SocialPost;
};

type SearchPrayerResult = {
  kind: 'prayer';
  id: string;
  item: PrayerPost;
};

type SearchRssResult = {
  kind: 'rss';
  id: string;
  item: ArticleType;
};

type SearchWatchResult = {
  kind: 'watch';
  id: string;
  item: WatchPost;
};

type SearchServeGoResult = {
  kind: 'servego';
  id: string;
  item: ConnectPortalListItem & {
    connectTab: ConnectTab;
    searchKind: 'serve' | 'go';
  };
};

type ExploreSearchResult =
  | SearchUserResult
  | SearchSocialResult
  | SearchPrayerResult
  | SearchRssResult
  | SearchWatchResult
  | SearchServeGoResult;

interface TrendingNowItem {
  id: string;
  backgroundImageUri: string;
  title: string;
  isLive: boolean;
  metaIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  metaText: string;
  aspectRatio: '16:9' | '4:3' | '1:1';
  playBackId?: string;
  mediaUrl?: string;
  watchPost: WatchPost;
}

interface NewCreatorItem {
  id: string;
  avatarUri: string;
  name: string;
  isFollowing: boolean;
  badge?: string;
  badgeIcon?: string;
}

interface ServeOpportunityItem {
  id: string;
  title: string;
  organization: string;
  opportunityType: string;
  distance: string;
  distanceMiles: number | null;
}

interface CommunityPrayerItem {
  post: PrayerPost;
  reactionCount: number;
}

const SEARCH_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;
const EXPLORE_HEADER_COLOR = '#032f3c';
const EXPLORE_HEADER_FONT_FAMILY = 'Rubik-Bold';
const EXPLORE_SUBHEADER_FONT_FAMILY = 'OpenSans-Regular';
const CHIP_ROW_HEIGHT = 46;
const BROWSE_TRANSITION_OUT_MS = 180;
const SEARCH_TRANSITION_IN_MS = 220;
export const TRENDING_TOPICS_ROUTE = 'tags/interest?sort=trending&limit=24';

const isKnownSubtype = (value?: string): value is SearchPostSubtype =>
  value === 'social' || value === 'rss' || value === 'prayer' || value === 'watch';

type SearchResultIdSource = {
  id?: string;
  _id?: string;
  postId?: string;
};

const resolveResultId = (value: SearchResultIdSource) => {
  const rawId = value.id ?? value._id ?? value.postId;
  return rawId ? String(rawId) : '';
};

const toDate = (value?: string | Date) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const MS_PER_DAY = 86_400_000;

const getTrendingScore = (item: BaseSearchHit, now = Date.now()) => {
  const reactionCount = Array.isArray(item.reactions) ? item.reactions.length : 0;
  const ageInDays = Math.max(0, (now - toDate(item.created).getTime()) / MS_PER_DAY);
  return reactionCount * 10 - ageInDays * 0.5;
};

const getDailySeed = (date = new Date()) =>
  date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

const getSeededIndex = (count: number, seed: number) => {
  if (count <= 1) return 0;

  let current = Math.abs(seed) % 2147483647 || 1;
  current = (current * 48271) % 2147483647;
  return Math.floor((current / 2147483647) * count);
};

const resolveTitle = (value?: string | { a?: { $text?: string } }) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value?.a?.$text ?? '';
};

const resolveImageUrl = (item: BaseSearchHit) => {
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0];
  }
  if (typeof item.image === 'string') {
    return item.image;
  }
  return item.image?.url ?? '';
};

const resolveImageList = (item: BaseSearchHit) => {
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images;
  }

  const fallbackImage = resolveImageUrl(item);
  return fallbackImage ? [fallbackImage] : [];
};

const normalizePrayerCategory = (category?: string): PrayerWallCategory => {
  const normalized = (category ?? '').toLowerCase().trim();
  if (normalized === PrayerWallCategory.Exhortation) return PrayerWallCategory.Exhortation;
  if (normalized === PrayerWallCategory.Testimony) return PrayerWallCategory.Testimony;
  if (normalized === PrayerWallCategory.AnsweredPrayer || normalized === 'answered') {
    return PrayerWallCategory.AnsweredPrayer;
  }
  return PrayerWallCategory.Request;
};

const inferSubtype = (item: BaseSearchHit): SearchPostSubtype => {
  if (isKnownSubtype(item.postSubtype)) {
    return item.postSubtype;
  }

  const sourceIndex = item.sourceIndex?.toLowerCase() ?? '';
  if (sourceIndex.includes('watch') || item.playBackId) return 'watch';
  if (sourceIndex.includes('prayer') || item.category || item.private !== undefined)
    return 'prayer';
  if (
    sourceIndex.includes('news') ||
    sourceIndex.includes('blog') ||
    sourceIndex.includes('rss') ||
    item.link
  ) {
    return 'rss';
  }
  return 'social';
};

const interleaveBalanced = (groups: ExploreSearchResult[][]): ExploreSearchResult[] => {
  const maxLength = groups.reduce((max, group) => Math.max(max, group.length), 0);
  const merged: ExploreSearchResult[] = [];

  for (let index = 0; index < maxLength; index++) {
    groups.forEach((group) => {
      if (group[index]) {
        merged.push(group[index]);
      }
    });
  }

  return merged;
};

const dedupeResults = (results: ExploreSearchResult[]) => {
  const seen = new Set<string>();
  const deduped: ExploreSearchResult[] = [];

  results.forEach((result) => {
    const key = `${result.kind}:${result.id}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    deduped.push(result);
  });

  return deduped;
};

function SearchItemSeparator() {
  return <View style={{ height: 12 }} />;
}

function Explore({ navigation }: Props) {
  const dispatch = useDispatch();
  const rootTabReplayToken = useRootTabSwitchReplayToken('ExploreTab');
  const { getSpringboardStyle } = useSpringboardEntry(rootTabReplayToken, 3, {
    preset: getTabRootSpringboardPreset('explore'),
  });
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(dark), [dark]);
  const headerTextColor = dark ? '#f8fafc' : EXPLORE_HEADER_COLOR;
  const subheaderTextColor = dark ? '#d5dae1' : EXPLORE_HEADER_COLOR;
  const primaryTextColor = dark ? '#f4f7fb' : colors.text;
  const secondaryTextColor = dark ? '#c4ccd6' : Colors.neutral[300];
  const tertiaryTextColor = dark ? '#9aa4b2' : Colors.neutral[300];
  const screenBackgroundColor = dark ? '#0a0b0d' : '#f8fafc';
  let headerBackgroundColor: string;
  if (Platform.OS === 'ios') {
    headerBackgroundColor = dark ? 'rgba(12,13,16,0.72)' : 'rgba(255,255,255,0.72)';
  } else {
    headerBackgroundColor = dark ? '#0c0d10' : '#ffffff';
  }
  const headerDividerColor = dark ? 'rgba(255,255,255,0.06)' : colors.border;
  const searchSurfaceColor = dark ? '#1c2024' : '#f1f5f9';
  const surfaceCardColor = dark ? '#15191d' : colors.card;
  const surfaceBorderColor = dark ? 'rgba(255,255,255,0.1)' : colors.border;
  const shouldUseBlurHeader = Platform.OS === 'ios';
  const [exploreHeaderHeight, setExploreHeaderHeight] = useState(0);

  const token = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector((state: RootState) => state.auth.getProfileData as User | null);

  const [activeFilter, setActiveFilter] = useState<SearchFeedFilter>(SearchFeedFilter.top);
  const [searchText, setSearchText] = useState('');

  const [trendingVideos, setTrendingVideos] = useState<WatchPost[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [newCreatorsItems, setNewCreatorsItems] = useState<NewCreatorItem[]>([]);
  const [isVoicesLoading, setIsVoicesLoading] = useState(true);
  const [communityPrayers, setCommunityPrayers] = useState<CommunityPrayerItem[]>([]);
  const [isPrayerLoading, setIsPrayerLoading] = useState(true);
  const [serveOpportunityItems, setServeOpportunityItems] = useState<ServeOpportunityItem[]>([]);
  const [isServeLoading, setIsServeLoading] = useState(true);
  const [goEvents, setGoEvents] = useState<ConnectPortalPublishedEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [popularTopicItems, setPopularTopicItems] =
    useState<TrendingTopicBubbleItem[]>(TRENDING_TOPICS_MOCK_DATA);
  const [isRefreshingBrowse, setIsRefreshingBrowse] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [searchResults, setSearchResults] = useState<ExploreSearchResult[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchLoadingMore, setIsSearchLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string>('');

  const requestSequenceRef = useRef(0);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chipOffset = useRef(new Animated.Value(0)).current;
  const browseOpacity = useRef(new Animated.Value(1)).current;
  const browseTranslateY = useRef(new Animated.Value(0)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;
  const searchTranslateY = useRef(new Animated.Value(12)).current;
  const lastScrollYRef = useRef(0);
  const chipHiddenRef = useRef(false);

  const trimmedSearchText = searchText.trim();
  const isSearchMode = trimmedSearchText.length > 0;
  const resetSearchState = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setSearchResults([]);
    setSearchError('');
    setSearchPage(1);
    setSearchHasMore(true);
    setIsSearchLoading(false);
    setIsSearchLoadingMore(false);
    setActiveFilter(SearchFeedFilter.top);
    chipHiddenRef.current = false;
    chipOffset.setValue(0);
    lastScrollYRef.current = 0;
  }, [chipOffset]);

  const handleSearchScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { y } = event.nativeEvent.contentOffset;
      const diff = y - lastScrollYRef.current;
      lastScrollYRef.current = y;

      if (y <= 0) {
        if (chipHiddenRef.current) {
          chipHiddenRef.current = false;
          Animated.timing(chipOffset, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      } else if (diff > 2 && !chipHiddenRef.current) {
        chipHiddenRef.current = true;
        Animated.timing(chipOffset, {
          toValue: -CHIP_ROW_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (diff < -2 && chipHiddenRef.current) {
        chipHiddenRef.current = false;
        Animated.timing(chipOffset, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
    [chipOffset]
  );

  const userAvatar = userProfile?.profileImage ?? '';

  const serveGoSearchPool = useMemo(() => {
    const go = (CONNECT_PORTAL_LIST_DATA['Go!'] ?? []).map((item) => ({
      ...item,
      connectTab: 'Go!' as ConnectTab,
      searchKind: 'go' as const,
    }));

    const serve = (CONNECT_PORTAL_LIST_DATA.Serve ?? []).map((item) => ({
      ...item,
      connectTab: 'Serve' as ConnectTab,
      searchKind: 'serve' as const,
    }));

    return [...go, ...serve];
  }, []);

  const getLocalServeGoPage = useCallback(
    (query: string, pageNumber: number) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        return { items: [] as SearchServeGoResult[], total: 0 };
      }

      const filtered = serveGoSearchPool.filter((item) => {
        const tags = item.tags.join(' ').toLowerCase();
        return (
          item.title.toLowerCase().includes(normalized) ||
          item.location.toLowerCase().includes(normalized) ||
          tags.includes(normalized)
        );
      });

      const start = (pageNumber - 1) * SEARCH_PAGE_SIZE;
      const pageItems = filtered.slice(start, start + SEARCH_PAGE_SIZE).map((item) => ({
        kind: 'servego' as const,
        id: item.id,
        item,
      }));

      return {
        items: pageItems,
        total: filtered.length,
      };
    },
    [serveGoSearchPool]
  );

  const buildUserResult = useCallback((raw: any): SearchUserResult | null => {
    const id = resolveResultId(raw);
    if (!id) return null;

    const user = {
      ...raw,
      id,
      _id: raw?._id ?? id,
      profile: raw?.profile ?? {},
      following: Array.isArray(raw?.following) ? raw.following : [],
    } as User;

    return { kind: 'user', id, item: user };
  }, []);

  const buildSocialResult = useCallback((raw: BaseSearchHit): SearchSocialResult | null => {
    const id = resolveResultId(raw);
    if (!id) return null;

    const fallbackUserId = String(raw.userData?._id ?? `search-social-${id}`);
    const social = {
      ...raw,
      id,
      postId: String(raw.postId ?? id),
      title: resolveTitle(raw.title),
      content: raw.content ?? raw.body ?? '',
      date: String(raw.created ?? raw.updated ?? new Date().toISOString()),
      handler: '',
      link: raw.link ?? raw.permalink ?? '',
      source: raw.type,
      reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
      comments: Array.isArray(raw.comments) ? raw.comments : [],
      commentNumber: Number(raw.commentNumber ?? 0),
      repostCount: Number(raw.repostCount ?? 0),
      images: resolveImageList(raw),
      mediaUrl: raw.mediaUrl,
      mediaType: raw.mediaType,
      userData: {
        _id: fallbackUserId,
        name: raw.userData?.name ?? 'Unknown user',
        username: raw.userData?.username ?? 'unknown',
        profileImage: raw.userData?.profileImage || NO_PROFILE_IMAGE,
        accountType: raw.userData?.accountType ?? AccountType.individual,
        isApprovedInfluencer: raw.userData?.isApprovedInfluencer,
      },
      created: toDate(raw.created),
      updated: toDate(raw.updated),
    } as SocialPost;

    return { kind: 'social', id, item: social };
  }, []);

  const buildRssResult = useCallback((raw: BaseSearchHit): SearchRssResult | null => {
    const id = resolveResultId(raw);
    if (!id) return null;

    const article = {
      id,
      link: raw.link ?? raw.permalink,
      created: toDate(raw.created),
      title: raw.title ?? raw.content ?? raw.body ?? '',
      description: raw.description,
      comments: Array.isArray(raw.comments) ? raw.comments : [],
      commentNumber: Number(raw.commentNumber ?? 0),
      repostCount: Number(raw.repostCount ?? 0),
      image: { url: resolveImageUrl(raw) || '' },
      reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
      userData: {
        _id: String(raw.userData?._id ?? `search-rss-${id}`),
        name: raw.userData?.name ?? 'One Body',
        username: raw.userData?.username ?? 'onebody',
        accountType: raw.userData?.accountType ?? AccountType.organization,
        profileImage: raw.userData?.profileImage || NO_PROFILE_IMAGE,
        isApprovedInfluencer: raw.userData?.isApprovedInfluencer,
      },
    } as ArticleType;

    return { kind: 'rss', id, item: article };
  }, []);

  const buildPrayerResult = useCallback((raw: BaseSearchHit): SearchPrayerResult | null => {
    const id = resolveResultId(raw);
    if (!id) return null;

    const prayer = {
      id,
      postId: String(raw.postId ?? id),
      content: raw.content ?? raw.body ?? '',
      date: String(raw.created ?? raw.updated ?? new Date().toISOString()),
      private: Boolean(raw.private),
      category: normalizePrayerCategory(raw.category),
      userData: {
        _id: String(raw.userData?._id ?? `search-prayer-${id}`),
        name: raw.userData?.name ?? 'Unknown user',
        username: raw.userData?.username ?? 'unknown',
        accountType: raw.userData?.accountType ?? AccountType.individual,
        profileImage: raw.userData?.profileImage || NO_PROFILE_IMAGE,
        isApprovedInfluencer: raw.userData?.isApprovedInfluencer,
      },
      answered: Boolean(raw.answered),
      images: resolveImageList(raw),
      comments: Array.isArray(raw.comments) ? raw.comments : [],
      commentNumber: Number(raw.commentNumber ?? 0),
      repostCount: Number(raw.repostCount ?? 0),
      reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
      created: toDate(raw.created),
      updated: toDate(raw.updated),
    } as PrayerPost;

    return { kind: 'prayer', id, item: prayer };
  }, []);

  const buildWatchResult = useCallback((raw: BaseSearchHit): SearchWatchResult | null => {
    const id = resolveResultId(raw);
    if (!id) return null;

    const watch = {
      ...raw,
      id,
      postId: String(raw.postId ?? id),
      playBackId: raw.playBackId,
      content: raw.content ?? raw.body ?? '',
      title: resolveTitle(raw.title),
      link: raw.link ?? raw.permalink ?? '',
      handler: '',
      date: String(raw.created ?? raw.updated ?? new Date().toISOString()),
      reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
      comments: Array.isArray(raw.comments) ? raw.comments : [],
      commentNumber: Number(raw.commentNumber ?? 0),
      userData: {
        _id: String(raw.userData?._id ?? `search-watch-${id}`),
        name: raw.userData?.name ?? 'Unknown user',
        username: raw.userData?.username ?? 'unknown',
        accountType: raw.userData?.accountType ?? AccountType.individual,
        profileImage: raw.userData?.profileImage || NO_PROFILE_IMAGE,
        isApprovedInfluencer: raw.userData?.isApprovedInfluencer,
      },
      created: toDate(raw.created),
      updated: toDate(raw.updated),
    } as WatchPost;

    return { kind: 'watch', id, item: watch };
  }, []);

  const buildPostResult = useCallback(
    (raw: BaseSearchHit): ExploreSearchResult | null => {
      const subtype = inferSubtype(raw);
      if (subtype === 'social') return buildSocialResult(raw);
      if (subtype === 'prayer') return buildPrayerResult(raw);
      if (subtype === 'watch') return buildWatchResult(raw);
      return buildRssResult(raw);
    },
    [buildPrayerResult, buildRssResult, buildSocialResult, buildWatchResult]
  );

  const runSearch = useCallback(
    async (query: string, pageNumber: number, replace: boolean) => {
      if (!token || !query.trim()) {
        setSearchResults([]);
        setSearchHasMore(false);
        setSearchPage(1);
        return;
      }

      const requestSequence = ++requestSequenceRef.current;
      const safeQuery = query.trim();
      const skip = (pageNumber - 1) * SEARCH_PAGE_SIZE;

      if (replace) {
        setIsSearchLoading(true);
        setSearchError('');
      } else {
        setIsSearchLoadingMore(true);
      }

      try {
        const [usersResponse, postsResponse] = await Promise.all([
          ApiCall({
            route: 'user/search',
            token,
            verb: 'post',
            params: {
              text: safeQuery,
              type: 'users',
              limit: SEARCH_PAGE_SIZE,
              skip,
            },
          }),
          ApiCall({
            route: 'user/search',
            token,
            verb: 'post',
            params: {
              text: safeQuery,
              type: 'posts',
              limit: SEARCH_PAGE_SIZE,
              skip,
            },
          }),
        ]);

        if (requestSequence !== requestSequenceRef.current) {
          return;
        }

        const usersHits =
          usersResponse?.status === 200 && Array.isArray(usersResponse?.response)
            ? usersResponse.response
            : [];
        const postsHits =
          postsResponse?.status === 200 && Array.isArray(postsResponse?.response)
            ? postsResponse.response
            : [];

        const userResults = usersHits
          .map((item: any) => buildUserResult(item))
          .filter((item: SearchUserResult | null): item is SearchUserResult => item !== null);

        const postResults = postsHits
          .map((item: BaseSearchHit) => buildPostResult(item))
          .filter((item: ExploreSearchResult | null): item is ExploreSearchResult => item !== null);

        const localServeGo = getLocalServeGoPage(safeQuery, pageNumber);

        const mixedPageResults = interleaveBalanced([userResults, postResults, localServeGo.items]);

        setSearchResults((previous) =>
          replace
            ? dedupeResults(mixedPageResults)
            : dedupeResults([...previous, ...mixedPageResults])
        );

        const remoteHasMore =
          usersHits.length === SEARCH_PAGE_SIZE || postsHits.length === SEARCH_PAGE_SIZE;
        const localHasMore =
          localServeGo.total > (pageNumber - 1) * SEARCH_PAGE_SIZE + localServeGo.items.length;

        setSearchHasMore(remoteHasMore || localHasMore);
        setSearchPage(pageNumber);
      } catch {
        if (requestSequence === requestSequenceRef.current) {
          if (replace) {
            setSearchResults([]);
          }
          setSearchError('Unable to load results right now. Please try again.');
          setSearchHasMore(false);
        }
      } finally {
        if (requestSequence === requestSequenceRef.current) {
          setIsSearchLoading(false);
          setIsSearchLoadingMore(false);
        }
      }
    },
    [buildPostResult, buildUserResult, getLocalServeGoPage, token]
  );

  const animateToSearchMode = useCallback(
    (entering: boolean) => {
      if (entering) {
        Animated.parallel([
          Animated.timing(browseOpacity, {
            toValue: 0,
            duration: BROWSE_TRANSITION_OUT_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(browseTranslateY, {
            toValue: -8,
            duration: BROWSE_TRANSITION_OUT_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(searchOpacity, {
            toValue: 1,
            duration: SEARCH_TRANSITION_IN_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(searchTranslateY, {
            toValue: 0,
            duration: SEARCH_TRANSITION_IN_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(browseOpacity, {
            toValue: 1,
            duration: SEARCH_TRANSITION_IN_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(browseTranslateY, {
            toValue: 0,
            duration: SEARCH_TRANSITION_IN_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(searchOpacity, {
            toValue: 0,
            duration: BROWSE_TRANSITION_OUT_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(searchTranslateY, {
            toValue: 12,
            duration: BROWSE_TRANSITION_OUT_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    [browseOpacity, browseTranslateY, searchOpacity, searchTranslateY]
  );

  const handleSearchTextChange = useCallback(
    (nextText: string) => {
      const wasSearchMode = searchText.trim().length > 0;
      setSearchText(nextText);

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }

      const nextTrimmedText = nextText.trim();
      const nextIsSearchMode = nextTrimmedText.length > 0;

      if (wasSearchMode !== nextIsSearchMode) {
        animateToSearchMode(nextIsSearchMode);
      }

      if (!nextTrimmedText) {
        resetSearchState();
        return;
      }

      searchDebounceRef.current = setTimeout(() => {
        runSearch(nextTrimmedText, 1, true);
      }, SEARCH_DEBOUNCE_MS);
    },
    [animateToSearchMode, resetSearchState, runSearch, searchText]
  );

  const handleTrendingTopicPress = useCallback(
    (topic: string) => {
      handleSearchTextChange(topic);
    },
    [handleSearchTextChange]
  );

  const fetchTrending = useCallback(async () => {
    setIsTrendingLoading(true);
    try {
      const res = await ApiCall({
        route: 'user/search',
        token,
        verb: 'post',
        params: { text: '', type: 'posts', limit: 40, skip: 0 },
      });
      if (res?.status === 200 && Array.isArray(res.response)) {
        const now = Date.now();
        const watchPosts = res.response
          .filter(
            (item: any) => item.playBackId || item.sourceIndex?.toLowerCase().includes('watch')
          )
          .filter((item: any) => {
            if (item.aspect_ratio === '9:16') return false;
            const h = Number(item.videoHeight ?? 0);
            const w = Number(item.videoWidth ?? 1);
            return !(h > w * 1.4);
          })
          .sort((a: any, b: any) => getTrendingScore(b, now) - getTrendingScore(a, now))
          .slice(0, 20)
          .map(
            (raw: any) =>
              ({
                ...raw,
                id: raw.id ?? raw._id ?? raw.postId,
                postId: String(raw.postId ?? raw.id ?? raw._id ?? ''),
                playBackId: raw.playBackId,
                content: raw.content ?? raw.body ?? '',
                title: resolveTitle(raw.title),
                reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
                comments: Array.isArray(raw.comments) ? raw.comments : [],
                userData: {
                  _id: String(raw.userData?._id ?? ''),
                  name: raw.userData?.name ?? 'Unknown',
                  username: raw.userData?.username ?? 'unknown',
                  profileImage:
                    raw.userData?.profileImage ||
                    raw.userData?.avatar ||
                    raw.userData?.profile_image ||
                    NO_PROFILE_IMAGE,
                  accountType: raw.userData?.accountType ?? AccountType.individual,
                },
                created: toDate(raw.created),
                updated: toDate(raw.updated),
              }) as WatchPost
          );
        setTrendingVideos(watchPosts);
      }
    } catch {
      // Network failure — section stays empty
    }
    setIsTrendingLoading(false);
  }, [token]);

  const fetchNewVoices = useCallback(async () => {
    setIsVoicesLoading(true);
    try {
      const res = await ApiCall({
        route: 'user/get-users-to-subscribe/1',
        token,
        verb: 'get',
        params: { itemsPerPage: 12 },
      });
      let users: any[] = [];
      const resData = res?.response?.data ?? res?.response;
      if (res?.status === 200 && Array.isArray(resData)) {
        users = resData;
      } else {
        const fallbackRes = await ApiCall({
          route: 'user/search',
          token,
          verb: 'post',
          params: { text: '', type: 'users', limit: 30, skip: 0 },
        });
        if (fallbackRes?.status === 200 && Array.isArray(fallbackRes.response)) {
          const ninetyDaysAgo = Date.now() - 90 * 24 * 3600 * 1000;
          users = fallbackRes.response
            .filter(
              (u: any) =>
                u.isInfluencer === true &&
                (u.followerCount ?? u.following?.length ?? 0) >= 100 &&
                new Date(u.influencerProfile?.createdAt ?? u.created ?? 0).getTime() >=
                  ninetyDaysAgo
            )
            .slice(0, 12);
        }
      }
      setNewCreatorsItems(
        users.map((u: any) => ({
          id: u._id ?? u.id ?? String(Math.random()),
          avatarUri:
            u.profileImage ||
            u.avatar ||
            u.profile_image ||
            u.profile?.profileImage ||
            NO_PROFILE_IMAGE,
          name: u.name ?? u.username ?? 'Unknown',
          isFollowing: false,
          badge: u.badgesData?.[0]?.title,
          badgeIcon: u.badgesData?.[0]?.icon,
        }))
      );
    } catch {
      // Network failure — section stays empty
    }
    setIsVoicesLoading(false);
  }, [token]);

  const fetchCommunityPrayer = useCallback(async () => {
    setIsPrayerLoading(true);
    try {
      const res = await ApiCall({
        route: 'prayer/',
        token,
        verb: 'get',
        params: { page: 1, itemsPerPage: 10 },
      });
      if (res?.status === 200 && Array.isArray(res.response)) {
        const filtered = res.response
          .filter(
            (p: any) =>
              p.category === PrayerWallCategory.Exhortation ||
              p.category === PrayerWallCategory.Testimony
          )
          .sort((a: any, b: any) => (b.reactions?.length ?? 0) - (a.reactions?.length ?? 0))
          .slice(0, 3)
          .map((raw: any) => ({
            post: {
              id: raw.id ?? raw._id ?? raw.postId,
              postId: String(raw.postId ?? raw.id ?? raw._id ?? ''),
              content: raw.content ?? raw.body ?? '',
              date: String(raw.created ?? new Date().toISOString()),
              private: Boolean(raw.private),
              category: normalizePrayerCategory(raw.category),
              userData: {
                _id: String(raw.userData?._id ?? ''),
                name: raw.userData?.name ?? 'Unknown',
                username: raw.userData?.username ?? 'unknown',
                accountType: raw.userData?.accountType ?? AccountType.individual,
                profileImage:
                  raw.userData?.profileImage ||
                  raw.userData?.avatar ||
                  raw.userData?.profile_image ||
                  NO_PROFILE_IMAGE,
              },
              answered: Boolean(raw.answered),
              images: resolveImageList(raw),
              comments: Array.isArray(raw.comments) ? raw.comments : [],
              commentNumber: Number(raw.commentNumber ?? 0),
              repostCount: Number(raw.repostCount ?? 0),
              reactions: Array.isArray(raw.reactions) ? raw.reactions : [],
              created: toDate(raw.created),
              updated: toDate(raw.updated),
            } as PrayerPost,
            reactionCount: raw.reactions?.length ?? 0,
          }));
        setCommunityPrayers(filtered);
      }
    } catch {
      // Network failure — section stays empty
    }
    setIsPrayerLoading(false);
  }, [token]);

  const parseCityState = (address: string): string => {
    const STATE_ABBREV: Record<string, string> = {
      Alabama: 'AL',
      Alaska: 'AK',
      Arizona: 'AZ',
      Arkansas: 'AR',
      California: 'CA',
      Colorado: 'CO',
      Connecticut: 'CT',
      Delaware: 'DE',
      Florida: 'FL',
      Georgia: 'GA',
      Hawaii: 'HI',
      Idaho: 'ID',
      Illinois: 'IL',
      Indiana: 'IN',
      Iowa: 'IA',
      Kansas: 'KS',
      Kentucky: 'KY',
      Louisiana: 'LA',
      Maine: 'ME',
      Maryland: 'MD',
      Massachusetts: 'MA',
      Michigan: 'MI',
      Minnesota: 'MN',
      Mississippi: 'MS',
      Missouri: 'MO',
      Montana: 'MT',
      Nebraska: 'NE',
      Nevada: 'NV',
      'New Hampshire': 'NH',
      'New Jersey': 'NJ',
      'New Mexico': 'NM',
      'New York': 'NY',
      'North Carolina': 'NC',
      'North Dakota': 'ND',
      Ohio: 'OH',
      Oklahoma: 'OK',
      Oregon: 'OR',
      Pennsylvania: 'PA',
      'Rhode Island': 'RI',
      'South Carolina': 'SC',
      'South Dakota': 'SD',
      Tennessee: 'TN',
      Texas: 'TX',
      Utah: 'UT',
      Vermont: 'VT',
      Virginia: 'VA',
      Washington: 'WA',
      'West Virginia': 'WV',
      Wisconsin: 'WI',
      Wyoming: 'WY',
      'District of Columbia': 'DC',
    };
    const parts = address.split(',').map((p) => p.trim());
    if (parts.length < 3) return address;
    const city = parts[1];
    const stateRaw = parts[2].replace(/\d+/g, '').trim();
    const stateAbbrev = STATE_ABBREV[stateRaw] ?? stateRaw;
    return `${city}, ${stateAbbrev}`;
  };

  const fetchServeOpportunities = useCallback(
    async (location: { latitude: number; longitude: number } | null) => {
      setIsServeLoading(true);
      try {
        const jobs = await listConnectServePublicJobs();
        const toMiles = (job: ConnectServeJobPublished): number | null => {
          if (!location || !job.coordinate) return null;
          const [lng, lat] = job.coordinate;
          const R = 3958.8;
          const dLat = ((lat - location.latitude) * Math.PI) / 180;
          const dLng = ((lng - location.longitude) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((location.latitude * Math.PI) / 180) *
              Math.cos((lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };
        const withDistance = jobs
          .filter((j) => j.hiringStatus === 'open')
          .map((j) => ({ job: j, miles: toMiles(j) }))
          .sort((a, b) => {
            if (a.miles === null && b.miles === null) return 0;
            if (a.miles === null) return 1;
            if (b.miles === null) return -1;
            return a.miles - b.miles;
          })
          .slice(0, 6);
        setServeOpportunityItems(
          withDistance.map(({ job, miles }) => ({
            id: job.id,
            title: job.title,
            organization: job.organizationName,
            opportunityType: job.opportunityType,
            distance:
              miles !== null
                ? `${miles.toFixed(1)} mi · ${parseCityState(job.address || '')}`
                : parseCityState(job.address || '') || 'Nearby',
            distanceMiles: miles,
          }))
        );
      } catch {
        // Network failure — section stays empty
      }
      setIsServeLoading(false);
    },
    []
  );

  const fetchGoEvents = useCallback(async () => {
    setIsEventsLoading(true);
    try {
      const allEvents = await getConnectPortalPublishedGoEvents();
      const today = new Date();
      const upcoming = allEvents
        .filter((event) => new Date(event.startDate) >= today)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 7);
      setGoEvents(upcoming);
    } catch {
      // Network failure — section stays empty
    } finally {
      setIsEventsLoading(false);
    }
  }, []);

  const fetchTrendingTopics = useCallback(async () => {
    try {
      const res = await ApiCall({ route: TRENDING_TOPICS_ROUTE, token, verb: 'get' });
      const tags = Array.isArray(res?.response) ? res.response : res?.response?.data;
      if (res?.status === 200 && Array.isArray(tags)) {
        const mappedTopics = mapTrendingTopicResponse(tags);
        setPopularTopicItems(mappedTopics.length > 0 ? mappedTopics : TRENDING_TOPICS_MOCK_DATA);
      }
    } catch {
      // Network failure — section stays empty
    }
  }, [token]);

  const fetchAllSections = useCallback(async () => {
    setIsRefreshingBrowse(true);
    const location = await getDeviceLocation().catch(() => null);
    setUserCoords(location);
    await Promise.allSettled([
      fetchTrending(),
      fetchNewVoices(),
      fetchCommunityPrayer(),
      fetchServeOpportunities(location),
      fetchGoEvents(),
      fetchTrendingTopics(),
    ]);
    setIsRefreshingBrowse(false);
  }, [
    fetchTrending,
    fetchNewVoices,
    fetchCommunityPrayer,
    fetchServeOpportunities,
    fetchGoEvents,
    fetchTrendingTopics,
  ]);

  useFocusEffect(
    useCallback(() => {
      dispatch(getUserProfile({ token }));
    }, [dispatch, token])
  );

  useFocusEffect(
    useCallback(() => {
      fetchAllSections();
    }, [fetchAllSections])
  );

  useMountEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  });

  useMountEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  });

  const handleRefresh = useCallback(() => {
    if (isSearchMode) {
      runSearch(trimmedSearchText, 1, true);
      return;
    }
    fetchAllSections();
  }, [isSearchMode, runSearch, trimmedSearchText, fetchAllSections]);

  const handleEndReached = useCallback(() => {
    if (!isSearchMode || isSearchLoading || isSearchLoadingMore || !searchHasMore) {
      return;
    }

    runSearch(trimmedSearchText, searchPage + 1, false);
  }, [
    isSearchLoading,
    isSearchLoadingMore,
    isSearchMode,
    runSearch,
    searchHasMore,
    searchPage,
    trimmedSearchText,
  ]);

  const handleOpenDrawer = useCallback(() => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  }, [navigation]);

  const handleOpenWatchPost = useCallback(
    (watchItem: WatchPost) => {
      navigation.push(
        'WatchPortal' as never,
        {
          initialPostId: String(watchItem.postId ?? watchItem.id ?? ''),
          initialPlaybackId: watchItem.playBackId,
          initialWatchPost: watchItem,
        } as never
      );
    },
    [navigation]
  );

  const handleOpenConnectPortal = useCallback(
    (tab: ConnectTab) => {
      navigation.navigate('Main', {
        screen: 'ConnectTab',
        params: {
          screen: 'ConnectPortal',
          params: {
            initialTab: tab,
          },
        },
      });
    },
    [navigation]
  );

  const renderSearchItem = useCallback(
    (info: ListRenderItemInfo<ExploreSearchResult>) => {
      const result = info.item;

      if (result.kind === 'user') {
        return <UserItem item={result.item} />;
      }

      if (result.kind === 'social') {
        return (
          <SocialItem
            itemData={result.item}
            originFeedType="forYou"
            socialPostviewStyle={[
              styles.searchCard,
              {
                backgroundColor: surfaceCardColor,
                borderColor: surfaceBorderColor,
              },
            ]}
          />
        );
      }

      if (result.kind === 'prayer') {
        return (
          <PrayerItem
            item={result.item}
            originFeedType="forYou"
            style={[
              styles.searchCard,
              {
                backgroundColor: surfaceCardColor,
                borderColor: surfaceBorderColor,
              },
            ]}
          />
        );
      }

      if (result.kind === 'rss') {
        return (
          <ArticleItem
            item={result.item}
            imageSizeType="cover"
            originFeedType="forYou"
            blogPostStyle={[
              styles.searchCard,
              {
                backgroundColor: surfaceCardColor,
                borderColor: surfaceBorderColor,
              },
            ]}
          />
        );
      }

      if (result.kind === 'watch') {
        return (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleOpenWatchPost(result.item)}
            style={[
              styles.watchCard,
              { borderColor: surfaceBorderColor, backgroundColor: surfaceCardColor },
            ]}
          >
            <View style={styles.watchHeader}>
              <Image
                source={{ uri: result.item.userData?.profileImage || NO_PROFILE_IMAGE }}
                style={styles.watchAvatar}
              />
              <View style={{ flex: 1 }}>
                <StyledText
                  numberOfLines={1}
                  style={[Typography.body.x2M, { color: primaryTextColor }]}
                >
                  {result.item.userData?.name ?? 'Unknown user'}
                </StyledText>
                <StyledText style={{ color: secondaryTextColor }}>Watch</StyledText>
              </View>
              <MaterialCommunityIcons
                name="play-circle-outline"
                size={26}
                color={dark ? Colors.neutral[200] : Colors.primarySapphire.brand}
              />
            </View>
            <StyledText style={[styles.watchTitle, { color: primaryTextColor }]} numberOfLines={2}>
              {result.item.title || result.item.content || 'Watch post'}
            </StyledText>
            {result.item.content ? (
              <StyledText style={{ color: secondaryTextColor }} numberOfLines={2}>
                {result.item.content}
              </StyledText>
            ) : null}
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleOpenConnectPortal(result.item.connectTab)}
          style={[
            styles.connectSearchCard,
            {
              borderColor: surfaceBorderColor,
              backgroundColor: surfaceCardColor,
            },
          ]}
        >
          <View style={styles.connectSearchIconWrap}>
            <MaterialCommunityIcons
              name={result.item.searchKind === 'serve' ? 'hand-heart' : 'calendar'}
              size={20}
              color={Colors.primarySapphire.brand}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StyledText
              numberOfLines={1}
              style={[Typography.body.x2M, { color: primaryTextColor }]}
            >
              {result.item.title}
            </StyledText>
            <StyledText numberOfLines={1} style={{ color: secondaryTextColor, marginTop: 2 }}>
              {result.item.location}
            </StyledText>
          </View>
          <StyledText style={{ color: Colors.primarySapphire.brand, fontWeight: '700' }}>
            {result.item.searchKind === 'serve' ? 'Serve' : 'Go'}
          </StyledText>
        </TouchableOpacity>
      );
    },
    [
      dark,
      handleOpenConnectPortal,
      handleOpenWatchPost,
      primaryTextColor,
      secondaryTextColor,
      surfaceBorderColor,
      surfaceCardColor,
      styles,
    ]
  );

  const searchListFooter = useMemo(() => {
    if (!isSearchLoadingMore) return null;
    return (
      <ActivityIndicator
        color={Colors.primarySapphire.brand}
        style={{ marginVertical: spacing.x16 }}
      />
    );
  }, [isSearchLoadingMore]);

  const searchFilterChips = useMemo(
    () => [
      { id: SearchFeedFilter.top, label: 'Top' },
      { id: SearchFeedFilter.latest, label: 'Latest' },
      { id: SearchFeedFilter.profiles, label: 'Profiles' },
      { id: SearchFeedFilter.watch, label: 'Watch' },
      { id: SearchFeedFilter.connect, label: 'Connect' },
    ],
    []
  );

  const filteredSearchResults = useMemo(() => {
    if (activeFilter === SearchFeedFilter.top) {
      return searchResults;
    }

    if (activeFilter === SearchFeedFilter.profiles) {
      return searchResults.filter((item) => item.kind === 'user');
    }

    if (activeFilter === SearchFeedFilter.watch) {
      return searchResults.filter((item) => item.kind === 'watch');
    }

    if (activeFilter === SearchFeedFilter.connect) {
      return searchResults.filter((item) => item.kind === 'servego');
    }

    const latestItems = searchResults.filter(
      (item) =>
        item.kind === 'social' ||
        item.kind === 'rss' ||
        item.kind === 'prayer' ||
        item.kind === 'watch'
    );

    return [...latestItems].sort((left, right) => {
      const leftDate =
        left.kind === 'rss'
          ? new Date(left.item.created ?? 0).getTime()
          : new Date((left.item as SocialPost | PrayerPost | WatchPost).created ?? 0).getTime();
      const rightDate =
        right.kind === 'rss'
          ? new Date(right.item.created ?? 0).getTime()
          : new Date((right.item as SocialPost | PrayerPost | WatchPost).created ?? 0).getTime();
      return rightDate - leftDate;
    });
  }, [activeFilter, searchResults]);

  const getMuxThumbnail = (playBackId?: string, mediaUrl?: string) => {
    if (playBackId) return `https://image.mux.com/${playBackId}/thumbnail.png?time=3`;
    return mediaUrl || NO_PROFILE_IMAGE;
  };

  const renderTrendingScroll = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalContent}
    >
      {trendingVideos.map((item) => {
        const itemId = String(item.postId ?? item.id ?? '');
        const thumbnail = getMuxThumbnail(item.playBackId, item.mediaUrl);
        return (
          <TouchableOpacity
            key={itemId}
            activeOpacity={0.88}
            onPress={() => handleOpenWatchPost(item)}
            style={styles.trendingCard}
          >
            <ImageBackground
              source={{ uri: thumbnail }}
              style={styles.trendingImage}
              imageStyle={{ borderRadius: 12 }}
            >
              <View style={styles.liveBadge}>
                <StyledText style={styles.liveBadgeText}>WATCH</StyledText>
              </View>
            </ImageBackground>
            <StyledText
              numberOfLines={2}
              style={[styles.trendingTitle, { color: primaryTextColor, fontSize: 14 }]}
            >
              {item.title || item.content || 'Watch'}
            </StyledText>
            <View style={styles.trendingMetaRow}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={14}
                color={tertiaryTextColor}
                style={styles.trendingMetaIcon}
              />
              <StyledText style={{ color: tertiaryTextColor, fontSize: 12 }}>
                {item.reactions?.length ?? 0}
              </StyledText>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const featuredVoice =
    newCreatorsItems.length > 0
      ? newCreatorsItems[getSeededIndex(newCreatorsItems.length, getDailySeed())]
      : null;

  const browseContent = (
    <ScrollView
      style={{ flex: 1, backgroundColor: screenBackgroundColor }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.browseContentContainer,
        { paddingTop: exploreHeaderHeight, paddingBottom: getHeight(7) + insets.bottom + 40 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshingBrowse}
          onRefresh={handleRefresh}
          tintColor={Colors.primarySapphire.brand}
        />
      }
    >
      {/* Featured Voice Banner */}
      {featuredVoice ? (
        <View style={styles.featuredBanner}>
          <View style={styles.featuredGradient}>
            <FastImage
              source={{ uri: featuredVoice.avatarUri || NO_PROFILE_IMAGE }}
              style={styles.featuredAvatar}
              resizeMode={FastImage.resizeMode.cover}
            />
            <View style={styles.featuredTextWrap}>
              <StyledText style={styles.featuredLabel}>FEATURED VOICE</StyledText>
              <StyledText style={styles.featuredName}>{featuredVoice.name}</StyledText>
              {featuredVoice.badge ? (
                <StyledText style={styles.featuredBadge}>{featuredVoice.badge}</StyledText>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.featuredFollowBtn}
              onPress={() => {
                setNewCreatorsItems((prev) =>
                  prev.map((item) =>
                    item.id === featuredVoice.id
                      ? { ...item, isFollowing: !item.isFollowing }
                      : item
                  )
                );
              }}
            >
              <StyledText style={styles.featuredFollowText}>
                {featuredVoice.isFollowing ? 'Connected' : 'Connect'}
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Section A: Trending */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <StyledText style={[styles.sectionTitle, { color: headerTextColor }]}>
            Trending
          </StyledText>
          <TouchableOpacity
            onPress={() => {
              if (trendingVideos.length > 0) handleOpenWatchPost(trendingVideos[0]);
            }}
          >
            <StyledText style={styles.sectionActionText}>See All</StyledText>
          </TouchableOpacity>
        </View>
        {isTrendingLoading && (
          <ActivityIndicator
            color={Colors.primarySapphire.brand}
            style={styles.sectionInlineSpinner}
          />
        )}
        {!isTrendingLoading && trendingVideos.length > 0 && renderTrendingScroll()}
        {!isTrendingLoading && trendingVideos.length === 0 && (
          <StyledText style={{ color: secondaryTextColor, paddingHorizontal: spacing.x16 }}>
            No trending content right now
          </StyledText>
        )}
      </View>

      {/* Section B: New Voices */}
      <View style={[styles.sectionBlock, styles.creatorsWrapper]}>
        <View style={styles.sectionHeaderColumn}>
          <StyledText style={[styles.sectionTitle, { color: headerTextColor }]}>
            New Voices
          </StyledText>
          <StyledText style={[styles.sectionSubheader, { color: subheaderTextColor }]}>
            Voices rising in the community
          </StyledText>
        </View>

        {isVoicesLoading && (
          <ActivityIndicator
            color={Colors.primarySapphire.brand}
            style={styles.sectionInlineSpinner}
          />
        )}
        {!isVoicesLoading && newCreatorsItems.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContent}
            snapToInterval={140}
            decelerationRate="fast"
          >
            {newCreatorsItems.map((creator) => (
              <TouchableOpacity
                key={creator.id}
                style={[
                  styles.creatorCard,
                  { borderColor: surfaceBorderColor, backgroundColor: surfaceCardColor },
                ]}
                activeOpacity={0.9}
              >
                <View style={styles.creatorAvatarFrame}>
                  <FastImage
                    source={{ uri: creator.avatarUri || NO_PROFILE_IMAGE }}
                    style={styles.creatorAvatar}
                    resizeMode={FastImage.resizeMode.contain}
                  />
                  {creator.badge ? (
                    <View style={styles.badgeChip}>
                      <StyledText style={styles.badgeChipText}>{creator.badge}</StyledText>
                    </View>
                  ) : null}
                </View>
                <StyledText
                  numberOfLines={1}
                  style={[styles.creatorName, { color: primaryTextColor }]}
                >
                  {creator.name}
                </StyledText>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setNewCreatorsItems((previous) =>
                      previous.map((item) =>
                        item.id === creator.id ? { ...item, isFollowing: !item.isFollowing } : item
                      )
                    );
                  }}
                  style={[
                    styles.creatorActionButton,
                    creator.isFollowing && styles.creatorActionButtonConnected,
                  ]}
                >
                  <StyledText
                    style={[
                      styles.creatorActionButtonText,
                      creator.isFollowing && { color: Colors.primarySapphire.brand },
                    ]}
                  >
                    {creator.isFollowing ? 'Connected' : 'Connect'}
                  </StyledText>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {!isVoicesLoading && newCreatorsItems.length === 0 && (
          <StyledText style={{ color: secondaryTextColor, paddingHorizontal: spacing.x16 }}>
            No new voices yet
          </StyledText>
        )}
      </View>

      {/* Section C: Community Prayer (NEW) */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons
              name="hands-pray"
              size={22}
              color={dark ? primaryTextColor : '#032f3c'}
            />
            <StyledText style={[styles.sectionTitle, { color: headerTextColor }]}>
              Community Prayer
            </StyledText>
          </View>
        </View>
        {isPrayerLoading && (
          <ActivityIndicator
            color={Colors.primarySapphire.brand}
            style={styles.sectionInlineSpinner}
          />
        )}
        {!isPrayerLoading && communityPrayers.length > 0 && (
          <View style={{ gap: spacing.x5 }}>
            {communityPrayers.map((cp) => (
              <PrayerItem
                key={cp.post.id ?? cp.post.postId}
                item={cp.post}
                originFeedType="forYou"
              />
            ))}
          </View>
        )}
        {!isPrayerLoading && communityPrayers.length === 0 && (
          <StyledText style={{ color: secondaryTextColor, paddingHorizontal: spacing.x16 }}>
            No community prayers right now
          </StyledText>
        )}
      </View>

      {/* Section D: Serve Opportunities */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <StyledText style={[styles.sectionTitle, { color: headerTextColor }]}>
            Serve Opportunities
          </StyledText>
          <TouchableOpacity onPress={() => handleOpenConnectPortal('Serve' as ConnectTab)}>
            <StyledText style={styles.sectionActionText}>See All</StyledText>
          </TouchableOpacity>
        </View>
        {isServeLoading && (
          <ActivityIndicator
            color={Colors.primarySapphire.brand}
            style={styles.sectionInlineSpinner}
          />
        )}
        {!isServeLoading && serveOpportunityItems.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContent}
          >
            {serveOpportunityItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.88}
                style={[
                  styles.serveCardHorizontal,
                  { borderColor: surfaceBorderColor, backgroundColor: surfaceCardColor },
                ]}
                onPress={() => {
                  navigation.push('ConnectServeJobView' as never, { jobId: item.id } as never);
                }}
              >
                <View style={styles.serveIconBlock}>
                  <MaterialCommunityIcons
                    name="hand-heart-outline"
                    size={28}
                    color={Colors.primarySapphire.brand}
                  />
                  {item.opportunityType ? (
                    <View style={styles.serveTypeChip}>
                      <StyledText style={styles.serveTypeChipText} numberOfLines={1}>
                        {item.opportunityType}
                      </StyledText>
                    </View>
                  ) : null}
                </View>
                <View style={styles.serveContentHorizontal}>
                  <StyledText
                    numberOfLines={2}
                    style={[Typography.body.x2M, { color: primaryTextColor }]}
                  >
                    {item.title}
                  </StyledText>
                  <StyledText numberOfLines={1} style={{ color: secondaryTextColor, fontSize: 12 }}>
                    {item.organization}
                  </StyledText>
                  <View style={styles.serveDistanceRow}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={12}
                      color={Colors.primarySapphire.brand}
                    />
                    <StyledText
                      style={{ color: Colors.primarySapphire.brand, fontSize: 12, marginLeft: 3 }}
                    >
                      {item.distance}
                    </StyledText>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color={secondaryTextColor}
                  style={{ alignSelf: 'center' }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        {!isServeLoading && serveOpportunityItems.length === 0 && (
          <StyledText style={{ color: secondaryTextColor, paddingHorizontal: spacing.x16 }}>
            No serve opportunities nearby
          </StyledText>
        )}
      </View>

      {/* Section E: Go! Events */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <StyledText style={[styles.sectionTitle, { color: headerTextColor }]}>
            Go! Events
          </StyledText>
          <TouchableOpacity onPress={() => handleOpenConnectPortal('Go!' as ConnectTab)}>
            <StyledText style={styles.sectionActionText}>See All</StyledText>
          </TouchableOpacity>
        </View>
        {isEventsLoading && (
          <ActivityIndicator
            color={Colors.primarySapphire.brand}
            style={styles.sectionInlineSpinner}
          />
        )}
        {!isEventsLoading && goEvents.length > 0 && (
          <View>
            {/* Featured event image cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalContent}
            >
              {goEvents.slice(0, 4).map((event: any) => {
                const imageUri = event.heroImageUri ?? event.photoUri ?? '';
                return (
                  <TouchableOpacity
                    key={event._id ?? event.id}
                    activeOpacity={0.9}
                    style={styles.goEventCard}
                    onPress={() => {
                      navigation.push(
                        'ConnectGoEventView' as never,
                        { eventId: event._id ?? event.id } as never
                      );
                    }}
                  >
                    <ImageBackground
                      source={{ uri: imageUri }}
                      style={styles.goEventImage}
                      imageStyle={{ borderRadius: 12 }}
                    >
                      <View style={styles.goEventOverlay}>
                        <StyledText style={styles.goEventDate}>
                          {event.startDate
                            ? format(parseISO(String(event.startDate)), 'MMM d, yyyy')
                            : ''}
                        </StyledText>
                        <StyledText style={styles.goEventTitle} numberOfLines={2}>
                          {event.title ?? event.name ?? 'Event'}
                        </StyledText>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {/* Text list of all events */}
            <View style={{ paddingHorizontal: spacing.x16, marginTop: spacing.x16 }}>
              {goEvents.map((event: any) => {
                const eventStart = new Date(event.startDate);
                const hoursUntil = differenceInHours(eventStart, new Date());
                const isImminent = hoursUntil >= 0 && hoursUntil < 72;
                return (
                  <TouchableOpacity
                    key={`list-${event._id ?? event.id}`}
                    style={styles.goEventRow}
                    onPress={() => {
                      navigation.push(
                        'ConnectGoEventView' as never,
                        { eventId: event._id ?? event.id } as never
                      );
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {isImminent ? (
                        <Animated.View style={[styles.pulsingDot, { opacity: pulseAnim }]} />
                      ) : (
                        <View style={{ width: 16 }} />
                      )}
                      <View style={{ flex: 1 }}>
                        <StyledText style={{ color: secondaryTextColor, fontSize: 12 }}>
                          {event.startDate
                            ? format(parseISO(String(event.startDate)), 'MMM d, yyyy')
                            : ''}
                        </StyledText>
                        <StyledText
                          numberOfLines={1}
                          style={[Typography.body.x2M, { color: primaryTextColor }]}
                        >
                          {event.title ?? event.name ?? 'Event'}
                        </StyledText>
                      </View>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={secondaryTextColor}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        {!isEventsLoading && goEvents.length === 0 && (
          <StyledText style={{ color: secondaryTextColor, paddingHorizontal: spacing.x16 }}>
            No upcoming events
          </StyledText>
        )}
      </View>

      {/* Section F: Trending Topics */}
      <View style={styles.sectionBlock}>
        <StyledText
          style={[styles.sectionTitle, { color: headerTextColor, paddingHorizontal: spacing.x16 }]}
        >
          Trending Topics
        </StyledText>
        <TrendingTopicsBubbles
          onTopicPress={handleTrendingTopicPress}
          style={styles.topicsCloud}
          topics={popularTopicItems}
        />
      </View>
    </ScrollView>
  );

  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'android' ? { backgroundColor: screenBackgroundColor } : null,
      ]}
    >
      <Animated.View
        onLayout={(e) => setExploreHeaderHeight(e.nativeEvent.layout.height)}
        style={[
          styles.headerWrap,
          {
            paddingTop: insets.top + spacing.x8,
            borderBottomColor: isSearchMode ? 'transparent' : headerDividerColor,
          },
          getSpringboardStyle(0),
        ]}
      >
        {shouldUseBlurHeader ? (
          <>
            <BlurView
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              blurType={dark ? 'dark' : 'light'}
              blurAmount={25}
              reducedTransparencyFallbackColor={colors.background}
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: headerBackgroundColor }]}
            />
          </>
        ) : (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: dark ? '#0c0d10' : '#ffffff' }]}
          />
        )}

        <View style={styles.headerRow}>
          <View style={styles.headerSideSlot}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleOpenDrawer}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.headerAvatar} />
              ) : (
                <ProfileFill width={32} height={32} color={Colors.primarySapphire.brand} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.headerCenterWrap} pointerEvents="none">
            <StyledText style={[styles.headerTitle, { color: headerTextColor }]}>
              Explore
            </StyledText>
          </View>

          <View style={styles.headerSideSlot} />
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrap, { backgroundColor: searchSurfaceColor }]}>
            <SearchIcon
              style={{ height: 20, width: 20, marginRight: spacing.x8 }}
              stroke={dark ? Colors.neutral[300] : Colors.neutral[300]}
            />
            <TextInput
              style={[styles.searchInput, { color: primaryTextColor }]}
              placeholder="Search posts, people, serve, go"
              placeholderTextColor={dark ? Colors.neutral[300] : Colors.neutral[300]}
              value={searchText}
              onChangeText={handleSearchTextChange}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchText.length > 0 ? (
              <TouchableOpacity
                onPress={() => handleSearchTextChange('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.searchClearButton}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={dark ? Colors.neutral[300] : Colors.neutral[300]}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Animated.View>

      <View style={styles.contentStack}>
        <Animated.View
          pointerEvents={isSearchMode ? 'none' : 'auto'}
          style={[
            styles.browseLayer,
            getSpringboardStyle(1),
            {
              opacity: browseOpacity,
              transform: [{ translateY: browseTranslateY }],
            },
          ]}
        >
          {browseContent}
        </Animated.View>

        <Animated.View
          pointerEvents={isSearchMode ? 'auto' : 'none'}
          style={[
            styles.searchContentWrap,
            getSpringboardStyle(1),
            {
              top: exploreHeaderHeight,
              backgroundColor: screenBackgroundColor,
              opacity: searchOpacity,
              transform: [{ translateY: searchTranslateY }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.chipOverlay,
              {
                backgroundColor: screenBackgroundColor,
                transform: [{ translateY: chipOffset }],
              },
              getSpringboardStyle(2),
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {searchFilterChips.map((chip) => {
                const isActive = activeFilter === chip.id;
                const chipBorderColor = dark ? 'rgba(255,255,255,0.15)' : Colors.neutral[200];
                const inactiveTextColor = dark ? Colors.neutral[300] : Colors.neutral[400];

                return (
                  <TouchableOpacity
                    key={chip.id}
                    onPress={() => setActiveFilter(chip.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? Colors.primarySapphire.brand : 'transparent',
                        borderWidth: 1,
                        borderColor: isActive ? Colors.primarySapphire.brand : chipBorderColor,
                      },
                    ]}
                  >
                    <StyledText
                      style={{
                        color: isActive ? '#fff' : inactiveTextColor,
                      }}
                    >
                      {chip.label}
                    </StyledText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          <FlatList
            data={filteredSearchResults}
            keyExtractor={(item) => `${item.kind}:${item.id}`}
            renderItem={renderSearchItem}
            contentContainerStyle={[
              styles.searchContentContainer,
              {
                paddingTop: CHIP_ROW_HEIGHT + spacing.x8,
                paddingBottom: getHeight(7) + insets.bottom,
              },
            ]}
            ItemSeparatorComponent={SearchItemSeparator}
            showsVerticalScrollIndicator={false}
            onScroll={handleSearchScroll}
            scrollEventThrottle={16}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.35}
            ListFooterComponent={searchListFooter}
            refreshControl={
              <RefreshControl
                refreshing={isSearchMode ? isSearchLoading : isRefreshingBrowse}
                onRefresh={handleRefresh}
                tintColor={Colors.primarySapphire.brand}
              />
            }
            ListEmptyComponent={
              !isSearchLoading ? (
                <View style={styles.emptyStateWrap}>
                  <StyledText style={[Typography.body.x3, { color: primaryTextColor }]}>
                    No results found
                  </StyledText>
                  {searchError ? (
                    <StyledText style={{ color: Colors.errorFeedback[200], marginTop: spacing.x8 }}>
                      {searchError}
                    </StyledText>
                  ) : null}
                </View>
              ) : (
                <View style={styles.emptyStateWrap}>
                  <ActivityIndicator color={Colors.primarySapphire.brand} />
                </View>
              )
            }
          />
        </Animated.View>
      </View>
    </View>
  );
}

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      borderBottomWidth: 1,
      zIndex: 8,
    },
    contentStack: {
      flex: 1,
      position: 'relative',
    },
    browseLayer: {
      flex: 1,
    },
    headerRow: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.x16,
    },
    headerSideSlot: {
      width: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenterWrap: {
      flex: 1,
      alignItems: Platform.OS === 'android' ? 'flex-start' : 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'android' ? { paddingLeft: 14 } : {}),
    },
    headerTitle: {
      fontSize: 24,
      lineHeight: 28,
      fontFamily: 'Rubik-Bold',
      fontWeight: '700',
      letterSpacing: 0.3,
      color: EXPLORE_HEADER_COLOR,
      textAlign: Platform.OS === 'android' ? 'left' : 'center',
    },
    headerAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.neutral[700],
    },
    searchContainer: {
      paddingHorizontal: spacing.x16,
      paddingBottom: spacing.x10,
    },
    searchInputWrap: {
      height: 46,
      borderRadius: borderRadius.base,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: dark ? 'rgba(255,255,255,0.06)' : 'transparent',
      paddingHorizontal: spacing.x16,
      alignItems: 'center',
      flexDirection: 'row',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
    },
    searchClearButton: {
      marginLeft: spacing.x8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipsRow: {
      paddingHorizontal: spacing.x16,
      paddingBottom: spacing.x10,
      gap: spacing.x8,
    },
    chip: {
      height: 36,
      borderRadius: 18,
      paddingHorizontal: spacing.x16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    browseContentContainer: {
      paddingBottom: 40,
    },
    sectionBlock: {
      paddingTop: spacing.x32,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.x16,
      marginBottom: spacing.x10,
    },
    sectionHeaderColumn: {
      paddingHorizontal: spacing.x16,
      marginBottom: spacing.x10,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: EXPLORE_HEADER_FONT_FAMILY,
      fontWeight: '700',
    },
    sectionSubheader: {
      ...Typography.subheader.R,
      fontFamily: EXPLORE_SUBHEADER_FONT_FAMILY,
    },
    sectionActionText: {
      color: dark ? Colors.secondary[200] : Colors.primarySapphire.brand,
      fontWeight: '600',
    },
    horizontalContent: {
      paddingHorizontal: spacing.x16,
      gap: spacing.x16,
    },
    trendingCard: {
      width: 280,
      marginRight: spacing.x16,
    },
    trendingImage: {
      aspectRatio: 16 / 9,
      borderRadius: 12,
      marginBottom: spacing.x10,
      justifyContent: 'flex-end',
      padding: spacing.x10,
      backgroundColor: dark ? Colors.neutral[800] : '#e5edf4',
    },
    liveBadge: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.primarySapphire.brand,
      borderRadius: 6,
      paddingHorizontal: spacing.x8,
      paddingVertical: 4,
    },
    liveBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
    trendingTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    trendingMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trendingMetaIcon: {
      marginRight: 6,
    },
    creatorsWrapper: {
      paddingVertical: spacing.x20,
      backgroundColor: dark ? '#111418' : '#f1f5f9',
    },
    creatorCard: {
      width: 132,
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      alignItems: 'center',
      marginRight: spacing.x8,
    },
    creatorAvatarFrame: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2,
      borderColor: Colors.primarySapphire.brand,
      overflow: 'hidden',
      backgroundColor: Colors.containFrame,
      marginBottom: spacing.x10,
    },
    creatorAvatar: {
      width: 60,
      height: 60,
    },
    creatorName: {
      marginBottom: spacing.x10,
      fontWeight: '700',
      textAlign: 'center',
    },
    creatorActionButton: {
      width: '100%',
      borderRadius: 8,
      backgroundColor: Colors.primarySapphire.brand,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
    },
    creatorActionButtonConnected: {
      backgroundColor: dark ? '#254955' : '#dce5ed',
    },
    creatorActionButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 11,
      textTransform: 'uppercase',
    },
    masonryContainer: {
      flexDirection: 'row',
      gap: spacing.x10,
    },
    masonryColumn: {
      flex: 1,
      gap: spacing.x10,
    },
    masonryCard: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    masonryImageWrap: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: dark ? Colors.neutral[800] : '#e5edf4',
    },
    masonryVideo: {
      width: '100%',
      height: '100%',
    },
    badgeChip: {
      position: 'absolute',
      bottom: -8,
      alignSelf: 'center',
      backgroundColor: '#41dbe1',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeChipText: {
      color: '#032f3c',
      fontSize: 9,
      fontWeight: '700',
    },
    prayerCard: {
      borderRadius: 12,
      borderLeftWidth: 3,
      borderLeftColor: '#41dbe1',
      padding: spacing.x10,
      overflow: 'hidden',
    },
    serveCardHorizontal: {
      width: 220,
      borderRadius: 12,
      borderWidth: 1,
      padding: spacing.x10,
      flexDirection: 'column',
      gap: spacing.x8,
    },
    serveIconBlock: {
      width: '100%',
      height: 72,
      borderRadius: 8,
      backgroundColor: dark ? 'rgba(18,107,135,0.15)' : 'rgba(18,107,135,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    serveTypeChip: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      backgroundColor: dark ? 'rgba(18,107,135,0.4)' : 'rgba(18,107,135,0.12)',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    serveTypeChipText: {
      fontSize: 9,
      fontWeight: '700',
      color: Colors.primarySapphire.brand,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    serveContentHorizontal: {
      flex: 1,
      gap: 2,
    },
    serveDistanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    shareButton: {
      position: 'absolute',
      top: spacing.x10,
      right: spacing.x10,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#41dbe1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    goEventCard: {
      width: 260,
    },
    goEventImage: {
      height: 160,
      borderRadius: 12,
      backgroundColor: dark ? Colors.neutral[800] : '#e5edf4',
    },
    goEventOverlay: {
      flex: 1,
      borderRadius: 12,
      backgroundColor: 'rgba(3,47,60,0.45)',
      padding: 14,
      justifyContent: 'flex-end',
    },
    goEventDate: {
      color: Colors.neutral[200],
      fontWeight: '600',
      marginBottom: 4,
      fontSize: 12,
      letterSpacing: 0.4,
    },
    goEventTitle: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 18,
      marginBottom: spacing.x10,
    },
    goEventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.x10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    pulsingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#41dbe1',
      marginRight: spacing.x8,
    },
    topicsCloud: {
      paddingHorizontal: spacing.x16,
      marginTop: 12,
    },
    featuredBanner: {
      marginHorizontal: spacing.x16,
      marginTop: spacing.x16,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: '#032f3c',
    },
    featuredGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.x16,
      gap: 12,
    },
    featuredAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: '#41dbe1',
    },
    featuredTextWrap: {
      flex: 1,
    },
    featuredLabel: {
      color: '#41dbe1',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 2,
    },
    featuredName: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
    },
    featuredBadge: {
      color: dark ? Colors.neutral[200] : Colors.neutral[300],
      fontSize: 12,
      marginTop: 2,
    },
    featuredFollowBtn: {
      backgroundColor: '#41dbe1',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    featuredFollowText: {
      color: '#032f3c',
      fontWeight: '700',
      fontSize: 12,
    },
    searchContentWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2,
    },
    chipOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1,
      height: CHIP_ROW_HEIGHT,
      justifyContent: 'center',
    },
    searchContentContainer: {
      paddingHorizontal: spacing.x16,
      paddingBottom: spacing.x32,
      flexGrow: 1,
    },
    searchCard: {
      borderRadius: 12,
      borderWidth: 1,
      marginHorizontal: 0,
      marginBottom: 0,
      padding: spacing.x16,
    },
    searchItemSeparator: {
      height: 12,
    },
    sectionInlineSpinner: {
      marginVertical: spacing.x16,
      alignSelf: 'center',
    },
    emptyStateWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.x48,
    },
    watchCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
    },
    watchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.x8,
    },
    watchAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginRight: spacing.x8,
      backgroundColor: Colors.neutral[700],
    },
    watchTitle: {
      marginBottom: 6,
      fontWeight: '700',
    },
    connectSearchCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.x8,
    },
    connectSearchIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(18,107,135,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default Explore;
