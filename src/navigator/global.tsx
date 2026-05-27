import ReAnimated from 'react-native-reanimated';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { PlatformPressable } from '@react-navigation/elements';
import { DrawerActions } from '@react-navigation/native';
import { Platform, Animated, StyleProp, ViewStyle } from 'react-native';
import { Menu } from 'iconoir-react-native';
import { HeaderProps } from './types';
import styles from './styles';
import HeaderLogo from './HeaderLogo';

export default function mainPageOptions(
  navigation: any,
  textColor: string,
  title: string,
  styleForDrawerIcon?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>
): NativeStackNavigationOptions {
  return {
    headerLeft: () => {
      return (
        <PlatformPressable
          accessible
          accessibilityRole="button"
          android_ripple={{ borderless: true }}
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styleForDrawerIcon}
          hitSlop={Platform.select({
            ios: undefined,
            default: { top: 16, right: 16, bottom: 16, left: 16 },
          })}
        >
          <Menu color={textColor} height={25} width={25} />
        </PlatformPressable>
      );
    },
    headerTitleAlign: Platform.OS === 'android' ? 'left' : 'center',
    headerTitle: ({ tintColor, style, children, ...rest }: HeaderProps) => {
      return (
        <ReAnimated.Text
          accessibilityRole="header"
          aria-level="1"
          numberOfLines={1}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...rest}
          style={[styles.title, { color: tintColor === undefined ? textColor : tintColor }]}
        >
          {title}
        </ReAnimated.Text>
      );
    },
  };
}

export const headerOptions: NativeStackNavigationOptions = {
  headerShadowVisible: false,
  headerTransparent: true,
  headerBackTitleVisible: false,
  headerTitleAlign: Platform.OS === 'android' ? 'left' : 'center',
  headerTitle: HeaderLogo,
};
