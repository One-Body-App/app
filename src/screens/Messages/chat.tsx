import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import ChatIcon from '@/assets/icons/chat.svg';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MessagesStackParamsList } from '@/src/navigator/types';
import { getActiveDirectConversationPeerId } from '@/src/services/chat/activeConversation';
import { ConversationListItem } from '@/src/services/chat/types';
import { connectChatSocket, onChatMessage } from '@/src/services/chat/socketClient';
import { ensureChatReady } from '@/src/services/chat/chatClient';
import {
  deleteChatGroup,
  fetchChatConversations,
  hideChatConversation,
  leaveChatGroup,
  updateChatConversationMuteState,
  updateChatConversationReadState,
} from '@/src/services/chat/api';
import { NO_PROFILE_IMAGE } from '@/src/services/constants';
import { SwipeableChatItem } from '@/src/components/chat/SwipeableChatItem';
import ChatEmptyState from './chatempty';

type Props = NativeStackScreenProps<MessagesStackParamsList, 'MessagesList'>;
type ChatSectionFilter = 'active' | 'groups' | 'archived';

const formatTimeLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const getConversationTitle = (item: ConversationListItem) =>
  item.conversationType === 'group'
    ? item.groupName || item.peerName || 'Group chat'
    : item.peerName;

const getConversationPreview = (item: ConversationListItem) => {
  if (item.conversationType === 'group') {
    return item.lastMessagePreview;
  }

  if (item.peerUsername) {
    return `@${item.peerUsername}`;
  }

  return '';
};

const getDestructiveActionConfig = (item: ConversationListItem) => {
  const isGroupConversation = item.conversationType === 'group' || Boolean(item.groupId);

  if (!isGroupConversation) {
    return { label: 'Archive', iconName: 'archive' as const };
  }

  if (item.canDeleteGroup) {
    return { label: 'Delete', iconName: 'delete' as const };
  }

  return { label: 'Leave', iconName: 'logout' as const };
};

function ChatListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<ChatSectionFilter>('active');
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const searchInputRef = useRef<TextInput>(null);

  const refreshConversations = useCallback(async () => {
    const conversationsResponse = await fetchChatConversations({
      token: token || undefined,
      limit: 100,
      includeGroups: true,
      includeArchived: true,
    });

    if (
      conversationsResponse.status === 200 &&
      Array.isArray(conversationsResponse.response?.data)
    ) {
      setConversations(conversationsResponse.response.data);
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeMessage: (() => void) | undefined;

    const bootstrap = async () => {
      try {
        await ensureChatReady(token || undefined);
        await connectChatSocket();

        if (isMounted) {
          await refreshConversations();
        }

        unsubscribeMessage = await onChatMessage((payload: any) => {
          if (!isMounted || !payload?.senderId || !payload?.receiverId) {
            return;
          }

          setConversations((prev) => {
            const senderId = String(payload.senderId);
            const receiverId = String(payload.receiverId);
            if (receiverId !== String(currentUser?._id || '')) {
              return prev;
            }

            const activePeerUserId = getActiveDirectConversationPeerId();
            const shouldIncrementUnread = activePeerUserId !== senderId;
            const preview = '[Encrypted message]';
            const nowIso = payload?.createdAt
              ? new Date(payload.createdAt).toISOString()
              : new Date().toISOString();
            const existingIndex = prev.findIndex((item) => item.peerUserId === senderId);

            if (existingIndex >= 0) {
              const existing = prev[existingIndex]!;
              const updated: ConversationListItem = {
                ...existing,
                lastMessagePreview: preview,
                updatedAt: nowIso,
                unreadCount: shouldIncrementUnread ? existing.unreadCount + 1 : 0,
                lastMessageId: payload?._id ? String(payload._id) : existing.lastMessageId,
                lastMessageStatus: shouldIncrementUnread ? 'delivered' : 'read',
                isArchived: false,
              };
              const clone = [...prev];
              clone.splice(existingIndex, 1);
              return [updated, ...clone];
            }

            return [
              {
                id: `c-${senderId}`,
                conversationType: 'direct',
                peerUserId: senderId,
                peerName: payload.senderName || 'OneBody user',
                peerUsername:
                  typeof payload.senderUsername === 'string' ? payload.senderUsername : '',
                lastMessagePreview: preview,
                updatedAt: nowIso,
                unreadCount: shouldIncrementUnread ? 1 : 0,
                isArchived: false,
                lastMessageId: payload?._id ? String(payload._id) : '',
                lastMessageStatus: shouldIncrementUnread ? 'delivered' : 'read',
              },
              ...prev,
            ];
          });
        });
      } catch {
        // Keep screen interactive when network/bootstrap fails.
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
      if (unsubscribeMessage) {
        unsubscribeMessage();
      }
    };
  }, [currentUser?._id, refreshConversations, token]);

  useFocusEffect(
    useCallback(() => {
      refreshConversations().catch(() => undefined);
      return undefined;
    }, [refreshConversations])
  );

  const filteredConversations = useMemo(() => {
    const sectionFiltered = conversations.filter((item) => {
      const isGroupConversation = item.conversationType === 'group' || Boolean(item.groupId);
      const isArchived = Boolean(item.isArchived);

      if (selectedFilter === 'groups') {
        return isGroupConversation && !isArchived;
      }

      if (selectedFilter === 'archived') {
        return isArchived;
      }

      return !isGroupConversation && !isArchived;
    });

    const value = query.trim().toLowerCase();
    if (!value) {
      return sectionFiltered;
    }

    return sectionFiltered.filter((item) => {
      const rowTitle =
        item.conversationType === 'group'
          ? item.groupName || item.peerName || 'Group chat'
          : item.peerName;
      const rowUsername =
        item.conversationType === 'direct' ? (item.peerUsername?.toLowerCase() ?? '') : '';
      return (
        rowTitle.toLowerCase().includes(value) ||
        rowUsername.includes(value) ||
        `@${rowUsername}`.includes(value)
      );
    });
  }, [conversations, query, selectedFilter]);

  const hasQuery = query.trim().length > 0;
  const hasFilteredConversations = filteredConversations.length > 0;
  const isSearchEmpty = hasQuery && !hasFilteredConversations;
  const shouldCenterEmptyState = !hasFilteredConversations;
  const hasProfileImage =
    typeof currentUser?.profileImage === 'string' && currentUser.profileImage.length > 0;
  const headerAvatarUri = hasProfileImage ? currentUser.profileImage : NO_PROFILE_IMAGE;
  const fabBottom = insets.bottom + 78;
  const encryptedBottom = insets.bottom + 88;

  const openSettings = () => {
    const parentNavigation = navigation.getParent();
    const drawerNavigation = parentNavigation?.getParent?.() ?? parentNavigation;
    (drawerNavigation as any)?.navigate?.('Settings');
  };

  const renderConversationAvatar = (item: ConversationListItem) => {
    if (item.conversationType === 'group' || item.groupId) {
      return (
        <View style={styles.groupAvatarWrap}>
          <MaterialIcons name="groups" size={18} color="#ffffff" />
        </View>
      );
    }

    if (item.peerAvatarUri) {
      return <Image source={{ uri: item.peerAvatarUri }} style={styles.avatar} />;
    }

    return (
      <View style={styles.avatarFallback}>
        <Text style={styles.avatarInitial}>
          {(item.peerName || item.groupName || 'G').slice(0, 1).toUpperCase()}
        </Text>
      </View>
    );
  };

  const buildConversationTargetPayload = useCallback(
    (item: ConversationListItem) =>
      item.conversationType === 'group' || Boolean(item.groupId)
        ? {
            conversationType: 'group' as const,
            groupId: item.groupId || item.id.replace(/^group:/, ''),
          }
        : {
            conversationType: 'direct' as const,
            peerUserId: item.peerUserId,
          },
    []
  );

  const handleDeleteConversation = useCallback(
    async (item: ConversationListItem) => {
      const previousConversations = conversations;
      const isGroupConversation = item.conversationType === 'group' || Boolean(item.groupId);
      const canDeleteGroup = isGroupConversation && Boolean(item.canDeleteGroup);
      const fallbackGroupId =
        typeof item.id === 'string' && item.id.startsWith('group:')
          ? item.id.replace(/^group:/, '')
          : item.id;
      const resolvedGroupId = item.groupId || fallbackGroupId;

      if (isGroupConversation && !canDeleteGroup) {
        setConversations((prev) => prev.filter((conversation) => conversation.id !== item.id));
      } else {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === item.id ? { ...conversation, isArchived: true } : conversation
          )
        );
      }

      let response;
      if (isGroupConversation && resolvedGroupId) {
        response = canDeleteGroup
          ? await deleteChatGroup(resolvedGroupId, token || undefined)
          : await leaveChatGroup(resolvedGroupId, token || undefined);
      } else {
        response = await hideChatConversation(
          buildConversationTargetPayload(item),
          token || undefined
        );
      }

      if (response.status !== 200) {
        setConversations(previousConversations);
        refreshConversations().catch(() => undefined);
      }
    },
    [buildConversationTargetPayload, conversations, refreshConversations, token]
  );

  const renderFilters = () => {
    const filters: { label: string; value: ChatSectionFilter }[] = [
      { label: 'Active', value: 'active' },
      { label: 'Groups', value: 'groups' },
      { label: 'Archived', value: 'archived' },
    ];

    return (
      <View style={styles.filterContainer}>
        {filters.map((filter) => {
          const isActive = selectedFilter === filter.value;
          return (
            <TouchableOpacity
              key={filter.value}
              style={[styles.filterItem, isActive && styles.filterItemSelected]}
              onPress={() => setSelectedFilter(filter.value)}
            >
              <View style={[styles.filterUnderline, isActive && styles.filterUnderlineSelected]}>
                <Text style={[styles.filterText, isActive && styles.filterTextSelected]}>
                  {filter.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const handleMuteConversation = useCallback(
    async (item: ConversationListItem, nextMuted: boolean) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === item.id ? { ...conversation, isMuted: nextMuted } : conversation
        )
      );

      const response = await updateChatConversationMuteState(
        {
          ...buildConversationTargetPayload(item),
          isMuted: nextMuted,
        },
        token || undefined
      );

      if (response.status !== 200) {
        refreshConversations().catch(() => undefined);
      }
    },
    [buildConversationTargetPayload, refreshConversations, token]
  );

  const handleToggleConversationRead = useCallback(
    async (item: ConversationListItem, nextRead: boolean) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === item.id
            ? {
                ...conversation,
                unreadCount: nextRead ? 0 : Math.max(conversation.unreadCount, 1),
              }
            : conversation
        )
      );

      const response = await updateChatConversationReadState(
        {
          ...buildConversationTargetPayload(item),
          isRead: nextRead,
        },
        token || undefined
      );

      if (response.status !== 200) {
        refreshConversations().catch(() => undefined);
      }
    },
    [buildConversationTargetPayload, refreshConversations, token]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerRow, { marginTop: insets.top + (isIOS ? 6 : 12) }]}>
        <View style={styles.headerSideSlot}>
          <Image
            source={{ uri: headerAvatarUri }}
            style={[styles.headerAvatar, { borderColor: colors.border }]}
          />
        </View>

        {isIOS ? (
          <View style={styles.headerCenterWrap} pointerEvents="none">
            <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
          </View>
        ) : (
          <View style={styles.headerAndroidTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
          </View>
        )}

        <View style={styles.headerSideSlot}>
          <Pressable onPress={openSettings} style={styles.settingsButton}>
            <MaterialIcons name="settings" size={30} color="#126b87" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.card }]}>
        <MaterialIcons name="search" size={20} color={colors.text} />
        <TextInput
          ref={searchInputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search conversations..."
          placeholderTextColor={colors.text}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
      {renderFilters()}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#12d2d9" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            hasFilteredConversations ? styles.listContent : styles.emptyContent
          }
          ListEmptyComponent={
            shouldCenterEmptyState ? (
              <ChatEmptyState variant={isSearchEmpty ? 'search' : 'default'} query={query} />
            ) : null
          }
          renderItem={({ item }) => {
            const destructiveAction = getDestructiveActionConfig(item);

            return (
              <SwipeableChatItem
                item={{
                  id: item.id,
                  name: getConversationTitle(item),
                  message: getConversationPreview(item),
                  isRead: item.unreadCount === 0,
                  isMuted: Boolean(item.isMuted),
                }}
                destructiveLabel={destructiveAction.label}
                destructiveIconName={destructiveAction.iconName}
                enableDestructiveAction={!item.isArchived}
                enableUtilityActions={!item.isArchived}
                onDelete={() => {
                  handleDeleteConversation(item).catch(() => undefined);
                }}
                onMute={(_, nextMuted) => {
                  handleMuteConversation(item, nextMuted).catch(() => undefined);
                }}
                onToggleRead={(_, nextRead) => {
                  handleToggleConversationRead(item, nextRead).catch(() => undefined);
                }}
                onPress={() => {
                  if (item.unreadCount > 0) {
                    handleToggleConversationRead(item, true).catch(() => undefined);
                  }

                  const isGroupConversation =
                    item.conversationType === 'group' || Boolean(item.groupId);
                  if (isGroupConversation) {
                    const fallbackGroupId =
                      typeof item.id === 'string' && item.id.startsWith('group:')
                        ? item.id.replace(/^group:/, '')
                        : item.id;
                    navigation.navigate('ChatDetail', {
                      conversationType: 'group',
                      groupId: item.groupId || fallbackGroupId,
                      groupName: item.groupName || item.peerName || 'Group chat',
                    });
                    return;
                  }

                  navigation.navigate('ChatDetail', {
                    conversationType: 'direct',
                    peerUserId: item.peerUserId,
                    peerName: item.peerName,
                    peerUsername: item.peerUsername,
                    peerAvatarUri: item.peerAvatarUri,
                  });
                }}
              >
                <View style={[styles.row, { borderBottomColor: colors.border }]}>
                  {renderConversationAvatar(item)}

                  <View style={styles.body}>
                    <View style={styles.nameRow}>
                      <View style={styles.nameBlock}>
                        <View style={styles.nameInlineRow}>
                          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                            {getConversationTitle(item)}
                          </Text>
                          {item.unreadCount > 0 && item.conversationType !== 'group' ? (
                            <View style={styles.inlineUnreadDot} />
                          ) : null}
                          {item.isMuted ? (
                            <MaterialIcons
                              name="notifications-off"
                              size={16}
                              color="rgba(18, 107, 135, 0.72)"
                            />
                          ) : null}
                        </View>
                      </View>
                      <Text style={[styles.time, { color: colors.text }]}>
                        {formatTimeLabel(item.updatedAt)}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={[styles.preview, { color: colors.text }]} numberOfLines={1}>
                        {getConversationPreview(item)}
                      </Text>
                      {item.unreadCount > 0 ? (
                        <View style={styles.unreadPill}>
                          <Text style={styles.unreadPillText}>{item.unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </SwipeableChatItem>
            );
          }}
        />
      )}
      <View style={[styles.encryptedWrap, { bottom: encryptedBottom }]}>
        <View style={[styles.encryptedBadge, { backgroundColor: colors.card }]}>
          <MaterialIcons name="lock" size={14} color="rgba(18, 107, 135, 0.72)" />
          <Text style={styles.encryptedText}>END-TO-END ENCRYPTED</Text>
        </View>
      </View>
      <Pressable
        onPress={() => {
          navigation.navigate('NewMessage');
        }}
        style={[styles.fab, { bottom: fabBottom }]}
      >
        <ChatIcon width={30} height={30} color="#126b87" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    justifyContent: 'space-between',
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSideSlot: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAndroidTitleWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  headerCenterWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  searchWrap: {
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e6eaec',
    backgroundColor: '#ffffff',
  },
  filterItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  filterItemSelected: {},
  filterUnderline: {
    paddingBottom: 8,
    paddingHorizontal: 5,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  filterUnderlineSelected: {
    borderBottomColor: '#126b87',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: '#9aacb1',
  },
  filterTextSelected: {
    color: '#126b87',
    fontWeight: '700',
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
  },
  encryptedWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  encryptedText: {
    color: 'rgba(18, 107, 135, 0.72)',
    marginLeft: 4,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  listContent: {
    paddingBottom: 126,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginTop: 2,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#126b87',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  groupAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#126b87',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  body: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  nameInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    fontSize: 21,
    fontWeight: '600',
  },
  previewRow: {
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preview: {
    flex: 1,
    fontSize: 14,
    opacity: 0.8,
  },
  time: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  unreadPill: {
    backgroundColor: '#126b87',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  inlineUnreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 92,
  },
  fab: {
    position: 'absolute',
    right: 22,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatListScreen;
