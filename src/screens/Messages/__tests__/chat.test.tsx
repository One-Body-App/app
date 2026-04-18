import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import ChatListScreen from '../chat';

const mockUseSelector = jest.fn();
const mockFetchChatConversations = jest.fn();
const mockEnsureChatReady = jest.fn();
const mockConnectChatSocket = jest.fn();
const mockPublishChatUnreadFromConversations = jest.fn();
const mockResetChatUnreadIndicator = jest.fn();
const mockApplyLocalConversationReadOverrides = jest.fn((items) => items);
const mockSubscribeToConversationListReadEvents = jest.fn(() => jest.fn());

jest.mock('@react-navigation/native', () => {
  const ReactLocal = jest.requireActual('react');

  return {
    useTheme: jest.fn(() => ({
      dark: false,
      colors: {
        background: '#ffffff',
        border: '#d9dfe2',
        card: '#f3f6f8',
        text: '#032f3c',
      },
    })),
    useFocusEffect: jest.fn((callback) => {
      ReactLocal.useEffect(() => callback(), [callback]);
    }),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => mockUseSelector(selector),
}));

jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcons');
jest.mock('@/assets/icons/chat.svg', () => 'ChatIcon');

jest.mock('@/src/components/GlassTabBar', () => {
  const ReactLocal = jest.requireActual('react');
  const {
    Pressable: MockPressable,
    Text: MockText,
    View: MockView,
  } = jest.requireActual('react-native');

  return function MockGlassTabBar({
    tabs,
    activeIndex,
    onTabChange,
  }: {
    tabs: string[];
    activeIndex: number;
    onTabChange: (index: number) => void;
  }) {
    return ReactLocal.createElement(
      MockView,
      { testID: 'mock-glass-tab-bar', activeIndex },
      tabs.map((tab, index) =>
        ReactLocal.createElement(
          MockPressable,
          {
            key: tab,
            testID: `mock-glass-tab-${index}`,
            onPress: () => onTabChange(index),
          },
          ReactLocal.createElement(MockText, null, tab)
        )
      )
    );
  };
});

jest.mock('@/src/components/chat/MessagesConversationListView', () => ({
  MessagesConversationListView: ({ conversations }: { conversations: { title: string }[] }) => {
    const { Text: MockText, View: MockView } = jest.requireActual('react-native');

    return (
      <MockView testID="messages-conversation-list-view">
        {conversations.map((conversation) => (
          <MockText key={conversation.title}>{conversation.title}</MockText>
        ))}
      </MockView>
    );
  },
}));

jest.mock('@/src/components/chat/SwipeableChatItem', () => ({
  SwipeableChatItem: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../chatempty', () => 'ChatEmptyState');

jest.mock('@/src/services/chat/api', () => ({
  fetchChatConversations: (...args: unknown[]) => mockFetchChatConversations(...args),
  updateChatConversationArchiveState: jest.fn(),
  updateChatConversationMuteState: jest.fn(),
  deleteDirectChatConversation: jest.fn(),
  deleteChatGroup: jest.fn(),
  leaveChatGroup: jest.fn(),
}));

jest.mock('@/src/services/chat/socketClient', () => ({
  connectChatSocket: (...args: unknown[]) => mockConnectChatSocket(...args),
  onChatMessage: jest.fn(async () => jest.fn()),
  onChatGroupMessage: jest.fn(async () => jest.fn()),
}));

jest.mock('@/src/services/chat/chatClient', () => ({
  ensureChatReady: (...args: unknown[]) => mockEnsureChatReady(...args),
  parseChatMessagePayload: jest.fn(() => ({ type: 'text', text: '' })),
  setConversationReadState: jest.fn(),
}));

jest.mock('@/src/services/chat/unreadIndicator', () => ({
  applyLocalConversationReadOverrides: (...args: unknown[]) =>
    mockApplyLocalConversationReadOverrides(...args),
  publishChatUnreadFromConversations: (...args: unknown[]) =>
    mockPublishChatUnreadFromConversations(...args),
  resetChatUnreadIndicator: (...args: unknown[]) => mockResetChatUnreadIndicator(...args),
}));

jest.mock('@/src/services/chat/conversationListReadEvent', () => ({
  subscribeToConversationListReadEvents: (...args: unknown[]) =>
    mockSubscribeToConversationListReadEvents(...args),
}));

jest.mock('@/src/services/chat/conversationReadState', () => ({
  syncConversationReadMutationLocally: jest.fn(),
}));

jest.mock('@/src/services/chat/activeConversation', () => ({
  getActiveDirectConversationPeerId: jest.fn(() => ''),
  getActiveGroupConversationId: jest.fn(() => ''),
}));

const conversations = [
  {
    id: 'direct-1',
    conversationType: 'direct',
    peerUserId: 'user-2',
    peerName: 'Inbox Friend',
    peerUsername: 'inboxfriend',
    lastMessagePreview: '@inboxfriend',
    updatedAt: '2026-03-24T18:00:00.000Z',
    unreadCount: 1,
    isArchived: false,
    isMuted: false,
    lastMessageId: 'm-1',
  },
  {
    id: 'group-1',
    conversationType: 'group',
    groupId: 'group-1',
    groupName: 'Prayer Group',
    peerName: 'Prayer Group',
    lastMessagePreview: 'Latest group message',
    updatedAt: '2026-03-24T18:05:00.000Z',
    unreadCount: 0,
    isArchived: false,
    isMuted: false,
    lastMessageId: 'm-2',
  },
  {
    id: 'archived-1',
    conversationType: 'direct',
    peerUserId: 'user-3',
    peerName: 'Archived Friend',
    peerUsername: 'archivedfriend',
    lastMessagePreview: '@archivedfriend',
    updatedAt: '2026-03-24T18:10:00.000Z',
    unreadCount: 0,
    isArchived: true,
    isMuted: false,
    lastMessageId: 'm-3',
  },
];

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('ChatListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockImplementation((selector) =>
      selector({
        auth: {
          userToken: 'token-123',
          getProfileData: {
            _id: 'user-1',
            profileImage: '',
          },
        },
      })
    );
    mockFetchChatConversations.mockResolvedValue({
      status: 200,
      response: {
        data: conversations,
      },
    });
    mockEnsureChatReady.mockResolvedValue(undefined);
    mockConnectChatSocket.mockResolvedValue(undefined);
  });

  it('renders the shared tab labels and filters the conversation list by tab', async () => {
    const navigation = {
      navigate: jest.fn(),
      getParent: jest.fn(() => ({
        getParent: jest.fn(() => ({
          navigate: jest.fn(),
        })),
      })),
    } as any;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ChatListScreen navigation={navigation} route={{} as any} />);
    });
    await flushEffects();

    expect(renderer!.root.findAllByType(Text).some((node) => node.props.children === 'Inbox')).toBe(
      true
    );
    expect(
      renderer!.root.findAllByType(Text).some((node) => node.props.children === 'Groups')
    ).toBe(true);
    expect(
      renderer!.root.findAllByType(Text).some((node) => node.props.children === 'Archived')
    ).toBe(true);

    const currentTitles = () =>
      renderer!.root
        .findAllByType(Text)
        .map((node) => node.props.children)
        .filter((value) => typeof value === 'string');

    expect(currentTitles()).toContain('Inbox Friend');
    expect(currentTitles()).not.toContain('Prayer Group');
    expect(currentTitles()).not.toContain('Archived Friend');

    act(() => {
      renderer!.root.findByProps({ testID: 'chat-filter-groups' }).props.onPress();
    });

    expect(currentTitles()).not.toContain('Inbox Friend');
    expect(currentTitles()).toContain('Prayer Group');
    expect(currentTitles()).not.toContain('Archived Friend');

    act(() => {
      renderer!.root.findByProps({ testID: 'chat-filter-archived' }).props.onPress();
    });

    expect(currentTitles()).not.toContain('Inbox Friend');
    expect(currentTitles()).not.toContain('Prayer Group');
    expect(currentTitles()).toContain('Archived Friend');
  });

  it('hides the search bar by default and reveals it from the header action', async () => {
    const navigation = {
      navigate: jest.fn(),
      getParent: jest.fn(() => ({
        getParent: jest.fn(() => ({
          navigate: jest.fn(),
        })),
      })),
    } as any;

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ChatListScreen navigation={navigation} route={{} as any} />);
    });
    await flushEffects();

    expect(renderer!.root.findAllByProps({ testID: 'chat-search-wrap' })).toHaveLength(0);

    act(() => {
      renderer!.root.findByProps({ testID: 'chat-search-button' }).props.onPress();
    });

    expect(renderer!.root.findByProps({ testID: 'chat-search-wrap' })).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'chat-search-input' })).toBeTruthy();
  });
});
