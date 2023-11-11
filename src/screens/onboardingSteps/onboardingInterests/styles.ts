import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import { Colors } from '@/src/styles';

export const styles = StyleSheet.create({
  listItem: {
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x10,
    justifyContent: 'center',
    borderRadius: borderRadius.xs,
    marginHorizontal: spacing.x8,
    marginVertical: spacing.x8,
    backgroundColor: Colors.neutral[700],
  },
});
