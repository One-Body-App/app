import DeviceInfo from 'react-native-device-info';
import { PopperDirection } from 'react-native-fiesta';

export type FiestaEmojiEvent = {
  emojis?: string[];
  theme?: string[];
  direction?: PopperDirection;
  source?: 'watch' | 'feed' | 'comment' | 'system';
};

type FiestaSubscriber = (event: FiestaEmojiEvent) => void;

type FiestaQueueConfig = {
  maxQueueSize: number;
  minIntervalMs: number;
};

const defaultFiestaQueueConfig: FiestaQueueConfig = {
  maxQueueSize: 24,
  minIntervalMs: 280,
};

let fiestaQueueConfig: FiestaQueueConfig = { ...defaultFiestaQueueConfig };
let queue: FiestaEmojiEvent[] = [];
const subscribers = new Set<FiestaSubscriber>();
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let lastDispatchAt = 0;

const clearFlushTimeout = () => {
  if (!flushTimeout) {
    return;
  }
  clearTimeout(flushTimeout);
  flushTimeout = null;
};

const scheduleFlush = () => {
  clearFlushTimeout();
  if (queue.length === 0 || subscribers.size === 0) {
    return;
  }

  const elapsed = Date.now() - lastDispatchAt;
  const delay = Math.max(0, fiestaQueueConfig.minIntervalMs - elapsed);
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    const next = queue.shift();
    if (!next) {
      return;
    }

    lastDispatchAt = Date.now();
    subscribers.forEach((subscriber) => {
      subscriber(next);
    });

    if (queue.length > 0) {
      scheduleFlush();
    }
  }, delay);
};

export const configureFiestaQueue = (partialConfig: Partial<FiestaQueueConfig>) => {
  fiestaQueueConfig = {
    ...fiestaQueueConfig,
    ...partialConfig,
  };
};

export const initializeFiestaQueueForDevice = async () => {
  try {
    const totalMemoryBytes = await DeviceInfo.getTotalMemory();
    const isLowMemoryDevice = totalMemoryBytes <= 3 * 1024 * 1024 * 1024;
    configureFiestaQueue({
      maxQueueSize: isLowMemoryDevice ? 12 : defaultFiestaQueueConfig.maxQueueSize,
      minIntervalMs: isLowMemoryDevice ? 520 : defaultFiestaQueueConfig.minIntervalMs,
    });
  } catch (error) {
    configureFiestaQueue(defaultFiestaQueueConfig);
  }
};

export const enqueueFiestaEmojiEvent = (event: FiestaEmojiEvent) => {
  if (queue.length >= fiestaQueueConfig.maxQueueSize) {
    queue = queue.slice(queue.length - fiestaQueueConfig.maxQueueSize + 1);
  }
  queue.push(event);
  scheduleFlush();
};

export const subscribeFiestaEmojiQueue = (subscriber: FiestaSubscriber) => {
  subscribers.add(subscriber);
  scheduleFlush();
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      clearFlushTimeout();
      queue = [];
    }
  };
};

export const clearFiestaEmojiQueue = () => {
  queue = [];
  clearFlushTimeout();
};

export { PopperDirection };
