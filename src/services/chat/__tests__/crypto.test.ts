const mockReady = Promise.resolve();
const mockFromBase64 = jest.fn();
const mockRandombytesBuf = jest.fn();
const mockCryptoBoxEasy = jest.fn();
const mockCryptoBoxOpenEasy = jest.fn();

jest.mock('react-native-libsodium', () => ({
  ready: mockReady,
  base64_variants: {
    ORIGINAL: 'ORIGINAL',
  },
  crypto_box_NONCEBYTES: 24,
  from_base64: (...args: any[]) => mockFromBase64(...args),
  randombytes_buf: (...args: any[]) => mockRandombytesBuf(...args),
  crypto_box_easy: (...args: any[]) => mockCryptoBoxEasy(...args),
  crypto_box_open_easy: (...args: any[]) => mockCryptoBoxOpenEasy(...args),
}));

jest.mock('react-native-quick-crypto', () => ({
  Buffer,
}));

describe('chat crypto', () => {
  beforeEach(() => {
    jest.resetModules();
    mockFromBase64.mockReset();
    mockRandombytesBuf.mockReset();
    mockCryptoBoxEasy.mockReset();
    mockCryptoBoxOpenEasy.mockReset();

    mockRandombytesBuf.mockReturnValue(Uint8Array.from({ length: 24 }, (_, index) => index + 1));
    mockCryptoBoxEasy.mockReturnValue(Uint8Array.from([111, 222, 123, 45]));
    mockCryptoBoxOpenEasy.mockReturnValue(Buffer.from('hello world', 'utf8'));
  });

  it('encrypts with crypto_box_easy and marks the box scheme in authTag', async () => {
    mockFromBase64
      .mockReturnValueOnce(Uint8Array.from([9, 9, 9]))
      .mockReturnValueOnce(Uint8Array.from([7, 7, 7]));

    // eslint-disable-next-line global-require
    const crypto = require('../crypto') as typeof import('../crypto');

    const encrypted = await crypto.encryptE2EEMessage({
      plaintext: 'hello world',
      myPrivateKeyBase64: 'my-private-key',
      peerPublicKeyBase64: 'peer-public-key',
      aad: 'meta',
    });

    expect(mockRandombytesBuf).toHaveBeenCalledWith(24);
    expect(mockCryptoBoxEasy).toHaveBeenCalledWith(
      new Uint8Array(Buffer.from('hello world', 'utf8')),
      Uint8Array.from({ length: 24 }, (_, index) => index + 1),
      Uint8Array.from([7, 7, 7]),
      Uint8Array.from([9, 9, 9])
    );
    expect(encrypted).toEqual({
      encryptedPayload: Buffer.from([111, 222, 123, 45]).toString('base64'),
      nonce: Buffer.from(Uint8Array.from({ length: 24 }, (_, index) => index + 1)).toString(
        'base64'
      ),
      authTag: 'box:v1',
      aad: 'meta',
    });
  });

  it('decrypts messages that use the box scheme marker', async () => {
    mockFromBase64
      .mockReturnValueOnce(Uint8Array.from([9, 9, 9]))
      .mockReturnValueOnce(Uint8Array.from([7, 7, 7]))
      .mockReturnValueOnce(Uint8Array.from([1, 2, 3]))
      .mockReturnValueOnce(Uint8Array.from([4, 5, 6]));

    // eslint-disable-next-line global-require
    const crypto = require('../crypto') as typeof import('../crypto');

    const decrypted = await crypto.decryptE2EEMessage({
      encryptedPayload: 'cipher-b64',
      nonce: 'nonce-b64',
      authTag: 'box:v1',
      myPrivateKeyBase64: 'my-private-key',
      peerPublicKeyBase64: 'peer-public-key',
    });

    expect(mockCryptoBoxOpenEasy).toHaveBeenCalledWith(
      Uint8Array.from([4, 5, 6]),
      Uint8Array.from([1, 2, 3]),
      Uint8Array.from([7, 7, 7]),
      Uint8Array.from([9, 9, 9])
    );
    expect(decrypted).toBe('hello world');
  });

  it('throws an actionable error when required libsodium bindings are unavailable', async () => {
    jest.resetModules();
    jest.doMock('react-native-libsodium', () => ({
      ready: mockReady,
      base64_variants: {
        ORIGINAL: 'ORIGINAL',
      },
      crypto_box_NONCEBYTES: 24,
      from_base64: (...args: any[]) => mockFromBase64(...args),
      randombytes_buf: (...args: any[]) => mockRandombytesBuf(...args),
      crypto_box_easy: undefined,
      crypto_box_open_easy: (...args: any[]) => mockCryptoBoxOpenEasy(...args),
    }));

    // eslint-disable-next-line global-require
    const crypto = require('../crypto') as typeof import('../crypto');

    await expect(
      crypto.encryptE2EEMessage({
        plaintext: 'hello world',
        myPrivateKeyBase64: 'my-private-key',
        peerPublicKeyBase64: 'peer-public-key',
      })
    ).rejects.toThrow(
      'Secure messaging is unavailable right now. Please restart the app and try again.'
    );
  });
});
