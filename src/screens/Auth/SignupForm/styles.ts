import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  align: { marginHorizontal: 20, marginTop: '10%' },
  singerrorview1: { padding: 5, flexDirection: 'row' },
  singerrortext: {
    color: 'red',
    left: getWidth(3),
    width: getWidth(78),
    fontSize: getFontSize(2),
  },
  center: {
    marginTop: getHeight(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  paragraph: {
    color: '#4F6D77',
    fontWeight: '400',
    fontFamily: 'Rubik-Regular',
    fontSize: 15.5,
    lineHeight: 20,
    marginTop: getHeight(0.5),
  },
  textButton: {
    color: '#304248',
    fontWeight: '400',
    fontStyle: 'italic',
    fontFamily: 'Rubik-Bold',
    fontSize: 15.5,
    lineHeight: 20,
    marginTop: getHeight(0.5),
    textDecorationLine: 'underline',
  },
  simpleText: {
    color: '#81979E',
    marginTop: 2,
    fontFamily: 'Rubik-Medium',
  },
  text: {
    color: '#81979E',
    marginTop: 2,
    fontFamily: 'Rubik-Medium',
    underline: { textDecorationLine: 'underline' },
  },
  btnText: {
    fontSize: getFontSize(1.8),

    fontFamily: 'Rubik-Medium',
  },
  btnSelected: {
    width: getWidth(42),
    height: getHeight(6),
    borderWidth: 1,

    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  btn: {
    borderColor: '#B3C1C5',
    borderWidth: 1,
    width: getWidth(42),

    height: getHeight(6),

    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
});
