import { serialize } from 'object-to-formdata';
import type { GiphyMedia } from '@giphy/react-native-sdk';

import type { ModerationReviewPayload } from '@/src/services/moderation/types';
import type { TaggedMention } from '@/utils/types';

type UploadedImage = {
  uri: string;
  type: string;
  name?: string;
};

type CreateSocialPostLocation = {
  coordinates: number[];
  name: string;
};

type CreateScriptureSharePayload = {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  translation?: string;
};

export type CreateSocialPostRequestArgs = {
  content: string;
  mentionedUserIds: string[];
  mentions?: TaggedMention[];
  uploadedImages?: UploadedImage[];
  gif?: GiphyMedia | null;
  moderationReview?: ModerationReviewPayload;
  location?: CreateSocialPostLocation;
  scriptureShare?: CreateScriptureSharePayload | null;
};

export const buildCreateSocialPostRequest = ({
  content,
  mentionedUserIds,
  mentions,
  uploadedImages,
  gif,
  moderationReview,
  location,
  scriptureShare,
}: CreateSocialPostRequestArgs) => {
  const basePayload = {
    content,
    mentionedUserIds,
    mentions,
    gif: gif ?? undefined,
    moderationReview,
    location,
    scriptureShare: scriptureShare ?? undefined,
  };

  if (uploadedImages && uploadedImages.length > 0) {
    return {
      params: serialize(
        {
          ...basePayload,
          images: uploadedImages,
        },
        {
          noAttributesWithArrayNotation: true,
          noFilesWithArrayNotation: true,
        }
      ),
      isFormUrlEncode: true,
    };
  }

  return {
    params: basePayload,
    isFormUrlEncode: false,
  };
};
