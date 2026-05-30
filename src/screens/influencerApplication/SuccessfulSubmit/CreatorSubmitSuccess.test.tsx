/* eslint-disable global-require */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import CreatorSubmitSuccess from './CreatorSubmitSuccess';

let mockLatestFocusEffect: null | (() => void | (() => void)) = null;
let mockLatestFocusCleanup: void | (() => void);

const mockConfettiCannon = jest.fn((props: any) => {
  const ReactLocal = require('react');
  const { View } = require('react-native');

  ReactLocal.useEffect(() => {
    props.onAnimationStart?.();
  }, [props.onAnimationStart]);

  return ReactLocal.createElement(View, {
    testID: 'mock-confetti-cannon',
    confettiProps: props,
  });
});

jest.mock('@react-navigation/native', () => {
  const ReactLocal = jest.requireActual('react');

  return {
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (callback: () => void | (() => void)) => {
      mockLatestFocusEffect = callback;
      ReactLocal.useEffect(() => {
        mockLatestFocusCleanup = callback();

        return () => {
          if (typeof mockLatestFocusCleanup === 'function') {
            mockLatestFocusCleanup();
            mockLatestFocusCleanup = undefined;
          }
        };
      }, [callback]);
    },
  };
});

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');

  return ({ name, testID }: { name?: string; testID?: string }) =>
    ReactLocal.createElement(View, {
      accessibilityLabel: name,
      testID,
    });
});

jest.mock('react-native-confetti-cannon', () => ({
  __esModule: true,
  default: (props: any) => mockConfettiCannon(props),
}));

const navigation = {
  goBack: jest.fn(),
  reset: jest.fn(),
};

const route = {
  key: 'creator-success',
  name: 'CreatorSuccess',
};

const layoutEvent = {
  nativeEvent: {
    layout: {
      x: 100,
      y: 80,
      width: 120,
      height: 120,
    },
  },
};

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const rerunFocusEffect = () => {
  if (!mockLatestFocusEffect) {
    throw new Error('Focus effect callback was not captured.');
  }

  if (typeof mockLatestFocusCleanup === 'function') {
    mockLatestFocusCleanup();
  }

  mockLatestFocusCleanup = mockLatestFocusEffect();
};

describe('CreatorSubmitSuccess', () => {
  let mountedRoot: TestRenderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
    mockConfettiCannon.mockClear();
    navigation.goBack.mockClear();
    navigation.reset.mockClear();
    mockLatestFocusEffect = null;
    mockLatestFocusCleanup = undefined;
  });

  afterEach(() => {
    act(() => {
      if (mountedRoot) {
        mountedRoot.unmount();
        mountedRoot = null;
      } else if (typeof mockLatestFocusCleanup === 'function') {
        mockLatestFocusCleanup();
        mockLatestFocusCleanup = undefined;
      }
    });
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('plays One Body confetti immediately and delays the success mark reveal', async () => {
    let root: TestRenderer.ReactTestRenderer;

    await act(async () => {
      root = TestRenderer.create(
        <CreatorSubmitSuccess navigation={navigation as any} route={route as any} />
      );
    });
    mountedRoot = root!;

    act(() => {
      root!.root.findByProps({ testID: 'creator-success-icon-stage' }).props.onLayout(layoutEvent);
    });

    await flushEffects();

    expect(root!.root.findByProps({ testID: 'creator-success-confetti-host' })).toBeTruthy();
    expect(mockConfettiCannon).toHaveBeenCalledTimes(1);
    expect(mockConfettiCannon.mock.calls[0][0]).toMatchObject({
      autoStart: true,
      count: 90,
      colors: [
        '#032F3C',
        '#126B87',
        '#41899F',
        '#71A6B7',
        '#12D2D9',
        '#41DBE1',
        '#89E9EC',
        '#E6EAEC',
      ],
      explosionSpeed: 350,
      fadeOut: true,
      fallSpeed: 2600,
      origin: { x: 160, y: 140 },
    });
    expect(root!.root.findAllByProps({ testID: 'creator-success-delayed-checkmark' })).toHaveLength(
      0
    );
    expect(root!.root.findAllByProps({ testID: 'creator-success-pulse-rings' })).toHaveLength(0);

    act(() => {
      jest.advanceTimersByTime(449);
    });
    expect(root!.root.findAllByProps({ testID: 'creator-success-delayed-checkmark' })).toHaveLength(
      0
    );

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(root!.root.findByProps({ testID: 'creator-success-delayed-checkmark' })).toBeTruthy();
    expect(root!.root.findByProps({ testID: 'creator-success-pulse-rings' })).toBeTruthy();
  });

  it('resets the delayed mark and retriggers confetti when focus runs again', async () => {
    let root: TestRenderer.ReactTestRenderer;

    await act(async () => {
      root = TestRenderer.create(
        <CreatorSubmitSuccess navigation={navigation as any} route={route as any} />
      );
    });
    mountedRoot = root!;

    act(() => {
      root!.root.findByProps({ testID: 'creator-success-icon-stage' }).props.onLayout(layoutEvent);
    });

    await flushEffects();

    act(() => {
      jest.advanceTimersByTime(450);
    });
    expect(root!.root.findByProps({ testID: 'creator-success-delayed-checkmark' })).toBeTruthy();
    const initialConfettiRenderCount = mockConfettiCannon.mock.calls.length;

    await act(async () => {
      rerunFocusEffect();
      await Promise.resolve();
    });

    expect(root!.root.findAllByProps({ testID: 'creator-success-delayed-checkmark' })).toHaveLength(
      0
    );
    expect(mockConfettiCannon.mock.calls.length).toBeGreaterThan(initialConfettiRenderCount);

    act(() => {
      jest.advanceTimersByTime(450);
    });
    expect(root!.root.findByProps({ testID: 'creator-success-delayed-checkmark' })).toBeTruthy();
  });
});
