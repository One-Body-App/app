import { buildImageDataUri, callBackendFallbackModeration } from './clientModeration';
import type { BackendFallbackModerationResponse } from './types';

export type ClientImageModerationDecision = 'safe' | 'unsure' | 'blocked' | 'unavailable';

export type ClientImageModerationCategory =
  | 'sexual'
  | 'violence'
  | 'hate'
  | 'self-harm'
  | 'graphic'
  | 'other';

export type ClientImageModerationSource = 'heuristic' | 'backend-pre-screen' | 'on-device-nsfwjs';

export type ClientImageModerationResult = {
  decision: ClientImageModerationDecision;
  // Highest category score the classifier returned (0..1).
  severity: number;
  reason?: string;
  category?: ClientImageModerationCategory;
  source: ClientImageModerationSource;
  // Verbatim category scores for the moderation review payload.
  scores: Record<string, number>;
};

const FAST_HEURISTIC_FILE_NAME_PATTERNS: ReadonlyArray<RegExp> = [
  /(?:^|[\W_])onlyfans/i,
  /(?:^|[\W_])nude/i,
  /(?:^|[\W_])porn/i,
  /(?:^|[\W_])xxx/i,
];

// Decision thresholds, tuned for a Christian-community surface. The intent is
// to err on the side of routing borderline content to "unsure" (which surfaces
// a chip and a quiet steward review) rather than silently blocking.
export const IMAGE_MODERATION_THRESHOLDS = {
  block: 0.6,
  unsure: 0.32,
} as const;

const CATEGORY_FROM_BACKEND_LABEL: Record<string, ClientImageModerationCategory> = {
  sexual: 'sexual',
  'sexual/minors': 'sexual',
  hate: 'hate',
  'hate/threatening': 'hate',
  harassment: 'hate',
  'harassment/threatening': 'hate',
  'self-harm': 'self-harm',
  'self-harm/instructions': 'self-harm',
  'self-harm/intent': 'self-harm',
  violence: 'violence',
  'violence/graphic': 'graphic',
};

type FastHeuristic = {
  decision: Extract<ClientImageModerationDecision, 'unsure'> | null;
  reason?: string;
};

const runFastHeuristic = ({ uri, fileName }: { uri: string; fileName?: string }): FastHeuristic => {
  const candidate = (fileName ?? uri).toLowerCase();
  const matched = FAST_HEURISTIC_FILE_NAME_PATTERNS.find((rule) => rule.test(candidate));
  if (matched) {
    return {
      decision: 'unsure',
      reason: 'File name contains a flagged marker; sending to steward review.',
    };
  }
  return { decision: null };
};

const extractTopCategory = (
  matched: BackendFallbackModerationResponse['matchedCategories']
): { name: string; score: number } | null => {
  if (!matched || matched.length === 0) {
    return null;
  }
  return matched.reduce(
    (best, current) => {
      if (!best || current.score > best.score) {
        return { name: current.category, score: current.score };
      }
      return best;
    },
    null as { name: string; score: number } | null
  );
};

const buildScoresMap = (
  matched: BackendFallbackModerationResponse['matchedCategories']
): Record<string, number> => {
  if (!matched) {
    return {};
  }
  return matched.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry.category] = entry.score;
    return accumulator;
  }, {});
};

const resolveDecision = (severity: number): ClientImageModerationDecision => {
  if (severity >= IMAGE_MODERATION_THRESHOLDS.block) {
    return 'blocked';
  }
  if (severity >= IMAGE_MODERATION_THRESHOLDS.unsure) {
    return 'unsure';
  }
  return 'safe';
};

const resolveCategory = (label: string): ClientImageModerationCategory => {
  return CATEGORY_FROM_BACKEND_LABEL[label] ?? 'other';
};

export type ModerateClientImageInput = {
  uri: string;
  fileName?: string;
};

export const moderateClientImage = async ({
  uri,
  fileName,
}: ModerateClientImageInput): Promise<ClientImageModerationResult> => {
  if (!uri) {
    return {
      decision: 'unavailable',
      severity: 0,
      reason: 'No image URI provided.',
      source: 'heuristic',
      scores: {},
    };
  }

  const heuristic = runFastHeuristic({ uri, fileName });
  if (heuristic.decision === 'unsure') {
    return {
      decision: 'unsure',
      severity: 0.5,
      reason: heuristic.reason,
      source: 'heuristic',
      scores: { 'heuristic-name-match': 1 },
    };
  }

  try {
    const dataUri = await buildImageDataUri(uri);
    const response = await callBackendFallbackModeration({
      type: 'image',
      content: dataUri,
      clientMetadata: {
        fileName,
        source: 'composer-pre-screen',
      },
    });

    const topCategory = extractTopCategory(response.matchedCategories);
    const severity = topCategory?.score ?? 0;
    const decision: ClientImageModerationDecision =
      response.finalAction === 'block'
        ? 'blocked'
        : response.finalAction === 'pending_review'
          ? 'unsure'
          : resolveDecision(severity);

    return {
      decision,
      severity,
      reason: topCategory?.name,
      category: topCategory ? resolveCategory(topCategory.name) : undefined,
      source: 'backend-pre-screen',
      scores: buildScoresMap(response.matchedCategories),
    };
  } catch (error) {
    return {
      decision: 'unavailable',
      severity: 0,
      reason: error instanceof Error ? error.message : 'Moderation pre-screen unavailable',
      source: 'backend-pre-screen',
      scores: {},
    };
  }
};
