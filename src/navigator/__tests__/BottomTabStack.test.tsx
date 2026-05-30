import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const mockUseTabBarAnimation = jest.fn(() => ({
  hiddenOwnerId: undefined,
  tabBarTranslateY: 0,
}));
const mockUseIsFocused = jest.fn(() => true);
const mockUseNavigation = jest.fn(() => ({
  getState: () => ({
    index: 0,
    routes: [{ name: 'Main' }],
  }),
  addListener: jest.fn(() => jest.fn()),
}));

jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })),
}));

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
  useIsFocused: () => mockUseIsFocused(),
  useNavigation: () => mockUseNavigation(),
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

import BottomTabStack, { AnimatedTabBar } from '../BottomTabStack';
import { shouldHideActiveTabBarWrapper } from '../activeTabBarVisibility';

const buildProps = (tabBarStyle?: Record<string, unknown>) =>
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
      getParent: () => undefined,
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
    mockUseIsFocused.mockReset();
    mockUseNavigation.mockReset();
    mockUseIsFocused.mockReturnValue(true);
    mockUseNavigation.mockReturnValue({
      getState: () => ({
        index: 0,
        routes: [{ name: 'Main' }],
      }),
      addListener: jest.fn(() => jest.fn()),
    });
    mockUseTabBarAnimation.mockImplementation(() => ({
      hiddenOwnerId: undefined,
      tabBarTranslateY: 0,
    }));
  });

  it('supplies the bottom tab bar when the main drawer screen is focused', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<BottomTabStack />);
    });

    const navigator = renderer!.root.findByType('Navigator');

    expect(navigator.props.tabBar(buildProps({ height: 84 }))).toBeTruthy();
  });

  it('supplies no bottom tab bar when the main drawer screen is unfocused', () => {
    mockUseIsFocused.mockReturnValue(false);
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<BottomTabStack />);
    });

    const navigator = renderer!.root.findByType('Navigator');

    expect(navigator.props.tabBar(buildProps({ height: 84 }))).toBeNull();
  });

  it('supplies no bottom tab bar when the active drawer route is not Main', () => {
    mockUseNavigation.mockReturnValue({
      getState: () => ({
        index: 0,
        routes: [{ name: 'Connections' }],
      }),
      addListener: jest.fn(() => jest.fn()),
    });
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<BottomTabStack />);
    });

    const navigator = renderer!.root.findByType('Navigator');

    expect(navigator.props.tabBar(buildProps({ height: 84 }))).toBeNull();
  });

  it('supplies no bottom tab bar when the shared tab bar is explicitly hidden', () => {
    mockUseTabBarAnimation.mockImplementation(() => ({
      hiddenOwnerId: 'prayer-wall',
      tabBarTranslateY: 0,
    }));
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<BottomTabStack />);
    });

    const navigator = renderer!.root.findByType('Navigator');

    expect(navigator.props.tabBar(buildProps({ height: 84 }))).toBeNull();
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
