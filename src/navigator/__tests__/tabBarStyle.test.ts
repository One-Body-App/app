import { buildTabBarVisibilityStyle } from '../tabBarStyle';

describe('buildTabBarVisibilityStyle', () => {
  it('returns the original style object when the tab bar is visible', () => {
    const baseStyle = {
      height: 84,
      paddingBottom: 12,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    };

    expect(buildTabBarVisibilityStyle(baseStyle, true)).toBe(baseStyle);
  });

  it('creates a hidden variant without mutating the visible base style', () => {
    const homeVisibleStyle = {
      height: 84,
      paddingBottom: 12,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    };
    const exploreVisibleStyle = {
      height: 84,
      paddingBottom: 12,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    };
    const chatVisibleStyle = {
      height: 84,
      paddingBottom: 12,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderTopWidth: 1,
    };

    const hiddenHomeStyle = buildTabBarVisibilityStyle(homeVisibleStyle, false);
    const hiddenExploreStyle = buildTabBarVisibilityStyle(exploreVisibleStyle, false);
    const hiddenChatStyle = buildTabBarVisibilityStyle(chatVisibleStyle, false);

    expect(homeVisibleStyle.height).toBe(84);
    expect(exploreVisibleStyle.height).toBe(84);
    expect(chatVisibleStyle.height).toBe(84);

    expect(hiddenHomeStyle).toMatchObject({ height: 0, opacity: 0, display: 'none' });
    expect(hiddenExploreStyle).toMatchObject({ height: 0, opacity: 0, display: 'none' });
    expect(hiddenChatStyle).toMatchObject({ height: 0, opacity: 0, display: 'none' });
  });
});
