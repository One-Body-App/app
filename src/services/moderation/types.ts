export type ClientModerationAction = 'allow' | 'block' | 'fallback';

export type ClientModerationSource = 'heuristic' | 'toxicity' | 'nsfwjs';

export type ClientTextModerationScores = {
  maxToxicity: number;
  byLabel: Record<string, number>;
};

export type ClientImageModerationScores = {
  neutral: number;
  drawing: number;
  sexy: number;
  porn: number;
  hentai: number;
};

export type ClientModerationResult =
  | {
      action: ClientModerationAction;
      source: 'heuristic';
      reason?: string;
      scores?: undefined;
      model?: undefined;
    }
  | {
      action: ClientModerationAction;
      source: 'toxicity';
      scores: ClientTextModerationScores;
      reason?: string;
      model: 'tfjs-toxicity';
    }
  | {
      action: ClientModerationAction;
      source: 'nsfwjs';
      scores: ClientImageModerationScores;
      reason?: string;
      model: 'nsfwjs';
    };

export type BackendFallbackModerationRequest = {
  type: 'text' | 'image' | 'video';
  content: string | string[];
  clientMetadata?: Record<string, unknown>;
};

export type BackendFallbackModerationResponse = {
  finalAction: 'allow' | 'flag_for_admin_review';
  provider: 'openai';
  flagged: boolean;
  model?: string;
  results?: unknown[];
};

export type ModerationReviewCheckPayload = {
  type: 'text' | 'image' | 'video';
  clientSource?: ClientModerationSource;
  clientScores?: Record<string, unknown>;
  clientReason?: string;
  clientModel?: string;
  fallbackAction: BackendFallbackModerationResponse['finalAction'];
  fallbackProvider?: BackendFallbackModerationResponse['provider'];
  fallbackFlagged?: boolean;
  fallbackModel?: string;
  fallbackResults?: unknown[];
};

export type ModerationReviewPayload = {
  persistAsPendingReview: boolean;
  checks: ModerationReviewCheckPayload[];
};
