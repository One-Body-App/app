import { StyleSheet } from 'react-native';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

export const styles = StyleSheet.create({
  mainButtonWrapper: { flex: 1, marginVertical: spacing.x16 },

  filterButton: {
    paddingHorizontal: spacing.x24,
    paddingVertical: spacing.x10,

    marginRight: spacing.x24,
    borderRadius: borderRadius.small,
  },
});
