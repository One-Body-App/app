import React from 'react';
import renderer, { act } from 'react-test-renderer';

import TrendingTopicsBubbles, {
  getTopicMetrics,
  getTopicScale,
  getTopicTier,
  mapTrendingTopicResponse,
  TAP_ANIMATION_DURATION_MS,
  TRENDING_TOPICS_MOCK_DATA,
} from '../TrendingTopicsBubbles';

describe('TrendingTopicsBubbles', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('maps trending topic API responses into weighted topic props', () => {
    expect(
      mapTrendingTopicResponse([
        { _id: 'interest-1', name: 'Prayer Requests', popularity: 18 },
        { _id: 'interest-2', title: 'Bible Study', popularity: 9 },
        { _id: 'interest-3', name: 'Fallback Topic' },
      ])
    ).toEqual([
      { id: 'interest-1', topic: 'Prayer Requests', popularity: 18 },
      { id: 'interest-2', topic: 'Bible Study', popularity: 9 },
      { id: 'interest-3', topic: 'Fallback Topic', popularity: 1 },
    ]);
  });

  it('assigns each tier at the configured popularity thresholds', () => {
    expect(getTopicTier(10, 10, 110)).toBe(1);
    expect(getTopicTier(35, 10, 110)).toBe(2);
    expect(getTopicTier(70, 10, 110)).toBe(3);
    expect(getTopicTier(100, 10, 110)).toBe(4);
  });

  it('falls back to tier 1 when all popularity values are equal', () => {
    expect(getTopicTier(25, 25, 25)).toBe(1);
  });

  it('caps the largest pill metrics at 1.3x of the base size', () => {
    expect(getTopicScale(4)).toBe(1.3);
    expect(getTopicMetrics(4).fontSize).toBe(14 * 1.3);
    expect(getTopicMetrics(4).paddingHorizontal).toBe(12 * 1.3);
  });

  it('delays onTopicPress until the tap animation completes', () => {
    const onTopicPress = jest.fn();
    let tree: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <TrendingTopicsBubbles
          topics={TRENDING_TOPICS_MOCK_DATA.slice(0, 2)}
          onTopicPress={onTopicPress}
        />
      );
    });

    const pressable = tree!.root.findByProps({
      testID: 'trending-topic-pressable-prayer-requests',
    });

    act(() => {
      pressable.props.onPressIn();
      pressable.props.onPress();
    });

    expect(onTopicPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(TAP_ANIMATION_DURATION_MS - 1);
    });

    expect(onTopicPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(onTopicPress).toHaveBeenCalledWith('Prayer Requests');

    act(() => {
      tree!.unmount();
    });
  });
});
