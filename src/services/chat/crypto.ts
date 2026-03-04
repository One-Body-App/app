import sodium from 'react-native-libsodium';
import QuickCrypto from 'react-native-quick-crypto';

const HKDF_CONTEXT = 'onebody-chat-v1';
const HKDF_SALT = 'onebody-chat-salt-v1';
const MAX_MESSAGE_BYTES = 10 * 1024 * 1024;
const CryptoBuffer = QuickCrypto.Buffer;

const fromBase64 = (value: string) =>
  sodium.from_base64(value, sodium.base64_variants.ORIGINAL) as Uint8Array;

const deriveAesKey = (sharedSecret: Uint8Array) => {
  const salt = sodium.from_string(HKDF_SALT) as Uint8Array;
  const extracted = sodium._unstable_crypto_kdf_hkdf_sha256_extract(
    sharedSecret,
    salt
  ) as Uint8Array;
  return sodium._unstable_crypto_kdf_hkdf_sha256_expand(extracted, HKDF_CONTEXT, 32) as Uint8Array;
};

export const deriveSharedSecretKey = async (
  myPrivateKeyBase64: string,
  peerPublicKeyBase64: string
) => {
  await sodium.ready;
  const myPrivateKey = fromBase64(myPrivateKeyBase64);
  const peerPublicKey = fromBase64(peerPublicKeyBase64);
  const sharedSecret = sodium.crypto_scalarmult(myPrivateKey, peerPublicKey) as Uint8Array;
  return deriveAesKey(sharedSecret);
};

export const encryptE2EEMessage = async (args: {
  plaintext: string;
  myPrivateKeyBase64: string;
  peerPublicKeyBase64: string;
  aad?: string;
}) => {
  const sharedKey = await deriveSharedSecretKey(args.myPrivateKeyBase64, args.peerPublicKeyBase64);

  const plainBuffer = CryptoBuffer.from(args.plaintext ?? '', 'utf8');
  if (plainBuffer.byteLength > MAX_MESSAGE_BYTES) {
    throw new Error('Message exceeds max encrypted payload size (10MB)');
  }

  const iv = QuickCrypto.randomBytes(12);
  const cipher = QuickCrypto.createCipheriv('aes-256-gcm', CryptoBuffer.from(sharedKey), iv);

  if (args.aad) {
    cipher.setAAD(CryptoBuffer.from(args.aad, 'utf8'));
  }

  const encrypted = CryptoBuffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedPayload: encrypted.toString('base64'),
    nonce: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    aad: args.aad,
  };
};

export const decryptE2EEMessage = async (args: {
  encryptedPayload: string;
  nonce: string;
  authTag: string;
  myPrivateKeyBase64: string;
  peerPublicKeyBase64: string;
  aad?: string;
}) => {
  const sharedKey = await deriveSharedSecretKey(args.myPrivateKeyBase64, args.peerPublicKeyBase64);

  const decipher = QuickCrypto.createDecipheriv(
    'aes-256-gcm',
    CryptoBuffer.from(sharedKey),
    CryptoBuffer.from(args.nonce, 'base64')
  );
  decipher.setAuthTag(CryptoBuffer.from(args.authTag, 'base64'));

  if (args.aad) {
    decipher.setAAD(CryptoBuffer.from(args.aad, 'utf8'));
  }

  const decrypted = CryptoBuffer.concat([
    decipher.update(CryptoBuffer.from(args.encryptedPayload, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};
