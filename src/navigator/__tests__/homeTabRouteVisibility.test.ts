import getHomeTabFocusedRouteName, { getHomeTabVisibilityState } from '../homeTabRouteVisibility';

describe('getHomeTabFocusedRouteName', () => {
  it('hides the tab bar when notifications is the active nested route', () => {
    const visibilityState = getHomeTabVisibilityState({
      name: 'HomeTab',
      params: { screen: 'Home' },
      state: {
        index: 1,
        routes: [{ name: 'Home' }, { name: 'Notifications' }],
      },
    });

    expect(visibilityState.focusedRouteName).toBe('Notifications');
    expect(visibilityState.shouldHideTabBar).toBe(true);
  });

  it('hides the tab bar when pray is the active home feed', () => {
    const visibilityState = getHomeTabVisibilityState({
      name: 'HomeTab',
      params: { screen: 'Home' },
      state: {
        index: 0,
        routes: [{ name: 'Home', params: { selectedTab: 'pray' } }],
      },
    });

    expect(visibilityState.focusedRouteName).toBe('Home');
    expect(visibilityState.selectedTab).toBe('pray');
    expect(visibilityState.shouldHideTabBar).toBe(true);
  });

  it('keeps the tab bar visible for non-pray home feeds', () => {
    const visibilityState = getHomeTabVisibilityState({
      name: 'HomeTab',
      params: { screen: 'Home' },
      state: {
        index: 0,
        routes: [{ name: 'Home', params: { selectedTab: 'foryou' } }],
      },
    });

    expect(visibilityState.focusedRouteName).toBe('Home');
    expect(visibilityState.selectedTab).toBe('foryou');
    expect(visibilityState.shouldHideTabBar).toBe(false);
  });

  it('keeps the tab bar visible for non-home nested routes even if stale pray params exist', () => {
    const visibilityState = getHomeTabVisibilityState({
      name: 'HomeTab',
      params: { screen: 'Home', params: { selectedTab: 'pray' } },
      state: {
        index: 1,
        routes: [{ name: 'Home', params: { selectedTab: 'pray' } }, { name: 'UserProfile' }],
      },
    });

    expect(visibilityState.focusedRouteName).toBe('UserProfile');
    expect(visibilityState.selectedTab).toBeUndefined();
    expect(visibilityState.shouldHideTabBar).toBe(false);
  });

  it('prefers active nested state over stale notification params after goBack', () => {
    const route = {
      name: 'HomeTab',
      params: { screen: 'Notifications', params: { selectedTab: 'pray' } },
      state: {
        index: 0,
        routes: [{ name: 'Home', params: { selectedTab: 'foryou' } }],
      },
    };

    expect(getHomeTabFocusedRouteName(route)).toBe('Home');
    expect(getHomeTabVisibilityState(route)).toEqual({
      focusedRouteName: 'Home',
      selectedTab: 'foryou',
      shouldHideTabBar: false,
    });
  });

  it('falls back to pending params before the nested navigator state exists', () => {
    const route = {
      name: 'HomeTab',
      params: { screen: 'Home', params: { selectedTab: 'pray' } },
    };

    expect(getHomeTabFocusedRouteName(route)).toBe('Home');
    expect(getHomeTabVisibilityState(route)).toEqual({
      focusedRouteName: 'Home',
      selectedTab: 'pray',
      shouldHideTabBar: true,
    });
  });
});
