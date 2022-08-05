import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  innerContainer: {
    alignItems: 'center',

    marginTop: getHeight(5),
  },
  otptext: {
    color: 'red',
    left: 10,
    fontSize: getFontSize(2),
  },
  otpsimpleview: {
    backgroundColor: 'red',
    width: 15,
    height: 15,
    borderRadius: 10,
  },
  otperrorvoew: {
    padding: 5,
    marginLeft: -getWidth(45),
    marginTop: -getHeight(-9),
    flexDirection: 'row',
  },
  headingFonts: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#032F3C',
    margin: 5,
    letterSpacing: 1,
    fontSize: getFontSize(3.2),
  },
  center: { justifyContent: 'center', alignItems: 'center' },
  text: {
    fontSize: 16,
    letterSpacing: 0.3,
    // marginLeft: 10,
    // marginRight: 10,
    textAlign: 'center',
    color: '#4F6D77',
    width: '90%',
  },

  borderStyleBase: {
    width: 30,
    height: 45,
  },

  borderStyleHighLighted: {
    borderColor: '#03DAC6',
    color: '#032F3C',
  },

  underlineStyleBase: {
    borderWidth: 1,
    color: '#032F3C',
    fontWeight: 'bold',
    width: 70,
    height: 50,
    borderRadius: 10,
    borderColor: '#032F3C',
  },
  newcolor: { color: 'black' },

  underlineStyleHighLighted: {
    borderColor: 'red',
    // borderColor: '#03DAC6',
  },

  btn: {
    backgroundColor: '#126B87',
    width: getWidth(80),
    margin: 5,
    height: getHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  btnText: {
    color: 'white',
    fontSize: getFontSize(2),
    letterSpacing: 1.25,
    fontFamily: 'Rubik-Medium',
  },
});
