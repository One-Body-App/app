import { ImageStyle, ViewStyle } from 'react-native';

import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

export const profileImageList: ImageStyle = {
  width: 60,
  height: 60,
  borderRadius: borderRadius.max,
  marginBottom: 5,
  borderColor: Colors.neutral[800],
  borderWidth: 1,
  marginRight: 10,
};

export const iterestListItem: ViewStyle = {
  paddingHorizontal: spacing.x16,
  paddingVertical: spacing.x8,
  borderRadius: borderRadius.large,
  marginRight: spacing.x8,
  marginBottom: spacing.x10,
  borderWidth: 1,
  borderColor: Colors.neutral[700],
  backgroundColor: Colors.neutral[800],
};
