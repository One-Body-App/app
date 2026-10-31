import * as Keychain from 'react-native-keychain';
import { base64_variants, crypto_box_keypair, ready, to_base64 } from 'react-native-libsodium';
import { sha256 } from 'js-sha256';
import { BASE_URL } from '@/src/services/constants';
import { disconnectChatSocket } from './socketClient';
import { fetchOwnChatDeviceKeys, fetchUserChatDeviceKeys, registerChatPublicKey } from './api';

const LEGACY_SERVICE = 'com.onebody.chat.keys.v1';
let account: string | null = null;
let revision = 0;
let pending: Promise<StoredChatKeypair> | null = null;
const assertCurrent = (expected: number) => {
  if (!account || expected !== revision) throw new Error('Chat account changed. Reopen chat.');
};
export const setChatAccount = (next: string | null) => {
  if (account === next) return;
  revision++;
  account = next;
  pending = null;
  clearPeerKeyCache();
  disconnectChatSocket();
};
const accountService = () => {
  if (!account) throw new Error('Sign in before opening chat.');
  return `com.onebody.chat.keys.v2.${sha256(`${BASE_URL}|${account}`)}`;
};
const CHAT_KEYCHAIN_USERNAME = 'onebody-chat';
const PEER_KEY_CACHE_TTL_MS = 5 * 60 * 1000;
const PEER_KEY_MISSING_CACHE_TTL_MS = 30 * 1000;
const MISSING_PEER_KEY_ERROR = 'Public key not found for user';

export type StoredChatKeypair = {
  owner?: string;
  environment?: string;
  retired?: StoredChatKeypair[];
  algorithm: 'x25519';
  keyVersion: number;
  publicKey: string;
  privateKey: string;
  deviceId: string;
  registeredAt?: string;
};

const peerKeyCache = new Map<
  string,
  { publicKey: string; keyVersion: number; expiresAt: number }
>();
const missingPeerKeyCache = new Map<string, { message: string; expiresAt: number }>();

const KEY_INIT_ERROR =
  'Secure messaging key setup is unavailable right now. Please restart the app and try again.';

const ensureKeyBindings = () => {
  if (typeof crypto_box_keypair !== 'function' || typeof to_base64 !== 'function') {
    throw new Error(KEY_INIT_ERROR);
  }
};

const toBase64 = (bytes: Uint8Array) => to_base64(bytes, base64_variants.ORIGINAL);

const loadStoredChatKeypair = async (service: string): Promise<StoredChatKeypair | null> => {
  const creds = await Keychain.getGenericPassword({ service });
  if (!creds) return null;
  const parsed = JSON.parse(creds.password) as StoredChatKeypair;
  if (!parsed?.publicKey || !parsed?.privateKey) throw new Error('Saved chat keys need recovery.');
  return {
    ...parsed,
    algorithm: 'x25519',
    keyVersion: parsed.keyVersion || 1,
    deviceId: parsed.deviceId || 'primary',
  };
};

const prepareKeypair = async (options?: {
  token?: string;
  forceRotate?: boolean;
  deviceId?: string;
}) => {
  const service = accountService();
  const owner = account!;
  const expected = revision;
  let keypair = await loadStoredChatKeypair(service);
  assertCurrent(expected);
  if (keypair && (keypair.owner !== owner || keypair.environment !== BASE_URL))
    throw new Error('Chat key ownership mismatch.');
  if (!keypair || options?.forceRotate) {
    const retired = keypair
      ? [keypair, ...(keypair.retired || [])].map(({ retired: _retired, ...key }) => key)
      : [];
    if (!keypair) {
      const legacy = await loadStoredChatKeypair(LEGACY_SERVICE);
      assertCurrent(expected);
      if (legacy) {
        const own = await fetchOwnChatDeviceKeys(options?.token);
        assertCurrent(expected);
        if (own.status !== 200 || own.response?.data?.userId !== owner)
          throw new Error('Unable to verify chat key ownership.');
        retired.push(
          ...own.response.data.keys
            .filter((k) => k.publicKey === legacy.publicKey)
            .map((key) => ({ ...legacy, deviceId: key.deviceId, owner, environment: BASE_URL }))
        );
      }
    }
    await ready;
    assertCurrent(expected);
    ensureKeyBindings();
    const pair = crypto_box_keypair();
    const publicKey = toBase64(pair.publicKey);
    keypair = {
      algorithm: 'x25519',
      keyVersion: 1,
      publicKey,
      privateKey: toBase64(pair.privateKey),
      deviceId: `mobile-${sha256(publicKey).slice(0, 40)}`,
      owner,
      environment: BASE_URL,
      retired,
    };
    await Keychain.setGenericPassword(CHAT_KEYCHAIN_USERNAME, JSON.stringify(keypair), {
      service,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    assertCurrent(expected);
    // The legacy Keychain record stays quarantined for any other account whose
    // historical registry can prove ownership. It is never used for new sends.
  }
  assertCurrent(expected);
  const response = await registerChatPublicKey(
    {
      publicKey: keypair.publicKey,
      algorithm: keypair.algorithm,
      keyVersion: keypair.keyVersion,
      deviceId: keypair.deviceId,
      retireDeviceIds: (keypair.retired || []).map((k) => k.deviceId),
    },
    options?.token
  );
  assertCurrent(expected);
  if (response.status !== 200)
    throw new Error(
      (response.response as { message?: string })?.message || 'Unable to register chat keypair'
    );
  return keypair;
};

export const ensureChatKeypair = (options?: {
  token?: string;
  forceRotate?: boolean;
  deviceId?: string;
}) => {
  if (pending) return pending;
  const expected = revision;
  pending = prepareKeypair(options).finally(() => {
    if (expected === revision) pending = null;
  });
  return pending;
};

export const getMyChatKeypair = async () => {
  const expected = revision;
  const keypair = await loadStoredChatKeypair(accountService());
  assertCurrent(expected);
  if (!keypair || keypair.owner !== account || keypair.environment !== BASE_URL)
    throw new Error('Chat keypair unavailable. Call ensureChatKeypair() first.');
  return keypair;
};

export const getPeerPublicKey = async (userId: string, token?: string) => {
  const expected = revision;
  assertCurrent(expected);
  const now = Date.now();
  const cached = peerKeyCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return { publicKey: cached.publicKey, keyVersion: cached.keyVersion };
  }

  const missingCached = missingPeerKeyCache.get(userId);
  if (missingCached && missingCached.expiresAt > now) {
    throw new Error(missingCached.message);
  }

  missingPeerKeyCache.delete(userId);

  const response = await fetchUserChatDeviceKeys(userId, token);
  assertCurrent(expected);
  if (response.status !== 200) {
    throw new Error(
      (response.response as { message?: string })?.message || 'Unable to fetch receiver key'
    );
  }

  const key = Array.isArray(response.response?.data)
    ? response.response.data.find((item) => item?.publicKey && item.isActive !== false)
    : null;

  if (!key?.publicKey) {
    missingPeerKeyCache.set(userId, {
      message: MISSING_PEER_KEY_ERROR,
      expiresAt: now + PEER_KEY_MISSING_CACHE_TTL_MS,
    });
    throw new Error(MISSING_PEER_KEY_ERROR);
  }

  const record = {
    publicKey: key.publicKey,
    keyVersion: key.keyVersion || 1,
    expiresAt: now + PEER_KEY_CACHE_TTL_MS,
  };

  peerKeyCache.set(userId, record);
  missingPeerKeyCache.delete(userId);

  return { publicKey: record.publicKey, keyVersion: record.keyVersion };
};

export const clearPeerKeyCache = () => {
  peerKeyCache.clear();
  missingPeerKeyCache.clear();
};
