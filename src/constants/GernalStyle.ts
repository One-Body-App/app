import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const GernalStyle = StyleSheet.create({
  continer: {
    flex: 1,
    backgroundColor: 'white',
  },
  btnText: {
    color: 'white',
    fontSize: getFontSize(2.1),
    fontFamily: 'Rubik-Medium',
    letterSpacing: 1.25,
  },
  btn: {
    backgroundColor: '#032F3C',
    alignSelf: 'center',
    width: getWidth(88),
    height: getHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },

  input: {
    height: getHeight(6),
    width: getWidth(88),
    backgroundColor: 'white',
    // fontSize: getFontSize(1.6),
    alignSelf: 'center',
    paddingLeft: 5,
  },
  InputError: {
    color: 'red',
    marginLeft: 10,
    marginTop: 3,
    marginBottom: 5,
  },
});
