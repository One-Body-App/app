import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { appColor } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topView: {
    alignItems: 'center',
    marginTop: getHeight(8),
  },
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
  emailerrorview: { padding: 5, marginLeft: getWidth(5), flexDirection: 'row' },
  emailsuccessview: {
    width: '100%',

    paddingHorizontal: 20,
    // marginLeft: getWidth(5),
    // flexDirection: 'row',
    // textAlign: 'center',
  },
  emailSuccesssText: {
    color: 'green',
    marginTop: 20,
    fontSize: getFontSize(2),
    textAlign: 'center',
  },
  emailerrortext: {
    color: 'red',

    fontSize: getFontSize(2),
  },
  headview: {
    height: getHeight(8),

    flexDirection: 'row',

    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
    shadowColor: '#126BB7',
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
});
