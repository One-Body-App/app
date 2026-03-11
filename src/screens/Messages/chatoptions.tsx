import React, { type ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@react-native-vector-icons/material-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
  isMuted: boolean;
  isArchived: boolean;
  onArchive: () => void;
  onToggleMute: () => void;
  onBlock: () => void;
  onReport: () => void;
  canBlock?: boolean;
  canReport?: boolean;
  isArchiveLoading?: boolean;
  isMuteLoading?: boolean;
  isBlockLoading?: boolean;
  isReportLoading?: boolean;
};

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type OptionRow = {
  key: string;
  title: string;
  subtitle: string;
  iconName: MaterialIconName;
  onPress: () => void;
  isLoading: boolean;
};

const SHEET_TRANSLATE_Y = 420;

function ChatOptions({
  visible,
  onClose,
  isMuted,
  isArchived,
  onArchive,
  onToggleMute,
  onBlock,
  onReport,
  canBlock = false,
  canReport = false,
  isArchiveLoading = false,
  isMuteLoading = false,
  isBlockLoading = false,
  isReportLoading = false,
}: Props) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_TRANSLATE_Y)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_TRANSLATE_Y,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });
  }, [backdropOpacity, sheetTranslateY, visible]);

  const normalRows = useMemo(
    (): OptionRow[] => [
      {
        key: 'archive',
        title: isArchived ? 'Unarchive Chat' : 'Archive Chat',
        subtitle: isArchived
          ? 'Move this conversation back to your inbox'
          : 'Hide this conversation from your inbox',
        iconName: isArchived ? 'unarchive' : 'archive',
        onPress: onArchive,
        isLoading: isArchiveLoading,
      },
      {
        key: 'mute',
        title: isMuted ? 'Unmute Notifications' : 'Mute Notifications',
        subtitle: isMuted ? 'Turn alerts back on for this chat' : 'Silence alerts for this person',
        iconName: isMuted ? 'notifications-active' : 'notifications-off',
        onPress: onToggleMute,
        isLoading: isMuteLoading,
      },
    ],
    [isArchiveLoading, isArchived, isMuteLoading, isMuted, onArchive, onToggleMute]
  );

  const dangerRows = useMemo(
    () =>
      [
        canBlock
          ? {
              key: 'block',
              title: 'Block User',
              subtitle: "They won't be able to message or find you",
              iconName: 'block',
              onPress: onBlock,
              isLoading: isBlockLoading,
            }
          : null,
        canReport
          ? {
              key: 'report',
              title: 'Report Conversation',
              subtitle: 'Send transcript to safety team',
              iconName: 'report',
              onPress: onReport,
              isLoading: isReportLoading,
            }
          : null,
      ].filter(Boolean) as OptionRow[],
    [canBlock, canReport, isBlockLoading, isReportLoading, onBlock, onReport]
  );

  if (!isMounted) {
    return null;
  }

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
        </Pressable>
        <Animated.View
          style={[
            styles.sheetWrap,
            {
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: dark ? '#18242a' : '#ffffff',
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.handleWrap}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: dark ? 'rgba(255,255,255,0.16)' : '#d7dce4' },
                ]}
              />
            </View>

            <View
              style={[
                styles.header,
                { borderBottomColor: dark ? 'rgba(255,255,255,0.08)' : '#edf1f5' },
              ]}
            >
              <Text style={styles.headerLabel}>CHAT OPTIONS</Text>
            </View>

            <View style={styles.section}>
              {normalRows.map((row) => (
                <Pressable
                  key={row.key}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed ? styles.optionRowPressed : null,
                  ]}
                  disabled={row.isLoading}
                  onPress={row.onPress}
                >
                  <View style={styles.optionIconWrap}>
                    <MaterialIcons name={row.iconName} size={24} color="#126b87" />
                  </View>
                  <View style={styles.optionTextWrap}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>{row.title}</Text>
                    <Text style={styles.optionSubtitle}>{row.subtitle}</Text>
                  </View>
                  {row.isLoading ? <ActivityIndicator size="small" color="#126b87" /> : null}
                </Pressable>
              ))}
            </View>

            {dangerRows.length > 0 ? (
              <>
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : '#edf1f5' },
                  ]}
                />
                <View style={styles.section}>
                  {dangerRows.map((row) => (
                    <Pressable
                      key={row.key}
                      style={({ pressed }) => [
                        styles.optionRow,
                        pressed ? styles.optionDangerRowPressed : null,
                      ]}
                      disabled={row.isLoading}
                      onPress={row.onPress}
                    >
                      <View style={styles.dangerIconWrap}>
                        <MaterialIcons name={row.iconName} size={24} color="#ef4444" />
                      </View>
                      <View style={styles.optionTextWrap}>
                        <Text style={styles.dangerTitle}>{row.title}</Text>
                        <Text style={styles.dangerSubtitle}>{row.subtitle}</Text>
                      </View>
                      {row.isLoading ? <ActivityIndicator size="small" color="#ef4444" /> : null}
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.cancelWrap}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.cancelButton,
                  {
                    backgroundColor: dark ? '#0f151a' : '#eef2f6',
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 52,
    height: 6,
    borderRadius: 999,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: '#94a3b8',
  },
  section: {
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 18,
  },
  optionRowPressed: {
    backgroundColor: 'rgba(18,107,135,0.06)',
  },
  optionDangerRowPressed: {
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  optionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,107,135,0.10)',
  },
  dangerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.10)',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  dangerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ef4444',
  },
  dangerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#f87171',
  },
  divider: {
    height: 1,
    marginHorizontal: 28,
    marginTop: 8,
  },
  cancelWrap: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    minHeight: 56,
  },
  cancelText: {
    fontSize: 18,
    fontWeight: '800',
  },
});

export default ChatOptions;
