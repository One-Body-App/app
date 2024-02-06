import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  textstyle: {
    marginLeft: getWidth(4),
    color: '#4F6D77',
    fontFamily: 'Rubik-Medium',
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 16,
    marginTop: getHeight(2),
  },
  litetext: {
    color: '#4F6D77',
    fontFamily: 'Rubik-Light',
    marginLeft: getWidth(4),
    fontSize: 16,
    fontWeight: '400',
    marginRight: getWidth(4),
    marginTop: getHeight(1.5),
  },
});
