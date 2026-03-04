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
import { ConversationListItem } from '@/src/services/chat/types';
import { connectChatSocket, onChatMessage } from '@/src/services/chat/socketClient';
import { ensureChatReady } from '@/src/services/chat/chatClient';
import { fetchChatConversations } from '@/src/services/chat/api';
import { NO_PROFILE_IMAGE } from '@/src/services/constants';
import ChatEmptyState from './chatempty';

type Props = NativeStackScreenProps<MessagesStackParamsList, 'MessagesList'>;

const formatTimeLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

function ChatListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const searchInputRef = useRef<TextInput>(null);

  const refreshConversations = useCallback(async () => {
    const conversationsResponse = await fetchChatConversations({
      token: token || undefined,
      limit: 100,
      includeGroups: true,
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
          if (!isMounted || !payload?.senderId) {
            return;
          }

          setConversations((prev) => {
            const senderId = String(payload.senderId);
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
                unreadCount: existing.unreadCount + 1,
                lastMessageId: payload?._id ? String(payload._id) : existing.lastMessageId,
                lastMessageStatus: 'delivered',
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
                lastMessagePreview: preview,
                updatedAt: nowIso,
                unreadCount: 1,
                lastMessageId: payload?._id ? String(payload._id) : '',
                lastMessageStatus: 'delivered',
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
  }, [refreshConversations, token]);

  useFocusEffect(
    useCallback(() => {
      refreshConversations().catch(() => undefined);
      return undefined;
    }, [refreshConversations])
  );

  const filteredConversations = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return conversations;
    }

    return conversations.filter((item) => {
      const rowTitle =
        item.conversationType === 'group'
          ? item.groupName || item.peerName || 'Group chat'
          : item.peerName;
      return rowTitle.toLowerCase().includes(value);
    });
  }, [conversations, query]);

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
      {!hasQuery ? (
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionHeaderText}>RECENT CHATS</Text>
        </View>
      ) : null}

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
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
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
                  peerAvatarUri: item.peerAvatarUri,
                });
              }}
              style={[styles.row, { borderBottomColor: colors.border }]}
            >
              {renderConversationAvatar(item)}

              <View style={styles.body}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {item.conversationType === 'group'
                      ? item.groupName || item.peerName || 'Group chat'
                      : item.peerName}
                  </Text>
                  <Text style={[styles.time, { color: colors.text }]}>
                    {formatTimeLabel(item.updatedAt)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={[styles.preview, { color: colors.text }]} numberOfLines={1}>
                    {item.lastMessagePreview}
                  </Text>
                  {item.unreadCount > 0 ? (
                    <View style={styles.unreadPill}>
                      <Text style={styles.unreadPillText}>{item.unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
                {item.unreadCount > 0 ? <View style={styles.onlineDot} /> : null}
              </View>
            </Pressable>
          )}
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
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  encryptedText: {
    color: 'rgba(18, 107, 135, 0.72)',
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  sectionHeaderWrap: {
    paddingTop: 6,
    paddingBottom: 10,
  },
  sectionHeaderText: {
    color: '#6f9fb2',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
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
    alignItems: 'center',
    gap: 10,
  },
  name: {
    flex: 1,
    fontSize: 21,
    fontWeight: '600',
  },
  previewRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  onlineDot: {
    position: 'absolute',
    left: -8,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#f6f7f8',
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
