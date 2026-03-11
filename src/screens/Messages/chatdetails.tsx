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
  onChatGroupMessage,
  onChatMessage,
  onChatMessageStatus,
} from '@/src/services/chat/socketClient';
import {
  loadAndDecryptConversation,
  loadGroupConversation,
  ensureChatReady,
  markGroupConversationRead,
  markConversationRead,
  sendGroupMediaMessage,
  sendGroupTextMessage,
  sendEncryptedTextMessage,
  sendEncryptedMediaMessage,
  parseChatMessagePayload,
} from '@/src/services/chat/chatClient';
import {
  clearActiveDirectConversationPeerId,
  clearActiveGroupConversationId,
  setActiveGroupConversationId,
  setActiveDirectConversationPeerId,
} from '@/src/services/chat/activeConversation';
import { getPeerPublicKey } from '@/src/services/chat/keyManager';
import { NO_PROFILE_IMAGE } from '@/src/services/constants';
import { ApiCall } from '@/src/services/api';
import {
  updateChatConversationArchiveState,
  updateChatConversationMuteState,
  uploadChatMediaFile,
} from '@/src/services/chat/api';
import {
  getDirectConversationUnreadKey,
  getGroupConversationUnreadKey,
  setChatConversationUnread,
} from '@/src/services/chat/unreadIndicator';
import GifIcon from '@/components/GifIcon';
import ChatOptions from './chatoptions';

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
  senderName?: string;
  senderUsername?: string;
  senderAvatarUri?: string;
  conversationType?: 'direct' | 'group';
  groupId?: string;
};

type PendingMedia = {
  type: 'image' | 'gif';
  previewUrl: string;
  uploadUri?: string;
  fileName?: string;
  mimeType?: string;
  giphyId?: string;
};

const MONGO_OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;
const isValidMongoObjectId = (value: string) => MONGO_OBJECT_ID_REGEX.test(value.trim());

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

const isSameLocalCalendarDay = (leftIso?: string, rightIso?: string) => {
  if (!leftIso || !rightIso) {
    return false;
  }

  const leftDate = new Date(leftIso);
  const rightDate = new Date(rightIso);
  if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) {
    return false;
  }

  return (
    leftDate.getDate() === rightDate.getDate() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getFullYear() === rightDate.getFullYear()
  );
};

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
  const initialMutedState = Boolean(routeParams?.isMuted);
  const initialArchivedState = Boolean(routeParams?.isArchived);
  const groupName =
    routeParams?.conversationType === 'group' ? String(routeParams.groupName || '') : '';
  const groupId =
    routeParams?.conversationType === 'group' ? String(routeParams.groupId || '') : '';
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
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isConversationMuted, setIsConversationMuted] = useState(initialMutedState);
  const [isConversationArchived, setIsConversationArchived] = useState(initialArchivedState);
  const [optionsActionLoading, setOptionsActionLoading] = useState<
    'archive' | 'mute' | 'block' | 'report' | null
  >(null);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [pendingMediaCaption, setPendingMediaCaption] = useState('');
  const [fullscreenMediaUrl, setFullscreenMediaUrl] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<LocalMessage>>(null);
  const lastReadSyncSignatureRef = useRef('');
  const hasScrolledToLatestRef = useRef(false);

  const currentUserId = currentUser?._id ? String(currentUser._id) : '';
  const hasPeerAvatarImage = Boolean(peerAvatarUri && peerAvatarUri !== NO_PROFILE_IMAGE);
  const canShowBlockAndReport = !isGroupConversation && Boolean(peerUserId);
  const currentConversationUnreadKey = isGroupConversation
    ? getGroupConversationUnreadKey(groupId)
    : getDirectConversationUnreadKey(peerUserId);

  useEffect(() => {
    setIsConversationMuted(initialMutedState);
  }, [initialMutedState]);

  useEffect(() => {
    setIsConversationArchived(initialArchivedState);
  }, [initialArchivedState]);

  const renderIncomingAvatar = (message?: LocalMessage) => {
    const avatarUri = isGroupConversation
      ? String(message?.senderAvatarUri || '')
      : hasPeerAvatarImage
        ? peerAvatarUri
        : '';
    const senderInitialSource = isGroupConversation
      ? message?.senderName || message?.senderUsername || 'U'
      : peerName || 'U';
    const senderInitial = senderInitialSource.slice(0, 1).toUpperCase();

    if (avatarUri && avatarUri !== NO_PROFILE_IMAGE) {
      return <Image source={{ uri: avatarUri }} style={styles.incomingAvatar} />;
    }

    return (
      <View style={styles.incomingAvatarFallback}>
        <Text style={styles.incomingAvatarInitial}>{senderInitial}</Text>
      </View>
    );
  };

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (isGroupConversation && groupId) {
        setActiveGroupConversationId(groupId);
      } else if (peerUserId) {
        setActiveDirectConversationPeerId(peerUserId);
      }

      return () => {
        if (isGroupConversation) {
          clearActiveGroupConversationId(groupId);
          return;
        }

        clearActiveDirectConversationPeerId(peerUserId);
      };
    }, [groupId, isGroupConversation, peerUserId])
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
    let offGroupMessage: (() => void) | undefined;
    let offStatus: (() => void) | undefined;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setLoadError('');
      setIsPeerKeyMissing(false);
      setIsDMsDisabled(false);
      hasScrolledToLatestRef.current = false;

      if (isGroupConversation) {
        if (!groupId) {
          setMessages([]);
          setLoadError('Unable to open this group right now.');
          setIsBootstrapping(false);
          return;
        }

        try {
          await connectChatSocket();

          const history = await loadGroupConversation({
            groupId,
            token: token || undefined,
            limit: 50,
          });

          if (!isMounted) {
            return;
          }

          setMessages(
            sortMessages(
              history.map((entry) => {
                const parsed = parseChatMessagePayload(String(entry.plaintextPayload || ''));
                return {
                  id: entry._id,
                  senderId: String(entry.senderId || ''),
                  receiverId: '',
                  text: parsed.type === 'text' ? normalizeMessageText(parsed.text) : parsed.text,
                  status: 'sent',
                  createdAt: entry.createdAt || new Date().toISOString(),
                  mediaType: parsed.type !== 'text' ? parsed.type : undefined,
                  mediaUrl: parsed.mediaUrl,
                  senderName: typeof entry.senderName === 'string' ? entry.senderName : '',
                  senderUsername:
                    typeof entry.senderUsername === 'string' ? entry.senderUsername : '',
                  senderAvatarUri:
                    typeof entry.senderAvatarUri === 'string' ? entry.senderAvatarUri : '',
                  conversationType: 'group',
                  groupId,
                };
              })
            )
          );

          offGroupMessage = await onChatGroupMessage((payload: any) => {
            if (!isMounted) {
              return;
            }

            const payloadGroupId = String(payload?.groupId || '');
            const senderId = String(payload?.senderId || '');
            if (!payload?._id || !payloadGroupId || payloadGroupId !== groupId || !senderId) {
              return;
            }

            if (senderId === currentUserId) {
              return;
            }

            const parsed = parseChatMessagePayload(String(payload?.plaintextPayload || ''));
            setMessages((prev) => {
              if (prev.some((message) => message.id === String(payload._id))) {
                return prev;
              }

              return sortMessages([
                ...prev,
                {
                  id: String(payload._id),
                  senderId,
                  receiverId: '',
                  text: parsed.type === 'text' ? normalizeMessageText(parsed.text) : parsed.text,
                  status: 'sent',
                  createdAt: payload.createdAt || new Date().toISOString(),
                  mediaType: parsed.type !== 'text' ? parsed.type : undefined,
                  mediaUrl: parsed.mediaUrl,
                  senderName: typeof payload.senderName === 'string' ? payload.senderName : '',
                  senderUsername:
                    typeof payload.senderUsername === 'string' ? payload.senderUsername : '',
                  senderAvatarUri:
                    typeof payload.senderAvatarUri === 'string' ? payload.senderAvatarUri : '',
                  conversationType: 'group',
                  groupId,
                },
              ]);
            });
          });
        } catch (error) {
          if (__DEV__) {
            console.log('[ChatDetail] group bootstrap failed', error);
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
      if (offGroupMessage) {
        offGroupMessage();
      }
      if (offStatus) {
        offStatus();
      }
    };
  }, [currentUserId, groupId, isGroupConversation, peerUserId, token]);

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
      if (!currentUserId || messages.length < 1) {
        return undefined;
      }

      if (isGroupConversation) {
        if (!groupId) {
          return undefined;
        }

        const incomingGroupIds = messages
          .filter((message) => message.senderId && message.senderId !== currentUserId)
          .map((message) => message.id);

        if (incomingGroupIds.length < 1) {
          setChatConversationUnread(currentConversationUnreadKey, false);
          lastReadSyncSignatureRef.current = '';
          return undefined;
        }

        const signature = incomingGroupIds.join(',');
        if (lastReadSyncSignatureRef.current === signature) {
          return undefined;
        }

        lastReadSyncSignatureRef.current = signature;
        markGroupConversationRead(groupId, token || undefined)
          .then(() => {
            setChatConversationUnread(currentConversationUnreadKey, false);
          })
          .catch(() => {
            lastReadSyncSignatureRef.current = '';
          });

        return undefined;
      }

      if (!peerUserId || !isValidMongoObjectId(peerUserId)) {
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
        setChatConversationUnread(currentConversationUnreadKey, false);
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
          if (result.ok && result.messageIds.length > 0) {
            const readMessageIds = new Set(result.messageIds.map(String));
            setMessages((prev) =>
              prev.map((message) =>
                readMessageIds.has(message.id) ? { ...message, status: 'read' } : message
              )
            );
          }
          setChatConversationUnread(currentConversationUnreadKey, false);
        })
        .catch(() => {
          lastReadSyncSignatureRef.current = '';
        });

      return undefined;
    }, [
      currentConversationUnreadKey,
      currentUserId,
      groupId,
      isGroupConversation,
      messages,
      peerUserId,
      token,
    ])
  );

  const peerLabel = peerName || 'This user';

  const buildConversationTargetPayload = useCallback(() => {
    if (isGroupConversation) {
      return {
        conversationType: 'group' as const,
        groupId: String(routeParams?.conversationType === 'group' ? routeParams.groupId || '' : ''),
      };
    }

    return {
      conversationType: 'direct' as const,
      peerUserId: isValidMongoObjectId(peerUserId) ? peerUserId : '',
    };
  }, [isGroupConversation, peerUserId, routeParams]);

  const handleArchiveChat = useCallback(async () => {
    const targetPayload = buildConversationTargetPayload();
    const targetId =
      targetPayload.conversationType === 'group' ? targetPayload.groupId : targetPayload.peerUserId;
    const nextArchived = !isConversationArchived;

    if (!targetId || optionsActionLoading) {
      return;
    }

    setOptionsActionLoading('archive');
    try {
      const response = await updateChatConversationArchiveState(
        {
          ...targetPayload,
          isArchived: nextArchived,
        },
        token || undefined
      );

      if (response.status !== 200) {
        const message = (response.response as { message?: string })?.message;
        throw new Error(message || 'Unable to archive chat right now.');
      }

      setIsConversationArchived(nextArchived);
      navigation.setParams({ ...(routeParams as object), isArchived: nextArchived } as never);
      setIsOptionsVisible(false);
      if (nextArchived) {
        navigation.goBack();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : nextArchived
            ? 'Unable to archive chat right now.'
            : 'Unable to unarchive chat right now.';
      Alert.alert(nextArchived ? 'Archive Failed' : 'Unarchive Failed', message);
    } finally {
      setOptionsActionLoading(null);
    }
  }, [
    buildConversationTargetPayload,
    isConversationArchived,
    navigation,
    optionsActionLoading,
    routeParams,
    token,
  ]);

  const handleToggleMuteChat = useCallback(async () => {
    const targetPayload = buildConversationTargetPayload();
    const targetId =
      targetPayload.conversationType === 'group' ? targetPayload.groupId : targetPayload.peerUserId;

    if (!targetId || optionsActionLoading) {
      return;
    }

    const nextMuted = !isConversationMuted;
    setOptionsActionLoading('mute');
    try {
      const response = await updateChatConversationMuteState(
        {
          ...targetPayload,
          isMuted: nextMuted,
        },
        token || undefined
      );

      if (response.status !== 200) {
        const message = (response.response as { message?: string })?.message;
        throw new Error(message || 'Unable to update notification settings right now.');
      }

      setIsConversationMuted(nextMuted);
      navigation.setParams({ ...(routeParams as object), isMuted: nextMuted } as never);
      setIsOptionsVisible(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update notification settings right now.';
      Alert.alert('Update Failed', message);
    } finally {
      setOptionsActionLoading(null);
    }
  }, [
    buildConversationTargetPayload,
    isConversationMuted,
    navigation,
    optionsActionLoading,
    routeParams,
    token,
  ]);

  const handleBlockUser = useCallback(async () => {
    if (!peerUserId || optionsActionLoading) {
      return;
    }

    setOptionsActionLoading('block');
    try {
      const response = await ApiCall<{ message?: string }>({
        route: `user/unsubscribe/${peerUserId}`,
        verb: 'patch',
        token: token || undefined,
      });

      if (response.status !== 200) {
        const message = (response.response as { message?: string })?.message;
        throw new Error(message || 'Unable to block user right now.');
      }

      setIsOptionsVisible(false);
      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to block user right now.';
      Alert.alert('Block Failed', message);
    } finally {
      setOptionsActionLoading(null);
    }
  }, [navigation, optionsActionLoading, peerUserId, token]);

  const handleReportConversation = useCallback(() => {
    if (optionsActionLoading) {
      return;
    }

    Alert.alert('Coming Soon', 'Conversation reporting is coming soon.');
  }, [optionsActionLoading]);

  const sendMessage = useCallback(async () => {
    const content = draft.trim();
    if (
      !content ||
      isSending ||
      (!isGroupConversation && !peerUserId) ||
      (isGroupConversation && !groupId)
    ) {
      return;
    }

    if (!isGroupConversation && isPeerKeyMissing) {
      Alert.alert(
        'Secure Chat Unavailable',
        `${peerLabel} has not enabled secure messaging yet. Ask them to open Messages in OneBody first.`
      );
      return;
    }

    if (!isGroupConversation && isDMsDisabled) {
      Alert.alert('Direct Messages Disabled', `${peerLabel} has turned off direct messages.`);
      return;
    }

    if (!isGroupConversation) {
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
    }

    setIsSending(true);
    setDraft('');

    const optimisticMessage: LocalMessage = {
      id: `local-${Date.now()}`,
      senderId: currentUserId || 'me',
      receiverId: isGroupConversation ? '' : peerUserId,
      text: content,
      status: 'sent',
      createdAt: new Date().toISOString(),
      senderName: currentUser?.name || currentUser?.username || 'Me',
      senderUsername: currentUser?.username || '',
      senderAvatarUri:
        typeof currentUser?.profileImage === 'string' ? currentUser.profileImage : '',
      conversationType: isGroupConversation ? 'group' : 'direct',
      groupId: isGroupConversation ? groupId : undefined,
    };

    setMessages((prev) => sortMessages([...prev, optimisticMessage]));

    try {
      const response = isGroupConversation
        ? await sendGroupTextMessage({
            groupId,
            text: content,
          })
        : await sendEncryptedTextMessage({
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
                  senderName:
                    typeof ackMessage.senderName === 'string'
                      ? ackMessage.senderName
                      : optimisticMessage.senderName,
                  senderUsername:
                    typeof ackMessage.senderUsername === 'string'
                      ? ackMessage.senderUsername
                      : optimisticMessage.senderUsername,
                  senderAvatarUri:
                    typeof ackMessage.senderAvatarUri === 'string'
                      ? ackMessage.senderAvatarUri
                      : optimisticMessage.senderAvatarUri,
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
    currentUser?.name,
    currentUser?.profileImage,
    currentUser?.username,
    currentUserId,
    draft,
    groupId,
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
    (isGroupConversation ? !groupId : !peerUserId || isPeerKeyMissing || isDMsDisabled);

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
      if ((!isGroupConversation && !peerUserId) || (isGroupConversation && !groupId)) {
        return;
      }

      const normalizedCaption = normalizeMessageText(args.text || '');

      const optimisticMessage: LocalMessage = {
        id: `local-${Date.now()}`,
        senderId: currentUserId || 'me',
        receiverId: isGroupConversation ? '' : peerUserId,
        text: normalizedCaption,
        status: 'sent',
        createdAt: new Date().toISOString(),
        mediaType: args.mediaType,
        mediaUrl: args.mediaUrl,
        senderName: currentUser?.name || currentUser?.username || 'Me',
        senderUsername: currentUser?.username || '',
        senderAvatarUri:
          typeof currentUser?.profileImage === 'string' ? currentUser.profileImage : '',
        conversationType: isGroupConversation ? 'group' : 'direct',
        groupId: isGroupConversation ? groupId : undefined,
      };

      setMessages((prev) => sortMessages([...prev, optimisticMessage]));

      try {
        const response = isGroupConversation
          ? await sendGroupMediaMessage({
              groupId,
              mediaType: args.mediaType,
              mediaUrl: args.mediaType === 'image' ? args.mediaUrl : undefined,
              giphyId: args.mediaType === 'gif' ? args.giphyId : undefined,
              text: normalizedCaption,
            })
          : await sendEncryptedMediaMessage({
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
    [
      currentUser?.name,
      currentUser?.profileImage,
      currentUser?.username,
      currentUserId,
      groupId,
      isGroupConversation,
      peerUserId,
      token,
    ]
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
    if (
      !pendingMedia ||
      (!isGroupConversation && !peerUserId) ||
      (isGroupConversation && !groupId) ||
      isSending ||
      isUploading
    ) {
      return;
    }

    if (!isGroupConversation && isPeerKeyMissing) {
      Alert.alert(
        'Secure Chat Unavailable',
        `${peerLabel} has not enabled secure messaging yet. Ask them to open Messages in OneBody first.`
      );
      return;
    }

    if (!isGroupConversation && isDMsDisabled) {
      Alert.alert('Direct Messages Disabled', `${peerLabel} has turned off direct messages.`);
      return;
    }

    if (!isGroupConversation) {
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
    groupId,
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
  const shouldShowLoader = isBootstrapping;
  const shouldShowErrorState = !isBootstrapping && Boolean(loadError);
  const shouldShowConversationList = !shouldShowLoader && !shouldShowErrorState;
  const isComposerDisabled =
    isSending ||
    isUploading ||
    (isGroupConversation ? !groupId : !peerUserId || isPeerKeyMissing || isDMsDisabled);
  let composerPlaceholder = 'Write your message';
  if (!isGroupConversation && isPeerKeyMissing) {
    composerPlaceholder = 'Secure chat unavailable for this user';
  } else if (!isGroupConversation && isDMsDisabled) {
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
    if (!isGroupConversation && isPeerKeyMissing) {
      emptyStateMessage = 'This user has not enabled secure messaging yet.';
    } else if (!isGroupConversation && isDMsDisabled) {
      emptyStateMessage = 'This user has turned off direct messages.';
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
        ListEmptyComponent={
          <View style={styles.emptyConversationWrap}>
            <Text style={[styles.emptyConversationText, { color: colors.text }]}>
              {emptyStateMessage}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMine = item.senderId === currentUserId;
          const isRead = item.status === 'read';
          const hasMediaCaption = item.mediaType && normalizeMessageText(item.text).length > 0;
          const previousMessage = index > 0 ? messages[index - 1] : undefined;
          const shouldShowDateSeparator =
            !previousMessage || !isSameLocalCalendarDay(item.createdAt, previousMessage.createdAt);
          let bubbleColor: { backgroundColor: string; padding?: number } = isMine
            ? { backgroundColor: '#126b87' }
            : { backgroundColor: 'rgba(18, 210, 217, 0.15)' };
          if (item.mediaType) {
            bubbleColor = hasMediaCaption
              ? bubbleColor
              : { backgroundColor: 'transparent', padding: 0 };
          }
          return (
            <View>
              {shouldShowDateSeparator ? (
                <Text style={[styles.timeLabel, { color: isDark ? '#9ca3af' : '#8a9098' }]}>
                  {formatConversationTimestamp(item.createdAt)}
                </Text>
              ) : null}
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
                    {isGroupConversation ? (
                      <View style={styles.statusWrap}>
                        <Text style={styles.timeText}>{formatMessageTime(item.createdAt)}</Text>
                      </View>
                    ) : (
                      <View style={styles.statusWrap}>
                        <Text style={styles.timeText}>{formatMessageTime(item.createdAt)}</Text>
                        {isRead ? (
                          <Image source={{ uri: peerAvatarUri }} style={styles.statusAvatar} />
                        ) : null}
                        <Text style={styles.statusText}>{isRead ? 'Seen' : item.status}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.incomingRow}>
                    {renderIncomingAvatar(item)}
                    <View style={styles.incomingBody}>
                      {isGroupConversation && (item.senderName || item.senderUsername) ? (
                        <Text style={styles.groupSenderLabel}>
                          {item.senderName || `@${item.senderUsername}`}
                        </Text>
                      ) : null}
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
        <Pressable style={styles.iconButton} onPress={() => setIsOptionsVisible(true)}>
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
            selectionColor="#126b87"
            cursorColor="#126b87"
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
          <GifIcon size={24} color="#126b87" />
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

      <ChatOptions
        visible={isOptionsVisible}
        onClose={() => {
          if (!optionsActionLoading) {
            setIsOptionsVisible(false);
          }
        }}
        isMuted={isConversationMuted}
        isArchived={isConversationArchived}
        onArchive={handleArchiveChat}
        onToggleMute={handleToggleMuteChat}
        onBlock={handleBlockUser}
        onReport={handleReportConversation}
        canBlock={canShowBlockAndReport}
        canReport={canShowBlockAndReport}
        isArchiveLoading={optionsActionLoading === 'archive'}
        isMuteLoading={optionsActionLoading === 'mute'}
        isBlockLoading={optionsActionLoading === 'block'}
        isReportLoading={optionsActionLoading === 'report'}
      />

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
                  selectionColor="#126b87"
                  cursorColor="#126b87"
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
  groupSenderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#126b87',
    marginBottom: 4,
    marginLeft: 2,
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
