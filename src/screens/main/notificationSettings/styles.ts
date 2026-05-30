import { StyleSheet } from 'react-native';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';

const styles = StyleSheet.create({
  settingsCard: {
    padding: spacing.x24,
    borderRadius: borderRadius.base,
    marginVertical: spacing.x16,
  },
});

export default styles;
