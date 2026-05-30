import { Appearance } from 'react-native';

type ColorVariants = 'brand' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

const isDarkMode = () => {
  const colorScheme = Appearance.getColorScheme();

  return colorScheme === 'dark';
};

export const containFrame = 'rgba(18, 107, 135, 0.3)';
export const rssContainFrame = 'rgba(205, 213, 216, 0.3)';

export const primary: Record<ColorVariants, string> = {
  get brand() {
    const dark = isDarkMode();
    return dark ? '#126B87' : '#032F3C';
  },
  get 200() {
    const dark = isDarkMode();

    return dark ? '#355963' : '#355963';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '#4F6D77' : '#4F6D77';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '#68828A' : '#68828A';
  },
  get 500() {
    const dark = isDarkMode();

    return dark ? '#81979E' : '#81979E';
  },
  get 600() {
    const dark = isDarkMode();

    return dark ? '#9AACB1' : '#9AACB1';
  },
  get 700() {
    const dark = isDarkMode();

    return dark ? '#B3C1C5' : '#B3C1C5';
  },
  get 800() {
    const dark = isDarkMode();

    return dark ? '#323D40' : '#CDD5D8';
  },
  get 900() {
    const dark = isDarkMode();

    return dark ? '#E6EAEC' : '#E6EAEC';
  },
};

export const primarySapphire: Record<ColorVariants, string> = {
  get brand() {
    const dark = isDarkMode();

    return dark ? '#126B87' : '#126B87';
  },

  get 200() {
    const dark = isDarkMode();

    return dark ? '#41899F' : '#41899F';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '#5997AB' : '#5997AB';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '#71A6B7' : '#71A6B7';
  },
  get 500() {
    const dark = isDarkMode();

    return dark ? '#89B5C3' : '#89B5C3';
  },
  get 600() {
    const dark = isDarkMode();

    return dark ? '#A0C4CF' : '#A0C4CF';
  },
  get 700() {
    const dark = isDarkMode();

    return dark ? '#B8D3DB' : '#B8D3DB';
  },
  get 800() {
    const dark = isDarkMode();

    return dark ? '#D0E1E7' : '#D0E1E7';
  },
  get 900() {
    const dark = isDarkMode();

    return dark ? '#202328' : '#E7F0F3';
  },
};

export const secondary: Record<ColorVariants, string> = {
  get brand() {
    const dark = isDarkMode();

    return dark ? '#12D2D9' : '#12D2D9';
  },
  get 200() {
    const dark = isDarkMode();

    return dark ? '#41DBE1' : '#41DBE1';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '#59E0E4' : '#59E0E4';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '#71E4E8' : '#71E4E8';
  },
  get 500() {
    const dark = isDarkMode();

    return dark ? '#89E9EC' : '#89E9EC';
  },
  get 600() {
    const dark = isDarkMode();

    return dark ? '#A0EDF0' : '#A0EDF0';
  },
  get 700() {
    const dark = isDarkMode();

    return dark ? '#B8F2F4' : '#B8F2F4';
  },
  get 800() {
    const dark = isDarkMode();

    return dark ? '#D0F6F7' : '#D0F6F7';
  },
  get 900() {
    const dark = isDarkMode();

    return dark ? '#E7FBFB' : '#E7FBFB';
  },
};

export const neutral: Record<ColorVariants, string> = {
  get brand() {
    const dark = isDarkMode();

    return dark ? '#FFF' : '#212121';
  },

  get 200() {
    const dark = isDarkMode();

    return dark ? '#CCCECD' : '#313332';
  },
  get 300() {
    const dark = isDarkMode();

    return dark ? '#999DA1' : '#5A5C5B';
  },
  get 400() {
    const dark = isDarkMode();

    return dark ? '#99A1A0' : '#838584';
  },
  get 500() {
    const dark = isDarkMode();

    return dark ? '#9A99A1' : '#999DA1';
  },
  get 600() {
    const dark = isDarkMode();

    return dark ? '#585859' : '#D6D6D6';
  },
  get 700() {
    const dark = isDarkMode();

    return dark ? '#202328' : '#F7F7F7';
  },
  get 800() {
    const dark = isDarkMode();

    return dark ? '#212121' : '#F2F3F3';
  },
  get 900() {
    const dark = isDarkMode();

    return dark ? '#191919' : '#F1F1F1';
  },
};

type FeedBackColor = 'background' | '200' | '300' | '400' | 'text';

export const errorFeedback: Record<FeedBackColor, string> = {
  get background() {
    return '#DC2C10';
  },

  get 200() {
    return '#E35640';
  },
  get 300() {
    return '#EE9688';
  },
  get 400() {
    return '#F8D5CF';
  },

  get text() {
    return '#FCEAE7';
  },
};

export const successFeedback: Record<FeedBackColor, string> = {
  get background() {
    return '#EDFFF9';
  },

  get 200() {
    return '#12AC7B';
  },
  get 300() {
    return '#2DD59F';
  },
  get 400() {
    return '#8FFFDB';
  },

  get text() {
    return '#008359';
  },
};

export const warningFeedback: Record<FeedBackColor, string> = {
  get background() {
    return '#D96A00';
  },

  get 200() {
    return '#FF8816';
  },
  get 300() {
    return '#FF9D40';
  },
  get 400() {
    return '#FFC894';
  },

  get text() {
    return '#FFF3E7';
  },
};

export const infoFeedback: Record<FeedBackColor, string> = {
  get background() {
    return '#0066D8';
  },

  get 200() {
    return '#1684FF';
  },
  get 300() {
    return '#409AFF';
  },
  get 400() {
    return '#94C6FF';
  },

  get text() {
    return '#E7F2FF';
  },
};

export const main = {
  get white() {
    const dark = isDarkMode();

    return dark ? '#0D0D0D' : 'white';
  },

  get black() {
    const dark = isDarkMode();

    return dark ? 'white' : 'black';
  },
};
