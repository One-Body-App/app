import { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '.';
import { borderRadius, borderWidth } from './outlines';
import { spacing } from './spacing';

export const card: ViewStyle = {
  marginTop: spacing.x24,

  padding: spacing.x24,
  borderRadius: 14,
  borderWidth: borderWidth.thin,
};

export const profileImageList = {
  width: 60,
  height: 60,
  borderRadius: borderRadius.max,
  marginBottom: spacing.x8,
  // borderColor: Colors.neutral[800],
  // borderWidth: borderWidth.thin,
  marginRight: spacing.x8,
};

export const iterestListItem: ViewStyle = {
  paddingHorizontal: spacing.x10,
  paddingVertical: spacing.x10,
  justifyContent: 'center',
  borderRadius: borderRadius.small,
  marginHorizontal: spacing.x8,
  marginVertical: spacing.x8 / 2,

  // borderWidth: borderWidth.thin,
  backgroundColor: Colors.neutral[700],
};
