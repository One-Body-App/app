import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { appColor, COLORS } from '../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    marginVertical: 10,
  },
  disabledButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: 50,
    borderRadius: 10,
    marginVertical: 10,
    borderColor: '#F6F6F6',
    backgroundColor: '#F6F6F6',
  },
  btnIcon: {
    width: 24,
    height: 24,
    marginHorizontal: 10,
  },
  btnTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  disabledBtnTextStyle: {
    fontSize: 18,
    fontWeight: '500',
    borderColor: '#F6F6F6',
    color: '#B3C1C5',
  },
  buttonList: {
    marginHorizontal: 20,
    marginTop: 16,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    bottom: 0,
    height: getHeight(10),
  },
  helight: {
    color: '#126B87',
    fontWeight: 'bold',
  },
  center: {
    marginTop: getHeight(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#81979E',
    marginTop: 2,
    fontFamily: 'Rubik-Medium',
    underline: { textDecorationLine: 'underline' },
  },
  simpleText: {
    color: '#81979E',
    marginTop: 2,
    fontFamily: 'Rubik-Medium',
  },
  alreadyAccountContainer: {
    alignSelf: 'center',
    marginTop: 16,
    flexDirection: 'row',
  },
  Errorview: { padding: 5, flexDirection: 'row', marginLeft: getWidth(10) },
  errortext: {
    color: 'red',
    fontSize: getFontSize(2),
  },
});
