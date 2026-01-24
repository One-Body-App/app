import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  memo,
  useMemo,
} from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
  ListRenderItem,
  Platform,
  Animated,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

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

import styles from './styles';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';

import StyledText from '@/components/styled/Text';
import ArticleItem from '@/components/listItems/ArticleItem';
import SocialItem from '@/components/listItems/SocialItem';
import { ArticleType, SocialPost, User } from '@/utils/types';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { getHeight } from '@/utils/ResponsiveFun';
import Logo from '@/assets/icons/logo.svg';
import LogoWhite from '@/assets/icons/logo_white.svg';

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
  primary: '#126b87',
  primaryBase: '#41899f',
  primaryLight: '#a0c4cf',
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

type FeedEntry = FeedPost | TasteBreakerItem | RelatedContentItem;

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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<FeedEntry>);

const mainTabs = [
  { label: 'Feed', value: FeedTypes.Connected },
  { label: 'Read', value: FeedTypes.Read },
  { label: 'Pray', value: FeedTypes.Pray },
  { label: 'Watch', value: FeedTypes.Watch },
];

// --- COMPONENT 1: Status Input ---
function StatusInput({ userAvatar }: { userAvatar?: string }) {
  const { dark, colors } = useTheme();

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
        style={[styles.promptInput, { color: colors.text }]}
      />
      <TouchableOpacity
        style={[
          styles.promptIcon,
          { backgroundColor: dark ? 'rgba(18, 107, 135, 0.2)' : 'rgba(18, 107, 135, 0.1)' },
        ]}
      >
        <Gallery size={20} color={BRAND.primary} variant="Bold" />
      </TouchableOpacity>
    </View>
  );
}

// --- COMPONENT 2: Discovery Section ---
function DiscoverySection({ visible }: { visible: boolean }) {
  const { dark } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.discoveryContainer}>
      <View style={[styles.discoveryHeader]}>
        <StyledText
          style={{ fontWeight: '700', fontSize: 16, color: dark ? BRAND.white : BRAND.black }}
        >
          People You May Know
        </StyledText>
        <TouchableOpacity>
          <StyledText style={{ color: BRAND.primary, fontWeight: '700', fontSize: 14 }}>
            See all
          </StyledText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {[1, 2, 3].map((id) => (
          <View
            key={`discovery-${id}`}
            style={[
              styles.discoveryCard,
              {
                backgroundColor: dark ? BRAND.cardDark : BRAND.white,
                borderColor: dark ? BRAND.gray800 : BRAND.gray100,
              },
            ]}
          >
            <View style={styles.avatarSmall} />
            <StyledText
              style={{ fontWeight: 'bold', marginTop: 4, color: dark ? BRAND.white : '#000' }}
            >
              User {id}
            </StyledText>
            <StyledText style={{ fontSize: 10, color: BRAND.gray400, marginBottom: 8 }}>
              2 mutual friends
            </StyledText>
            <TouchableOpacity
              style={{
                backgroundColor: BRAND.primaryLight,
                paddingVertical: 6,
                width: '100%',
                alignItems: 'center',
                borderRadius: 20,
              }}
            >
              <StyledText style={{ color: BRAND.primary, fontSize: 12, fontWeight: '700' }}>
                Connect
              </StyledText>
            </TouchableOpacity>
          </View>
        ))}
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
}

const ModernFeedCard = memo(({ item, onPress, onPressProfile }: ModernCardProps) => {
  const { dark } = useTheme();

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
  const headerRowHeight = getHeight(7);
  const headerSideWidth = headerRowHeight;
  const defaultHeaderHeight = insets.top + headerRowHeight + spacing.x10 + spacing.x8 + 20;
  const glassOverlayColor = dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
  const androidHeaderBackground = colors.background;
  const androidHeaderBorderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const tabContainerGlassStyle = useMemo(
    () => ({
      backgroundColor: 'transparent',
      borderBottomColor: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
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
    type: route.params?.selectedTab ?? FeedTypes.Connected,
    page: 1,
  });

  const [feedSubType, setFeedSubType] = useState<FeedTypes>(FeedTypes.Connected);
  const [feedData, setFeedData] = useState<FeedEntry[]>([]);
  const [isEndOfList, setIsEndOfList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getFeedData = useCallback(
    async (type: FeedTypes, pageNumber: number) => {
      const actualType = type === FeedTypes.Connected ? feedSubType : type;

      setIsLoading(true);
      try {
        const res = await ApiCall({
          route: `user/get-following-feed/${actualType}/${pageNumber}`,
          token,
          verb: 'get',
        });

        if (res?.status === 200) {
          const response = Array.isArray(res?.response) ? (res.response as FeedEntry[]) : [];
          if (pageNumber === 1) {
            setIsEndOfList(false);
            setFeedData(response);
          } else if (response.length < 1) {
            setIsEndOfList(true);
          } else {
            setFeedData((previous) => [...previous, ...response]);
          }
        } else {
          setFeedData([]);
          setIsEndOfList(true);
        }
      } catch (e: any) {
        setFeedData([]);
      }
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [token, feedSubType]
  );

  useEffect(() => {
    getFeedData(feedOptions.type, feedOptions.page);
  }, [feedOptions, feedSubType, getFeedData]);

  const handleTabChange = useCallback(
    (tabValue: FeedTypes) => {
      if (tabValue === FeedTypes.Watch) {
        navigation.navigate('MainRoot', {
          screen: 'Main',
          params: { screen: 'HomeTab', params: { screen: 'WatchPortal' } },
        });
        return;
      }
      setIsRefreshing(false);
      setFeedOptions({ type: tabValue, page: 1 });
    },
    [navigation]
  );

  const toggleFeedSubType = useCallback(() => {
    const newType = feedSubType === FeedTypes.Connected ? FeedTypes.ForYou : FeedTypes.Connected;
    setFeedSubType(newType);
    setFeedOptions((prev) => ({ ...prev, page: 1 }));
  }, [feedSubType]);

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

  const renderTabs = useCallback(
    (containerStyle?: StyleProp<ViewStyle>) => (
      <View style={[styles.tabContainer, containerStyle]}>
        {mainTabs.map((tab) => {
          const { label, value } = tab;
          const isActive = feedOptions.type === value;

          if (value === FeedTypes.Connected) {
            let feedLabel = 'Feed';
            if (isActive) {
              feedLabel = feedSubType === FeedTypes.Connected ? 'Connected' : 'For You';
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
                      color={BRAND.primary}
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
    [feedOptions.type, feedSubType, handleTabChange, toggleFeedSubType]
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
              <Menu
                color={dark ? Colors.neutral[300] : Colors.primary.brand}
                height={24}
                width={24}
              />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ height: 28, width: 28 }}>
              {dark ? (
                <LogoWhite style={{ height: 28, width: 28 }} />
              ) : (
                <Logo style={{ height: 28, width: 28 }} />
              )}
            </View>
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
                color={dark ? Colors.neutral[300] : Colors.primary.brand}
                strokeWidth={0.2}
              />
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
      handleNotifications,
      handleOpenDrawer,
      headerRowHeight,
      headerSideWidth,
      insets.top,
      renderTabs,
      tabContainerGlassStyle,
    ]
  );

  useLayoutEffect(() => {
    if (Platform.OS !== 'ios') return;
    const resolvedHeaderHeight = headerHeight || defaultHeaderHeight;

    stackNavigation.setOptions({
      header: renderHeader,
      headerTransparent: true,
      headerShadowVisible: false,
      contentStyle: { paddingTop: resolvedHeaderHeight },
    });
  }, [defaultHeaderHeight, headerHeight, renderHeader, stackNavigation]);

  // --- NAVIGATION HANDLERS ---
  const navigateToDetail = (item: FeedPost) => {
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

  const listRef = useRef<FlatList<FeedEntry>>(null);
  useScrollToTop(listRef as any);

  const unwrapFeedItem = (entry: FeedEntry): FeedPost | null => {
    if (entry.type === 'tasteBreaker') {
      return entry.items?.[0] ?? null;
    }
    if (entry.type === 'relatedContent') {
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

  const isSocialPost = (entry: FeedPost): entry is SocialPost & { type?: 'social' } =>
    entry.type === 'social';

  const isRssPost = (entry: FeedPost): entry is ArticleType & { type?: 'posts' } =>
    entry.type === 'posts';

  // --- RENDER ITEM LOGIC (Fixes "Data not generating") ---
  const renderFeedItem: ListRenderItem<FeedEntry> = ({ item }) => {
    const unwrapped = unwrapFeedItem(item);
    if (!unwrapped) return null;

    const normalizedWithImage = normalizeFeedImage(unwrapped);

    if (isSocialPost(normalizedWithImage)) {
      const socialItem: SocialPost = {
        ...normalizedWithImage,
        reactions: normalizedWithImage.reactions ?? [],
      };
      return (
        <SocialItem
          itemData={socialItem}
          removePost={() => undefined}
          parentRefreshContent={() => {
            getFeedData(feedOptions.type, 1);
          }}
          fromSavedPosts={false}
        />
      );
    }

    if (isRssPost(normalizedWithImage)) {
      const rssItem: ArticleType = {
        ...normalizedWithImage,
        image:
          typeof normalizedWithImage.image === 'string'
            ? { url: normalizedWithImage.image }
            : normalizedWithImage.image,
        reactions: normalizedWithImage.reactions ?? [],
      };
      return (
        <ArticleItem
          item={rssItem}
          imageSizeType="cover"
          showModal={() => undefined}
          onPress={() => {
            navigateToDetail(normalizedWithImage);
          }}
        />
      );
    }

    return (
      <ModernFeedCard
        item={normalizedWithImage}
        onPress={() => navigateToDetail(normalizedWithImage)}
        onPressProfile={navigateToProfile}
      />
    );
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 120],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent?.();
      if (!parent) return undefined;

      const baseTabStyle = {
        height: getHeight(7),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
      };

      parent.setOptions({
        tabBarStyle: [baseTabStyle, { opacity: 1 }],
      });

      const listenerId = scrollY.addListener(({ value }) => {
        const opacity = Math.max(0, Math.min(1, 1 - value / 160));
        parent.setOptions({
          tabBarStyle: [baseTabStyle, { opacity }],
        });
      });

      return () => {
        scrollY.removeListener(listenerId);
        parent.setOptions({
          tabBarStyle: [baseTabStyle, { opacity: 1 }],
        });
      };
    }, [colors.background, colors.border, navigation, scrollY])
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: dark ? Colors.neutral[900] : Colors.neutral[700] },
      ]}
    >
      {Platform.OS === 'android' && (
        <Animated.View
          style={{
            opacity: headerOpacity,
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
                <Menu
                  color={dark ? Colors.neutral[300] : Colors.primary.brand}
                  height={24}
                  width={24}
                />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ height: 28, width: 28 }}>
                {dark ? (
                  <LogoWhite style={{ height: 28, width: 28 }} />
                ) : (
                  <Logo style={{ height: 28, width: 28 }} />
                )}
              </View>
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
                  color={dark ? Colors.neutral[300] : Colors.primary.brand}
                  strokeWidth={0.2}
                />
              </TouchableOpacity>
            </View>
          </View>
          {renderTabs(androidTabContainerStyle)}
        </Animated.View>
      )}

      {/* Main Feed */}
      {isLoading && feedOptions.page === 1 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
      ) : (
        <AnimatedFlatList
          ref={listRef}
          data={feedData}
          keyExtractor={(item, index) => {
            if (item.type === 'tasteBreaker') return `tasteBreaker-${index}`;
            if (item.type === 'relatedContent') return `related-${index}`;
            const baseId = (item as FeedPost).id ?? (item as FeedPost).postId ?? `row-${index}`;
            return `${item.type ?? 'item'}-${baseId}-${index}`;
          }}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            <>
              <StatusInput
                userAvatar={
                  userProfile?.avatar ?? userProfile?.profile_image ?? userProfile?.profileImage
                }
              />
              <DiscoverySection visible={feedOptions.type === FeedTypes.Connected} />
            </>
          }
          renderItem={renderFeedItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                getFeedData(feedOptions.type, 1);
              }}
              tintColor={BRAND.primary}
            />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (!isLoading && !isEndOfList) {
              setFeedOptions((prev) => ({ ...prev, page: prev.page + 1 }));
            }
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
}

export default Home;
