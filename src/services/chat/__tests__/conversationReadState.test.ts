import { getChatUnreadCountSnapshot, resetChatUnreadIndicator } from '../unreadIndicator';
import {
  resolveConversationReadTarget,
  syncConversationReadMutationLocally,
} from '../conversationReadState';

const mockPublishChatConversationRead = jest.fn();

jest.mock('../conversationReadSync', () => ({
  publishChatConversationRead: (...args: any[]) => mockPublishChatConversationRead(...args),
}));

describe('conversationReadState', () => {
  beforeEach(() => {
    mockPublishChatConversationRead.mockReset();
    resetChatUnreadIndicator();
  });

  it('publishes a group read event and clears the unread count when a group read succeeds', () => {
    syncConversationReadMutationLocally(
      {
        conversationType: 'group',
        groupId: '65f000000000000000000099',
      },
      false,
      3
    );

    expect(getChatUnreadCountSnapshot()).toBe(3);

    syncConversationReadMutationLocally(
      {
        conversationType: 'group',
        groupId: '65f000000000000000000099',
      },
      true
    );

    expect(getChatUnreadCountSnapshot()).toBe(0);
    expect(mockPublishChatConversationRead).toHaveBeenCalledWith({
      conversationType: 'group',
      groupId: '65f000000000000000000099',
    });
  });

  it('stores unread state locally without publishing a read event when marking a direct thread unread', () => {
    syncConversationReadMutationLocally(
      {
        conversationType: 'direct',
        peerUserId: '65f000000000000000000010',
      },
      false,
      1
    );

    expect(getChatUnreadCountSnapshot()).toBe(1);
    expect(mockPublishChatConversationRead).not.toHaveBeenCalled();
  });

  it('resolves a normalized group target from a conversation row', () => {
    expect(
      resolveConversationReadTarget({
        conversationType: 'group',
        id: 'group:65f000000000000000000011',
        groupId: '',
        peerUserId: '',
      })
    ).toEqual({
      conversationType: 'group',
      groupId: '65f000000000000000000011',
      unreadKey: 'group:65f000000000000000000011',
    });
  });
});
