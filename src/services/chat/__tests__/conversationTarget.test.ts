import {
  isGroupConversationItem,
  isValidMongoObjectId,
  resolveConversationTargetPayload,
  resolveDirectPeerUserId,
  resolveGroupId,
} from '../conversationTarget';

describe('conversationTarget', () => {
  it('accepts valid Mongo object ids', () => {
    expect(isValidMongoObjectId('65f000000000000000000010')).toBe(true);
    expect(isValidMongoObjectId('bad-peer-id')).toBe(false);
  });

  it('resolves a direct peer id from the explicit peerUserId field', () => {
    expect(
      resolveDirectPeerUserId({
        id: 'thread-1',
        peerUserId: '65f000000000000000000010',
      })
    ).toBe('65f000000000000000000010');
  });

  it('resolves a direct peer id from the socket conversation id fallback', () => {
    expect(
      resolveDirectPeerUserId({
        id: 'c-65f000000000000000000011',
        peerUserId: '',
      })
    ).toBe('65f000000000000000000011');
  });

  it('rejects invalid direct conversation targets', () => {
    expect(
      resolveConversationTargetPayload({
        conversationType: 'direct',
        id: 'thread-1',
        peerUserId: 'bad-peer-id',
        groupId: '',
      })
    ).toBeNull();
  });

  it('resolves valid group conversation targets', () => {
    expect(
      isGroupConversationItem({ conversationType: 'group', id: 'row-1', groupId: 'group-1' })
    ).toBe(true);
    expect(resolveGroupId({ id: 'group:group-2', groupId: '' })).toBe('group-2');
    expect(
      resolveConversationTargetPayload({
        conversationType: 'group',
        id: 'group:group-2',
        groupId: '',
        peerUserId: '',
      })
    ).toEqual({
      conversationType: 'group',
      groupId: 'group-2',
    });
  });
});
