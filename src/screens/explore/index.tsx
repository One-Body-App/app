import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { BlurView } from '@react-native-community/blur';
import Toast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import { CompositeScreenProps, DrawerActions, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notification } from 'iconsax-react-native';

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
  Interest,
  PrayerPost,
  PrayerWallCategory,
  SocialPost,
  User,
  WatchPost,
} from '@/utils/types';

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

const SEARCH_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

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

function Explore({ navigation }: Props) {
  const dispatch = useDispatch();
  const { dark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(dark), [dark]);

  const token = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector((state: RootState) => state.auth.getProfileData as User | null);

  const [activeFilter, setActiveFilter] = useState<SearchFeedFilter>(SearchFeedFilter.top);
  const [searchText, setSearchText] = useState('');

  const [creatorUsers, setCreatorUsers] = useState<User[]>([]);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [searchInterests, setSearchInterests] = useState<Interest[]>([]);
  const [isBrowseLoading, setIsBrowseLoading] = useState(false);
  const [isRefreshingBrowse, setIsRefreshingBrowse] = useState(false);

  const [searchResults, setSearchResults] = useState<ExploreSearchResult[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasMore, setSearchHasMore] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchLoadingMore, setIsSearchLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string>('');

  const requestSequenceRef = useRef(0);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedSearchText = searchText.trim();
  const isSearchMode = trimmedSearchText.length > 0;

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

  const fetchFollowing = useCallback(async () => {
    try {
      const response = await ApiCall({ route: 'user/get-following', token, verb: 'get' });
      if (response?.status === 200 && Array.isArray(response?.response?.data)) {
        setFollowingUsers(response.response.data as User[]);
      }
    } catch {
      // Keep browse UI resilient when this call fails.
    }
  }, [token]);

  const fetchInterests = useCallback(async () => {
    try {
      const response = await ApiCall({ route: 'tags/interest', token, verb: 'get' });
      if (response?.status === 200 && Array.isArray(response?.response)) {
        setSearchInterests(response.response as Interest[]);
      }
    } catch {
      // Keep browse UI resilient when this call fails.
    }
  }, [token]);

  const fetchCreators = useCallback(async () => {
    try {
      setIsBrowseLoading(true);
      const response = await ApiCall({
        route: 'user/get-users-to-subscribe/1?itemsPerPage=12',
        token,
        verb: 'get',
      });
      if (response?.status === 200 && Array.isArray(response?.response?.data)) {
        setCreatorUsers(response.response.data as User[]);
      }
    } catch {
      setCreatorUsers([]);
    } finally {
      setIsBrowseLoading(false);
      setIsRefreshingBrowse(false);
    }
  }, [token]);

  const handleSubscribe = useCallback(
    async (id: string) => {
      if (!id) return;
      const response = await ApiCall({ route: `user/subscribe/${id}`, token, verb: 'patch' });
      if (response?.status === 200) {
        fetchFollowing();
        return;
      }
      Toast.show('Error connecting. Please try again.', Toast.LONG);
    },
    [fetchFollowing, token]
  );

  const handleUnsubscribe = useCallback(
    async (id: string) => {
      if (!id) return;
      const response = await ApiCall({ route: `user/unsubscribe/${id}`, token, verb: 'patch' });
      if (response?.status === 200) {
        fetchFollowing();
        return;
      }
      Toast.show('Error disconnecting. Please try again.', Toast.LONG);
    },
    [fetchFollowing, token]
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
      images:
        Array.isArray(raw.images) && raw.images.length > 0
          ? raw.images
          : resolveImageUrl(raw)
            ? [resolveImageUrl(raw)]
            : [],
      mediaUrl: raw.mediaUrl,
      mediaType: raw.mediaType,
      userData: {
        _id: fallbackUserId,
        name: raw.userData?.name ?? 'Unknown user',
        username: raw.userData?.username ?? 'unknown',
        profileImage: raw.userData?.profileImage ?? NO_PROFILE_IMAGE,
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
        profileImage: raw.userData?.profileImage ?? NO_PROFILE_IMAGE,
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
        profileImage: raw.userData?.profileImage ?? NO_PROFILE_IMAGE,
        isApprovedInfluencer: raw.userData?.isApprovedInfluencer,
      },
      answered: Boolean(raw.answered),
      images:
        Array.isArray(raw.images) && raw.images.length > 0
          ? raw.images
          : resolveImageUrl(raw)
            ? [resolveImageUrl(raw)]
            : [],
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
        profileImage: raw.userData?.profileImage ?? NO_PROFILE_IMAGE,
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

  useEffect(() => {
    fetchCreators();
    fetchInterests();
    fetchFollowing();
    dispatch(getUserProfile({ token }));
  }, [dispatch, fetchCreators, fetchFollowing, fetchInterests, token]);

  useEffect(() => {
    if (!isSearchMode) {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      setSearchResults([]);
      setSearchError('');
      setSearchPage(1);
      setSearchHasMore(true);
      setIsSearchLoading(false);
      setIsSearchLoadingMore(false);
      setActiveFilter(SearchFeedFilter.top);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      runSearch(trimmedSearchText, 1, true);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [isSearchMode, runSearch, trimmedSearchText]);

  const handleRefresh = useCallback(() => {
    if (isSearchMode) {
      runSearch(trimmedSearchText, 1, true);
      return;
    }

    setIsRefreshingBrowse(true);
    fetchCreators();
    fetchInterests();
    fetchFollowing();
  }, [fetchCreators, fetchFollowing, fetchInterests, isSearchMode, runSearch, trimmedSearchText]);

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

  const handleNotifications = useCallback(() => {
    navigation.navigate('Main', {
      screen: 'HomeTab',
      params: { screen: 'Notifications' },
    });
  }, [navigation]);

  const handleOpenWatchPost = useCallback(
    (watchItem: WatchPost) => {
      navigation.navigate('Main', {
        screen: 'HomeTab',
        params: {
          screen: 'WatchPortal',
          params: {
            initialPostId: String(watchItem.postId ?? watchItem.id ?? ''),
            initialPlaybackId: watchItem.playBackId,
            initialWatchPost: watchItem,
          },
        },
      });
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
    ({ item }: { item: ExploreSearchResult }) => {
      if (item.kind === 'user') {
        return (
          <View style={styles.searchRowSpacing}>
            <UserItem item={item.item} />
          </View>
        );
      }

      if (item.kind === 'social') {
        return (
          <View style={styles.searchRowSpacing}>
            <SocialItem itemData={item.item} originFeedType="forYou" />
          </View>
        );
      }

      if (item.kind === 'prayer') {
        return (
          <View style={styles.searchRowSpacing}>
            <PrayerItem item={item.item} originFeedType="forYou" />
          </View>
        );
      }

      if (item.kind === 'rss') {
        return (
          <View style={styles.searchRowSpacing}>
            <ArticleItem item={item.item} imageSizeType="cover" originFeedType="forYou" />
          </View>
        );
      }

      if (item.kind === 'watch') {
        return (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleOpenWatchPost(item.item)}
            style={[styles.watchCard, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <View style={styles.watchHeader}>
              <Image
                source={{ uri: item.item.userData?.profileImage || NO_PROFILE_IMAGE }}
                style={styles.watchAvatar}
              />
              <View style={{ flex: 1 }}>
                <StyledText numberOfLines={1} style={[Typography.body.x2M, { color: colors.text }]}>
                  {item.item.userData?.name ?? 'Unknown user'}
                </StyledText>
                <StyledText style={{ color: Colors.neutral[300] }}>Watch</StyledText>
              </View>
              <MaterialCommunityIcons
                name="play-circle-outline"
                size={26}
                color={dark ? Colors.neutral[200] : Colors.primarySapphire.brand}
              />
            </View>
            <StyledText style={[styles.watchTitle, { color: colors.text }]} numberOfLines={2}>
              {item.item.title || item.item.content || 'Watch post'}
            </StyledText>
            {item.item.content ? (
              <StyledText style={{ color: Colors.neutral[300] }} numberOfLines={2}>
                {item.item.content}
              </StyledText>
            ) : null}
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleOpenConnectPortal(item.item.connectTab)}
          style={[
            styles.connectSearchCard,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <View style={styles.connectSearchIconWrap}>
            <MaterialCommunityIcons
              name={item.item.searchKind === 'serve' ? 'hand-heart' : 'calendar'}
              size={20}
              color={Colors.primarySapphire.brand}
            />
          </View>
          <View style={{ flex: 1 }}>
            <StyledText numberOfLines={1} style={[Typography.body.x2M, { color: colors.text }]}>
              {item.item.title}
            </StyledText>
            <StyledText numberOfLines={1} style={{ color: Colors.neutral[300], marginTop: 2 }}>
              {item.item.location}
            </StyledText>
          </View>
          <StyledText style={{ color: Colors.primarySapphire.brand, fontWeight: '700' }}>
            {item.item.searchKind === 'serve' ? 'Serve' : 'Go'}
          </StyledText>
        </TouchableOpacity>
      );
    },
    [
      colors.border,
      colors.card,
      colors.text,
      dark,
      handleOpenConnectPortal,
      handleOpenWatchPost,
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

  const browseContent = (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.browseContentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshingBrowse}
          onRefresh={handleRefresh}
          tintColor={Colors.primarySapphire.brand}
        />
      }
    >
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <StyledText style={[styles.sectionTitle, { color: colors.text }]}>
            Trending Now
          </StyledText>
          <TouchableOpacity>
            <StyledText style={styles.sectionActionText}>View All</StyledText>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          <TouchableOpacity style={styles.trendingCard}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1543616991-75a2c125ff5b' }}
              style={styles.trendingImage}
              imageStyle={{ borderRadius: 12 }}
            >
              <View style={styles.liveBadge}>
                <StyledText style={styles.liveBadgeText}>LIVE</StyledText>
              </View>
            </ImageBackground>
            <StyledText style={[styles.trendingTitle, { color: colors.text }]} numberOfLines={2}>
              Global Worship Night 2024
            </StyledText>
            <StyledText style={{ color: Colors.neutral[300] }}>12.4K watching</StyledText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.trendingCard}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7' }}
              style={styles.trendingImage}
              imageStyle={{ borderRadius: 12 }}
            />
            <StyledText style={[styles.trendingTitle, { color: colors.text }]} numberOfLines={2}>
              Faith in Business Summit
            </StyledText>
            <StyledText style={{ color: Colors.neutral[300] }}>2 days ago</StyledText>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={[styles.sectionBlock, styles.creatorsWrapper]}>
        <View style={styles.sectionHeaderColumn}>
          <StyledText style={[styles.sectionTitle, { color: colors.text }]}>
            New Creators
          </StyledText>
          <StyledText style={{ color: Colors.neutral[300] }}>
            People you might find inspiring
          </StyledText>
        </View>

        {isBrowseLoading ? (
          <ActivityIndicator
            color={Colors.primarySapphire.brand}
            style={{ marginVertical: spacing.x16 }}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContent}
          >
            {creatorUsers.map((creator) => {
              const creatorId = resolveResultId(creator);
              const isFollowing =
                creatorId.length > 0 &&
                followingUsers.some((following) => resolveResultId(following) === creatorId);

              return (
                <TouchableOpacity
                  key={creatorId || creator.name}
                  style={[
                    styles.creatorCard,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (!creatorId) return;
                    navigation.navigate('Main', {
                      screen: 'ExploreTab',
                      params: { screen: 'UserProfile', params: { id: creatorId } },
                    });
                  }}
                >
                  <View style={styles.creatorAvatarFrame}>
                    <FastImage
                      source={{ uri: creator.profileImage || NO_PROFILE_IMAGE }}
                      style={styles.creatorAvatar}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                  </View>
                  <StyledText
                    numberOfLines={1}
                    style={[styles.creatorName, { color: colors.text }]}
                  >
                    {creator.name}
                  </StyledText>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      if (!creatorId) return;
                      if (isFollowing) {
                        handleUnsubscribe(creatorId);
                      } else {
                        handleSubscribe(creatorId);
                      }
                    }}
                    style={[
                      styles.creatorActionButton,
                      isFollowing && styles.creatorActionButtonConnected,
                    ]}
                  >
                    <StyledText
                      style={[
                        styles.creatorActionButtonText,
                        isFollowing && { color: Colors.primarySapphire.brand },
                      ]}
                    >
                      {isFollowing ? 'Connected' : 'Connect'}
                    </StyledText>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <StyledText style={[styles.sectionTitle, { color: colors.text }]}>
            Serve Opportunities
          </StyledText>
          <MaterialCommunityIcons name="hand-heart" size={22} color={Colors.neutral[300]} />
        </View>
        <View
          style={[styles.serveCard, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <FastImage
            source={{ uri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c' }}
            style={styles.serveImage}
          />
          <View style={styles.serveContent}>
            <View>
              <StyledText style={[Typography.body.x2M, { color: colors.text }]}>
                Local Food Drive Assistance
              </StyledText>
              <StyledText style={{ color: Colors.neutral[300] }}>Central Community Hub</StyledText>
            </View>
            <View style={styles.serveFooterRow}>
              <StyledText style={{ color: Colors.primarySapphire.brand }}>
                1.2 miles away
              </StyledText>
              <TouchableOpacity style={styles.joinButton}>
                <StyledText style={styles.joinButtonText}>JOIN</StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <StyledText
          style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: spacing.x16 }]}
        >
          Popular Topics
        </StyledText>
        <View style={styles.topicsGrid}>
          {searchInterests.slice(0, 4).map((topic, index) => {
            const images = [
              'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6',
              'https://images.unsplash.com/photo-1518186285589-2f7649de83e0',
              'https://images.unsplash.com/photo-1511632765486-a01980e01a18',
              'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
            ];
            return (
              <TouchableOpacity key={topic._id} style={styles.topicCard} activeOpacity={0.88}>
                <ImageBackground
                  source={{ uri: images[index % images.length] }}
                  style={styles.topicImage}
                  imageStyle={{ borderRadius: 12 }}
                >
                  <View style={styles.topicOverlay}>
                    <StyledText style={styles.topicText}>{topic.name}</StyledText>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#111827' : '#f8fafc' }]}>
      <View
        style={[
          styles.headerWrap,
          {
            paddingTop: insets.top,
            borderBottomColor: colors.border,
            backgroundColor: dark ? 'rgba(13,13,13,0.92)' : 'rgba(255,255,255,0.92)',
          },
        ]}
      >
        {dark ? (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={18}
            reducedTransparencyFallbackColor={colors.background}
          />
        ) : (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={18}
            reducedTransparencyFallbackColor={colors.background}
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
                <View style={styles.headerAvatarFallback}>
                  <ProfileFill width={22} height={22} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.headerCenterWrap} pointerEvents="none">
            <StyledText style={[styles.headerTitle, { color: colors.text }]}>Explore</StyledText>
          </View>

          <View style={styles.headerSideSlot}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleNotifications}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Notification
                size={24}
                color={dark ? Colors.neutral[200] : Colors.primarySapphire.brand}
                strokeWidth={0.2}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrap, { backgroundColor: dark ? '#1e293b' : '#f1f5f9' }]}>
            <SearchIcon
              style={{ height: 20, width: 20, marginRight: spacing.x8 }}
              stroke={dark ? Colors.neutral[400] : Colors.neutral[300]}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search posts, people, serve, go"
              placeholderTextColor={dark ? Colors.neutral[500] : Colors.neutral[300]}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        {isSearchMode ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {searchFilterChips.map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  onPress={() => setActiveFilter(chip.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive
                        ? Colors.primarySapphire.brand
                        : dark
                          ? 'rgba(255,255,255,0.08)'
                          : '#eef2f6',
                    },
                  ]}
                >
                  <StyledText
                    style={{
                      color: isActive ? '#fff' : dark ? Colors.neutral[300] : Colors.neutral[400],
                    }}
                  >
                    {chip.label}
                  </StyledText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {isSearchMode ? (
        <FlatList
          data={filteredSearchResults}
          keyExtractor={(item) => `${item.kind}:${item.id}`}
          renderItem={renderSearchItem}
          contentContainerStyle={styles.searchContentContainer}
          showsVerticalScrollIndicator={false}
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
                <StyledText style={[Typography.body.x3, { color: colors.text }]}>
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
      ) : (
        browseContent
      )}
    </View>
  );
}

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerWrap: {
      borderBottomWidth: 1,
      overflow: 'hidden',
      zIndex: 8,
    },
    headerRow: {
      height: 52,
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
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
    },
    headerAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Colors.neutral[700],
    },
    headerAvatarFallback: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Colors.primarySapphire.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      paddingHorizontal: spacing.x16,
      paddingBottom: spacing.x10,
    },
    searchInputWrap: {
      height: 46,
      borderRadius: borderRadius.base,
      paddingHorizontal: spacing.x16,
      alignItems: 'center',
      flexDirection: 'row',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
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
      paddingTop: spacing.x20,
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
      fontWeight: '700',
    },
    sectionActionText: {
      color: Colors.primarySapphire.brand,
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
      backgroundColor: dark ? '#0f172a' : '#e5edf4',
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
    creatorsWrapper: {
      paddingVertical: spacing.x20,
      backgroundColor: dark ? 'rgba(15, 23, 42, 0.5)' : '#f1f5f9',
    },
    creatorCard: {
      width: 132,
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      alignItems: 'center',
      marginRight: spacing.x16,
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
      width: '100%',
      height: '100%',
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
      backgroundColor: dark ? '#1f2937' : '#dce5ed',
    },
    creatorActionButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 11,
      textTransform: 'uppercase',
    },
    serveCard: {
      marginHorizontal: spacing.x16,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      padding: spacing.x10,
    },
    serveImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: Colors.neutral[600],
    },
    serveContent: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'space-between',
    },
    serveFooterRow: {
      marginTop: spacing.x8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    joinButton: {
      borderWidth: 1,
      borderColor: Colors.primarySapphire.brand,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    joinButtonText: {
      color: Colors.primarySapphire.brand,
      fontWeight: '700',
      fontSize: 11,
    },
    topicsGrid: {
      paddingHorizontal: spacing.x16,
      marginTop: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: spacing.x10,
    },
    topicCard: {
      width: '48%',
      height: 96,
      marginBottom: spacing.x10,
    },
    topicImage: {
      width: '100%',
      height: '100%',
    },
    topicOverlay: {
      flex: 1,
      borderRadius: 12,
      backgroundColor: 'rgba(3,47,60,0.4)',
      justifyContent: 'flex-end',
      padding: spacing.x10,
    },
    topicText: {
      color: '#fff',
      fontWeight: '700',
    },
    searchContentContainer: {
      paddingHorizontal: spacing.x16,
      paddingTop: 12,
      paddingBottom: spacing.x32,
      flexGrow: 1,
    },
    searchRowSpacing: {
      marginBottom: 12,
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
      marginBottom: 12,
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
      marginBottom: 12,
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
