const mockGetGenericPassword = jest.fn();
const mockSetGenericPassword = jest.fn();
const mockRegisterChatPublicKey = jest.fn();
const mockFetchUserChatPublicKey = jest.fn();
const mockCryptoBoxKeypair = jest.fn();
const mockToBase64 = jest.fn();
const mockReady = Promise.resolve();

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
  getGenericPassword: (...args: any[]) => mockGetGenericPassword(...args),
  setGenericPassword: (...args: any[]) => mockSetGenericPassword(...args),
}));

jest.mock('react-native-device-info', () => ({
  getUniqueIdSync: () => 'device-123',
}));

jest.mock('../api', () => ({
  registerChatPublicKey: (...args: any[]) => mockRegisterChatPublicKey(...args),
  fetchUserChatPublicKey: (...args: any[]) => mockFetchUserChatPublicKey(...args),
}));

jest.mock('react-native-libsodium', () => ({
  ready: mockReady,
  base64_variants: {
    ORIGINAL: 'ORIGINAL',
  },
  crypto_box_keypair: (...args: any[]) => mockCryptoBoxKeypair(...args),
  to_base64: (...args: any[]) => mockToBase64(...args),
}));

describe('chat keyManager', () => {
  beforeEach(() => {
    jest.resetModules();
    mockGetGenericPassword.mockReset();
    mockSetGenericPassword.mockReset();
    mockRegisterChatPublicKey.mockReset();
    mockFetchUserChatPublicKey.mockReset();
    mockCryptoBoxKeypair.mockReset();
    mockToBase64.mockReset();

    mockGetGenericPassword.mockResolvedValue(null);
    mockCryptoBoxKeypair.mockReturnValue({
      publicKey: Uint8Array.from([1, 2, 3]),
      privateKey: Uint8Array.from([4, 5, 6]),
    });
    mockToBase64.mockReturnValueOnce('public-key-b64').mockReturnValueOnce('private-key-b64');
    mockRegisterChatPublicKey.mockResolvedValue({
      status: 200,
      response: { data: {} },
    });
  });

  it('generates and registers a keypair using named libsodium exports', async () => {
    // eslint-disable-next-line global-require
    const keyManager = require('../keyManager') as typeof import('../keyManager');

    const result = await keyManager.ensureChatKeypair({ forceRotate: true });

    expect(mockCryptoBoxKeypair).toHaveBeenCalledTimes(1);
    expect(mockToBase64).toHaveBeenNthCalledWith(1, Uint8Array.from([1, 2, 3]), 'ORIGINAL');
    expect(mockToBase64).toHaveBeenNthCalledWith(2, Uint8Array.from([4, 5, 6]), 'ORIGINAL');
    expect(mockRegisterChatPublicKey).toHaveBeenCalledWith(
      expect.objectContaining({
        publicKey: 'public-key-b64',
        algorithm: 'x25519',
        keyVersion: 1,
        deviceId: 'device-123',
      }),
      undefined
    );
    expect(result).toEqual(
      expect.objectContaining({
        publicKey: 'public-key-b64',
        privateKey: 'private-key-b64',
        algorithm: 'x25519',
      })
    );
  });

  it('throws an actionable error when key generation bindings are unavailable', async () => {
    jest.resetModules();
    jest.doMock('react-native-libsodium', () => ({
      ready: mockReady,
      base64_variants: {
        ORIGINAL: 'ORIGINAL',
      },
      crypto_box_keypair: undefined,
      to_base64: (...args: any[]) => mockToBase64(...args),
    }));

    // eslint-disable-next-line global-require
    const keyManager = require('../keyManager') as typeof import('../keyManager');

    await expect(keyManager.ensureChatKeypair({ forceRotate: true })).rejects.toThrow(
      'Secure messaging key setup is unavailable right now. Please restart the app and try again.'
    );
  });
});
