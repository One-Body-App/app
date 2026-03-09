import * as Keychain from 'react-native-keychain';
import { base64_variants, crypto_box_keypair, ready, to_base64 } from 'react-native-libsodium';
import DeviceInfo from 'react-native-device-info';
import { fetchUserChatPublicKey, registerChatPublicKey } from './api';

const CHAT_KEYCHAIN_SERVICE = 'com.onebody.chat.keys.v1';
const CHAT_KEYCHAIN_USERNAME = 'onebody-chat';
const PEER_KEY_CACHE_TTL_MS = 5 * 60 * 1000;

type StoredChatKeypair = {
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

const KEY_INIT_ERROR =
  'Secure messaging key setup is unavailable right now. Please restart the app and try again.';

const ensureKeyBindings = () => {
  if (typeof crypto_box_keypair !== 'function' || typeof to_base64 !== 'function') {
    throw new Error(KEY_INIT_ERROR);
  }
};

const toBase64 = (bytes: Uint8Array) => to_base64(bytes, base64_variants.ORIGINAL);

const normalizeDeviceId = (deviceId?: string) => {
  const fallback = DeviceInfo.getUniqueIdSync();
  const candidate = typeof deviceId === 'string' ? deviceId.trim() : '';
  return candidate || fallback || 'device-primary';
};

const loadStoredChatKeypair = async (): Promise<StoredChatKeypair | null> => {
  try {
    const creds = await Keychain.getGenericPassword({ service: CHAT_KEYCHAIN_SERVICE });
    if (!creds) {
      return null;
    }

    const parsed = JSON.parse(creds.password || '{}') as StoredChatKeypair;
    if (!parsed?.publicKey || !parsed?.privateKey) {
      return null;
    }

    return {
      ...parsed,
      algorithm: 'x25519',
      keyVersion: Number(parsed.keyVersion) > 0 ? Number(parsed.keyVersion) : 1,
      deviceId: normalizeDeviceId(parsed.deviceId),
    };
  } catch {
    return null;
  }
};

const saveStoredChatKeypair = async (value: StoredChatKeypair) => {
  await Keychain.setGenericPassword(CHAT_KEYCHAIN_USERNAME, JSON.stringify(value), {
    service: CHAT_KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
};

const generateNewKeypair = async (deviceId?: string): Promise<StoredChatKeypair> => {
  await ready;
  ensureKeyBindings();
  const pair = crypto_box_keypair();

  return {
    algorithm: 'x25519',
    keyVersion: 1,
    publicKey: toBase64(pair.publicKey),
    privateKey: toBase64(pair.privateKey),
    deviceId: normalizeDeviceId(deviceId),
    registeredAt: new Date().toISOString(),
  };
};

export const ensureChatKeypair = async (options?: {
  token?: string;
  forceRotate?: boolean;
  deviceId?: string;
}) => {
  let keypair = await loadStoredChatKeypair();

  if (!keypair || options?.forceRotate) {
    keypair = await generateNewKeypair(options?.deviceId);
    await saveStoredChatKeypair(keypair);
  }

  const response = await registerChatPublicKey(
    {
      publicKey: keypair.publicKey,
      algorithm: keypair.algorithm,
      keyVersion: keypair.keyVersion,
      deviceId: keypair.deviceId,
    },
    options?.token
  );

  if (response.status !== 200) {
    throw new Error(
      (response.response as { message?: string })?.message || 'Unable to register chat keypair'
    );
  }

  return keypair;
};

export const getMyChatKeypair = async () => {
  const keypair = await loadStoredChatKeypair();
  if (!keypair) {
    throw new Error('Chat keypair unavailable. Call ensureChatKeypair() first.');
  }
  return keypair;
};

export const getPeerPublicKey = async (userId: string, token?: string) => {
  const now = Date.now();
  const cached = peerKeyCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return { publicKey: cached.publicKey, keyVersion: cached.keyVersion };
  }

  const response = await fetchUserChatPublicKey(userId, token);
  if (response.status !== 200 || !response.response?.data?.publicKey) {
    throw new Error(
      (response.response as { message?: string })?.message || 'Unable to fetch receiver key'
    );
  }

  const record = {
    publicKey: response.response.data.publicKey,
    keyVersion: response.response.data.keyVersion || 1,
    expiresAt: now + PEER_KEY_CACHE_TTL_MS,
  };

  peerKeyCache.set(userId, record);

  return { publicKey: record.publicKey, keyVersion: record.keyVersion };
};

export const clearPeerKeyCache = () => {
  peerKeyCache.clear();
};
