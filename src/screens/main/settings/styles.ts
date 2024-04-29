import { StyleSheet } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: {
    flex: 1,
    // marginTop: getHeight(1.5),
  },
  heading: {
    fontSize: getFontSize(2.5),
    fontWeight: '400',
    fontFamily: 'OpenSans-Regular',
  },
  logouttext: {
    fontSize: getFontSize(2.5),
    fontWeight: 'bold',
  },

  text: { width: '80%', textAlign: 'center' },
  list: {
    height: getHeight(12),
    // borderBottomWidth: 0.3,
    borderBottomWidth: 0.3,
    borderBottomColor: '#BDC0C1',
    flexDirection: 'row',

    justifyContent: 'space-between',
    paddingLeft: getWidth(10),
    paddingRight: getWidth(10),
    // marginTop: 10,
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

  settingsCard: {
    padding: spacing.x24,
    borderRadius: borderRadius.base,
    flex: 1,

    // justifyContent: 'center',
    // alignItems: 'center',
    marginVertical: spacing.x16,
  },
});
