const LOCAL_VIDEO_MODERATION_ORIGIN = 'https://onebody.local';
export const LOCAL_VIDEO_MODERATION_BASE_URL = `${LOCAL_VIDEO_MODERATION_ORIGIN}/video-moderation/`;

const sanitizeInlineScript = (source: string) => source.replace(/<\/script/gi, '<\\/script');

export const shouldAllowVideoModerationNavigation = (url?: string) => {
  if (!url) {
    return false;
  }

  return url === 'about:blank' || url.startsWith(LOCAL_VIDEO_MODERATION_BASE_URL);
};

export const buildVideoModerationBridgeHtml = ({
  tfjsSource,
  nsfwjsSource,
  modelJson,
  modelShardBase64,
}: {
  tfjsSource: string;
  nsfwjsSource: string;
  modelJson: string;
  modelShardBase64: string;
}) => `<!DOCTYPE html>
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
      ${sanitizeInlineScript(tfjsSource)}
    </script>
    <script>
      ${sanitizeInlineScript(nsfwjsSource)}
    </script>
    <script>
      const NSFW_BLOCK_THRESHOLDS = {
        porn: 0.6,
        hentai: 0.6,
        sexy: 0.92,
      };

      const NSFW_UNSURE_THRESHOLDS = {
        porn: 0.35,
        hentai: 0.35,
        sexy: 0.6,
      };

      const LOCAL_MODEL_BASE_URL = ${JSON.stringify(LOCAL_VIDEO_MODERATION_BASE_URL)};
      const LOCAL_MODEL_JSON = ${JSON.stringify(modelJson)};
      const LOCAL_MODEL_SHARD_BASE64 = ${JSON.stringify(modelShardBase64)};
      const MODEL_JSON_URL = LOCAL_MODEL_BASE_URL + 'model.json';
      const MODEL_SHARD_URL = LOCAL_MODEL_BASE_URL + 'group1-shard1of1';

      let nsfwModelPromise = null;

      const postToNative = (payload) => {
        window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
      };

      const decodeBase64ToArrayBuffer = (value) => {
        const binary = window.atob(value);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        return bytes.buffer;
      };

      const originalFetch = window.fetch.bind(window);
      window.fetch = async (resource, init) => {
        const requestUrl =
          typeof resource === 'string' ? resource : resource?.url || '';

        if (requestUrl === MODEL_JSON_URL || requestUrl.endsWith('/model.json')) {
          return new Response(LOCAL_MODEL_JSON, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (
          requestUrl === MODEL_SHARD_URL ||
          requestUrl.endsWith('/group1-shard1of1')
        ) {
          return new Response(decodeBase64ToArrayBuffer(LOCAL_MODEL_SHARD_BASE64), {
            status: 200,
            headers: { 'Content-Type': 'application/octet-stream' },
          });
        }

        return originalFetch(resource, init);
      };

      const getNsfwModel = async () => {
        if (!nsfwModelPromise) {
          nsfwModelPromise = window.nsfwjs.load(LOCAL_MODEL_BASE_URL);
        }
        return nsfwModelPromise;
      };

      const loadImage = (sourceUri) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Unable to load moderation frame.'));
          image.src = sourceUri;
        });

      const mapScores = (predictions = []) => {
        const scores = {
          neutral: 0,
          drawing: 0,
          sexy: 0,
          porn: 0,
          hentai: 0,
        };

        predictions.forEach((prediction) => {
          const key = String(prediction?.className || '').toLowerCase();
          const value = Number(prediction?.probability || 0);
          if (Object.prototype.hasOwnProperty.call(scores, key)) {
            scores[key] = value;
          }
        });

        return scores;
      };

      const getDecision = (scores) => {
        if (
          scores.porn >= NSFW_BLOCK_THRESHOLDS.porn ||
          scores.hentai >= NSFW_BLOCK_THRESHOLDS.hentai ||
          scores.sexy >= NSFW_BLOCK_THRESHOLDS.sexy
        ) {
          return 'blocked';
        }

        if (
          scores.porn >= NSFW_UNSURE_THRESHOLDS.porn ||
          scores.hentai >= NSFW_UNSURE_THRESHOLDS.hentai ||
          scores.sexy >= NSFW_UNSURE_THRESHOLDS.sexy
        ) {
          return 'unsure';
        }

        return 'safe';
      };

      const aggregateScores = (scoreSets) =>
        scoreSets.reduce(
          (acc, current) => ({
            neutral: Math.max(acc.neutral, Number(current?.neutral || 0)),
            drawing: Math.max(acc.drawing, Number(current?.drawing || 0)),
            sexy: Math.max(acc.sexy, Number(current?.sexy || 0)),
            porn: Math.max(acc.porn, Number(current?.porn || 0)),
            hentai: Math.max(acc.hentai, Number(current?.hentai || 0)),
          }),
          { neutral: 0, drawing: 0, sexy: 0, porn: 0, hentai: 0 }
        );

      const classifyRequest = async (message) => {
        const requestId = message?.requestId;
        const frames = Array.isArray(message?.frameDataUris) ? message.frameDataUris : [];
        if (!requestId) {
          postToNative({ type: 'error', message: 'Missing moderation request id.' });
          return;
        }

        if (frames.length === 0) {
          postToNative({
            type: 'result',
            requestId,
            payload: {
              moderationDecision: 'unclassified',
              moderationScores: null,
              moderationError: 'no-frames',
            },
          });
          return;
        }

        try {
          const model = await getNsfwModel();
          const scoreSets = [];

          for (const frameDataUri of frames) {
            const image = await loadImage(frameDataUri);
            const predictions = await model.classify(image, 5);
            scoreSets.push(mapScores(predictions));
          }

          const moderationScores = aggregateScores(scoreSets);
          postToNative({
            type: 'result',
            requestId,
            payload: {
              moderationDecision: getDecision(moderationScores),
              moderationScores,
            },
          });
        } catch (error) {
          postToNative({
            type: 'result',
            requestId,
            payload: {
              moderationDecision: 'unclassified',
              moderationScores: null,
              moderationError: error?.message || 'nsfw-model-unavailable',
            },
          });
        }
      };

      const handleIncomingMessage = (event) => {
        try {
          const message = JSON.parse(event?.data || '{}');
          if (message?.type === 'classify') {
            classifyRequest(message);
          }
        } catch (error) {
          postToNative({
            type: 'error',
            message: error?.message || 'Unable to parse moderation request.',
          });
        }
      };

      document.addEventListener('message', handleIncomingMessage);
      window.addEventListener('message', handleIncomingMessage);
      window.addEventListener('error', (event) => {
        postToNative({
          type: 'error',
          message: event?.message || 'Video moderation bridge error.',
        });
      });
      window.addEventListener('unhandledrejection', (event) => {
        const reason = event?.reason;
        postToNative({
          type: 'error',
          message: typeof reason === 'string' ? reason : reason?.message || 'Bridge rejected.',
        });
      });

      getNsfwModel().catch((error) => {
        postToNative({
          type: 'error',
          message: error?.message || 'Unable to warm video moderation bridge.',
        });
      });

      postToNative({ type: 'ready' });
    </script>
  </body>
</html>`;
