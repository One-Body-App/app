import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockUseTabBarAnimation = jest.fn(() => ({
  tabBarTranslateY: 0,
}));

jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('@react-navigation/bottom-tabs', () => {
  const ReactLocal = require('react');

  return {
    BottomTabBar: (props: Record<string, unknown>) =>
      ReactLocal.createElement('MockBottomTabBar', props),
    createBottomTabNavigator: jest.fn(() => ({
      Navigator: 'Navigator',
      Screen: 'Screen',
    })),
  };
});

jest.mock('@react-navigation/native', () => ({
  getFocusedRouteNameFromRoute: jest.fn(() => undefined),
  useFocusEffect: jest.fn(),
  useTheme: jest.fn(() => ({
    dark: false,
    colors: {
      background: '#ffffff',
      text: '#111111',
    },
  })),
}));

jest.mock('../HomeStack', () => 'HomeStack');
jest.mock('../ExploreStack', () => 'ExploreStack');
jest.mock('../ProfileStack', () => 'ProfileStack');
jest.mock('../ConnectStack', () => 'ConnectStack');
jest.mock('../MessagesStack', () => 'MessagesStack');
jest.mock('../homeTabRouteVisibility', () => ({
  getHomeTabVisibilityState: jest.fn(() => ({
    focusedRouteName: 'Home',
    selectedTab: 'foryou',
    shouldHideTabBar: false,
  })),
}));
jest.mock('../TabBarAnimationContext', () => ({
  TabBarAnimationProvider: ({ children }: { children: React.ReactNode }) => children,
  useTabBarAnimation: () => mockUseTabBarAnimation(),
}));
jest.mock('../RootTabTransitionContext', () => ({
  RootTabTransitionProvider: ({ children }: { children: React.ReactNode }) => children,
  useRootTabTransition: jest.fn(() => ({
    reportActiveTab: jest.fn(),
  })),
}));
jest.mock('../motionPolicy', () => ({
  ROOT_TAB_SCENE_MOTION_MODE: 'off',
}));
jest.mock('../rootTabTransition', () => ({
  getRootTabTransitionDirection: jest.fn(() => 'none'),
  isAnimatedRootTabName: jest.fn(() => true),
}));
jest.mock('../../screens/home', () => ({
  FeedTypes: {
    ForYou: 'foryou',
    Pray: 'pray',
  },
}));
jest.mock('@/assets/icons/connect.svg', () => 'ConnectIcon');
jest.mock('@/assets/icons/home2.svg', () => 'Home2Icon');
jest.mock('@/assets/icons/messages.svg', () => 'MessagesIcon');
jest.mock('@/src/services/chat/unreadIndicator', () => ({
  useChatUnreadCount: jest.fn(() => 0),
}));
jest.mock('@/utils/ResponsiveFun', () => ({
  getHeight: jest.fn(() => 56),
}));

import { AnimatedTabBar } from '../BottomTabStack';
import { shouldHideActiveTabBarWrapper } from '../activeTabBarVisibility';

const buildProps = (
  tabBarStyle?: Record<string, unknown>,
  parentRouteName: string = 'Main'
) =>
  ({
    state: {
      index: 0,
      routes: [{ key: 'home-key', name: 'HomeTab' }],
    },
    descriptors: {
      'home-key': {
        options: {
          tabBarStyle,
        },
      },
    },
    navigation: {
      getParent: () => ({
        getState: () => ({
          index: 0,
          routes: [{ name: parentRouteName }],
        }),
      }),
    },
    insets: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  }) as any;

describe('BottomTabStack', () => {
  beforeEach(() => {
    mockUseTabBarAnimation.mockClear();
  });

  it('detects a hidden active tab-bar descriptor', () => {
    expect(
      shouldHideActiveTabBarWrapper(buildProps({ display: 'none', height: 0 }))
    ).toBe(true);
  });

  it('keeps the wrapper visible for normal active tab-bar styles', () => {
    expect(
      shouldHideActiveTabBarWrapper(buildProps({ height: 84, opacity: 1 }))
    ).toBe(false);
  });

  it('does not render the animated wrapper when the active descriptor is hidden', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <AnimatedTabBar {...buildProps({ display: 'none', height: 0 })} />
      );
    });

    expect(renderer!.toJSON()).toBeNull();
  });

  it('does not render the bottom tab bar when the parent drawer route is PrayerWall', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<AnimatedTabBar {...buildProps({ height: 84 }, 'PrayerWall')} />);
    });

    expect(renderer!.toJSON()).toBeNull();
  });

  it('renders the bottom tab bar when the active descriptor is visible', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <AnimatedTabBar {...buildProps({ height: 84, opacity: 1 })} />
      );
    });

    expect(renderer!.root.findByType('MockBottomTabBar')).toBeTruthy();
  });
});
