import React, { useCallback } from 'react';
import { ActivityIndicator, Platform, StatusBar, View } from 'react-native';
import { useFocusEffect, useIsFocused, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { getHeight } from '@/utils/ResponsiveFun';

const ZOE_CHAT_URL = 'https://zoestaging-10038836.chipp.ai';

function ZoeChat() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const bottomTabHeight = getHeight(7) + insets.bottom;
  const statusBarStyle = dark ? 'light-content' : 'dark-content';
  const statusBarBackgroundColor = dark ? '#032f3c' : '#f6f6f7';

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return undefined;
      }

      const applyStatusBar = () => {
        StatusBar.setBarStyle(statusBarStyle, false);
        StatusBar.setBackgroundColor(statusBarBackgroundColor, false);
        StatusBar.setTranslucent(false);
      };

      // Apply immediately and again on next frame to avoid first-load race conditions.
      applyStatusBar();
      const frame = requestAnimationFrame(applyStatusBar);

      return () => {
        cancelAnimationFrame(frame);
      };
    }, [statusBarBackgroundColor, statusBarStyle])
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: bottomTabHeight,
      }}
    >
      {Platform.OS === 'android' && isFocused ? (
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={statusBarBackgroundColor}
          translucent={false}
        />
      ) : null}
      <WebView
        source={{ uri: ZOE_CHAT_URL }}
        style={{ flex: 1, backgroundColor: colors.background }}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        setSupportMultipleWindows={false}
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background,
            }}
          >
            <ActivityIndicator color="#126b87" />
          </View>
        )}
      />
    </View>
  );
}

export default ZoeChat;
