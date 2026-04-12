import {
  clearPendingSocialContinuation,
  loadPendingSocialContinuation,
  savePendingSocialContinuation,
} from './pendingSocialContinuation';

describe('pendingSocialContinuation', () => {
  beforeEach(() => {
    clearPendingSocialContinuation();
  });

  afterEach(() => {
    clearPendingSocialContinuation();
  });

  it('stores and returns the pending continuation payload', () => {
    savePendingSocialContinuation({
      intent: 'login',
      provider: 'google',
      idToken: 'google-id-token',
      nonce: 'nonce',
      details: {
        email: 'person@example.com',
      },
    });

    expect(loadPendingSocialContinuation()).toEqual(
      expect.objectContaining({
        intent: 'login',
        provider: 'google',
        idToken: 'google-id-token',
        nonce: 'nonce',
        details: {
          email: 'person@example.com',
        },
      })
    );
  });

  it('expires and clears stale continuations', () => {
    savePendingSocialContinuation({
      intent: 'login',
      provider: 'apple',
      idToken: 'apple-id-token',
      details: {
        email: 'person@example.com',
      },
    });

    const now = Date.now() + 10 * 60 * 1000 + 1;

    expect(loadPendingSocialContinuation(now)).toBeNull();
    expect(loadPendingSocialContinuation(now)).toBeNull();
  });
});
