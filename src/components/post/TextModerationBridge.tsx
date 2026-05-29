import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import useObservedEffect from '@/src/hooks/useObservedEffect';
import {
  registerTextModerationBridge,
  rejectTextModerationRequest,
  resolveTextModerationRequest,
  unregisterTextModerationBridge,
} from '@/src/services/moderation/textModerationBridge';
import {
  buildTextModerationBridgeHtml,
  shouldAllowTextModerationNavigation,
} from './textModerationBridgeHtml';

type PendingModerationRequest = {
  id: string;
  text: string;
};

type WebViewMessage =
  | { type: 'ready' }
  | {
      type: 'result';
      requestId: string;
      payload: {
        scores: {
          maxToxicity: number;
          byLabel: Record<string, number>;
        };
        moderationError?: string;
      };
    }
  | { type: 'error'; requestId?: string; message?: string };

export default function TextModerationBridge() {
  const webViewRef = useRef<WebView>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const bridgeReadyRef = useRef(false);
  const pendingRequestRef = useRef<PendingModerationRequest | null>(null);

  const html = useMemo(() => buildTextModerationBridgeHtml(), []);

  const postModerationRequest = useCallback((request: PendingModerationRequest) => {
    if (!webViewRef.current) {
      pendingRequestRef.current = request;
      return;
    }

    webViewRef.current.postMessage(
      JSON.stringify({
        type: 'classify',
        requestId: request.id,
        text: request.text,
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
    registerTextModerationBridge(dispatchRequest);
    return () => {
      unregisterTextModerationBridge(dispatchRequest);
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
          resolveTextModerationRequest(parsed.requestId, parsed.payload);
          return;
        }

        if (parsed.type === 'error') {
          const requestId = parsed.requestId || activeRequestIdRef.current;
          if (requestId) {
            activeRequestIdRef.current = null;
            rejectTextModerationRequest(
              requestId,
              new Error(parsed.message || 'Text moderation bridge error.')
            );
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.log('[TextModerationBridge] Invalid message', error);
        }
      }
    },
    [postModerationRequest]
  );

  return (
    <View pointerEvents="none" style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['about:blank']}
        source={{ html }}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={(request) =>
          shouldAllowTextModerationNavigation(request?.url)
        }
        javaScriptEnabled
        mixedContentMode="compatibility"
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
