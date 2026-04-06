import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  const [bridgeReady, setBridgeReady] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingModerationRequest | null>(null);

  const html = useMemo(() => buildTextModerationBridgeHtml(), []);

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
          text: request.text,
        })
      );
      activeRequestIdRef.current = request.id;
    },
    [bridgeReady]
  );

  useObservedEffect(() => {
    registerTextModerationBridge(dispatchRequest);
    return () => {
      unregisterTextModerationBridge(dispatchRequest);
    };
  }, [dispatchRequest]);

  useObservedEffect(() => {
    if (!bridgeReady || !pendingRequest || !webViewRef.current) {
      return;
    }

    webViewRef.current.postMessage(
      JSON.stringify({
        type: 'classify',
        requestId: pendingRequest.id,
        text: pendingRequest.text,
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
  }, []);

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
