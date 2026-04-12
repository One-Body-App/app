import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { cleanupNotificationsDismissal, closeNotifications } from './dismissNotifications';

type NotificationsNavigation = Parameters<typeof cleanupNotificationsDismissal>[0]['navigation'];
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
  tabBarAnimationRef.current = tabBarAnimation;

  const runDismissalCleanup = useCallback(() => {
    cleanupNotificationsDismissal({
      navigation,
      tabBarAnimation: tabBarAnimationRef.current,
    });
  }, [navigation]);

  const handleCloseNotifications = useCallback(() => {
    closeNotifications({
      navigation,
      tabBarAnimation: tabBarAnimationRef.current,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        runDismissalCleanup();
      };
    }, [runDismissalCleanup])
  );

  return handleCloseNotifications;
}
