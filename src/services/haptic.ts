// Using a lazy import pattern to avoid initialization issues and keep startup fast
// This service can be imported and used anywhere in the app

export type HapticType =
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'rigid'
  | 'soft'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError'
  // Android only below this line
  | 'clockTick'
  | 'contextClick'
  | 'keyboardPress'
  | 'keyboardRelease'
  | 'keyboardTap'
  | 'longPress'
  | 'textHandleMove'
  | 'virtualKey'
  | 'virtualKeyRelease'
  | 'effectClick'
  | 'effectDoubleClick'
  | 'effectHeavyClick'
  | 'effectTick';

export interface HapticOptions {
  enableVibrateFallback?: boolean;
  ignoreAndroidSystemSettings?: boolean;
}

const defaultHapticOptions: HapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

let cachedHapticModulePromise: Promise<typeof import('react-native-haptic-feedback')> | null = null;

const loadHapticModule = () => {
  if (!cachedHapticModulePromise) {
    cachedHapticModulePromise = import('react-native-haptic-feedback');
  }
  return cachedHapticModulePromise;
};

/**
 * Triggers a haptic feedback vibration.
 * Safe to call even if the native module is not linked (it will catch errors).
 *
 * @param type - The type of haptic feedback to trigger (default: 'impactMedium')
 * @param options - Optional configuration to override defaults
 */
export const triggerHaptic = (type: HapticType = 'impactMedium', options?: HapticOptions) => {
  loadHapticModule()
    .then((module) => {
      const hapticModule = module.default || module;
      const finalOptions = { ...defaultHapticOptions, ...options };

      hapticModule.trigger(type, finalOptions);
    })
    .catch((error) => {
      console.warn('[HapticService] Failed to trigger haptic feedback:', error);
    });
};

export const HapticService = {
  trigger: triggerHaptic,
};
