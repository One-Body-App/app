import {
  applyConversationReadEventToConversations,
  subscribeToConversationListReadEvents,
} from '../conversationListReadEvent';

const mockSubscribeToChatConversationRead = jest.fn();

jest.mock('../conversationReadSync', () => ({
  subscribeToChatConversationRead: (...args: any[]) => mockSubscribeToChatConversationRead(...args),
}));

describe('conversationListReadEvent', () => {
  beforeEach(() => {
    mockSubscribeToChatConversationRead.mockReset();
  });

  it('clears unread state for the matching group row only', () => {
    const conversations = [
      {
        id: 'group:65f000000000000000000020',
        conversationType: 'group' as const,
        groupId: '65f000000000000000000020',
        groupName: 'Prayer team',
        peerUserId: '',
        peerName: 'Prayer team',
        lastMessagePreview: 'New message',
        updatedAt: '2026-03-12T12:00:00.000Z',
        unreadCount: 3,
      },
      {
        id: 'group:65f000000000000000000021',
        conversationType: 'group' as const,
        groupId: '65f000000000000000000021',
        groupName: 'Care team',
        peerUserId: '',
        peerName: 'Care team',
        lastMessagePreview: 'Existing message',
        updatedAt: '2026-03-12T11:00:00.000Z',
        unreadCount: 2,
      },
    ];

    expect(
      applyConversationReadEventToConversations(conversations, {
        conversationType: 'group',
        groupId: '65f000000000000000000020',
      })
    ).toEqual([
      expect.objectContaining({
        groupId: '65f000000000000000000020',
        unreadCount: 0,
      }),
      expect.objectContaining({
        groupId: '65f000000000000000000021',
        unreadCount: 2,
      }),
    ]);
  });

  it('clears unread state and marks the matching direct row read', () => {
    const conversations = [
      {
        id: '65f000000000000000000010',
        conversationType: 'direct' as const,
        peerUserId: '65f000000000000000000010',
        peerName: 'Direct thread',
        lastMessagePreview: '[Encrypted message]',
        updatedAt: '2026-03-12T12:00:00.000Z',
        unreadCount: 1,
        lastMessageStatus: 'delivered' as const,
      },
      {
        id: '65f000000000000000000011',
        conversationType: 'direct' as const,
        peerUserId: '65f000000000000000000011',
        peerName: 'Another thread',
        lastMessagePreview: '[Encrypted message]',
        updatedAt: '2026-03-12T11:00:00.000Z',
        unreadCount: 4,
        lastMessageStatus: 'delivered' as const,
      },
    ];

    expect(
      applyConversationReadEventToConversations(conversations, {
        conversationType: 'direct',
        peerUserId: '65f000000000000000000010',
      })
    ).toEqual([
      expect.objectContaining({
        peerUserId: '65f000000000000000000010',
        unreadCount: 0,
        lastMessageStatus: 'read',
      }),
      expect.objectContaining({
        peerUserId: '65f000000000000000000011',
        unreadCount: 4,
        lastMessageStatus: 'delivered',
      }),
    ]);
  });

  it('returns the same array when no conversation matches the read event', () => {
    const conversations = [
      {
        id: 'group:65f000000000000000000030',
        conversationType: 'group' as const,
        groupId: '65f000000000000000000030',
        groupName: 'Group thread',
        peerUserId: '',
        peerName: 'Group thread',
        lastMessagePreview: 'New message',
        updatedAt: '2026-03-12T12:00:00.000Z',
        unreadCount: 0,
      },
    ];

    expect(
      applyConversationReadEventToConversations(conversations, {
        conversationType: 'group',
        groupId: '65f000000000000000000099',
      })
    ).toBe(conversations);
  });

  it('subscribes to read events and applies the local row update without any fetch dependency', () => {
    let listener: ((event: { conversationType: 'group'; groupId?: string }) => void) | null = null;
    const setConversations = jest.fn();
    const previousRows = [
      {
        id: 'group:65f000000000000000000040',
        conversationType: 'group' as const,
        groupId: '65f000000000000000000040',
        groupName: 'Prayer team',
        peerUserId: '',
        peerName: 'Prayer team',
        lastMessagePreview: 'New message',
        updatedAt: '2026-03-12T12:00:00.000Z',
        unreadCount: 2,
      },
    ];

    mockSubscribeToChatConversationRead.mockImplementation((callback) => {
      listener = callback;
      return jest.fn();
    });

    subscribeToConversationListReadEvents(setConversations);
    listener?.({
      conversationType: 'group',
      groupId: '65f000000000000000000040',
    });

    expect(mockSubscribeToChatConversationRead).toHaveBeenCalledTimes(1);
    expect(setConversations).toHaveBeenCalledTimes(1);

    const updater = setConversations.mock.calls[0]?.[0];
    expect(typeof updater).toBe('function');
    expect(updater(previousRows)).toEqual([
      expect.objectContaining({
        groupId: '65f000000000000000000040',
        unreadCount: 0,
      }),
    ]);
  });
});
