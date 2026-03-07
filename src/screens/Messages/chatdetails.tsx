import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MessagesStackParamsList } from '@/src/navigator/types';
import {
  connectChatSocket,
  onChatMessage,
  onChatMessageStatus,
} from '@/src/services/chat/socketClient';
import {
  loadAndDecryptConversation,
  ensureChatReady,
  markMessageRead,
  sendEncryptedTextMessage,
} from '@/src/services/chat/chatClient';
import { getPeerPublicKey } from '@/src/services/chat/keyManager';
import { NO_PROFILE_IMAGE } from '@/src/services/constants';

type Props = NativeStackScreenProps<MessagesStackParamsList, 'ChatDetail'>;

type LocalMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
};

const sortMessages = (messages: LocalMessage[]) =>
  [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

const isMissingPeerKeyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return message.toLowerCase().includes('public key not found');
};

const isDMsDisabledError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return message.toLowerCase().includes('direct messages are disabled');
};

const formatConversationTimestamp = (iso?: string) => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

function ChatDetailScreen({ navigation, route }: Props) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const routeParams = route.params as MessagesStackParamsList['ChatDetail'] | undefined;
  const isGroupConversation = routeParams?.conversationType === 'group';
  const peerUserId =
    routeParams?.conversationType === 'direct' ? String(routeParams.peerUserId || '') : '';
  const peerName =
    routeParams?.conversationType === 'direct' ? String(routeParams.peerName || '') : '';
  const peerAvatarUri =
    routeParams?.conversationType === 'direct'
      ? String(routeParams.peerAvatarUri || NO_PROFILE_IMAGE)
      : NO_PROFILE_IMAGE;
  const groupName =
    routeParams?.conversationType === 'group' ? String(routeParams.groupName || '') : '';
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isPeerKeyMissing, setIsPeerKeyMissing] = useState(false);
  const [isDMsDisabled, setIsDMsDisabled] = useState(false);
  const flatListRef = useRef<FlatList<LocalMessage>>(null);

  const currentUserId = currentUser?._id ? String(currentUser._id) : '';

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let isMounted = true;
    let offMessage: (() => void) | undefined;
    let offStatus: (() => void) | undefined;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setLoadError('');
      setIsPeerKeyMissing(false);
      setIsDMsDisabled(false);

      if (isGroupConversation) {
        setMessages([]);
        setIsBootstrapping(false);
        return;
      }

      if (!peerUserId) {
        setMessages([]);
        setLoadError('Unable to open this conversation right now.');
        setIsBootstrapping(false);
        return;
      }

      try {
        await ensureChatReady(token || undefined);
        await connectChatSocket();

        try {
          await getPeerPublicKey(peerUserId, token || undefined);
        } catch (error) {
          if (isMissingPeerKeyError(error)) {
            if (isMounted) {
              setIsPeerKeyMissing(true);
            }
          } else if (isDMsDisabledError(error)) {
            if (isMounted) {
              setIsDMsDisabled(true);
            }
          } else {
            throw error;
          }
        }

        const history = await loadAndDecryptConversation({
          peerUserId,
          token: token || undefined,
          limit: 50,
        });

        if (!isMounted) {
          return;
        }

        setMessages(
          sortMessages(
            history.map((entry) => ({
              id: entry._id,
              senderId: String(entry.senderId),
              receiverId: String(entry.receiverId),
              text: entry.plaintext,
              status: entry.status,
              createdAt: entry.createdAt || new Date().toISOString(),
            }))
          )
        );

        try {
          offMessage = await onChatMessage(async (payload: any) => {
            if (!isMounted) {
              return;
            }

            const senderId = String(payload.senderId || '');
            const receiverId = String(payload.receiverId || '');
            if (
              !payload?._id ||
              !senderId ||
              !receiverId ||
              ![peerUserId, currentUserId].includes(senderId) ||
              ![peerUserId, currentUserId].includes(receiverId)
            ) {
              return;
            }

            // Fallback: show encrypted marker until next refresh if decrypt context is missing.
            setMessages((prev) =>
              sortMessages([
                ...prev,
                {
                  id: String(payload._id),
                  senderId,
                  receiverId,
                  text: '[Encrypted message] ',
                  status: payload.status || 'sent',
                  createdAt: payload.createdAt || new Date().toISOString(),
                },
              ])
            );

            if (receiverId === currentUserId && payload?._id) {
              await markMessageRead(String(payload._id), token || undefined).catch(() => undefined);
            }
          });

          offStatus = await onChatMessageStatus((statusPayload: any) => {
            if (!isMounted || !statusPayload?.messageId) {
              return;
            }

            const nextStatus =
              statusPayload.status === 'read' || statusPayload.status === 'delivered'
                ? statusPayload.status
                : 'sent';

            setMessages((prev) =>
              prev.map((message) =>
                message.id === String(statusPayload.messageId)
                  ? {
                      ...message,
                      status: nextStatus,
                    }
                  : message
              )
            );
          });
        } catch (error) {
          if (__DEV__) {
            console.log('[ChatDetail] realtime listener attach failed', error);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.log('[ChatDetail] bootstrap failed, falling back to empty thread', error);
        }
        if (isMounted) {
          setMessages([]);
          setLoadError('Unable to load messages right now.');
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
      if (offMessage) {
        offMessage();
      }
      if (offStatus) {
        offStatus();
      }
    };
  }, [currentUserId, isGroupConversation, peerUserId, token]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

  const peerLabel = peerName || 'This user';

  const sendMessage = useCallback(async () => {
    const content = draft.trim();
    if (!content || isSending || !peerUserId || isGroupConversation) {
      return;
    }

    if (isPeerKeyMissing) {
      Alert.alert(
        'Secure Chat Unavailable',
        `${peerLabel} has not enabled secure messaging yet. Ask them to open Messages in OneBody first.`
      );
      return;
    }

    if (isDMsDisabled) {
      Alert.alert('Direct Messages Disabled', `${peerLabel} has turned off direct messages.`);
      return;
    }

    try {
      await getPeerPublicKey(peerUserId, token || undefined);
    } catch (error) {
      if (isMissingPeerKeyError(error)) {
        setIsPeerKeyMissing(true);
        Alert.alert(
          'Secure Chat Unavailable',
          `${peerLabel} has not enabled secure messaging yet. Ask them to open Messages in OneBody first.`
        );
        return;
      }
      Alert.alert('Unable to send message', 'Please try again in a moment.');
      return;
    }

    setIsSending(true);
    setDraft('');

    const optimisticMessage: LocalMessage = {
      id: `local-${Date.now()}`,
      senderId: currentUserId || 'me',
      receiverId: peerUserId,
      text: content,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => sortMessages([...prev, optimisticMessage]));

    try {
      const response = await sendEncryptedTextMessage({
        receiverId: peerUserId,
        text: content,
        token: token || undefined,
      });

      const ackMessage = response?.message;
      if (ackMessage?._id) {
        setMessages((prev) =>
          prev.map((item) =>
            item.id === optimisticMessage.id
              ? {
                  ...item,
                  id: String(ackMessage._id),
                  status: ackMessage.status || 'sent',
                }
              : item
          )
        );
      }
    } catch (error) {
      if (isMissingPeerKeyError(error)) {
        setIsPeerKeyMissing(true);
        Alert.alert(
          'Secure Chat Unavailable',
          `${peerLabel} has not enabled secure messaging yet. Ask them to open Messages in OneBody first.`
        );
      } else {
        Alert.alert('Unable to send message', 'Please try again in a moment.');
      }
      setDraft(content);
      setMessages((prev) => prev.filter((item) => item.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
    }
  }, [
    currentUserId,
    draft,
    isDMsDisabled,
    isGroupConversation,
    isPeerKeyMissing,
    isSending,
    peerLabel,
    peerUserId,
    token,
  ]);

  const headerTitle = useMemo(
    () => (isGroupConversation ? groupName || 'Group Chat' : peerName || 'Secure Chat'),
    [groupName, isGroupConversation, peerName]
  );
  const timeLabel = useMemo(
    () => formatConversationTimestamp(messages[messages.length - 1]?.createdAt),
    [messages]
  );
  const shouldShowGroupInfo = isGroupConversation;
  const shouldShowLoader = !shouldShowGroupInfo && isBootstrapping;
  const shouldShowErrorState = !shouldShowGroupInfo && !isBootstrapping && Boolean(loadError);
  const shouldShowConversationList =
    !shouldShowGroupInfo && !shouldShowLoader && !shouldShowErrorState;
  const isComposerDisabled =
    isSending || isGroupConversation || !peerUserId || isPeerKeyMissing || isDMsDisabled;
  let composerPlaceholder = 'Write your message';
  if (isGroupConversation) {
    composerPlaceholder = 'Group messaging coming soon';
  } else if (isPeerKeyMissing) {
    composerPlaceholder = 'Secure chat unavailable for this user';
  } else if (isDMsDisabled) {
    composerPlaceholder = 'This user has turned off direct messages';
  }

  const renderMainContent = () => {
    if (shouldShowGroupInfo) {
      return (
        <View style={styles.groupInfoWrap}>
          <MaterialIcons name="groups" size={42} color="#126b87" />
          <Text style={[styles.groupInfoTitle, { color: colors.text }]}>Group created</Text>
          <Text style={styles.groupInfoBody}>
            Group messaging is coming soon. You can still create and manage groups right now.
          </Text>
        </View>
      );
    }

    if (shouldShowLoader) {
      return (
        <View style={styles.centerStateWrap}>
          <ActivityIndicator color="#12d2d9" />
        </View>
      );
    }

    if (shouldShowErrorState) {
      return (
        <View style={styles.centerStateWrap}>
          <Text style={[styles.centerStateText, { color: colors.text }]}>{loadError}</Text>
        </View>
      );
    }

    if (!shouldShowConversationList) {
      return null;
    }

    return (
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        ListHeaderComponent={
          timeLabel ? (
            <Text style={[styles.timeLabel, { color: dark ? '#9ca3af' : '#8a9098' }]}>
              {timeLabel}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyConversationWrap}>
            <Text style={[styles.emptyConversationText, { color: colors.text }]}>
              {isPeerKeyMissing
                ? 'This user has not enabled secure messaging yet.'
                : isDMsDisabled
                  ? 'This user has turned off direct messages.'
                  : 'No messages yet. Send the first message.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMine = item.senderId === currentUserId;
          const isRead = item.status === 'read';
          return (
            <View style={[styles.messageWrap, isMine ? styles.mineWrap : styles.theirsWrap]}>
              <View
                style={[
                  styles.messageBubble,
                  isMine ? styles.mineBubble : styles.theirsBubble,
                  isMine
                    ? { backgroundColor: '#126b87' }
                    : { backgroundColor: dark ? colors.card : '#f5f5f6' },
                ]}
              >
                <Text
                  style={[styles.messageText, isMine ? styles.mineText : { color: colors.text }]}
                >
                  {item.text}
                </Text>
                <View style={isMine ? styles.mineTail : styles.theirsTail} />
              </View>
              {isMine ? (
                <View style={styles.statusWrap}>
                  {isRead ? (
                    <Image source={{ uri: peerAvatarUri }} style={styles.statusAvatar} />
                  ) : null}
                  <Text style={styles.statusText}>{isRead ? 'Seen' : item.status}</Text>
                </View>
              ) : null}
            </View>
          );
        }}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 6, borderBottomColor: dark ? '#1b1b1b' : '#ececee' },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <MaterialIcons name="chevron-left" size={30} color="#126b87" />
        </Pressable>
        {!isGroupConversation ? (
          <Image source={{ uri: peerAvatarUri }} style={styles.headerAvatar} />
        ) : (
          <View style={styles.headerGroupAvatar}>
            <MaterialIcons name="groups" size={18} color="#fff" />
          </View>
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {headerTitle}
          </Text>
          {!isGroupConversation ? (
            <MaterialIcons name="verified" size={18} color="#126b87" />
          ) : null}
        </View>
        <Pressable style={styles.iconButton}>
          <MaterialIcons name="more-vert" size={24} color="#126b87" />
        </Pressable>
      </View>

      <View style={[styles.contentWrap, { backgroundColor: dark ? colors.background : '#f4f5f7' }]}>
        {renderMainContent()}
      </View>

      <View
        style={[
          styles.inputRow,
          {
            borderTopColor: dark ? '#1b1b1b' : '#ececee',
            paddingBottom: Math.max(insets.bottom, 8),
            backgroundColor: dark ? colors.background : '#ffffff',
          },
        ]}
      >
        <View style={[styles.inputWrap, { backgroundColor: dark ? colors.card : '#f1f2f4' }]}>
          <MaterialIcons name="sentiment-satisfied-alt" size={24} color="#68707a" />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={!isGroupConversation && !isPeerKeyMissing && !isDMsDisabled}
            placeholder={composerPlaceholder}
            placeholderTextColor="#68707a"
            style={[styles.input, { color: colors.text }]}
            multiline
          />
        </View>
        <Pressable style={styles.utilityButton}>
          <MaterialIcons name="link" size={20} color="#126b87" />
        </Pressable>
        <Pressable style={styles.utilityButton}>
          <MaterialIcons name="keyboard-voice" size={20} color="#126b87" />
        </Pressable>
        <Pressable
          onPress={sendMessage}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: isComposerDisabled ? '#68828a' : '#126b87',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          disabled={isComposerDisabled}
        >
          <MaterialIcons name="send" size={20} color="#ffffff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginHorizontal: 8,
  },
  headerGroupAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginHorizontal: 8,
    backgroundColor: '#126b87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  contentWrap: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 14,
    flexGrow: 1,
  },
  timeLabel: {
    alignSelf: 'center',
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  centerStateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerStateText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.8,
  },
  emptyConversationWrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  emptyConversationText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.72,
  },
  groupInfoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  groupInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 14,
  },
  groupInfoBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#68828a',
    marginTop: 8,
  },
  messageWrap: {
    marginVertical: 6,
    maxWidth: '86%',
  },
  mineWrap: {
    alignSelf: 'flex-end',
  },
  theirsWrap: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  mineBubble: {
    borderBottomRightRadius: 2,
  },
  theirsBubble: {
    borderBottomLeftRadius: 2,
  },
  mineTail: {
    position: 'absolute',
    right: -1,
    bottom: -11,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderTopWidth: 12,
    borderLeftColor: '#126b87',
    borderTopColor: 'transparent',
  },
  theirsTail: {
    position: 'absolute',
    left: -1,
    bottom: -11,
    width: 0,
    height: 0,
    borderRightWidth: 14,
    borderTopWidth: 12,
    borderRightColor: '#f5f5f6',
    borderTopColor: 'transparent',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 23,
  },
  mineText: {
    color: '#fff',
  },
  statusWrap: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
  },
  statusAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    color: '#68828a',
    textTransform: 'capitalize',
  },
  inputRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    maxHeight: 120,
    fontSize: 16,
  },
  utilityButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#d9ecf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatDetailScreen;
