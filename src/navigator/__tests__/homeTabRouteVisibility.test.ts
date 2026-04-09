import getHomeTabFocusedRouteName from '../homeTabRouteVisibility';

describe('getHomeTabFocusedRouteName', () => {
  it('hides the tab bar when notifications is the active nested route', () => {
    expect(
      getHomeTabFocusedRouteName({
        name: 'HomeTab',
        params: { screen: 'Home' },
        state: {
          index: 1,
          routes: [{ name: 'Home' }, { name: 'Notifications' }],
        },
      })
    ).toBe('Notifications');
  });

  it('prefers active nested state over stale notification params after goBack', () => {
    expect(
      getHomeTabFocusedRouteName({
        name: 'HomeTab',
        params: { screen: 'Notifications' },
        state: {
          index: 0,
          routes: [{ name: 'Home' }],
        },
      })
    ).toBe('Home');
  });

  it('falls back to pending params before the nested navigator state exists', () => {
    expect(
      getHomeTabFocusedRouteName({
        name: 'HomeTab',
        params: { screen: 'Notifications' },
      })
    ).toBe('Notifications');
  });
});
