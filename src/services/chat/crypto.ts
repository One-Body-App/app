import {
  base64_variants,
  crypto_box_easy,
  crypto_box_NONCEBYTES,
  crypto_box_open_easy,
  from_base64,
  randombytes_buf,
  ready,
} from 'react-native-libsodium';
import QuickCrypto from 'react-native-quick-crypto';

const MAX_MESSAGE_BYTES = 10 * 1024 * 1024;
const CryptoBuffer = QuickCrypto.Buffer;
const BOX_SCHEME_MARKER = 'box:v1';
const CRYPTO_INIT_ERROR =
  'Secure messaging is unavailable right now. Please restart the app and try again.';
const LEGACY_DECRYPT_ERROR =
  'This message uses an older secure format that this device cannot decrypt.';

const ensureBoxBindings = () => {
  if (
    typeof from_base64 !== 'function' ||
    typeof randombytes_buf !== 'function' ||
    typeof crypto_box_easy !== 'function' ||
    typeof crypto_box_open_easy !== 'function' ||
    typeof crypto_box_NONCEBYTES !== 'number'
  ) {
    throw new Error(CRYPTO_INIT_ERROR);
  }
};

const fromBase64 = (value: string) => from_base64(value, base64_variants.ORIGINAL) as Uint8Array;

const toUtf8Buffer = (value: string) => CryptoBuffer.from(value ?? '', 'utf8');

export const encryptE2EEMessage = async (args: {
  plaintext: string;
  myPrivateKeyBase64: string;
  peerPublicKeyBase64: string;
  aad?: string;
}) => {
  await ready;
  ensureBoxBindings();

  const plainBuffer = toUtf8Buffer(args.plaintext);
  if (plainBuffer.byteLength > MAX_MESSAGE_BYTES) {
    throw new Error('Message exceeds max encrypted payload size (10MB)');
  }

  const myPrivateKey = fromBase64(args.myPrivateKeyBase64);
  const peerPublicKey = fromBase64(args.peerPublicKeyBase64);
  const nonce = randombytes_buf(crypto_box_NONCEBYTES) as Uint8Array;
  const encrypted = crypto_box_easy(
    new Uint8Array(plainBuffer),
    nonce,
    peerPublicKey,
    myPrivateKey
  ) as Uint8Array;

  return {
    encryptedPayload: CryptoBuffer.from(encrypted).toString('base64'),
    nonce: CryptoBuffer.from(nonce).toString('base64'),
    authTag: BOX_SCHEME_MARKER,
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
  if (args.authTag !== BOX_SCHEME_MARKER) {
    throw new Error(LEGACY_DECRYPT_ERROR);
  }

  await ready;
  ensureBoxBindings();

  const myPrivateKey = fromBase64(args.myPrivateKeyBase64);
  const peerPublicKey = fromBase64(args.peerPublicKeyBase64);
  const nonce = fromBase64(args.nonce);
  const encryptedPayload = fromBase64(args.encryptedPayload);

  const decrypted = crypto_box_open_easy(
    encryptedPayload,
    nonce,
    peerPublicKey,
    myPrivateKey
  ) as Uint8Array;

  return CryptoBuffer.from(decrypted).toString('utf8');
};
