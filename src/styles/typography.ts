import { TextStyle, Platform, PixelRatio } from 'react-native';
import { systemWeights } from 'react-native-typography';

type FontSize = 'x092' | 'x1' | 'x2' | 'x3' | 'x4' | 'x5' | 'x6' | 'x7';
export const fontSize: Record<FontSize, TextStyle> = {
  x092: {
    fontSize: PixelRatio.getFontScale() * 11,
  },
  x1: {
    fontSize: PixelRatio.getFontScale() * 12,
  },
  x2: {
    fontSize: PixelRatio.getFontScale() * 14,
  },
  x3: {
    fontSize: PixelRatio.getFontScale() * 16,
  },
  x4: {
    fontSize: PixelRatio.getFontScale() * 18,
  },
  x5: {
    fontSize: PixelRatio.getFontScale() * 20,
  },
  x6: {
    fontSize: PixelRatio.getFontScale() * 24,
  },
  x7: {
    fontSize: PixelRatio.getFontScale() * 32,
  },
};

type FontWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
const safeSystemWeights = systemWeights ?? {
  light: { fontWeight: '300' },
  regular: { fontWeight: '400' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
};

export const fontWeight: Record<FontWeight, TextStyle> = {
  light: safeSystemWeights.light,
  regular: safeSystemWeights.regular,
  medium: {
    fontWeight: '500',
  },
  semibold: safeSystemWeights.semibold,
  bold: safeSystemWeights.bold,
};

// type LetterSpacing = 'x30' | 'x40';
// export const letterSpacing: Record<LetterSpacing, number> = {
//   x30: 2,
//   x40: 3,
// };

const openSansFontFamily = Platform.select({
  ios: 'OpenSans-Regular',
  android: 'OpenSans-Regular',
});

const defaultFontFamily = openSansFontFamily;

const rubikFontFamily = Platform.select({
  ios: 'Rubik-Medium',
  android: 'Rubik-Medium',
});

type LineHeight = 'x1' | 'x2' | 'x3' | 'x4' | 'x5' | 'x6' | 'x7';
export const lineHeight: Record<LineHeight, TextStyle> = {
  x1: {
    lineHeight: 18,
  },
  x2: {
    lineHeight: 21,
  },
  x3: {
    lineHeight: 24,
  },
  x4: {
    lineHeight: 27,
  },
  x5: {
    lineHeight: 30,
  },
  x6: {
    lineHeight: 32,
  },
  x7: {
    lineHeight: 36,
  },
};

type Header = 'h1' | 'h2' | 'h3' | 'h4';
export const header: Record<Header, TextStyle> = {
  h1: {
    ...fontSize.x6,
    ...lineHeight.x6,
    ...fontWeight.medium,
    fontFamily: rubikFontFamily,
  },
  h2: {
    ...fontSize.x5,
    ...lineHeight.x5,
    ...fontWeight.medium,
    fontFamily: rubikFontFamily,
  },
  h3: {
    ...fontSize.x4,
    ...lineHeight.x4,
    ...fontWeight.medium,
    fontFamily: rubikFontFamily,
  },
  h4: {
    ...fontSize.x3,
    ...lineHeight.x3,
    ...fontWeight.medium,
    fontFamily: rubikFontFamily,
  },
};

type Subheader = 'R' | 'M';
export const subheader: Record<Subheader, TextStyle> = {
  R: {
    ...fontSize.x2,
    ...lineHeight.x2,
    ...fontWeight.regular,
    fontFamily: defaultFontFamily,
  },
  M: {
    ...fontSize.x2,
    ...lineHeight.x2,
    ...fontWeight.medium,
    fontFamily: defaultFontFamily,
  },
};

type Body =
  | 'x1'
  | 'x1M'
  | 'x2'
  | 'x2M'
  | 'x3'
  | 'x3M'
  | 'x4'
  | 'x4M'
  | 'x5'
  | 'x5M'
  | 'x6'
  | 'x6M'
  | 'x7'
  | 'x7M';
export const body: Record<Body, TextStyle> = {
  x1: {
    ...fontSize.x1,
    ...lineHeight.x1,
    ...fontWeight.regular,
    fontFamily: defaultFontFamily,
  },
  x1M: {
    ...fontSize.x1,
    ...lineHeight.x1,
    ...fontWeight.medium,
    fontFamily: defaultFontFamily,
  },
  x2: {
    ...fontSize.x2,
    ...lineHeight.x2,
    ...fontWeight.regular,
    fontFamily: defaultFontFamily,
  },
  x2M: {
    ...fontSize.x2,
    ...lineHeight.x2,
    ...fontWeight.medium,
    fontFamily: defaultFontFamily,
  },
  x3: {
    ...fontSize.x3,
    ...lineHeight.x3,
    ...fontWeight.regular,
    fontFamily: defaultFontFamily,
  },
  x3M: {
    ...fontSize.x3,
    ...lineHeight.x3,
    ...fontWeight.medium,
    fontFamily: defaultFontFamily,
  },
  x4: {
    ...fontSize.x4,
    ...lineHeight.x4,
    ...fontWeight.regular,
    fontFamily: defaultFontFamily,
  },
  x4M: {
    ...fontSize.x4,
    ...lineHeight.x4,
    ...fontWeight.medium,
    fontFamily: defaultFontFamily,
  },
  x5: {
    ...fontSize.x5,
    ...lineHeight.x5,
    ...fontWeight.regular,
    fontFamily: defaultFontFamily,
  },
  x5M: {
    ...fontSize.x5,
    ...lineHeight.x5,
    ...fontWeight.medium,
    fontFamily: defaultFontFamily,
  },
  x6: {
    ...fontSize.x6,
    ...lineHeight.x6,
    ...fontWeight.regular,
    fontFamily: defaultFontFamily,
  },
  x6M: {
    ...fontSize.x6,
    ...lineHeight.x6,
    ...fontWeight.medium,
    fontFamily: defaultFontFamily,
  },
  x7: {
    ...fontSize.x7,
    ...lineHeight.x7,
    ...fontWeight.regular,
    fontFamily: defaultFontFamily,
  },
  x7M: {
    ...fontSize.x7,
    ...lineHeight.x7,
    ...fontWeight.medium,
    fontFamily: defaultFontFamily,
  },
};

type OpenSans = 'base';
export const openSans: Record<OpenSans, TextStyle> = {
  base: body.x2,
};
