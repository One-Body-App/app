import type { GiphyMedia } from '@giphy/react-native-sdk';
import type { TaggedMention } from '@/utils/types';
import type { ModerationReviewCheckPayload } from '@/src/services/moderation/types';

export type PendingPhotoUploadStatus =
  | 'queued'
  | 'moderating'
  | 'uploading'
  | 'complete'
  | 'failed';

export type PhotoUploadRecipeMediaItem = {
  uri: string;
  fileName: string;
  type: string;
  fileSize?: number;
  width?: number;
  height?: number;
};

export type PhotoUploadRecipeLocation = {
  coordinates: number[];
  name: string;
};

export type PhotoUploadRecipeQuote = {
  sourceId: string;
  sourceType: 'social' | 'rss' | 'watch' | 'prayer';
};

export type PhotoUploadAudience = 'everyone' | 'connections' | 'steward';

export type PhotoUploadRecipe = {
  media: PhotoUploadRecipeMediaItem[];
  caption: string;
  mentionedUserIds: string[];
  mentions: TaggedMention[];
  audience: PhotoUploadAudience;
  actorId?: string;
  location?: PhotoUploadRecipeLocation;
  linkAttachments?: Array<{ url: string; kind: 'link' | 'document' }>;
  gif?: GiphyMedia;
  quote?: PhotoUploadRecipeQuote;
  moderationChecks?: ModerationReviewCheckPayload[];
};

export type PendingPhotoUpload = {
  id: string;
  status: PendingPhotoUploadStatus;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  recipe: PhotoUploadRecipe;
  postId?: string;
  pendingReview?: boolean;
  failureReason?: string;
  nextRetryAt?: string;
};
