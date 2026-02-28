import {
  isSameIdentitySequence,
  reorderFeedEntriesForRefresh,
  shouldSkipRefreshTrigger,
} from '../feedRefreshUtils';

describe('feedRefreshUtils', () => {
  it('detects identical and different identity sequences', () => {
    expect(isSameIdentitySequence(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
    expect(isSameIdentitySequence(['a', 'b', 'c'], ['a', 'c', 'b'])).toBe(false);
    expect(isSameIdentitySequence(['a'], ['a', 'b'])).toBe(false);
  });

  it('reorders entries deterministically for a seed', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const reordered = reorderFeedEntriesForRefresh(input, 12345);
    const reorderedAgain = reorderFeedEntriesForRefresh(input, 12345);

    expect(reordered).toEqual(reorderedAgain);
    expect(reordered).toHaveLength(input.length);
    expect(new Set(reordered)).toEqual(new Set(input));
    expect(reordered).not.toEqual(input);
  });

  it('keeps empty and single-item lists stable', () => {
    expect(reorderFeedEntriesForRefresh([], 99)).toEqual([]);
    expect(reorderFeedEntriesForRefresh(['only'], 99)).toEqual(['only']);
  });

  it('skips duplicate or in-flight refresh triggers', () => {
    const now = Date.now();
    expect(
      shouldSkipRefreshTrigger({
        now,
        reason: 'manual_pull',
        feedType: 'foryou',
        lastTrigger: null,
        inFlightFeedType: null,
      })
    ).toBe(false);

    expect(
      shouldSkipRefreshTrigger({
        now,
        reason: 'manual_pull',
        feedType: 'foryou',
        lastTrigger: { reason: 'manual_pull', feedType: 'foryou', at: now - 200 },
        inFlightFeedType: null,
      })
    ).toBe(true);

    expect(
      shouldSkipRefreshTrigger({
        now,
        reason: 'route_refresh',
        feedType: 'foryou',
        lastTrigger: { reason: 'manual_pull', feedType: 'foryou', at: now - 200 },
        inFlightFeedType: 'foryou',
      })
    ).toBe(true);
  });
});
