import { Colors } from '@/src/styles';

export const MENTION_BRAND_COLOR = Colors.primary.brand;

const hasRoute = (navigation: any, routeName: string) => {
  try {
    return Boolean(navigation?.getState?.()?.routeNames?.includes(routeName));
  } catch {
    return false;
  }
};

export const navigateToMentionProfile = (navigation: any, handle: string) => {
  const normalizedHandle = String(handle || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();
  if (!normalizedHandle || !navigation) {
    return;
  }

  let currentNavigation = navigation;
  while (currentNavigation) {
    if (hasRoute(currentNavigation, 'UserProfile')) {
      currentNavigation.navigate('UserProfile', { handle: normalizedHandle });
      return;
    }
    currentNavigation = currentNavigation.getParent?.();
  }

  navigation.navigate('MainRoot', {
    screen: 'Main',
    params: {
      screen: 'HomeTab',
      params: {
        screen: 'UserProfile',
        params: {
          handle: normalizedHandle,
        },
      },
    },
  });
};
