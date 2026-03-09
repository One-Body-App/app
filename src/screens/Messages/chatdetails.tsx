import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { KeyboardAvoidingView as KeyboardControllerAvoidingView } from 'react-native-keyboard-controller';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import notifee from '@notifee/react-native';
import ImageView from 'react-native-image-viewing';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  GiphyDialog,
  GiphyDialogEvent,
  GiphyThemePreset,
  type GiphyDialogMediaSelectEventHandler,
} from '@giphy/react-native-sdk';
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
  markConversationRead,
  sendEncryptedTextMessage,
  sendEncryptedMediaMessage,
  parseChatMessagePayload,
} from '@/src/services/chat/chatClient';
import {
  clearActiveDirectConversationPeerId,
  setActiveDirectConversationPeerId,
} from '@/src/services/chat/activeConversation';
import { getPeerPublicKey } from '@/src/services/chat/keyManager';
import { NO_PROFILE_IMAGE } from '@/src/services/constants';
import { uploadChatMediaFile } from '@/src/services/chat/api';

type Props = NativeStackScreenProps<MessagesStackParamsList, 'ChatDetail'>;

type LocalMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  mediaType?: 'image' | 'gif';
  mediaUrl?: string;
};

type PendingMedia = {
  type: 'image' | 'gif';
  previewUrl: string;
  uploadUri?: string;
  fileName?: string;
  mimeType?: string;
  giphyId?: string;
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

const getSendFailureMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message.trim() : String(error || '').trim();
  if (!message) {
    return 'Please try again in a moment.';
  }

  const normalized = message.toLowerCase();
  if (
    normalized.includes('timed out') ||
    normalized.includes('timeout') ||
    normalized.includes('unable to send message')
  ) {
    return 'Please try again in a moment.';
  }

  if (
    normalized.includes('secure messaging is unavailable right now') ||
    normalized.includes('secure messaging key setup is unavailable right now')
  ) {
    return 'Secure messaging is unavailable right now. Please restart the app and try again.';
  }

  return message;
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

const formatMessageTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const diffMs = Date.now() - d.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);
  if (diffHrs < 1) {
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${mins} min${mins === 1 ? '' : 's'} ago`;
  }
  if (diffHrs < 24) {
    const hrs = Math.floor(diffHrs);
    return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diffHrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const normalizeMessageText = (text: string) => text.trimEnd();

function ChatDetailScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const routeParams = route.params as MessagesStackParamsList['ChatDetail'] | undefined;
  const isGroupConversation = routeParams?.conversationType === 'group';
  const peerUserId =
    routeParams?.conversationType === 'direct' ? String(routeParams.peerUserId || '') : '';
  const peerName =
    routeParams?.conversationType === 'direct' ? String(routeParams.peerName || '') : '';
  const peerUsername =
    routeParams?.conversationType === 'direct' ? String(routeParams.peerUsername || '').trim() : '';
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
  const [isGiphyInitialized, setIsGiphyInitialized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [pendingMediaCaption, setPendingMediaCaption] = useState('');
  const [fullscreenMediaUrl, setFullscreenMediaUrl] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<LocalMessage>>(null);
  const lastReadSyncSignatureRef = useRef('');
  const hasScrolledToLatestRef = useRef(false);

  const currentUserId = currentUser?._id ? String(currentUser._id) : '';
  const hasPeerAvatarImage = Boolean(peerAvatarUri && peerAvatarUri !== NO_PROFILE_IMAGE);
  const peerInitial = (peerName || 'U').slice(0, 1).toUpperCase();

  const renderIncomingAvatar = () => {
    if (hasPeerAvatarImage) {
      return <Image source={{ uri: peerAvatarUri }} style={styles.incomingAvatar} />;
    }

    return (
      <View style={styles.incomingAvatarFallback}>
        <Text style={styles.incomingAvatarInitial}>{peerInitial}</Text>
      </View>
    );
  };

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!isGroupConversation && peerUserId) {
        setActiveDirectConversationPeerId(peerUserId);
      }

      return () => {
        clearActiveDirectConversationPeerId(peerUserId);
      };
    }, [isGroupConversation, peerUserId])
  );

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    notifee.cancelAllNotifications().catch(() => undefined);
    notifee.setBadgeCount(0).catch(() => undefined);
  }, []);

  useEffect(() => {
    try {
      GiphyDialog.configure({ theme: GiphyThemePreset.Dark });
    } catch {
      // ignore config failure
    }
    setIsGiphyInitialized(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let offMessage: (() => void) | undefined;
    let offStatus: (() => void) | undefined;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setLoadError('');
      setIsPeerKeyMissing(false);
      setIsDMsDisabled(false);
      hasScrolledToLatestRef.current = false;

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
            history.map((entry) => {
              const parsed = parseChatMessagePayload(entry.plaintext);
              return {
                id: entry._id,
                senderId: String(entry.senderId),
                receiverId: String(entry.receiverId),
                text: parsed.type === 'text' ? normalizeMessageText(parsed.text) : parsed.text,
                status: entry.status,
                createdAt: entry.createdAt || new Date().toISOString(),
                mediaType: parsed.type !== 'text' ? parsed.type : undefined,
                mediaUrl: parsed.mediaUrl,
              };
            })
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
                  text: normalizeMessageText('[Encrypted message]'),
                  status: payload.status || 'sent',
                  createdAt: payload.createdAt || new Date().toISOString(),
                },
              ])
            );
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
      flatListRef.current?.scrollToEnd({ animated: hasScrolledToLatestRef.current });
      hasScrolledToLatestRef.current = true;
    });
  }, [messages]);

  useFocusEffect(
    useCallback(() => {
      if (isGroupConversation || !peerUserId || !currentUserId || messages.length < 1) {
        return undefined;
      }

      const unreadIncomingIds = messages
        .filter(
          (message) =>
            message.senderId === peerUserId &&
            message.receiverId === currentUserId &&
            message.status !== 'read'
        )
        .map((message) => message.id);

      if (unreadIncomingIds.length < 1) {
        lastReadSyncSignatureRef.current = '';
        return undefined;
      }

      const signature = unreadIncomingIds.join(',');
      if (lastReadSyncSignatureRef.current === signature) {
        return undefined;
      }

      lastReadSyncSignatureRef.current = signature;
      markConversationRead(peerUserId, token || undefined)
        .then((result) => {
          if (!result.ok || result.messageIds.length < 1) {
            return;
          }

          const readMessageIds = new Set(result.messageIds.map(String));
          setMessages((prev) =>
            prev.map((message) =>
              readMessageIds.has(message.id) ? { ...message, status: 'read' } : message
            )
          );
        })
        .catch(() => {
          lastReadSyncSignatureRef.current = '';
        });

      return undefined;
    }, [currentUserId, isGroupConversation, messages, peerUserId, token])
  );

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
      Alert.alert('Unable to send message', getSendFailureMessage(error));
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

      const ackMessage = response?.ok ? response.message : undefined;
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
        Alert.alert('Unable to send message', getSendFailureMessage(error));
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

  const isMediaDisabled =
    isSending ||
    isUploading ||
    isGroupConversation ||
    !peerUserId ||
    isPeerKeyMissing ||
    isDMsDisabled;

  const resetPendingMediaComposer = useCallback(() => {
    setPendingMedia(null);
    setPendingMediaCaption('');
  }, []);

  const sendMediaMessage = useCallback(
    async (args: {
      mediaType: 'image' | 'gif';
      mediaUrl: string;
      giphyId?: string;
      text?: string;
    }) => {
      if (!peerUserId || isGroupConversation) {
        return;
      }

      const normalizedCaption = normalizeMessageText(args.text || '');

      const optimisticMessage: LocalMessage = {
        id: `local-${Date.now()}`,
        senderId: currentUserId || 'me',
        receiverId: peerUserId,
        text: normalizedCaption,
        status: 'sent',
        createdAt: new Date().toISOString(),
        mediaType: args.mediaType,
        mediaUrl: args.mediaUrl,
      };

      setMessages((prev) => sortMessages([...prev, optimisticMessage]));

      try {
        const response = await sendEncryptedMediaMessage({
          receiverId: peerUserId,
          mediaType: args.mediaType,
          mediaUrl: args.mediaType === 'image' ? args.mediaUrl : undefined,
          giphyId: args.mediaType === 'gif' ? args.giphyId : undefined,
          text: normalizedCaption,
          token: token || undefined,
        });

        const ackMessage = response?.ok ? response.message : undefined;
        if (ackMessage?._id) {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === optimisticMessage.id
                ? { ...item, id: String(ackMessage._id), status: ackMessage.status || 'sent' }
                : item
            )
          );
        }
      } catch (error) {
        Alert.alert('Unable to send media', getSendFailureMessage(error));
        setMessages((prev) => prev.filter((item) => item.id !== optimisticMessage.id));
      }
    },
    [currentUserId, isGroupConversation, peerUserId, token]
  );

  const handlePickImage = useCallback(async () => {
    if (isMediaDisabled) {
      return;
    }

    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.uri) {
      return;
    }

    setPendingMedia({
      type: 'image',
      previewUrl: asset.uri,
      uploadUri: asset.uri,
      fileName: asset.fileName || `chat_${Date.now()}.jpg`,
      mimeType: asset.type || 'image/jpeg',
    });
    setPendingMediaCaption('');
  }, [isMediaDisabled]);

  const handlePickGif = useCallback(() => {
    if (isMediaDisabled || !isGiphyInitialized) {
      return;
    }

    const onSelect: GiphyDialogMediaSelectEventHandler = ({ media }) => {
      GiphyDialog.removeAllListeners(GiphyDialogEvent.MediaSelected);
      GiphyDialog.hide();
      const giphyId = media.id;
      const mediaUrl = `https://media.giphy.com/media/${giphyId}/giphy.gif`;
      setPendingMedia({
        type: 'gif',
        previewUrl: mediaUrl,
        giphyId,
      });
      setPendingMediaCaption('');
    };

    GiphyDialog.addListener(GiphyDialogEvent.MediaSelected, onSelect);
    GiphyDialog.show();
  }, [isGiphyInitialized, isMediaDisabled]);

  const submitPendingMedia = useCallback(async () => {
    if (!pendingMedia || !peerUserId || isGroupConversation || isSending || isUploading) {
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
      Alert.alert('Unable to send media', getSendFailureMessage(error));
      return;
    }

    const caption = normalizeMessageText(pendingMediaCaption);
    let mediaUrl = pendingMedia.previewUrl;

    setIsSending(true);

    try {
      if (pendingMedia.type === 'image') {
        if (!pendingMedia.uploadUri) {
          throw new Error('Selected image is unavailable');
        }
        setIsUploading(true);
        mediaUrl = await uploadChatMediaFile(
          pendingMedia.uploadUri,
          pendingMedia.fileName || `chat_${Date.now()}.jpg`,
          pendingMedia.mimeType || 'image/jpeg',
          token || undefined
        );
      }

      await sendMediaMessage({
        mediaType: pendingMedia.type,
        mediaUrl,
        giphyId: pendingMedia.giphyId,
        text: caption,
      });
      resetPendingMediaComposer();
    } catch (error) {
      Alert.alert('Unable to send media', getSendFailureMessage(error));
    } finally {
      setIsUploading(false);
      setIsSending(false);
    }
  }, [
    isDMsDisabled,
    isGroupConversation,
    isPeerKeyMissing,
    isSending,
    isUploading,
    peerLabel,
    peerUserId,
    pendingMedia,
    pendingMediaCaption,
    resetPendingMediaComposer,
    sendMediaMessage,
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
    isSending ||
    isUploading ||
    isGroupConversation ||
    !peerUserId ||
    isPeerKeyMissing ||
    isDMsDisabled;
  let composerPlaceholder = 'Write your message';
  if (isGroupConversation) {
    composerPlaceholder = 'Group messaging coming soon';
  } else if (isPeerKeyMissing) {
    composerPlaceholder = 'Secure chat unavailable for this user';
  } else if (isDMsDisabled) {
    composerPlaceholder = 'This user has turned off direct messages';
  }

  const renderMediaMessage = useCallback(
    (item: LocalMessage, isMine: boolean) => {
      if (!item.mediaType || !item.mediaUrl) {
        return null;
      }

      const hasCaption = normalizeMessageText(item.text).length > 0;

      return (
        <View style={styles.mediaMessageContent}>
          <Pressable
            onPress={() => setFullscreenMediaUrl(item.mediaUrl || null)}
            style={styles.mediaImageFrame}
          >
            <Image
              source={{ uri: item.mediaUrl }}
              style={styles.mediaBubbleImage}
              resizeMode="cover"
            />
          </Pressable>
          {hasCaption ? (
            <Text
              style={[styles.mediaCaptionText, isMine ? styles.mineText : { color: colors.text }]}
            >
              {normalizeMessageText(item.text)}
            </Text>
          ) : null}
        </View>
      );
    },
    [colors.text]
  );

  const renderMainContent = () => {
    let emptyStateMessage = 'No messages yet. Send the first message.';
    if (isPeerKeyMissing) {
      emptyStateMessage = 'This user has not enabled secure messaging yet.';
    } else if (isDMsDisabled) {
      emptyStateMessage = 'This user has turned off direct messages.';
    }

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
        onContentSizeChange={() => {
          if (!messages.length) {
            return;
          }
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToEnd({ animated: hasScrolledToLatestRef.current });
            hasScrolledToLatestRef.current = true;
          });
        }}
        ListHeaderComponent={
          timeLabel ? (
            <Text style={[styles.timeLabel, { color: isDark ? '#9ca3af' : '#8a9098' }]}>
              {timeLabel}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyConversationWrap}>
            <Text style={[styles.emptyConversationText, { color: colors.text }]}>
              {emptyStateMessage}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMine = item.senderId === currentUserId;
          const isRead = item.status === 'read';
          const hasMediaCaption = item.mediaType && normalizeMessageText(item.text).length > 0;
          let bubbleColor: { backgroundColor: string; padding?: number } = isMine
            ? { backgroundColor: '#126b87' }
            : { backgroundColor: 'rgba(18, 210, 217, 0.15)' };
          if (item.mediaType) {
            bubbleColor = hasMediaCaption
              ? bubbleColor
              : { backgroundColor: 'transparent', padding: 0 };
          }
          return (
            <View style={[styles.messageWrap, isMine ? styles.mineWrap : styles.theirsWrap]}>
              {isMine ? (
                <>
                  <View style={[styles.messageBubble, styles.mineBubble, bubbleColor]}>
                    {item.mediaType && item.mediaUrl ? (
                      renderMediaMessage(item, true)
                    ) : (
                      <Text style={[styles.messageText, styles.mineText]}>
                        {normalizeMessageText(item.text)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.statusWrap}>
                    <Text style={styles.timeText}>{formatMessageTime(item.createdAt)}</Text>
                    {isRead ? (
                      <Image source={{ uri: peerAvatarUri }} style={styles.statusAvatar} />
                    ) : null}
                    <Text style={styles.statusText}>{isRead ? 'Seen' : item.status}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.incomingRow}>
                  {renderIncomingAvatar()}
                  <View style={styles.incomingBody}>
                    <View style={[styles.messageBubble, styles.theirsBubble, bubbleColor]}>
                      {item.mediaType && item.mediaUrl ? (
                        renderMediaMessage(item, false)
                      ) : (
                        <Text style={[styles.messageText, { color: colors.text }]}>
                          {normalizeMessageText(item.text)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.incomingTimeWrap}>
                      <Text style={styles.timeText}>{formatMessageTime(item.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    );
  };

  return (
    <KeyboardControllerAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="translate-with-padding"
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 6, borderBottomColor: isDark ? '#1b1b1b' : '#ececee' },
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
          {!isGroupConversation ? (
            <View style={styles.headerTitleBlock}>
              <View style={styles.headerNameRow}>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                  {headerTitle}
                </Text>
                <MaterialIcons name="verified" size={18} color="#126b87" />
              </View>
              {peerUsername ? (
                <Text style={styles.headerUsername} numberOfLines={1}>
                  @{peerUsername}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {headerTitle}
            </Text>
          )}
        </View>
        <Pressable style={styles.iconButton}>
          <MaterialIcons name="more-vert" size={24} color="#126b87" />
        </Pressable>
      </View>

      <View
        style={[styles.contentWrap, { backgroundColor: isDark ? colors.background : '#f4f5f7' }]}
      >
        {renderMainContent()}
      </View>

      <View
        style={[
          styles.inputRow,
          {
            borderTopColor: isDark ? '#1b1b1b' : '#ececee',
            paddingBottom:
              Platform.OS === 'ios' && keyboardVisible ? 8 : Math.max(insets.bottom, 8),
            backgroundColor: isDark ? colors.background : '#ffffff',
          },
        ]}
      >
        <View style={[styles.inputWrap, { backgroundColor: isDark ? colors.card : '#f1f2f4' }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setIsComposerFocused(true)}
            onBlur={() => setIsComposerFocused(false)}
            editable={!isGroupConversation && !isPeerKeyMissing && !isDMsDisabled}
            placeholder={isComposerFocused ? '' : composerPlaceholder}
            placeholderTextColor="#68707a"
            style={[styles.input, { color: colors.text }]}
            multiline
          />
        </View>
        <Pressable
          onPress={handlePickImage}
          disabled={isMediaDisabled}
          style={[styles.utilityButton, isMediaDisabled ? styles.utilityButtonDisabled : null]}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#126b87" />
          ) : (
            <MaterialIcons name="image" size={20} color="#126b87" />
          )}
        </Pressable>
        <Pressable
          onPress={handlePickGif}
          disabled={isMediaDisabled || !isGiphyInitialized}
          style={[styles.utilityButton, isMediaDisabled ? styles.utilityButtonDisabled : null]}
        >
          <MaterialIcons name="gif" size={24} color="#126b87" />
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

      <Modal
        visible={Boolean(pendingMedia)}
        transparent
        animationType="slide"
        onRequestClose={resetPendingMediaComposer}
      >
        <View style={styles.pendingMediaBackdrop}>
          <Pressable style={styles.pendingMediaDismissZone} onPress={resetPendingMediaComposer} />
          <View
            style={[styles.pendingMediaSheet, { backgroundColor: isDark ? '#032f3c' : '#ffffff' }]}
          >
            <View style={styles.pendingMediaHandle} />
            {pendingMedia ? (
              <>
                <View style={styles.pendingMediaPreviewFrame}>
                  <Image
                    source={{ uri: pendingMedia.previewUrl }}
                    style={styles.pendingMediaPreview}
                    resizeMode="cover"
                  />
                </View>
                <TextInput
                  value={pendingMediaCaption}
                  onChangeText={setPendingMediaCaption}
                  placeholder="Add a message"
                  placeholderTextColor="#68828a"
                  style={[
                    styles.pendingMediaInput,
                    {
                      color: colors.text,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f2f4',
                    },
                  ]}
                  multiline
                />
                <View style={styles.pendingMediaActions}>
                  <Pressable
                    onPress={resetPendingMediaComposer}
                    style={[styles.pendingMediaActionButton, styles.pendingMediaCancelButton]}
                  >
                    <Text style={styles.pendingMediaCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={submitPendingMedia}
                    disabled={isSending || isUploading}
                    style={[
                      styles.pendingMediaActionButton,
                      styles.pendingMediaSendButton,
                      isSending || isUploading ? styles.pendingMediaActionDisabled : null,
                    ]}
                  >
                    {isUploading || isSending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.pendingMediaSendText}>Send</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {fullscreenMediaUrl ? (
        <ImageView
          images={[{ uri: fullscreenMediaUrl }]}
          imageIndex={0}
          visible
          presentationStyle="overFullScreen"
          onRequestClose={() => setFullscreenMediaUrl(null)}
        />
      ) : null}
    </KeyboardControllerAvoidingView>
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
    marginLeft: 4,
    justifyContent: 'center',
    minWidth: 0,
  },
  headerTitleBlock: {
    minWidth: 0,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerUsername: {
    marginTop: 1,
    fontSize: 12,
    color: '#68828a',
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
  incomingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  incomingBody: {
    flexShrink: 1,
  },
  incomingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: 8,
  },
  incomingAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#126b87',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  incomingAvatarInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  mineBubble: {
    alignSelf: 'flex-end',
  },
  theirsBubble: {},
  messageText: {
    fontSize: 16,
    lineHeight: 18,
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
  timeText: {
    fontSize: 11,
    color: '#68828a',
  },
  incomingTimeWrap: {
    marginTop: 4,
    alignSelf: 'flex-start',
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
  utilityButtonDisabled: {
    opacity: 0.45,
  },
  mediaMessageContent: {
    gap: 8,
  },
  mediaImageFrame: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  mediaBubbleImage: {
    width: 220,
    aspectRatio: 1.5,
    borderRadius: 16,
  },
  mediaCaptionText: {
    fontSize: 15,
    lineHeight: 20,
  },
  pendingMediaBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  pendingMediaDismissZone: {
    flex: 1,
  },
  pendingMediaSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 14,
  },
  pendingMediaHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(104, 130, 138, 0.5)',
    marginBottom: 2,
  },
  pendingMediaPreviewFrame: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  pendingMediaPreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
  },
  pendingMediaInput: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    maxHeight: 140,
  },
  pendingMediaActions: {
    flexDirection: 'row',
    gap: 10,
  },
  pendingMediaActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingMediaCancelButton: {
    backgroundColor: 'rgba(104, 130, 138, 0.15)',
  },
  pendingMediaSendButton: {
    backgroundColor: '#126b87',
  },
  pendingMediaActionDisabled: {
    opacity: 0.65,
  },
  pendingMediaCancelText: {
    color: '#68828a',
    fontSize: 15,
    fontWeight: '700',
  },
  pendingMediaSendText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
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
