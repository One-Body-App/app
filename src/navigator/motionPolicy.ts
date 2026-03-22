import { Platform } from 'react-native';

export type RootTabSceneMotionMode = 'full' | 'lite' | 'off';
export type SpringboardPreset = 'full' | 'lite' | 'off';
export type TabRootMotionTarget = 'home' | 'explore' | 'connect' | 'messages';

export const ROOT_TAB_SCENE_MOTION_MODE: RootTabSceneMotionMode =
  Platform.OS === 'android' ? 'lite' : 'full';

const ANDROID_TAB_ROOT_SPRINGBOARD_PRESETS: Record<TabRootMotionTarget, SpringboardPreset> = {
  home: 'off',
  explore: 'off',
  connect: 'off',
  messages: 'off',
};

export function getTabRootSpringboardPreset(target: TabRootMotionTarget): SpringboardPreset {
  if (Platform.OS !== 'android') {
    return 'full';
  }

  return ANDROID_TAB_ROOT_SPRINGBOARD_PRESETS[target];
}

export const SHOULD_RUN_HOME_FEED_INTRO = Platform.OS !== 'android';

export const HOME_FEED_LIST_BATCH_CONFIG =
  Platform.OS === 'android'
    ? {
        initialNumToRender: 4,
        maxToRenderPerBatch: 6,
        windowSize: 6,
      }
    : {
        initialNumToRender: 6,
        maxToRenderPerBatch: 8,
        windowSize: 8,
      };

export const STANDARD_STACK_ANIMATION_OPTIONS =
  Platform.OS === 'android'
    ? {
        animation: 'slide_from_right' as const,
      }
    : {
        animation: 'slide_from_right' as const,
        animationDuration: 750,
      };
