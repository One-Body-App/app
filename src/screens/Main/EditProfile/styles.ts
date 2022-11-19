import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  listItem: {
    height: getHeight(5),
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headview: {
    height: getHeight(8),

    flexDirection: 'row',
    backgroundColor: 'white',
    justifyContent: 'center',
    padding: 10,
    alignItems: 'center',
  },
  titletext: {
    fontSize: getFontSize(2.2),
    fontFamily: 'Rubik-Medium',
    color: '#032F3C',
  },
  bottomView: {
    justifyContent: 'flex-end',
    margin: 0,
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
  topContainer: {
    flexDirection: 'column',
    flex: 1,

    justifyContent: 'space-around',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getHeight(5),
  },
  InputsContainer: { marginTop: 5, marginHorizontal: 10 },
  text: { width: '80%', textAlign: 'center' },

  TextInput: { backgroundColor: 'white' },
  bottomContainer: {
    height: getHeight(35),

    justifyContent: 'space-around',
    alignItems: 'center',
  },
  center: { justifyContent: 'center', alignItems: 'center' },
  SocialText: {
    color: '#126B87',
    fontFamily: 'Rubik-Regular',
    fontSize: getFontSize(2.2),
    margin: 5,
    marginBottom: getHeight(2),
  },
  socialIcon: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: getWidth(50),
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
