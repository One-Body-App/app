import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import StyledText from '@/components/styled/Text';
import { ApiCall } from '@/services/api';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

const BRAND_BACKGROUND = '#3c4b64';
const BRAND_ACCENT = '#12d2d9';
const MAX_EDITOR_BYTES = 50 * 1024 * 1024;
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

const getMimeTypeFromPath = (fileNameOrPath: string | undefined) => {
  const ext = getFileExtension(fileNameOrPath);
  if (ext === 'png') {
    return 'image/png';
  }
  if (ext === 'webp') {
    return 'image/webp';
  }
  return 'image/jpeg';
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
        background: rgba(60, 75, 100, 0.9) !important;
      }
      button,
      [role='button'] {
        accent-color: ${BRAND_ACCENT};
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div id="main-editor-container"></div>
    </div>
    <script type="module">
      import React from 'https://esm.sh/react@19.1.0';
      import { createRoot } from 'https://esm.sh/react-dom@19.1.0/client';
      import FilerobotImageEditor, { TABS, TOOLS } from 'https://esm.sh/react-filerobot-image-editor@5.0.0-beta.153';
      import * as faceapi from 'https://esm.sh/face-api.js@0.22.2';
      import * as nsfwjs from 'https://esm.sh/nsfwjs@2.4.2';

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

      const postToNative = (payload) => {
        window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
      };

      const getNsfwModel = async () => {
        if (!nsfwModelPromise) {
          nsfwModelPromise = nsfwjs.load();
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

      const editorElement = React.createElement(FilerobotImageEditor, {
        source,
        onSave,
        onClose: () => postToNative({ type: 'closed' }),
        onModify,
        removeSaveButton: true,
        closeAfterSave: false,
        defaultSavedImageType: 'jpg',
        defaultSavedImageQuality: 0.9,
        getCurrentImgDataFnRef,
        updateStateFnRef,
        tabsIds: [TABS.ADJUST, TABS.FILTERS, TABS.ANNOTATE],
        defaultTabId: TABS.ADJUST,
        defaultToolId: TOOLS.CROP,
        Crop: {
          ratio: 16 / 9,
          noPresets: true,
          ratioTitleKey: '16:9 Landscape',
          presetsItems: [{ titleKey: '16:9 Landscape', ratio: 16 / 9 }],
          autoResize: true,
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
            'accent-primary': '${BRAND_ACCENT}',
            'accent-secondary': '${BRAND_ACCENT}',
          },
        },
        savingPixelRatio: 1,
        previewPixelRatio: 1,
      });

      createRoot(document.getElementById('main-editor-container')).render(editorElement);
      postToNative({ type: 'ready' });

      const detectFace = async () => {
        try {
          await faceapi.nets.tinyFaceDetector.loadFromUri(
            'https://justadudewhohacks.github.io/face-api.js/models'
          );
          const imageElement = await faceapi.fetchImage(source);
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
          }
        } catch (error) {
          postToNative({
            type: 'error',
            message: 'Face detection model unavailable. Sticker placement will be manual.',
          });
        }
      };

      detectFace();
    </script>
  </body>
</html>`;
};

function FilerobotImageEditorModal({ visible, asset, token, userId, onCancel, onSaved }: Props) {
  const { dark, colors } = useTheme();
  const toast = useToast();
  const webViewRef = useRef<WebView>(null);
  const [preparedSource, setPreparedSource] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [editorReady, setEditorReady] = useState(false);

  const prepareSource = useCallback(async () => {
    if (!visible || !asset?.uri) {
      setPreparedSource('');
      setEditorReady(false);
      return;
    }

    if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_EDITOR_BYTES) {
      setPreparedSource('');
      setErrorMessage('Image is larger than 50MB. Please select a smaller image.');
      setEditorReady(false);
      return;
    }

    setIsPreparing(true);
    setErrorMessage('');
    setEditorReady(false);

    try {
      if (asset.uri.startsWith('data:') || asset.uri.startsWith('http')) {
        setPreparedSource(asset.uri);
      } else {
        const normalizedPath = asset.uri.startsWith('file://') ? asset.uri.slice(7) : asset.uri;
        const imageBase64 = await RNFS.readFile(normalizedPath, 'base64');
        const mimeType = asset.type || getMimeTypeFromPath(asset.fileName || asset.uri);
        setPreparedSource(`data:${mimeType};base64,${imageBase64}`);
      }
    } catch (error) {
      setPreparedSource('');
      setErrorMessage('Unable to prepare image editor source.');
    } finally {
      setIsPreparing(false);
    }
  }, [asset, visible]);

  useEffect(() => {
    prepareSource();
  }, [prepareSource]);

  const htmlSource = useMemo(() => {
    if (!preparedSource) {
      return '';
    }
    return buildHtml({
      source: preparedSource,
      userId: userId ?? '',
      stickerCatalog: faithStickerCatalog,
    });
  }, [preparedSource, userId]);

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
        route: 'posts/media',
        verb: 'post',
        token: authToken,
        params: formData,
        isFormUrlEncode: true,
      });

      if (result.status !== 200) {
        result = await ApiCall({
          route: 'api/v1/posts/media',
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
    [onCancel, onSaved, toast, uploadEditedImage]
  );

  const triggerEditorAction = useCallback((action: 'save' | 'undo' | 'cancel') => {
    const scriptByAction = {
      save: 'window.__ONEBODY_TRIGGER_SAVE && window.__ONEBODY_TRIGGER_SAVE(); true;',
      undo: 'window.__ONEBODY_TRIGGER_UNDO && window.__ONEBODY_TRIGGER_UNDO(); true;',
      cancel: 'window.__ONEBODY_TRIGGER_CANCEL && window.__ONEBODY_TRIGGER_CANCEL(); true;',
    } as const;
    webViewRef.current?.injectJavaScript(scriptByAction[action]);
  }, []);

  const themeBackground = dark ? Colors.neutral[900] : Colors.neutral[700];
  const brandText = dark ? '#e6eaec' : colors.text;

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
              <StyledText style={styles.alertTitle}>Upload Limit Reached</StyledText>
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

          {!isPreparing && !errorMessage && htmlSource ? (
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: htmlSource }}
              onMessage={handleWebMessage}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              allowsInlineMediaPlayback
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
  },
  alertBody: {
    color: '#e6eaec',
    fontSize: 14,
    marginBottom: spacing.x16,
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
  },
});

export type { EditorAsset, SavedMedia };
export default FilerobotImageEditorModal;
