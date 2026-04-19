import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Animated } from 'react-native';

jest.mock('react-native-tab-view', () => {
  const ReactLocal = require('react');

  return {
    TabView: ({ navigationState, renderScene, renderTabBar }: any) =>
      ReactLocal.createElement(
        ReactLocal.Fragment,
        null,
        renderTabBar ? renderTabBar({ navigationState }) : null,
        renderScene({ route: navigationState.routes[navigationState.index] })
      ),
  };
});

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((effect: () => void | (() => void)) => {
    const ReactLocal = require('react');
    ReactLocal.useEffect(() => effect(), [effect]);
  }),
  useTheme: jest.fn(() => ({
    dark: false,
    colors: {
      background: '#ffffff',
      text: '#111111',
    },
  })),
}));

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: jest.fn(() => 96),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    right: 0,
    bottom: 0,
    left: 0,
  })),
}));

jest.mock('@/components/GlassTabBar', () => {
  const ReactLocal = require('react');

  return function MockGlassTabBar(props: any) {
    return ReactLocal.createElement('GlassTabBar', props);
  };
});

jest.mock('@/components/prayerWallComponent', () => {
  const ReactLocal = require('react');

  return function MockPrayerWallComponent(props: any) {
    return ReactLocal.createElement('PrayerWallComponent', props);
  };
});

jest.mock('@/components/prayerWallTestimoniesComponent', () => {
  const ReactLocal = require('react');

  return function MockPrayerWallTestimoniesComponent(props: any) {
    return ReactLocal.createElement('PrayerWallTestimoniesComponent', props);
  };
});

jest.mock('@/components/prayerWallSavedPrayersComponent', () => {
  const ReactLocal = require('react');

  return function MockPrayerWallSavedPrayersComponent(props: any) {
    return ReactLocal.createElement('PrayerWallSavedPrayersComponent', props);
  };
});

jest.mock('@/components/prayerWallMyPrayersComponent', () => {
  const ReactLocal = require('react');

  return function MockPrayerWallMyPrayersComponent(props: any) {
    return ReactLocal.createElement('PrayerWallMyPrayersComponent', props);
  };
});

jest.mock('@/components/styled/Text', () => {
  const ReactLocal = require('react');

  return function MockStyledText(props: any) {
    return ReactLocal.createElement('StyledText', props, props.children);
  };
});

import Prayer from '..';

describe('Prayer hub', () => {
  const navigation = {
    navigate: jest.fn(),
  } as any;

  beforeAll(() => {
    jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (callback?: (result: { finished: boolean }) => void) => {
            callback?.({ finished: true });
          },
          stop: jest.fn(),
          reset: jest.fn(),
        }) as any
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    navigation.navigate.mockClear();
  });

  it('renders the GlassTabBar initially and keeps the rail visible before Wall user scrolling starts', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<Prayer navigation={navigation} route={{ key: 'index' } as any} />);
    });

    expect(renderer!.root.findByType('GlassTabBar')).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'prayer-subtab-rail' }).props.pointerEvents).toBe(
      'auto'
    );

    const wall = renderer!.root.findByType('PrayerWallComponent');

    act(() => {
      wall.props.onScrollOffsetChange(120);
    });

    expect(renderer!.root.findByProps({ testID: 'prayer-subtab-rail' }).props.pointerEvents).toBe(
      'auto'
    );
    expect(
      renderer!.root.findByProps({ testID: 'prayer-subtab-restore-rail' }).props.pointerEvents
    ).toBe('none');
  });

  it('hides and restores the rail only from Wall scrolling, and keeps non-Wall tabs visible', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<Prayer navigation={navigation} route={{ key: 'index' } as any} />);
    });

    const wall = renderer!.root.findByType('PrayerWallComponent');

    act(() => {
      wall.props.onUserScrollStart();
    });

    act(() => {
      wall.props.onScrollOffsetChange(120);
    });

    act(() => {
      wall.props.onScrollOffsetChange(80);
    });

    expect(renderer!.root.findByProps({ testID: 'prayer-subtab-rail' }).props.pointerEvents).toBe(
      'none'
    );
    expect(
      renderer!.root.findByProps({ testID: 'prayer-subtab-restore-rail' }).props.pointerEvents
    ).toBe('auto');

    const glassTabBar = renderer!.root.findByType('GlassTabBar');

    act(() => {
      glassTabBar.props.onTabChange(1);
    });

    expect(renderer!.root.findByProps({ testID: 'prayer-subtab-rail' }).props.pointerEvents).toBe(
      'auto'
    );
    expect(
      renderer!.root.findByProps({ testID: 'prayer-subtab-restore-rail' }).props.pointerEvents
    ).toBe('none');

    const testimonies = renderer!.root.findByType('PrayerWallTestimoniesComponent');
    expect(testimonies.props.onScrollOffsetChange).toBeUndefined();
  });
});
