import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  innerContainer: {
    flex: 1,
    marginTop: getHeight(1.5),
  },
  heading: {
    fontSize: getFontSize(2.5),
    fontWeight: '400',
    fontFamily: 'Rubik-Regular',
    color: '#032F3C',
  },
  logouttext: {
    fontSize: getFontSize(2.5),
    fontWeight: 'bold',
    color: '#032F3C',
  },

  text: { width: '80%', textAlign: 'center' },
  list: {
    height: getHeight(14),
    // borderBottomWidth: 0.3,
    borderBottomWidth: 0.3,
    borderBottomColor: '#BDC0C1',
    flexDirection: 'row',
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    paddingLeft: getWidth(10),
    paddingRight: getWidth(10),
    marginTop: 10,
    alignItems: 'center',
  },
  lists: {
    height: getHeight(10),
    borderBottomWidth: 0.3,
    // borderBottomColor: 'gray',
    flexDirection: 'row',
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    paddingLeft: getWidth(10),
    paddingRight: getWidth(10),
    // marginTop: 10,
    alignItems: 'center',
  },
  TextInput: {
    borderWidth: 1,
    height: getHeight(6),
    width: getWidth(80),
    borderRadius: 5,
  },

  btn: {
    backgroundColor: '#126B87',
    width: getWidth(80),
    margin: 5,
    height: getHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  btnText: { color: 'white', fontSize: getFontSize(2.5) },
});
