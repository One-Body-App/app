import React, { useMemo, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import StyledText from '@/components/styled/Text';
import type { ScriptureShare } from '@/utils/types';
import { Colors } from '@/src/styles';
import { borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

type Props = {
  share: ScriptureShare;
  style?: StyleProp<ViewStyle>;
};

const COLLAPSED_TEXT_LENGTH = 220;

const formatCount = (value?: number): string => {
  const count = Number.isFinite(value) ? Number(value) : 0;
  return count.toLocaleString();
};

export default function ScriptureCard({ share, style }: Props): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const canExpand = share.text.length > COLLAPSED_TEXT_LENGTH;
  const text = useMemo(() => {
    if (expanded || !canExpand) return share.text;
    return `${share.text.slice(0, COLLAPSED_TEXT_LENGTH).trim()}...`;
  }, [canExpand, expanded, share.text]);

  return (
    <Pressable
      onPress={() => {
        if (canExpand) setExpanded((current) => !current);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${share.reference} scripture card`}
      accessibilityState={{ expanded }}
      style={({ pressed }) => [
        styles.card,
        style,
        {
          opacity: pressed && canExpand ? 0.82 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconFrame}>
          <MaterialIcons name="menu-book" size={17} color="#41899f" />
        </View>
        <View style={styles.headerText}>
          <StyledText numberOfLines={1} style={styles.reference}>
            {share.reference}
          </StyledText>
          <StyledText numberOfLines={1} style={styles.translation}>
            {share.translation}
          </StyledText>
        </View>
      </View>

      <StyledText style={styles.verseText}>{text}</StyledText>

      <View style={styles.footer}>
        <View style={styles.count}>
          <MaterialIcons name="visibility" size={15} color="#41899f" />
          <StyledText style={styles.countText}>{formatCount(share.shareCount)} shares</StyledText>
        </View>
        {canExpand ? (
          <StyledText style={styles.expandText}>{expanded ? 'Show less' : 'Read more'}</StyledText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(3, 47, 60, 0.15)',
    backgroundColor: 'rgba(65, 137, 159, 0.06)',
    padding: spacing.x10,
    marginBottom: spacing.x10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.x8,
  },
  iconFrame: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.x8,
    backgroundColor: '#ffffff',
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(65, 137, 159, 0.24)',
  },
  headerText: {
    flex: 1,
  },
  reference: {
    color: '#032f3c',
    fontSize: 14,
    fontWeight: '700',
  },
  translation: {
    color: Colors.neutral[400],
    fontSize: 12,
    marginTop: 1,
  },
  verseText: {
    color: '#032f3c',
    fontSize: 15,
    lineHeight: 23,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.x8,
    marginTop: spacing.x10,
  },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  countText: {
    color: '#41899f',
    fontSize: 12,
    fontWeight: '700',
  },
  expandText: {
    color: '#41899f',
    fontSize: 12,
    fontWeight: '700',
  },
});
