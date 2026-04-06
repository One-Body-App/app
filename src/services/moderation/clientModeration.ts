import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import * as tf from '@tensorflow/tfjs';
// eslint-disable-next-line import/no-duplicates
import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-backend-cpu';
// eslint-disable-next-line import/no-duplicates
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as toxicity from '@tensorflow-models/toxicity';
import * as nsfwjs from 'nsfwjs';
import { ApiCall } from '@/src/services/api';
import type {
  BackendFallbackModerationRequest,
  BackendFallbackModerationResponse,
  ClientImageModerationScores,
  ClientModerationAction,
  ClientModerationResult,
  ClientTextModerationScores,
  ModerationReviewCheckPayload,
  ModerationReviewPayload,
} from './types';

const TEXT_BLOCK_THRESHOLD = 0.75;
const TEXT_FALLBACK_THRESHOLD = 0.4;
const IMAGE_BLOCK_THRESHOLD = 0.75;
const IMAGE_FALLBACK_THRESHOLD = 0.4;

const TOXICITY_LABELS = [
  'toxicity',
  'severe_toxicity',
  'identity_attack',
  'insult',
  'threat',
  'sexual_explicit',
] as const;

const BLOCKED_TEXT_PATTERNS = [
  /\b(?:fagg?(?:ot)?|nigg(?:er|a)|spic|kike)\b/i,
  /\b(?:kill yourself|kys)\b/i,
  /\b(?:rape|raped|raping)\b/i,
  /\b(?:porn|xxx|onlyfans|nudes?|sex\s*tape)\b/i,
];

let tensorflowReadyPromise: Promise<void> | null = null;
let toxicityModelPromise: Promise<toxicity.ToxicityClassifier> | null = null;
let nsfwModelPromise: Promise<any> | null = null;

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

export const resolveTextActionFromScore = (score: number): ClientModerationAction => {
  if (score > TEXT_BLOCK_THRESHOLD) {
    return 'block';
  }
  if (score >= TEXT_FALLBACK_THRESHOLD) {
    return 'fallback';
  }
  return 'allow';
};

export const resolveImageActionFromScore = (score: number): ClientModerationAction => {
  if (score > IMAGE_BLOCK_THRESHOLD) {
    return 'block';
  }
  if (score >= IMAGE_FALLBACK_THRESHOLD) {
    return 'fallback';
  }
  return 'allow';
};

const getMaxImageScore = (scores: ClientImageModerationScores) =>
  Math.max(
    normalizeNumericScore(scores.porn),
    normalizeNumericScore(scores.sexy),
    normalizeNumericScore(scores.hentai)
  );

const aggregateImageScores = (scores: ClientImageModerationScores[]) =>
  scores.reduce<ClientImageModerationScores>(
    (current, next) => ({
      neutral: Math.max(current.neutral, normalizeNumericScore(next.neutral)),
      drawing: Math.max(current.drawing, normalizeNumericScore(next.drawing)),
      sexy: Math.max(current.sexy, normalizeNumericScore(next.sexy)),
      porn: Math.max(current.porn, normalizeNumericScore(next.porn)),
      hentai: Math.max(current.hentai, normalizeNumericScore(next.hentai)),
    }),
    {
      neutral: 0,
      drawing: 0,
      sexy: 0,
      porn: 0,
      hentai: 0,
    }
  );

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

const getNsfwModel = async () => {
  if (!nsfwModelPromise) {
    nsfwModelPromise = (async () => {
      await ensureTensorflowReady();
      return nsfwjs.load();
    })();
  }

  return nsfwModelPromise;
};

const decodeImageUriToTensor = async (uri: string) => {
  const base64 = await RNFS.readFile(stripFileScheme(uri), 'base64');
  const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
  return decodeJpeg(bytes, 3);
};

export const buildImageDataUri = async (uri: string) => {
  const base64 = await RNFS.readFile(stripFileScheme(uri), 'base64');
  return `data:${getImageMimeType(uri)};base64,${base64}`;
};

const classifyImageUri = async (uri: string): Promise<ClientImageModerationScores> => {
  const model = await getNsfwModel();
  const imageTensor = await decodeImageUriToTensor(uri);

  try {
    const predictions = await model.classify(imageTensor);
    const scores: ClientImageModerationScores = {
      neutral: 0,
      drawing: 0,
      sexy: 0,
      porn: 0,
      hentai: 0,
    };

    predictions.forEach((prediction: { className?: string; probability?: number }) => {
      const probability = normalizeNumericScore(prediction.probability);
      switch (String(prediction.className ?? '').toLowerCase()) {
        case 'neutral':
          scores.neutral = probability;
          break;
        case 'drawing':
          scores.drawing = probability;
          break;
        case 'sexy':
          scores.sexy = probability;
          break;
        case 'porn':
          scores.porn = probability;
          break;
        case 'hentai':
          scores.hentai = probability;
          break;
        default:
          break;
      }
    });

    return scores;
  } finally {
    tf.dispose(imageTensor);
  }
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

  const matchedPattern = BLOCKED_TEXT_PATTERNS.find((pattern) => pattern.test(normalizedText));
  if (matchedPattern) {
    return {
      action: 'block',
      source: 'heuristic',
      reason: matchedPattern.source,
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

export const moderateClientImages = async (
  imageUris: string[]
): Promise<ClientModerationResult> => {
  const normalizedUris = imageUris.map((value) => String(value ?? '').trim()).filter(Boolean);

  if (normalizedUris.length === 0) {
    return {
      action: 'allow',
      source: 'nsfwjs',
      scores: {
        neutral: 0,
        drawing: 0,
        sexy: 0,
        porn: 0,
        hentai: 0,
      },
      reason: 'no-images',
      model: 'nsfwjs',
    };
  }

  try {
    const frameScores = await Promise.all(normalizedUris.map(classifyImageUri));
    const scores = aggregateImageScores(frameScores);

    return {
      action: resolveImageActionFromScore(getMaxImageScore(scores)),
      source: 'nsfwjs',
      scores,
      model: 'nsfwjs',
    };
  } catch (error) {
    return {
      action: 'fallback',
      source: 'nsfwjs',
      scores: {
        neutral: 0,
        drawing: 0,
        sexy: 0,
        porn: 0,
        hentai: 0,
      },
      reason: error instanceof Error ? error.message : 'nsfw-model-unavailable',
      model: 'nsfwjs',
    };
  }
};

export const moderateClientVideoFrames = async (
  frameUris: string[]
): Promise<ClientModerationResult> => {
  const normalizedUris = frameUris.map((value) => String(value ?? '').trim()).filter(Boolean);

  if (normalizedUris.length === 0) {
    return {
      action: 'fallback',
      source: 'nsfwjs',
      scores: {
        neutral: 0,
        drawing: 0,
        sexy: 0,
        porn: 0,
        hentai: 0,
      },
      reason: 'no-video-frames',
      model: 'nsfwjs',
    };
  }

  try {
    let aggregateScores: ClientImageModerationScores = {
      neutral: 0,
      drawing: 0,
      sexy: 0,
      porn: 0,
      hentai: 0,
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const frameUri of normalizedUris) {
      // eslint-disable-next-line no-await-in-loop
      const frameScores = await classifyImageUri(frameUri);
      aggregateScores = aggregateImageScores([aggregateScores, frameScores]);
      const action = resolveImageActionFromScore(getMaxImageScore(aggregateScores));
      if (action === 'block') {
        return {
          action,
          source: 'nsfwjs',
          scores: aggregateScores,
          model: 'nsfwjs',
        };
      }
    }

    return {
      action: resolveImageActionFromScore(getMaxImageScore(aggregateScores)),
      source: 'nsfwjs',
      scores: aggregateScores,
      model: 'nsfwjs',
    };
  } catch (error) {
    return {
      action: 'fallback',
      source: 'nsfwjs',
      scores: {
        neutral: 0,
        drawing: 0,
        sexy: 0,
        porn: 0,
        hentai: 0,
      },
      reason: error instanceof Error ? error.message : 'video-frame-moderation-failed',
      model: 'nsfwjs',
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
  });

  if (response.status !== 200) {
    throw new Error(
      (response.response as { message?: string } | undefined)?.message ||
        'Unable to complete fallback moderation.'
    );
  }

  return response.response;
};

export const buildPendingModerationReviewPayload = (
  checks: ModerationReviewCheckPayload[]
): ModerationReviewPayload | undefined => {
  const normalizedChecks = checks.filter(
    (check) => check.fallbackAction === 'flag_for_admin_review'
  );

  if (normalizedChecks.length === 0) {
    return undefined;
  }

  return {
    persistAsPendingReview: true,
    checks: normalizedChecks,
  };
};
