import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  registerVideoModerationBridge,
  unregisterVideoModerationBridge,
  rejectVideoModerationRequest,
  resolveVideoModerationRequest,
} from '@/src/services/videoProcessing/videoModerationBridge';
import {
  mobilenetV2ModelJson,
  mobilenetV2Group1ShardBase64,
} from './videoModerationAssets/mobilenetV2Model';
import nsfwjsMin from './videoModerationAssets/nsfwjsMin';
import tfjsMin from './videoModerationAssets/tfjsMin';
import {
  buildVideoModerationBridgeHtml,
  shouldAllowVideoModerationNavigation,
} from './videoModerationBridgeHtml';
import useObservedEffect from '@/src/hooks/useObservedEffect';

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

export default function VideoModerationBridge() {
  const webViewRef = useRef<WebView>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const bridgeReadyRef = useRef(false);
  const pendingRequestRef = useRef<PendingModerationRequest | null>(null);

  const html = useMemo(
    () =>
      buildVideoModerationBridgeHtml({
        tfjsSource: tfjsMin,
        nsfwjsSource: nsfwjsMin,
        modelJson: mobilenetV2ModelJson,
        modelShardBase64: mobilenetV2Group1ShardBase64,
      }),
    []
  );

  const postModerationRequest = useCallback((request: PendingModerationRequest) => {
    if (!webViewRef.current) {
      pendingRequestRef.current = request;
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
  }, []);

  const dispatchRequest = useCallback(
    (request: PendingModerationRequest) => {
      if (!bridgeReadyRef.current) {
        pendingRequestRef.current = request;
        return;
      }

      postModerationRequest(request);
    },
    [postModerationRequest]
  );

  useObservedEffect(() => {
    registerVideoModerationBridge(dispatchRequest);
    return () => {
      unregisterVideoModerationBridge(dispatchRequest);
    };
  }, [dispatchRequest]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const parsed = JSON.parse(event.nativeEvent.data || '{}') as WebViewMessage;
        if (parsed.type === 'ready') {
          bridgeReadyRef.current = true;
          const pendingRequest = pendingRequestRef.current;
          pendingRequestRef.current = null;
          if (pendingRequest) {
            postModerationRequest(pendingRequest);
          }
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
    },
    [postModerationRequest]
  );

  return (
    <View pointerEvents="none" style={styles.container}>
      <WebView
        ref={webViewRef}
        pointerEvents="none"
        originWhitelist={['about:blank']}
        source={{ html }}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={(request) =>
          shouldAllowVideoModerationNavigation(request?.url)
        }
        javaScriptEnabled
        mixedContentMode="never"
        javaScriptCanOpenWindowsAutomatically={false}
        allowFileAccess={false}
        allowingReadAccessToURL="about:blank"
        setSupportMultipleWindows={false}
        style={styles.webView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 0,
    height: 0,
    overflow: 'hidden',
    opacity: 0,
  },
  webView: {
    width: 1,
    height: 1,
    opacity: 0,
    backgroundColor: 'transparent',
  },
});
