import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  align: { marginHorizontal: 20, marginTop: '10%' },
  singerrorview1: { padding: 5, flexDirection: 'row' },
  singerrortext: {
    color: 'red',
    left: getWidth(3),
    width: getWidth(78),
    fontSize: getFontSize(2),
  },
  center: {
    marginTop: getHeight(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  alreadyAccountContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Rubik-Regular',
    color: '#032F3C',
    marginTop: 20,
  },
  helight: {
    color: '#126B87',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    bottom: 0,
    height: getHeight(10),
  },
  paragraph: {
    color: '#4F6D77',
    fontWeight: '400',
    fontFamily: 'Rubik-Regular',
    fontSize: 15.5,
    lineHeight: 20,
    marginTop: getHeight(0.5),
  },
  textButton: {
    color: '#304248',
    fontWeight: '400',
    fontStyle: 'italic',
    fontFamily: 'Rubik-Bold',
    fontSize: 15.5,
    lineHeight: 20,
    marginTop: getHeight(0.5),
    textDecorationLine: 'underline',
  },
  simpleText: {
    color: '#81979E',
    marginTop: 2,
    fontFamily: 'Rubik-Medium',
  },
  text: {
    marginTop: 2,
    fontFamily: 'Rubik-Medium',
  },
  btnText: {
    fontSize: getFontSize(1.8),

    fontFamily: 'Rubik-Medium',
  },
  btnSelected: {
    width: getWidth(42),
    height: getHeight(6),
    borderWidth: 1,

    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  btn: {
    borderColor: '#B3C1C5',
    borderWidth: 1,
    width: getWidth(42),

    height: getHeight(6),

    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },

  wrapper: {
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 0.8,
    borderColor: 'rgba(242, 242, 242, 0.5)',
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingTop: 7,
    paddingBottom: 10,
    fontSize: 20,
  },
  passwordStrengthWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  passwordStrengthBar: {
    height: 10,
    position: 'relative',
    // top: 5,
    // bottom: 5,
    borderRadius: 5,
    backgroundColor: 'red',
    // flex: 1,
    marginTop: 10,
    marginLeft: 5,
  },
  innerPasswordStrengthBar: {
    height: 10,
    borderRadius: 5,
    width: 0,
  },
  strengthDescription: {
    color: '#fff',
    backgroundColor: 'transparent',
    textAlign: 'right',
    position: 'absolute',
    right: 5,
    top: 1,
    fontSize: 14,
  },
});
