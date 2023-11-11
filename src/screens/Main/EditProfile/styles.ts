import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

export const styles = StyleSheet.create({
  inputGroup: {
    borderColor: Colors.neutral[800],
    borderWidth: borderWidth.base,
    borderRadius: borderRadius.base,
    padding: spacing.x16,
  },

  container: {
    flex: 1,
  },
  listItem: {
    height: getHeight(5),
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  titletext: {
    fontSize: getFontSize(2.2),
    // fontFamily: 'Rubik-Medium',
    // color: '#032F3C',
    textAlign: 'center',
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
    marginTop: getHeight(1),
  },

  text: { width: '80%', textAlign: 'center' },

  TextInput: { backgroundColor: 'white' },
  bottomContainer: {
    marginTop: 50,
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
