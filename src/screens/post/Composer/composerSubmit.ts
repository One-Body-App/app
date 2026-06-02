import type { ModerationReviewCheckPayload } from '@/src/services/moderation/types';
import { buildPendingModerationReviewPayload } from '@/src/services/moderation/clientModeration';
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

  const photoItems = draft.media.filter((item) => item.kind === 'photo');
  const uploadedImages =
    photoItems.length > 0 ? photoItems.map(mediaItemToUploadedImage) : undefined;

  const moderationChecks: ModerationReviewCheckPayload[] = [];
  if (textModerationCheck) {
    moderationChecks.push(textModerationCheck);
  }
  draft.media.forEach((item) => {
    const check = moderationCheckFromMedia(item);
    if (check) moderationChecks.push(check);
  });
  const moderationReview = buildPendingModerationReviewPayload(moderationChecks);

  const request = buildCreateSocialPostRequest({
    content: mergeContent(draft),
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
    const reason =
      body.moderationTypeFailure === 'image'
        ? 'Your photo conflicts with our community standards.'
        : body.moderationTypeFailure === 'text'
          ? 'Your post text was screened. Please rephrase.'
          : 'This post was screened by our moderation.';
    return { status: 'failed', message: reason };
  }

  return { status: 'failed', message: body?.message };
};
