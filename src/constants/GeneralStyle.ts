import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { borderRadius } from '../styles/outlines';
import { Colors } from '../styles';

export const GeneralStyle = StyleSheet.create({
  continer: {
    flex: 1,
    backgroundColor: 'white',
  },
  btnText: {
    fontSize: getFontSize(2.1),
    fontFamily: 'Rubik-Medium',
    letterSpacing: 1.25,
  },
  btn: {
    alignSelf: 'center',
    // flexGrow: 1,
    // marginHorizontal: 25,
    // height: getHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    // flex: 1,
    marginHorizontal: 20,
    padding: 20,
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
    marginBottom: 3,
    marginTop: 10,
  },
  MessageView: {
    marginBottom: 25,
    flexDirection: 'row',
    padding: 11,
    borderRadius: borderRadius.base,
  },
  successtext: {
    color: Colors.successFeedback.text,
    flex: 1,
  },
});
