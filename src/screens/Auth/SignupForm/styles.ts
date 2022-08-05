import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  align: { marginTop: '10%', marginHorizontal: '5%' },
  singerrorview1: { padding: 5, flexDirection: 'row' },
  singerrortext: {
    color: 'red',
    left: getWidth(3),
    width: getWidth(78),
    fontSize: getFontSize(2),
  },
  center: { flexDirection: 'row', alignSelf: 'center' },
  alreadyAccountContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Rubik-Regular',
    color: '#032F3C',
    marginTop: 20,
  },
  helight: {
    color: '#126B87',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    bottom: 0,
    height: getHeight(10),
  },
});
