import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  wavebgimage: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  instagramtext: {
    fontSize: getFontSize(2.5),
    color: '#126B87',
    margin: 10,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  twetertext: {
    fontSize: getFontSize(2.5),
    color: '#126B87',
    marginBottom: 22,
    fontWeight: '500',

    textDecorationLine: 'underline',
  },
  formstepview: {
    justifyContent: 'space-around',
    alignItems: 'center',
    height: getHeight(30),
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    width: getWidth(93),
    height: getHeight(90),
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.53,
    shadowRadius: 13.97,

    elevation: 21,
  },
  header: {
    width: '100%',
    top: 40,
  },
  text: {
    width: '80%',
    textAlign: 'center',
    fontFamily: 'Rubik-Regular',
    color: '#888C93',
  },
  TextInput: {
    height: getHeight(5),
    // paddingLeft: 7,
    width: getWidth(75),
    borderRadius: 5,

    // margin: 10,
    borderColor: '#888C93',
  },
  errTxt: {
    // fontSize: getFontSize(2),
    color: 'red',
    marginBottom: 5,
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
    width: 25,
    height: 7,
    borderRadius: 5,
  },

  heading: {
    fontSize: getFontSize(2.9),
    textAlign: 'center',
    fontFamily: 'Rubik-Regular',

    color: '#032F3C',
  },
  foter: {
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
    height: getHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  btn2: {
    borderColor: '#F6F6F6',
    borderWidth: 1,
    width: getWidth(80),
    margin: 5,
    height: getHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  btnText: { color: 'white', fontSize: getFontSize(2.5) },
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
  btnTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
});
