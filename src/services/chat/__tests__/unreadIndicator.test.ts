import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
  applyLocalConversationReadOverrides,
  getChatUnreadCountSnapshot,
  publishChatUnreadFromConversations,
  resetChatUnreadIndicator,
  setChatConversationUnread,
  useChatUnreadCount,
} from '../unreadIndicator';

describe('unreadIndicator', () => {
  afterEach(() => {
    resetChatUnreadIndicator();
  });

  it('recomputes the total count when clearing a group conversation key', () => {
    publishChatUnreadFromConversations([
      {
        id: 'group:65f000000000000000000020',
        conversationType: 'group',
        groupId: '65f000000000000000000020',
        groupName: 'Prayer team',
        peerUserId: '',
        peerName: 'Prayer team',
        lastMessagePreview: 'New message',
        updatedAt: new Date().toISOString(),
        unreadCount: 3,
      },
      {
        id: 'c-65f000000000000000000021',
        conversationType: 'direct',
        peerUserId: '65f000000000000000000021',
        peerName: 'Direct thread',
        lastMessagePreview: 'New message',
        updatedAt: new Date().toISOString(),
        unreadCount: 2,
      },
    ]);

    expect(getChatUnreadCountSnapshot()).toBe(5);

    setChatConversationUnread('group:65f000000000000000000020', false);

    expect(getChatUnreadCountSnapshot()).toBe(2);
  });

  it('notifies subscribers when the total changes but the unread keys stay the same', () => {
    const observedCounts: number[] = [];

    function Probe() {
      observedCounts.push(useChatUnreadCount());
      return null;
    }

    let renderer: TestRenderer.ReactTestRenderer | null = null;

    act(() => {
      renderer = TestRenderer.create(React.createElement(Probe));
    });

    act(() => {
      publishChatUnreadFromConversations([
        {
          id: 'group:65f000000000000000000030',
          conversationType: 'group',
          groupId: '65f000000000000000000030',
          groupName: 'Care team',
          peerUserId: '',
          peerName: 'Care team',
          lastMessagePreview: 'New message',
          updatedAt: new Date().toISOString(),
          unreadCount: 3,
        },
      ]);
    });

    act(() => {
      publishChatUnreadFromConversations([
        {
          id: 'group:65f000000000000000000030',
          conversationType: 'group',
          groupId: '65f000000000000000000030',
          groupName: 'Care team',
          peerUserId: '',
          peerName: 'Care team',
          lastMessagePreview: 'New message',
          updatedAt: new Date().toISOString(),
          unreadCount: 1,
        },
      ]);
    });

    expect(observedCounts).toEqual([0, 3, 1]);

    act(() => {
      renderer?.unmount();
    });
  });

  it('applies local read overrides to stale server conversation data', () => {
    setChatConversationUnread('group:65f000000000000000000040', false);

    expect(
      applyLocalConversationReadOverrides([
        {
          id: 'group:65f000000000000000000040',
          conversationType: 'group',
          groupId: '65f000000000000000000040',
          groupName: 'Group thread',
          peerUserId: '',
          peerName: 'Group thread',
          lastMessagePreview: 'Existing message',
          updatedAt: new Date(Date.now() - 10_000).toISOString(),
          unreadCount: 4,
        },
      ])
    ).toEqual([
      expect.objectContaining({
        groupId: '65f000000000000000000040',
        unreadCount: 0,
      }),
    ]);
  });
});
