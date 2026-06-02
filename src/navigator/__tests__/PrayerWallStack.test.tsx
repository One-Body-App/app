import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockSetTabBarTranslateY = jest.fn();
const mockHideTabBar = jest.fn();
const mockResetTabBar = jest.fn();
let latestFocusCleanup: undefined | (() => void);
const recordedScreens: Array<{ name: string; options: any }> = [];

jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: { children?: React.ReactNode }) => children,
    Screen: ({ name, options }: { name: string; options?: any }) => {
      recordedScreens.push({ name, options });
      return null;
    },
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
    hideTabBar: mockHideTabBar,
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
    recordedScreens.length = 0;
    mockHideTabBar.mockClear();
    mockSetTabBarTranslateY.mockClear();
    mockResetTabBar.mockClear();
  });

  it('hides the shared bottom tab bar while the Prayer portal is focused and restores it on cleanup', () => {
    act(() => {
      TestRenderer.create(<PrayerWallStack />);
    });

    expect(mockHideTabBar).toHaveBeenCalledWith('prayer-wall');
    expect(mockSetTabBarTranslateY).toHaveBeenCalledWith(68, 'prayer-wall');

    act(() => {
      latestFocusCleanup?.();
    });

    expect(mockResetTabBar).toHaveBeenCalledWith('prayer-wall');
  });

  it('uses a non-transparent header on the index screen so the top rail is not hidden behind it', () => {
    act(() => {
      TestRenderer.create(<PrayerWallStack />);
    });

    const indexScreen = recordedScreens.find((screen) => screen.name === 'index');
    expect(indexScreen).toBeTruthy();

    const resolvedOptions = indexScreen?.options({
      navigation: {
        canGoBack: () => false,
      },
    });

    expect(resolvedOptions).toEqual(
      expect.objectContaining({
        headerTransparent: false,
        headerBlurEffect: undefined,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#ffffff' },
        contentStyle: { backgroundColor: '#ffffff' },
      })
    );
  });

  it('uses a non-transparent header on the new prayer screen so the form is not hidden behind it', () => {
    act(() => {
      TestRenderer.create(<PrayerWallStack />);
    });

    const prayerScreen = recordedScreens.find((screen) => screen.name === 'Prayer');
    expect(prayerScreen).toBeTruthy();

    const resolvedOptions = prayerScreen?.options({
      route: {
        params: {},
      },
    });

    expect(resolvedOptions).toEqual(
      expect.objectContaining({
        headerShown: true,
        headerTransparent: false,
        headerBlurEffect: undefined,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#ffffff' },
        contentStyle: { backgroundColor: '#ffffff' },
        title: 'Post on Prayer Wall',
      })
    );
  });
});
