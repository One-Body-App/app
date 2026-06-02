import {
  buildQuickPostContent,
  getQuickPostErrorMessage,
  moderateQuickPostText,
  QUICK_POST_MAX_CHARACTERS,
  QUICK_POST_PENDING_REVIEW_MESSAGE,
} from './quickPost';

const mockBuildPendingModerationReviewPayload: jest.Mock = jest.fn((checks) => ({ checks }));
const mockCallBackendFallbackModeration: jest.Mock = jest.fn();
const mockModerateClientText: jest.Mock = jest.fn();

jest.mock('@/src/services/moderation/clientModeration', () => ({
  buildPendingModerationReviewPayload: (...args: any[]) =>
    mockBuildPendingModerationReviewPayload(...args),
  callBackendFallbackModeration: (...args: any[]) => mockCallBackendFallbackModeration(...args),
  moderateClientText: (...args: any[]) => mockModerateClientText(...args),
}));

describe('quickPost helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when the quick post is only whitespace', () => {
    expect(buildQuickPostContent('   \n   ')).toBeNull();
  });

  it('sanitizes excessive newlines and trims the result', () => {
    expect(buildQuickPostContent('\n\nHello\n\n\n\n\nWorld\n\n')).toBe('Hello\n\n\n\nWorld');
  });

  it('limits quick posts to the configured composer maximum', () => {
    const longValue = 'a'.repeat(QUICK_POST_MAX_CHARACTERS + 25);

    expect(buildQuickPostContent(longValue)).toBe('a'.repeat(QUICK_POST_MAX_CHARACTERS));
  });

  it('prefers an api message when present', () => {
    expect(getQuickPostErrorMessage({ message: 'Custom backend error' }, 400)).toBe(
      'Custom backend error'
    );
  });

  it('falls back to a size-specific message for 413 responses', () => {
    expect(getQuickPostErrorMessage({}, 413)).toBe(
      'Post is too large. Please shorten it and try again.'
    );
  });

  it('blocks quick posts when client text moderation blocks the content', async () => {
    const notify = jest.fn();
    mockModerateClientText.mockResolvedValue({
      action: 'block',
      source: 'heuristic',
      reason: 'blocked-pattern',
    });

    await expect(moderateQuickPostText('blocked text', notify)).resolves.toEqual({
      blocked: false,
      moderationReview: {
        checks: [
          {
            type: 'text',
            clientSource: 'heuristic',
            clientScores: undefined,
            clientReason: 'blocked-pattern',
            clientModel: undefined,
            fallbackAction: 'pending_review',
          },
        ],
      },
    });
    expect(notify).not.toHaveBeenCalled();
  });

  it('returns a moderation review payload when fallback moderation flags the content', async () => {
    mockModerateClientText.mockResolvedValue({
      action: 'fallback',
      source: 'toxicity',
      scores: { toxicity: 0.45 },
      reason: 'threshold-hit',
      model: 'toxicity-model',
    });
    mockCallBackendFallbackModeration.mockResolvedValue({
      finalAction: 'flag_for_admin_review',
      provider: 'openai',
      flagged: true,
      model: 'omni-moderation',
      results: { categories: { harassment: true } },
    });

    await expect(moderateQuickPostText('review me')).resolves.toEqual({
      blocked: false,
      moderationReview: {
        checks: [
          expect.objectContaining({
            type: 'text',
            fallbackAction: 'flag_for_admin_review',
            fallbackProvider: 'openai',
          }),
        ],
      },
    });
  });

  it('submits quick posts for review when fallback moderation cannot be completed', async () => {
    const notify = jest.fn();
    mockModerateClientText.mockResolvedValue({
      action: 'fallback',
      source: 'toxicity',
      scores: { toxicity: 0.45 },
      reason: 'threshold-hit',
      model: 'toxicity-model',
    });
    mockCallBackendFallbackModeration.mockRejectedValue(new Error('backend down'));

    await expect(moderateQuickPostText('retry me', notify)).resolves.toEqual({
      blocked: false,
      moderationReview: {
        checks: [
          expect.objectContaining({
            type: 'text',
            fallbackAction: 'pending_review',
            fallbackProvider: 'openai',
            fallbackFlagged: false,
            clientReason: 'threshold-hit',
          }),
        ],
      },
    });
    expect(notify).toHaveBeenCalledWith(QUICK_POST_PENDING_REVIEW_MESSAGE);
  });
});
