import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rolesview: {
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 40,
  },
  backgroundimagestyle: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },

  text: {
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
    marginTop: 10,
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
    width: 20,
    height: 7,
    borderRadius: 5,
  },

  heading: {
    fontSize: getFontSize(2.9),
    textAlign: 'center',

    fontFamily: 'OpenSans-Medium',
  },
  foter: {
    height: getHeight(10),
    left: 0,
    right: 0,
    bottom: 0,
    position: 'absolute',
  },
  point: {
    fontWeight: 'bold',
    fontSize: getFontSize(2.5),
    fontFamily: 'OpenSans-Regular',
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
  headview: {
    height: getHeight(8),

    flexDirection: 'row',

    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
    boxShadow: '0 25px 20px rgba(18, 107, 183, 0.1)',
  },
});

export default styles;
