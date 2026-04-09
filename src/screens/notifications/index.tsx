import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import { NotificationBing } from 'iconsax-react-native';

import { useTabBarAnimation } from '@/navigator/TabBarAnimationContext';
import StyledText from '@/components/styled/Text';
import { ApiCall } from '@/services/api';
import Logo from '@/assets/icons/logo.svg';
import LogoWhite from '@/assets/icons/logo_white.svg';
import { HomeStackParamsList } from '@/src/navigator/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import useMountEffect from '@/src/hooks/useMountEffect';
import {
  QueuedPushNotification,
  getQueuedNotifications,
  markQueuedNotificationAsRead,
  removeQueuedNotification,
} from '@/src/services/notification/pushNotificationStorage';
import { preloadIosNotificationFeed } from '@/src/services/notification/iosNotificationPreflight';
import { formatRelativeTime, nowUtcIso, parseIsoOrNull } from '@/src/utils/time';
import {
  isOneBodyDeepLinkCandidate,
  normalizeNotificationTapUrl,
  resolveNotificationTargetUrl,
} from './notificationLinking';
import {
  getNotificationCategories,
  getPrimaryNotificationCategory,
  type NotificationCategoryKey,
} from './notificationCategories';
import { cleanupNotificationsDismissal, closeNotifications } from './dismissNotifications';

type Props = StackScreenProps<HomeStackParamsList, 'Notifications'>;

type CategoryKey = NotificationCategoryKey;

type CategoryOption = {
  key: CategoryKey;
  label: string;
};

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type InboxNotification = {
  id: string;
  source: 'server' | 'push';
  sourceId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  url?: string;
  iconUrl?: string;
  campaignId?: string;
  notificationType?: string;
  notificationSource?: string;
  actorId?: string;
  data?: Record<string, unknown>;
};

type SortMode = 'newest' | 'oldest';

type NotificationListRow =
  | {
      kind: 'header';
      id: string;
      title: string;
    }
  | {
      kind: 'item';
      id: string;
      item: InboxNotification;
    };

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'all', label: 'All' },
  { key: 'tagged', label: 'Tagged' },
  { key: 'feed', label: 'Feed' },
  { key: 'prayers', label: 'Prayers' },
  { key: 'blog_posts', label: 'Blog posts' },
  { key: 'serve', label: 'Serve' },
  { key: 'go', label: 'Go' },
];

const CHIP_ICONS: Partial<Record<CategoryKey, MaterialIconName>> = {
  tagged: 'at',
};

const CHIP_MIN_WIDTHS: Record<CategoryKey, number> = {
  all: 59,
  tagged: 84,
  feed: 64,
  prayers: 75,
  blog_posts: 88,
  serve: 63,
  go: 55,
};

const CATEGORY_LABELS: Record<CategoryKey, string> = CATEGORY_OPTIONS.reduce(
  (accumulator, item) => {
    accumulator[item.key] = item.label;
    return accumulator;
  },
  {} as Record<CategoryKey, string>
);

const ACTIVITY_SIGNAL_REGEX = /\bcomment|reaction|reacted|message|messaged|reply|replied|like\b/i;

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeNotificationIconUrl = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
};

const toServerNotification = (item: any): InboxNotification | null => {
  const sourceId = String(item?._id || '');
  if (!sourceId) return null;
  const data =
    item?.data && typeof item.data === 'object' ? (item.data as Record<string, unknown>) : {};

  return {
    id: `server:${sourceId}`,
    source: 'server',
    sourceId,
    title: String(item?.title || 'Notification'),
    body: String(item?.description || ''),
    createdAt: String(item?.createdAt || nowUtcIso()),
    read: Boolean(item?.read),
    url:
      normalizeOptionalString(item?.url) ||
      normalizeOptionalString(data?.url) ||
      normalizeOptionalString(data?.deepLink) ||
      normalizeOptionalString(data?.link),
    iconUrl: normalizeNotificationIconUrl(
      item?.iconUrl || item?.notificationIconUrl || item?.icon || item?.imageUrl || item?.image
    ),
    campaignId: typeof item?.campaignId === 'string' ? item.campaignId : undefined,
    notificationType: normalizeOptionalString(item?.type) || normalizeOptionalString(data?.type),
    notificationSource:
      normalizeOptionalString(item?.source) || normalizeOptionalString(data?.source),
    actorId: normalizeOptionalString(data?.actorId),
    data,
  };
};

const isInboxNotification = (value: InboxNotification | null): value is InboxNotification =>
  value !== null;

const toPushNotification = (item: QueuedPushNotification): InboxNotification => {
  const data = (item.data || {}) as Record<string, unknown>;

  return {
    id: `push:${item.id}`,
    source: 'push',
    sourceId: item.id,
    title: item.title || 'Notification',
    body: item.body || '',
    createdAt: item.createdAt || nowUtcIso(),
    read: Boolean(item.read),
    url: item.url,
    iconUrl: normalizeNotificationIconUrl(
      item.iconUrl || item.data?.iconUrl || item.data?.imageUrl
    ),
    campaignId: item.campaignId,
    notificationType:
      normalizeOptionalString(item.type) ||
      normalizeOptionalString(item.data?.type) ||
      normalizeOptionalString(item.data?.notificationType),
    notificationSource: normalizeOptionalString(item.data?.source),
    actorId: normalizeOptionalString(item.data?.actorId),
    data,
  };
};

const getCreatedAtTimestamp = (value: string) => {
  const timestamp = parseIsoOrNull(value)?.getTime() ?? 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortNotifications = (items: InboxNotification[], sortMode: SortMode) =>
  [...items].sort((first, second) => {
    const firstTime = getCreatedAtTimestamp(first.createdAt);
    const secondTime = getCreatedAtTimestamp(second.createdAt);
    return sortMode === 'newest' ? secondTime - firstTime : firstTime - secondTime;
  });

const containsActivitySignal = (value?: string) =>
  typeof value === 'string' && ACTIVITY_SIGNAL_REGEX.test(value.toLowerCase());

const isActivityNotification = (item: InboxNotification) => {
  const text = `${item.title} ${item.body}`;
  return (
    containsActivitySignal(item.notificationType) ||
    containsActivitySignal(item.notificationSource) ||
    containsActivitySignal(text)
  );
};

const isCreatorNotification = (
  item: InboxNotification,
  approvedCreatorFollowingSet: Set<string>
) => {
  if (!isActivityNotification(item)) {
    return false;
  }

  const actorId = normalizeOptionalString(item.actorId);
  if (!actorId) {
    return false;
  }

  return approvedCreatorFollowingSet.has(actorId);
};

function NotificationScreen({ navigation }: Props) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const toast = useToast();
  const { colors, dark } = useTheme();
  const tabBarAnimation = useTabBarAnimation();
  const styles = createStyles(dark, colors);

  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [menuNotification, setMenuNotification] = useState<InboxNotification | null>(null);
  const [mutedCategories, setMutedCategories] = useState<Array<Exclude<CategoryKey, 'all'>>>([]);
  const [listInstanceKey, setListInstanceKey] = useState(0);
  const [failedRemoteIcons, setFailedRemoteIcons] = useState<Record<string, true>>({});
  const [approvedCreatorFollowingIds, setApprovedCreatorFollowingIds] = useState<string[]>([]);
  const hasCompletedInitialLoadRef = useRef(false);

  const logNotificationDebug = useCallback((event: string, details: Record<string, unknown>) => {
    if (!__DEV__) {
      return;
    }

    console.log(`[NotificationsDebug] ${event}`, details);
  }, []);

  const loadNotifications = useCallback(
    async ({ showLoader = false }: { showLoader?: boolean } = {}) => {
      if (!token) {
        logNotificationDebug('load_skipped_missing_token', {});
        setNotifications([]);
        setLoading(false);
        setRefreshing(false);
        hasCompletedInitialLoadRef.current = false;
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      try {
        const serverNotificationsPromise = ApiCall<{ data?: any[] }>({
          route: 'user/notifications',
          verb: 'get',
          token,
        });
        const followingPromise = ApiCall<{ data?: any[] }>({
          route: 'user/get-following',
          verb: 'get',
          token,
        });
        const iosPreflightPromise =
          Platform.OS === 'ios' ? preloadIosNotificationFeed() : Promise.resolve(null);

        const [serverResult, followingResult, iosPreflightResult] = await Promise.allSettled([
          serverNotificationsPromise,
          followingPromise,
          iosPreflightPromise,
        ]);

        if (iosPreflightResult.status === 'fulfilled' && iosPreflightResult.value) {
          logNotificationDebug('ios_preflight_complete', iosPreflightResult.value);
        } else if (Platform.OS === 'ios') {
          logNotificationDebug('ios_preflight_complete', {
            initialQueued: false,
            syncedCount: 0,
            didTimeout: false,
          });
        }

        const queuedPush = await getQueuedNotifications().catch(() => []);

        logNotificationDebug('queue_loaded', {
          queuedCount: queuedPush.length,
          queuedStatus: 'fulfilled',
        });

        let serverNotifications: InboxNotification[] = [];
        let didServerFetchFail = false;

        if (serverResult.status === 'fulfilled') {
          const serverResponse = serverResult.value;
          logNotificationDebug('server_fetch_result', {
            status: serverResponse?.status,
            hasDataArray: Array.isArray(serverResponse?.response?.data),
          });
          if (serverResponse?.status === 200 && Array.isArray(serverResponse?.response?.data)) {
            serverNotifications = serverResponse.response.data
              .map(toServerNotification)
              .filter(isInboxNotification);
          } else if (serverResponse?.status !== 200) {
            didServerFetchFail = true;
          }
        } else {
          didServerFetchFail = true;
          logNotificationDebug('server_fetch_rejected', {
            reason:
              serverResult.reason instanceof Error
                ? serverResult.reason.message
                : String(serverResult.reason || ''),
          });
        }

        if (didServerFetchFail) {
          toast.show('Unable to load server notifications right now.', {
            type: 'danger',
            placement: 'top',
          });
        }

        const serverCampaignIds = new Set(
          serverNotifications
            .map((item) => item.campaignId)
            .filter((item): item is string => Boolean(item))
        );

        const pushNotifications = queuedPush
          .map(toPushNotification)
          .filter((item) => !item.campaignId || !serverCampaignIds.has(item.campaignId));

        const merged = [...serverNotifications, ...pushNotifications].sort(
          (first, second) =>
            (parseIsoOrNull(second.createdAt)?.getTime() || 0) -
            (parseIsoOrNull(first.createdAt)?.getTime() || 0)
        );
        logNotificationDebug('merge_complete', {
          serverCount: serverNotifications.length,
          pushCount: pushNotifications.length,
          mergedCount: merged.length,
        });

        const nextApprovedCreatorIds =
          followingResult.status === 'fulfilled' &&
          followingResult.value?.status === 200 &&
          Array.isArray(followingResult.value?.response?.data)
            ? followingResult.value.response.data.reduce<string[]>((accumulator, entry: any) => {
                const id = String(entry?._id || entry?.id || '').trim();
                if (!id) {
                  return accumulator;
                }

                const influencerStatus = String(
                  entry?.influencerProfile?.influencerStatus ||
                    entry?.influencerStatus ||
                    entry?.status ||
                    ''
                ).toLowerCase();
                const isApprovedCreator =
                  influencerStatus === 'approved' ||
                  entry?.isApprovedInfluencer === true ||
                  entry?.userData?.isApprovedInfluencer === true;

                if (isApprovedCreator) {
                  accumulator.push(id);
                }

                return accumulator;
              }, [])
            : [];

        setApprovedCreatorFollowingIds(Array.from(new Set(nextApprovedCreatorIds)));
        setNotifications(merged);
        setFailedRemoteIcons((current) => {
          const validIds = new Set(merged.map((item) => item.id));
          return Object.keys(current).reduce<Record<string, true>>((accumulator, key) => {
            if (validIds.has(key)) {
              accumulator[key] = true;
            }
            return accumulator;
          }, {});
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
        hasCompletedInitialLoadRef.current = true;
      }
    },
    [logNotificationDebug, token, toast]
  );

  useMountEffect(() => {
    loadNotifications({ showLoader: true });
  });

  useFocusEffect(
    useCallback(() => {
      setListInstanceKey((current) => current + 1);

      if (!hasCompletedInitialLoadRef.current) {
        return undefined;
      }

      loadNotifications();
      return undefined;
    }, [loadNotifications])
  );

  const runDismissalCleanup = useCallback(() => {
    cleanupNotificationsDismissal({ navigation, tabBarAnimation });
  }, [navigation, tabBarAnimation]);

  const handleCloseNotifications = useCallback(() => {
    closeNotifications({ navigation, tabBarAnimation });
  }, [navigation, tabBarAnimation]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        runDismissalCleanup();
      };
    }, [runDismissalCleanup])
  );

  const markAsRead = useCallback(
    async (item: InboxNotification) => {
      if (item.read) return;

      setNotifications((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry))
      );

      if (item.source === 'server') {
        await ApiCall({
          route: `user/notifications/${item.sourceId}/read`,
          verb: 'patch',
          token,
          params: {},
        });
      } else {
        await markQueuedNotificationAsRead(item.sourceId);
      }
    },
    [token]
  );

  const openNotification = useCallback(
    async (item: InboxNotification) => {
      await markAsRead(item);

      const targetUrl = resolveNotificationTargetUrl(item);
      if (!targetUrl) {
        return;
      }

      const normalizedUrl = normalizeNotificationTapUrl(targetUrl);
      const shouldTryInApp = isOneBodyDeepLinkCandidate(targetUrl) || normalizedUrl !== targetUrl;

      if (shouldTryInApp) {
        try {
          await Linking.openURL(normalizedUrl);
          return;
        } catch (_inAppError) {
          // Fall back to external open for malformed/unhandled links.
        }
      }

      try {
        await Linking.openURL(targetUrl);
      } catch (_error) {
        Alert.alert('Unable to open link', 'This notification link is invalid.');
      }
    },
    [markAsRead]
  );

  const removeNotification = useCallback(
    async (item: InboxNotification) => {
      setNotifications((current) => current.filter((entry) => entry.id !== item.id));

      if (item.source === 'server') {
        await ApiCall({
          route: `user/notifications/${item.sourceId}`,
          verb: 'delete',
          token,
        });
      } else {
        await removeQueuedNotification(item.sourceId);
      }
    },
    [token]
  );

  const visibleNotifications = useMemo(() => {
    const withoutMuted = notifications.filter((item) => {
      const primary = getPrimaryNotificationCategory(item);
      return !mutedCategories.includes(primary);
    });

    if (activeCategory === 'all') {
      return withoutMuted;
    }

    return withoutMuted.filter((item) => getNotificationCategories(item).includes(activeCategory));
  }, [activeCategory, mutedCategories, notifications]);

  const approvedCreatorFollowingSet = useMemo(
    () =>
      new Set(
        approvedCreatorFollowingIds
          .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
          .filter((entry) => entry.length > 0)
      ),
    [approvedCreatorFollowingIds]
  );

  const sortedNotifications = useMemo(
    () => sortNotifications(visibleNotifications, sortMode),
    [sortMode, visibleNotifications]
  );

  const { creatorNotifications, regularNotifications } = useMemo(() => {
    const creators: InboxNotification[] = [];
    const regular: InboxNotification[] = [];

    sortedNotifications.forEach((item) => {
      if (isCreatorNotification(item, approvedCreatorFollowingSet)) {
        creators.push(item);
      } else {
        regular.push(item);
      }
    });

    return { creatorNotifications: creators, regularNotifications: regular };
  }, [approvedCreatorFollowingSet, sortedNotifications]);

  const listRows = useMemo<NotificationListRow[]>(() => {
    if (!creatorNotifications.length) {
      return regularNotifications.map((item) => ({
        kind: 'item',
        id: `item-${item.id}`,
        item,
      }));
    }

    const nextRows: NotificationListRow[] = [
      { kind: 'header', id: 'header-creators', title: 'Creators' },
      ...creatorNotifications.map((item) => ({
        kind: 'item' as const,
        id: `item-${item.id}`,
        item,
      })),
    ];

    if (regularNotifications.length) {
      nextRows.push({ kind: 'header', id: 'header-all-notifications', title: 'All Notifications' });
      nextRows.push(
        ...regularNotifications.map((item) => ({
          kind: 'item' as const,
          id: `item-${item.id}`,
          item,
        }))
      );
    }

    return nextRows;
  }, [creatorNotifications, regularNotifications]);

  const menuCategory = menuNotification ? getPrimaryNotificationCategory(menuNotification) : 'feed';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleCloseNotifications} style={styles.headerBackButton}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={Platform.OS === 'ios' ? 40 : 30}
              color={dark ? Colors.neutral[200] : Colors.neutral[300]}
            />
          </Pressable>
          {Platform.OS === 'android' ? (
            <StyledText style={styles.headerTitle}>Notifications</StyledText>
          ) : null}
        </View>

        {Platform.OS === 'ios' ? (
          <StyledText style={styles.headerTitleIOS}>Notifications</StyledText>
        ) : null}

        <Pressable
          onPress={() => {
            (navigation as any).navigate('NotificationSettings');
          }}
          style={styles.headerActionButton}
        >
          <MaterialCommunityIcons
            name="bell-cog-outline"
            size={28}
            color={dark ? Colors.neutral[200] : Colors.neutral[300]}
          />
        </Pressable>
      </View>

      <View style={styles.filtersRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          style={styles.chipsScroll}
        >
          {CATEGORY_OPTIONS.map((category) => {
            const active = activeCategory === category.key;
            const iconName = CHIP_ICONS[category.key];
            let chipIconColor = dark ? Colors.neutral[300] : Colors.neutral[300];
            if (active) {
              chipIconColor = dark ? Colors.neutral.brand : Colors.main.white;
            }
            return (
              <Pressable
                key={category.key}
                onPress={() => setActiveCategory(category.key)}
                style={[
                  styles.chip,
                  { minWidth: CHIP_MIN_WIDTHS[category.key] },
                  active && styles.activeChip,
                ]}
              >
                <View style={styles.chipInner}>
                  {iconName ? (
                    <MaterialCommunityIcons
                      name={iconName}
                      size={17}
                      color={chipIconColor}
                      style={styles.chipIcon}
                    />
                  ) : null}
                  <StyledText style={[styles.chipLabel, active && styles.activeChipLabel]}>
                    {category.label}
                  </StyledText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={() => setSortMode((current) => (current === 'newest' ? 'oldest' : 'newest'))}
          style={styles.sortToggle}
        >
          <StyledText style={styles.sortToggleText}>
            {sortMode === 'newest' ? 'Most recent' : 'Oldest first'}
          </StyledText>
          <MaterialCommunityIcons
            name={sortMode === 'newest' ? 'chevron-down' : 'chevron-up'}
            size={18}
            color={dark ? Colors.neutral[200] : Colors.neutral[300]}
            style={styles.sortToggleIcon}
          />
        </Pressable>
      </View>

      <FlatList
        style={styles.list}
        key={`notifications-${listInstanceKey}-${activeCategory}-${sortMode}`}
        data={listRows}
        keyExtractor={(row) => row.id}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={listRows.length > 0 ? styles.listContent : styles.listContentEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.text}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications();
            }}
          />
        }
        renderItem={({ item: row }) => {
          if (row.kind === 'header') {
            return (
              <View style={styles.sectionHeaderWrap}>
                <StyledText style={styles.sectionHeaderText}>{row.title}</StyledText>
              </View>
            );
          }

          const { item } = row;
          const hasRemoteIcon = Boolean(item.iconUrl) && !failedRemoteIcons[item.id];
          let avatarContent: React.ReactNode;

          if (hasRemoteIcon) {
            avatarContent = (
              <Image
                source={{ uri: item.iconUrl as string }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => {
                  setFailedRemoteIcons((current) => ({ ...current, [item.id]: true }));
                }}
              />
            );
          } else if (dark) {
            avatarContent = <LogoWhite width={20} height={18} />;
          } else {
            avatarContent = <Logo width={20} height={18} />;
          }

          return (
            <Pressable style={styles.card} onPress={() => openNotification(item)}>
              <View style={styles.avatarWrap}>{avatarContent}</View>

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <StyledText style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
                    {item.title}
                  </StyledText>
                  <View style={styles.cardHeaderRight}>
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                    <StyledText style={styles.cardTime}>
                      {formatRelativeTime(item.createdAt)}
                    </StyledText>
                    <Pressable
                      hitSlop={10}
                      onPress={(event) => {
                        event.stopPropagation();
                        setMenuNotification(item);
                      }}
                      style={styles.menuButton}
                    >
                      <MaterialCommunityIcons
                        name="dots-vertical"
                        size={18}
                        color={dark ? Colors.neutral[300] : Colors.neutral[400]}
                      />
                    </Pressable>
                  </View>
                </View>

                <StyledText
                  numberOfLines={2}
                  style={[styles.cardBody, !item.read && styles.cardBodyUnread]}
                >
                  {item.body || item.title}
                </StyledText>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <NotificationBing
                size={74}
                color={dark ? Colors.neutral[500] : Colors.neutral[300]}
              />
            </View>
            <StyledText style={styles.emptyTitle}>No notifications yet</StyledText>
            <StyledText style={styles.emptyBody}>
              Notifications will appear here when there is activity.
            </StyledText>
          </View>
        }
      />

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(menuNotification)}
        onRequestClose={() => setMenuNotification(null)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuNotification(null)}>
          <Pressable style={styles.menuSheet} onPress={() => undefined}>
            <StyledText style={styles.menuTitle}>
              {menuNotification?.title || 'Notification'}
            </StyledText>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                if (menuNotification) {
                  const category = getPrimaryNotificationCategory(menuNotification);
                  setMutedCategories((current) =>
                    current.includes(category) ? current : [...current, category]
                  );
                }
                setMenuNotification(null);
              }}
            >
              <StyledText style={styles.menuItemText}>
                Mute {CATEGORY_LABELS[menuCategory]}
              </StyledText>
              <MaterialCommunityIcons
                name="bell-off-outline"
                size={22}
                color={dark ? Colors.neutral[200] : Colors.neutral[300]}
              />
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={async () => {
                if (menuNotification) {
                  await markAsRead(menuNotification);
                }
                setMenuNotification(null);
              }}
            >
              <StyledText style={styles.menuItemText}>Mark as Read</StyledText>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={24}
                color={dark ? Colors.neutral[200] : Colors.neutral[300]}
              />
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={async () => {
                if (menuNotification) {
                  await removeNotification(menuNotification);
                }
                setMenuNotification(null);
              }}
            >
              <StyledText style={styles.menuItemText}>Delete Notification</StyledText>
              <MaterialCommunityIcons
                name="delete-outline"
                size={22}
                color={dark ? Colors.neutral[200] : Colors.neutral[300]}
              />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (dark: boolean, colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? colors.background : '#F3F3F5',
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: dark ? colors.background : '#F3F3F5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? spacing.x64 : spacing.x13,
      paddingHorizontal: spacing.x16,
      paddingBottom: spacing.x5,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerBackButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Platform.OS === 'android' ? spacing.x5 : 0,
    },
    headerTitle: {
      ...Typography.body.x5M,
      color: colors.text,
    },
    headerTitleIOS: {
      ...Typography.body.x5M,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    headerActionButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipsContainer: {
      paddingHorizontal: spacing.x16,
      paddingTop: spacing.x10,
      paddingBottom: spacing.x8,
      gap: spacing.x8,
    },
    filtersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: spacing.x16,
    },
    chipsScroll: {
      flex: 1,
    },
    sortToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      height: 28,
      paddingHorizontal: spacing.x8,
      marginLeft: spacing.x8,
      backgroundColor: dark ? Colors.neutral[800] : '#EDEEF1',
      borderWidth: 1,
      borderColor: dark ? Colors.neutral[700] : '#E0E2E7',
    },
    sortToggleText: {
      ...Typography.body.x1,
      color: dark ? Colors.neutral[200] : '#5F636B',
      marginRight: 2,
    },
    sortToggleIcon: {
      marginTop: 1,
    },
    list: {
      flex: 1,
    },
    chip: {
      paddingHorizontal: 11,
      height: 25,
      borderRadius: 12.5,
      backgroundColor: dark ? Colors.neutral[800] : '#EDEEF1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipInner: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chipIcon: {
      marginRight: spacing.x5,
      marginTop: 1,
    },
    activeChip: {
      backgroundColor: '#126B87',
    },
    chipLabel: {
      ...Typography.body.x2M,
      color: dark ? Colors.neutral[300] : '#585A5E',
    },
    activeChipLabel: {
      color: dark ? Colors.neutral.brand : Colors.main.white,
    },
    listContent: {
      paddingHorizontal: spacing.x16,
      paddingBottom: spacing.x48,
      paddingTop: spacing.x8,
    },
    listContentEmpty: {
      flexGrow: 1,
      paddingHorizontal: spacing.x16,
      paddingBottom: spacing.x48,
      paddingTop: spacing.x8,
    },
    sectionHeaderWrap: {
      paddingTop: spacing.x8,
      paddingBottom: spacing.x5,
    },
    sectionHeaderText: {
      ...Typography.body.x2M,
      color: dark ? Colors.neutral[300] : '#6D727A',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 20,
      padding: spacing.x13,
      backgroundColor: dark ? '#17191C' : '#FAFAFB',
      borderWidth: 1,
      borderColor: dark ? Colors.neutral[700] : '#EEF0F3',
      marginBottom: spacing.x10,
      shadowColor: '#000',
      shadowOpacity: dark ? 0.08 : 0.03,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    avatarWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: dark ? Colors.neutral[700] : '#E6E8EF',
      marginRight: spacing.x10,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    cardContent: {
      flex: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.x5,
    },
    cardTitle: {
      ...Typography.body.x2M,
      color: dark ? '#F6F6F7' : '#7E8288',
      flex: 1,
      paddingRight: spacing.x5,
    },
    cardTitleUnread: {
      color: dark ? '#F6F6F7' : colors.text,
    },
    cardHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: spacing.x8,
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#12D2D9',
      marginRight: spacing.x5,
    },
    cardTime: {
      ...Typography.body.x1,
      color: dark ? '#F6F6F7' : '#9A9DA3',
    },
    menuButton: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.x5,
    },
    cardBody: {
      ...Typography.body.x2,
      color: dark ? '#F6F6F7' : '#8A8E95',
    },
    cardBodyUnread: {
      ...Typography.body.x2M,
      color: dark ? '#F6F6F7' : colors.text,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flexGrow: 1,
      paddingBottom: spacing.x72,
      paddingHorizontal: spacing.x32,
    },
    emptyIconWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: dark ? Colors.neutral[700] : Colors.neutral[900],
      marginBottom: spacing.x20,
    },
    emptyTitle: {
      ...Typography.body.x4M,
      color: colors.text,
      marginBottom: spacing.x8,
    },
    emptyBody: {
      ...Typography.body.x2,
      color: dark ? Colors.neutral[300] : Colors.neutral[400],
      textAlign: 'center',
    },
    menuOverlay: {
      flex: 1,
      backgroundColor: dark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.22)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.x24,
    },
    menuSheet: {
      width: '100%',
      borderRadius: 18,
      backgroundColor: dark ? '#101418' : '#FFFFFF',
      borderWidth: 1,
      borderColor: dark ? Colors.neutral[700] : '#ECEEF1',
      overflow: 'hidden',
    },
    menuTitle: {
      ...Typography.body.x6M,
      color: colors.text,
      paddingHorizontal: spacing.x20,
      paddingVertical: spacing.x16,
    },
    menuItem: {
      borderTopWidth: 1,
      borderTopColor: dark ? Colors.neutral[700] : '#ECEEF1',
      paddingHorizontal: spacing.x20,
      paddingVertical: spacing.x16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    menuItemText: {
      ...Typography.body.x5,
      color: colors.text,
      flex: 1,
      marginRight: spacing.x16,
    },
  });

export default NotificationScreen;
