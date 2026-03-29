import {
  mobilenetV2Group1ShardBase64,
  mobilenetV2ModelJson,
} from './videoModerationAssets/mobilenetV2Model';
import nsfwjsMin from './videoModerationAssets/nsfwjsMin';
import tfjsMin from './videoModerationAssets/tfjsMin';
import { LOCAL_VIDEO_MODERATION_BASE_URL } from './videoModerationBridgeHtml';

const sanitizeInlineScript = (source: string) => source.replace(/<\/script/gi, '<\\/script');

export const IMAGE_EDITOR_WEBVIEW_ALLOWED_ORIGINS = [
  'about:blank',
  'https://esm.sh',
  'https://scaleflex.cloudimg.io',
  'https://justadudewhohacks.github.io',
];

const ALLOWED_IMAGE_EDITOR_NAVIGATION_PREFIXES = [
  LOCAL_VIDEO_MODERATION_BASE_URL,
  'about:blank',
  'data:',
  'blob:',
  'file://',
  'content://',
  'https://esm.sh/',
  'https://scaleflex.cloudimg.io/',
  'https://justadudewhohacks.github.io/',
];

export const shouldAllowImageEditorNavigation = (url?: string) => {
  if (!url) {
    return false;
  }

  return ALLOWED_IMAGE_EDITOR_NAVIGATION_PREFIXES.some((prefix) => url.startsWith(prefix));
};

export const buildLocalImageEditorModerationRuntime = () => `
    <script>
      ${sanitizeInlineScript(tfjsMin)}
    </script>
    <script>
      ${sanitizeInlineScript(nsfwjsMin)}
    </script>
    <script>
      (() => {
        const LOCAL_MODEL_BASE_URL = ${JSON.stringify(LOCAL_VIDEO_MODERATION_BASE_URL)};
        const LOCAL_MODEL_JSON = ${JSON.stringify(mobilenetV2ModelJson)};
        const LOCAL_MODEL_SHARD_BASE64 = ${JSON.stringify(mobilenetV2Group1ShardBase64)};
        const MODEL_JSON_URL = LOCAL_MODEL_BASE_URL + 'model.json';
        const MODEL_SHARD_URL = LOCAL_MODEL_BASE_URL + 'group1-shard1of1';
        let nsfwModelPromise = null;

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

          if (
            requestUrl === MODEL_JSON_URL ||
            requestUrl.endsWith('/model.json')
          ) {
            return new Response(LOCAL_MODEL_JSON, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          if (
            requestUrl === MODEL_SHARD_URL ||
            requestUrl.endsWith('/group1-shard1of1')
          ) {
            return new Response(
              decodeBase64ToArrayBuffer(LOCAL_MODEL_SHARD_BASE64),
              {
                status: 200,
                headers: { 'Content-Type': 'application/octet-stream' },
              },
            );
          }

          return originalFetch(resource, init);
        };

        window.__ONEBODY_GET_NSFW_MODEL__ = async () => {
          if (!nsfwModelPromise) {
            nsfwModelPromise = window.nsfwjs.load(LOCAL_MODEL_BASE_URL);
          }
          return nsfwModelPromise;
        };
      })();
    </script>
  `;
