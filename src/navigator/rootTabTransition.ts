export const ANIMATED_ROOT_TABS = ['HomeTab', 'ExploreTab', 'ConnectTab', 'Messages'] as const;

export type AnimatedRootTabName = (typeof ANIMATED_ROOT_TABS)[number];

export type RootTabTransitionDirection = 'left' | 'right' | 'none';

export type RootTabTransitionPayload = {
  fromTab: AnimatedRootTabName;
  toTab: AnimatedRootTabName;
  direction: RootTabTransitionDirection;
  token: number;
};

const ROOT_TAB_INDEX_BY_NAME: Record<AnimatedRootTabName, number> = {
  HomeTab: 0,
  ExploreTab: 1,
  ConnectTab: 2,
  Messages: 3,
};

export function isAnimatedRootTabName(
  value: string | null | undefined
): value is AnimatedRootTabName {
  return ANIMATED_ROOT_TABS.includes(value as AnimatedRootTabName);
}

export function getRootTabTransitionDirection(
  fromTab: string | null | undefined,
  toTab: string | null | undefined
): RootTabTransitionDirection {
  if (!isAnimatedRootTabName(fromTab) || !isAnimatedRootTabName(toTab) || fromTab === toTab) {
    return 'none';
  }

  return ROOT_TAB_INDEX_BY_NAME[toTab] > ROOT_TAB_INDEX_BY_NAME[fromTab] ? 'left' : 'right';
}
