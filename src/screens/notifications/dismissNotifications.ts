import { CommonActions } from '@react-navigation/native';

type HomeTabParams = {
  screen: 'Home';
  params: undefined;
};

type ParentNavigationLike = {
  dispatch?: (action: unknown) => void;
  getState?: () => {
    index: number;
    routes: Array<{ key: string }>;
  };
  setParams?: (params: HomeTabParams) => void;
};

type NotificationNavigationLike = {
  canGoBack?: () => boolean;
  getParent?: () => ParentNavigationLike | undefined;
  goBack?: () => void;
};

type TabBarAnimationLike = {
  resetTabBar?: () => void;
  setTabBarTranslateY?: (value: number) => void;
};

const HOME_TAB_RESET_PARAMS: HomeTabParams = {
  screen: 'Home',
  params: undefined,
};

export function cleanupNotificationsDismissal({
  navigation,
  tabBarAnimation,
}: {
  navigation: NotificationNavigationLike;
  tabBarAnimation?: TabBarAnimationLike | null;
}) {
  const homeTabNavigation = navigation.getParent?.();

  tabBarAnimation?.setTabBarTranslateY?.(0);
  tabBarAnimation?.resetTabBar?.();

  const homeTabState = homeTabNavigation?.getState?.();
  const activeRoute = homeTabState?.routes?.[homeTabState.index];

  if (homeTabNavigation?.dispatch && activeRoute?.key) {
    homeTabNavigation.dispatch({
      ...CommonActions.setParams(HOME_TAB_RESET_PARAMS),
      source: activeRoute.key,
    });
    return;
  }

  homeTabNavigation?.setParams?.(HOME_TAB_RESET_PARAMS);
}

export function closeNotifications({
  navigation,
  tabBarAnimation,
}: {
  navigation: NotificationNavigationLike;
  tabBarAnimation?: TabBarAnimationLike | null;
}) {
  cleanupNotificationsDismissal({ navigation, tabBarAnimation });

  if (navigation.canGoBack?.() === false) {
    return;
  }

  navigation.goBack?.();
}
