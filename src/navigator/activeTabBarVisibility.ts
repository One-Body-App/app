import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

export function isHiddenTabBarStyle(tabBarStyle?: StyleProp<ViewStyle>): boolean {
  const flattenedStyle = StyleSheet.flatten(tabBarStyle);

  if (!flattenedStyle) {
    return false;
  }

  return flattenedStyle.display === 'none' || flattenedStyle.height === 0;
}

export function shouldHideActiveTabBarWrapper({
  state,
  descriptors,
}: Pick<BottomTabBarProps, 'state' | 'descriptors'>): boolean {
  const activeRoute = state.routes[state.index];
  const activeDescriptor = activeRoute ? descriptors[activeRoute.key] : undefined;

  return isHiddenTabBarStyle(activeDescriptor?.options?.tabBarStyle);
}
