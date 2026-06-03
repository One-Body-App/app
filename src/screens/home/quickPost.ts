import { sanitizeComposerText } from '@/components/composer/composerText';
import {
  buildPendingModerationReviewPayload,
  callBackendFallbackModeration,
  moderateClientText,
} from '@/src/services/moderation/clientModeration';
import type {
  ModerationReviewCheckPayload,
  ModerationReviewPayload,
} from '@/src/services/moderation/types';

export const QUICK_POST_MAX_CHARACTERS = 300;
export const QUICK_POST_TEXT_BLOCK_MESSAGE =
  'This post was screened because it violates our Terms of Use. Please be courteous and thoughtful about what you post. Abuse or profane content is prohibited in the One Body community.';
export const QUICK_POST_PENDING_REVIEW_MESSAGE = 'Your post was submitted for review.';
export const QUICK_POST_MODERATION_ERROR_MESSAGE =
  'Unable to complete moderation right now. Please try again.';

export const buildQuickPostContent = (value: string) => {
  const sanitized = sanitizeComposerText(value, QUICK_POST_MAX_CHARACTERS).trim();
  return sanitized.length > 0 ? sanitized : null;
};

export const moderateQuickPostText = async (
  content: string,
  notify?: (message: string) => void
): Promise<{ blocked: true } | { blocked: false; moderationReview?: ModerationReviewPayload }> => {
  const result = await moderateClientText(content);

  if (result.action === 'block') {
    notify?.(QUICK_POST_TEXT_BLOCK_MESSAGE);
    return { blocked: true };
  }

  if (result.action === 'fallback') {
    try {
      const fallbackResponse = await callBackendFallbackModeration({
        type: 'text',
        content,
        clientMetadata: {
          source: result.source,
          scores: result.scores,
          reason: result.reason,
          model: result.model,
        },
      });

      if (fallbackResponse.finalAction === 'block') {
        notify?.(QUICK_POST_TEXT_BLOCK_MESSAGE);
        return { blocked: true };
      }

      if (fallbackResponse.finalAction === 'pending_review') {
        return {
          blocked: false,
          moderationReview: buildPendingModerationReviewPayload([
            {
              type: 'text',
              clientSource: result.source,
              clientScores: result.scores,
              clientReason: result.reason,
              clientModel: result.model,
              fallbackAction: fallbackResponse.finalAction,
              fallbackProvider: fallbackResponse.provider,
              fallbackFlagged: fallbackResponse.flagged,
              fallbackModel: fallbackResponse.model,
              fallbackResults: fallbackResponse.results,
            } satisfies ModerationReviewCheckPayload,
          ]),
        };
      }
    } catch (_error) {
      notify?.(QUICK_POST_PENDING_REVIEW_MESSAGE);
      return {
        blocked: false,
        moderationReview: buildPendingModerationReviewPayload([
          {
            type: 'text',
            clientSource: result.source,
            clientScores: result.scores,
            clientReason: result.reason || QUICK_POST_MODERATION_ERROR_MESSAGE,
            clientModel: result.model,
            fallbackAction: 'pending_review',
            fallbackProvider: 'openai',
            fallbackFlagged: false,
          } satisfies ModerationReviewCheckPayload,
        ]),
      };
    }
  }

  return { blocked: false };
};

export const getQuickPostErrorMessage = (response: unknown, status?: number) => {
  if (response && typeof response === 'object') {
    const candidate = response as { message?: unknown };
    if (typeof candidate.message === 'string' && candidate.message.trim().length > 0) {
      return candidate.message;
    }
  }

  if (status === 413) {
    return 'Post is too large. Please shorten it and try again.';
  }

  return 'Unable to share your post right now.';
};
