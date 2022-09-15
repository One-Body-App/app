import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { appColor } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ' #E5E5E5;',
  },

  containerScroll: {
    backgroundColor: ' #FFF',
  },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: getHeight(6),
    overflow: 'hidden',
    shadowColor: '#126BB7',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    // padding: 16,
  },
  animatedview: {
    height: getHeight(0.4),
    marginTop: getHeight(1),
    width: '40%',
    borderRadius: 5,
    backgroundColor: '#12D2D9',
  },
  animatedview2: {
    height: getHeight(0.4),
    marginTop: getHeight(1),
  },
  selectedTabText: {
    color: 'white',
    fontFamily: 'Rubik-Medium',
    fontSize: getFontSize(2.3),
  },
  TabTex: { color: appColor.SecoundryColor, fontSize: getFontSize(2.3) },
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
    marginTop: getHeight(7),
    width: getWidth(80),
    textAlign: 'center',
    fontFamily: 'Rubik-Regular',
  },

  heading: {
    fontSize: getFontSize(2.7),
    marginTop: getHeight(2),
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',

    color: 'black',
    width: getWidth(70),
  },
  alreadyAccountContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Rubik-Regular',
    color: '#032F3C',
  },
  btn: {
    backgroundColor: '#F6F6F6',
    width: getWidth(42),

    height: getHeight(6),

    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  btnSelected: {
    backgroundColor: '#FFF',
    width: getWidth(42),
    height: getHeight(6),
    borderWidth: 1,
    borderColor: '#126B87',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
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
    fontSize: getFontSize(1.8),

    fontFamily: 'Rubik-Medium',
  },
  Errorview: { padding: 5, flexDirection: 'row', marginLeft: getWidth(10) },
  errortext: {
    color: 'red',
    fontSize: getFontSize(2),
  },
});
