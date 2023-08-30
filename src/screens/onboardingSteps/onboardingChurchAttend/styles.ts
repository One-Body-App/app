import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  point: {
    color: '#4F6D77',
    fontWeight: 'bold',
    fontSize: getFontSize(2.7),
  },
  wavebgimg: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  checkedview: {
    flexDirection: 'row',
    width: getWidth(80),
    marginTop: getHeight(2),
    marginLeft: -7,
    alignSelf: 'flex-start',
  },
  mainimg: {
    justifyContent: 'space-around',
    alignItems: 'center',
    height: getHeight(30),
  },
  innerContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },

  text: {
    alignSelf: 'flex-start',
    marginTop: getHeight(2),
    width: getWidth(90),
    fontFamily: 'Rubik-Regular',
  },
  TextInput: {
    height: getHeight(5),
    width: getWidth(75),
    borderRadius: 5,
    borderWidth: 1,
    margin: 10,
    borderColor: '#888C93',
  },
  footerText: {
    color: '#032F3C',
    fontWeight: '600',
    fontSize: getFontSize(2.6),
    fontFamily: 'Rubik-Regular',
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

  heading: {
    fontSize: getFontSize(2.9),
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'Rubik-Regular',
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
