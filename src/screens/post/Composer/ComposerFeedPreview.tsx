import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import StyledText from '@/components/styled/Text';
import { composerDurations, composerEasings } from './composerMotion';
import {
  composerSpace,
  composerType,
  resolveComposerPalette,
  type ComposerPalette,
} from './composerTheme';
import type { ComposerDraft, ComposerMode, MediaItem } from './types';

export type ComposerFeedPreviewProps = {
  scheme: 'dark' | 'light';
  visible: boolean;
  mode: ComposerMode;
  onModeChange: (mode: ComposerMode) => void;
  draft: ComposerDraft;
  authorName?: string;
  authorAvatarUri?: string;
  onClose: () => void;
};

const CARD_MAX_WIDTH = 360;

type Tab = { id: ComposerMode; label: string };

const TABS: Tab[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'watch', label: 'Watch' },
];

const formatDuration = (ms?: number): string => {
  if (!ms) return '';
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

function MediaThumbStrip({ items, palette }: { items: MediaItem[]; palette: ComposerPalette }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.thumbStrip}>
      {items.slice(0, 4).map((item) => (
        <View
          key={item.id}
          style={[
            styles.thumb,
            { backgroundColor: palette.glass, borderColor: palette.glassBorder },
          ]}
        >
          <FastImage
            source={{ uri: item.thumbnailUri ?? item.uri }}
            style={styles.thumbImage}
            resizeMode="cover"
          />
          {item.kind === 'video' ? (
            <View style={styles.thumbPlay}>
              <MaterialIcons name="play-arrow" size={16} color="#fff" />
            </View>
          ) : null}
        </View>
      ))}
      {items.length > 4 ? (
        <View
          style={[
            styles.thumb,
            styles.thumbMore,
            { backgroundColor: palette.glass, borderColor: palette.glassBorder },
          ]}
        >
          <StyledText style={[styles.thumbMoreText, { color: palette.textPrimary }]}>
            +{items.length - 4}
          </StyledText>
        </View>
      ) : null}
    </View>
  );
}

function FeedPreviewCard({
  draft,
  palette,
  authorName,
  authorAvatarUri,
}: {
  draft: ComposerDraft;
  palette: ComposerPalette;
  authorName?: string;
  authorAvatarUri?: string;
}) {
  const hero = draft.media[0];
  return (
    <View
      style={[styles.card, { backgroundColor: palette.stage, borderColor: palette.glassBorder }]}
    >
      <View style={styles.cardHead}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: palette.glass, borderColor: palette.glassBorder },
          ]}
        >
          {authorAvatarUri ? (
            <Image source={{ uri: authorAvatarUri }} style={styles.avatarImage} />
          ) : (
            <MaterialIcons name="person" size={20} color={palette.textMuted} />
          )}
        </View>
        <View style={styles.cardHeadText}>
          <StyledText style={[styles.author, { color: palette.textPrimary }]}>
            {authorName ?? 'You'}
          </StyledText>
          <StyledText style={[styles.audience, { color: palette.textMuted }]}>
            {draft.audience === 'connections'
              ? 'Connections'
              : draft.audience === 'steward'
                ? 'Steward review only'
                : 'Public'}
          </StyledText>
        </View>
      </View>

      {draft.caption ? (
        <StyledText style={[styles.caption, { color: palette.textPrimary }]}>
          {draft.caption}
        </StyledText>
      ) : null}

      {hero ? (
        <View
          style={[
            styles.heroFrame,
            { borderColor: palette.glassBorder, backgroundColor: palette.glass },
          ]}
        >
          <FastImage
            source={{ uri: hero.thumbnailUri ?? hero.uri }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {hero.kind === 'video' ? (
            <View style={styles.heroBadge}>
              <MaterialIcons name="play-arrow" size={16} color="#fff" />
              {hero.durationMs ? (
                <StyledText style={styles.heroBadgeText}>
                  {formatDuration(hero.durationMs)}
                </StyledText>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <View
          style={[
            styles.heroEmpty,
            { borderColor: palette.glassBorder, backgroundColor: palette.glass },
          ]}
        >
          <StyledText style={[styles.heroEmptyText, { color: palette.textMuted }]}>
            No media yet
          </StyledText>
        </View>
      )}

      <MediaThumbStrip items={draft.media.slice(1)} palette={palette} />

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <MaterialIcons name="favorite-border" size={16} color={palette.textMuted} />
          <StyledText style={[styles.statLabel, { color: palette.textMuted }]}>0</StyledText>
        </View>
        <View style={styles.stat}>
          <MaterialIcons name="mode-comment" size={16} color={palette.textMuted} />
          <StyledText style={[styles.statLabel, { color: palette.textMuted }]}>0</StyledText>
        </View>
        <View style={styles.stat}>
          <MaterialIcons name="share" size={16} color={palette.textMuted} />
        </View>
      </View>
    </View>
  );
}

function WatchPreviewCard({
  draft,
  palette,
  authorName,
  authorAvatarUri,
}: {
  draft: ComposerDraft;
  palette: ComposerPalette;
  authorName?: string;
  authorAvatarUri?: string;
}) {
  const hero = draft.media.find((item) => item.kind === 'video') ?? draft.media[0];
  return (
    <View
      style={[
        styles.watchCard,
        { borderColor: palette.glassBorder, backgroundColor: palette.stage },
      ]}
    >
      {hero ? (
        <View style={[styles.watchFrame, { backgroundColor: palette.glass }]}>
          <FastImage
            source={{ uri: hero.thumbnailUri ?? hero.uri }}
            style={styles.watchImage}
            resizeMode="cover"
          />
          <View style={styles.watchScrim} />
          <View style={styles.watchPlay}>
            <MaterialIcons name="play-circle-filled" size={56} color="#ffffff" />
          </View>
          <View style={styles.watchOverlay}>
            <View style={styles.watchAuthorRow}>
              <View
                style={[
                  styles.avatar,
                  styles.watchAvatar,
                  { backgroundColor: palette.glass, borderColor: 'rgba(255,255,255,0.4)' },
                ]}
              >
                {authorAvatarUri ? (
                  <Image source={{ uri: authorAvatarUri }} style={styles.avatarImage} />
                ) : (
                  <MaterialIcons name="person" size={20} color="#ffffff" />
                )}
              </View>
              <StyledText style={[styles.watchAuthor, { color: '#ffffff' }]}>
                {authorName ?? 'You'}
              </StyledText>
            </View>
            {draft.caption ? (
              <StyledText style={[styles.watchCaption, { color: '#ffffff' }]} numberOfLines={3}>
                {draft.caption}
              </StyledText>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={[styles.watchEmpty, { backgroundColor: palette.glass }]}>
          <MaterialIcons name="videocam-off" size={28} color={palette.textMuted} />
          <StyledText style={[styles.heroEmptyText, { color: palette.textMuted }]}>
            Add a video to see the Watch preview
          </StyledText>
        </View>
      )}
    </View>
  );
}

export default function ComposerFeedPreview({
  scheme,
  visible,
  mode,
  onModeChange,
  draft,
  authorName,
  authorAvatarUri,
  onClose,
}: ComposerFeedPreviewProps): React.ReactElement | null {
  const palette = useMemo(() => resolveComposerPalette(scheme), [scheme]);
  const translateX = useSharedValue(visible ? 0 : 100);
  const opacity = useSharedValue(visible ? 1 : 0);

  React.useEffect(() => {
    translateX.value = withSpring(visible ? 0 : 100, { damping: 22, stiffness: 220 });
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: composerDurations.enter,
      easing: composerEasings.cinema,
    });
  }, [opacity, translateX, visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: `${translateX.value}%` }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.panel, containerStyle]}>
      <View style={[styles.scrim, { backgroundColor: palette.overlay }]} />
      <View
        style={[styles.sheet, { backgroundColor: palette.stage, borderColor: palette.glassBorder }]}
      >
        <View style={styles.sheetHead}>
          <StyledText style={[styles.sheetEyebrow, { color: palette.textMuted }]}>
            PREVIEW
          </StyledText>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close preview"
            style={styles.sheetClose}
          >
            <MaterialIcons name="close" size={20} color={palette.textPrimary} />
          </Pressable>
        </View>

        <View style={[styles.tabRow, { backgroundColor: palette.glass }]}>
          {TABS.map((tab) => {
            const active = tab.id === mode;
            return (
              <Pressable
                key={tab.id}
                onPress={() => onModeChange(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? palette.glassElevated : 'transparent',
                  },
                ]}
              >
                <StyledText
                  style={[
                    styles.tabLabel,
                    { color: active ? palette.textPrimary : palette.textMuted },
                  ]}
                >
                  {tab.label}
                </StyledText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.cardWrap}>
          {mode === 'feed' ? (
            <FeedPreviewCard
              draft={draft}
              palette={palette}
              authorName={authorName}
              authorAvatarUri={authorAvatarUri}
            />
          ) : (
            <WatchPreviewCard
              draft={draft}
              palette={palette}
              authorName={authorName}
              authorAvatarUri={authorAvatarUri}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    flexDirection: 'row',
  },
  scrim: {
    flex: 1,
  },
  sheet: {
    width: '88%',
    maxWidth: CARD_MAX_WIDTH + 64,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: composerSpace.lg,
    paddingTop: composerSpace.xxl,
    paddingBottom: composerSpace.xxl,
    gap: composerSpace.md,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetEyebrow: {
    ...composerType.eyebrow,
    fontWeight: '700',
  },
  sheetClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  tabRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: composerSpace.chipRadius,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: composerSpace.chipRadius,
    alignItems: 'center',
  },
  tabLabel: {
    ...composerType.label,
    fontWeight: '700',
  },
  cardWrap: {
    marginTop: composerSpace.sm,
  },
  card: {
    borderRadius: composerSpace.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: composerSpace.md,
    gap: composerSpace.sm,
    maxWidth: CARD_MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerSpace.xs,
  },
  cardHeadText: {
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  author: {
    ...composerType.body,
    fontWeight: '700',
  },
  audience: {
    ...composerType.caption,
  },
  caption: {
    ...composerType.body,
  },
  heroFrame: {
    aspectRatio: 1,
    borderRadius: composerSpace.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBadge: {
    position: 'absolute',
    bottom: composerSpace.xs,
    left: composerSpace.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: composerSpace.chipRadius,
  },
  heroBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroEmpty: {
    aspectRatio: 1,
    borderRadius: composerSpace.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmptyText: {
    ...composerType.caption,
  },
  statRow: {
    flexDirection: 'row',
    gap: composerSpace.md,
    paddingTop: composerSpace.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    ...composerType.caption,
  },
  thumbStrip: {
    flexDirection: 'row',
    gap: 6,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: composerSpace.xs,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  thumbMore: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbMoreText: {
    ...composerType.label,
    fontSize: 13,
  },
  watchCard: {
    borderRadius: composerSpace.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    maxWidth: CARD_MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  watchFrame: {
    aspectRatio: 9 / 16,
    position: 'relative',
  },
  watchImage: {
    width: '100%',
    height: '100%',
  },
  watchScrim: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  watchPlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchOverlay: {
    position: 'absolute',
    left: composerSpace.md,
    right: composerSpace.md,
    bottom: composerSpace.md,
    gap: composerSpace.xs,
  },
  watchAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  watchAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  watchAuthor: {
    ...composerType.body,
    fontWeight: '700',
  },
  watchCaption: {
    ...composerType.caption,
    lineHeight: 18,
    maxWidth: 280,
  },
  watchEmpty: {
    aspectRatio: 9 / 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: composerSpace.sm,
    padding: composerSpace.xxl,
  },
});
