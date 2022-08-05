import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  subscribeview: {
    justifyContent: 'space-around',
    alignItems: 'center',
    margin: 6,
    width: getWidth(45),
    height: getHeight(35),
    borderRadius: 10,

    backgroundColor: '#FAFAFA',
  },
  askinterest: {
    justifyContent: 'center',
    alignItems: 'center',
    height: getHeight(15),
    width: getWidth(100),
  },

  usernamestyle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -getHeight(3),
  },

  subscribetext: {
    padding: 2,
    color: '#032F3C',
    fontWeight: 'bold',
  },
  subscribebutton: {
    backgroundColor: '#032F3C',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',

    width: getWidth(35),
    borderRadius: 10,
  },
  subtex: {
    fontWeight: 'bold',
    color: '#F6F6F6',
    letterSpacing: 0.5,
  },
  subscribeview: {
    alignItems: 'center',
    marginHorizontal: getWidth(1.5),
    width: getWidth(28),
    height: getHeight(24),
    borderRadius: 10,
  },
  askinterest: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getHeight(10),
    height: getHeight(15),
    width: getWidth(100),
  },

  subscribetext: {
    padding: 2,
    color: '#032F3C',
    fontFamily: 'Rubik-Medium',
    fontSize: 12,
    textAlign: 'center',
  },
  subscribebutton: {
    backgroundColor: '#032F3C',
    padding: 12,

    justifyContent: 'center',
    alignItems: 'center',

    width: getWidth(28),
    borderRadius: 10,
  },
  subtex: {
    fontWeight: 'bold',
    color: '#F6F6F6',
    letterSpacing: 0,
  },
});
