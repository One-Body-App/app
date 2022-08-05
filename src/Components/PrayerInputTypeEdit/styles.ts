import { StyleSheet } from 'react-native';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';

export const styles = StyleSheet.create({
  requestModel: {
    opacity: 0.9,

    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
  },
  errortext: {
    color: 'red',
    left: 10,
    width: getWidth(78),
    fontSize: getFontSize(2),
  },
  sdview: {
    backgroundColor: 'red',
    width: 15,
    height: 15,
    borderRadius: 10,
  },
  upview: { padding: 5, flexDirection: 'row' },
  ModelInputView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'center',
    padding: 7,
    width: '98%',
    alignItems: 'center',
  },
  TextInput: {
    borderWidth: 1,
    borderRadius: 10,
    width: '82%',
    borderColor: '#C4C4C4',
    paddingLeft: 8,

    minHeight: getHeight(6),
    maxHeight: getHeight(16),
  },
  Button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: getWidth(15),
    borderRadius: 10,
    height: getHeight(7),
    backgroundColor: '#C4C4C4',
  },
  btn: {
    borderWidth: 1,
    borderColor: '#5B7279',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  btnSelected: {
    borderWidth: 1,
    borderColor: '#126B87',
    backgroundColor: '#126B87',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    borderRadius: 5,
  },
  prayerTypeView: {
    flexDirection: 'row',
    padding: 5,
    margin: 8,
    marginBottom: 0,
    width: '95%',
    alignSelf: 'center',
    borderRadius: 8,
    backgroundColor: 'white',

    justifyContent: 'space-around',
  },
});
