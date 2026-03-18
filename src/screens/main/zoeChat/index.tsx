import React, { useCallback } from 'react';
import { ActivityIndicator, Platform, StatusBar, Text, View } from 'react-native';
import { useFocusEffect, useIsFocused, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Config from 'react-native-config';
import { getHeight } from '@/utils/ResponsiveFun';

const ZOE_CHAT_URL = String(Config.ZOE_CHAT_URL ?? '').trim();

function getAllowedChatOrigin() {
  try {
    const parsed = new URL(ZOE_CHAT_URL);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function ZoeChat() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const bottomTabHeight = getHeight(7) + insets.bottom;
  const statusBarStyle = dark ? 'light-content' : 'dark-content';
  const statusBarBackgroundColor = dark ? '#032f3c' : '#f6f6f7';
  const allowedOrigin = getAllowedChatOrigin();

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
      {!allowedOrigin ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            backgroundColor: colors.background,
          }}
        >
          <Text style={{ color: colors.text, textAlign: 'center' }}>
            Zoe chat is currently unavailable on this build.
          </Text>
        </View>
      ) : (
        <WebView
          source={{ uri: ZOE_CHAT_URL }}
          style={{ flex: 1, backgroundColor: colors.background }}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          originWhitelist={[allowedOrigin]}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          setSupportMultipleWindows={false}
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          onShouldStartLoadWithRequest={(request) => {
            try {
              return new URL(request.url).origin === allowedOrigin;
            } catch {
              return false;
            }
          }}
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
      )}
    </View>
  );
}

export default ZoeChat;
