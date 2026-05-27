import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import HeaderGradientOverlay from '@/components/HeaderGradientOverlay';
import ChatIcon from '@/assets/icons/chat.svg';
import ProfileFill from '@/assets/svg/ProfileFill.svg';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MessagesStackParamsList } from '@/src/navigator/types';
import {
  getActiveDirectConversationPeerId,
  getActiveGroupConversationId,
} from '@/src/services/chat/activeConversation';
import { ConversationListItem } from '@/src/services/chat/types';
import {
  isGroupConversationItem,
  resolveConversationTargetPayload,
  resolveDirectPeerUserId,
  resolveGroupId,
} from '@/src/services/chat/conversationTarget';
import { syncConversationReadMutationLocally } from '@/src/services/chat/conversationReadState';
import { subscribeToConversationListReadEvents } from '@/src/services/chat/conversationListReadEvent';
import {
  connectChatSocket,
  onChatGroupMessage,
  onChatMessage,
} from '@/src/services/chat/socketClient';
import {
  ensureChatReady,
  parseChatMessagePayload,
  setConversationReadState,
} from '@/src/services/chat/chatClient';
import {
  applyLocalConversationReadOverrides,
  publishChatUnreadFromConversations,
  resetChatUnreadIndicator,
} from '@/src/services/chat/unreadIndicator';
import {
  deleteDirectChatConversation,
  deleteChatGroup,
  fetchChatConversations,
  leaveChatGroup,
  updateChatConversationArchiveState,
  updateChatConversationMuteState,
} from '@/src/services/chat/api';
import { NO_PROFILE_IMAGE } from '@/src/services/constants';
import { MessagesConversationListView } from '@/src/components/chat/MessagesConversationListView';
import { SwipeableChatItem } from '@/src/components/chat/SwipeableChatItem';
import useSpringboardEntry from '@/src/hooks/useSpringboardEntry';
import { getTabRootSpringboardPreset } from '@/src/navigator/motionPolicy';
import { useRootTabSwitchReplayToken } from '@/src/navigator/RootTabTransitionContext';
import ChatEmptyState from './chatempty';

type Props = NativeStackScreenProps<MessagesStackParamsList, 'MessagesList'>;
type ChatSectionFilter = 'inbox' | 'groups' | 'archived';

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

const getConversationAvatarFallback = (item: ConversationListItem) =>
  (item.peerName || item.groupName || 'G').slice(0, 1).toUpperCase();

const getDestructiveActionConfig = (item: ConversationListItem) => {
  const isGroupConversation = isGroupConversationItem(item);

  if (!isGroupConversation) {
    return { label: 'Delete', iconName: 'delete' as const };
  }

  if (item.canDeleteGroup) {
    return { label: 'Delete', iconName: 'delete' as const };
  }

  return { label: 'Leave', iconName: 'logout' as const };
};

const getNativeDestructiveAction = (
  label: ReturnType<typeof getDestructiveActionConfig>['label']
) => {
  if (label === 'Delete') {
    return 'delete' as const;
  }

  return 'leave' as const;
};

function ChatListScreen({ navigation }: Props) {
  const rootTabReplayToken = useRootTabSwitchReplayToken('Messages');
  const { getSpringboardStyle } = useSpringboardEntry(rootTabReplayToken, 3, {
    preset: getTabRootSpringboardPreset('messages'),
  });
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ChatSectionFilter>('inbox');
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    publishChatUnreadFromConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (!token) {
      resetChatUnreadIndicator();
    }
  }, [token]);

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
      setConversations(applyLocalConversationReadOverrides(conversationsResponse.response.data));
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeMessage: (() => void) | undefined;
    let unsubscribeGroupMessage: (() => void) | undefined;

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

        unsubscribeGroupMessage = await onChatGroupMessage((payload: any) => {
          if (!isMounted || !payload?.groupId || !payload?.senderId) {
            return;
          }

          setConversations((prev) => {
            const groupId = String(payload.groupId);
            const senderId = String(payload.senderId);
            const activeGroupId = getActiveGroupConversationId();
            const shouldIncrementUnread =
              groupId.length > 0 &&
              activeGroupId !== groupId &&
              senderId !== String(currentUser?._id || '');
            const parsed = parseChatMessagePayload(String(payload.plaintextPayload || ''));
            const preview =
              parsed.type === 'text'
                ? parsed.text.trim() || 'New group message'
                : parsed.text.trim() || (parsed.type === 'image' ? '[Image]' : '[GIF]');
            const nowIso = payload?.createdAt
              ? new Date(payload.createdAt).toISOString()
              : new Date().toISOString();
            const existingIndex = prev.findIndex(
              (item) =>
                (item.conversationType === 'group' || Boolean(item.groupId)) &&
                (item.groupId === groupId || item.id === `group:${groupId}`)
            );

            if (existingIndex >= 0) {
              const existing = prev[existingIndex]!;
              const updated: ConversationListItem = {
                ...existing,
                groupId,
                groupName: String(
                  payload.groupName || existing.groupName || existing.peerName || 'Group chat'
                ),
                peerName: String(
                  payload.groupName || existing.groupName || existing.peerName || 'Group chat'
                ),
                lastMessagePreview: preview,
                updatedAt: nowIso,
                unreadCount: shouldIncrementUnread ? existing.unreadCount + 1 : 0,
                lastMessageId: payload?._id ? String(payload._id) : existing.lastMessageId,
                isArchived: false,
              };
              const clone = [...prev];
              clone.splice(existingIndex, 1);
              return [updated, ...clone];
            }

            return [
              {
                id: `group:${groupId}`,
                conversationType: 'group',
                groupId,
                groupName: String(payload.groupName || 'Group chat'),
                peerUserId: '',
                peerName: String(payload.groupName || 'Group chat'),
                lastMessagePreview: preview,
                updatedAt: nowIso,
                unreadCount: shouldIncrementUnread ? 1 : 0,
                isArchived: false,
                lastMessageId: payload?._id ? String(payload._id) : '',
                participantCount: 0,
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
      if (unsubscribeGroupMessage) {
        unsubscribeGroupMessage();
      }
    };
  }, [currentUser?._id, refreshConversations, token]);

  useFocusEffect(
    useCallback(() => {
      refreshConversations().catch(() => undefined);
      return undefined;
    }, [refreshConversations])
  );

  useEffect(() => {
    return subscribeToConversationListReadEvents(setConversations);
  }, []);

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

  const conversationsById = useMemo(() => {
    return new Map(conversations.map((conversation) => [conversation.id, conversation]));
  }, [conversations]);

  const nativeMessagesRows = useMemo(() => {
    return filteredConversations.map((item) => {
      const destructiveAction = getDestructiveActionConfig(item);

      return {
        id: item.id,
        conversationType: isGroupConversationItem(item) ? 'group' : 'direct',
        title: getConversationTitle(item),
        subtitle: getConversationPreview(item),
        avatarUri: item.peerAvatarUri,
        avatarFallback: getConversationAvatarFallback(item),
        timeLabel: formatTimeLabel(item.updatedAt),
        unreadCount: item.unreadCount,
        isMuted: Boolean(item.isMuted),
        isArchived: Boolean(item.isArchived),
        canArchive: true,
        canMute: !item.isArchived,
        canToggleRead: !item.isArchived,
        destructiveAction: getNativeDestructiveAction(destructiveAction.label),
      } as const;
    });
  }, [filteredConversations]);

  const hasQuery = query.trim().length > 0;
  const hasFilteredConversations = filteredConversations.length > 0;
  const isSearchEmpty = hasQuery && !hasFilteredConversations;
  const shouldCenterEmptyState = !hasFilteredConversations;
  const hasProfileImage =
    typeof currentUser?.profileImage === 'string' && currentUser.profileImage.length > 0;
  const fabBottom = insets.bottom + 78;
  const encryptedBottom = insets.bottom + 88;

  useEffect(() => {
    if (!isSearchVisible) {
      return;
    }

    searchInputRef.current?.focus();
  }, [isSearchVisible]);

  const handleToggleSearch = useCallback(() => {
    setIsSearchVisible((currentValue) => {
      const nextValue = !currentValue;
      if (!nextValue) {
        setQuery('');
      }
      return nextValue;
    });
  }, []);

  const renderConversationAvatar = (item: ConversationListItem) => {
    if (isGroupConversationItem(item)) {
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

  const buildConversationTargetPayload = useCallback((item: ConversationListItem) => {
    return resolveConversationTargetPayload(item);
  }, []);

  const handleArchiveConversation = useCallback(
    async (item: ConversationListItem, nextArchived: boolean) => {
      const targetPayload = buildConversationTargetPayload(item);
      if (!targetPayload) {
        refreshConversations().catch(() => undefined);
        return;
      }

      const previousConversations = conversations;
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === item.id ? { ...conversation, isArchived: nextArchived } : conversation
        )
      );

      const response = await updateChatConversationArchiveState(
        {
          ...targetPayload,
          isArchived: nextArchived,
        },
        token || undefined
      );

      if (response.status !== 200) {
        setConversations(previousConversations);
        refreshConversations().catch(() => undefined);
      }
    },
    [buildConversationTargetPayload, conversations, refreshConversations, token]
  );

  const handleDestructiveConversation = useCallback(
    async (item: ConversationListItem) => {
      const previousConversations = conversations;
      const isGroupConversation = isGroupConversationItem(item);
      const resolvedGroupId = resolveGroupId(item);

      if (isGroupConversation && !item.canDeleteGroup) {
        setConversations((prev) => prev.filter((conversation) => conversation.id !== item.id));
      } else if (isGroupConversation) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === item.id ? { ...conversation, isArchived: true } : conversation
          )
        );
      } else {
        setConversations((prev) => prev.filter((conversation) => conversation.id !== item.id));
      }

      let response;
      if (isGroupConversation && resolvedGroupId) {
        response = item.canDeleteGroup
          ? await deleteChatGroup(resolvedGroupId, token || undefined)
          : await leaveChatGroup(resolvedGroupId, token || undefined);
      } else {
        const directPeerUserId = resolveDirectPeerUserId(item);
        if (!directPeerUserId) {
          setConversations(previousConversations);
          refreshConversations().catch(() => undefined);
          return;
        }

        response = await deleteDirectChatConversation(directPeerUserId, token || undefined);
      }

      if (response.status !== 200) {
        setConversations(previousConversations);
        refreshConversations().catch(() => undefined);
      }
    },
    [conversations, refreshConversations, token]
  );

  const confirmDestructiveConversation = useCallback(
    (item: ConversationListItem) => {
      const shouldConfirmDelete = item.conversationType !== 'group' || Boolean(item.canDeleteGroup);

      if (!shouldConfirmDelete) {
        handleDestructiveConversation(item).catch(() => undefined);
        return;
      }

      const isGroupConversation = isGroupConversationItem(item);
      const targetLabel = isGroupConversation ? 'group thread' : 'thread';

      Alert.alert('Delete thread?', `Are you sure you want to delete this ${targetLabel}?`, [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            handleDestructiveConversation(item).catch(() => undefined);
          },
        },
      ]);
    },
    [handleDestructiveConversation]
  );

  const renderFilters = () => {
    const filters: { label: string; value: ChatSectionFilter }[] = [
      { label: 'Inbox', value: 'inbox' },
      { label: 'Groups', value: 'groups' },
      { label: 'Archived', value: 'archived' },
    ];

    return (
      <View
        style={[
          styles.filterContainer,
          {
            borderBottomColor: dark ? 'rgba(255,255,255,0.08)' : '#e6eaec',
          },
        ]}
      >
        {filters.map((filter) => {
          const isActive = selectedFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              style={[styles.filterItem, isActive && styles.filterItemSelected]}
              onPress={() => setSelectedFilter(filter.value)}
              testID={`chat-filter-${filter.value}`}
            >
              <View style={[styles.filterUnderline, isActive && styles.filterUnderlineSelected]}>
                <Text
                  style={[
                    styles.filterText,
                    { color: dark ? 'rgba(255,255,255,0.58)' : '#9aacb1' },
                    isActive && styles.filterTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const handleMuteConversation = useCallback(
    async (item: ConversationListItem, nextMuted: boolean) => {
      const targetPayload = buildConversationTargetPayload(item);
      if (!targetPayload) {
        refreshConversations().catch(() => undefined);
        return;
      }

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === item.id ? { ...conversation, isMuted: nextMuted } : conversation
        )
      );

      const response = await updateChatConversationMuteState(
        {
          ...targetPayload,
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
    async (item: ConversationListItem, nextRead: boolean, options?: { optimistic?: boolean }) => {
      const targetPayload = buildConversationTargetPayload(item);
      if (!targetPayload) {
        refreshConversations().catch(() => undefined);
        return;
      }

      const nextUnreadCount = nextRead ? 0 : Math.max(item.unreadCount, 1);
      const applyLocalState = () => {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === item.id
              ? {
                  ...conversation,
                  unreadCount: nextUnreadCount,
                  ...(nextRead && targetPayload.conversationType === 'direct'
                    ? { lastMessageStatus: 'read' as const }
                    : {}),
                }
              : conversation
          )
        );
        syncConversationReadMutationLocally(targetPayload, nextRead, nextUnreadCount);
      };

      if (options?.optimistic) {
        applyLocalState();
      }

      try {
        await setConversationReadState(targetPayload, nextRead, token || undefined);
        if (!options?.optimistic) {
          applyLocalState();
        }
      } catch {
        refreshConversations().catch(() => undefined);
      }
    },
    [buildConversationTargetPayload, refreshConversations, token]
  );

  const openConversation = useCallback(
    (item: ConversationListItem) => {
      const targetPayload = buildConversationTargetPayload(item);
      if (!targetPayload) {
        refreshConversations().catch(() => undefined);
        return;
      }

      const isGroupConversation = targetPayload.conversationType === 'group';
      if (item.unreadCount > 0) {
        handleToggleConversationRead(item, true, { optimistic: true }).catch(() => undefined);
      }

      if (isGroupConversation) {
        navigation.navigate('ChatDetail', {
          conversationType: 'group',
          groupId: targetPayload.groupId || '',
          groupName: item.groupName || item.peerName || 'Group chat',
          isMuted: Boolean(item.isMuted),
          isArchived: Boolean(item.isArchived),
        });
        return;
      }

      navigation.navigate('ChatDetail', {
        conversationType: 'direct',
        peerUserId: targetPayload.peerUserId || '',
        peerName: item.peerName,
        peerUsername: item.peerUsername,
        peerAvatarUri: item.peerAvatarUri,
        isMuted: Boolean(item.isMuted),
        isArchived: Boolean(item.isArchived),
      });
    },
    [buildConversationTargetPayload, handleToggleConversationRead, navigation, refreshConversations]
  );

  const handleNativePressConversation = useCallback(
    (conversationId: string) => {
      const item = conversationsById.get(conversationId);
      if (!item) {
        return;
      }

      openConversation(item);
    },
    [conversationsById, openConversation]
  );

  const handleNativeMuteConversation = useCallback(
    (conversationId: string, nextMuted: boolean) => {
      const item = conversationsById.get(conversationId);
      if (!item) {
        return;
      }

      handleMuteConversation(item, nextMuted).catch(() => undefined);
    },
    [conversationsById, handleMuteConversation]
  );

  const handleNativeToggleReadConversation = useCallback(
    (conversationId: string, nextRead: boolean) => {
      const item = conversationsById.get(conversationId);
      if (!item) {
        return;
      }

      handleToggleConversationRead(item, nextRead).catch(() => undefined);
    },
    [conversationsById, handleToggleConversationRead]
  );

  const handleNativeArchiveConversation = useCallback(
    (conversationId: string) => {
      const item = conversationsById.get(conversationId);
      if (!item) {
        return;
      }

      handleArchiveConversation(item, !item.isArchived).catch(() => undefined);
    },
    [conversationsById, handleArchiveConversation]
  );

  const handleNativeDestructiveConversation = useCallback(
    (conversationId: string) => {
      const item = conversationsById.get(conversationId);
      if (!item) {
        return;
      }

      handleDestructiveConversation(item).catch(() => undefined);
    },
    [conversationsById, handleDestructiveConversation]
  );

  let conversationsContent: React.ReactNode;
  if (loading) {
    conversationsContent = (
      <View style={styles.loaderWrap}>
        <ActivityIndicator color="#12d2d9" />
      </View>
    );
  } else if (isIOS) {
    conversationsContent = hasFilteredConversations ? (
      <MessagesConversationListView
        style={styles.nativeList}
        conversations={nativeMessagesRows}
        bottomInset={126}
        onPressConversation={handleNativePressConversation}
        onMuteConversation={handleNativeMuteConversation}
        onToggleReadConversation={handleNativeToggleReadConversation}
        onArchiveConversation={handleNativeArchiveConversation}
        onDestructiveConversation={handleNativeDestructiveConversation}
      />
    ) : (
      <View style={styles.emptyContent}>
        <ChatEmptyState variant={isSearchEmpty ? 'search' : 'default'} query={query} />
      </View>
    );
  } else {
    conversationsContent = (
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={hasFilteredConversations ? styles.listContent : styles.emptyContent}
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
                isArchived: Boolean(item.isArchived),
              }}
              destructiveLabel={destructiveAction.label}
              destructiveIconName={destructiveAction.iconName}
              enableDestructiveAction={!item.isArchived}
              enableUtilityActions={!item.isArchived}
              onDelete={() => {
                confirmDestructiveConversation(item);
              }}
              onMute={(_, nextMuted) => {
                handleMuteConversation(item, nextMuted).catch(() => undefined);
              }}
              onToggleRead={(_, nextRead) => {
                handleToggleConversationRead(item, nextRead).catch(() => undefined);
              }}
              onArchive={() => {
                handleArchiveConversation(item, !item.isArchived).catch(() => undefined);
              }}
              onPress={() => {
                openConversation(item);
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
    );
  }

  const glassOverlayColor = dark ? 'rgba(13,13,13,0.72)' : 'rgba(246,246,247,0.72)';
  const androidHeaderBg = dark ? '#0d0d0d' : '#f6f6f7';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS === 'android' ? (
        <StatusBar
          barStyle={dark ? 'light-content' : 'dark-content'}
          backgroundColor={androidHeaderBg}
          translucent={false}
        />
      ) : null}
      {/* Glass header wrapper — full width so BlurView fills edge-to-edge */}
      <View style={styles.headerGlassWrap}>
        {isIOS ? (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            blurType={dark ? 'dark' : 'light'}
            blurAmount={25}
            reducedTransparencyFallbackColor={colors.background}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isIOS ? glassOverlayColor : androidHeaderBg },
          ]}
        />
        {isIOS && <HeaderGradientOverlay color={glassOverlayColor} />}
        <View style={styles.headerGlassContent}>
          <Animated.View
            style={[
              styles.headerRow,
              { marginTop: insets.top + (isIOS ? 6 : 12) },
              getSpringboardStyle(0),
            ]}
          >
            <View style={styles.headerSideSlot}>
              {hasProfileImage ? (
                <Image
                  source={{ uri: currentUser!.profileImage }}
                  style={[styles.headerAvatar, { borderColor: colors.border }]}
                />
              ) : (
                <ProfileFill width={32} height={32} color="#126b87" />
              )}
            </View>

            {isIOS ? (
              <View
                style={[styles.headerCenterWrap, styles.headerCenterWrapIos]}
                pointerEvents="none"
              >
                <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
              </View>
            ) : (
              <View style={styles.headerAndroidTitleWrap}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
              </View>
            )}

            <View style={styles.headerSideSlot}>
              <Pressable
                onPress={handleToggleSearch}
                style={styles.settingsButton}
                testID="chat-search-button"
              >
                <MaterialIcons name="search" size={28} color="#126b87" />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View style={getSpringboardStyle(1)}>
            {isSearchVisible ? (
              <View
                style={[styles.searchWrap, { backgroundColor: colors.card }]}
                testID="chat-search-wrap"
              >
                <MaterialIcons name="search" size={20} color={colors.text} />
                <TextInput
                  ref={searchInputRef}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search conversations..."
                  placeholderTextColor={colors.text}
                  style={[styles.searchInput, { color: colors.text }]}
                  testID="chat-search-input"
                />
              </View>
            ) : null}
            {renderFilters()}
          </Animated.View>
        </View>
        {/* headerGlassContent */}
      </View>
      {/* headerGlassWrap */}

      <Animated.View style={[{ flex: 1 }, getSpringboardStyle(2)]}>
        {conversationsContent}
      </Animated.View>
      {selectedFilter !== 'groups' ? (
        <View style={[styles.encryptedWrap, { bottom: encryptedBottom }]}>
          <View style={[styles.encryptedBadge, { backgroundColor: colors.card }]}>
            <MaterialIcons name="lock" size={14} color="rgba(18, 107, 135, 0.72)" />
            <Text style={styles.encryptedText}>END-TO-END ENCRYPTED</Text>
          </View>
        </View>
      ) : null}
      <Pressable
        onPress={() => {
          navigation.navigate('NewMessage');
        }}
        style={[styles.fab, { bottom: fabBottom }]}
      >
        <ChatIcon width={30} height={30} color={dark ? '#12d2d9' : '#126b87'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },
  headerGlassWrap: {
    marginHorizontal: -22,
    overflow: 'hidden',
  },
  headerGlassContent: {
    paddingHorizontal: 22,
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
    paddingLeft: 14,
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
  headerCenterWrapIos: {
    transform: [{ translateY: -8 }],
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginHorizontal: -22,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
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
  nativeList: {
    flex: 1,
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
