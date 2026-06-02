import { Image } from 'expo-image';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
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
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MessagesStackParamsList } from '@/src/navigator/types';
import {
  APP_HEADER_CONTENT_GAP,
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_TITLE_LINE_HEIGHT,
} from '@/src/styles/headerLayout';
import {
  ChatTransportError,
  connectChatSocket,
  onChatGroupMessage,
  onChatMessage,
  onChatMessageReaction,
  onChatMessageStatus,
} from '@/src/services/chat/socketClient';
import {
  decryptDirectMessageEnvelope,
  loadAndDecryptConversation,
  loadGroupConversation,
  ensureChatReady,
  reactToMessage,
  sendGroupMediaMessage,
  sendGroupTextMessage,
  sendEncryptedTextMessage,
  sendEncryptedMediaMessage,
  parseChatMessagePayload,
  setConversationReadState,
} from '@/src/services/chat/chatClient';
import {
  ChatMessageReaction,
  ChatMessageReactionUpdate,
  ChatReactionType,
} from '@/src/services/chat/types';
import ChatInput, { ChatInputAttachment, ChatInputSendPayload } from '@/components/chat/ChatInput';
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
  setConversationUnreadStateLocally,
  syncConversationReadMutationLocally,
} from '@/src/services/chat/conversationReadState';
import { isValidMongoObjectId } from '@/src/services/chat/conversationTarget';
import useMountEffect from '@/src/hooks/useMountEffect';
import { STANDARD_SECONDARY_LIST_BATCH_CONFIG } from '@/src/navigator/motionPolicy';
import ChatOptions from './chatoptions';

type Props = NativeStackScreenProps<MessagesStackParamsList, 'ChatDetail'>;

type LocalMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  mediaType?: 'image' | 'gif' | 'images';
  mediaUrl?: string;
  mediaUrls?: string[];
  senderName?: string;
  senderUsername?: string;
  senderAvatarUri?: string;
  conversationType?: 'direct' | 'group';
  groupId?: string;
  reactions?: ChatMessageReaction[];
};

const REACTION_ORDER: ChatReactionType[] = [
  'like',
  'love',
  'praying',
  'praise',
  'haha',
  'wow',
  'sad',
  'angry',
];
const REACTION_EMOJI_MAP: Record<ChatReactionType, string> = {
  like: '👍',
  love: '❤️',
  praying: '🙏',
  praise: '🙌',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};

type ReactionPickerState = {
  messageId: string;
  top: number;
  left: number;
};

type ReactionBadgeSummary = {
  emojis: string[];
  count: number;
  currentUserReaction?: ChatReactionType;
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

const normalizeReactionType = (value?: string): ChatReactionType | undefined => {
  switch (
    String(value || '')
      .trim()
      .toLowerCase()
  ) {
    case 'like':
      return 'like';
    case 'love':
      return 'love';
    case 'praying':
      return 'praying';
    case 'praise':
    case 'happy':
      return 'praise';
    case 'haha':
      return 'haha';
    case 'wow':
      return 'wow';
    case 'sad':
      return 'sad';
    case 'angry':
      return 'angry';
    default:
      return undefined;
  }
};

const normalizeChatReactions = (value: unknown): ChatMessageReaction[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<ChatMessageReaction[]>((accumulator, item) => {
    if (!item || typeof item !== 'object') {
      return accumulator;
    }

    const record = item as Record<string, unknown>;
    const type = normalizeReactionType(typeof record.type === 'string' ? record.type : '');
    const userId = typeof record.userId === 'string' ? record.userId.trim() : '';
    if (!type || !userId) {
      return accumulator;
    }

    accumulator.push({
      type,
      userId,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
    });
    return accumulator;
  }, []);
};

const applyReactionUpdateToMessages = (
  previousMessages: LocalMessage[],
  messageId: string,
  reactions: ChatMessageReaction[]
) =>
  previousMessages.map((message) =>
    message.id === messageId
      ? { ...message, reactions: normalizeChatReactions(reactions) }
      : message
  );

const getCurrentUserReaction = (
  reactions: ChatMessageReaction[] | undefined,
  userId: string
): ChatReactionType | undefined => {
  if (!userId) {
    return undefined;
  }

  return reactions?.find((reaction) => reaction.userId === userId)?.type;
};

const getReactionBadgeSummary = (
  reactions: ChatMessageReaction[] | undefined,
  userId: string
): ReactionBadgeSummary | null => {
  const normalizedReactions = normalizeChatReactions(reactions);
  if (!normalizedReactions.length) {
    return null;
  }

  const distinctEmojis: string[] = [];
  normalizedReactions.forEach((reaction) => {
    const emoji = REACTION_EMOJI_MAP[reaction.type];
    if (emoji && !distinctEmojis.includes(emoji) && distinctEmojis.length < 2) {
      distinctEmojis.push(emoji);
    }
  });

  return {
    emojis: distinctEmojis,
    count: normalizedReactions.length,
    currentUserReaction: getCurrentUserReaction(normalizedReactions, userId),
  };
};

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
  const { width: windowWidth } = useWindowDimensions();
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
  const groupId =
    routeParams?.conversationType === 'group' ? String(routeParams.groupId || '') : '';
  const targetMessageId =
    typeof routeParams?.messageId === 'string' ? routeParams.messageId.trim() : '';
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isPeerKeyMissing, setIsPeerKeyMissing] = useState(false);
  const [isDMsDisabled, setIsDMsDisabled] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [optionsActionLoading, setOptionsActionLoading] = useState<
    'archive' | 'mute' | 'block' | 'report' | null
  >(null);
  const [composerAttachments, setComposerAttachments] = useState<ChatInputAttachment[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [fullscreenMediaUrls, setFullscreenMediaUrls] = useState<string[]>([]);
  const [fullscreenMediaIndex, setFullscreenMediaIndex] = useState(0);
  const [reactionPickerState, setReactionPickerState] = useState<ReactionPickerState | null>(null);
  const [reactingMessageId, setReactingMessageId] = useState('');
  const [highlightedMessageId, setHighlightedMessageId] = useState('');
  const flatListRef = useRef<FlatList<LocalMessage>>(null);
  const messageAnchorRefs = useRef<Record<string, View | null>>({});
  const messageLayoutMapRef = useRef<Record<string, { y: number; height: number }>>({});
  const lastReadSyncSignatureRef = useRef('');
  const hasScrolledToLatestRef = useRef(false);
  const hasHandledInitialMessageFocusRef = useRef(false);
  const lastTargetMessageIdRef = useRef('');
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rateLimitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserId = currentUser?._id ? String(currentUser._id) : '';
  const isConversationMuted = Boolean(routeParams?.isMuted);
  const isConversationArchived = Boolean(routeParams?.isArchived);
  const hasPeerAvatarImage = Boolean(peerAvatarUri && peerAvatarUri !== NO_PROFILE_IMAGE);
  const canShowBlockAndReport = !isGroupConversation && Boolean(peerUserId);
  const currentConversationTarget = useMemo(
    () =>
      isGroupConversation
        ? {
            conversationType: 'group' as const,
            groupId,
          }
        : {
            conversationType: 'direct' as const,
            peerUserId,
          },
    [groupId, isGroupConversation, peerUserId]
  );

  const renderIncomingAvatar = (message?: LocalMessage) => {
    let avatarUri = '';
    if (isGroupConversation) {
      avatarUri = String(message?.senderAvatarUri || '');
    } else if (hasPeerAvatarImage) {
      avatarUri = peerAvatarUri;
    }

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

  useMountEffect(() => {
    navigation.setOptions({ headerShown: false });
  });

  useMountEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }
    };
  });

  const registerMessageAnchor = useCallback((messageId: string, node: View | null) => {
    if (!messageId) {
      return;
    }

    if (node) {
      messageAnchorRefs.current[messageId] = node;
      return;
    }

    delete messageAnchorRefs.current[messageId];
  }, []);

  const handleMessageLayout = useCallback((messageId: string, event: LayoutChangeEvent) => {
    if (!messageId) {
      return;
    }

    messageLayoutMapRef.current[messageId] = {
      y: event.nativeEvent.layout.y,
      height: event.nativeEvent.layout.height,
    };
  }, []);

  const focusTargetMessage = useCallback(
    (messageId: string) => {
      if (!messageId) {
        return;
      }

      const messageIndex = messages.findIndex((message) => message.id === messageId);
      if (messageIndex < 0) {
        return;
      }

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index: messageIndex,
          animated: true,
          viewPosition: 0.5,
        });
      });

      setHighlightedMessageId(messageId);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMessageId((currentValue) => (currentValue === messageId ? '' : currentValue));
      }, 2200);
    },
    [messages]
  );

  const handleOpenReactionPicker = useCallback(
    (message: LocalMessage) => {
      if (!message.id || message.id.startsWith('local-')) {
        return;
      }

      const anchor = messageAnchorRefs.current[message.id];
      if (!anchor || typeof anchor.measureInWindow !== 'function') {
        return;
      }

      anchor.measureInWindow((x, y, measuredWidth) => {
        const pickerWidth = Math.min(windowWidth - 24, 336);
        const left = Math.min(
          Math.max(12, x + measuredWidth / 2 - pickerWidth / 2),
          Math.max(12, windowWidth - pickerWidth - 12)
        );
        const top = Math.max(insets.top + 8, y - 58);

        setReactionPickerState({
          messageId: message.id,
          top,
          left,
        });
      });
    },
    [insets.top, windowWidth]
  );

  const applyReactionUpdate = useCallback(
    (payload: Pick<ChatMessageReactionUpdate, 'messageId' | 'reactions'>) => {
      if (!payload?.messageId) {
        return;
      }

      setMessages((previousMessages) =>
        applyReactionUpdateToMessages(
          previousMessages,
          String(payload.messageId),
          normalizeChatReactions(payload.reactions)
        )
      );
    },
    []
  );

  const openFullscreenMedia = useCallback((urls: string[], index = 0) => {
    const normalizedUrls = urls.flatMap((item) => {
      const normalizedUrl = String(item || '').trim();
      return normalizedUrl ? [normalizedUrl] : [];
    });
    if (normalizedUrls.length < 1) {
      return;
    }

    setFullscreenMediaUrls(normalizedUrls);
    setFullscreenMediaIndex(Math.max(0, Math.min(index, normalizedUrls.length - 1)));
  }, []);

  const activateRateLimit = useCallback((retryAfterMs?: number) => {
    setIsRateLimited(true);
    if (rateLimitTimeoutRef.current) {
      clearTimeout(rateLimitTimeoutRef.current);
    }
    rateLimitTimeoutRef.current = setTimeout(
      () => {
        setIsRateLimited(false);
      },
      Math.max(1500, Number(retryAfterMs || 0))
    );
  }, []);

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

  useMountEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  });

  useMountEffect(() => {
    notifee.cancelAllNotifications().catch(() => undefined);
    notifee.setBadgeCount(0).catch(() => undefined);
  });

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      let offMessage: (() => void) | undefined;
      let offGroupMessage: (() => void) | undefined;
      let offStatus: (() => void) | undefined;
      let offReaction: (() => void) | undefined;

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
                    mediaUrls: parsed.mediaUrls,
                    senderName: typeof entry.senderName === 'string' ? entry.senderName : '',
                    senderUsername:
                      typeof entry.senderUsername === 'string' ? entry.senderUsername : '',
                    senderAvatarUri:
                      typeof entry.senderAvatarUri === 'string' ? entry.senderAvatarUri : '',
                    conversationType: 'group',
                    groupId,
                    reactions: normalizeChatReactions(entry.reactions),
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
                    mediaUrls: parsed.mediaUrls,
                    senderName: typeof payload.senderName === 'string' ? payload.senderName : '',
                    senderUsername:
                      typeof payload.senderUsername === 'string' ? payload.senderUsername : '',
                    senderAvatarUri:
                      typeof payload.senderAvatarUri === 'string' ? payload.senderAvatarUri : '',
                    conversationType: 'group',
                    groupId,
                    reactions: normalizeChatReactions(payload.reactions),
                  },
                ]);
              });
            });

            offReaction = await onChatMessageReaction((payload) => {
              if (!isMounted || !payload?.messageId) {
                return;
              }

              const payloadGroupId = String(payload.groupId || '');
              if (payload.conversationType !== 'group' || payloadGroupId !== groupId) {
                return;
              }

              applyReactionUpdate(payload);
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
                  mediaUrls: parsed.mediaUrls,
                  reactions: normalizeChatReactions(entry.reactions),
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

              let nextText = '[Encrypted message]';
              let nextMediaType: LocalMessage['mediaType'] =
                payload.messageType === 'image' ||
                payload.messageType === 'gif' ||
                payload.messageType === 'images'
                  ? payload.messageType
                  : undefined;
              let nextMediaUrl: string | undefined;
              let nextMediaUrls: string[] | undefined;

              try {
                const plaintext = await decryptDirectMessageEnvelope({
                  message: payload,
                  peerUserId,
                  token: token || undefined,
                });
                const parsed = parseChatMessagePayload(plaintext);
                nextText = parsed.type === 'text' ? normalizeMessageText(parsed.text) : parsed.text;
                nextMediaType = parsed.type !== 'text' ? parsed.type : undefined;
                nextMediaUrl = parsed.mediaUrl;
                nextMediaUrls = parsed.mediaUrls;
              } catch {
                // Keep the existing encrypted placeholder fallback when decrypt context fails.
              }

              if (!isMounted) {
                return;
              }

              setMessages((prev) =>
                sortMessages([
                  ...prev,
                  {
                    id: String(payload._id),
                    senderId,
                    receiverId,
                    text: nextText,
                    status: payload.status || 'sent',
                    createdAt: payload.createdAt || new Date().toISOString(),
                    mediaType: nextMediaType,
                    mediaUrl: nextMediaUrl,
                    mediaUrls: nextMediaUrls,
                    reactions: normalizeChatReactions(payload.reactions),
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

            offReaction = await onChatMessageReaction((payload) => {
              if (!isMounted || !payload?.messageId) {
                return;
              }

              if (payload.conversationType === 'group') {
                return;
              }

              const senderId = String(payload.senderId || '');
              const receiverId = String(payload.receiverId || '');
              if (
                !senderId ||
                !receiverId ||
                ![peerUserId, currentUserId].includes(senderId) ||
                ![peerUserId, currentUserId].includes(receiverId)
              ) {
                return;
              }

              applyReactionUpdate(payload);
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
        if (offReaction) {
          offReaction();
        }
      };
    }, [applyReactionUpdate, currentUserId, groupId, isGroupConversation, peerUserId, token])
  );

  useFocusEffect(
    useCallback(() => {
      if (!messages.length) {
        return undefined;
      }

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: hasScrolledToLatestRef.current });
        hasScrolledToLatestRef.current = true;
      });
      return undefined;
    }, [messages])
  );

  useFocusEffect(
    useCallback(() => {
      if (targetMessageId !== lastTargetMessageIdRef.current) {
        hasHandledInitialMessageFocusRef.current = false;
        lastTargetMessageIdRef.current = targetMessageId;
      }

      if (!targetMessageId) {
        setHighlightedMessageId('');
        return undefined;
      }

      if (hasHandledInitialMessageFocusRef.current) {
        return undefined;
      }

      if (!messages.some((message) => message.id === targetMessageId)) {
        return undefined;
      }

      hasHandledInitialMessageFocusRef.current = true;
      focusTargetMessage(targetMessageId);
      return undefined;
    }, [focusTargetMessage, messages, targetMessageId])
  );

  useFocusEffect(
    useCallback(() => {
      lastReadSyncSignatureRef.current = '';
      return () => {
        lastReadSyncSignatureRef.current = '';
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId || messages.length < 1) {
        return undefined;
      }

      const targetSignaturePrefix = isGroupConversation
        ? `group:${groupId}`
        : `direct:${peerUserId}`;

      if (isGroupConversation) {
        if (!groupId) {
          return undefined;
        }

        const incomingGroupIds = messages
          .filter((message) => message.senderId && message.senderId !== currentUserId)
          .map((message) => message.id);

        if (incomingGroupIds.length < 1) {
          setConversationUnreadStateLocally(currentConversationTarget, true);
          lastReadSyncSignatureRef.current = '';
          return undefined;
        }

        const signature = `${targetSignaturePrefix}:${incomingGroupIds.join(',')}`;
        if (lastReadSyncSignatureRef.current === signature) {
          return undefined;
        }

        lastReadSyncSignatureRef.current = signature;
        setConversationReadState(currentConversationTarget, true, token || undefined)
          .then(() => {
            syncConversationReadMutationLocally(currentConversationTarget, true);
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
        setConversationUnreadStateLocally(currentConversationTarget, true);
        lastReadSyncSignatureRef.current = '';
        return undefined;
      }

      const signature = `${targetSignaturePrefix}:${unreadIncomingIds.join(',')}`;
      if (lastReadSyncSignatureRef.current === signature) {
        return undefined;
      }

      lastReadSyncSignatureRef.current = signature;
      setConversationReadState(currentConversationTarget, true, token || undefined)
        .then((result) => {
          if (result.conversationType === 'direct' && result.messageIds.length > 0) {
            const readMessageIds = new Set(result.messageIds.map(String));
            setMessages((prev) =>
              prev.map((message) =>
                readMessageIds.has(message.id) ? { ...message, status: 'read' } : message
              )
            );
          }
          syncConversationReadMutationLocally(currentConversationTarget, true);
        })
        .catch(() => {
          lastReadSyncSignatureRef.current = '';
        });
      return undefined;
    }, [
      currentConversationTarget,
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

      navigation.setParams({ ...(routeParams as object), isArchived: nextArchived } as never);
      setIsOptionsVisible(false);
      if (nextArchived) {
        navigation.goBack();
      }
    } catch (error) {
      let message = nextArchived
        ? 'Unable to archive chat right now.'
        : 'Unable to unarchive chat right now.';
      if (error instanceof Error) {
        message = error.message;
      }
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

  const ensureConversationCanSend = useCallback(async () => {
    if ((!isGroupConversation && !peerUserId) || (isGroupConversation && !groupId)) {
      return false;
    }

    if (!isGroupConversation && isPeerKeyMissing) {
      Alert.alert(
        'Secure Chat Unavailable',
        `${peerLabel} has not enabled secure messaging yet. Ask them to open Messages in OneBody first.`
      );
      return false;
    }

    if (!isGroupConversation && isDMsDisabled) {
      Alert.alert('Direct Messages Disabled', `${peerLabel} has turned off direct messages.`);
      return false;
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
          return false;
        }
        Alert.alert('Unable to send message', getSendFailureMessage(error));
        return false;
      }
    }

    return true;
  }, [groupId, isDMsDisabled, isGroupConversation, isPeerKeyMissing, peerLabel, peerUserId, token]);

  const handleComposerSend = useCallback(
    async (payload: ChatInputSendPayload) => {
      const normalizedText = normalizeMessageText(payload.text || '');
      const attachments = [...payload.attachments];
      if (
        isSending ||
        isUploading ||
        (!normalizedText && attachments.length < 1) ||
        !(await ensureConversationCanSend())
      ) {
        return;
      }

      const gifAttachment = attachments.find((attachment) => attachment.type === 'gif');
      const imageAttachments = attachments.filter((attachment) => attachment.type === 'image');
      let mediaType: LocalMessage['mediaType'];
      if (gifAttachment) {
        mediaType = 'gif';
      } else if (imageAttachments.length > 1) {
        mediaType = 'images';
      } else if (imageAttachments.length === 1) {
        mediaType = 'image';
      }

      const optimisticMediaUrls = imageAttachments.map((attachment) => attachment.previewUrl);
      const optimisticMessage: LocalMessage = {
        id: `local-${Date.now()}`,
        senderId: currentUserId || 'me',
        receiverId: isGroupConversation ? '' : peerUserId,
        text: normalizedText,
        status: 'sent',
        createdAt: new Date().toISOString(),
        mediaType,
        mediaUrl: gifAttachment?.previewUrl || optimisticMediaUrls[0],
        mediaUrls: mediaType === 'images' ? optimisticMediaUrls : undefined,
        senderName: currentUser?.name || currentUser?.username || 'Me',
        senderUsername: currentUser?.username || '',
        senderAvatarUri:
          typeof currentUser?.profileImage === 'string' ? currentUser.profileImage : '',
        conversationType: isGroupConversation ? 'group' : 'direct',
        groupId: isGroupConversation ? groupId : undefined,
        reactions: [],
      };

      setIsSending(true);
      setDraft('');
      setComposerAttachments([]);
      setMessages((prev) => sortMessages([...prev, optimisticMessage]));

      try {
        let uploadedImageUrls: string[] = [];
        if (imageAttachments.length > 0) {
          setIsUploading(true);
          uploadedImageUrls = await Promise.all(
            imageAttachments.map((attachment, index) => {
              if (!attachment.uploadUri) {
                throw new Error('Selected image is unavailable');
              }

              return uploadChatMediaFile(
                attachment.uploadUri,
                attachment.fileName || `chat_${Date.now()}_${index}.jpg`,
                attachment.mimeType || 'image/jpeg',
                token || undefined
              );
            })
          );
        }

        let response;
        if (mediaType === 'gif') {
          response = isGroupConversation
            ? await sendGroupMediaMessage({
                groupId,
                mediaType: 'gif',
                giphyId: gifAttachment?.giphyId,
                text: normalizedText,
              })
            : await sendEncryptedMediaMessage({
                receiverId: peerUserId,
                mediaType: 'gif',
                giphyId: gifAttachment?.giphyId,
                text: normalizedText,
                token: token || undefined,
              });
        } else if (mediaType === 'images') {
          response = isGroupConversation
            ? await sendGroupMediaMessage({
                groupId,
                mediaType: 'images',
                mediaUrls: uploadedImageUrls,
                text: normalizedText,
              })
            : await sendEncryptedMediaMessage({
                receiverId: peerUserId,
                mediaType: 'images',
                mediaUrls: uploadedImageUrls,
                text: normalizedText,
                token: token || undefined,
              });
        } else if (mediaType === 'image') {
          response = isGroupConversation
            ? await sendGroupMediaMessage({
                groupId,
                mediaType: 'image',
                mediaUrl: uploadedImageUrls[0],
                text: normalizedText,
              })
            : await sendEncryptedMediaMessage({
                receiverId: peerUserId,
                mediaType: 'image',
                mediaUrl: uploadedImageUrls[0],
                text: normalizedText,
                token: token || undefined,
              });
        } else {
          response = isGroupConversation
            ? await sendGroupTextMessage({
                groupId,
                text: normalizedText,
              })
            : await sendEncryptedTextMessage({
                receiverId: peerUserId,
                text: normalizedText,
                token: token || undefined,
              });
        }

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
                    reactions: normalizeChatReactions(ackMessage.reactions),
                  }
                : item
            )
          );
        }
      } catch (error) {
        if (error instanceof ChatTransportError && error.code === 'rate-limited') {
          activateRateLimit(error.retryAfterMs);
        } else if (isMissingPeerKeyError(error)) {
          setIsPeerKeyMissing(true);
          Alert.alert(
            'Secure Chat Unavailable',
            `${peerLabel} has not enabled secure messaging yet. Ask them to open Messages in OneBody first.`
          );
        } else {
          Alert.alert('Unable to send message', getSendFailureMessage(error));
        }

        setDraft(normalizedText);
        setComposerAttachments(attachments);
        setMessages((prev) => prev.filter((item) => item.id !== optimisticMessage.id));
      } finally {
        setIsUploading(false);
        setIsSending(false);
      }
    },
    [
      activateRateLimit,
      currentUser?.name,
      currentUser?.profileImage,
      currentUser?.username,
      currentUserId,
      ensureConversationCanSend,
      groupId,
      isGroupConversation,
      isSending,
      isUploading,
      peerLabel,
      peerUserId,
      token,
    ]
  );

  const handleSelectReaction = useCallback(
    async (reactionType: ChatReactionType) => {
      const messageId = reactionPickerState?.messageId || '';
      if (!messageId || reactingMessageId) {
        return;
      }

      setReactingMessageId(messageId);
      setReactionPickerState(null);

      try {
        const response = await reactToMessage({
          messageId,
          reactionType,
        });

        if (response.ok) {
          applyReactionUpdate({
            messageId: response.messageId,
            reactions: response.reactions,
          });
        }
      } catch (error) {
        Alert.alert('Unable to react', getSendFailureMessage(error));
      } finally {
        setReactingMessageId('');
      }
    },
    [applyReactionUpdate, reactingMessageId, reactionPickerState]
  );

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
  const selectedReactionMessage = reactionPickerState
    ? messages.find((message) => message.id === reactionPickerState.messageId)
    : undefined;
  const selectedReactionType = getCurrentUserReaction(
    selectedReactionMessage?.reactions,
    currentUserId
  );

  const renderMediaMessage = useCallback(
    (
      item: LocalMessage,
      isMine: boolean,
      isHighlighted: boolean,
      captionBubbleStyle: { backgroundColor: string }
    ) => {
      if (!item.mediaType) {
        return null;
      }

      const hasCaption = normalizeMessageText(item.text).length > 0;
      let imageUrls: string[] = [];
      if (item.mediaType === 'images') {
        imageUrls = (item.mediaUrls || []).filter(Boolean);
      } else if (item.mediaUrl) {
        imageUrls = [item.mediaUrl];
      }

      let mediaNode: React.ReactNode = null;
      if (item.mediaType === 'images') {
        mediaNode = (
          <View style={styles.mediaGrid}>
            {imageUrls.map((imageUrl, index) => (
              <Pressable
                key={`${item.id}-${imageUrl}`}
                onPress={() => openFullscreenMedia(imageUrls, index)}
                style={styles.mediaGridItem}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.mediaGridImage}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </View>
        );
      } else if (item.mediaUrl) {
        mediaNode = (
          <Pressable
            onPress={() => openFullscreenMedia([item.mediaUrl || ''])}
            style={styles.mediaImageFrame}
          >
            <Image
              source={{ uri: item.mediaUrl }}
              style={styles.mediaBubbleImage}
              contentFit="cover"
            />
          </Pressable>
        );
      }

      return (
        <View style={styles.mediaMessageContent}>
          {mediaNode}
          {hasCaption ? (
            <View
              style={[
                styles.mediaCaptionBubble,
                isMine ? styles.mineBubble : styles.theirsBubble,
                captionBubbleStyle,
                isHighlighted ? styles.highlightedBubble : null,
              ]}
            >
              <Text
                style={[styles.mediaCaptionText, isMine ? styles.mineText : { color: colors.text }]}
              >
                {normalizeMessageText(item.text)}
              </Text>
            </View>
          ) : null}
        </View>
      );
    },
    [colors.text, openFullscreenMedia]
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
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, index * averageItemLength - 120),
            animated: true,
          });
        }}
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
          const isMediaMessage = Boolean(
            item.mediaType && ((item.mediaUrls && item.mediaUrls.length > 0) || item.mediaUrl)
          );
          const singleMediaUrl = item.mediaType !== 'images' ? item.mediaUrl : undefined;
          const reactionBadge = getReactionBadgeSummary(item.reactions, currentUserId);
          const isHighlighted = highlightedMessageId === item.id;
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

          const isImageOnlyMessage = isMediaMessage;
          const bubbleNode = (
            <View
              ref={(node) => registerMessageAnchor(item.id, node)}
              collapsable={false}
              onLayout={(event) => handleMessageLayout(item.id, event)}
              style={[
                styles.messageAnchor,
                reactionBadge ? styles.messageAnchorWithReaction : null,
              ]}
            >
              <Pressable
                onLongPress={() => handleOpenReactionPicker(item)}
                delayLongPress={220}
                disabled={item.id.startsWith('local-')}
                onPress={singleMediaUrl ? () => openFullscreenMedia([singleMediaUrl]) : undefined}
                style={[
                  isImageOnlyMessage ? styles.mediaMessagePressable : styles.messageBubble,
                  !isImageOnlyMessage ? (isMine ? styles.mineBubble : styles.theirsBubble) : null,
                  !isImageOnlyMessage ? bubbleColor : null,
                  !isImageOnlyMessage && isHighlighted ? styles.highlightedBubble : null,
                ]}
              >
                {isMediaMessage ? (
                  renderMediaMessage(item, isMine, isHighlighted, {
                    backgroundColor: isMine ? '#126b87' : 'rgba(18, 210, 217, 0.15)',
                  })
                ) : (
                  <Text
                    style={[styles.messageText, isMine ? styles.mineText : { color: colors.text }]}
                  >
                    {normalizeMessageText(item.text)}
                  </Text>
                )}
              </Pressable>
              {reactionBadge ? (
                <View
                  style={[
                    styles.reactionBadge,
                    isMine ? styles.reactionBadgeMine : styles.reactionBadgeTheirs,
                    reactionBadge.currentUserReaction ? styles.reactionBadgeActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.reactionBadgeEmojiText,
                      reactionBadge.currentUserReaction
                        ? styles.reactionBadgeEmojiTextActive
                        : null,
                    ]}
                  >
                    {reactionBadge.emojis.join(' ')}
                  </Text>
                  {reactionBadge.count > 1 ? (
                    <Text
                      style={[
                        styles.reactionBadgeCountText,
                        reactionBadge.currentUserReaction
                          ? styles.reactionBadgeEmojiTextActive
                          : null,
                      ]}
                    >
                      {reactionBadge.count}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          );

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
                    {bubbleNode}
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
                      {bubbleNode}
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
        removeClippedSubviews={STANDARD_SECONDARY_LIST_BATCH_CONFIG.removeClippedSubviews}
        initialNumToRender={STANDARD_SECONDARY_LIST_BATCH_CONFIG.initialNumToRender}
        maxToRenderPerBatch={STANDARD_SECONDARY_LIST_BATCH_CONFIG.maxToRenderPerBatch}
        updateCellsBatchingPeriod={STANDARD_SECONDARY_LIST_BATCH_CONFIG.updateCellsBatchingPeriod}
        windowSize={STANDARD_SECONDARY_LIST_BATCH_CONFIG.windowSize}
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
          { paddingTop: insets.top, borderBottomColor: isDark ? '#1b1b1b' : '#ececee' },
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

      <Modal
        visible={Boolean(reactionPickerState)}
        transparent
        animationType="fade"
        onRequestClose={() => setReactionPickerState(null)}
      >
        <View style={styles.reactionPickerBackdrop}>
          <Pressable
            style={styles.reactionPickerDismissArea}
            onPress={() => setReactionPickerState(null)}
          />
          <View
            style={[
              styles.reactionPicker,
              {
                top: reactionPickerState?.top || insets.top + 8,
                left: reactionPickerState?.left || 12,
                backgroundColor: isDark ? '#0f2027' : '#ffffff',
              },
            ]}
          >
            {REACTION_ORDER.map((reactionType) => {
              const isSelected = reactionType === selectedReactionType;
              return (
                <Pressable
                  key={reactionType}
                  onPress={() => handleSelectReaction(reactionType)}
                  style={[
                    styles.reactionPickerButton,
                    isSelected ? styles.reactionPickerButtonSelected : null,
                  ]}
                >
                  <Text style={styles.reactionPickerEmoji}>{REACTION_EMOJI_MAP[reactionType]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      <View
        style={[
          styles.inputRow,
          {
            paddingBottom:
              Platform.OS === 'ios' && keyboardVisible ? 8 : Math.max(insets.bottom, 8),
            backgroundColor: isDark ? colors.background : '#ffffff',
          },
        ]}
      >
        <ChatInput
          value={draft}
          onChangeText={setDraft}
          onSend={handleComposerSend}
          attachments={composerAttachments}
          onAttachmentsChange={setComposerAttachments}
          isSending={isSending}
          isUploading={isUploading}
          isRateLimited={isRateLimited}
          disabled={isComposerDisabled}
          placeholder={composerPlaceholder}
        />
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

      {fullscreenMediaUrls.length > 0 ? (
        <ImageView
          images={fullscreenMediaUrls.map((uri) => ({ uri }))}
          imageIndex={fullscreenMediaIndex}
          visible
          presentationStyle="overFullScreen"
          onRequestClose={() => {
            setFullscreenMediaUrls([]);
            setFullscreenMediaIndex(0);
          }}
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
    minHeight: APP_HEADER_ROW_HEIGHT,
    paddingBottom: 4,
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
    paddingBottom: 2,
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
    lineHeight: 22,
  },
  headerUsername: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 18,
    color: '#68828a',
  },
  contentWrap: {
    flex: 1,
    paddingTop: APP_HEADER_CONTENT_GAP,
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
  messageAnchor: {
    position: 'relative',
  },
  messageAnchorWithReaction: {
    paddingBottom: 14,
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
  highlightedBubble: {
    shadowColor: '#12d2d9',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    borderWidth: 1,
    borderColor: 'rgba(18, 210, 217, 0.55)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 18,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: 0,
    minHeight: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: 'rgba(18, 107, 135, 0.18)',
  },
  reactionBadgeMine: {
    right: 10,
  },
  reactionBadgeTheirs: {
    right: 10,
  },
  reactionBadgeActive: {
    backgroundColor: '#126b87',
    borderColor: '#126b87',
  },
  reactionBadgeEmojiText: {
    fontSize: 11,
    color: '#126b87',
    fontWeight: '700',
  },
  reactionBadgeEmojiTextActive: {
    color: '#ffffff',
  },
  reactionBadgeCountText: {
    fontSize: 10,
    color: '#126b87',
    fontWeight: '700',
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
  reactionPickerBackdrop: {
    flex: 1,
  },
  reactionPickerDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  reactionPicker: {
    position: 'absolute',
    width: 336,
    maxWidth: '94%',
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  reactionPickerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionPickerButtonSelected: {
    backgroundColor: 'rgba(18, 107, 135, 0.12)',
  },
  reactionPickerEmoji: {
    fontSize: 20,
  },
  inputRow: {
    width: '100%',
  },
  mediaMessageContent: {
    gap: 8,
  },
  mediaMessagePressable: {
    alignSelf: 'flex-start',
  },
  mediaGrid: {
    width: 220,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mediaGridItem: {
    width: 107,
    height: 107,
    borderRadius: 14,
    overflow: 'hidden',
  },
  mediaGridImage: {
    width: '100%',
    height: '100%',
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
  mediaCaptionBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  mediaCaptionText: {
    fontSize: 15,
    lineHeight: 20,
  },
});

export default ChatDetailScreen;
