import { TextStyle, ViewStyle, PressableStateCallbackType, Platform } from 'react-native';

import * as Colors from './colors';
import * as Outlines from './outlines';
import * as Spacing from './spacing';
import * as Typography from './typography';

type ButtonType = 'primary' | 'outline';
export const button: Record<ButtonType, ViewStyle> = {
  primary: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.spacing.x10,
    borderRadius: Outlines.borderRadius.button,
    backgroundColor: Colors.primarySapphire.brand,
    paddingVertical: 15,
  },
  outline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.spacing.x10,
    borderRadius: Outlines.borderRadius.button,
    borderColor: Colors.neutral[800],
    borderWidth: 1,
    paddingVertical: 15,
  },
};

export const buttonText: TextStyle = {
  ...Typography.body.x2M,
};

// type BarText = 'primary' | 'secondary';
// export const barText: Record<BarText, TextStyle> = {
//   primary: {
//     ...Typography.fontSize.x30,
//     ...Typography.fontWeight.semibold,
//     color: Colors.neutral.white,
//   },
//   secondary: {
//     ...Typography.fontSize.x10,
//     ...Typography.fontWeight.regular,
//     color: Colors.neutral.s500,
//   },
// };

// type Circular = 'primary';
// export const circular: Record<Circular, ViewStyle> = {
//   primary: {
//     height: Sizing.layout.x30,
//     width: Sizing.layout.x30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: Colors.primary.brand,
//     borderRadius: Outlines.borderRadius.max,
//   },
// };

const opacity = (state: PressableStateCallbackType): ViewStyle => {
  const opacity = state.pressed ? 0.65 : 1;
  return { opacity };
};

export const applyOpacity = (style: ViewStyle) => {
  return (state: PressableStateCallbackType): ViewStyle => {
    return {
      ...style,
      ...opacity(state),
    };
  };
};
