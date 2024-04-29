import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white ',
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    height: getHeight(9),
  },
  alreadyLogin: { flexDirection: 'row', marginTop: getHeight(5) },
  footer: {
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    bottom: 0,
    height: getHeight(10),
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 40,
  },
  helight: {
    color: '#126B87',
    fontWeight: 'bold',
  },
  text: {
    width: '80%',
    textAlign: 'center',
    marginTop: getHeight(7),
    width: getWidth(80),
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
  },

  heading: {
    fontSize: getFontSize(2.7),
    marginTop: getHeight(2),
    fontFamily: 'OpenSans-Medium',
    textAlign: 'center',

    color: 'black',
    width: getWidth(70),
  },
  alreadyAccountContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'OpenSans-Regular',
    color: '#032F3C',
  },
  btn: {
    backgroundColor: '#F6F6F6',
    width: getWidth(80),

    marginTop: getHeight(2),
    height: getHeight(14),

    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  btnSelected: {
    backgroundColor: '#F6F6F6',
    width: getWidth(80),
    marginTop: getHeight(2),
    height: getHeight(14),
    borderWidth: 1,
    borderColor: '#126B87',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
  btnText: {
    color: 'black',
    fontSize: getFontSize(2.7),

    fontFamily: 'OpenSans-Medium',
  },
});
