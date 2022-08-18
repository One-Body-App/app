import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

interface Styles {
  container: ViewStyle;
  flatlistview: ViewStyle;
  componentview: ViewStyle;
  innerContainer: ViewStyle;
  largeview: ViewStyle;
  text: TextStyle;
  textname: TextStyle;
  box2: ViewStyle;
  logo: ViewStyle;
  footerText: TextStyle;
  progressBar: ViewStyle;
  progressBarStatus: ViewStyle;
  heading: ViewStyle;
  heading2: ViewStyle;
  img: ImageStyle;
  box: ViewStyle;
  footer: ViewStyle;
  btn: ViewStyle;
  textInput: TextStyle;
  btn2: ViewStyle;
  content2: ViewStyle;
  headLine: ViewStyle;
  bottomView: ViewStyle;
  listItem2: ViewStyle;
  btn3: ViewStyle;
  btnText: ViewStyle;
  btnText2: ViewStyle;
  btnText3: ViewStyle;
  listItem: ViewStyle;
  logouttext: ViewStyle;
}
export const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: ' #E5E5E5;',
    alignItems: 'center',
  },
  flatlistview: {
    flex: 1,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  componentview: {
    width: getWidth(100),
    height: getHeight(100),
  },
  innerContainer: {
    alignItems: 'center',
    flex: 1,
  },
  largeview: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
  },

  text: {
    width: '80%',
    textAlign: 'center',
    color: '#888C93',
    // width: getWidth(60),
    // textAlign: 'center',
    fontFamily: 'Rubik-Regular',
  },
  textname: {
    alignSelf: 'center',
    fontWeight: '700',

    marginTop: 15,
  },
  box2: {
    backgroundColor: 'white',
    height: getHeight(12),
    width: getWidth(90),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: getHeight(5),
  },
  logo: {
    margin: getHeight(5),
    alignSelf: 'center',
    shadowColor: '#0e5469',
    shadowOffset: {
      width: 0,
      height: 30,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 0,
  },
  footerText: {
    color: '#032F3C',
    fontWeight: '600',
    fontSize: getFontSize(2.2),
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
    width: 20,
    height: 7,
    borderRadius: 5,
  },

  heading: {
    fontSize: getFontSize(2.8),
    lineHeight: 32,
    width: getWidth(65),
    margin: getHeight(3),
    textAlign: 'center',
    fontWeight: '500',
    color: '#032F3C',
    fontFamily: 'Rubik-Regular',
  },

  heading2: {
    fontSize: getFontSize(3),

    fontWeight: 'bold',
    color: '#032F3C',
    fontFamily: 'Rubik-Regular',
  },
  img: { width: 80, height: 80, alignSelf: 'center', borderRadius: 40 },
  box: {
    width: getWidth(30),
    height: getHeight(20),
    alignItems: 'center',
  },
  footer: {
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
    height: getHeight(7),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  textInput: {
    height: getHeight(7),
    margin: 10,
    width: getWidth(40),
    fontWeight: '700',
  },
  btn2: {
    backgroundColor: '#032F3C',

    width: getWidth(80),
    margin: 5,
    height: getHeight(7),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  content2: {
    backgroundColor: 'white',

    padding: 13,
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
    height: getHeight(45),
  },
  headLine: {
    height: 6,
    width: 55,
    borderRadius: 5,
    alignSelf: 'center',
    backgroundColor: '#EAEAEA',
    marginBottom: 5,
  },
  bottomView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  listItem2: {
    height: getHeight(7),
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn3: {
    backgroundColor: '#E7F0F3',
    flexDirection: 'row',
    width: getWidth(80),
    margin: 5,
    height: getHeight(7),
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 10,
  },
  btnText: { color: '#757575', fontSize: getFontSize(2.5) },
  btnText2: { color: 'white', fontSize: getFontSize(2.5) },
  btnText3: { color: '#4F6D77', fontSize: getFontSize(2.5) },
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
  logouttext: {
    fontSize: getFontSize(2.5),
    fontWeight: 'bold',
    color: '#032F3C',
  },
});
