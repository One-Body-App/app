type ColorVariants = 'brand' | '200' | '300' | '400' | '500' | '600' | '700' | '800';

export const primary: Record<ColorVariants, string> = {
  brand: '#032F3C',

  200: '#355963',
  300: '#4F6D77',
  400: '#68828A',
  500: '#81979E',
  600: '#9AACB1',
  700: '#B3C1C5',
  800: '#CDD5D8',
};

export const primarySapphire: Record<ColorVariants, string> = {
  brand: '#126B87',

  200: '#41899F',
  300: '#5997AB',
  400: '#71A6B7',
  500: '#89B5C3',
  600: '#A0C4CF',
  700: '#B8D3DB',
  800: '#D0E1E7',
};

export const secondary: Record<ColorVariants, string> = {
  brand: '#12D2D9',

  200: '#41DBE1',
  300: '#59E0E4',
  400: '#71E4E8',
  500: '#89E9EC',
  600: '#A0EDF0',
  700: '#B8F2F4',
  800: '#FFFFFF',
};

export const neutral: Record<ColorVariants, string> = {
  brand: '#313332',

  200: '#5A5C5B',
  300: '#838584',
  400: '#999DA1',
  500: '#D6D6D6',
  600: '#F7F7F7',
  700: '#F2F3F3',
  800: '#F1F1F1',
};

type FeedBackColor = 'background' | '200' | '300' | '400' | 'text';

export const errorFeedback: Record<FeedBackColor, string> = {
  background: '#DC2C10',

  200: '#E35640',
  300: '#EE9688',
  400: '#F8D5CF',

  text: '#FCEAE7',
};

export const successFeedback: Record<FeedBackColor, string> = {
  background: '#EDFFF9',

  200: '#12AC7B',
  300: '#2DD59F',
  400: '#8FFFDB',

  text: '#008359',
};

export const warningFeedback: Record<FeedBackColor, string> = {
  background: '#D96A00',

  200: '#FF8816',
  300: '#FF9D40',
  400: '#FFC894',

  text: '#FFF3E7',
};

export const infoFeedback: Record<FeedBackColor, string> = {
  background: '#0066D8',

  200: '#1684FF',
  300: '#409AFF',
  400: '#94C6FF',

  text: '#E7F2FF',
};
