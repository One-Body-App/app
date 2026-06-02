import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import CustomModal from '@/src/components/CustomModal';
import StyledText from '@/components/styled/Text';
import { APP_HEADER_ANDROID_TITLE_PADDING_LEFT } from '@/src/styles/headerLayout';
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
  canSubmit: boolean;
  isSubmitting: boolean;
  submitLabel?: string;
  title?: string;
};

const AUDIENCE_LABELS: Record<ComposerAudience, string> = {
  everyone: 'Everyone',
  connections: 'Connections',
};

const AUDIENCE_ICONS: Record<ComposerAudience, React.ComponentProps<typeof MaterialIcons>['name']> =
  {
    everyone: 'public',
    connections: 'group',
  };

const AUDIENCE_HINTS: Record<ComposerAudience, string> = {
  everyone: 'Anyone on One Body can see this.',
  connections: 'Only people you connect with.',
};

const RING_RADIUS = 11;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// On iOS the title is centered across the full header width (like the app's
// other screens). This symmetric inset keeps the centered title clear of the
// close button on the left and the action cluster on the right.
const IOS_TITLE_INSET = 120;

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

function AudienceSheet({
  palette,
  selected,
  sheetSurface,
  onSelect,
}: {
  palette: ComposerPalette;
  selected: ComposerAudience;
  sheetSurface: string;
  onSelect: (audience: ComposerAudience) => void;
}) {
  return (
    <View style={[styles.sheet, { backgroundColor: sheetSurface }]}>
      <View style={[styles.sheetHandle, { backgroundColor: palette.glassBorder }]} />
      <StyledText style={[styles.sheetTitle, { color: palette.textPrimary }]}>
        Who can see this?
      </StyledText>
      {(Object.keys(AUDIENCE_LABELS) as ComposerAudience[]).map((key) => {
        const active = key === selected;
        const Icon = AUDIENCE_ICONS[key];
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            accessibilityRole="menuitem"
            accessibilityLabel={AUDIENCE_LABELS[key]}
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.menuItem,
              {
                backgroundColor: active ? palette.glass : 'transparent',
                borderColor: active ? palette.glassBorder : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name={Icon} size={20} color={palette.accent} />
            <View style={styles.menuItemText}>
              <StyledText style={[styles.menuItemTitle, { color: palette.textPrimary }]}>
                {AUDIENCE_LABELS[key]}
              </StyledText>
              <StyledText style={[styles.menuItemHint, { color: palette.textMuted }]}>
                {AUDIENCE_HINTS[key]}
              </StyledText>
            </View>
            {active ? <MaterialIcons name="check" size={20} color={palette.accent} /> : null}
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
  canSubmit,
  isSubmitting,
  submitLabel = 'Post',
  title = 'New post',
}: ComposerHeaderProps): React.ReactElement {
  const palette = useMemo(() => resolveComposerPalette(scheme), [scheme]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const fill = characterMax > 0 ? characterCount / characterMax : 0;
  const showCounter = characterCount > 0;
  const audienceIcon = AUDIENCE_ICONS[audience];
  const isIOS = Platform.OS === 'ios';
  const sheetSurface = scheme === 'dark' ? '#0D0D0D' : '#ffffff';

  const titleNode = (
    <StyledText numberOfLines={1} style={[styles.title, { color: palette.textPrimary }]}>
      {title}
    </StyledText>
  );

  return (
    <View style={styles.headerWrap}>
      {isIOS ? (
        <BlurView
          blurType={scheme === 'dark' ? 'chromeMaterialDark' : 'chromeMaterial'}
          blurAmount={18}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[styles.ribbon, { backgroundColor: palette.ribbonStart }]} />

      <View style={styles.header}>
        {/* iOS: title centered across the whole header, behind the controls. */}
        {isIOS ? (
          <View pointerEvents="none" style={styles.titleOverlayIOS}>
            {titleNode}
          </View>
        ) : null}

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={[styles.iconButton, { backgroundColor: palette.glass }]}
        >
          <MaterialIcons name="close" size={22} color={palette.textPrimary} />
        </Pressable>

        {isIOS ? (
          <View style={styles.titleFlex} />
        ) : (
          <View style={styles.titleWrapAndroid}>{titleNode}</View>
        )}

        <View style={styles.actions}>
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

      <View style={[styles.audienceRow, isIOS ? styles.audienceRowIOS : styles.audienceRowAndroid]}>
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Audience: ${AUDIENCE_LABELS[audience]}`}
          accessibilityState={{ expanded: sheetOpen }}
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
            name={sheetOpen ? 'expand-less' : 'expand-more'}
            size={16}
            color={palette.textMuted}
          />
        </Pressable>
      </View>

      <CustomModal
        modalVisible={sheetOpen}
        onclose={() => setSheetOpen(false)}
        style={[styles.audienceModal, { backgroundColor: sheetSurface }]}
      >
        <AudienceSheet
          palette={palette}
          selected={audience}
          sheetSurface={sheetSurface}
          onSelect={(next) => {
            onAudienceChange(next);
            setSheetOpen(false);
          }}
        />
      </CustomModal>
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
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: composerSpace.headerHeight,
    gap: composerSpace.sm,
  },
  titleOverlayIOS: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: IOS_TITLE_INSET,
    right: IOS_TITLE_INSET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleFlex: {
    flex: 1,
  },
  titleWrapAndroid: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  title: {
    ...composerType.title,
    fontSize: 22,
    lineHeight: 28,
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
  audienceRow: {
    marginTop: composerSpace.xs,
  },
  audienceRowIOS: {
    alignItems: 'center',
  },
  audienceRowAndroid: {
    alignItems: 'flex-start',
    paddingLeft: APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  },
  audience: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: composerSpace.chipRadius,
    borderWidth: StyleSheet.hairlineWidth,
  },
  audienceLabel: {
    ...composerType.caption,
    fontWeight: '600',
  },
  sheet: {
    paddingHorizontal: composerSpace.lg,
    paddingTop: composerSpace.sm,
    paddingBottom: composerSpace.xxl,
    gap: composerSpace.xs,
  },
  audienceModal: {
    minHeight: 240,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    marginBottom: composerSpace.md,
  },
  sheetTitle: {
    ...composerType.title,
    fontSize: 18,
    marginBottom: composerSpace.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerSpace.sm,
    paddingHorizontal: composerSpace.sm,
    paddingVertical: composerSpace.sm,
    borderRadius: composerSpace.md,
    borderWidth: StyleSheet.hairlineWidth,
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
