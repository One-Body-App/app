import {
  CHAT_MAX_CHARACTERS,
  sanitizeChatInputText,
  validateChatImageCandidate,
} from '../chatInputUtils';

describe('chatInputUtils', () => {
  it('clamps text to 2000 characters', () => {
    expect(sanitizeChatInputText('a'.repeat(CHAT_MAX_CHARACTERS + 25))).toHaveLength(
      CHAT_MAX_CHARACTERS
    );
  });

  it('collapses more than four consecutive newlines', () => {
    expect(sanitizeChatInputText('hello\n\n\n\n\n\nworld')).toBe('hello\n\n\n\nworld');
  });

  it('rejects invalid image mime types', () => {
    expect(validateChatImageCandidate({ mimeType: 'image/heic', size: 1000 })).toEqual({
      valid: false,
      error: 'Images must be JPEG, PNG, WEBP, or GIF.',
    });
  });

  it('rejects images larger than 5MB', () => {
    expect(validateChatImageCandidate({ mimeType: 'image/jpeg', size: 6 * 1024 * 1024 })).toEqual({
      valid: false,
      error: 'Each image must be 5MB or smaller.',
    });
  });

  it('accepts supported image types within the size limit', () => {
    expect(validateChatImageCandidate({ mimeType: 'image/png', size: 1024 })).toEqual({
      valid: true,
    });
  });
});
