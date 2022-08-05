import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { appColor } from '../../constants';

export const styles = StyleSheet.create({
  contanier: {
    flex: 1,
    paddingTop: getHeight(5),
    width: getWidth(100),
    backgroundColor: 'white',
    alignSelf: 'center',
  },
  icon: {
    alignSelf: 'center',
    marginTop: getHeight(1),
  },
  forgetStyle: {
    color: appColor.StatusBarColor,
  },
  forgotPassword: {
    alignSelf: 'center',
    marginTop: getHeight(1),
  },
  Errorview: { padding: 5, flexDirection: 'row', marginLeft: getWidth(10) },
  errortext: {
    color: 'red',
    fontSize: getFontSize(2),
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
  SocialView: {
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-between',
    width: getWidth(70),
  },
  socialContainer: {
    marginTop: getHeight(5),
    shadowColor: '#126BB7',
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
});
