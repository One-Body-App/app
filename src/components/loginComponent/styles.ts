import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { appColor } from '../../constants';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    width: '100%',
  },
  Header: {
    fontSize: getFontSize(3),
    fontFamily: 'OpenSans-Bold',
    color: Colors.neutral?.[900] ?? '#032F3C',
    marginBottom: 16,
    textAlign: 'center',
  },
  contanier: {
    flex: 1,

    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: 50,
    borderRadius: 10,

    marginHorizontal: 20,
  },
  disabledButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    marginVertical: 10,
  },
  disabledBtnTextStyle: {
    fontSize: 18,
    fontWeight: '500',
    borderColor: '#F6F6F6',
    color: '#B3C1C5',
  },
  paragraph: {
    fontWeight: '400',
    fontFamily: 'OpenSans-Regular',
    fontSize: 15.5,
    lineHeight: 20,
    marginTop: getHeight(0.5),
  },
  textButton: {
    color: '#304248',
    fontWeight: '400',
    fontStyle: 'italic',
    fontFamily: 'OpenSans-Bold',
    fontSize: 15.5,
    lineHeight: 20,
    marginTop: getHeight(0.5),
    textDecorationLine: 'underline',
  },
  btn2: {
    backgroundColor: '#032F3C',
    width: getWidth(80),
    margin: 10,
    height: getHeight(7),
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  btn: {
    backgroundColor: '#032F3C',
    width: getWidth(80),
    margin: 10,
    height: getHeight(7),
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  btnText2: {
    color: 'white',
    fontSize: getFontSize(2),
    letterSpacing: 1,
    fontFamily: 'OpenSans-Medium',
  },
  btnTitle: {
    color: 'white',
    fontSize: getFontSize(2),
    letterSpacing: 1,
    fontFamily: 'OpenSans-Medium',
  },
  fieldError: {
    color: Colors.errorFeedback?.text ?? 'red',
    marginTop: getHeight(0.5),
    marginBottom: getHeight(1.5),
  },

  Errorview: {
    marginBottom: 25,
    flexDirection: 'row',
    padding: 11,
    borderRadius: borderRadius.base,
  },
  errortext: {
    color: 'red',
  },
  helight: {
    color: appColor.SecoundryColor,
    fontWeight: 'bold',
    marginTop: 8,
  },
  simpleText: {
    fontFamily: 'OpenSans-Medium',
    color: Colors.neutral?.[700] ?? '#304248',
    textAlign: 'center',
    marginBottom: 6,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 12,
  },
  successtext: {
    color: Colors.successFeedback.text,
    flex: 1,
  },
  orView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getHeight(2),
  },
  line: {
    borderWidth: 0.5,
    borderColor: '#595959',
    backgroundColor: '#595959',
    height: 1,
    alignSelf: 'center',
    width: '40%',
  },
  text: { fontSize: getFontSize(2.5), color: '#126B87', margin: 3 },

  socialContainer: {
    // marginTop: getHeight(5),
    justifyContent: 'center',
    alignContent: 'center',
    borderRadius: 5,
    height: getHeight(5),
    width: getWidth(20),
    shadowColor: '#126BB7',
    marginRight: 15,
    backgroundColor: '#FFF',
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  bottomView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  headLine: {
    height: 6,
    width: 55,
    borderRadius: 5,
    backgroundColor: '#EAEAEA',
    marginBottom: 5,
  },
  content2: {
    alignItems: 'center',
    padding: 13,
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
    // height: getHeight(70),
    flex: 1,
  },
});
