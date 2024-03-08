import Animated from 'react-native-reanimated';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { PlatformPressable } from '@react-navigation/elements';
import { DrawerActions } from '@react-navigation/native';
import { Platform } from 'react-native';
import { HambergerMenu } from 'iconsax-react-native';
import { HeaderProps } from './types';
import { styles } from './styles';

export default function mainPageOptions(
  navigation: any,
  textColor: string,
  title: string
): NativeStackNavigationOptions {
  return {
    headerShadowVisible: false,
    // headerLeft: (props) => {
    //   return (
    //     <PlatformPressable
    //       accessible
    //       accessibilityRole="button"
    //       android_ripple={{ borderless: true }}
    //       onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
    //       // style={styles.touchable}
    //       hitSlop={Platform.select({
    //         ios: undefined,
    //         default: { top: 16, right: 16, bottom: 16, left: 16 },
    //       })}
    //     >
    //       <HambergerMenu color={props.tintColor ? props.tintColor : textColor} />
    //       {/* <Image
    //         style={[styles.icon, tintColor ? { tintColor } : null]}
    //         source={require('./assets/toggle-drawer-icon.png')}
    //         fadeDuration={0}
    //       /> */}
    //     </PlatformPressable>
    //   );

    //   // <DrawerToggleButton {...props} />
    // },
    headerTitleAlign: 'center',
    headerTitle: ({ tintColor, style, children, ...rest }: HeaderProps) => {
      return (
        <Animated.Text
          accessibilityRole="header"
          aria-level="1"
          numberOfLines={1}
          // eslint-disable-next-line react/no-children-prop
          children={title}
          {...rest}
          style={[styles.title, { color: tintColor === undefined ? textColor : tintColor }]}
        />
      );
    },
  };
}
