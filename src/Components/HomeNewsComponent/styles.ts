import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  continer: {
    flex: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getWidth(5),
    justifyContent: 'space-between',

    minHeight: getHeight(9),
    maxHeight: getHeight(9),
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: getWidth(4),
    bottom: getHeight(3),
  },
  requestModel: {
    height: getHeight(35),
    opacity: 0.9,

    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
  },
  afsd: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sourcename: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getHeight(1),
  },
  textstyle: {
    color: 'white',
    fontFamily: 'Rubik-Medium',
    width: '80%',
    fontSize: getFontSize(2.3),
  },
  TextInput: {
    borderWidth: 1,
    borderRadius: 10,
    width: getWidth(65),
    borderColor: '#C4C4C4',
    paddingLeft: 8,
    height: getHeight(6),
  },
  Button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: getWidth(15),
    borderRadius: 10,
    height: getHeight(6),
    backgroundColor: '#C4C4C4',
  },
  ModelInputView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'center',
    position: 'absolute',
    bottom: 10,

    width: '90%',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '500',
    color: '#032F3C',
    fontFamily: 'Rubik-Medium',
    marginLeft: 10,
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
  socialpostview: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    borderRadius: 20,
    padding: 8,
  },
  NewsToday: {
    backgroundColor: 'white',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  socialpostimage: {
    height: getHeight(22),
    // width: getWidth(85),
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginBottom: 5,
  },
  newspostimage: {
    height: getHeight(22),
    width: '100%',

    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  blogposttext: {
    fontSize: 20,
    fontFamily: 'Rubik-Medium',
    marginLeft: 10,
    marginTop: 10,
    padding: 10,
    paddingBottom: 5,
    color: '#032f3c',
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
});
