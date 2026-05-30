import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  useWindowDimensions,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps, useTheme } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';

import { RootState } from '@/src/redux/reducers/rootReducer';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/services/api';
import { getuserGet } from '@/src/redux/actions/UserAction';
import StyledText from '@/components/styled/Text';
import { spacing } from '@/src/styles/spacing';
import { getProfile } from '@/src/redux/actions/AuthActions';
import SocialItem from '@/components/listItems/SocialItem';
import ArticleItem from '@/components/listItems/ArticleItem';
import { SavedPost } from '@/utils/types';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
import useSharedImageViewer from '@/components/imageViewer/useSharedImageViewer';
import {
  MainDrawerParamsList,
  MainStackParamList,
  SettingsStackParamsList,
} from '@/src/navigator/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamsList, 'Saved'>,
  CompositeScreenProps<
    NativeStackScreenProps<MainStackParamList, 'ConfirmLogin'>,
    DrawerScreenProps<MainDrawerParamsList, 'Main'>
  >
>;

enum ContentType {
  RSS = 'RSS',
  Social = 'Social',
  All = 'All',
}

const SAPPHIRE = '#126B87';
const SAPPHIRE_LIGHT = '#E7F0F3';
const SAPPHIRE_MID = '#5997AB';
const SAVED_POST_FALLBACK_DATE = new Date();

function SavedEmptyState({ dark }: { dark: boolean }) {
  return (
    <View style={[emptyStyles.root, { backgroundColor: dark ? '#0d0f12' : '#F7F9FA' }]}>
      {/* Large decorative bookmark */}
      <View style={emptyStyles.iconWrap}>
        <View
          style={[
            emptyStyles.iconRing,
            {
              backgroundColor: dark ? 'rgba(18, 107, 135, 0.14)' : SAPPHIRE_LIGHT,
              borderColor: dark ? 'rgba(184, 211, 219, 0.28)' : '#B8D3DB',
            },
          ]}
        >
          <FontAwesomeIcon icon={faBookmark} size={48} color={SAPPHIRE} />
        </View>
        {/* Decorative dots */}
        <View style={[emptyStyles.dot, emptyStyles.dotTL]} />
        <View style={[emptyStyles.dot, emptyStyles.dotBR]} />
        <View style={[emptyStyles.dotSmall, emptyStyles.dotTR]} />
      </View>

      <StyledText style={[emptyStyles.heading, { color: dark ? '#f4f7fb' : '#1A3A4A' }]}>
        Nothing saved yet
      </StyledText>
      <StyledText style={[emptyStyles.body, { color: dark ? '#8fb4c1' : SAPPHIRE_MID }]}>
        Tap the bookmark on any article or post{'\n'}and it will appear here.
      </StyledText>

      {/* Decorative rule */}
      <View
        style={[
          emptyStyles.rule,
          { backgroundColor: dark ? 'rgba(184, 211, 219, 0.32)' : '#B8D3DB' },
        ]}
      />
      <StyledText style={[emptyStyles.hint, { color: dark ? '#79a9b9' : '#89B5C3' }]}>
        Your reading list, curated by you
      </StyledText>
    </View>
  );
}

function GridCard({ item }: { item: SavedPost }) {
  const cardSize = useWindowDimensions().width / 3 - 3;

  return (
    <View style={[gridStyles.card, { width: cardSize, height: cardSize }]}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={gridStyles.image} resizeMode="cover" />
      ) : (
        <View style={gridStyles.imageFallback}>
          <FontAwesomeIcon icon={faBookmark} size={20} color={SAPPHIRE_MID} />
        </View>
      )}
      {/* Bottom title strip */}
      <View style={gridStyles.titleStrip}>
        <StyledText style={gridStyles.title} numberOfLines={2}>
          {item.title}
        </StyledText>
      </View>
      {/* Type badge */}
      <View
        style={[
          gridStyles.badge,
          { backgroundColor: item.type === 'social' ? SAPPHIRE : '#1A3A4A' },
        ]}
      >
        <StyledText style={gridStyles.badgeText}>
          {item.type === 'social' ? 'Social' : 'Article'}
        </StyledText>
      </View>
    </View>
  );
}

function Saved({ navigation }: Props) {
  const { dark } = useTheme();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const authState = useSelector((state: RootState) => state.auth);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const dispatch = useDispatch();
  const [isScrollEnable, setIsScrollEnable] = useState(true);
  const [filter, setFilter] = useState<ContentType>(ContentType.All);
  const [visibleItemsIndex, setVisibleItemsIndex] = useState<number[]>([]);
  const { width } = useWindowDimensions();
  const { imageViewer, openImages } = useSharedImageViewer();
  const socialItemContentWidth = Math.max(width - spacing.x16 * 2 - 14, 0);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (!viewableItems || viewableItems.length < 1) {
      setVisibleItemsIndex([]);
      return;
    }
    setVisibleItemsIndex(viewableItems.map((item: any) => item.index).filter(Number.isInteger));
  }, []);

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        minimumViewTime: 100,
        itemVisiblePercentThreshold: 75,
      },
      onViewableItemsChanged,
    },
  ]);

  const savedPosts = useMemo(() => {
    const posts = user?.savedPost ?? [];
    if (filter === ContentType.RSS) {
      return posts.filter((item) => item.type !== 'social');
    }
    if (filter === ContentType.Social) {
      return posts.filter((item) => item.type === 'social');
    }
    return posts;
  }, [filter, user?.savedPost]);

  const refreshSavedPosts = useCallback(() => {
    setIsRefreshing(true);
    if (token) {
      dispatch(getProfile.Request({ token, pullSavedData: true }));
    }
  }, [dispatch, token]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      dispatch(getProfile.Request({ token, pullSavedData: true }));
    });
    return () => {
      unsubscribe();
    };
  }, [dispatch, navigation, token]);

  useEffect(() => {
    if (token) {
      dispatch(getProfile.Request({ token, pullSavedData: true }));
    }
  }, [dispatch, token]);

  useEffect(() => {
    setIsRefreshing(false);
  }, [authState.getProfileSuccess]);

  const removePost = async (type: string, link: string) => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: `user/remove-saved-post`,
        verb: 'delete',
        token,
        params: { link, type },
      });
      if (res?.status === 200) dispatch(getuserGet({ token, pullSavedData: true }));
      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  // Article-only posts for the grid (RSS posts that have images)
  const gridPosts = savedPosts.filter((p) => p.type !== 'social' && p.image);
  // Social posts rendered full-width as before
  const socialPosts = savedPosts.filter((p) => p.type === 'social');

  // For the grid we use numColumns=3 on a separate FlatList
  const hasGrid =
    filter === ContentType.RSS ||
    (filter === ContentType.All && gridPosts.length > 0 && socialPosts.length === 0);

  // Unified render: when All or Social, use the existing full-width list
  // When RSS or All-with-only-articles, use 3-col grid
  const useGridLayout =
    filter === ContentType.RSS ||
    (filter === ContentType.All && socialPosts.length === 0 && gridPosts.length > 0);

  return (
    <SafeAreaView style={[screenStyles.root, { backgroundColor: dark ? '#0d0f12' : '#F7F9FA' }]}>
      {/* Filter bar — only shown when there are posts */}
      {savedPosts.length > 0 && (
        <ScrollView
          horizontal
          style={[
            screenStyles.filterBar,
            {
              borderBottomColor: dark ? 'rgba(255,255,255,0.08)' : SAPPHIRE_LIGHT,
            },
          ]}
          contentContainerStyle={screenStyles.filterBarContent}
          showsHorizontalScrollIndicator={false}
        >
          {([ContentType.All, ContentType.RSS, ContentType.Social] as ContentType[]).map((type) => (
            <Pressable
              key={type}
              style={[
                screenStyles.filterChip,
                {
                  borderColor: dark ? 'rgba(255,255,255,0.12)' : SAPPHIRE_LIGHT,
                  backgroundColor:
                    filter === type ? SAPPHIRE : dark ? 'rgba(255,255,255,0.03)' : 'transparent',
                },
                filter === type && screenStyles.filterChipActive,
              ]}
              onPress={() => {
                if (filter !== type) setFilter(type);
              }}
            >
              <StyledText
                style={[
                  screenStyles.filterLabel,
                  { color: filter === type ? '#FFFFFF' : dark ? '#a9b8c2' : SAPPHIRE },
                  filter === type && screenStyles.filterLabelActive,
                ]}
              >
                {type}
              </StyledText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Grid layout for article/RSS posts */}
      {useGridLayout ? (
        <FlatList
          data={gridPosts}
          numColumns={3}
          keyExtractor={(item, index) => `grid-${item.postId}-${index}`}
          contentContainerStyle={screenStyles.gridContainer}
          columnWrapperStyle={screenStyles.gridRow}
          showsVerticalScrollIndicator={false}
          onRefresh={refreshSavedPosts}
          refreshing={isRefreshing}
          ListEmptyComponent={<SavedEmptyState dark={dark} />}
          renderItem={({ item }) => <GridCard item={item} />}
          removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
          initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
          maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
          updateCellsBatchingPeriod={STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod}
          windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
        />
      ) : (
        /* Full-width list for social / mixed */
        <FlatList
          data={savedPosts}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          contentContainerStyle={screenStyles.fullListContainer}
          onRefresh={refreshSavedPosts}
          keyExtractor={(item, index) => `${item.created}-${item.postId}-${index}`}
          scrollEnabled={isScrollEnable}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<SavedEmptyState dark={dark} />}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: dark ? 'rgba(255,255,255,0.08)' : SAPPHIRE_LIGHT,
                marginHorizontal: spacing.x16,
              }}
            />
          )}
          renderItem={({ item, index }) => {
            if (item.type === 'social') {
              const postData = user?.savedPostData?.find((p) => p?._id === item.postId);
              if (postData) {
                return (
                  <SocialItem
                    itemData={postData}
                    index={index}
                    visible={visibleItemsIndex.includes(index)}
                    contentWidth={socialItemContentWidth}
                    onOpenImages={openImages}
                    onShowDismissCard={(e?: boolean) => setIsScrollEnable(!e)}
                    removePost={removePost}
                    fromSavedPosts
                    onCommentsPress={() => {
                      const postId = postData.postId ?? postData.id ?? postData._id;
                      if (postId) navigation.navigate('SinglePost', { postId });
                    }}
                  />
                );
              }
            } else if (user && item.title) {
              return (
                <ArticleItem
                  item={{
                    ...item,
                    created: item.created ?? SAVED_POST_FALLBACK_DATE,
                    image: item.image ? { url: item.image } : undefined,
                    userData: user,
                    reactions: [],
                  }}
                  imageSizeType="contain"
                  blogPostTitleStyle={{ flexDirection: 'row', justifyContent: 'space-between' }}
                />
              );
            }
            return null;
          }}
          removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
          initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
          maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
          updateCellsBatchingPeriod={STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod}
          windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
        />
      )}
      {imageViewer}
    </SafeAreaView>
  );
}

// ─── Screen-level styles ─────────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F9FA',
  },
  filterBar: {
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: SAPPHIRE_LIGHT,
  },
  filterBarContent: {
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x10,
    gap: spacing.x8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.x16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SAPPHIRE_LIGHT,
    backgroundColor: 'transparent',
    marginRight: spacing.x8,
  },
  filterChipActive: {
    backgroundColor: SAPPHIRE,
    borderColor: SAPPHIRE,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    color: SAPPHIRE,
    letterSpacing: 0.2,
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  gridContainer: {
    flexGrow: 1,
    paddingBottom: spacing.x72,
  },
  fullListContainer: {
    flexGrow: 1,
    paddingBottom: spacing.x72,
  },
  gridRow: {
    gap: 2,
    marginBottom: 2,
  },
});

// ─── Grid card styles ─────────────────────────────────────────────────────────
const gridStyles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: SAPPHIRE_LIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SAPPHIRE_LIGHT,
  },
  titleStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(18, 107, 135, 0.78)',
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  title: {
    fontSize: 9,
    fontFamily: 'Rubik-Medium',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 7,
    fontFamily: 'Rubik-Medium',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

// ─── Empty state styles ───────────────────────────────────────────────────────
const emptyStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    backgroundColor: '#F7F9FA',
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 36,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: SAPPHIRE_LIGHT,
    borderWidth: 1.5,
    borderColor: '#B8D3DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: SAPPHIRE,
    opacity: 0.25,
  },
  dotSmall: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: SAPPHIRE_MID,
    opacity: 0.4,
  },
  dotTL: { top: 8, left: 8 },
  dotBR: { bottom: 4, right: 4 },
  dotTR: { top: 12, right: 10 },
  heading: {
    fontSize: 22,
    fontFamily: 'Rubik-SemiBold',
    color: '#1A3A4A',
    letterSpacing: -0.3,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 12,
    ...(Platform.OS === 'android'
      ? {
          paddingBottom: 2,
          includeFontPadding: true,
        }
      : null),
  },
  body: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: SAPPHIRE_MID,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  rule: {
    width: 32,
    height: 1.5,
    backgroundColor: '#B8D3DB',
    marginBottom: 16,
  },
  hint: {
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
    color: '#89B5C3',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

export default Saved;
