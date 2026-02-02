import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

export type CustomClipboardHandle = {
  copy: (text: string) => void;
};

const CustomClipboard = forwardRef<CustomClipboardHandle>((_, ref) => {
  const webViewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    copy: (text: string) => {
      const js = `
        navigator.clipboard.writeText(${JSON.stringify(text)})
          .then(() => window.ReactNativeWebView.postMessage('success'))
          .catch(() => window.ReactNativeWebView.postMessage('failure'));
      `;
      webViewRef.current?.injectJavaScript(js);
    },
  }));

  return (
    <View style={styles.hidden}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: '<html><body></body></html>' }}
        javaScriptEnabled
        onMessage={(event) => {
          if (__DEV__) {
            if (event.nativeEvent.data === 'success') {
              console.log('Copied to clipboard');
            } else {
              console.warn('Clipboard copy failed');
            }
          }
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});

export default CustomClipboard;
