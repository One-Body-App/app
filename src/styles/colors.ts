import { useTheme } from '@react-navigation/native';

import React from 'react';
import { Appearance, useColorScheme } from 'react-native';

type ColorVariants = 'brand' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

const isDarkMode = () => {
  const colorScheme = Appearance.getColorScheme();

  return colorScheme == 'dark';
};

export const primary: Record<ColorVariants, string> = {
  get brand() {
    const dark = isDarkMode();
    return dark ? '' : '#032F3C';
  },
  get 200() {
    const dark = isDarkMode();

    return dark ? '' : '#355963';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '' : '#4F6D77';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '' : '#68828A';
  },
  get 500() {
    const dark = isDarkMode();

    return dark ? '' : '#81979E';
  },
  get 600() {
    const dark = isDarkMode();

    return dark ? '' : '#9AACB1';
  },
  get 700() {
    const dark = isDarkMode();

    return dark ? '' : '#B3C1C5';
  },
  get 800() {
    const dark = isDarkMode();

    return dark ? '' : '#CDD5D8';
  },
  get 900() {
    const dark = isDarkMode();

    return dark ? '' : '#E6EAEC';
  },
};

export const primarySapphire: Record<ColorVariants, string> = {
  get brand() {
    const dark = isDarkMode();

    return dark ? '' : '#126B87';
  },

  get 200() {
    const dark = isDarkMode();

    return dark ? '' : '#41899F';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '' : '#5997AB';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '' : '#71A6B7';
  },
  get 500() {
    const dark = isDarkMode();

    return dark ? '' : '#89B5C3';
  },
  get 600() {
    const dark = isDarkMode();

    return dark ? '' : '#A0C4CF';
  },
  get 700() {
    const dark = isDarkMode();

    return dark ? '' : '#B8D3DB';
  },
  get 800() {
    const dark = isDarkMode();

    return dark ? '' : '#D0E1E7';
  },
  get 900() {
    const dark = isDarkMode();

    return dark ? '' : '#E7F0F3';
  },
};

export const secondary: Record<ColorVariants, string> = {
  get brand() {
    const dark = isDarkMode();

    return dark ? '' : '#12D2D9';
  },
  get 200() {
    const dark = isDarkMode();

    return dark ? '' : '#41DBE1';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '' : '#59E0E4';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '' : '#71E4E8';
  },
  get 500() {
    const dark = isDarkMode();

    return dark ? '' : '#89E9EC';
  },
  get 600() {
    const dark = isDarkMode();

    return dark ? '' : '#A0EDF0';
  },
  get 700() {
    const dark = isDarkMode();

    return dark ? '' : '#B8F2F4';
  },
  get 800() {
    const dark = isDarkMode();

    return dark ? '' : '#D0F6F7';
  },
  get 900() {
    const dark = isDarkMode();

    return dark ? '' : '#E7FBFB';
  },
};

export const neutral: Record<ColorVariants, string> = {
  get brand() {
    const dark = isDarkMode();

    return dark ? '' : '#212121';
  },

  get 200() {
    const dark = isDarkMode();

    return dark ? '' : '#313332';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '' : '#5A5C5B';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '' : '#838584';
  },
  get 500() {
    const dark = isDarkMode();

    return dark ? '' : '#999DA1';
  },
  get 600() {
    const dark = isDarkMode();

    return dark ? '' : '#D6D6D6';
  },
  get 700() {
    const dark = isDarkMode();

    return dark ? '' : '#F7F7F7';
  },
  get 800() {
    const dark = isDarkMode();

    return dark ? '' : '#F2F3F3';
  },
  get 900() {
    const dark = isDarkMode();

    return dark ? '' : '#F1F1F1';
  },
};

type FeedBackColor = 'background' | '200' | '300' | '400' | 'text';

export const errorFeedback: Record<FeedBackColor, string> = {
  get background() {
    const dark = isDarkMode();

    return dark ? '' : '#DC2C10';
  },

  get 200() {
    const dark = isDarkMode();

    return dark ? '' : '#E35640';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '' : '#EE9688';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '' : '#F8D5CF';
  },

  get text() {
    const dark = isDarkMode();

    return dark ? '' : '#FCEAE7';
  },
};

export const successFeedback: Record<FeedBackColor, string> = {
  get background() {
    const dark = isDarkMode();

    return dark ? '' : '#EDFFF9';
  },

  get 200() {
    const dark = isDarkMode();

    return dark ? '' : '#12AC7B';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '' : '#2DD59F';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '' : '#8FFFDB';
  },

  get text() {
    const dark = isDarkMode();

    return dark ? '' : '#008359';
  },
};

export const warningFeedback: Record<FeedBackColor, string> = {
  get background() {
    const dark = isDarkMode();

    return dark ? '' : '#D96A00';
  },

  get 200() {
    const dark = isDarkMode();

    return dark ? '' : '#FF8816';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '' : '#FF9D40';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '' : '#FFC894';
  },

  get text() {
    const dark = isDarkMode();

    return dark ? '' : '#FFF3E7';
  },
};

export const infoFeedback: Record<FeedBackColor, string> = {
  get background() {
    const dark = isDarkMode();

    return dark ? '' : '#0066D8';
  },

  get 200() {
    const dark = isDarkMode();

    return dark ? '' : '#1684FF';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '' : '#409AFF';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '' : '#94C6FF';
  },

  get text() {
    const dark = isDarkMode();

    return dark ? '' : '#E7F2FF';
  },
};
