import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: {
    alignItems: 'center',

    marginHorizontal: spacing.x24,
    marginTop: spacing.x64,
    borderRadius: borderRadius.base,
    paddingTop: spacing.x32,
    paddingBottom: spacing.x48,
  },

  text: {
    width: '80%',
    textAlign: 'center',
    color: '#4F6D77',
    fontWeight: '500',
    fontFamily: 'Rubik-Regular',
  },
  heading: {
    fontWeight: '500',
    fontSize: getFontSize(2.7),
    margin: 10,

    letterSpacing: 0.25,
    fontFamily: 'Rubik-Medium',
  },

  TextInput: {
    borderWidth: 1,
    height: getHeight(6),
    width: getWidth(80),
    borderRadius: 5,
  },

  btn: {
    backgroundColor: '#E6EAEC',
    width: getWidth(80),
    margin: 5,
    height: getHeight(7.5),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  btnText: {
    fontSize: getFontSize(2),
    marginRight: getWidth(5),
    color: '#032F3C',
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    letterSpacing: 1.25,
  },
});
