import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockSetTabBarTranslateY = jest.fn();
const mockResetTabBar = jest.fn();
let latestFocusCleanup: undefined | (() => void);

jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: { children?: React.ReactNode }) => children,
    Screen: () => null,
  })),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((effect: () => void | (() => void)) => {
    latestFocusCleanup = effect() || undefined;
  }),
  useNavigation: jest.fn(() => ({
    canGoBack: jest.fn(() => true),
    goBack: jest.fn(),
  })),
  useTheme: jest.fn(() => ({
    dark: false,
    colors: {
      background: '#ffffff',
      text: '#111111',
    },
  })),
}));

jest.mock('@react-navigation/elements', () => ({
  HeaderBackButton: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    right: 0,
    bottom: 12,
    left: 0,
  })),
}));

jest.mock('@/utils/ResponsiveFun', () => ({
  getHeight: jest.fn(() => 56),
}));

jest.mock('../TabBarAnimationContext', () => ({
  useTabBarAnimation: jest.fn(() => ({
    setTabBarTranslateY: mockSetTabBarTranslateY,
    resetTabBar: mockResetTabBar,
  })),
}));

jest.mock('../../screens/main/prayer', () => 'PrayerScreen');
jest.mock('../../screens/main/userProfile', () => 'UserProfileScreen');
jest.mock('../../screens/main/prayer/NewPrayer', () => 'NewPrayerScreen');
jest.mock('../../screens/main/prayer/Single', () => 'SinglePrayerScreen');
jest.mock('../../components/HeaderGradientOverlay', () => 'HeaderGradientOverlay');
jest.mock('../global', () => jest.fn(() => ({ headerLeft: undefined })));

import PrayerWallStack from '../PrayerWallStack';

describe('PrayerWallStack', () => {
  beforeEach(() => {
    latestFocusCleanup = undefined;
    mockSetTabBarTranslateY.mockClear();
    mockResetTabBar.mockClear();
  });

  it('hides the shared bottom tab bar while the Prayer portal is focused and restores it on cleanup', () => {
    act(() => {
      TestRenderer.create(<PrayerWallStack />);
    });

    expect(mockSetTabBarTranslateY).toHaveBeenCalledWith(68);

    act(() => {
      latestFocusCleanup?.();
    });

    expect(mockResetTabBar).toHaveBeenCalledTimes(1);
  });
});
