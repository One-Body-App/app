export type VideoRatioId = '1:1' | '4:3' | '16:9' | '9:16';

export type ClientModerationDecision = 'safe' | 'unsure' | 'blocked' | 'unclassified';

export type ClientModerationScores = {
  neutral: number;
  drawing: number;
  sexy: number;
  porn: number;
  hentai: number;
};

export type VideoTransformState = {
  scale: number;
  translateX: number;
  translateY: number;
};

export type VideoCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VideoDimensions = {
  width: number;
  height: number;
};

export type SelectedVideoSource = {
  uri: string;
  ratioId?: VideoRatioId;
  width?: number;
  height?: number;
};

export type VideoEditRecipe = {
  sourceUri: string;
  caption: string;
  trimStartMs: number;
  trimEndMs: number;
  trimDurationMs?: number;
  ratioId: VideoRatioId;
  cropRect: VideoCropRect;
  transform: VideoTransformState;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  videoBitrate: number;
  audioBitrate: number;
};

export type PendingVideoUploadStatus =
  | 'queued'
  | 'moderating'
  | 'compressing'
  | 'uploading'
  | 'posting'
  | 'failed'
  | 'complete';

export type PendingVideoUpload = {
  id: string;
  status: PendingVideoUploadStatus;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  recipe: VideoEditRecipe;
  moderationDecision?: ClientModerationDecision;
  moderationScores?: ClientModerationScores | null;
  moderationError?: string;
  processedVideoUri?: string;
  processedDuration?: number;
  processedWidth?: number;
  processedHeight?: number;
  uploadId?: string;
  lastError?: string;
  failureCode?:
    | 'nsfw-blocked'
    | 'moderation-failed'
    | 'missing-source'
    | 'invalid-edit'
    | 'network'
    | 'processing';
};
