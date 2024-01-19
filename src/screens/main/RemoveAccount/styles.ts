import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderWidth } from '@/src/styles/outlines';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: {
    alignItems: 'center',
    marginTop: getHeight(5.5),
  },

  text: {
    width: '80%',

    textAlign: 'center',
    fontWeight: '500',
    color: '#5B7279',
    lineHeight: 22,
    letterSpacing: 0.25,
    fontSize: 16,
  },
  heading: {
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',

    letterSpacing: 1,
    fontSize: getFontSize(3.2),
  },

  TextInput: {
    borderWidth: 1,
    height: getHeight(6),
    width: getWidth(80),
    borderRadius: 5,
  },

  btn: {
    padding: spacing.x16,

    borderColor: Colors.neutral[600],

    flexGrow: 1,
    // flexDirection: 'row',
  },
  btnText: { ...Typography.body.x2 },
});
