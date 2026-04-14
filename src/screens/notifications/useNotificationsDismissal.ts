import { useCallback, useEffect, useRef } from 'react';

import { cleanupNotificationsDismissal, closeNotifications } from './dismissNotifications';

type NotificationsNavigation = Parameters<typeof cleanupNotificationsDismissal>[0]['navigation'] & {
  addListener?: (
    eventName: 'beforeRemove',
    listener: () => void
  ) => void | (() => void) | { remove?: () => void };
};
type NotificationsTabBarAnimation = Parameters<
  typeof cleanupNotificationsDismissal
>[0]['tabBarAnimation'];

export function useNotificationsDismissal({
  navigation,
  tabBarAnimation,
}: {
  navigation: NotificationsNavigation;
  tabBarAnimation: NotificationsTabBarAnimation;
}) {
  const tabBarAnimationRef = useRef(tabBarAnimation);
  const hasHandledDismissalRef = useRef(false);
  tabBarAnimationRef.current = tabBarAnimation;

  const runDismissalCleanup = useCallback(() => {
    if (hasHandledDismissalRef.current) {
      return;
    }

    hasHandledDismissalRef.current = true;
    cleanupNotificationsDismissal({
      navigation,
      tabBarAnimation: tabBarAnimationRef.current,
    });
  }, [navigation]);

  const handleCloseNotifications = useCallback(() => {
    hasHandledDismissalRef.current = true;
    closeNotifications({
      navigation,
      tabBarAnimation: tabBarAnimationRef.current,
    });
  }, [navigation]);

  useEffect(() => {
    hasHandledDismissalRef.current = false;

    const subscription = navigation.addListener?.('beforeRemove', runDismissalCleanup);

    return () => {
      if (typeof subscription === 'function') {
        subscription();
        return;
      }

      subscription?.remove?.();
    };
  }, [navigation, runDismissalCleanup]);

  return handleCloseNotifications;
}
