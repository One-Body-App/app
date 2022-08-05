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
  emailerrortext: {
    color: 'red',
    left: 10,
    fontSize: getFontSize(2),
  },
});
