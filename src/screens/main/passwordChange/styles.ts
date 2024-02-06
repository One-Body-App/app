import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: {
    marginTop: getHeight(5.5),
    flex: 1,
  },
  hidepicc: {
    alignSelf: 'center',

    marginTop: getHeight(1),
  },
  errTxt: {
    // fontSize: getFontSize(2),
    color: 'red',
    marginLeft: 10,
    marginBottom: 5,
  },
  errorview: {
    color: 'red',
    left: 10,
    fontSize: getFontSize(2),
  },
  text: { width: '80%', textAlign: 'center' },
  simpleview: {
    backgroundColor: 'red',
    width: 15,
    height: 15,
    borderRadius: 10,
  },

  TextInput: {
    height: getHeight(6),
    paddingLeft: 5,
    width: getWidth(80),
    borderRadius: 5,
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
  btnText: { color: 'white', fontSize: getFontSize(2.5) },
});
