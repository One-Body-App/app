import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useTheme } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { NotificationBing } from 'iconsax-react-native';

import StyledText from '@/components/styled/Text';
import { ApiCall } from '@/services/api';
import { HomeStackParamsList } from '@/src/navigator/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import {
  QueuedPushNotification,
  getQueuedNotifications,
  markQueuedNotificationAsRead,
  removeQueuedNotification,
} from '@/src/services/notification/pushNotificationStorage';

type Props = StackScreenProps<HomeStackParamsList, 'Notifications'>;

type CategoryKey = 'all' | 'tagged' | 'feed' | 'prayers' | 'blog_posts' | 'serve' | 'go';

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
  campaignId?: string;
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
  all: 88,
  tagged: 126,
  feed: 96,
  prayers: 112,
  blog_posts: 132,
  serve: 94,
  go: 82,
};

const CATEGORY_LABELS: Record<CategoryKey, string> = CATEGORY_OPTIONS.reduce(
  (accumulator, item) => {
    accumulator[item.key] = item.label;
    return accumulator;
  },
  {} as Record<CategoryKey, string>
);

const MATCHERS: Record<Exclude<CategoryKey, 'all'>, RegExp> = {
  tagged: /\btag|mention|@/i,
  feed: /\bfeed|post|comment|like|reaction|share|campaign|activity/i,
  prayers: /\bprayer|pray|bless|intercession/i,
  blog_posts: /\bblog|rss|article|read|story/i,
  serve: /\bserve|service|volunteer|ministry/i,
  go: /\bgo\b|mission|missions|outreach/i,
};

const toServerNotification = (item: any): InboxNotification | null => {
  const sourceId = String(item?._id || '');
  if (!sourceId) return null;

  return {
    id: `server:${sourceId}`,
    source: 'server',
    sourceId,
    title: String(item?.title || 'Notification'),
    body: String(item?.description || ''),
    createdAt: String(item?.createdAt || new Date().toISOString()),
    read: Boolean(item?.read),
    url: typeof item?.url === 'string' ? item.url : undefined,
    campaignId: typeof item?.campaignId === 'string' ? item.campaignId : undefined,
  };
};

const isInboxNotification = (value: InboxNotification | null): value is InboxNotification =>
  value !== null;

const toPushNotification = (item: QueuedPushNotification): InboxNotification => ({
  id: `push:${item.id}`,
  source: 'push',
  sourceId: item.id,
  title: item.title || 'Notification',
  body: item.body || '',
  createdAt: item.createdAt || new Date().toISOString(),
  read: Boolean(item.read),
  url: item.url,
  campaignId: item.campaignId,
});

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

const getNotificationCategories = (item: InboxNotification): CategoryKey[] => {
  const text = `${item.title} ${item.body}`.toLowerCase();
  const categories: CategoryKey[] = [];

  (Object.keys(MATCHERS) as Array<Exclude<CategoryKey, 'all'>>).forEach((key) => {
    if (MATCHERS[key].test(text)) {
      categories.push(key);
    }
  });

  if (!categories.length) {
    categories.push('feed');
  }

  return Array.from(new Set(categories));
};

const getPrimaryCategory = (item: InboxNotification): Exclude<CategoryKey, 'all'> => {
  const categories = getNotificationCategories(item).filter(
    (entry): entry is Exclude<CategoryKey, 'all'> => entry !== 'all'
  );
  return categories[0] || 'feed';
};

function NotificationScreen({ navigation }: Props) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors, dark } = useTheme();
  const styles = useMemo(() => createStyles(dark, colors), [colors, dark]);

  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [menuNotification, setMenuNotification] = useState<InboxNotification | null>(null);
  const [mutedCategories, setMutedCategories] = useState<Array<Exclude<CategoryKey, 'all'>>>([]);
  const [listInstanceKey, setListInstanceKey] = useState(0);

  const loadNotifications = useCallback(
    async (showLoader = false) => {
      if (!token) {
        setNotifications([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      try {
        const [serverResponse, queuedPush] = await Promise.all([
          ApiCall<{ data?: any[] }>({
            route: 'user/notifications',
            verb: 'get',
            token,
          }),
          getQueuedNotifications(),
        ]);

        const serverNotifications = Array.isArray(serverResponse?.response?.data)
          ? serverResponse.response.data.map(toServerNotification).filter(isInboxNotification)
          : [];

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
            new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
        );

        setNotifications(merged);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  useEffect(() => {
    if (navigation.isFocused()) {
      setListInstanceKey((current) => current + 1);
    }

    const unsubscribe = navigation.addListener('focus', () => {
      setListInstanceKey((current) => current + 1);
    });

    return unsubscribe;
  }, [navigation]);

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

      if (!item.url) {
        return;
      }

      try {
        await Linking.openURL(item.url);
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
      const primary = getPrimaryCategory(item);
      return !mutedCategories.includes(primary);
    });

    if (activeCategory === 'all') {
      return withoutMuted;
    }

    return withoutMuted.filter((item) => getNotificationCategories(item).includes(activeCategory));
  }, [activeCategory, mutedCategories, notifications]);

  const menuCategory = menuNotification ? getPrimaryCategory(menuNotification) : 'feed';

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
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBackButton}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={30}
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
            const parent = navigation.getParent();
            if (parent) {
              (parent as any).navigate('Settings', { screen: 'NotificationSettings' });
              return;
            }
            navigation.goBack();
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
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

      <FlatList
        key={`notifications-${listInstanceKey}-${activeCategory}`}
        data={visibleNotifications}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.text}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications(false);
            }}
          />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openNotification(item)}>
            <View style={styles.avatarWrap}>
              <MaterialCommunityIcons
                name="account"
                size={16}
                color={dark ? Colors.neutral[500] : Colors.neutral[400]}
              />
            </View>

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
        )}
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
                  const category = getPrimaryCategory(menuNotification);
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
      paddingTop: spacing.x8,
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
      position: 'absolute',
      left: 0,
      right: 0,
      textAlign: 'center',
      zIndex: -1,
    },
    headerActionButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipsContainer: {
      paddingHorizontal: spacing.x16,
      paddingBottom: spacing.x8,
      gap: spacing.x8,
    },
    chip: {
      paddingHorizontal: spacing.x16,
      height: 38,
      borderRadius: 19,
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
      paddingTop: 0,
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
      color: dark ? Colors.neutral[300] : '#7E8288',
      flex: 1,
      paddingRight: spacing.x5,
    },
    cardTitleUnread: {
      color: colors.text,
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
      backgroundColor: '#3B82F6',
      marginRight: spacing.x5,
    },
    cardTime: {
      ...Typography.body.x1,
      color: dark ? Colors.neutral[400] : '#9A9DA3',
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
      color: dark ? Colors.neutral[400] : '#8A8E95',
    },
    cardBodyUnread: {
      ...Typography.body.x2M,
      color: colors.text,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
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
