import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: {
    flex: 1,
    // marginTop: getHeight(5.5),
  },
  heading: {
    fontSize: getFontSize(2.2),
    fontWeight: '400',
    fontFamily: 'Rubik-Medium',
  },
  logouttext: {
    fontSize: getFontSize(2.5),
    fontWeight: 'bold',
  },

  text: { width: '80%', textAlign: 'center' },
  list: {
    height: getHeight(10),
    // borderBottomWidth: 0.3,
    borderBottomWidth: 0.3,
    borderBottomColor: '#ECF0F1',
    flexDirection: 'row',

    justifyContent: 'space-between',
    paddingLeft: getWidth(5),
    paddingRight: getWidth(5),
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
  point: {
    width: getWidth(2),
    height: getHeight(1),
    backgroundColor: 'red',
    borderRadius: 100,
    marginLeft: getHeight(2),
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
  buttonContainer: {
    backgroundColor: '#126B87',
    borderRadius: 5,
    paddingHorizontal: getWidth(4),
  },
});

export default styles;
