import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

const styles = StyleSheet.create({
  requestModel: {
    opacity: 0.9,

    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
  },
  errortect: {
    color: 'red',
    left: 10,
    width: getWidth(78),
    fontSize: getFontSize(2),
  },
  upview: {
    backgroundColor: 'red',
    width: 15,
    height: 15,
    borderRadius: 10,
  },
  nulview: { padding: 5, flexDirection: 'row' },
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
    paddingTop: '4%',
    width: '82%',
    borderColor: '#C4C4C4',
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: getHeight(6),
    maxHeight: getHeight(16),
  },
  Button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: getWidth(15),
    borderRadius: 10,
    height: getHeight(6),
    backgroundColor: '#12D2D9',
  },
  btn: {
    borderWidth: 1,
    borderColor: '#5B7279',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    marginHorizontal: getWidth(2),
    backgroundColor: 'white',
    borderRadius: 5,
  },
  btnSelected: {
    borderWidth: 1,
    borderColor: '#126B87',
    backgroundColor: '#126B87',
    marginHorizontal: getWidth(2),
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

export default styles;
