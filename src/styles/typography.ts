import { TextStyle, Platform, PixelRatio } from 'react-native';
import { systemWeights } from 'react-native-typography';

type FontSize = 'x1' | 'x2' | 'x3' | 'x4' | 'x5' | 'x6' | 'x7';
export const fontSize: Record<FontSize, TextStyle> = {
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

type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export const fontWeight: Record<FontWeight, TextStyle> = {
  regular: {
    ...systemWeights.regular,
  },
  medium: {
    fontWeight: '400',
  },
  semibold: {
    ...systemWeights.semibold,
  },
  bold: {
    ...systemWeights.bold,
  },
};

// type LetterSpacing = 'x30' | 'x40';
// export const letterSpacing: Record<LetterSpacing, number> = {
//   x30: 2,
//   x40: 3,
// };

const caroFontFamily = Platform.select({
  ios: 'caro',
  android: 'caro',
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
    ...fontSize.x7,
    ...lineHeight.x7,
    ...fontWeight.semibold,
    fontFamily: caroFontFamily,
  },
  h2: {
    ...fontSize.x6,
    ...lineHeight.x6,
    ...fontWeight.semibold,
    fontFamily: caroFontFamily,
  },
  h3: {
    ...fontSize.x5,
    ...lineHeight.x5,
    ...fontWeight.semibold,
    fontFamily: caroFontFamily,
  },
  h4: {
    ...fontSize.x4,
    ...lineHeight.x4,
    ...fontWeight.semibold,
    fontFamily: caroFontFamily,
  },
};

type Subheader = 'R' | 'M';
export const subheader: Record<Subheader, TextStyle> = {
  R: {
    ...fontSize.x2,
    ...lineHeight.x2,
    ...fontWeight.regular,
    fontFamily: caroFontFamily,
  },
  M: {
    ...fontSize.x2,
    ...lineHeight.x2,
    ...fontWeight.medium,
    fontFamily: caroFontFamily,
  },
};

type Body = 'x1' | 'x1M' | 'x2' | 'x2M' | 'x3' | 'x3M' | 'x4';
export const body: Record<Body, TextStyle> = {
  x1: {
    ...fontSize.x1,
    ...lineHeight.x1,
    ...fontWeight.regular,
    fontFamily: caroFontFamily,
  },
  x1M: {
    ...fontSize.x1,
    ...lineHeight.x1,
    ...fontWeight.medium,
    fontFamily: caroFontFamily,
  },
  x2: {
    ...fontSize.x2,
    ...lineHeight.x2,
    ...fontWeight.regular,
    fontFamily: caroFontFamily,
  },
  x2M: {
    ...fontSize.x2,
    ...lineHeight.x2,
    ...fontWeight.medium,
    fontFamily: caroFontFamily,
  },
  x3: {
    ...fontSize.x3,
    ...lineHeight.x3,
    ...fontWeight.regular,
    fontFamily: caroFontFamily,
  },
  x3M: {
    ...fontSize.x3,
    ...lineHeight.x3,
    ...fontWeight.medium,
    fontFamily: caroFontFamily,
  },
  x4: {
    ...fontSize.x4,
    ...lineHeight.x4,
    ...fontWeight.regular,
    fontFamily: caroFontFamily,
  },
};
type Caro = 'base';
export const caro: Record<Caro, TextStyle> = {
  base: {
    fontFamily: caroFontFamily,
  },
};
