import { cleanupNotificationsDismissal, closeNotifications } from './dismissNotifications';

describe('dismissNotifications', () => {
  it('restores the tab bar and goes back without rewriting HomeTab params', () => {
    const goBack = jest.fn();
    const setTabBarTranslateY = jest.fn();
    const resetTabBar = jest.fn();

    closeNotifications({
      navigation: {
        canGoBack: () => true,
        goBack,
      },
      tabBarAnimation: {
        resetTabBar,
        setTabBarTranslateY,
      },
    });

    expect(setTabBarTranslateY).toHaveBeenCalledWith(0);
    expect(resetTabBar).toHaveBeenCalled();
    expect(goBack).toHaveBeenCalled();
  });

  it('runs the same tab bar cleanup on blur/unmount without calling goBack', () => {
    const goBack = jest.fn();
    const setTabBarTranslateY = jest.fn();
    const resetTabBar = jest.fn();

    cleanupNotificationsDismissal({
      navigation: {
        goBack,
      },
      tabBarAnimation: {
        resetTabBar,
        setTabBarTranslateY,
      },
    });

    expect(setTabBarTranslateY).toHaveBeenCalledWith(0);
    expect(resetTabBar).toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
  });
});
