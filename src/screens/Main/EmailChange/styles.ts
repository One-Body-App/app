import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { spacing } from '@/src/styles/spacing';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: {
    marginTop: spacing.x10,
    flex: 1,
  },
});
