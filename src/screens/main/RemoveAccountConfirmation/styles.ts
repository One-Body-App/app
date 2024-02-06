import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: {
    alignItems: 'center',
    marginTop: getHeight(5.5),
  },

  text: {
    width: '80%',

    textAlign: 'center',

    fontWeight: '500',
    color: '#5B7279',
    lineHeight: 22,
    letterSpacing: 0.25,
    fontSize: 16,
  },
  heading: {
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',

    letterSpacing: 1,
    fontSize: getFontSize(3.2),
  },

  TextInput: {
    borderWidth: 1,
    height: getHeight(6),
    width: getWidth(80),
    borderRadius: 5,
  },
  btntxt: {
    color: 'white',
    fontSize: getFontSize(2),
    letterSpacing: 1.25,
    fontFamily: 'Rubik-Medium',
  },

  btn: {
    backgroundColor: 'red',

    // margin: 5,
    marginTop: getHeight(4),
    height: getHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  btnText: { color: 'white', fontSize: getFontSize(2.5) },
});
