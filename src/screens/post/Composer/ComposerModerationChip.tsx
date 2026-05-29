import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import StyledText from '@/components/styled/Text';
import { composerChipSpring, composerDurations, composerEasings } from './composerMotion';
import {
  composerSpace,
  composerType,
  resolveComposerPalette,
  type ComposerPalette,
} from './composerTheme';
import type { ModerationStatus } from './types';

export type ComposerModerationChipProps = {
  scheme: 'dark' | 'light';
  status: ModerationStatus;
  message?: string;
  // When provided, the chip becomes pressable and the host can show details.
  onPress?: () => void;
  // Auto-dismiss the chip after `autoDismissMs` for safe statuses.
  autoDismissMs?: number;
  onAutoDismiss?: () => void;
};

const DEFAULT_MESSAGES: Record<ModerationStatus, string> = {
  pending: 'Checking this image for community fit...',
  safe: 'Looks good to share.',
  unsure: 'Pause for a moment - a steward will take a look.',
  blocked: 'This image conflicts with our community standards.',
};

const ICON_FOR_STATUS: Record<
  ModerationStatus,
  React.ComponentProps<typeof MaterialIcons>['name']
> = {
  pending: 'hourglass-empty',
  safe: 'check-circle',
  unsure: 'shield',
  blocked: 'block',
};

const colorsForStatus = (
  palette: ComposerPalette,
  status: ModerationStatus
): { fg: string; bg: string; border: string } => {
  switch (status) {
    case 'safe':
      return {
        fg: palette.moderationSafe,
        bg: palette.moderationSafeBg,
        border: palette.moderationSafe,
      };
    case 'unsure':
      return {
        fg: palette.moderationUnsure,
        bg: palette.moderationUnsureBg,
        border: palette.moderationUnsure,
      };
    case 'blocked':
      return {
        fg: palette.moderationBlocked,
        bg: palette.moderationBlockedBg,
        border: palette.moderationBlocked,
      };
    case 'pending':
    default:
      return {
        fg: palette.textSecondary,
        bg: palette.glass,
        border: palette.glassBorder,
      };
  }
};

export default function ComposerModerationChip({
  scheme,
  status,
  message,
  onPress,
  autoDismissMs,
  onAutoDismiss,
}: ComposerModerationChipProps): React.ReactElement {
  const palette = useMemo(() => resolveComposerPalette(scheme), [scheme]);
  const colors = useMemo(() => colorsForStatus(palette, status), [palette, status]);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const pulse = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: composerDurations.chip,
      easing: composerEasings.cinema,
    });
    translateY.value = withSpring(0, composerChipSpring);
  }, [opacity, translateY, status]);

  useEffect(() => {
    if (status !== 'pending') {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: composerDurations.pulse / 2, easing: composerEasings.swift }),
        withTiming(0, { duration: composerDurations.pulse / 2, easing: composerEasings.swift })
      ),
      -1,
      false
    );
  }, [pulse, status]);

  useEffect(() => {
    if (status !== 'safe' || !autoDismissMs) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, {
        duration: composerDurations.exit,
        easing: composerEasings.cinemaIn,
      });
      onAutoDismiss?.();
    }, autoDismissMs);
    return () => clearTimeout(timeout);
  }, [autoDismissMs, onAutoDismiss, opacity, status]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + pulse.value * 0.38,
    transform: [{ scale: 1 + pulse.value * 0.18 }],
  }));

  const resolvedMessage = message ?? DEFAULT_MESSAGES[status];

  const inner = (
    <Animated.View
      style={[
        styles.chip,
        containerStyle,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
        {status === 'pending' ? (
          <Animated.View style={[styles.pulseRing, pulseStyle, { borderColor: colors.fg }]} />
        ) : null}
        <MaterialIcons name={ICON_FOR_STATUS[status]} size={16} color={colors.fg} />
      </View>
      <StyledText numberOfLines={2} style={[styles.message, { color: colors.fg }]}>
        {resolvedMessage}
      </StyledText>
      {onPress ? <MaterialIcons name="chevron-right" size={18} color={colors.fg} /> : null}
    </Animated.View>
  );

  if (!onPress) {
    return inner;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={resolvedMessage}>
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerSpace.xs,
    paddingHorizontal: composerSpace.sm,
    paddingVertical: 8,
    borderRadius: composerSpace.chipRadius,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  message: {
    ...composerType.caption,
    fontWeight: '600',
    maxWidth: 240,
  },
});
