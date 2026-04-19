import { LOCAL_VIDEO_MODERATION_BASE_URL } from './videoModerationBridgeHtml';

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

const LOCAL_NSFWJS_SCRIPT_URL = `${LOCAL_VIDEO_MODERATION_BASE_URL}nsfwjs.js`;

export const buildLocalImageEditorModerationRuntime = () => `
    <script src="${LOCAL_NSFWJS_SCRIPT_URL}"></script>
    <script>
      window.__ONEBODY_GET_NSFW_MODEL__ = (() => {
        let modelPromise = null;
        return () => {
          if (!modelPromise) {
            modelPromise = window.nsfwjs.load(${JSON.stringify(LOCAL_VIDEO_MODERATION_BASE_URL)});
          }
          return modelPromise;
        };
      })();
    </script>
  `;
