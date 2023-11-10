import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { Colors } from '@/src/styles';

const menuItemText: TextStyle = {
  // color: '#126B87',

  fontSize: 15,
  textAlign: 'center',
  fontWeight: '500',
  textTransform: 'capitalize',
};

const menuItem: ViewStyle = {
  paddingTop: 15,
  paddingBottom: 9,
  marginHorizontal: 15,
};

export const styles = StyleSheet.create({
  continer: {
    flex: 1,
  },
  list: {
    maxHeight: 40,
  },
  contentContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: getWidth(5),
    justifyContent: 'space-between',
    paddingVertical: getHeight(2),
    // height: getHeight(4),
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: getWidth(4),
    bottom: getHeight(3),
    shadowColor: '#032f3c',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,

    elevation: 12,
  },
  requestModel: {
    opacity: 0.9,

    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
  },
  TextInput: {
    borderWidth: 1,
    borderRadius: 10,
    width: '82%',
    borderColor: '#C4C4C4',
    paddingLeft: 8,
    color: 'white',
    minHeight: getHeight(6),
    maxHeight: getHeight(16),
  },
  propview: {
    height: getHeight(0.4),
    marginTop: 4,
    width: '100%',
    borderRadius: 5,
    backgroundColor: '#12D2D9',
  },
  prayerTypeView: {
    flexDirection: 'row',
    padding: 5,
    margin: 8,
    marginBottom: 0,
    width: '95%',
    alignSelf: 'center',
    borderRadius: 8,
    backgroundColor: 'white',

    justifyContent: 'space-around',
  },
  btn: {
    borderWidth: 1,
    borderColor: '#5B7279',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  btnSelected: {
    borderWidth: 1,
    borderColor: '#126B87',
    backgroundColor: '#126B87',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,

    borderRadius: 5,
  },
  Button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: getWidth(15),
    borderRadius: 10,
    height: getHeight(7),
    backgroundColor: '#C4C4C4',
  },

  messageView: {
    flexDirection: 'row',
    width: '75%',
    marginBottom: getHeight(3),
    alignSelf: 'center',
    justifyContent: 'center',
  },
  messageText: {
    color: 'white',
    marginLeft: 8,
    textAlign: 'justify',
  },
  belowbtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  belowbtnView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 6,
  },
  newstitle: {
    fontSize: getFontSize(3.2),
    fontWeight: 'bold',
    padding: 10,
    paddingBottom: 0,
  },
  newsimage: {
    height: getHeight(40),
    width: getWidth(65),
  },
  newsicon: {
    alignSelf: 'flex-end',
    padding: 15,
  },
  newstext: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: getFontSize(2.5),
    width: '85%',
  },
  newsview: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialposttext: {
    fontSize: getFontSize(3.2),
    fontWeight: 'bold',
    padding: 10,
    paddingBottom: 0,
    color: '#126B87',
  },
  socialpostfooter: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // socialpostview: {
  //   alignSelf: 'center',
  //   justifyContent: 'center',
  //   alignItems: 'center',

  //   borderRadius: 10,
  //   // padding: 0,
  //   flex: 1,
  //   marginHorizontal: 7,
  // },
  NewsToday: {
    backgroundColor: 'white',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  socialpostimage: {
    height: getHeight(22),
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginBottom: 5,
  },
  newspostimage: {
    height: getHeight(22),
    width: '100%',

    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  blogposttext: {
    fontSize: getFontSize(3.2),
    fontWeight: 'bold',
    padding: 10,
    paddingBottom: 0,
    color: '#126B87',
  },
  blogpostview: {
    backgroundColor: '#FAFAFA',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: getWidth(45),
    borderRadius: 10,
    padding: 10,
  },
  blogpostimage: {
    height: getHeight(18),
    width: getWidth(42),
    borderRadius: 40,
    marginBottom: 5,
  },
  blogpostpara: {
    padding: 2,
    color: '#032F3C',

    fontWeight: 'bold',

    width: 150,
  },
  blogposthour: {
    padding: 8,
    color: '#757575',
    alignSelf: 'stretch',
  },
  explorview: {
    flexDirection: 'row',
    padding: 25,
    justifyContent: 'space-between',
  },
  explortext: { width: 140, fontWeight: 'bold', color: '#032F3C' },
  viewtext: {
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: 92,
  },
  subscribeview: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: getWidth(45),
    height: getHeight(40),
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#FAFAFA',
  },
  subscribeview2: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: 10,
    padding: 10,
  },
  subscribetext: {
    padding: 2,
    color: '#032F3C',
    fontWeight: 'bold',
  },
  subscribebutton: {
    backgroundColor: '#032F3C',
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: -30,
    width: getWidth(43),
    borderRadius: 10,
  },
  subtex: {
    fontWeight: 'bold',
    color: '#F6F6F6',
    letterSpacing: 0.5,
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
    height: getHeight(45),
  },
  headLine: {
    height: 6,
    width: 55,
    borderRadius: 5,
    backgroundColor: '#EAEAEA',
    marginBottom: 5,
  },
  tabBar: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  menuItem,
  menuItemText,
  menuItemSelected: {
    ...menuItem,
    borderBottomWidth: 3,

    borderBottomLeftRadius: 1.5,
    borderBottomRightRadius: 1.5,
    borderTopRightRadius: 1.5,
    borderTopLeftRadius: 1.5,
  },
});
