import tfjsMin from './videoModerationAssets/tfjsMin';

const TOXICITY_BRIDGE_ORIGIN = 'https://onebody.local';
export const TOXICITY_BRIDGE_BASE_URL = `${TOXICITY_BRIDGE_ORIGIN}/text-moderation/`;
const TOXICITY_SCRIPT_URL =
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/toxicity/dist/toxicity.min.js';

const sanitizeInlineScript = (source: string) => source.replace(/<\/script/gi, '<\\/script');

const ALLOWED_NAVIGATION_PREFIXES = [
  'about:blank',
  TOXICITY_BRIDGE_BASE_URL,
  'https://cdn.jsdelivr.net/',
  'https://storage.googleapis.com/',
];

export const shouldAllowTextModerationNavigation = (url?: string) => {
  if (!url) {
    return false;
  }

  return ALLOWED_NAVIGATION_PREFIXES.some((prefix) => url.startsWith(prefix));
};

export const buildTextModerationBridgeHtml = () => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }
    </style>
  </head>
  <body>
    <script>
      ${sanitizeInlineScript(tfjsMin)}
    </script>
    <script src="${TOXICITY_SCRIPT_URL}"></script>
    <script>
      const TOXICITY_LABELS = [
        'toxicity',
        'severe_toxicity',
        'identity_attack',
        'insult',
        'threat',
        'sexual_explicit',
        'obscene',
      ];
      const TOXICITY_THRESHOLD = 0.4;
      let toxicityModelPromise = null;

      const postToNative = (payload) => {
        window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
      };

      const getToxicityModel = async () => {
        if (!toxicityModelPromise) {
          toxicityModelPromise = window.toxicity.load(TOXICITY_THRESHOLD, TOXICITY_LABELS);
        }
        return toxicityModelPromise;
      };

      const extractProbability = (prediction) => {
        const result = Array.isArray(prediction?.results) ? prediction.results[0] : null;
        const rawProbability = Array.isArray(result?.probabilities)
          ? Number(result.probabilities[1] || 0)
          : 0;
        return Number.isFinite(rawProbability) ? rawProbability : 0;
      };

      const classifyText = async (message) => {
        const requestId = message?.requestId;
        const text = typeof message?.text === 'string' ? message.text.trim() : '';

        if (!requestId) {
          postToNative({ type: 'error', message: 'Missing moderation request id.' });
          return;
        }

        if (!text) {
          postToNative({
            type: 'result',
            requestId,
            payload: {
              scores: { maxToxicity: 0, byLabel: {} },
            },
          });
          return;
        }

        try {
          const model = await getToxicityModel();
          const predictions = await model.classify([text]);
          const byLabel = {};
          let maxToxicity = 0;

          predictions.forEach((prediction) => {
            const label = String(prediction?.label || '').trim();
            if (!label) {
              return;
            }
            const probability = extractProbability(prediction);
            byLabel[label] = probability;
            maxToxicity = Math.max(maxToxicity, probability);
          });

          postToNative({
            type: 'result',
            requestId,
            payload: {
              scores: { maxToxicity, byLabel },
            },
          });
        } catch (error) {
          postToNative({
            type: 'result',
            requestId,
            payload: {
              scores: { maxToxicity: 0, byLabel: {} },
              moderationError: error?.message || 'toxicity-model-unavailable',
            },
          });
        }
      };

      const handleIncomingMessage = (event) => {
        try {
          const message = JSON.parse(event?.data || '{}');
          if (message?.type === 'classify') {
            classifyText(message);
          }
        } catch (error) {
          postToNative({
            type: 'error',
            message: error?.message || 'Unable to parse text moderation request.',
          });
        }
      };

      document.addEventListener('message', handleIncomingMessage);
      window.addEventListener('message', handleIncomingMessage);
      window.addEventListener('error', (event) => {
        postToNative({
          type: 'error',
          message: event?.message || 'Text moderation bridge error.',
        });
      });
      window.addEventListener('unhandledrejection', (event) => {
        const reason = event?.reason;
        postToNative({
          type: 'error',
          message:
            typeof reason === 'string' ? reason : reason?.message || 'Text moderation rejected.',
        });
      });

      getToxicityModel().catch((error) => {
        postToNative({
          type: 'error',
          message: error?.message || 'Unable to warm text moderation bridge.',
        });
      });

      postToNative({ type: 'ready' });
    </script>
  </body>
</html>`;
