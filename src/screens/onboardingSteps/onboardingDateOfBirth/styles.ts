import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: {
    flex: 1,

    alignItems: 'center',
  },
  waveimg: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  logomainimg: {
    justifyContent: 'space-around',
    alignItems: 'center',
    height: getHeight(30),
  },
  box: {
    backgroundColor: 'white',
    height: getHeight(7),
    width: getWidth(90),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginTop: getHeight(5),
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: getHeight(8),
    paddingHorizontal: getWidth(5),
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
    width: 75,
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
