import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width: screenWidth } = Dimensions.get('window');

type CustomVideoProps = {
  source: { uri: string };
  paused?: boolean;
  repeat?: boolean;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  controls?: boolean;
  muted?: boolean;
  poster?: string;
  style?: any;
  onEnd?: () => void;
  onLoad?: () => void;
};

const CustomVideo = forwardRef<WebView, CustomVideoProps>(
  (
    {
      source,
      paused = false,
      repeat = false,
      resizeMode = 'contain',
      controls = true,
      muted = false,
      poster,
      style,
      onEnd,
      onLoad,
    },
    ref
  ) => {
    const webRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => webRef.current as WebView);

    const videoHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1, maximum-scale=1">
        <style>
          body {
            margin: 0;
            background-color: black;
            overflow: hidden;
          }
          video {
            width: 100%;
            height: 100%;
            object-fit: ${resizeMode};
          }
        </style>
      </head>
      <body>
        <video
          ${controls ? 'controls' : ''}
          ${muted ? 'muted' : ''}
          ${repeat ? 'loop' : ''}
          ${poster ? `poster="${poster}"` : ''}
          ${paused ? '' : 'autoplay'}
          playsinline
          webkit-playsinline
          onloadeddata="window.ReactNativeWebView.postMessage('onLoad')"
          onended="window.ReactNativeWebView.postMessage('onEnd')"
          src="${source.uri}">
        </video>
      </body>
    </html>
  `;

    const handleMessage = (event: any) => {
      const message = event.nativeEvent.data;
      if (message === 'onEnd') onEnd?.();
      if (message === 'onLoad') onLoad?.();
    };

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html: videoHTML }}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          onMessage={handleMessage}
          scrollEnabled={false}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
});

export default CustomVideo;
