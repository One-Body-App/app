import { useCallback, useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';

// Thresholds tuned to favor scroll intent and avoid accidental taps during drag/deceleration.
const DEFAULT_TOUCH_SLOP_PX = 8;
const DEFAULT_PRESS_DELAY_MS = 120;
const DEFAULT_SETTLE_DELAY_MS = 80;

type GestureIntent = 'tap' | 'scroll' | null;

type GestureState = {
  startX: number;
  startY: number;
  startTime: number;
  intent: GestureIntent;
  moved: boolean;
  allowTap: boolean;
  pressDelayPassed: boolean;
  timer?: ReturnType<typeof setTimeout> | null;
};

type PressHandlerOptions = {
  onPress?: (event?: GestureResponderEvent) => void;
  onPressIn?: (event?: GestureResponderEvent) => void;
  onPressOut?: (event?: GestureResponderEvent) => void;
};

export type ScrollIntentLock = {
  isScrolling: boolean;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: () => void;
  bindCardGestureHandlers: (
    key: string,
    options?: PressHandlerOptions
  ) => {
    onTouchStart: (event: GestureResponderEvent) => void;
    onTouchMove: (event: GestureResponderEvent) => void;
    onTouchEnd: (event: GestureResponderEvent) => void;
    onTouchCancel: (event: GestureResponderEvent) => void;
    onPressIn?: (event: GestureResponderEvent) => void;
    onPressOut?: (event: GestureResponderEvent) => void;
    onPress?: (event: GestureResponderEvent) => void;
  };
};

type ScrollIntentConfig = {
  touchSlopPx?: number;
  pressDelayMs?: number;
  settleDelayMs?: number;
};

const createGestureState = (): GestureState => ({
  startX: 0,
  startY: 0,
  startTime: 0,
  intent: null,
  moved: false,
  allowTap: false,
  pressDelayPassed: false,
  timer: null,
});

const clearGestureTimer = (timer?: ReturnType<typeof setTimeout> | null) => {
  if (timer) {
    clearTimeout(timer);
  }
};

export default function useScrollIntentLock(config?: ScrollIntentConfig): ScrollIntentLock {
  const touchSlopPx = config?.touchSlopPx ?? DEFAULT_TOUCH_SLOP_PX;
  const pressDelayMs = config?.pressDelayMs ?? DEFAULT_PRESS_DELAY_MS;
  const settleDelayMs = config?.settleDelayMs ?? DEFAULT_SETTLE_DELAY_MS;

  const [isScrolling, setIsScrolling] = useState(false);
  const isScrollingRef = useRef(isScrolling);
  const gestureStatesRef = useRef<Map<string, GestureState>>(new Map());
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setScrolling = useCallback((value: boolean) => {
    if (isScrollingRef.current === value) return;
    isScrollingRef.current = value;
    setIsScrolling(value);
  }, []);

  const cancelScrollEndTimer = useCallback(() => {
    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
  }, []);

  const scheduleScrollEnd = useCallback(() => {
    cancelScrollEndTimer();
    scrollEndTimerRef.current = setTimeout(() => {
      setScrolling(false);
    }, settleDelayMs);
  }, [cancelScrollEndTimer, settleDelayMs, setScrolling]);

  const markScrollIntent = useCallback(() => {
    cancelScrollEndTimer();
    setScrolling(true);
  }, [cancelScrollEndTimer, setScrolling]);

  const getGestureState = useCallback((key: string) => {
    const existing = gestureStatesRef.current.get(key);
    if (existing) {
      return existing;
    }
    const next = createGestureState();
    gestureStatesRef.current.set(key, next);
    return next;
  }, []);

  const resetGestureState = useCallback((key: string) => {
    const existing = gestureStatesRef.current.get(key);
    if (!existing) return;
    clearGestureTimer(existing.timer);
    existing.timer = null;
    gestureStatesRef.current.delete(key);
  }, []);

  const onScrollBeginDrag = useCallback(() => {
    cancelScrollEndTimer();
    setScrolling(true);
  }, [cancelScrollEndTimer, setScrolling]);

  const onScrollEndDrag = useCallback(() => {
    scheduleScrollEnd();
  }, [scheduleScrollEnd]);

  const onMomentumScrollBegin = useCallback(() => {
    cancelScrollEndTimer();
    setScrolling(true);
  }, [cancelScrollEndTimer, setScrolling]);

  const onMomentumScrollEnd = useCallback(() => {
    scheduleScrollEnd();
  }, [scheduleScrollEnd]);

  const bindCardGestureHandlers = useCallback(
    (key: string, options?: PressHandlerOptions) => {
      const handleTouchStart = (event: GestureResponderEvent) => {
        const state = getGestureState(key);
        clearGestureTimer(state.timer);
        state.timer = null;
        state.startX = event.nativeEvent.pageX;
        state.startY = event.nativeEvent.pageY;
        state.startTime = Date.now();
        state.intent = 'tap';
        state.moved = false;
        state.allowTap = false;
        state.pressDelayPassed = false;
        state.timer = setTimeout(() => {
          state.pressDelayPassed = true;
        }, pressDelayMs);
      };

      const handleTouchMove = (event: GestureResponderEvent) => {
        const state = getGestureState(key);
        if (!state.intent) {
          return;
        }
        const deltaX = Math.abs(event.nativeEvent.pageX - state.startX);
        const deltaY = Math.abs(event.nativeEvent.pageY - state.startY);
        const exceedsSlop = deltaX > touchSlopPx || deltaY > touchSlopPx;

        if (exceedsSlop) {
          state.moved = true;
          if (state.intent !== 'scroll') {
            // If movement exceeds slop before the delay, treat as scroll intent.
            // We also lock if it happens after the delay to avoid accidental taps.
            state.intent = 'scroll';
            clearGestureTimer(state.timer);
            state.timer = null;
            markScrollIntent();
          }
        }
      };

      const handleTouchEnd = () => {
        const state = getGestureState(key);
        clearGestureTimer(state.timer);
        state.timer = null;
        const elapsed = Date.now() - state.startTime;
        const isTapCandidate =
          state.intent !== 'scroll' &&
          !isScrollingRef.current &&
          (elapsed >= pressDelayMs || (!state.moved && elapsed < pressDelayMs));
        state.allowTap = isTapCandidate;
        scheduleScrollEnd();
      };

      const handleTouchCancel = () => {
        resetGestureState(key);
        scheduleScrollEnd();
      };

      const handlePressIn = (event: GestureResponderEvent) => {
        const state = getGestureState(key);
        if (isScrollingRef.current || state.intent === 'scroll') return;
        options?.onPressIn?.(event);
      };

      const handlePressOut = (event: GestureResponderEvent) => {
        const state = getGestureState(key);
        if (isScrollingRef.current || state.intent === 'scroll') return;
        options?.onPressOut?.(event);
      };

      const handlePress = (event: GestureResponderEvent) => {
        const state = getGestureState(key);
        if (!state.allowTap) {
          resetGestureState(key);
          return;
        }
        options?.onPress?.(event);
        resetGestureState(key);
      };

      return {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchCancel,
        onPressIn: options?.onPressIn ? handlePressIn : undefined,
        onPressOut: options?.onPressOut ? handlePressOut : undefined,
        onPress: options?.onPress ? handlePress : undefined,
      };
    },
    [
      getGestureState,
      markScrollIntent,
      pressDelayMs,
      resetGestureState,
      scheduleScrollEnd,
      touchSlopPx,
    ]
  );

  return {
    isScrolling,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollBegin,
    onMomentumScrollEnd,
    bindCardGestureHandlers,
  };
}
