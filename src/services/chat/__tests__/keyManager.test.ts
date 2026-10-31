import * as keyManager from '../keyManager';
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockRegister = jest.fn();
const mockOwn = jest.fn();
const mockPeer = jest.fn();
const mockDisconnect = jest.fn();
let mockSequence = 0;
jest.mock('react-native-keychain', () => ({ ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'secure' },
  getGenericPassword: (...args: unknown[]) => mockGet(...args), setGenericPassword: (...args: unknown[]) => mockSet(...args) }));
jest.mock('@/src/services/constants', () => ({ BASE_URL: 'https://api.test/api' }));
jest.mock('../socketClient', () => ({ disconnectChatSocket: () => mockDisconnect() }));
jest.mock('../api', () => ({ registerChatPublicKey: (...args: unknown[]) => mockRegister(...args),
  fetchOwnChatDeviceKeys: (...args: unknown[]) => mockOwn(...args), fetchUserChatDeviceKeys: (...args: unknown[]) => mockPeer(...args) }));
jest.mock('react-native-libsodium', () => ({ ready: Promise.resolve(), base64_variants: { ORIGINAL: 'base64' },
  crypto_box_keypair: () => ({ publicKey: Uint8Array.of(++mockSequence), privateKey: Uint8Array.of(++mockSequence) }),
  to_base64: (bytes: Uint8Array) => Buffer.from(bytes).toString('base64') }));
let storage: Map<string, string>;
beforeEach(() => {
  keyManager.setChatAccount(null);
  jest.clearAllMocks();
  storage = new Map();
  mockGet.mockImplementation(async ({ service }) => storage.has(service) ? { password: storage.get(service) } : false);
  mockSet.mockImplementation(async (_name, password, { service }) => { storage.set(service, password); return true; });
  mockOwn.mockResolvedValue({ status: 200, response: { data: { userId: 'alice', keys: [] } } });
  mockRegister.mockResolvedValue({ status: 200 });
  mockPeer.mockResolvedValue({ status: 200, response: { data: [{ publicKey: 'peer', keyVersion: 1 }] } });
  keyManager.setChatAccount('alice');
});
it('isolates accounts and retains the previous account history on return', async () => {
  const alice = await keyManager.ensureChatKeypair();
  keyManager.setChatAccount('bob');
  await expect(keyManager.getMyChatKeypair()).rejects.toThrow();
  const bob = await keyManager.ensureChatKeypair();
  expect(bob.publicKey).not.toBe(alice.publicKey);
  expect(bob.deviceId).not.toBe(alice.deviceId);
  keyManager.setChatAccount('alice');
  expect((await keyManager.getMyChatKeypair()).publicKey).toBe(alice.publicKey);
  keyManager.setChatAccount(null);
  await expect(keyManager.getMyChatKeypair()).rejects.toThrow('Sign in');
  expect(mockDisconnect).toHaveBeenCalled();
});
it('migrates only keys whose public key is registered to this account and retains old decryption keys', async () => {
  const old = { publicKey: 'old-public', privateKey: 'old-private', deviceId: 'old-device', keyVersion: 1 };
  storage.set('com.onebody.chat.keys.v1', JSON.stringify(old));
  mockOwn.mockResolvedValue({ status: 200, response: { data: { userId: 'alice', keys: [old] } } });
  const result = await keyManager.ensureChatKeypair();
  expect(result.retired?.[0].privateKey).toBe(old.privateKey);
  expect(result.publicKey).not.toBe(old.publicKey);
  expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({ retireDeviceIds: ['old-device'] }), undefined);
  keyManager.setChatAccount('bob');
  mockOwn.mockResolvedValue({ status: 200, response: { data: { userId: 'bob', keys: [] } } });
  expect((await keyManager.ensureChatKeypair()).retired).toEqual([]);
  expect(storage.has('com.onebody.chat.keys.v1')).toBe(true);
});
it('does not replace keys after a Keychain read failure', async () => {
  mockGet.mockRejectedValueOnce(new Error('Keychain locked'));
  await expect(keyManager.ensureChatKeypair()).rejects.toThrow('locked');
  expect(mockSet).not.toHaveBeenCalled();
  expect(mockRegister).not.toHaveBeenCalled();
});
it('rejects completion after logout and clears peer caches', async () => {
  await keyManager.getPeerPublicKey('peer');
  await keyManager.getPeerPublicKey('peer');
  expect(mockPeer).toHaveBeenCalledTimes(1);
  let resolve!: (value: boolean) => void;
  mockGet.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  const pending = keyManager.ensureChatKeypair();
  keyManager.setChatAccount(null);
  resolve(false);
  await expect(pending).rejects.toThrow('changed');
  expect(mockRegister).not.toHaveBeenCalled();
  keyManager.setChatAccount('bob');
  await keyManager.getPeerPublicKey('peer');
  expect(mockPeer).toHaveBeenCalledTimes(2);
});
