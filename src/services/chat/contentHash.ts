import QuickCrypto from 'react-native-quick-crypto';
import { ChatEnvelope } from './types';

type HashArgs = {
  text?: string;
  messageType?: ChatEnvelope['messageType'];
  mediaUrl?: string;
  mediaUrls?: string[];
  giphyId?: string;
};

const normalizeText = (value?: string) => String(value || '').trimEnd();

const normalizeMediaUrls = (value?: string[]) =>
  Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [];

export const buildChatContentHash = (args: HashArgs) => {
  const payload = JSON.stringify({
    text: normalizeText(args.text),
    messageType: args.messageType || 'text',
    mediaUrl: String(args.mediaUrl || '').trim(),
    mediaUrls: normalizeMediaUrls(args.mediaUrls),
    giphyId: String(args.giphyId || '').trim(),
  });

  return QuickCrypto.createHash('sha256').update(payload).digest('hex');
};
