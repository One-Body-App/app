import { Easing } from 'react-native-reanimated';

// The cinema easing matches the web's WatchLightbox + FeedVideoCard so the same
// quality of motion carries across surfaces.
export const composerEasings = {
  cinema: Easing.bezier(0.16, 1, 0.3, 1),
  cinemaIn: Easing.bezier(0.32, 0, 0.67, 0),
  swift: Easing.bezier(0.4, 0, 0.2, 1),
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const composerDurations = {
  // Chrome (header, lectern, preview peek).
  enter: 360,
  exit: 240,
  // Smaller affordances (chips, ratio toggles).
  chip: 180,
  pulse: 1200,
  // Media canvas swipe between items.
  pager: 280,
};

export const composerStagger = {
  // Matches the web Watch card stagger so a multi-photo entry feels related.
  stepMs: 45,
  // Cap so a 20-photo paste doesn't sit waiting for half a second.
  maxSteps: 8,
};

// Returns an animation delay (ms) for the nth element entering the stage.
export const composerStaggerDelay = (index: number): number => {
  const clamped = Math.max(0, Math.min(composerStagger.maxSteps, index));
  return clamped * composerStagger.stepMs;
};

// Spring config tuned for the lectern collapse/expand. Lower stiffness gives
// the "drape" feel of a heavy frosted card settling into place.
export const composerLecternSpring = {
  damping: 28,
  mass: 0.9,
  stiffness: 220,
  overshootClamping: false,
  restDisplacementThreshold: 0.2,
  restSpeedThreshold: 0.2,
};

// Spring for moderation chips: a quick "subtitle" snap-in then settle.
export const composerChipSpring = {
  damping: 18,
  mass: 0.6,
  stiffness: 280,
  overshootClamping: false,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 0.1,
};
