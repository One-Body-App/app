import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import StyledText from '@/components/styled/Text';
import type { ScriptureShare } from '@/utils/types';
import { composerSpace, composerType, type ComposerPalette } from './composerTheme';

type Props = {
  share: ScriptureShare;
  palette: ComposerPalette;
  onRemove?: () => void;
};

const formatCount = (value?: number): string =>
  (Number.isFinite(value) ? Number(value) : 0).toLocaleString();

/**
 * The attached-scripture card shown in the composer once a verse is chosen — a
 * quote/repost-style frame (accent rail + quotation mark) carrying the
 * reference, translation, verse text and times-shared count. Mirrors the feed
 * ScriptureCard so a shared scripture reads the same everywhere.
 */
export default function ComposerScriptureCard({
  share,
  palette,
  onRemove,
}: Props): React.ReactElement {
  return (
    <View
      testID="composer-scripture-card"
      style={[styles.card, { backgroundColor: palette.glass, borderColor: palette.glassBorder }]}
    >
      <View style={[styles.rail, { backgroundColor: palette.accent }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <View
            style={[
              styles.icon,
              { backgroundColor: palette.glassElevated, borderColor: palette.glassBorder },
            ]}
          >
            <MaterialIcons name="menu-book" size={16} color={palette.accent} />
          </View>
          <View style={styles.headerText}>
            <StyledText
              numberOfLines={1}
              style={[styles.reference, { color: palette.textPrimary }]}
            >
              {share.reference}
            </StyledText>
            <StyledText
              numberOfLines={1}
              style={[styles.translation, { color: palette.textMuted }]}
            >
              {share.translation}
            </StyledText>
          </View>
          {onRemove ? (
            <Pressable
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel="Remove scripture"
              hitSlop={8}
              style={styles.remove}
            >
              <MaterialIcons name="close" size={18} color={palette.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.quoteRow}>
          <StyledText style={[styles.quoteMark, { color: palette.accent }]}>“</StyledText>
          <StyledText style={[styles.verseText, { color: palette.textSecondary }]}>
            {share.text}
          </StyledText>
        </View>

        <View style={styles.footer}>
          <MaterialIcons name="visibility" size={14} color={palette.accentSoft} />
          <StyledText style={[styles.count, { color: palette.accentSoft }]}>
            {formatCount(share.shareCount)} shares
          </StyledText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: composerSpace.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  rail: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: composerSpace.sm,
    gap: composerSpace.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerSpace.xs,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    flex: 1,
  },
  reference: {
    ...composerType.label,
  },
  translation: {
    ...composerType.caption,
    marginTop: 1,
  },
  remove: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quoteMark: {
    ...composerType.display,
    lineHeight: 30,
    marginTop: -4,
  },
  verseText: {
    ...composerType.body,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  count: {
    ...composerType.caption,
    fontWeight: '700',
  },
});
