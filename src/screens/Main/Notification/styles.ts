import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

const styles = StyleSheet.create({
  background: { height: getHeight(100), width: getWidth(100) },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  card: {
    backgroundColor: 'white',

    elevation: 1.3,

    padding: getWidth(3),
  },
  backicon: {
    flexDirection: 'row',

    alignItems: 'center',
  },
  modelview: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  congrate: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setmodel: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    elevation: 4,
  },
  hideCard: {
    flexDirection: 'row',
    height: getHeight(13),
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 12,
    bottom: 30,
  },
  heading: {
    fontSize: getFontSize(2.3),
    padding: 5,
    color: '#032F3C',
    fontFamily: 'Rubik-Medium',
  },
  paragraph: {
    fontSize: getFontSize(2),
    fontFamily: 'Rubik-Regular',
    padding: 5,
    paddingVertical: 0,
    width: getWidth(69),
  },
  Iconbg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  Time: {
    padding: 5,
    fontSize: getFontSize(2),
  },
  sildeView: {
    height: getHeight(11.5),
    width: getWidth(17.5),
    backgroundColor: '#032F3C',
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bottomView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  content2: {
    backgroundColor: 'white',

    justifyContent: 'space-around',
    padding: 13,
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
    height: getHeight(50),
  },
  view: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: getFontSize(2.5),
    marginRight: 15,
  },
  modaltext: {
    fontSize: getFontSize(2),
    fontWeight: '700',
    marginTop: getHeight(1),
  },
  iconbackground: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    borderRadius: 25,
  },
  paragraph2: {
    fontSize: getFontSize(2.3),
  },

  btnView: {
    justifyContent: 'space-around',
    flexDirection: 'row',
  },
  textbtn: {
    fontSize: getFontSize(2.5),
    color: 'black',
  },
  modaltitle: {
    fontSize: getFontSize(2),
  },
  btnview: { flexDirection: 'row', justifyContent: 'space-around' },
  mybtn: {
    flexDirection: 'row',

    height: getHeight(6),
    width: getWidth(30),
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'white',
  },
  mybtnText: {
    color: 'white',
    fontSize: getFontSize(3),

    fontWeight: 'bold',
  },
  btn: {
    borderWidth: 1,

    height: getHeight(6),
    width: getWidth(30),

    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  btnText: {
    fontSize: getFontSize(3),

    fontWeight: 'bold',
  },
  Notificationmodal: {
    backgroundColor: 'white',
    alignSelf: 'center',
    justifyContent: 'space-around',
    height: getHeight(27),
    width: getHeight(38),
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5,
  },
  RowView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  active: {
    width: 10,
    height: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalok: {
    fontSize: getFontSize(2),
  },
});
export default styles;
