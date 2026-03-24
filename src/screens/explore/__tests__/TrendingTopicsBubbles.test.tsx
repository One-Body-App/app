import React from 'react';
import renderer, { act } from 'react-test-renderer';

import TrendingTopicsBubbles, {
  TRENDING_TOPICS_MOCK_DATA,
  getBubbleRadius,
  mapTrendingTopicResponse,
  shouldHandleBubblePress,
} from '../TrendingTopicsBubbles';

jest.mock('react-native-reanimated', () => {
  const Reanimated = jest.requireActual('react-native-reanimated/mock');

  Reanimated.default.call = () => {};
  Reanimated.runOnJS = (fn: (...args: unknown[]) => unknown) => fn;

  return Reanimated;
});

jest.mock('d3-force', () => {
  const chain = {
    alpha: jest.fn().mockReturnThis(),
    alphaDecay: jest.fn().mockReturnThis(),
    alphaTarget: jest.fn().mockReturnThis(),
    velocityDecay: jest.fn().mockReturnThis(),
    force: jest.fn().mockReturnThis(),
    restart: jest.fn().mockReturnThis(),
    stop: jest.fn(),
    on: jest.fn().mockReturnThis(),
  };

  return {
    forceSimulation: jest.fn(() => chain),
    forceCollide: jest.fn(() => ({ strength: jest.fn().mockReturnThis() })),
    forceManyBody: jest.fn(() => ({ strength: jest.fn().mockReturnThis() })),
    forceX: jest.fn(() => ({ strength: jest.fn().mockReturnThis() })),
    forceY: jest.fn(() => ({ strength: jest.fn().mockReturnThis() })),
  };
});

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

describe('TrendingTopicsBubbles', () => {
  it('maps larger popularity scores to larger bubble radii', () => {
    expect(getBubbleRadius(90, 10, 90)).toBeGreaterThan(getBubbleRadius(10, 10, 90));
  });

  it('maps trending topic API responses into bubble props', () => {
    expect(
      mapTrendingTopicResponse([
        { _id: 'interest-1', name: 'Prayer Requests', popularity: 18 },
        { _id: 'interest-2', title: 'Bible Study', popularity: 9 },
      ])
    ).toEqual([
      { id: 'interest-1', topic: 'Prayer Requests', popularity: 18 },
      { id: 'interest-2', topic: 'Bible Study', popularity: 9 },
    ]);
  });

  it('calls onTopicPress for a bubble tap', () => {
    const onTopicPress = jest.fn();
    let tree: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <TrendingTopicsBubbles
          topics={TRENDING_TOPICS_MOCK_DATA.slice(0, 2)}
          onTopicPress={onTopicPress}
          height={280}
        />
      );
    });

    const pressable = tree!.root.findByProps({
      testID: 'trending-topic-pressable-prayer-requests',
    });

    act(() => {
      pressable.props.onPress();
    });

    expect(onTopicPress).toHaveBeenCalledWith('Prayer Requests');

    act(() => {
      tree!.unmount();
    });
  });

  it('suppresses taps immediately after a drag interaction', () => {
    expect(shouldHandleBubblePress(Date.now() + 100)).toBe(false);
    expect(shouldHandleBubblePress(Date.now() - 100)).toBe(true);
    expect(shouldHandleBubblePress(undefined)).toBe(true);
  });
});
