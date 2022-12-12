import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  subscribeview: {
    // alignContent: 'center',
    // margin: 6,
    // width: getWidth(45),
    flex: 1,

    padding: 6,
  },
  bottomView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  content2: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 13,
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
    height: getHeight(75),
  },
  headLine: {
    height: 6,
    width: 55,
    borderRadius: 5,
    backgroundColor: '#EAEAEA',
    marginBottom: 5,
  },
  contview: { flex: 1, justifyContent: 'space-around' },
  title: {
    fontSize: 20,
    fontWeight: '500',

    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
    padding: 10,
    paddingBottom: 0,
    marginBottom: 20,
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
    textAlign: 'center',
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
  mainButton: { backgroundColor: '#F6F6F6', padding: 16, flex: 1, borderRadius: 10 },
  mainButtonWrapper: { flex: 1, margin: 16 },
  flatlistview: {
    // flex: 1,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginHorizontal: 10,
    paddingBottom: 240,
    // paddingTop: 10,
  },
  listItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 7,
    marginVertical: 5,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'gray',
  },
  // subscribeview: {
  //   alignItems: 'center',
  //   marginHorizontal: getWidth(1.5),
  //   width: getWidth(28),
  //   height: getHeight(24),
  //   borderRadius: 10,
  // },
  // askinterest: {
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   marginTop: getHeight(10),
  //   height: getHeight(15),
  //   width: getWidth(100),
  // },

  // subscribetext: {
  //   padding: 2,
  //   color: '#032F3C',
  //   fontFamily: 'Rubik-Medium',
  //   fontSize: 12,
  //   textAlign: 'center',
  // },
  // subscribebutton: {
  //   backgroundColor: '#032F3C',
  //   padding: 12,

  //   justifyContent: 'center',
  //   alignItems: 'center',

  //   width: getWidth(28),
  //   borderRadius: 10,
  // },
  // subtex: {
  //   fontWeight: 'bold',
  //   color: '#F6F6F6',
  //   letterSpacing: 0,
  // },
});
