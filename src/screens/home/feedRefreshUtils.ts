export const DEFAULT_REFRESH_DEBOUNCE_MS = 600;

export type RefreshTrigger = {
  feedType: string;
  reason: string;
  at: number;
};

const normalizeSeed = (seed: number) => {
  if (!Number.isFinite(seed)) {
    return 1;
  }
  const normalized = Math.abs(Math.floor(seed));
  return normalized === 0 ? 1 : normalized;
};

const createSeededRandom = (seed: number) => {
  let current = normalizeSeed(seed) % 2147483647;
  if (current <= 0) {
    current = 1;
  }

  return () => {
    current = (current * 48271) % 2147483647;
    return current / 2147483647;
  };
};

export const isSameIdentitySequence = (
  previous: readonly string[],
  incoming: readonly string[]
) => {
  if (previous.length !== incoming.length) {
    return false;
  }
  for (let index = 0; index < previous.length; index += 1) {
    if (previous[index] !== incoming[index]) {
      return false;
    }
  }
  return true;
};

export const reorderFeedEntriesForRefresh = <T>(entries: readonly T[], seed: number): T[] => {
  if (entries.length < 2) {
    return [...entries];
  }

  const random = createSeededRandom(seed);
  const decorated = entries.map((entry, index) => ({
    entry,
    index,
    sortWeight: random(),
  }));

  decorated.sort((a, b) => {
    if (a.sortWeight === b.sortWeight) {
      return a.index - b.index;
    }
    return a.sortWeight - b.sortWeight;
  });

  const reordered = decorated.map((item) => item.entry);
  const matchesOriginal =
    reordered.length === entries.length &&
    reordered.every((entry, index) => entry === entries[index]);
  if (!matchesOriginal) {
    return reordered;
  }

  // Deterministically rotate when shuffle keeps original order.
  return [...entries.slice(1), entries[0]];
};

export const shouldSkipRefreshTrigger = ({
  now,
  reason,
  feedType,
  lastTrigger,
  inFlightFeedType,
  debounceMs = DEFAULT_REFRESH_DEBOUNCE_MS,
}: {
  now: number;
  reason: string;
  feedType: string;
  lastTrigger: RefreshTrigger | null;
  inFlightFeedType: string | null;
  debounceMs?: number;
}) => {
  if (inFlightFeedType && inFlightFeedType === feedType) {
    return true;
  }

  if (!lastTrigger) {
    return false;
  }

  if (lastTrigger.feedType !== feedType || lastTrigger.reason !== reason) {
    return false;
  }

  return now - lastTrigger.at < debounceMs;
};
