import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import StyledText from '@/components/styled/Text';
import { composerDurations, composerEasings } from './composerMotion';
import {
  composerSpace,
  composerType,
  resolveComposerPalette,
  type ComposerPalette,
} from './composerTheme';
import type { ComposerAudience } from './types';

export type ComposerHeaderProps = {
  scheme: 'dark' | 'light';
  audience: ComposerAudience;
  onAudienceChange: (next: ComposerAudience) => void;
  characterCount: number;
  characterMax: number;
  onClose: () => void;
  onSubmit: () => void;
  onTogglePreview: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitLabel?: string;
  title?: string;
  eyebrow?: string;
};

const AUDIENCE_LABELS: Record<ComposerAudience, string> = {
  everyone: 'Everyone',
  connections: 'Connections',
  steward: 'Steward review only',
};

const AUDIENCE_ICONS: Record<ComposerAudience, React.ComponentProps<typeof MaterialIcons>['name']> =
  {
    everyone: 'public',
    connections: 'group',
    steward: 'shield',
  };

const RING_RADIUS = 11;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function CounterRing({ fill, palette }: { fill: number; palette: ComposerPalette }) {
  const clampedFill = Math.max(0, Math.min(1.05, fill));
  const offset = RING_CIRCUMFERENCE * (1 - Math.min(1, clampedFill));
  const tone =
    clampedFill > 1
      ? palette.moderationBlocked
      : clampedFill >= 0.8
        ? palette.moderationUnsure
        : palette.accent;
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" style={styles.ring} aria-hidden>
      <Defs>
        <LinearGradient id="ring-fill" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={palette.ribbonStart} />
          <Stop offset="1" stopColor={palette.ribbonEnd} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={14}
        cy={14}
        r={RING_RADIUS}
        stroke={palette.glassBorder}
        strokeWidth={2}
        fill="transparent"
      />
      <Circle
        cx={14}
        cy={14}
        r={RING_RADIUS}
        stroke={clampedFill > 1 || clampedFill >= 0.8 ? tone : 'url(#ring-fill)'}
        strokeWidth={2}
        fill="transparent"
        strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation={-90}
        origin="14, 14"
      />
    </Svg>
  );
}

function AudienceMenu({
  palette,
  selected,
  onSelect,
  onClose,
}: {
  palette: ComposerPalette;
  selected: ComposerAudience;
  onSelect: (audience: ComposerAudience) => void;
  onClose: () => void;
}) {
  return (
    <View
      style={[
        styles.menu,
        {
          backgroundColor: palette.glassElevated,
          borderColor: palette.glassBorder,
          shadowColor: palette.shadow,
        },
      ]}
    >
      {(Object.keys(AUDIENCE_LABELS) as ComposerAudience[]).map((key) => {
        const active = key === selected;
        const Icon = AUDIENCE_ICONS[key];
        return (
          <Pressable
            key={key}
            onPress={() => {
              onSelect(key);
              onClose();
            }}
            accessibilityRole="menuitem"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.menuItem,
              {
                backgroundColor: active ? palette.glass : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name={Icon} size={18} color={palette.accent} />
            <View style={styles.menuItemText}>
              <StyledText style={[styles.menuItemTitle, { color: palette.textPrimary }]}>
                {AUDIENCE_LABELS[key]}
              </StyledText>
              <StyledText style={[styles.menuItemHint, { color: palette.textMuted }]}>
                {key === 'everyone'
                  ? 'Anyone on One Body can see this.'
                  : key === 'connections'
                    ? 'Only people you connect with.'
                    : 'Send to stewards for thoughtful review before publishing.'}
              </StyledText>
            </View>
            {active ? <MaterialIcons name="check" size={18} color={palette.accent} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ComposerHeader({
  scheme,
  audience,
  onAudienceChange,
  characterCount,
  characterMax,
  onClose,
  onSubmit,
  onTogglePreview,
  canSubmit,
  isSubmitting,
  submitLabel = 'Post',
  title = 'New post',
  eyebrow,
}: ComposerHeaderProps): React.ReactElement {
  const palette = useMemo(() => resolveComposerPalette(scheme), [scheme]);
  const [menuOpen, setMenuOpen] = useState(false);
  const fill = characterMax > 0 ? characterCount / characterMax : 0;
  const showCounter = characterCount > 0;
  const ribbonOpacity = useSharedValue(0.85);

  React.useEffect(() => {
    ribbonOpacity.value = withTiming(menuOpen ? 1 : 0.85, {
      duration: composerDurations.chip,
      easing: composerEasings.cinema,
    });
  }, [menuOpen, ribbonOpacity]);

  const ribbonStyle = useAnimatedStyle(() => ({ opacity: ribbonOpacity.value }));

  const audienceIcon = AUDIENCE_ICONS[audience];

  return (
    <View style={styles.headerWrap}>
      {Platform.OS === 'ios' ? (
        <BlurView
          blurType={scheme === 'dark' ? 'chromeMaterialDark' : 'chromeMaterial'}
          blurAmount={18}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Animated.View
        style={[
          styles.ribbon,
          ribbonStyle,
          {
            backgroundColor: palette.ribbonStart,
          },
        ]}
      />

      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={[styles.iconButton, { backgroundColor: palette.glass }]}
        >
          <MaterialIcons name="close" size={22} color={palette.textPrimary} />
        </Pressable>

        <View style={styles.titleWrap}>
          {eyebrow ? (
            <StyledText style={[styles.eyebrow, { color: palette.textMuted }]}>
              {eyebrow.toUpperCase()}
            </StyledText>
          ) : null}
          <StyledText style={[styles.title, { color: palette.textPrimary }]}>{title}</StyledText>

          <Pressable
            onPress={() => setMenuOpen((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={`Audience: ${AUDIENCE_LABELS[audience]}`}
            accessibilityState={{ expanded: menuOpen }}
            style={[
              styles.audience,
              {
                backgroundColor: palette.glass,
                borderColor: palette.glassBorder,
              },
            ]}
          >
            <MaterialIcons name={audienceIcon} size={14} color={palette.accent} />
            <StyledText style={[styles.audienceLabel, { color: palette.textPrimary }]}>
              {AUDIENCE_LABELS[audience]}
            </StyledText>
            <MaterialIcons
              name={menuOpen ? 'expand-less' : 'expand-more'}
              size={16}
              color={palette.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onTogglePreview}
            accessibilityRole="button"
            accessibilityLabel="Toggle preview"
            style={[styles.iconButton, { backgroundColor: palette.glass }]}
          >
            <MaterialIcons name="visibility" size={20} color={palette.textPrimary} />
          </Pressable>

          {showCounter ? <CounterRing fill={fill} palette={palette} /> : null}

          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel={submitLabel}
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: canSubmit ? palette.accent : palette.glass,
                borderColor: canSubmit ? palette.accent : palette.glassBorder,
                opacity: !canSubmit || isSubmitting ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={palette.textInverted} />
            ) : (
              <StyledText
                style={[
                  styles.submitText,
                  { color: canSubmit ? palette.textInverted : palette.textMuted },
                ]}
              >
                {submitLabel}
              </StyledText>
            )}
          </Pressable>
        </View>
      </View>

      {menuOpen ? (
        <AudienceMenu
          palette={palette}
          selected={audience}
          onSelect={onAudienceChange}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingTop: composerSpace.sm,
    paddingBottom: composerSpace.xs,
    paddingHorizontal: composerSpace.lg,
    overflow: 'visible',
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    left: composerSpace.lg,
    right: composerSpace.lg,
    height: composerSpace.ribbonHeight,
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: composerSpace.headerHeight,
    gap: composerSpace.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  eyebrow: {
    ...composerType.eyebrow,
    fontWeight: '700',
  },
  title: {
    ...composerType.title,
    fontSize: 16,
  },
  audience: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: composerSpace.chipRadius,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  audienceLabel: {
    ...composerType.caption,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ring: {
    marginHorizontal: 2,
  },
  submitButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  submitText: {
    ...composerType.label,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  menu: {
    marginTop: composerSpace.xs,
    borderRadius: composerSpace.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
    gap: 4,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerSpace.sm,
    paddingHorizontal: composerSpace.sm,
    paddingVertical: composerSpace.xs,
    borderRadius: composerSpace.sm,
  },
  menuItemText: {
    flex: 1,
    gap: 2,
  },
  menuItemTitle: {
    ...composerType.body,
    fontWeight: '700',
  },
  menuItemHint: {
    ...composerType.caption,
  },
});
