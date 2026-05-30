import React from 'react';
import { View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ConnectRetractableSearchBar } from '../shared';

jest.mock('@react-navigation/native', () => ({
  DrawerActions: {
    toggleDrawer: jest.fn(),
  },
  useNavigation: jest.fn(() => ({
    dispatch: jest.fn(),
  })),
  useTheme: jest.fn(() => ({
    dark: false,
    colors: {
      background: '#ffffff',
      card: '#ffffff',
    },
  })),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

/* eslint-disable global-require */
jest.mock('@react-native-community/blur', () => ({
  BlurView: ({ children, ...props }: any) => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    return ReactLocal.createElement(MockView, props, children);
  },
}));

jest.mock('react-native-linear-gradient', () => {
  return ({ children, ...props }: any) => {
    const ReactLocal = require('react');
    const { View: MockView } = require('react-native');
    return ReactLocal.createElement(MockView, props, children);
  };
});

jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcons');
jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialCommunityIcons');
jest.mock('@/assets/svg/Network-Pin--Streamline-Ultimate.svg', () => 'NetworkPinIcon');
jest.mock(
  '@/assets/svg/Filter-Sort-Lines-Descending--Streamline-Ultimate.svg',
  () => 'FilterSortIcon'
);
jest.mock('@/assets/svg/Business-User-Curriculum--Streamline-Core.svg', () => {
  const ReactLocal = require('react');
  const { View: MockView } = require('react-native');
  return function BusinessUserCurriculumIcon(props: any) {
    return ReactLocal.createElement(MockView, props);
  };
});
jest.mock('@/assets/svg/Calendar-Edit--Streamline-Core-Remix.svg', () => {
  const ReactLocal = require('react');
  const { View: MockView } = require('react-native');
  return function CalendarEditIcon(props: any) {
    return ReactLocal.createElement(MockView, props);
  };
});
jest.mock('@/components/styled/Text', () => 'StyledText');
jest.mock('@/components/CustomModal', () => 'CustomModal');

describe('ConnectRetractableSearchBar', () => {
  it('does not render the tertiary action when not provided', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ConnectRetractableSearchBar searchText="" onSearchChange={jest.fn()} />
      );
    });

    expect(
      renderer!.root.findAllByProps({ testID: 'connect-retractable-tertiary-action' })
    ).toHaveLength(0);
  });

  it('renders and triggers the tertiary action alongside search and add actions', () => {
    const onTertiaryPress = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ConnectRetractableSearchBar
          searchText=""
          onSearchChange={jest.fn()}
          tertiaryAction={{
            icon: 'serveManager',
            accessibilityLabel: 'Open serve manager',
            onPress: onTertiaryPress,
          }}
          onAddPress={jest.fn()}
        />
      );
    });

    const actionTestIds = Array.from(
      new Set(
        renderer!.root
          .findAll((node) => typeof node.props.testID === 'string')
          .map((node) => node.props.testID)
      )
    );

    expect(
      renderer!.root.findByProps({ testID: 'connect-retractable-search-action' })
    ).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'connect-retractable-add-action' })).toBeTruthy();
    expect(
      renderer!.root.findByProps({ testID: 'connect-retractable-tertiary-action' })
    ).toBeTruthy();
    expect(actionTestIds).toEqual([
      'connect-retractable-search-action',
      'connect-retractable-add-action',
      'connect-retractable-tertiary-action',
    ]);

    act(() => {
      renderer!.root.findByProps({ testID: 'connect-retractable-tertiary-action' }).props.onPress();
    });

    expect(onTertiaryPress).toHaveBeenCalledTimes(1);
  });

  it('renders the event manager tertiary action variant', () => {
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ConnectRetractableSearchBar
          searchText=""
          onSearchChange={jest.fn()}
          tertiaryAction={{
            icon: 'eventManager',
            accessibilityLabel: 'Open event management',
            onPress: jest.fn(),
          }}
        />
      );
    });

    expect(
      renderer!.root.findByProps({ testID: 'connect-retractable-tertiary-action' })
    ).toBeTruthy();
  });
});
