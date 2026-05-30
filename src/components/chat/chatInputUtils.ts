import { sanitizeComposerText } from '@/components/composer/composerText';

export const CHAT_MAX_CHARACTERS = 2000;
export const CHAT_COUNTER_VISIBLE_THRESHOLD = 1500;
export const CHAT_COUNTER_DANGER_THRESHOLD = 1900;
export const CHAT_MAX_CONSECUTIVE_NEWLINES = 4;
export const CHAT_MAX_IMAGE_ATTACHMENTS = 4;
export const CHAT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const CHAT_ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type ValidImageMimeType = (typeof CHAT_ALLOWED_IMAGE_MIME_TYPES)[number];

export type ChatAttachmentCandidate = {
  mimeType?: string;
  size?: number;
};

export const sanitizeChatInputText = (value: string) =>
  sanitizeComposerText(value, CHAT_MAX_CHARACTERS);

export const validateChatImageCandidate = (candidate: ChatAttachmentCandidate) => {
  const mimeType = String(candidate.mimeType || '')
    .trim()
    .toLowerCase();
  if (!CHAT_ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as ValidImageMimeType)) {
    return {
      valid: false,
      error: 'Images must be JPEG, PNG, WEBP, or GIF.',
    };
  }

  const size = Number(candidate.size || 0);
  if (size > CHAT_MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: 'Each image must be 5MB or smaller.',
    };
  }

  return {
    valid: true,
  };
};
