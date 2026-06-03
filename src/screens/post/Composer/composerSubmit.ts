import type { ModerationReviewCheckPayload } from '@/src/services/moderation/types';
import {
  buildPendingModerationReviewPayload,
  callBackendFallbackModeration,
  moderateClientText,
} from '@/src/services/moderation/clientModeration';
import { buildCreateSocialPostRequest } from '@/src/screens/post/createSocialPostRequest';
import { ApiCall } from '@/src/services/api';
import type { ComposerDraft, MediaItem } from './types';

export type ComposerSubmitOutcome = {
  status: 'ok' | 'pending_review' | 'failed';
  postId?: string;
  pendingReview?: boolean;
  message?: string;
  blockedMediaIds?: string[];
};

const mediaItemToUploadedImage = (item: MediaItem) => ({
  uri: item.uri,
  type: item.type ?? 'image/jpeg',
  name: item.fileName ?? `image_${item.id}.jpg`,
});

const COMPOSER_TEXT_BLOCK_MESSAGE =
  'This post was screened because it violates our Terms of Use. Please be courteous and thoughtful about what you post. Abuse or profane content is prohibited in the One Body community.';

type ComposerTextModerationOutcome =
  | { status: 'allow'; check?: undefined }
  | { status: 'block'; check?: undefined }
  | { status: 'pending_review'; check: ModerationReviewCheckPayload };

const moderateComposerText = async (content: string): Promise<ComposerTextModerationOutcome> => {
  const normalizedContent = String(content ?? '').trim();
  if (!normalizedContent) {
    return { status: 'allow' };
  }

  const clientResult = await moderateClientText(normalizedContent);
  if (clientResult.action === 'block') {
    return { status: 'block' };
  }

  if (clientResult.action !== 'fallback') {
    return { status: 'allow' };
  }

  try {
    const fallbackResponse = await callBackendFallbackModeration({
      type: 'text',
      content: normalizedContent,
      clientMetadata: {
        source: clientResult.source,
        scores: clientResult.scores,
        reason: clientResult.reason,
        model: clientResult.model,
      },
    });

    if (fallbackResponse.finalAction === 'block') {
      return { status: 'block' };
    }

    if (fallbackResponse.finalAction === 'pending_review') {
      return {
        status: 'pending_review',
        check: {
          type: 'text',
          clientSource: clientResult.source,
          clientScores: clientResult.scores,
          clientReason: clientResult.reason,
          clientModel: clientResult.model,
          fallbackAction: fallbackResponse.finalAction,
          fallbackProvider: fallbackResponse.provider,
          fallbackFlagged: fallbackResponse.flagged,
          fallbackModel: fallbackResponse.model,
          fallbackResults: fallbackResponse.results,
        },
      };
    }
  } catch (_error) {
    return {
      status: 'pending_review',
      check: {
        type: 'text',
        clientSource: clientResult.source,
        clientScores: clientResult.scores,
        clientReason: clientResult.reason || 'fallback-moderation-unavailable',
        clientModel: clientResult.model,
        fallbackAction: 'pending_review',
        fallbackProvider: 'openai',
        fallbackFlagged: false,
      },
    };
  }

  return { status: 'allow' };
};

const moderationCheckFromMedia = (item: MediaItem): ModerationReviewCheckPayload | null => {
  if (item.moderation.status === 'unsure' || item.moderation.status === 'blocked') {
    return {
      type: item.kind === 'video' ? 'video' : 'image',
      clientSource: 'heuristic',
      clientScores: item.moderation.scores,
      clientReason: item.moderation.reason,
      fallbackAction: item.moderation.status === 'blocked' ? 'block' : 'pending_review',
      fallbackFlagged: true,
    };
  }
  return null;
};

const mergeContent = (draft: ComposerDraft): string =>
  [draft.caption.trim(), ...draft.linkAttachments.map((attachment) => attachment.url)]
    .filter((value) => value.length > 0)
    .join('\n\n');

export const submitComposerDraft = async ({
  draft,
  token,
  textModerationCheck,
}: {
  draft: ComposerDraft;
  token: string | undefined;
  textModerationCheck?: ModerationReviewCheckPayload | null;
}): Promise<ComposerSubmitOutcome> => {
  const blockedMedia = draft.media.filter((item) => item.moderation.status === 'blocked');
  if (blockedMedia.length > 0) {
    return {
      status: 'failed',
      blockedMediaIds: blockedMedia.map((item) => item.id),
      message: 'One or more items are blocked by our community standards.',
    };
  }

  const content = mergeContent(draft);
  let resolvedTextModerationCheck = textModerationCheck ?? null;
  if (textModerationCheck === undefined) {
    const textModeration = await moderateComposerText(content);
    if (textModeration.status === 'block') {
      return {
        status: 'failed',
        message: COMPOSER_TEXT_BLOCK_MESSAGE,
      };
    }
    if (textModeration.status === 'pending_review') {
      resolvedTextModerationCheck = textModeration.check;
    }
  } else if (textModerationCheck?.fallbackAction === 'block') {
    return {
      status: 'failed',
      message: COMPOSER_TEXT_BLOCK_MESSAGE,
    };
  }

  const photoItems = draft.media.filter((item) => item.kind === 'photo');
  const uploadedImages =
    photoItems.length > 0 ? photoItems.map(mediaItemToUploadedImage) : undefined;

  const moderationChecks: ModerationReviewCheckPayload[] = [];
  if (resolvedTextModerationCheck) {
    moderationChecks.push(resolvedTextModerationCheck);
  }
  draft.media.forEach((item) => {
    const check = moderationCheckFromMedia(item);
    if (check) moderationChecks.push(check);
  });
  const moderationReview = buildPendingModerationReviewPayload(moderationChecks);

  const request = buildCreateSocialPostRequest({
    content,
    mentionedUserIds: draft.mentionedUserIds,
    mentions: draft.mentions,
    uploadedImages,
    gif: draft.media.find((item) => item.kind === 'gif')?.gifMedia,
    moderationReview,
    location: draft.location
      ? {
          coordinates: draft.location.geometry.coordinates,
          name: draft.location.place_name,
        }
      : undefined,
    scriptureShare: draft.scriptureShare
      ? {
          book: draft.scriptureShare.book,
          chapter: draft.scriptureShare.chapter,
          verse: draft.scriptureShare.verse,
          verseEnd: draft.scriptureShare.verseEnd,
          translation: draft.scriptureShare.translation,
        }
      : undefined,
  });

  const response = await ApiCall<{
    postId?: string;
    _id?: string;
    id?: string;
    pendingReview?: boolean;
    message?: string;
    moderationPassed?: boolean;
    moderationTypeFailure?: 'image' | 'text';
  }>({
    route: 'social/post',
    token,
    params: request.params,
    verb: 'post',
    isFormUrlEncode: request.isFormUrlEncode,
  });

  if (response.status >= 200 && response.status < 300) {
    const body = response.response;
    const postId = String(body?.postId ?? body?._id ?? body?.id ?? '').trim() || undefined;
    if (body?.pendingReview) {
      return {
        status: 'pending_review',
        postId,
        pendingReview: true,
        message: body?.message,
      };
    }
    return { status: 'ok', postId };
  }

  if (response.status === 413) {
    return {
      status: 'failed',
      message: 'A file is too large. Please choose a smaller item.',
    };
  }

  const body = response.response as
    | {
        moderationPassed?: boolean;
        moderationTypeFailure?: 'image' | 'text';
        message?: string;
      }
    | undefined;
  if (body?.moderationPassed === false) {
    let reason = 'This post was screened by our moderation.';
    if (body.moderationTypeFailure === 'image') {
      reason = 'Your photo conflicts with our community standards.';
    } else if (body.moderationTypeFailure === 'text') {
      reason = 'Your post text was screened. Please rephrase.';
    }
    return { status: 'failed', message: reason };
  }

  return { status: 'failed', message: body?.message };
};
