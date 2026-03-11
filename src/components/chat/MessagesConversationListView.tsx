import React from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  requireNativeComponent,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

type NativeConversationType = 'direct' | 'group';
type NativeDestructiveAction = 'delete' | 'leave';

export type MessagesConversationListNativeRow = {
  id: string;
  conversationType: NativeConversationType;
  title: string;
  subtitle: string;
  avatarUri?: string;
  avatarFallback: string;
  timeLabel: string;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  canArchive: boolean;
  canMute: boolean;
  canToggleRead: boolean;
  destructiveAction: NativeDestructiveAction;
};

type ConversationActionEvent = NativeSyntheticEvent<{
  id: string;
  nextMuted?: boolean;
  nextRead?: boolean;
}>;

type NativeProps = ViewProps & {
  conversations: MessagesConversationListNativeRow[];
  bottomInset?: number;
  onPressConversation?: (event: ConversationActionEvent) => void;
  onMuteConversation?: (event: ConversationActionEvent) => void;
  onToggleReadConversation?: (event: ConversationActionEvent) => void;
  onArchiveConversation?: (event: ConversationActionEvent) => void;
  onDestructiveConversation?: (event: ConversationActionEvent) => void;
};

type Props = {
  conversations: MessagesConversationListNativeRow[];
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
  onPressConversation?: (id: string) => void;
  onMuteConversation?: (id: string, nextMuted: boolean) => void;
  onToggleReadConversation?: (id: string, nextRead: boolean) => void;
  onArchiveConversation?: (id: string) => void;
  onDestructiveConversation?: (id: string) => void;
};

const NativeMessagesConversationListView =
  Platform.OS === 'ios'
    ? requireNativeComponent<NativeProps>('MessagesConversationListView')
    : (View as unknown as React.ComponentType<NativeProps>);

function MessagesConversationListView({
  conversations,
  bottomInset,
  style,
  onPressConversation,
  onMuteConversation,
  onToggleReadConversation,
  onArchiveConversation,
  onDestructiveConversation,
}: Props) {
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <NativeMessagesConversationListView
      style={style}
      conversations={conversations}
      bottomInset={bottomInset}
      onPressConversation={
        onPressConversation ? (event) => onPressConversation(event.nativeEvent.id) : undefined
      }
      onMuteConversation={
        onMuteConversation
          ? (event) =>
              onMuteConversation(event.nativeEvent.id, Boolean(event.nativeEvent.nextMuted))
          : undefined
      }
      onToggleReadConversation={
        onToggleReadConversation
          ? (event) =>
              onToggleReadConversation(event.nativeEvent.id, Boolean(event.nativeEvent.nextRead))
          : undefined
      }
      onArchiveConversation={
        onArchiveConversation ? (event) => onArchiveConversation(event.nativeEvent.id) : undefined
      }
      onDestructiveConversation={
        onDestructiveConversation
          ? (event) => onDestructiveConversation(event.nativeEvent.id)
          : undefined
      }
    />
  );
}

export { MessagesConversationListView };
