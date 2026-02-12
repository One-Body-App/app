import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import RNFS from 'react-native-fs';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '@react-navigation/native';
import { useToast } from 'react-native-toast-notifications';
import type { ImageEditorUIConfig } from '@vitaliez/react-native-image-editor-sdk';
import StyledText from '@/components/styled/Text';
import { ApiCall } from '@/services/api';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

const BRAND_BACKGROUND = '#3c4b64';
const BRAND_ACCENT = '#12d2d9';
const BRAND_SURFACE = '#435677';
const BRAND_TEXT_PRIMARY = '#e7edf7';
const BRAND_TEXT_SECONDARY = '#b9c7dc';
const MAX_EDITOR_BYTES = 50 * 1024 * 1024;
const MAX_ANDROID_WEB_EDITOR_BYTES = 12 * 1024 * 1024;
const MAX_EDITOR_WIDTH = 1080;
const MAX_EDITOR_HEIGHT = 1920;
const HEADER_FONT_FAMILY = Platform.select({
  ios: 'Rubik-Bold',
  android: 'Rubik-Bold',
  default: 'Rubik-Bold',
});
const BODY_FONT_FAMILY = Platform.select({
  ios: 'SF Pro Text',
  android: 'sans-serif',
  default: 'System',
});
const OTHER_FONT_FAMILY = Platform.select({
  ios: 'OpenSans-Regular',
  android: 'OpenSans-Regular',
  default: 'OpenSans-Regular',
});
// Optional placeholder route for queuing "unsure" images to admin review.
// Example: 'moderation/client-image-review'
const CLIENT_NSFW_REVIEW_ROUTE = '';

type EditorAsset = {
  uri: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
};

type SavedMedia = {
  url: string;
  name: string;
};

type ClientModerationDecision = 'safe' | 'unsure' | 'blocked' | 'unclassified';

type ClientModerationScores = {
  neutral: number;
  drawing: number;
  sexy: number;
  porn: number;
  hentai: number;
};

type EditorMessage =
  | { type: 'ready' }
  | {
      type: 'save';
      payload: {
        imageBase64?: string;
        name?: string;
        extension?: string;
        mimeType?: string;
        moderationDecision?: ClientModerationDecision;
        moderationScores?: ClientModerationScores | null;
        moderationError?: string;
      };
    }
  | {
      type: 'moderation_blocked';
      payload?: {
        moderationDecision?: ClientModerationDecision;
        moderationScores?: ClientModerationScores | null;
      };
    }
  | { type: 'error'; message?: string }
  | { type: 'closed' };

type Props = {
  visible: boolean;
  asset: EditorAsset | null;
  token?: string;
  userId?: string;
  saveMode?: 'upload' | 'local';
  onCancel: () => void;
  onSaved: (media: SavedMedia) => void;
};

const getFileExtension = (fileNameOrPath: string | undefined) => {
  if (!fileNameOrPath) {
    return '';
  }
  const cleanPath = fileNameOrPath.split('?')[0];
  const dotIndex = cleanPath.lastIndexOf('.');
  if (dotIndex < 0) {
    return '';
  }
  return cleanPath.slice(dotIndex + 1).toLowerCase();
};

const normalizeFileUri = (uri: string) => {
  if (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  ) {
    return uri;
  }
  return `file://${uri}`;
};

const getFileNameFromUri = (uri?: string) => {
  if (!uri) {
    return '';
  }
  const cleanPath = uri.split('?')[0];
  return cleanPath.split('/').pop() ?? '';
};

const ensureJpgName = (baseName?: string) => {
  const fallback = `edited_${Date.now()}.jpg`;
  if (!baseName) {
    return fallback;
  }
  const extension = getFileExtension(baseName);
  if (!extension) {
    return `${baseName}.jpg`;
  }
  if (extension === 'jpg' || extension === 'jpeg') {
    return baseName;
  }
  return `${baseName.slice(0, baseName.length - extension.length - 1)}.jpg`;
};

const toSvgDataUri = (svgSource: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgSource)}`;

const faithStickerCatalog = {
  '/assets/stickers/cross.svg': toSvgDataUri(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="52" y="12" width="24" height="104" rx="8" fill="#12d2d9"/><rect x="24" y="48" width="80" height="24" rx="8" fill="#12d2d9"/></svg>'
  ),
  '/assets/stickers/dove.svg': toSvgDataUri(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path fill="#12d2d9" d="M14 70c19 8 35 8 49 1l10-21 17 5c4 1 8-1 9-5l6-18c1-3 0-6-2-8-2-3-6-4-9-3L72 29l12-16c2-3 2-7 0-10-2-2-5-3-8-2-23 9-36 24-39 46l-23 8z"/><path fill="#126b87" d="M16 82c14 19 32 32 55 36 24 3 43-3 57-18-16 3-30 1-42-6-12-7-23-18-32-33-7 9-20 16-38 21z"/></svg>'
  ),
  '/assets/stickers/bible.svg': toSvgDataUri(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path fill="#12d2d9" d="M16 24a12 12 0 0 1 12-12h70c8 0 14 6 14 14v72c0 8-6 14-14 14H26a14 14 0 0 1-14-14V24z"/><path fill="#126b87" d="M28 24h54v88H28a8 8 0 0 1-8-8V32a8 8 0 0 1 8-8z"/><rect x="46" y="36" width="18" height="52" rx="4" fill="#e6eaec"/><rect x="30" y="53" width="50" height="16" rx="4" fill="#e6eaec"/></svg>'
  ),
  '/assets/stickers/shield-of-faith.svg': toSvgDataUri(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path fill="#12d2d9" d="M64 8 20 24v33c0 30 20 54 44 63 24-9 44-33 44-63V24L64 8z"/><path fill="#126b87" d="M64 20 32 31v25c0 23 14 42 32 49 18-7 32-26 32-49V31L64 20z"/><rect x="58" y="34" width="12" height="44" rx="4" fill="#e6eaec"/><rect x="42" y="50" width="44" height="12" rx="4" fill="#e6eaec"/></svg>'
  ),
};

const extractHttpUrl = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.startsWith('http')) {
    return value;
  }
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const candidateKeys = ['url', 'fileUrl', 'mediaUrl', 'signedUrl', 'location', 'path', 'cdnUrl'];
  const direct = candidateKeys
    .map((key) => record[key])
    .find((candidate) => typeof candidate === 'string' && candidate.startsWith('http'));
  if (typeof direct === 'string') {
    return direct;
  }
  const nestedKeys = ['data', 'response', 'file', 'media', 'result'];
  // eslint-disable-next-line no-restricted-syntax
  for (const key of nestedKeys) {
    const nestedCandidate = extractHttpUrl(record[key]);
    if (nestedCandidate) {
      return nestedCandidate;
    }
  }
  if (Array.isArray(value)) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of value) {
      const nestedCandidate = extractHttpUrl(item);
      if (nestedCandidate) {
        return nestedCandidate;
      }
    }
  }
  return undefined;
};

const buildHtml = ({
  source,
  userId,
  stickerCatalog,
}: {
  source: string;
  userId: string;
  stickerCatalog: Record<string, string>;
}) => {
  const stickerEntries = Object.entries(stickerCatalog).map(([path, uri]) => ({
    path,
    uri,
    originalUrl: uri,
    previewUrl: uri,
  }));
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { box-sizing: border-box; }
      html, body, #root {
        margin: 0;
        width: 100%;
        height: 100%;
        background: ${BRAND_BACKGROUND};
        overflow: hidden;
        color: ${BRAND_TEXT_PRIMARY};
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #root {
        padding: 0;
      }
      #main-editor-container {
        width: 100%;
        height: 100%;
      }
      .SfxModal-Wrapper,
      .SfxTopbar-Wrapper,
      .SfxToolsBar-Wrapper,
      .SfxTabsNavbar-Wrapper {
        background: ${BRAND_BACKGROUND} !important;
      }
      .FIE_root,
      .FIE_root * {
        color: ${BRAND_TEXT_PRIMARY};
      }
      .FIE_root .FIE_topbar,
      .FIE_root .FIE_tools-bar,
      .FIE_root .FIE_tabs_navbar,
      .FIE_root .SfxMenuItem-label,
      .FIE_root .SfxLabel-root,
      .FIE_root .SfxInput-input,
      .FIE_root .FIE_tab-label,
      .FIE_root .FIE_image_info {
        font-family: 'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
      .FIE_root .SfxMenuItem-hint,
      .FIE_root .SfxLabel-description,
      .FIE_root .SfxLabel-subtitle,
      .FIE_root .SfxInput-input::placeholder {
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
      .FIE_root,
      .FIE_root button,
      .FIE_root input,
      .FIE_root select,
      .FIE_root label,
      .FIE_root .SfxMenuItem-label,
      .FIE_root .SfxLabel-root,
      .FIE_root .FIE_tab-label,
      .FIE_root .FIE_image_info {
        font-size: 15px !important;
      }
      .FIE_root .SfxMenuItem-root,
      .FIE_root .SfxInput-root,
      .FIE_root .SfxSelect-root,
      .FIE_root .SfxMenu-root,
      .FIE_root .SfxPopper-root .SfxMenu-root {
        background: ${BRAND_SURFACE} !important;
        color: ${BRAND_TEXT_PRIMARY} !important;
      }
      .FIE_root .SfxMenuItem-root:hover,
      .FIE_root .SfxMenuItem-root[aria-selected='true'],
      .FIE_root .SfxMenuItem-root[aria-current='true'] {
        background: rgba(18, 210, 217, 0.15) !important;
      }
      .FIE_root .SfxMenuItem-label,
      .FIE_root .SfxLabel-root,
      .FIE_root .SfxInput-input,
      .FIE_root .SfxInput-input::placeholder {
        color: ${BRAND_TEXT_PRIMARY} !important;
      }
      .FIE_root .SfxMenuItem-hint,
      .FIE_root .SfxLabel-description,
      .FIE_root .SfxLabel-subtitle {
        color: ${BRAND_TEXT_SECONDARY} !important;
      }
      button,
      [role='button'] {
        accent-color: ${BRAND_ACCENT};
      }
      .FIE_root .FIE_tabs_navbar,
      .FIE_root .FIE_tools-bar,
      .FIE_root .FIE_tools {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        scrollbar-width: none !important;
      }
      .FIE_root .FIE_tabs_navbar::-webkit-scrollbar,
      .FIE_root .FIE_tools-bar::-webkit-scrollbar,
      .FIE_root .FIE_tools::-webkit-scrollbar {
        display: none !important;
      }
      .FIE_root .FIE_tabs_navbar > *,
      .FIE_root .FIE_tools > * {
        flex: 0 0 auto !important;
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div id="main-editor-container"></div>
    </div>
    <script type="module">
      const source = ${JSON.stringify(source)};
      const userId = ${JSON.stringify(userId)};
      const faithPack = ${JSON.stringify(stickerEntries)};
      const shieldPath = '/assets/stickers/shield-of-faith.svg';
      const shieldSticker = faithPack.find((item) => item.path === shieldPath);
      const getCurrentImgDataFnRef = { current: null };
      const updateStateFnRef = { current: null };
      const shieldAppliedIds = new Set();
      let faceBox = null;
      let nsfwModelPromise = null;
      let faceApiModulePromise = null;
      let faceDetectionPromise = null;

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
      const MAX_EDITOR_WIDTH = ${MAX_EDITOR_WIDTH};
      const MAX_EDITOR_HEIGHT = ${MAX_EDITOR_HEIGHT};

      const postToNative = (payload) => {
        window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
      };

      const loadExternalScript = (src) =>
        new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = () => resolve(true);
          script.onerror = () => reject(new Error('Failed to load script: ' + src));
          document.head.appendChild(script);
        });

      window.addEventListener('error', (event) => {
        postToNative({
          type: 'error',
          message: event?.message || 'Editor runtime error.',
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        const reason = event?.reason;
        const reasonMessage =
          typeof reason === 'string'
            ? reason
            : reason?.message || 'Editor runtime promise rejection.';
        postToNative({
          type: 'error',
          message: reasonMessage,
        });
      });

      const editorSource = source;

      const getFaceApi = async () => {
        if (!faceApiModulePromise) {
          faceApiModulePromise = import('https://esm.sh/face-api.js@0.22.2').then((module) => {
            return module?.default ?? module;
          });
        }
        return faceApiModulePromise;
      };

      const getNsfwModel = async () => {
        if (!nsfwModelPromise) {
          nsfwModelPromise = import('https://esm.sh/nsfwjs@2.4.2')
            .then((module) => module?.default ?? module)
            .then((nsfw) => nsfw.load());
        }
        return nsfwModelPromise;
      };

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

      const loadImageFromDataUri = (sourceUri) =>
        new Promise((resolve, reject) => {
          if (!sourceUri) {
            reject(new Error('No image source.'));
            return;
          }
          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Unable to load image for moderation.'));
          image.src = sourceUri;
        });

      const validateEditorDimensions = async (sourceUri) => {
        if (!sourceUri) {
          return {
            allowed: false,
            reason: 'missing-image-data',
          };
        }
        try {
          const image = await loadImageFromDataUri(sourceUri);
          const width = Number(image?.naturalWidth || image?.width || 0);
          const height = Number(image?.naturalHeight || image?.height || 0);
          if (!width || !height) {
            return {
              allowed: false,
              reason: 'invalid-image-dimensions',
            };
          }
          const longerSide = Math.max(width, height);
          const shorterSide = Math.min(width, height);
          return {
            allowed: longerSide <= MAX_EDITOR_HEIGHT && shorterSide <= MAX_EDITOR_WIDTH,
            width,
            height,
          };
        } catch (error) {
          return {
            allowed: false,
            reason: error?.message || 'dimensions-validation-failed',
          };
        }
      };

      const classifyImageDataUri = async (sourceUri) => {
        if (!sourceUri) {
          return {
            moderationDecision: 'unclassified',
            moderationScores: null,
            moderationError: 'no-image-data',
          };
        }

        try {
          const model = await getNsfwModel();
          const imageElement = await loadImageFromDataUri(sourceUri);
          const predictions = await model.classify(imageElement, 5);
          const moderationScores = mapScores(predictions);
          const moderationDecision = getDecision(moderationScores);
          return {
            moderationDecision,
            moderationScores,
            moderationError: '',
          };
        } catch (error) {
          return {
            moderationDecision: 'unsure',
            moderationScores: null,
            moderationError: 'nsfw-model-unavailable',
          };
        }
      };

      const pushShieldToDetectedFace = (annotationId, annotations) => {
        if (!faceBox || !updateStateFnRef.current || !annotations || !annotations[annotationId]) {
          return;
        }
        if (shieldAppliedIds.has(annotationId)) {
          return;
        }
        shieldAppliedIds.add(annotationId);
        updateStateFnRef.current((currentState) => {
          const currentAnnotations = { ...(currentState?.annotations || {}) };
          const targetAnnotation = currentAnnotations[annotationId];
          if (!targetAnnotation) {
            return;
          }
          currentAnnotations[annotationId] = {
            ...targetAnnotation,
            x: faceBox.x,
            y: faceBox.y,
            width: faceBox.width,
            height: faceBox.width * 1.2,
          };
          return { ...currentState, annotations: currentAnnotations };
        });
      };

      const applyShieldWhenNeeded = (designState) => {
        if (!designState?.annotations || !shieldSticker) {
          return;
        }
        Object.entries(designState.annotations).forEach(([annotationId, annotation]) => {
          if (
            annotation?.name === 'Image' &&
            typeof annotation?.image === 'string' &&
            annotation.image === shieldSticker.uri
          ) {
            if (!faceDetectionPromise && !faceBox) {
              faceDetectionPromise = (async () => {
                try {
                  const faceapi = await getFaceApi();
                  await faceapi.nets.tinyFaceDetector.loadFromUri(
                    'https://justadudewhohacks.github.io/face-api.js/models'
                  );
                  const imageElement = await faceapi.fetchImage(editorSource);
                  const detection = await faceapi.detectSingleFace(
                    imageElement,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 })
                  );
                  if (detection?.box) {
                    faceBox = {
                      x: detection.box.x,
                      y: detection.box.y,
                      width: detection.box.width,
                      height: detection.box.height,
                    };
                    pushShieldToDetectedFace(annotationId, designState.annotations);
                  }
                } catch (error) {
                  postToNative({
                    type: 'error',
                    message: 'Face detection model unavailable. Sticker placement will be manual.',
                  });
                }
              })();
            }
            pushShieldToDetectedFace(annotationId, designState.annotations);
          }
        });
      };

      const saveFromEditor = async () => {
        if (getCurrentImgDataFnRef.current) {
          const { imageData } = getCurrentImgDataFnRef.current(
            {
              name: 'onebody-edited-image',
              extension: 'jpg',
              quality: 0.9,
            },
            1,
            false
          );
          const dimensionsValidation = await validateEditorDimensions(imageData?.imageBase64);
          if (!dimensionsValidation.allowed) {
            postToNative({
              type: 'error',
              message: 'Image size cannot exceed 1080x1920 (9:16). Adjust the crop and try again.',
            });
            return;
          }
          const moderation = await classifyImageDataUri(imageData?.imageBase64);
          if (moderation.moderationDecision === 'blocked') {
            postToNative({
              type: 'moderation_blocked',
              payload: {
                moderationDecision: moderation.moderationDecision,
                moderationScores: moderation.moderationScores,
              },
            });
            return;
          }
          postToNative({
            type: 'save',
            payload: {
              imageBase64: imageData?.imageBase64,
              name: imageData?.fullName || imageData?.name || 'onebody-edited-image.jpg',
              extension: imageData?.extension || 'jpg',
              mimeType: imageData?.mimeType || 'image/jpeg',
              userId,
              moderationDecision: moderation.moderationDecision,
              moderationScores: moderation.moderationScores,
              moderationError: moderation.moderationError,
            },
          });
          return;
        }
        const saveButton = Array.from(document.querySelectorAll('button')).find((button) => {
          const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
          const textContent = (button.textContent || '').toLowerCase();
          return ariaLabel.includes('save') || textContent.includes('save');
        });
        if (saveButton) {
          saveButton.click();
        }
      };

      const undoFromEditor = () => {
        const undoButton = Array.from(document.querySelectorAll('button')).find((button) => {
          const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
          const textContent = (button.textContent || '').toLowerCase();
          return ariaLabel.includes('undo') || textContent.includes('undo');
        });
        if (undoButton) {
          undoButton.click();
        }
      };

      window.__ONEBODY_TRIGGER_SAVE = saveFromEditor;
      window.__ONEBODY_TRIGGER_UNDO = undoFromEditor;
      window.__ONEBODY_TRIGGER_CANCEL = () => {
        postToNative({ type: 'closed' });
      };

      const onSave = async (savedImageData) => {
        const dimensionsValidation = await validateEditorDimensions(savedImageData?.imageBase64);
        if (!dimensionsValidation.allowed) {
          postToNative({
            type: 'error',
            message: 'Image size cannot exceed 1080x1920 (9:16). Adjust the crop and try again.',
          });
          return;
        }
        const moderation = await classifyImageDataUri(savedImageData?.imageBase64);
        if (moderation.moderationDecision === 'blocked') {
          postToNative({
            type: 'moderation_blocked',
            payload: {
              moderationDecision: moderation.moderationDecision,
              moderationScores: moderation.moderationScores,
            },
          });
          return;
        }
        postToNative({
          type: 'save',
          payload: {
            imageBase64: savedImageData?.imageBase64,
            name: savedImageData?.fullName || savedImageData?.name || 'onebody-edited-image.jpg',
            extension: savedImageData?.extension || 'jpg',
            mimeType: savedImageData?.mimeType || 'image/jpeg',
            userId,
            moderationDecision: moderation.moderationDecision,
            moderationScores: moderation.moderationScores,
            moderationError: moderation.moderationError,
          },
        });
      };

      const onModify = (designState) => {
        applyShieldWhenNeeded(designState);
      };

      const applyAndroidEditorLayoutOverrides = () => {
        const ratioLabelPattern = /^(\\d+(\\.\\d+)?)\\s*:\\s*(\\d+(\\.\\d+)?)(\\s+[a-z]+)?$/i;
        const allControls = Array.from(
          document.querySelectorAll('button, [role="button"], [title], [aria-label]')
        );
        allControls.forEach((node) => {
          const element = node;
          const aria = (element.getAttribute('aria-label') || '').trim().toLowerCase();
          const title = (element.getAttribute('title') || '').trim().toLowerCase();
          const text = (element.textContent || '').trim().toLowerCase();

          if (
            aria.includes('menu') ||
            title.includes('menu') ||
            aria.includes('tabs menu') ||
            title.includes('tabs menu')
          ) {
            element.style.display = 'none';
            return;
          }

          if (
            (text === '%' || text === 'px' || aria === '%' || aria === 'px') &&
            element.closest('.FIE_tools-bar, .FIE_tab-contents, .SfxModal-Wrapper')
          ) {
            element.style.display = 'none';
            return;
          }

          const isRatioMenuControl =
            ratioLabelPattern.test(text) ||
            text === 'custom' ||
            text === 'original' ||
            text.includes('portrait') ||
            text.includes('landscape') ||
            text.includes('square') ||
            text.includes('story') ||
            text.includes('standard') ||
            text.includes('ellipse') ||
            aria.includes('aspect') ||
            title.includes('aspect') ||
            aria.includes('ratio') ||
            title.includes('ratio');

          if (
            isRatioMenuControl &&
            element.closest('.FIE_tools-bar, .FIE_tab-contents, .SfxModal-Wrapper, [role="menu"]')
          ) {
            element.style.display = 'none';
          }
        });

        const tabsDrawer = document.querySelector('.FIE_tabs-drawer');
        if (tabsDrawer) {
          tabsDrawer.style.display = 'none';
        }
      };

      const editorConfig = {
        source: editorSource,
        onSave,
        onClose: () => postToNative({ type: 'closed' }),
        onModify,
        removeSaveButton: true,
        closeAfterSave: false,
        defaultSavedImageType: 'jpg',
        defaultSavedImageQuality: 0.9,
        getCurrentImgDataFnRef,
        updateStateFnRef,
        tabsIds: ['Adjust', 'Filters', 'Annotate'],
        defaultTabId: 'Adjust',
        defaultToolId: 'Crop',
        noCrossOrigin: true,
        useZoomPresetsMenu: false,
        disableZooming: true,
        Crop: {
          ratio: null,
          noPresets: true,
          ratioTitleKey: 'Custom',
          useZoomPresetsMenu: false,
          disableZooming: true,
          autoResize: false,
        },
        Image: {
          disableUpload: true,
          gallery: faithPack,
        },
        previewBgColor: '${BRAND_BACKGROUND}',
        theme: {
          palette: {
            'bg-primary': '${BRAND_BACKGROUND}',
            'bg-secondary': '${BRAND_BACKGROUND}',
            'bg-hover': '${BRAND_SURFACE}',
            'bg-primary-hover': '${BRAND_SURFACE}',
            'bg-primary-active': '${BRAND_SURFACE}',
            'txt-primary': '${BRAND_TEXT_PRIMARY}',
            'txt-secondary': '${BRAND_TEXT_SECONDARY}',
            'txt-placeholder': '${BRAND_TEXT_SECONDARY}',
            'icon-primary': '${BRAND_TEXT_SECONDARY}',
            'icons-primary': '${BRAND_TEXT_SECONDARY}',
            'icons-muted': '${BRAND_TEXT_SECONDARY}',
            'borders-primary': 'rgba(185, 199, 220, 0.32)',
            'borders-secondary': 'rgba(185, 199, 220, 0.24)',
            'btn-primary-text': '#0f1d30',
            'light-shadow': 'rgba(2, 10, 20, 0.35)',
            'accent-primary': '${BRAND_ACCENT}',
            'accent-secondary': '${BRAND_ACCENT}',
          },
          typography: {
            fontFamily:
              'Open Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          },
        },
        savingPixelRatio: 1,
        previewPixelRatio: 1,
      };

      const renderEditor = async () => {
        const container = document.getElementById('main-editor-container');
        if (!container) {
          postToNative({
            type: 'error',
            message: 'Editor container not found.',
          });
          return;
        }

        try {
          const ReactModule = await import('https://esm.sh/react@18.2.0?target=es2022');
          const ReactDomClient = await import(
            'https://esm.sh/react-dom@18.2.0/client?target=es2022'
          );
          const EditorModule = await import(
            'https://esm.sh/react-filerobot-image-editor@5.0.1?deps=react@18.2.0,react-dom@18.2.0&target=es2022'
          );
          const React = ReactModule?.default ?? ReactModule;
          const createRoot = ReactDomClient?.createRoot;
          const FilerobotImageEditor = EditorModule?.default;
          if (!createRoot || !FilerobotImageEditor) {
            throw new Error('React editor modules unavailable.');
          }

          const editorElement = React.createElement(FilerobotImageEditor, editorConfig);
          createRoot(container).render(editorElement);
          requestAnimationFrame(applyAndroidEditorLayoutOverrides);
          postToNative({ type: 'ready' });
          return;
        } catch (error) {
          postToNative({
            type: 'error',
            message: error?.message || 'React editor load failed. Trying fallback editor.',
          });
        }

        try {
          await loadExternalScript(
            'https://scaleflex.cloudimg.io/v7/plugins/filerobot-image-editor/latest/filerobot-image-editor.min.js'
          );
          const VanillaEditor = window.FilerobotImageEditor;
          if (!VanillaEditor) {
            throw new Error('Fallback editor unavailable after script load.');
          }
          const editorInstance = new VanillaEditor(container, editorConfig);
          editorInstance.render({
            onClose: () => postToNative({ type: 'closed' }),
          });
          requestAnimationFrame(applyAndroidEditorLayoutOverrides);
          postToNative({ type: 'ready' });
        } catch (error) {
          postToNative({
            type: 'error',
            message: error?.message || 'Unable to initialize fallback editor.',
          });
        }
      };

      renderEditor();
      const layoutObserver = new MutationObserver(() => {
        applyAndroidEditorLayoutOverrides();
      });
      layoutObserver.observe(document.body, {
        subtree: true,
        childList: true,
      });
      applyAndroidEditorLayoutOverrides();

    </script>
  </body>
</html>`;
};

function FilerobotImageEditorModal({
  visible,
  asset,
  token,
  userId,
  saveMode = 'upload',
  onCancel,
  onSaved,
}: Props) {
  const isIOS = Platform.OS === 'ios';
  const nativeEditorSdk = useMemo(() => {
    if (!isIOS) {
      return null;
    }
    try {
      // eslint-disable-next-line global-require
      const sdkModule = require('@vitaliez/react-native-image-editor-sdk');
      if (sdkModule?.ImageEditorUI) {
        return sdkModule;
      }
      if (sdkModule?.default?.ImageEditorUI) {
        return sdkModule.default;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, [isIOS]);
  const NativeImageEditorUI = nativeEditorSdk?.ImageEditorUI as React.ForwardRefExoticComponent<
    {
      source: { uri: string };
      config?: ImageEditorUIConfig;
      onReady?: () => void;
      onImageLoaded?: () => void;
      onError?: (event: { error?: string } | { nativeEvent?: { error?: string } }) => void;
      onClose?: () => void;
      style?: object;
    } & React.RefAttributes<{
      loadImage?: (source: { uri: string }) => Promise<void> | void;
    }>
  > | null;
  const nativeImageEditorModule = nativeEditorSdk?.ImageEditorModule as {
    canUndo: () => boolean;
    undo: () => boolean;
    export: (options?: {
      format?: 'jpeg' | 'png' | 'heic';
      quality?: number;
      maxDimension?: number;
    }) => Promise<{ uri: string; path?: string }>;
  } | null;
  const nativeEditorPresets = nativeEditorSdk?.ImageEditorUIPresets as {
    socialMedia: () => ImageEditorUIConfig;
  } | null;
  const { dark, colors } = useTheme();
  const toast = useToast();
  const webViewRef = useRef<WebView>(null);
  const nativeEditorRef = useRef<{
    loadImage?: (source: { uri: string }) => Promise<void> | void;
  } | null>(null);
  const lastLoadedNativeUriRef = useRef('');
  const [isNativeEditorAvailable, setIsNativeEditorAvailable] = useState(
    isIOS && Boolean(nativeEditorSdk?.ImageEditorUI && nativeEditorSdk?.ImageEditorModule)
  );
  const [preparedSource, setPreparedSource] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  const isUsingNativeEditor = isIOS && isNativeEditorAvailable;
  const nativeSourceUri = useMemo(() => {
    if (!asset?.uri) {
      return '';
    }
    if (asset.uri.startsWith('data:')) {
      return '';
    }
    if (asset.uri.startsWith('http://') || asset.uri.startsWith('https://')) {
      return asset.uri;
    }
    return normalizeFileUri(asset.uri);
  }, [asset?.uri]);
  const nativeUiConfig = useMemo<ImageEditorUIConfig>(() => {
    const socialDefaults = nativeEditorPresets?.socialMedia?.() ?? {};
    return {
      ...socialDefaults,
      showTopToolbar: false,
      showBottomToolbar: true,
      enableExport: false,
      showCloseButton: false,
      showShareButton: false,
      exportShareSheet: false,
      allowedExportFormats: ['jpeg'],
      defaultExportFormat: 'jpeg',
      defaultExportQuality: 0.9,
      cropAspectRatios: [
        { label: '1:1', ratio: 1 },
        { label: '4:5', ratio: 4 / 5 },
        { label: '3:4', ratio: 3 / 4 },
        { label: '9:16', ratio: 9 / 16 },
        { label: '4:3', ratio: 4 / 3 },
        { label: '16:9', ratio: 16 / 9 },
        { label: '1.91:1', ratio: 1.91 / 1 },
        { label: 'Free', ratio: null },
      ],
    };
  }, [nativeEditorPresets]);
  const canUseNativeEditor =
    isUsingNativeEditor &&
    Boolean(NativeImageEditorUI) &&
    Boolean(nativeImageEditorModule) &&
    nativeSourceUri.length > 0;
  const canUseWebEditor = Platform.OS === 'android';

  useEffect(() => {
    if (!isIOS) {
      return;
    }
    if (!nativeImageEditorModule || !NativeImageEditorUI) {
      setIsNativeEditorAvailable(false);
      return;
    }
    try {
      nativeImageEditorModule.canUndo();
      setIsNativeEditorAvailable(true);
    } catch (error) {
      setIsNativeEditorAvailable(false);
    }
  }, [NativeImageEditorUI, isIOS, nativeImageEditorModule]);

  const loadNativeImageIfNeeded = useCallback(async () => {
    if (!canUseNativeEditor || !nativeSourceUri) {
      return;
    }
    if (lastLoadedNativeUriRef.current === nativeSourceUri) {
      return;
    }

    const loadImage = nativeEditorRef.current?.loadImage;
    if (!loadImage) {
      return;
    }

    try {
      await loadImage({ uri: nativeSourceUri });
      lastLoadedNativeUriRef.current = nativeSourceUri;
    } catch (error) {
      setErrorMessage('Unable to load the selected image in editor.');
      setEditorReady(false);
    }
  }, [canUseNativeEditor, nativeSourceUri]);

  useEffect(() => {
    if (!visible) {
      lastLoadedNativeUriRef.current = '';
      return;
    }

    loadNativeImageIfNeeded();
  }, [loadNativeImageIfNeeded, visible]);

  const prepareSource = useCallback(async () => {
    if (!visible || !asset?.uri) {
      setPreparedSource('');
      setEditorReady(false);
      return;
    }

    if (isIOS) {
      setPreparedSource('');
      setIsPreparing(false);
      setEditorReady(false);
      if (!canUseNativeEditor) {
        setErrorMessage('iOS native image editor is unavailable on this build.');
      }
      return;
    }

    if (canUseNativeEditor) {
      setPreparedSource('');
      setErrorMessage('');
      setIsPreparing(false);
      setEditorReady(false);
      return;
    }

    if (!canUseWebEditor) {
      setPreparedSource('');
      setErrorMessage('Image editor is unavailable on this device.');
      setEditorReady(false);
      return;
    }

    const normalizedAssetUri =
      asset.uri.startsWith('data:') ||
      asset.uri.startsWith('http://') ||
      asset.uri.startsWith('https://') ||
      asset.uri.startsWith('file://') ||
      asset.uri.startsWith('content://')
        ? asset.uri
        : normalizeFileUri(asset.uri);

    let resolvedFileSize = typeof asset.fileSize === 'number' ? asset.fileSize : undefined;
    if (
      typeof resolvedFileSize !== 'number' &&
      normalizedAssetUri.startsWith('file://') &&
      !normalizedAssetUri.startsWith('file:///android_asset/')
    ) {
      const localPath = normalizedAssetUri.replace('file://', '');
      try {
        const stat = await RNFS.stat(localPath);
        const parsedSize = Number(stat?.size ?? 0);
        if (parsedSize > 0) {
          resolvedFileSize = parsedSize;
        }
      } catch (error) {
        // Best-effort file size lookup; continue without blocking editor.
      }
    }

    const editorByteLimit = canUseWebEditor ? MAX_ANDROID_WEB_EDITOR_BYTES : MAX_EDITOR_BYTES;
    if (typeof resolvedFileSize === 'number' && resolvedFileSize > editorByteLimit) {
      setPreparedSource('');
      const limitMb = Math.round(editorByteLimit / (1024 * 1024));
      setErrorMessage(`Image is larger than ${limitMb}MB. Please select a smaller image.`);
      setEditorReady(false);
      return;
    }

    setIsPreparing(true);
    setErrorMessage('');
    setEditorReady(false);

    try {
      setPreparedSource(normalizedAssetUri);
    } catch (error) {
      setPreparedSource('');
      setErrorMessage('Unable to prepare image editor source.');
    } finally {
      setIsPreparing(false);
    }
  }, [asset, canUseNativeEditor, canUseWebEditor, isIOS, visible]);

  useEffect(() => {
    prepareSource();
  }, [prepareSource]);

  const htmlSource = useMemo(() => {
    if (!canUseWebEditor || !preparedSource) {
      return '';
    }
    return buildHtml({
      source: preparedSource,
      userId: userId ?? '',
      stickerCatalog: faithStickerCatalog,
    });
  }, [canUseWebEditor, preparedSource, userId]);

  const queueUnsureModerationReview = useCallback(
    async (params: {
      uploadedUrl: string;
      moderationScores?: ClientModerationScores | null;
      moderationError?: string;
    }) => {
      if (!CLIENT_NSFW_REVIEW_ROUTE) {
        return;
      }

      const authToken = token && token.length > 0 ? token : true;
      const queueResult = await ApiCall({
        route: CLIENT_NSFW_REVIEW_ROUTE,
        verb: 'post',
        token: authToken,
        params: {
          userId,
          mediaUrl: params.uploadedUrl,
          source: 'new-post-image-editor',
          moderationModel: 'nsfwjs',
          moderationDecision: 'unsure',
          moderationScores: params.moderationScores,
          moderationError: params.moderationError || '',
          createdAt: new Date().toISOString(),
        },
      });

      if (queueResult.status !== 200) {
        console.warn('Unable to queue unsure media for admin review', queueResult.status);
      }
    },
    [token, userId]
  );

  const uploadEditedImage = useCallback(
    async (payload: {
      imageBase64?: string;
      name?: string;
      extension?: string;
      moderationDecision?: ClientModerationDecision;
      moderationScores?: ClientModerationScores | null;
      moderationError?: string;
    }) => {
      const imageBase64Raw = payload.imageBase64;
      if (!imageBase64Raw) {
        throw new Error('No image data returned from editor.');
      }
      const strippedBase64 = imageBase64Raw.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const fileName = ensureJpgName(payload.name ?? `onebody_edited_${Date.now()}.jpg`);
      const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
      await RNFS.writeFile(localPath, strippedBase64, 'base64');

      const fileParam = {
        uri: `file://${localPath}`,
        type: 'image/jpeg',
        name: fileName,
      } as any;
      const formData = new FormData();
      formData.append('file', fileParam);
      if (userId) {
        formData.append('userId', userId);
      }
      if (payload.moderationDecision) {
        formData.append('clientModerationDecision', payload.moderationDecision);
      }
      if (payload.moderationScores) {
        formData.append('clientModerationScores', JSON.stringify(payload.moderationScores));
      }
      if (payload.moderationError) {
        formData.append('clientModerationError', payload.moderationError);
      }

      const authToken = token && token.length > 0 ? token : true;
      let result = await ApiCall({
        route: 'v1/posts/media',
        verb: 'post',
        token: authToken,
        params: formData,
        isFormUrlEncode: true,
      });

      if (result.status !== 200) {
        result = await ApiCall({
          route: 'posts/media',
          verb: 'post',
          token: authToken,
          params: formData,
          isFormUrlEncode: true,
        });
      }

      await RNFS.unlink(localPath).catch(() => {});
      if (result.status !== 200) {
        throw new Error('Media upload request failed.');
      }

      const uploadedUrl = extractHttpUrl(result.response);
      if (!uploadedUrl) {
        throw new Error('Media uploaded but no URL returned by API.');
      }

      if (payload.moderationDecision === 'unsure') {
        await queueUnsureModerationReview({
          uploadedUrl,
          moderationScores: payload.moderationScores,
          moderationError: payload.moderationError,
        });
      }

      return { url: uploadedUrl, name: fileName };
    },
    [queueUnsureModerationReview, token, userId]
  );

  const saveEditedImageLocally = useCallback(
    async (payload: { imageBase64?: string; name?: string }) => {
      const imageBase64Raw = payload.imageBase64;
      if (!imageBase64Raw) {
        throw new Error('No image data returned from editor.');
      }
      const strippedBase64 = imageBase64Raw.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const fileName = ensureJpgName(payload.name ?? `onebody_edited_${Date.now()}.jpg`);
      const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
      await RNFS.writeFile(localPath, strippedBase64, 'base64');
      return { url: `file://${localPath}`, name: fileName };
    },
    []
  );

  const uploadEditedImageFromUri = useCallback(
    async (exportedUri: string) => {
      const normalizedUri = normalizeFileUri(exportedUri);
      const normalizedName = ensureJpgName(
        getFileNameFromUri(normalizedUri) || `onebody_edited_${Date.now()}.jpg`
      );
      const fileParam = {
        uri: normalizedUri,
        type: 'image/jpeg',
        name: normalizedName,
      } as any;
      const formData = new FormData();
      formData.append('file', fileParam);
      if (userId) {
        formData.append('userId', userId);
      }

      const authToken = token && token.length > 0 ? token : true;
      let result = await ApiCall({
        route: 'v1/posts/media',
        verb: 'post',
        token: authToken,
        params: formData,
        isFormUrlEncode: true,
      });

      if (result.status !== 200) {
        result = await ApiCall({
          route: 'posts/media',
          verb: 'post',
          token: authToken,
          params: formData,
          isFormUrlEncode: true,
        });
      }

      if (result.status !== 200) {
        throw new Error('Media upload request failed.');
      }

      const uploadedUrl = extractHttpUrl(result.response);
      if (!uploadedUrl) {
        throw new Error('Media uploaded but no URL returned by API.');
      }

      return { url: uploadedUrl, name: normalizedName };
    },
    [token, userId]
  );

  const saveFromNativeEditor = useCallback(async () => {
    try {
      if (!nativeImageEditorModule) {
        throw new Error('Native image editor is unavailable on this build.');
      }
      setIsSaving(true);
      const exported = await nativeImageEditorModule.export({
        format: 'jpeg',
        quality: 0.9,
      });
      const exportedUri = exported?.uri || '';
      if (!exportedUri) {
        throw new Error('No image data returned from native editor.');
      }

      const normalizedName = ensureJpgName(
        getFileNameFromUri(exportedUri) || `onebody_edited_${Date.now()}.jpg`
      );
      if (saveMode === 'local') {
        onSaved({
          url: normalizeFileUri(exportedUri),
          name: normalizedName,
        });
        return;
      }

      const uploaded = await uploadEditedImageFromUri(exportedUri);
      onSaved(uploaded);
    } catch (error: any) {
      toast.show(error?.message ?? 'Unable to save edited image.', {
        type: 'danger',
        placement: 'bottom',
      });
    } finally {
      setIsSaving(false);
    }
  }, [nativeImageEditorModule, onSaved, saveMode, toast, uploadEditedImageFromUri]);

  const handleWebMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      let parsedMessage: EditorMessage;
      try {
        parsedMessage = JSON.parse(event.nativeEvent.data) as EditorMessage;
      } catch (error) {
        return;
      }

      if (parsedMessage.type === 'ready') {
        setEditorReady(true);
        return;
      }

      if (parsedMessage.type === 'error') {
        if (parsedMessage.message) {
          toast.show(parsedMessage.message, {
            type: 'normal',
            placement: 'bottom',
          });
        }
        return;
      }

      if (parsedMessage.type === 'closed') {
        onCancel();
        return;
      }

      if (parsedMessage.type === 'moderation_blocked') {
        toast.show('This image violates content standards and cannot be posted.', {
          type: 'danger',
          placement: 'bottom',
        });
        onCancel();
        return;
      }

      if (parsedMessage.type === 'save') {
        try {
          setIsSaving(true);
          const moderationDecision = parsedMessage.payload.moderationDecision ?? 'unclassified';
          if (moderationDecision === 'blocked') {
            toast.show('This image violates content standards and cannot be posted.', {
              type: 'danger',
              placement: 'bottom',
            });
            onCancel();
            return;
          }

          if (saveMode === 'local') {
            const localSaved = await saveEditedImageLocally({
              imageBase64: parsedMessage.payload.imageBase64,
              name: parsedMessage.payload.name,
            });
            onSaved(localSaved);
            return;
          }

          const uploaded = await uploadEditedImage({
            imageBase64: parsedMessage.payload.imageBase64,
            name: parsedMessage.payload.name,
            extension: parsedMessage.payload.extension,
            moderationDecision,
            moderationScores: parsedMessage.payload.moderationScores,
            moderationError: parsedMessage.payload.moderationError,
          });

          if (moderationDecision === 'unsure') {
            toast.show('Image is marked for admin review before full distribution.', {
              type: 'normal',
              placement: 'bottom',
            });
          }

          onSaved(uploaded);
        } catch (error: any) {
          toast.show(error?.message ?? 'Unable to save edited image.', {
            type: 'danger',
            placement: 'bottom',
          });
        } finally {
          setIsSaving(false);
        }
      }
    },
    [onCancel, onSaved, saveEditedImageLocally, saveMode, toast, uploadEditedImage]
  );

  const triggerEditorAction = useCallback(
    (action: 'save' | 'undo' | 'cancel') => {
      if (canUseNativeEditor) {
        if (action === 'cancel') {
          onCancel();
          return;
        }
        if (action === 'undo') {
          try {
            if (!nativeImageEditorModule) {
              throw new Error('Native image editor is unavailable on this build.');
            }
            nativeImageEditorModule.undo();
          } catch (error: any) {
            toast.show(error?.message ?? 'Undo is unavailable.', {
              type: 'normal',
              placement: 'bottom',
            });
          }
          return;
        }
        saveFromNativeEditor();
        return;
      }

      const scriptByAction = {
        save: 'window.__ONEBODY_TRIGGER_SAVE && window.__ONEBODY_TRIGGER_SAVE(); true;',
        undo: 'window.__ONEBODY_TRIGGER_UNDO && window.__ONEBODY_TRIGGER_UNDO(); true;',
        cancel: 'window.__ONEBODY_TRIGGER_CANCEL && window.__ONEBODY_TRIGGER_CANCEL(); true;',
      } as const;
      webViewRef.current?.injectJavaScript(scriptByAction[action]);
    },
    [canUseNativeEditor, nativeImageEditorModule, onCancel, saveFromNativeEditor, toast]
  );

  const themeBackground = dark ? Colors.neutral[900] : Colors.neutral[700];
  const brandText = dark ? '#e6eaec' : colors.text;
  const alertTitle = useMemo(() => {
    if (!errorMessage) {
      return '';
    }
    if (errorMessage.includes('Image is larger than')) {
      return 'Upload Limit Reached';
    }
    if (Platform.OS === 'ios') {
      return 'Editor Unavailable';
    }
    return 'Unable to Open Editor';
  }, [errorMessage]);

  if (!visible || !asset) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={[styles.screen, { backgroundColor: themeBackground }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerIconButton}>
            <MaterialCommunityIcons name="close" size={24} color={brandText} />
          </TouchableOpacity>
          <StyledText style={[styles.headerTitle, { color: brandText }]}>Edit Photo</StyledText>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => triggerEditorAction('undo')}
              style={styles.secondaryActionButton}
              disabled={!editorReady || isSaving}
            >
              <StyledText style={styles.secondaryActionText}>Undo</StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => triggerEditorAction('save')}
              style={styles.primaryActionButton}
              disabled={!editorReady || isSaving}
            >
              <StyledText style={styles.primaryActionText}>
                {isSaving ? 'Saving...' : 'Save'}
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.editorSurface}>
          {errorMessage ? (
            <View style={styles.alertCard}>
              <StyledText style={styles.alertTitle}>{alertTitle}</StyledText>
              <StyledText style={styles.alertBody}>{errorMessage}</StyledText>
              <TouchableOpacity onPress={onCancel} style={styles.alertButton}>
                <StyledText style={styles.alertButtonText}>Choose Another Image</StyledText>
              </TouchableOpacity>
            </View>
          ) : null}

          {isPreparing ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={BRAND_ACCENT} />
            </View>
          ) : null}

          {canUseNativeEditor && !errorMessage && NativeImageEditorUI ? (
            <NativeImageEditorUI
              ref={nativeEditorRef as any}
              source={{ uri: nativeSourceUri }}
              config={nativeUiConfig}
              onReady={() => {
                setEditorReady(true);
                loadNativeImageIfNeeded();
              }}
              onImageLoaded={() => {
                setEditorReady(true);
                lastLoadedNativeUriRef.current = nativeSourceUri;
              }}
              onError={(event: any) => {
                const nativeError =
                  event?.error ??
                  event?.nativeEvent?.error ??
                  'Unable to initialize native image editor.';
                setEditorReady(false);
                setErrorMessage(nativeError);
              }}
              onClose={onCancel}
              style={styles.nativeEditor}
            />
          ) : null}

          {!canUseNativeEditor && canUseWebEditor && !isPreparing && !errorMessage && htmlSource ? (
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: htmlSource }}
              onMessage={handleWebMessage}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              allowsInlineMediaPlayback
              allowFileAccess
              allowingReadAccessToURL="file://"
              allowUniversalAccessFromFileURLs
              allowFileAccessFromFileURLs
              style={styles.webView}
              mixedContentMode="always"
            />
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: 56,
    paddingHorizontal: spacing.x16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.max,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: HEADER_FONT_FAMILY,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.x8,
  },
  secondaryActionButton: {
    minWidth: 58,
    paddingHorizontal: spacing.x10,
    height: 34,
    borderRadius: borderRadius.max,
    borderWidth: 1,
    borderColor: BRAND_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryActionText: {
    color: BRAND_ACCENT,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: BODY_FONT_FAMILY,
  },
  primaryActionButton: {
    minWidth: 62,
    paddingHorizontal: spacing.x13,
    height: 34,
    borderRadius: borderRadius.max,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_ACCENT,
  },
  primaryActionText: {
    color: BRAND_BACKGROUND,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: BODY_FONT_FAMILY,
  },
  editorSurface: {
    flex: 1,
    backgroundColor: BRAND_BACKGROUND,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: BRAND_BACKGROUND,
  },
  nativeEditor: {
    flex: 1,
    backgroundColor: BRAND_BACKGROUND,
  },
  loaderWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCard: {
    marginHorizontal: spacing.x16,
    marginTop: spacing.x24,
    padding: spacing.x16,
    borderRadius: borderRadius.base,
    backgroundColor: BRAND_BACKGROUND,
    borderWidth: 1,
    borderColor: BRAND_ACCENT,
    zIndex: 3,
  },
  alertTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.x8,
    fontFamily: HEADER_FONT_FAMILY,
  },
  alertBody: {
    color: '#e6eaec',
    fontSize: 14,
    marginBottom: spacing.x16,
    fontFamily: BODY_FONT_FAMILY,
  },
  alertButton: {
    height: 42,
    borderRadius: borderRadius.max,
    backgroundColor: BRAND_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonText: {
    color: BRAND_BACKGROUND,
    fontWeight: '700',
    fontFamily: OTHER_FONT_FAMILY,
  },
});

export type { EditorAsset, SavedMedia };
export default FilerobotImageEditorModal;
