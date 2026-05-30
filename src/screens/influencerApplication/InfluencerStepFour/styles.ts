import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paragraph: {
    color: '#4F6D77',
    fontWeight: '400',
    fontFamily: 'OpenSans-Regular',
    fontSize: 15.5,
    lineHeight: 20,
    marginTop: getHeight(0.5),
  },
  headingt: {
    color: '#032F3C',
    fontWeight: '500',
    fontFamily: 'OpenSans-Medium',
    letterSpacing: 0.25,
    fontSize: 18,
    marginTop: getHeight(2),
  },
  privecystepview: {
    justifyContent: 'space-around',
    alignItems: 'center',
    height: getHeight(30),
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 40,
  },
  point: {
    color: '#4F6D77',
    fontWeight: 'bold',
    fontSize: getFontSize(2.7),
  },
  imagebackgroundview: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
  },

  text: {
    fontFamily: 'OpenSans-Regular',
    width: getWidth(60),
    textAlign: 'center',
  },
  footerText: {
    color: '#032F3C',
    fontWeight: '600',
    fontSize: getFontSize(2.2),
    fontFamily: 'OpenSans-Regular',
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
    width: 75,
    height: 7,
    borderRadius: 5,
  },

  heading: {
    fontSize: getFontSize(2.9),
    fontFamily: 'OpenSans-Regular',
    textAlign: 'center',

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

export default styles;
