import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    height: getHeight(60),
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  wbgimg: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    width: '80%',
    textAlign: 'center',
    width: getWidth(60),
    textAlign: 'center',
    fontFamily: 'Rubik-Regular',
  },
  footerText: {
    color: '#032F3C',
    fontWeight: '600',
    fontSize: getFontSize(2.6),
  },
  progressBar: {
    width: getWidth(25),
    height: getHeight(1),
    backgroundColor: '#032F3C',
    borderRadius: 5,
  },
  progressBarStatus: {
    position: 'absolute',
    backgroundColor: '#12D2D9',
    width: 40,
    height: 7,
    borderRadius: 5,
  },
  TextInput: {
    height: getHeight(5),

    paddingLeft: 7,
    width: getWidth(75),
    borderRadius: 5,
    borderWidth: 1,
    margin: 10,
    borderColor: '#888C93',
  },

  heading: {
    fontSize: getFontSize(2.9),
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'black',
  },
  foter: {
    height: getHeight(10),
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
  },
  btn: {
    backgroundColor: '#F6F6F6',
    width: getWidth(80),
    margin: 5,
    height: getHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  btn2: {
    backgroundColor: 'white',
    borderColor: '#F6F6F6',
    borderWidth: 1,
    width: getWidth(80),
    margin: 5,
    height: getHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  btnText: { color: 'white', fontSize: getFontSize(2.5) },
});
