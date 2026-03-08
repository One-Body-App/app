import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  registerVideoModerationBridge,
  unregisterVideoModerationBridge,
  rejectVideoModerationRequest,
  resolveVideoModerationRequest,
} from '@/src/services/videoProcessing/videoModerationBridge';

type PendingModerationRequest = {
  id: string;
  frameDataUris: string[];
};

type WebViewMessage =
  | { type: 'ready' }
  | {
      type: 'result';
      requestId: string;
      payload: {
        moderationDecision: 'safe' | 'unsure' | 'blocked' | 'unclassified';
        moderationScores: {
          neutral: number;
          drawing: number;
          sexy: number;
          porn: number;
          hentai: number;
        } | null;
        moderationError?: string;
      };
    }
  | { type: 'error'; requestId?: string; message?: string };

const buildBridgeHtml = () => `<!DOCTYPE html>
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
    <script type="module">
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

      let nsfwModelPromise = null;

      const postToNative = (payload) => {
        window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
      };

      const getNsfwModel = async () => {
        if (!nsfwModelPromise) {
          nsfwModelPromise = import('https://esm.sh/nsfwjs@2.4.2')
            .then((module) => module?.default ?? module)
            .then((nsfw) => nsfw.load());
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
              moderationDecision: 'unsure',
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

      postToNative({ type: 'ready' });
    </script>
  </body>
</html>`;

export default function VideoModerationBridge() {
  const webViewRef = useRef<WebView>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingModerationRequest | null>(null);

  const html = useMemo(() => buildBridgeHtml(), []);

  const dispatchRequest = useCallback(
    (request: PendingModerationRequest) => {
      if (!bridgeReady || !webViewRef.current) {
        setPendingRequest(request);
        return;
      }

      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'classify',
          requestId: request.id,
          frameDataUris: request.frameDataUris,
        })
      );
      activeRequestIdRef.current = request.id;
    },
    [bridgeReady]
  );

  useEffect(() => {
    registerVideoModerationBridge(dispatchRequest);
    return () => {
      unregisterVideoModerationBridge(dispatchRequest);
    };
  }, [dispatchRequest]);

  useEffect(() => {
    if (!bridgeReady || !pendingRequest || !webViewRef.current) {
      return;
    }

    webViewRef.current.postMessage(
      JSON.stringify({
        type: 'classify',
        requestId: pendingRequest.id,
        frameDataUris: pendingRequest.frameDataUris,
      })
    );
    activeRequestIdRef.current = pendingRequest.id;
    setPendingRequest(null);
  }, [bridgeReady, pendingRequest]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data || '{}') as WebViewMessage;
      if (parsed.type === 'ready') {
        setBridgeReady(true);
        return;
      }

      if (parsed.type === 'result') {
        activeRequestIdRef.current = null;
        resolveVideoModerationRequest(parsed.requestId, parsed.payload);
        return;
      }

      if (parsed.type === 'error') {
        const requestId = parsed.requestId || activeRequestIdRef.current;
        if (requestId) {
          activeRequestIdRef.current = null;
          rejectVideoModerationRequest(
            requestId,
            new Error(parsed.message || 'Video moderation bridge error.')
          );
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.log('[VideoModerationBridge] Invalid message', error);
      }
    }
  }, []);

  return (
    <View pointerEvents="none" style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        mixedContentMode="always"
        style={styles.webView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  webView: {
    width: 1,
    height: 1,
    opacity: 0,
    backgroundColor: 'transparent',
  },
});
