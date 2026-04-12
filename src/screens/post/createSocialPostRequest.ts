import { serialize } from 'object-to-formdata';
import type { GiphyMedia } from '@giphy/react-native-sdk';

import type { ModerationReviewPayload } from '@/src/services/moderation/types';

type UploadedImage = {
  uri: string;
  type: string;
  name?: string;
};

type CreateSocialPostLocation = {
  coordinates: number[];
  name: string;
};

export type CreateSocialPostRequestArgs = {
  content: string;
  mentionedUserIds: string[];
  uploadedImages?: UploadedImage[];
  gif?: GiphyMedia | null;
  moderationReview?: ModerationReviewPayload;
  location?: CreateSocialPostLocation;
};

export const buildCreateSocialPostRequest = ({
  content,
  mentionedUserIds,
  uploadedImages,
  gif,
  moderationReview,
  location,
}: CreateSocialPostRequestArgs) => {
  const basePayload = {
    content,
    mentionedUserIds,
    gif: gif ?? undefined,
    moderationReview,
    location,
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
