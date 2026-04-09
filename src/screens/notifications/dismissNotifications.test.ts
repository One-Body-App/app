import { CommonActions } from '@react-navigation/native';
import { cleanupNotificationsDismissal, closeNotifications } from './dismissNotifications';

describe('dismissNotifications', () => {
  it('clears the HomeTab pending params, restores the tab bar, and goes back', () => {
    const dispatch = jest.fn();
    const goBack = jest.fn();
    const setTabBarTranslateY = jest.fn();
    const resetTabBar = jest.fn();

    closeNotifications({
      navigation: {
        canGoBack: () => true,
        getParent: () => ({
          dispatch,
          getState: () => ({
            index: 0,
            routes: [{ key: 'home-tab-key' }],
          }),
        }),
        goBack,
      },
      tabBarAnimation: {
        resetTabBar,
        setTabBarTranslateY,
      },
    });

    expect(setTabBarTranslateY).toHaveBeenCalledWith(0);
    expect(resetTabBar).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      ...CommonActions.setParams({ screen: 'Home', params: undefined }),
      source: 'home-tab-key',
    });
    expect(goBack).toHaveBeenCalled();
  });

  it('runs the same cleanup on blur/unmount without calling goBack', () => {
    const dispatch = jest.fn();
    const goBack = jest.fn();
    const setTabBarTranslateY = jest.fn();
    const resetTabBar = jest.fn();

    cleanupNotificationsDismissal({
      navigation: {
        getParent: () => ({
          dispatch,
          getState: () => ({
            index: 0,
            routes: [{ key: 'home-tab-key' }],
          }),
        }),
        goBack,
      },
      tabBarAnimation: {
        resetTabBar,
        setTabBarTranslateY,
      },
    });

    expect(setTabBarTranslateY).toHaveBeenCalledWith(0);
    expect(resetTabBar).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      ...CommonActions.setParams({ screen: 'Home', params: undefined }),
      source: 'home-tab-key',
    });
    expect(goBack).not.toHaveBeenCalled();
  });
});
