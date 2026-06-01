import { useCallback, useRef } from 'react';

import useMountEffect from '@/src/hooks/useMountEffect';
import { cleanupNotificationsDismissal, closeNotifications } from './dismissNotifications';

type NotificationsNavigation = {
  addListener?: (
    eventName: 'beforeRemove',
    listener: () => void
  ) => void | (() => void) | { remove?: () => void };
  canGoBack?: () => boolean;
  goBack?: () => void;
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
  const navigationRef = useRef(navigation);
  const tabBarAnimationRef = useRef(tabBarAnimation);
  const hasHandledDismissalRef = useRef(false);
  const runDismissalCleanupRef = useRef<() => void>(() => undefined);
  navigationRef.current = navigation;
  tabBarAnimationRef.current = tabBarAnimation;

  const runDismissalCleanup = useCallback(() => {
    if (hasHandledDismissalRef.current) {
      return;
    }

    hasHandledDismissalRef.current = true;
    cleanupNotificationsDismissal({
      navigation: navigationRef.current,
      tabBarAnimation: tabBarAnimationRef.current,
    });
  }, []);
  runDismissalCleanupRef.current = runDismissalCleanup;

  const handleCloseNotifications = useCallback(() => {
    hasHandledDismissalRef.current = true;
    closeNotifications({
      navigation: navigationRef.current,
      tabBarAnimation: tabBarAnimationRef.current,
    });
  }, []);

  useMountEffect(() => {
    hasHandledDismissalRef.current = false;

    if (!navigationRef.current.addListener) {
      return undefined;
    }

    const subscription = navigationRef.current.addListener('beforeRemove', () => {
      runDismissalCleanupRef.current();
    });

    return () => {
      if (typeof subscription === 'function') {
        subscription();
        return;
      }

      subscription?.remove?.();
    };
  });

  return handleCloseNotifications;
}
