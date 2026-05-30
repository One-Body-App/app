import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Pressable,
  View,
} from 'react-native';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Icon from '@react-native-vector-icons/material-design-icons';
import Toast from 'react-native-simple-toast';
import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import CustomModal from '@/src/components/CustomModal';
import StyledText from '@/components/styled/Text';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { fontSize, lineHeight } from '@/src/styles/typography';
import { ApiCall } from '@/services/api';
import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  PostType,
  SocialPostReaction,
  ReactionDetailsResponse,
  ReactionDetailsTab,
  ReactionDetailsUser,
} from '@/utils/types';
import { NO_PROFILE_IMAGE } from '@/services/constants';

type PostReactionsModalProps = {
  visible: boolean;
  postType?: PostType;
  postId?: string;
  fallbackReactions?: SocialPostReaction[];
  initialTab?: ReactionDetailsTab;
  onClose: () => void;
};

type ReactionTabConfig = {
  id: ReactionDetailsTab;
  label: string;
  emoji?: string;
};

const PAGE_SIZE = 25;

const TAB_CONFIG: ReactionTabConfig[] = [
  { id: 'all', label: 'All' },
  { id: 'like', label: 'Likes', emoji: '👍' },
  { id: 'love', label: 'Loves', emoji: '❤️' },
  { id: 'praying', label: 'Prayers', emoji: '🙏' },
  { id: 'praise', label: 'Praise', emoji: '🙌' },
  { id: 'haha', label: 'Haha', emoji: '😂' },
  { id: 'wow', label: 'Wow', emoji: '😮' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'angry', label: 'Angry', emoji: '😡' },
];

const DEFAULT_TOTALS: Record<ReactionDetailsTab, number> = {
  all: 0,
  like: 0,
  love: 0,
  praying: 0,
  praise: 0,
  haha: 0,
  wow: 0,
  sad: 0,
  angry: 0,
};

const normalizeReactionType = (reactionType?: string): Exclude<ReactionDetailsTab, 'all'> => {
  const value = String(reactionType ?? '')
    .trim()
    .toLowerCase();
  if (value === 'happy') {
    return 'praise';
  }
  if (
    value === 'like' ||
    value === 'love' ||
    value === 'praying' ||
    value === 'praise' ||
    value === 'haha' ||
    value === 'wow' ||
    value === 'sad' ||
    value === 'angry'
  ) {
    return value;
  }
  return 'love';
};

const getReactionsRoute = (postType?: PostType, rawPostId?: string) => {
  const postId = String(rawPostId ?? '').trim();
  if (!postType || !postId) {
    return '';
  }

  const normalizedId =
    postType === PostType.social || postType === PostType.prayer || postType === PostType.watch
      ? postId.replace(/^onebody_/, '')
      : postId;

  if (!normalizedId) {
    return '';
  }

  if (postType === PostType.social) {
    return `social/${normalizedId}/reactions`;
  }
  if (postType === PostType.prayer) {
    return `prayer/${normalizedId}/reactions`;
  }
  if (postType === PostType.rss) {
    return `rss/${normalizedId}/reactions`;
  }
  if (postType === PostType.watch) {
    return `watch/${normalizedId}/reactions`;
  }

  return '';
};

function PostReactionsModal({
  visible,
  postType,
  postId,
  fallbackReactions,
  initialTab = 'all',
  onClose,
}: PostReactionsModalProps) {
  const { dark } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [activeTab, setActiveTab] = useState<ReactionDetailsTab>(initialTab);
  const [totals, setTotals] = useState<Record<ReactionDetailsTab, number>>(DEFAULT_TOTALS);
  const [items, setItems] = useState<ReactionDetailsUser[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [useLegacyFallback, setUseLegacyFallback] = useState(false);
  const [connectionOverrides, setConnectionOverrides] = useState<Record<string, boolean>>({});
  const [connectingUserIds, setConnectingUserIds] = useState<string[]>([]);
  const itemsCountRef = useRef(0);
  const userProfileCacheRef = useRef<
    Record<string, { name?: string; username?: string; profileImage?: string }>
  >({});

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dragTranslateY = useSharedValue(0);

  const dragHandleResponder = useRef(
    Platform.OS === 'android'
      ? PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5 && Math.abs(gs.dy) > Math.abs(gs.dx),
          onPanResponderMove: (_, gs) => {
            if (gs.dy > 0) {
              dragTranslateY.value = gs.dy;
            }
          },
          onPanResponderRelease: (_, gs) => {
            if (gs.dy > 80) {
              dragTranslateY.value = withTiming(300, { duration: 200 }, (finished) => {
                if (finished) {
                  dragTranslateY.value = 0;
                  onCloseRef.current();
                } else {
                  dragTranslateY.value = withSpring(0);
                }
              });
            } else {
              dragTranslateY.value = withSpring(0);
            }
          },
          onPanResponderTerminate: () => {
            dragTranslateY.value = withSpring(0);
          },
        })
      : null
  ).current;

  const route = useMemo(() => getReactionsRoute(postType, postId), [postId, postType]);

  const mergeUsers = useCallback((previous: ReactionDetailsUser[], next: ReactionDetailsUser[]) => {
    const seen = new Set<string>();
    const merged: ReactionDetailsUser[] = [];

    [...previous, ...next].forEach((item) => {
      const key = `${item.userId}:${item.reactionType}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      merged.push(item);
    });

    return merged;
  }, []);

  const fetchReactionDetails = useCallback(
    async (reset = false) => {
      if (!visible || !route) {
        return;
      }

      const skip = reset ? 0 : itemsCountRef.current;
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        if (useLegacyFallback) {
          const allReactions = Array.isArray(fallbackReactions) ? fallbackReactions : [];
          const latestReactionByUser = new Map<
            string,
            {
              userId: string;
              reactionType: Exclude<ReactionDetailsTab, 'all'>;
              sortTime: number;
            }
          >();

          allReactions.forEach((reaction) => {
            const userId = String(reaction?.userId ?? '').trim();
            if (!userId) {
              return;
            }

            const reactionType = normalizeReactionType(reaction?.type);
            const updatedAtMs = reaction?.updatedAt ? new Date(reaction.updatedAt).getTime() : 0;
            const createdAtMs = reaction?.createdAt ? new Date(reaction.createdAt).getTime() : 0;
            const sortTime =
              Number.isFinite(updatedAtMs) && updatedAtMs > 0 ? updatedAtMs : createdAtMs;

            const existing = latestReactionByUser.get(userId);
            if (!existing || sortTime >= existing.sortTime) {
              latestReactionByUser.set(userId, {
                userId,
                reactionType,
                sortTime,
              });
            }
          });

          const normalizedReactions = Array.from(latestReactionByUser.values()).sort(
            (first, second) => second.sortTime - first.sortTime
          );

          const nextTotals = { ...DEFAULT_TOTALS };
          normalizedReactions.forEach((entry) => {
            nextTotals[entry.reactionType] += 1;
            nextTotals.all += 1;
          });
          setTotals(nextTotals);

          const filteredReactions =
            activeTab === 'all'
              ? normalizedReactions
              : normalizedReactions.filter((entry) => entry.reactionType === activeTab);
          const pagedReactions = filteredReactions.slice(skip, skip + PAGE_SIZE);
          const userIdsToLoad = Array.from(
            new Set(pagedReactions.map((entry) => entry.userId))
          ).filter((userId) => !userProfileCacheRef.current[userId]);

          if (userIdsToLoad.length > 0) {
            await Promise.all(
              userIdsToLoad.map(async (userId) => {
                try {
                  const userRes = await ApiCall({
                    token,
                    route: `user/${userId}`,
                    verb: 'get',
                  });

                  if (userRes?.status === 200) {
                    const profile = userRes.response as {
                      name?: string;
                      username?: string;
                      profileImage?: string;
                    };
                    userProfileCacheRef.current[userId] = {
                      name: profile?.name ?? '',
                      username: profile?.username ?? '',
                      profileImage: profile?.profileImage ?? '',
                    };
                  }
                } catch (error) {
                  userProfileCacheRef.current[userId] = {};
                }
              })
            );
          }

          const mappedItems: ReactionDetailsUser[] = pagedReactions.map((entry) => {
            const cachedUser = userProfileCacheRef.current[entry.userId] ?? {};
            return {
              userId: entry.userId,
              name: cachedUser.name || 'User',
              username: cachedUser.username || 'unknown',
              profileImage: cachedUser.profileImage || NO_PROFILE_IMAGE,
              reactionType: entry.reactionType,
              isConnected: Boolean(currentUser?.following?.includes(entry.userId)),
            };
          });

          setItems((previous) => (reset ? mappedItems : mergeUsers(previous, mappedItems)));
          setHasMore(skip + PAGE_SIZE < filteredReactions.length);
          return;
        }

        const res = await ApiCall<ReactionDetailsResponse>({
          token,
          route: `${route}?tab=${activeTab}&skip=${skip}&limit=${PAGE_SIZE}`,
          verb: 'get',
          suppressErrorLog: true,
        });

        if (res?.status === 200 && res.response) {
          const payload = res.response;
          const mappedItems = Array.isArray(payload.items)
            ? payload.items.map((entry) => ({
                ...entry,
                reactionType: normalizeReactionType(entry.reactionType),
              }))
            : [];

          setTotals({
            ...DEFAULT_TOTALS,
            ...(payload.totals ?? {}),
          });
          setItems((previous) => (reset ? mappedItems : mergeUsers(previous, mappedItems)));
          setHasMore(Boolean(payload.hasMore));
          return;
        }

        if (res?.status === 404) {
          setUseLegacyFallback(true);
          return;
        }

        const message =
          typeof (res?.response as { message?: unknown })?.message === 'string'
            ? String((res.response as { message?: string }).message)
            : 'Unable to load reactions.';
        Toast.show(message, Toast.LONG);
      } catch (error) {
        Toast.show('Unable to load reactions.', Toast.LONG);
      } finally {
        if (reset) {
          setIsLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    [
      activeTab,
      currentUser?.following,
      fallbackReactions,
      mergeUsers,
      route,
      token,
      useLegacyFallback,
      visible,
    ]
  );

  useEffect(() => {
    itemsCountRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setActiveTab(initialTab);
  }, [initialTab, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setItems([]);
    setHasMore(false);
    fetchReactionDetails(true);
  }, [activeTab, fetchReactionDetails, visible]);

  useEffect(() => {
    if (!visible) {
      setConnectionOverrides({});
      setConnectingUserIds([]);
      setUseLegacyFallback(false);
      userProfileCacheRef.current = {};
    } else {
      dragTranslateY.value = 0;
    }
  }, [visible, dragTranslateY]);

  const handleToggleConnection = useCallback(
    async (item: ReactionDetailsUser) => {
      if (!item.userId || connectingUserIds.includes(item.userId)) {
        return;
      }

      const isConnected =
        connectionOverrides[item.userId] ??
        item.isConnected ??
        Boolean(currentUser?.following?.includes(item.userId));

      const nextConnected = !isConnected;
      setConnectionOverrides((previous) => ({
        ...previous,
        [item.userId]: nextConnected,
      }));
      setConnectingUserIds((previous) => [...previous, item.userId]);

      try {
        const res = await ApiCall({
          route: `${nextConnected ? 'user/subscribe' : 'user/unsubscribe'}/${item.userId}`,
          token,
          verb: 'patch',
        });

        if (res?.status !== 200) {
          throw new Error('Connection request failed');
        }
      } catch (error) {
        setConnectionOverrides((previous) => ({
          ...previous,
          [item.userId]: isConnected,
        }));
        Toast.show('Unable to update connection right now.', Toast.LONG);
      } finally {
        setConnectingUserIds((previous) => previous.filter((id) => id !== item.userId));
      }
    },
    [connectingUserIds, connectionOverrides, currentUser?.following, token]
  );

  const renderReactionBadge = useCallback((reactionType: ReactionDetailsUser['reactionType']) => {
    const tabConfig = TAB_CONFIG.find((tab) => tab.id === reactionType);
    return tabConfig?.emoji ?? '❤️';
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ReactionDetailsUser }) => {
      const isConnecting = connectingUserIds.includes(item.userId);
      const isConnected =
        connectionOverrides[item.userId] ??
        item.isConnected ??
        Boolean(currentUser?.following?.includes(item.userId));
      const isCurrentUser = item.userId === currentUser?._id;
      const connectLabel = isCurrentUser ? 'Connected' : isConnected ? 'Connected' : 'Connect';
      const isDisabled = isConnecting || isCurrentUser;

      return (
        <View
          style={[
            styles.userRow,
            { borderBottomColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(3,47,60,0.08)' },
          ]}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: item.profileImage || NO_PROFILE_IMAGE }}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.reactionBadge,
                  {
                    backgroundColor: dark ? Colors.neutral[900] : Colors.main.white,
                    borderColor: dark ? Colors.neutral[800] : Colors.neutral[700],
                  },
                ]}
              >
                <StyledText style={styles.reactionBadgeText}>
                  {renderReactionBadge(item.reactionType)}
                </StyledText>
              </View>
            </View>
            <View>
              <StyledText
                style={[styles.userName, { color: dark ? Colors.main.white : '#032f3c' }]}
              >
                {item.name || 'User'}
              </StyledText>
              <StyledText
                style={[styles.userHandle, { color: dark ? Colors.neutral[300] : '#126b87' }]}
              >
                @{item.username || 'unknown'}
              </StyledText>
            </View>
          </View>

          <Pressable
            disabled={isDisabled}
            onPress={() => {
              if (!isCurrentUser) {
                handleToggleConnection(item);
              }
            }}
            style={[
              styles.connectButton,
              isConnected ? styles.connectedButton : styles.connectActiveButton,
              isDisabled && { opacity: 0.8 },
            ]}
          >
            <StyledText
              style={[
                styles.connectButtonText,
                isConnected
                  ? { color: dark ? Colors.main.white : '#032f3c' }
                  : { color: Colors.main.white },
              ]}
            >
              {isConnecting ? '...' : connectLabel}
            </StyledText>
          </Pressable>
        </View>
      );
    },
    [
      connectingUserIds,
      connectionOverrides,
      currentUser?._id,
      currentUser?.following,
      dark,
      handleToggleConnection,
      renderReactionBadge,
    ]
  );

  return (
    <CustomModal
      modalVisible={visible}
      onclose={onClose}
      enableEntranceGlow
      externalTranslateY={Platform.OS === 'android' ? dragTranslateY : undefined}
      style={{
        backgroundColor: dark ? '#0f1f25' : '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        height: '75%',
      }}
    >
      <View style={styles.dragHandleWrap} {...(dragHandleResponder?.panHandlers ?? {})}>
        <View
          style={[
            styles.dragHandle,
            { backgroundColor: dark ? 'rgba(255,255,255,0.25)' : 'rgba(3,47,60,0.2)' },
          ]}
        />
      </View>

      <View style={styles.header}>
        <StyledText style={[styles.headerTitle, { color: dark ? Colors.main.white : '#032f3c' }]}>
          Reactions
        </StyledText>
        <Pressable
          onPress={onClose}
          style={[
            styles.closeButton,
            { backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(3,47,60,0.08)' },
          ]}
        >
          <Icon name="close" size={20} color={dark ? Colors.main.white : '#126b87'} />
        </Pressable>
      </View>

      <View
        style={[styles.tabContainer, { borderBottomColor: dark ? Colors.neutral[800] : '#e6eaec' }]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {TAB_CONFIG.map((tab) => {
            const isActive = tab.id === activeTab;
            const tabCount = Number(totals[tab.id] ?? 0);

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabItem,
                  {
                    borderBottomColor: isActive ? '#126b87' : 'transparent',
                  },
                ]}
              >
                {tab.emoji ? <StyledText style={styles.tabEmoji}>{tab.emoji}</StyledText> : null}
                <StyledText
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? '#126b87' : dark ? Colors.neutral[300] : '#4f8596',
                    },
                  ]}
                >
                  {tab.label}
                </StyledText>
                <View style={[styles.tabCountBadge, { backgroundColor: 'rgba(18,107,135,0.12)' }]}>
                  <StyledText style={styles.tabCountText}>{tabCount}</StyledText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#126b87" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.userId}-${item.reactionType}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.8}
          onEndReached={() => {
            if (!isLoadingMore && hasMore) {
              fetchReactionDetails(false);
            }
          }}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: spacing.x13 }}>
                <ActivityIndicator size="small" color="#126b87" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <StyledText style={{ color: dark ? Colors.neutral[300] : '#4f8596' }}>
                No reactions yet.
              </StyledText>
            </View>
          }
        />
      )}
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: spacing.x10,
    paddingBottom: spacing.x8,
  },
  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: borderRadius.max,
  },
  header: {
    paddingHorizontal: spacing.x24,
    paddingBottom: spacing.x8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...fontSize.x6,
    ...lineHeight.x6,
    fontWeight: '700',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.max,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    borderBottomWidth: borderWidth.hairline,
  },
  tabScrollContent: {
    paddingHorizontal: spacing.x13,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.x10,
    paddingHorizontal: spacing.x8,
    borderBottomWidth: 2,
  },
  tabEmoji: {
    marginRight: spacing.x5,
  },
  tabLabel: {
    ...fontSize.x3,
    fontWeight: '600',
  },
  tabCountBadge: {
    marginLeft: spacing.x5,
    borderRadius: borderRadius.max,
    paddingHorizontal: spacing.x5,
    paddingVertical: 1,
  },
  tabCountText: {
    fontSize: 10,
    color: '#126b87',
    fontWeight: '700',
  },
  loadingWrap: {
    paddingVertical: spacing.x24,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.x16,
    paddingBottom: spacing.x32,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.x24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: borderWidth.hairline,
    paddingVertical: spacing.x13,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.x10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.x13,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  reactionBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.hairline,
  },
  reactionBadgeText: {
    fontSize: 12,
  },
  userName: {
    ...fontSize.x4,
    fontWeight: '700',
  },
  userHandle: {
    ...fontSize.x3,
    marginTop: 1,
  },
  connectButton: {
    minWidth: 92,
    borderRadius: borderRadius.max,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x13,
    paddingVertical: spacing.x8,
  },
  connectActiveButton: {
    backgroundColor: '#126b87',
  },
  connectedButton: {
    borderWidth: borderWidth.thin,
    borderColor: Colors.neutral[700],
    backgroundColor: 'transparent',
  },
  connectButtonText: {
    ...fontSize.x2,
    fontWeight: '700',
  },
});

export default PostReactionsModal;
