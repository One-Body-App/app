import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '@react-navigation/native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import StyledText from '@/components/styled/Text';
import {
  composerSpace,
  composerType,
  resolveComposerPalette,
  type ComposerPalette,
} from '@/src/screens/post/Composer/composerTheme';

export type UnderReviewMediaThumb = {
  id: string;
  uri: string;
  kind: 'photo' | 'video';
};

export type UnderReviewCardProps = {
  eyebrow?: string;
  title?: string;
  body?: string;
  thumbnails?: UnderReviewMediaThumb[];
  flaggedCategories?: string[];
  onView?: () => void;
  onAppeal?: () => void;
};

const DEFAULT_EYEBROW = 'Under review';
const DEFAULT_TITLE = 'Pause for a moment';
const DEFAULT_BODY =
  'A steward is reviewing this post to make sure it aligns with the community. It is visible to you while we look. We will let you know what happens next.';

const renderThumb = (
  thumb: UnderReviewMediaThumb,
  palette: ComposerPalette
): React.ReactElement => (
  <View
    key={thumb.id}
    style={[
      styles.thumb,
      {
        backgroundColor: palette.glass,
        borderColor: palette.glassBorder,
      },
    ]}
  >
    {Platform.OS === 'web' ? (
      <Image source={{ uri: thumb.uri }} style={styles.thumbImage} blurRadius={10} />
    ) : (
      <FastImage source={{ uri: thumb.uri }} style={styles.thumbImage} resizeMode="cover" />
    )}
    {thumb.kind === 'video' ? (
      <View style={[styles.thumbTag, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
        <StyledText style={styles.thumbTagText}>Video</StyledText>
      </View>
    ) : null}
  </View>
);

export default function UnderReviewCard({
  eyebrow = DEFAULT_EYEBROW,
  title = DEFAULT_TITLE,
  body = DEFAULT_BODY,
  thumbnails,
  flaggedCategories,
  onView,
  onAppeal,
}: UnderReviewCardProps): React.ReactElement {
  const { dark } = useTheme();
  const palette = useMemo(() => resolveComposerPalette(dark ? 'dark' : 'light'), [dark]);
  const [expanded, setExpanded] = useState(false);
  const canExpand = (flaggedCategories?.length ?? 0) > 0;

  const handleViewPress = () => {
    if (canExpand) {
      setExpanded((value) => !value);
    }
    onView?.();
  };

  const moderationTone = palette.moderationUnsure;
  const moderationToneBg = palette.moderationUnsureBg;
  const visibleThumbs = thumbnails ? thumbnails.slice(0, 4) : [];
  const extraThumbCount = thumbnails ? Math.max(0, thumbnails.length - 4) : 0;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${eyebrow}. ${title}.`}
      style={[
        styles.card,
        {
          backgroundColor: palette.glass,
          borderColor: palette.glassBorder,
          shadowColor: palette.shadow,
        },
      ]}
    >
      <View style={[styles.ribbon, { backgroundColor: moderationTone }]} />
      <View style={styles.head}>
        <View style={[styles.iconWrap, { backgroundColor: moderationToneBg }]}>
          <MaterialIcons name="shield" size={18} color={moderationTone} />
        </View>
        <View style={styles.id}>
          <StyledText style={[styles.eyebrow, { color: moderationTone }]}>
            {eyebrow.toUpperCase()}
          </StyledText>
          <StyledText style={[styles.title, { color: palette.textPrimary }]}>{title}</StyledText>
        </View>
      </View>

      <StyledText style={[styles.body, { color: palette.textSecondary }]}>{body}</StyledText>

      {visibleThumbs.length > 0 ? (
        <View style={styles.thumbsRow}>
          {visibleThumbs.map((thumb) => renderThumb(thumb, palette))}
          {extraThumbCount > 0 ? (
            <View
              style={[
                styles.thumb,
                styles.thumbMore,
                {
                  backgroundColor: palette.glass,
                  borderColor: palette.glassBorder,
                },
              ]}
            >
              <StyledText style={[styles.thumbMoreText, { color: palette.textMuted }]}>
                +{extraThumbCount}
              </StyledText>
            </View>
          ) : null}
        </View>
      ) : null}

      {expanded && canExpand ? (
        <View
          style={[
            styles.reasons,
            {
              backgroundColor: moderationToneBg,
              borderColor: 'rgba(245,158,11,0.25)',
            },
          ]}
        >
          {flaggedCategories!.map((category) => (
            <View key={category} style={[styles.reasonPill, { backgroundColor: moderationToneBg }]}>
              <StyledText style={[styles.reasonText, { color: moderationTone }]}>
                {category}
              </StyledText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        {canExpand ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Hide details' : 'View what was flagged'}
            onPress={handleViewPress}
            style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons name="visibility" size={16} color={palette.accent} />
            <StyledText style={[styles.actionText, { color: palette.accent }]}>
              {expanded ? 'Hide details' : 'View what was flagged'}
            </StyledText>
            <MaterialIcons
              name={expanded ? 'expand-less' : 'chevron-right'}
              size={16}
              color={palette.accent}
            />
          </Pressable>
        ) : null}
        {onAppeal ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Request a steward to take another look"
            onPress={onAppeal}
            style={({ pressed }) => [
              styles.action,
              styles.actionGhost,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <StyledText style={[styles.actionText, { color: palette.textMuted }]}>
              Request a steward to take another look
            </StyledText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 18,
    paddingHorizontal: composerSpace.lg,
    paddingTop: composerSpace.lg,
    paddingBottom: composerSpace.md,
    marginBottom: composerSpace.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 2,
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.85,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerSpace.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  id: {
    flexDirection: 'column',
    flex: 1,
  },
  eyebrow: {
    ...composerType.eyebrow,
    fontWeight: '700',
  },
  title: {
    ...composerType.title,
    fontSize: 18,
    marginTop: 2,
  },
  body: {
    ...composerType.body,
    marginTop: composerSpace.sm,
    marginBottom: composerSpace.sm,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: composerSpace.xs,
    marginVertical: composerSpace.xs,
    flexWrap: 'wrap',
  },
  thumb: {
    flexBasis: 64,
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbTag: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thumbTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.6,
  },
  thumbMore: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbMoreText: {
    ...composerType.label,
    fontSize: 16,
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: composerSpace.sm,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: composerSpace.sm,
  },
  reasonPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reasonText: {
    ...composerType.caption,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: composerSpace.xs,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  actionGhost: {
    paddingHorizontal: 0,
  },
  actionText: {
    ...composerType.caption,
    fontWeight: '600',
  },
});
