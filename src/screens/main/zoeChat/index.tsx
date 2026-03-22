import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions, useFocusEffect, useIsFocused, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import Config from 'react-native-config';
import StyledText from '@/components/styled/Text';
import { FeedTypes } from '@/src/screens/home';
import type { MainDrawerParamsList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

const ZOE_CHAT_URL = String(Config.ZOE_CHAT_URL ?? '').trim();

type Props = DrawerScreenProps<MainDrawerParamsList, 'ZoeAI'>;

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

function isAllowedTopLevelNavigation(url: string, allowedOrigin: string | null) {
  if (url === 'about:blank' || url === 'about:srcdoc') {
    return true;
  }

  if (!allowedOrigin) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.origin === allowedOrigin;
  } catch {
    return false;
  }
}

function ZoeChat({ navigation }: Props) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const statusBarStyle = dark ? 'light-content' : 'dark-content';
  const statusBarBackgroundColor = dark ? '#0D0D0D' : '#FFFFFF';
  const allowedOrigin = getAllowedChatOrigin();
  const headerBorderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(3,47,60,0.08)';
  const handleBackPress = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            params: {
              screen: 'HomeTab',
              params: {
                screen: 'Home',
                params: {
                  selectedTab: FeedTypes.ForYou,
                  refreshToken: Date.now(),
                },
              },
            },
          },
        ],
      })
    );
  }, [navigation]);

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
      }}
    >
      {Platform.OS === 'android' && isFocused ? (
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={statusBarBackgroundColor}
          translucent={false}
        />
      ) : null}
      <View
        style={[
          styles.headerWrap,
          {
            paddingTop: insets.top,
            backgroundColor: colors.background,
            borderBottomColor: headerBorderColor,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
            onPress={handleBackPress}
            style={styles.headerButton}
          >
            <MaterialIcons
              name="arrow-back-ios-new"
              size={20}
              color={dark ? colors.text : Colors.primary.brand}
            />
          </TouchableOpacity>

          <StyledText style={[styles.headerTitle, { color: colors.text }]}>ZoeAI</StyledText>

          <View style={styles.headerSpacer} />
        </View>
      </View>
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
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          keyboardDisplayRequiresUserAction={false}
          javaScriptCanOpenWindowsAutomatically={false}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          setSupportMultipleWindows={false}
          thirdPartyCookiesEnabled={false}
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          onShouldStartLoadWithRequest={(request) => {
            if (request.isTopFrame === false) {
              return true;
            }

            return isAllowedTopLevelNavigation(request.url, allowedOrigin);
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

const styles = StyleSheet.create({
  headerWrap: {
    borderBottomWidth: 1,
  },
  headerRow: {
    minHeight: 56,
    paddingHorizontal: spacing.x12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Rubik-Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ZoeChat;
