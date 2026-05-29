import { Platform } from 'react-native';
import * as Colors from '@/src/styles/colors';

export type ComposerPaletteScheme = 'dark' | 'light';

export type ComposerPalette = {
  scheme: ComposerPaletteScheme;
  // Stage surfaces.
  stage: string;
  stageVignette: string;
  stageHighlight: string;
  // Glass cards used by the lectern, header and chips.
  glass: string;
  glassBorder: string;
  glassElevated: string;
  // Text.
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverted: string;
  // Brand accents (mirrors the web composer ribbon).
  accent: string;
  accentSoft: string;
  ribbonStart: string;
  ribbonEnd: string;
  // Moderation status tones.
  moderationSafe: string;
  moderationUnsure: string;
  moderationBlocked: string;
  moderationSafeBg: string;
  moderationUnsureBg: string;
  moderationBlockedBg: string;
  // Misc.
  shadow: string;
  overlay: string;
};

export const DARK_COMPOSER_PALETTE: ComposerPalette = {
  scheme: 'dark',
  stage: '#000000',
  stageVignette: 'rgba(0, 0, 21, 0.85)',
  stageHighlight: 'rgba(18, 210, 217, 0.06)',
  glass: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassElevated: 'rgba(255, 255, 255, 0.12)',
  textPrimary: '#f6f6f7',
  textSecondary: '#b3c1c5',
  textMuted: 'rgba(246, 246, 247, 0.55)',
  textInverted: '#000000',
  accent: '#12D2D9',
  accentSoft: '#41899F',
  ribbonStart: '#12D2D9',
  ribbonEnd: '#126B87',
  moderationSafe: '#12D2D9',
  moderationUnsure: '#F59E0B',
  moderationBlocked: '#FF6B6B',
  moderationSafeBg: 'rgba(18, 210, 217, 0.14)',
  moderationUnsureBg: 'rgba(245, 158, 11, 0.16)',
  moderationBlockedBg: 'rgba(255, 107, 107, 0.16)',
  shadow: 'rgba(0, 0, 0, 0.45)',
  overlay: 'rgba(0, 0, 0, 0.50)',
};

export const LIGHT_COMPOSER_PALETTE: ComposerPalette = {
  scheme: 'light',
  stage: '#fafaf7',
  stageVignette: 'rgba(20, 32, 48, 0.06)',
  stageHighlight: 'rgba(18, 107, 135, 0.04)',
  glass: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(3, 47, 60, 0.08)',
  glassElevated: 'rgba(255, 255, 255, 0.94)',
  textPrimary: '#032f3c',
  textSecondary: '#355963',
  textMuted: '#68828a',
  textInverted: '#ffffff',
  accent: '#126B87',
  accentSoft: '#41899F',
  ribbonStart: '#12D2D9',
  ribbonEnd: '#126B87',
  moderationSafe: '#0E8D92',
  moderationUnsure: '#B45309',
  moderationBlocked: '#B91C1C',
  moderationSafeBg: 'rgba(18, 210, 217, 0.10)',
  moderationUnsureBg: 'rgba(245, 158, 11, 0.10)',
  moderationBlockedBg: 'rgba(220, 44, 16, 0.08)',
  shadow: 'rgba(3, 47, 60, 0.12)',
  overlay: 'rgba(3, 47, 60, 0.35)',
};

export const resolveComposerPalette = (scheme: ComposerPaletteScheme): ComposerPalette =>
  scheme === 'dark' ? DARK_COMPOSER_PALETTE : LIGHT_COMPOSER_PALETTE;

// Type ladder. Display font pairs with the existing OpenSans body.
// Display is Rubik-Bold (already shipped in app/utils + UploadImage editor).
export const composerFonts = {
  display: Platform.select({ ios: 'Rubik-Bold', android: 'Rubik-Bold', default: 'Rubik-Bold' })!,
  body: Platform.select({
    ios: 'OpenSans-Medium',
    android: 'OpenSans-Medium',
    default: 'OpenSans-Medium',
  })!,
  bodySoft: Platform.select({
    ios: 'OpenSans-Regular',
    android: 'OpenSans-Regular',
    default: 'OpenSans-Regular',
  })!,
};

export const composerType = {
  eyebrow: { fontFamily: composerFonts.body, fontSize: 11, letterSpacing: 1.2 } as const,
  caption: { fontFamily: composerFonts.bodySoft, fontSize: 12, lineHeight: 16 } as const,
  body: { fontFamily: composerFonts.body, fontSize: 15, lineHeight: 22 } as const,
  bodyLarge: { fontFamily: composerFonts.body, fontSize: 17, lineHeight: 24 } as const,
  label: { fontFamily: composerFonts.display, fontSize: 14, letterSpacing: 0.4 } as const,
  title: { fontFamily: composerFonts.display, fontSize: 22, letterSpacing: -0.2 } as const,
  display: { fontFamily: composerFonts.display, fontSize: 28, letterSpacing: -0.3 } as const,
};

// Spatial scale tuned for the cinematic surface. Sits beside the global
// `spacing` scale but uses semantic names since the composer breaks the
// regular layout grid.
export const composerSpace = {
  hairline: 1,
  micro: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  gutter: 16,
  edge: 20,
  // Lectern dimensions.
  lecternCollapsedHeight: 72,
  lecternExpandedHeight: 296,
  lecternRadius: 28,
  // Chip / pill geometry.
  chipRadius: 999,
  chipPaddingH: 12,
  chipPaddingV: 6,
  // Header.
  headerHeight: 56,
  ribbonHeight: 1,
};

// Brand reference for places that legitimately need the underlying tokens
// (e.g. for a button shared with the rest of the app).
export const composerBrand = {
  aqua: '#12D2D9',
  sapphireDeep: '#032F3C',
  sapphire: '#126B87',
  // Surfaces the existing global token system already exposes - reach for
  // these via Colors.* in app code, the proxy here is only for the composer's
  // local theming utilities.
  Colors,
};
