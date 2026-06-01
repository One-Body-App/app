type NotificationNavigationLike = {
  canGoBack?: () => boolean;
  goBack?: () => void;
};

type TabBarAnimationLike = {
  resetTabBar?: () => void;
  setTabBarTranslateY?: (value: number) => void;
};

export function cleanupNotificationsDismissal({
  tabBarAnimation,
}: {
  navigation?: NotificationNavigationLike;
  tabBarAnimation?: TabBarAnimationLike | null;
}) {
  tabBarAnimation?.setTabBarTranslateY?.(0);
  tabBarAnimation?.resetTabBar?.();
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
