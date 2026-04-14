import { type ViewStyle } from 'react-native';

export function buildTabBarVisibilityStyle<T extends ViewStyle>(
  baseStyle: T,
  isVisible: boolean
): ViewStyle {
  if (isVisible) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    display: 'none',
    height: 0,
    opacity: 0,
  };
}
