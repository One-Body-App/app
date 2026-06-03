/* eslint-disable import/first */
const mockApiCall = jest.fn();
const mockBuildPendingModerationReviewPayload = jest.fn((checks) => {
  const pendingChecks = checks.filter(
    (check: { fallbackAction?: string }) => check.fallbackAction === 'pending_review'
  );
  return pendingChecks.length > 0
    ? { persistAsPendingReview: true, checks: pendingChecks }
    : undefined;
});
const mockCallBackendFallbackModeration = jest.fn();
const mockModerateClientText = jest.fn();

jest.mock('@/src/services/api', () => ({
  ApiCall: (...args: unknown[]) => mockApiCall(...args),
}));

jest.mock('@/src/services/moderation/clientModeration', () => ({
  buildPendingModerationReviewPayload: (...args: unknown[]) =>
    mockBuildPendingModerationReviewPayload(...args),
  callBackendFallbackModeration: (...args: unknown[]) => mockCallBackendFallbackModeration(...args),
  moderateClientText: (...args: unknown[]) => mockModerateClientText(...args),
}));

import { submitComposerDraft } from '../composerSubmit';
import type { ComposerDraft } from '../types';

const buildDraft = (caption: string): ComposerDraft => ({
  mode: 'feed',
  audience: 'everyone',
  caption,
  mentionedUserIds: [],
  mentions: [],
  media: [],
  location: null,
  linkAttachments: [],
  scriptureShare: null,
});

describe('submitComposerDraft text moderation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks locally moderated profanity before the social post request', async () => {
    mockModerateClientText.mockResolvedValue({
      action: 'block',
      source: 'heuristic',
      reason: 'blocked-text:profanity',
    });

    await expect(
      submitComposerDraft({ draft: buildDraft('Holy shit!'), token: 'token' })
    ).resolves.toEqual({
      status: 'failed',
      message: expect.stringContaining('violates our Terms of Use'),
    });

    expect(mockCallBackendFallbackModeration).not.toHaveBeenCalled();
    expect(mockApiCall).not.toHaveBeenCalled();
  });

  it('stops before the social post request when fallback moderation blocks text', async () => {
    mockModerateClientText.mockResolvedValue({
      action: 'fallback',
      source: 'toxicity',
      scores: { maxToxicity: 0.5, byLabel: { toxicity: 0.5 } },
      reason: 'threshold-hit',
      model: 'tfjs-toxicity',
    });
    mockCallBackendFallbackModeration.mockResolvedValue({
      finalAction: 'block',
      provider: 'openai',
      flagged: true,
    });

    await expect(
      submitComposerDraft({ draft: buildDraft('review this'), token: 'token' })
    ).resolves.toEqual({
      status: 'failed',
      message: expect.stringContaining('violates our Terms of Use'),
    });

    expect(mockApiCall).not.toHaveBeenCalled();
  });

  it('attaches a pending-review payload when fallback moderation queues text', async () => {
    mockModerateClientText.mockResolvedValue({
      action: 'fallback',
      source: 'toxicity',
      scores: { maxToxicity: 0.5, byLabel: { toxicity: 0.5 } },
      reason: 'threshold-hit',
      model: 'tfjs-toxicity',
    });
    mockCallBackendFallbackModeration.mockResolvedValue({
      finalAction: 'pending_review',
      provider: 'openai',
      flagged: true,
      model: 'omni-moderation-latest',
      results: [{ flagged: true }],
    });
    mockApiCall.mockResolvedValue({
      status: 200,
      response: { pendingReview: true, message: 'Queued for review.' },
    });

    await expect(
      submitComposerDraft({ draft: buildDraft('review this'), token: 'token' })
    ).resolves.toEqual({
      status: 'pending_review',
      pendingReview: true,
      message: 'Queued for review.',
    });

    expect(mockApiCall).toHaveBeenCalledWith(
      expect.objectContaining({
        route: 'social/post',
        params: expect.objectContaining({
          content: 'review this',
          moderationReview: expect.objectContaining({
            persistAsPendingReview: true,
            checks: [
              expect.objectContaining({
                type: 'text',
                fallbackAction: 'pending_review',
                fallbackProvider: 'openai',
              }),
            ],
          }),
        }),
      })
    );
  });
});
