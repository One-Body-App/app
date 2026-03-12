const mockEmitChatConversationRead = jest.fn();
const mockMarkChatConversationRead = jest.fn();
const mockUpdateChatConversationReadState = jest.fn();

class MockChatTransportError extends Error {
  public readonly code: string;

  public constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

jest.mock('../socketClient', () => ({
  emitChatConversationRead: (...args: any[]) => mockEmitChatConversationRead(...args),
  emitChatDelivered: jest.fn(),
  emitChatRead: jest.fn(),
  sendChatE2EEMessage: jest.fn(),
  ChatTransportError: MockChatTransportError,
}));

jest.mock('../api', () => ({
  fetchConversationMessages: jest.fn(),
  markChatConversationRead: (...args: any[]) => mockMarkChatConversationRead(...args),
  updateChatConversationReadState: (...args: any[]) => mockUpdateChatConversationReadState(...args),
  updateChatMessageStatus: jest.fn(),
}));

jest.mock('../keyManager', () => ({
  ensureChatKeypair: jest.fn(),
  getMyChatKeypair: jest.fn(),
  getPeerPublicKey: jest.fn(),
}));

jest.mock('../crypto', () => ({
  decryptE2EEMessage: jest.fn(),
  encryptE2EEMessage: jest.fn(),
}));

jest.mock('../contentHash', () => ({
  buildChatContentHash: jest.fn(() => 'a'.repeat(64)),
}));

describe('chatClient markConversationRead', () => {
  let chatClient: typeof import('../chatClient');

  beforeEach(() => {
    jest.resetModules();
    mockEmitChatConversationRead.mockReset();
    mockMarkChatConversationRead.mockReset();
    mockUpdateChatConversationReadState.mockReset();
    // eslint-disable-next-line global-require
    chatClient = require('../chatClient') as typeof import('../chatClient');
  });

  it('returns the socket response when realtime read sync succeeds', async () => {
    mockEmitChatConversationRead.mockResolvedValue({
      ok: true,
      peerUserId: 'peer-1',
      updatedCount: 2,
      messageIds: ['m1', 'm2'],
    });

    await expect(chatClient.markConversationRead('peer-1', 'token')).resolves.toEqual({
      ok: true,
      peerUserId: 'peer-1',
      updatedCount: 2,
      messageIds: ['m1', 'm2'],
    });
    expect(mockMarkChatConversationRead).not.toHaveBeenCalled();
  });

  it('falls back to the REST endpoint when realtime read sync times out', async () => {
    mockEmitChatConversationRead.mockRejectedValue(
      new MockChatTransportError('timeout', 'transport-timeout')
    );
    mockMarkChatConversationRead.mockResolvedValue({
      status: 200,
      response: {
        data: {
          peerUserId: 'peer-1',
          updatedCount: 1,
          messageIds: ['m1'],
        },
      },
    });

    await expect(chatClient.markConversationRead('peer-1', 'token')).resolves.toEqual({
      ok: true,
      peerUserId: 'peer-1',
      updatedCount: 1,
      messageIds: ['m1'],
    });
    expect(mockMarkChatConversationRead).toHaveBeenCalledWith('peer-1', 'token');
  });

  it('marks a group conversation read with the group target payload', async () => {
    mockUpdateChatConversationReadState.mockResolvedValue({
      status: 200,
      response: {
        data: {
          groupId: 'group-1',
          updatedCount: 0,
          messageIds: [],
        },
      },
    });

    await expect(chatClient.markGroupConversationRead('group-1', 'token')).resolves.toEqual({
      ok: true,
      groupId: 'group-1',
      updatedCount: 0,
      messageIds: [],
    });

    expect(mockUpdateChatConversationReadState).toHaveBeenCalledWith(
      {
        conversationType: 'group',
        groupId: 'group-1',
        isRead: true,
      },
      'token'
    );
  });
});
