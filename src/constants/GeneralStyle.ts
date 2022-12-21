import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const GeneralStyle = StyleSheet.create({
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
    alignSelf: 'center',
    // flexGrow: 1,
    // marginHorizontal: 25,
    height: getHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 20,
  },

  input: {
    height: getHeight(6),
    width: getWidth(88),

    // fontSize: getFontSize(1.6),
    alignSelf: 'center',
    paddingLeft: 5,
  },
  InputError: {
    color: 'red',
    marginTop: 8,
    marginBottom: 3,
    marginHorizontal: 15,
    alignSelf: 'stretch',
  },
});
