import RNFS from 'react-native-fs';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-backend-cpu';
import * as toxicity from '@tensorflow-models/toxicity';
import { ApiCall } from '@/src/services/api';
import type {
  BackendFallbackModerationRequest,
  BackendFallbackModerationResponse,
  ClientModerationAction,
  ClientModerationResult,
  ClientTextModerationScores,
  ModerationReviewCheckPayload,
  ModerationReviewPayload,
} from './types';

const TEXT_BLOCK_THRESHOLD = 0.75;
const TEXT_FALLBACK_THRESHOLD = 0.4;

const TOXICITY_LABELS = [
  'toxicity',
  'severe_toxicity',
  'identity_attack',
  'insult',
  'threat',
  'sexual_explicit',
] as const;

const BLOCKED_TEXT_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  {
    id: 'hate-slur',
    pattern: /\b(?:fagg?(?:ot)?|nigg(?:er|a)|spic|kike)\b/i,
  },
  {
    id: 'self-harm',
    pattern: /\b(?:kill yourself|kys)\b/i,
  },
  {
    id: 'sexual-violence',
    pattern: /\b(?:rape|raped|raping)\b/i,
  },
  {
    id: 'sexual-content',
    pattern: /\b(?:porn|xxx|onlyfans|nudes?|sex\s*tape)\b/i,
  },
  {
    id: 'profanity',
    pattern:
      /\b(?:f[\W_]*u[\W_]*c[\W_]*k(?:e?r|ing|ed)?|s[\W_]*h[\W_]*[i!1|][\W_]*t(?:ty|head)?|b[\W_]*[i!1|][\W_]*t[\W_]*c[\W_]*h(?:es|ing)?|c[\W_]*u[\W_]*n[\W_]*t|a[\W_]*s[\W_]*s[\W_]*h[\W_]*o[\W_]*l[\W_]*e|d[\W_]*[i!1|][\W_]*c[\W_]*k|p[\W_]*u[\W_]*s[\W_]*s[\W_]*y|c[\W_]*o[\W_]*c[\W_]*k)\b/i,
  },
];

let tensorflowReadyPromise: Promise<void> | null = null;
let toxicityModelPromise: Promise<toxicity.ToxicityClassifier> | null = null;

const stripFileScheme = (value: string) => (value.startsWith('file://') ? value.slice(7) : value);

const getImageMimeType = (uri: string) => {
  const normalizedUri = uri.toLowerCase();
  if (normalizedUri.endsWith('.png')) {
    return 'image/png';
  }
  if (normalizedUri.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'image/jpeg';
};

const normalizeNumericScore = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeTextForLexicalModeration = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[1|]/g, 'i')
    .replace(/[@4]/g, 'a')
    .replace(/[$5]/g, 's')
    .replace(/[0]/g, 'o')
    .replace(/[3]/g, 'e')
    .replace(/[+7]/g, 't');

const findBlockedTextPattern = (text: string) => {
  const lexicalText = normalizeTextForLexicalModeration(text);
  return BLOCKED_TEXT_PATTERNS.find(
    ({ pattern }) => pattern.test(text) || pattern.test(lexicalText)
  );
};

export const resolveTextActionFromScore = (score: number): ClientModerationAction => {
  if (score > TEXT_BLOCK_THRESHOLD) {
    return 'block';
  }
  if (score >= TEXT_FALLBACK_THRESHOLD) {
    return 'fallback';
  }
  return 'allow';
};

const ensureTensorflowReady = async () => {
  if (!tensorflowReadyPromise) {
    tensorflowReadyPromise = (async () => {
      await tf.ready();
      if (tf.getBackend() !== 'cpu') {
        await tf.setBackend('cpu');
        await tf.ready();
      }
    })();
  }

  await tensorflowReadyPromise;
};

const getToxicityModel = async () => {
  if (!toxicityModelPromise) {
    toxicityModelPromise = (async () => {
      await ensureTensorflowReady();
      return toxicity.load(0, [...TOXICITY_LABELS]);
    })();
  }

  return toxicityModelPromise;
};

export const buildImageDataUri = async (uri: string) => {
  const base64 = await RNFS.readFile(stripFileScheme(uri), 'base64');
  return `data:${getImageMimeType(uri)};base64,${base64}`;
};

export const moderateClientText = async (text: string): Promise<ClientModerationResult> => {
  const normalizedText = String(text ?? '').trim();
  if (!normalizedText) {
    return {
      action: 'allow',
      source: 'heuristic',
      reason: 'empty-text',
    };
  }

  const matchedPattern = findBlockedTextPattern(normalizedText);
  if (matchedPattern) {
    return {
      action: 'block',
      source: 'heuristic',
      reason: `blocked-text:${matchedPattern.id}`,
    };
  }

  try {
    const model = await getToxicityModel();
    const predictions = await model.classify([normalizedText]);
    const byLabel: Record<string, number> = {};
    let maxToxicity = 0;

    predictions.forEach((prediction) => {
      const probabilities = prediction.results?.[0]?.probabilities;
      const toxicityScore = normalizeNumericScore(probabilities?.[1]);
      byLabel[prediction.label] = toxicityScore;
      maxToxicity = Math.max(maxToxicity, toxicityScore);
    });

    const scores: ClientTextModerationScores = {
      maxToxicity,
      byLabel,
    };

    return {
      action: resolveTextActionFromScore(maxToxicity),
      source: 'toxicity',
      scores,
      model: 'tfjs-toxicity',
    };
  } catch (error) {
    return {
      action: 'fallback',
      source: 'toxicity',
      scores: {
        maxToxicity: 0,
        byLabel: {},
      },
      reason: error instanceof Error ? error.message : 'toxicity-model-unavailable',
      model: 'tfjs-toxicity',
    };
  }
};

export const callBackendFallbackModeration = async (
  payload: BackendFallbackModerationRequest
): Promise<BackendFallbackModerationResponse> => {
  const response = await ApiCall<BackendFallbackModerationResponse>({
    route: 'global/moderation/fallback',
    verb: 'post',
    token: true,
    params: payload,
    suppressErrorLog: true,
  });

  if (response.status !== 200) {
    const error = new Error(
      (response.response as { message?: string } | undefined)?.message ||
        'Unable to complete fallback moderation.'
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.response;
};

export const buildPendingModerationReviewPayload = (
  checks: ModerationReviewCheckPayload[]
): ModerationReviewPayload | undefined => {
  const normalizedChecks = checks.filter((check) => check.fallbackAction === 'pending_review');

  if (normalizedChecks.length === 0) {
    return undefined;
  }

  return {
    persistAsPendingReview: true,
    checks: normalizedChecks,
  };
};
