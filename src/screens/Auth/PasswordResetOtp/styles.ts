import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { appColor } from '../../../constants';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  inerContainer: { flex: 1, alignItems: 'center' },
  options: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getHeight(8),
  },
  title: {
    color: appColor.PrimaryColor,
    fontSize: getFontSize(3.2),
    fontFamily: 'Rubik-Medium',
    textAlign: 'justify',
  },
  subTitle: {
    color: appColor.InstructionColor,
    fontSize: 16,
    marginTop: 10,
    marginHorizontal: 40,
    lineHeight: 19,
    textAlign: 'center',
  },
  borderStyleHighLighted: {
    borderColor: '#03DAC6',
    color: appColor.PrimaryColor,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  underlineStyleBase: {
    borderWidth: 1,
    width: 70,
    height: 50,
    borderRadius: 10,
    borderColor: '#032F3C',
    color: appColor.PrimaryColor,
  },

  underlineStyleHighLighted: {
    borderColor: 'red',
    // borderColor: '#03DAC6',
  },
});
