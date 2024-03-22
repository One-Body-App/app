import ReAnimated from 'react-native-reanimated';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { HeaderBackButton, PlatformPressable } from '@react-navigation/elements';
import { DrawerActions, useTheme } from '@react-navigation/native';
import { Platform, Animated, StyleProp, ViewStyle } from 'react-native';
import { Menu } from 'iconoir-react-native';
import FastImage from 'react-native-fast-image';
import { getDrawerStatusFromState } from '@react-navigation/drawer';
import { HeaderProps } from './types';
import { styles } from './styles';

const logoWhite = require('@/assets/images/logo_header_white.png');
const logoHeader = require('@/assets/images/logo_header.png');

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
    headerTitleAlign: 'center',
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
  headerShadowVisible: Platform.OS !== 'ios',
  headerTransparent: Platform.OS === 'ios',
  headerBackTitleVisible: false,
  headerTitle() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { dark } = useTheme();

    return (
      <FastImage
        style={{ width: 100, height: 28 }}
        resizeMode={FastImage.resizeMode.contain}
        source={dark ? logoWhite : logoHeader}
      />
    );
  },
};
