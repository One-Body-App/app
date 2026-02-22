import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';

// Assuming these paths match your project structure
import { RootState } from '@/src/redux/reducers/rootReducer';
import { getUserProfile } from '@/src/redux/actions/UserAction';
import { ApiCall } from '@/src/services/api';
import { Interest, User } from '@/utils/types';
import {
  ExploreStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import { Colors } from '@/src/styles';

type Props = CompositeScreenProps<
  StackScreenProps<ExploreStackParamsList, 'Explore'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'ExploreTab'>
  >
>;

enum SortType {
  trending = 'trending',
  forYou = 'forYou',
  news = 'news',
  sermons = 'sermons',
  business = 'business',
}

function Explore({ navigation }: Props) {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Theme Colors
  const theme = {
    primary: '#126b87',
    background: isDark ? '#221610' : '#f8f6f6',
    card: isDark ? '#1e293b' : '#ffffff', // slate-800 / white
    text: isDark ? '#f1f5f9' : '#0f172a', // slate-100 / slate-900
    textMuted: isDark ? '#94a3b8' : '#64748b', // slate-400 / slate-500
    border: isDark ? '#334155' : '#e2e8f0', // slate-700 / slate-200
    inputBg: isDark ? '#1e293b' : '#f1f5f9', // slate-800 / slate-100
  };

  const token = useSelector((state: RootState) => state.auth.userToken);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState<string>('');
  const [activeChip, setActiveChip] = useState<SortType>(SortType.forYou);

  const [users, setUsers] = useState<User[]>([]);
  const [searchInterest, setSearchInterest] = useState<Interest[]>([]);
  const [following, setFollowing] = useState<User[]>([]);

  // Existing API logic
  const getAllUserRequest = useCallback(
    async (term = '') => {
      try {
        const res = await ApiCall({
          token,
          route: `user/get-users-to-subscribe/1?term=${term}&itemsPerPage=10`,
          verb: 'get',
        });
        setIsRefreshing(false);
        if (res?.status === 200) {
          setUsers(res?.response.data ?? []);
        }
      } catch (e) {
        setIsRefreshing(false);
        console.log('Error fetching users:', e);
      }
    },
    [token]
  );

  const getInterests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ApiCall({ route: 'tags/interest', verb: 'get', token });
      if (res?.status === 200) {
        setSearchInterest(res?.response);
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      console.log('Error fetching interests:', e);
    }
  }, [token]);

  const getFollowing = useCallback(async () => {
    try {
      const res = await ApiCall({ route: 'user/get-following', verb: 'get', token });
      if (res?.status === 200) setFollowing(res?.response?.data);
    } catch (e) {
      console.log('Error fetching following:', e);
    }
  }, [token]);

  useEffect(() => {
    getAllUserRequest();
    dispatch(getUserProfile({ token }));
    getInterests();
    getFollowing();
  }, [dispatch, getAllUserRequest, getFollowing, getInterests, token]);

  useEffect(() => {
    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      getAllUserRequest(searchText);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [getAllUserRequest, searchText]);

  const onRefresh = () => {
    setIsRefreshing(true);
    getAllUserRequest(searchText);
    getInterests();
  };

  const renderChips = () => {
    const chips = [
      { id: SortType.trending, label: 'Trending' },
      { id: SortType.forYou, label: 'For You' },
      { id: SortType.news, label: 'News' },
      { id: SortType.sermons, label: 'Sermons' },
      { id: SortType.business, label: 'Business' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {chips.map((chip) => {
          const isActive = activeChip === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              onPress={() => setActiveChip(chip.id)}
              style={[styles.chip, { backgroundColor: isActive ? theme.primary : theme.inputBg }]}
            >
              <Text style={[styles.chipText, { color: isActive ? '#fff' : theme.textMuted }]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Sticky Header Wrapper */}
      <View
        style={[
          styles.headerWrapper,
          { borderBottomColor: theme.border, backgroundColor: theme.background },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="hubspot" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Explore</Text>
          <TouchableOpacity style={styles.notificationBtn}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: theme.inputBg }]}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={theme.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Sermons, creators, projects..."
              placeholderTextColor={theme.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>
        {renderChips()}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* TRENDING NOW (Static UI) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Trending Now</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {/* Mock Item 1 */}
            <TouchableOpacity style={styles.trendingCard}>
              <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1543616991-75a2c125ff5b' }}
                style={styles.trendingImage}
                imageStyle={{ borderRadius: 12 }}
              >
                <View style={styles.liveBadge}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </ImageBackground>
              <Text style={[styles.trendingTitle, { color: theme.text }]} numberOfLines={2}>
                Global Worship Night 2024
              </Text>
              <View style={styles.trendingMeta}>
                <MaterialCommunityIcons name="eye-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.trendingMetaText, { color: theme.textMuted }]}>
                  12.4K watching
                </Text>
              </View>
            </TouchableOpacity>

            {/* Mock Item 2 */}
            <TouchableOpacity style={styles.trendingCard}>
              <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7' }}
                style={styles.trendingImage}
                imageStyle={{ borderRadius: 12 }}
              />
              <Text style={[styles.trendingTitle, { color: theme.text }]} numberOfLines={2}>
                Faith in Business Summit
              </Text>
              <View style={styles.trendingMeta}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.trendingMetaText, { color: theme.textMuted }]}>
                  2 days ago
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* NEW CREATORS (Mapped from users API) */}
        <View
          style={[styles.creatorsSection, { backgroundColor: isDark ? '#0f172a80' : '#f1f5f9' }]}
        >
          <View style={styles.sectionHeaderCol}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>New Creators</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
              People you might find inspiring
            </Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ margin: 20 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {users.map((item) => {
                const resolvedUserId = item.id ?? item._id ?? '';
                const isFollowing = resolvedUserId
                  ? following.some((f) => f._id === resolvedUserId)
                  : false;
                return (
                  <TouchableOpacity
                    key={resolvedUserId || item.name}
                    style={[
                      styles.creatorCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                    onPress={() => {
                      if (!resolvedUserId) {
                        return;
                      }
                      navigation.navigate('Main', {
                        screen: 'SearchTab',
                        params: { screen: 'UserProfile', params: { id: resolvedUserId } },
                      });
                    }}
                  >
                    <View style={styles.creatorImageFrame}>
                      <FastImage
                        source={{ uri: item?.profileImage || NO_PROFILE_IMAGE }}
                        style={styles.creatorImage}
                        resizeMode={FastImage.resizeMode.contain}
                      />
                    </View>
                    <Text style={[styles.creatorName, { color: theme.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <TouchableOpacity
                      style={[styles.followBtn, isFollowing && { backgroundColor: theme.border }]}
                    >
                      <Text style={[styles.followBtnText, isFollowing && { color: theme.text }]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* SERVE OPPORTUNITIES (Static UI) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Serve Opportunities</Text>
            <MaterialCommunityIcons name="hand-heart" size={24} color={theme.textMuted} />
          </View>
          <View
            style={[styles.serveCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <FastImage
              source={{ uri: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c' }}
              style={styles.serveImage}
            />
            <View style={styles.serveContent}>
              <View>
                <Text style={[styles.serveTitle, { color: theme.text }]}>
                  Local Food Drive Assistance
                </Text>
                <Text style={[styles.serveSubtitle, { color: theme.textMuted }]}>
                  Central Community Hub
                </Text>
              </View>
              <View style={styles.serveFooter}>
                <View style={styles.serveLocation}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={theme.primary} />
                  <Text style={styles.serveLocationText}>1.2 miles away</Text>
                </View>
                <TouchableOpacity style={styles.joinBtn}>
                  <Text style={styles.joinBtnText}>JOIN</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* GO! EVENTS (Static UI) */}
        <View style={[styles.eventsSection, { backgroundColor: `${theme.primary}10` }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Go! Events</Text>
            <TouchableOpacity style={styles.calendarBtn}>
              <MaterialCommunityIcons name="calendar-month" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87' }}
            style={styles.eventImage}
            imageStyle={{ borderRadius: 12 }}
          >
            <View style={styles.eventOverlay} />
            <View style={styles.eventContent}>
              <Text style={styles.eventDate}>Coming July 12-15</Text>
              <Text style={styles.eventTitle}>Unleash Leadership 2024</Text>
              <TouchableOpacity style={styles.registerBtn}>
                <Text style={styles.registerBtnText}>Register Now</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* POPULAR TOPICS (Mapped from searchInterests) */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, marginBottom: 16, paddingHorizontal: 16 },
            ]}
          >
            Popular Topics
          </Text>
          <View style={styles.topicsGrid}>
            {searchInterest.slice(0, 4).map((topic, index) => {
              // Mock background images for the first 4 topics
              const bgs = [
                'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6',
                'https://images.unsplash.com/photo-1518186285589-2f7649de83e0',
                'https://images.unsplash.com/photo-1511632765486-a01980e01a18',
                'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
              ];
              return (
                <TouchableOpacity key={topic._id} style={styles.topicCard}>
                  <ImageBackground
                    source={{ uri: bgs[index % 4] }}
                    style={styles.topicImage}
                    imageStyle={{ borderRadius: 12 }}
                  >
                    <View style={styles.topicOverlay}>
                      <Text style={styles.topicText}>{topic.name}</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default Explore;

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  iconContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#126b871a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, marginLeft: 12 },
  notificationBtn: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  chipsContainer: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { paddingBottom: 40 },
  section: { paddingVertical: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderCol: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  sectionSubtitle: { fontSize: 14, marginTop: 4 },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#126b87' },
  horizontalScroll: { paddingHorizontal: 16, gap: 16 },

  // Trending
  trendingCard: { width: 280, marginRight: 16 },
  trendingImage: { aspectRatio: 16 / 9, marginBottom: 12, justifyContent: 'flex-end', padding: 12 },
  liveBadge: {
    backgroundColor: '#126b87',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: { fontSize: 10, fontWeight: '700', color: 'white' },
  trendingTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendingMetaText: { fontSize: 14, marginLeft: 4 },

  // Creators
  creatorsSection: { paddingVertical: 24 },
  creatorCard: {
    width: 128,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 16,
  },
  creatorImageFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#126b87',
    backgroundColor: Colors.containFrame,
    overflow: 'hidden',
    marginBottom: 12,
  },
  creatorImage: {
    width: '100%',
    height: '100%',
  },
  creatorName: { fontSize: 14, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  followBtn: {
    width: '100%',
    paddingVertical: 6,
    backgroundColor: '#126b87',
    borderRadius: 8,
    alignItems: 'center',
  },
  followBtnText: { color: 'white', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  // Serve
  serveCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  serveImage: { width: 80, height: 80, borderRadius: 8 },
  serveContent: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  serveTitle: { fontSize: 14, fontWeight: '700' },
  serveSubtitle: { fontSize: 12, marginTop: 4 },
  serveFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  serveLocation: { flexDirection: 'row', alignItems: 'center' },
  serveLocationText: { fontSize: 10, fontWeight: '700', color: '#126b87', marginLeft: 4 },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#126b87',
  },
  joinBtnText: { fontSize: 10, fontWeight: '700', color: '#126b87' },

  // Events
  eventsSection: { paddingVertical: 24, paddingHorizontal: 16 },
  calendarBtn: { padding: 8, backgroundColor: '#126b87', borderRadius: 8 },
  eventImage: {
    aspectRatio: 16 / 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 12,
  },
  eventOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18, 107, 135, 0.7)' },
  eventContent: { padding: 16, zIndex: 1 },
  eventDate: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  eventTitle: { fontSize: 20, fontWeight: '700', color: 'white', marginBottom: 12 },
  registerBtn: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  registerBtnText: { color: '#126b87', fontSize: 14, fontWeight: '700' },

  // Topics
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  topicCard: { width: '48%', height: 96, marginBottom: 12 },
  topicImage: { width: '100%', height: '100%' },
  topicOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  topicText: { color: 'white', fontWeight: '700', textAlign: 'center' },
});
